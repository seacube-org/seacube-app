import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { App } from "antd";
import { useAuthStore, useIsActiveAdmin } from "@/stores/authStore";
import { useEntityColumns, type ColumnOverride } from "@/hooks/core/useEntityColumns";
import i18n from "@/locale/i18n";
import { saveColumnWidths } from "@/utils/tableWidths";
import { useSavedViews } from "./useSavedViews";
import { useUiState } from "./useUiState";
import type { SaveViewMeta } from "./SaveViewModal";
import {
  canEditView,
  filtersEqual,
  viewToFilter,
  type FieldDef,
  type FilterValue,
  type SavedView,
  type Visibility,
} from "./types";

/** Applied filter + the page size (page size isn't part of the filter shape). */
export type Applied = FilterValue & { pageSize: number };

const BASE_APPLIED: Applied = { match: "all", criteria: [], columns: [], ordering: "", pageSize: 20 };
const NO_OVERRIDES: Record<string, ColumnOverride> = {};

const fromSaved = (v: SavedView): Applied => ({ ...viewToFilter(v), pageSize: v.page_size || 20 });

/**
 * The full list-page state machine for one entity: saved views + filter schema,
 * resume-where-you-left-off hydration, the filter panel, dirty detection against
 * the active view, server query params (filter + search), and the schema-driven
 * columns. UI-agnostic — render it however; <EntityListView> is the default shell.
 *
 * `columnOverrides` must be referentially stable (wrap in useMemo) — it feeds the
 * column memo.
 */
export function useListView(entity: string, columnOverrides: Record<string, ColumnOverride> = NO_OVERRIDES) {
  const activeOrgId = useAuthStore((s) => s.activeOrgId);
  const userId = useAuthStore((s) => s.user?.id);
  const isAdmin = useIsActiveAdmin();
  const { message } = App.useApp();

  const {
    views,
    fields,
    loading: viewsLoading,
    reload: reloadViews,
    createView,
    updateView,
    deleteView,
    setDefault,
    setFavorite,
  } = useSavedViews(entity);
  const uiState = useUiState(entity);

  // Search is explicit (commit on Enter / search button), not as-you-type:
  // `search` is the input text, `submittedSearch` is the committed query.
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const submitSearch = useCallback((value: string) => setSubmittedSearch(value.trim()), []);
  const [tick, setTick] = useState(0); // bump to refetch the table (e.g. after a save)
  const refetch = useCallback(() => setTick((t) => t + 1), []);

  const [active, setActive] = useState<SavedView | null>(null);
  const [applied, setApplied] = useState<Applied>(BASE_APPLIED);

  // All views (incl. built-ins) are SavedView rows, so favorites are simply the
  // ids the backend marks is_favorite (per-user via UiState).
  const favoriteIds = useMemo(() => new Set(views.filter((v) => v.is_favorite).map((v) => v.id)), [views]);

  // Filter panel
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelSeed, setPanelSeed] = useState<FilterValue>(BASE_APPLIED);
  const [panelEditing, setPanelEditing] = useState<SavedView | null>(null);

  // The seeded "All" built-in — fallback when nothing else is selected/resolved.
  const fallbackView = useCallback(
    () =>
      views.find((v) => v.is_system && v.system_key === "all") ?? views.find((v) => v.is_system) ?? views[0] ?? null,
    [views],
  );

  // Select a view + persist the choice (and current applied filter) as UI state.
  const select = useCallback(
    (v: SavedView, app: Applied) => {
      setActive(v);
      setApplied(app);
      uiState.save({ active_view: v.id, active_view_key: "", state: app }).catch(() => {});
    },
    [uiState],
  );

  const selectView = useCallback((v: SavedView) => select(v, fromSaved(v)), [select]);

  // Patch the active view's working filter (ad-hoc tweak: sort, columns, etc.).
  // Re-selects the active view so the change persists and marks it dirty.
  const patchApplied = useCallback(
    (patch: Partial<Applied>) => {
      if (active) select(active, { ...applied, ...patch });
    },
    [active, applied, select],
  );

  // Restore last session (or default / All) once views have loaded. `hydrated`
  // gates the table so it mounts with the resolved view's filter already in place
  // — otherwise it fetches once unfiltered, then again after restore.
  const [hydrated, setHydrated] = useState(false);
  const restored = useRef(false);
  useEffect(() => {
    if (viewsLoading || restored.current) return;
    restored.current = true;
    (async () => {
      if (views.length) {
        const saved = await uiState.load().catch(() => null);
        const target =
          (saved?.active_view != null ? views.find((v) => v.id === saved.active_view) : undefined) ??
          views.find((v) => v.is_default) ??
          fallbackView();
        if (target) {
          setActive(target);
          // Overlay persisted ad-hoc filter state only when resuming that same view.
          const st = (saved?.active_view === target.id ? saved?.state : undefined) as Partial<Applied> | undefined;
          setApplied(st && Object.keys(st).length ? { ...fromSaved(target), ...st } : fromSaved(target));
        }
      }
      setHydrated(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewsLoading, views.length]);

  // Keep `active` pointing at the freshest row after any reload (e.g. a locale
  // switch re-localizes system names; an edit changes flags) — match by id.
  useEffect(() => {
    setActive((cur) => (cur ? (views.find((v) => v.id === cur.id) ?? cur) : cur));
  }, [views]);

  // ---- Filter panel actions ----
  const openPanel = useCallback(() => {
    setPanelSeed({
      match: applied.match,
      criteria: applied.criteria,
      columns: applied.columns,
      ordering: applied.ordering,
    });
    setPanelEditing(active && !active.is_system ? active : null);
    setPanelOpen(true);
  }, [applied, active]);
  const openNewView = useCallback(() => {
    setPanelSeed(BASE_APPLIED);
    setPanelEditing(null);
    setPanelOpen(true);
  }, []);
  const openEditView = useCallback(
    (v: SavedView) => {
      selectView(v);
      setPanelSeed(fromSaved(v));
      setPanelEditing(v);
      setPanelOpen(true);
    },
    [selectView],
  );
  const closePanel = useCallback(() => setPanelOpen(false), []);

  const applyAdhoc = useCallback(
    (v: FilterValue) => {
      patchApplied(v); // v carries match/criteria/columns/ordering; pageSize is kept
      setPanelOpen(false);
    },
    [patchApplied],
  );

  // Header drag-reorder / sort are ad-hoc tweaks: update the working filter so it
  // marks the view dirty (the banner offers update/save-as). Sort is view-level,
  // consistent with the FilterPanel's sort section.
  const reorderColumns = useCallback((columns: string[]) => patchApplied({ columns }), [patchApplied]);
  const setSort = useCallback((ordering: string) => patchApplied({ ordering }), [patchApplied]);

  const saveAsView = useCallback(
    async (v: FilterValue, meta: SaveViewMeta) => {
      try {
        // Visibility (private/shared) is chosen in the panel's Visibility section.
        const created = (await createView({
          ...v,
          name: meta.name,
          is_favorite: meta.is_favorite,
          visibility: meta.visibility,
        })) as SavedView;
        await reloadViews();
        selectView(created);
        message.success(i18n.t("views.saved", { defaultValue: "已保存视图" }));
      } catch (e) {
        message.error(i18n.t("views.saveFailed", { defaultValue: "保存失败，请重试" }));
        throw e; // keep the save modal / panel open so the user's input isn't lost
      }
    },
    [createView, reloadViews, selectView, message],
  );

  const updateActiveView = useCallback(
    async (v: FilterValue, visibility?: Visibility) => {
      if (!active || active.is_system) return;
      try {
        // visibility is sent only from the panel (the dirty banner keeps the existing one).
        const updated = (await updateView(active.id, visibility ? { ...v, visibility } : v)) as SavedView;
        await reloadViews();
        selectView(updated);
        setPanelOpen(false);
        message.success(i18n.t("views.updated", { defaultValue: "视图已更新" }));
      } catch {
        message.error(i18n.t("views.saveFailed", { defaultValue: "保存失败，请重试" }));
      }
    },
    [active, updateView, reloadViews, selectView, message],
  );

  const removeView = useCallback(
    async (v: SavedView) => {
      try {
        await deleteView(v.id);
        if (active?.id === v.id) {
          const fb = fallbackView();
          if (fb) selectView(fb);
        }
        await reloadViews();
      } catch {
        message.error(i18n.t("views.deleteFailed", { defaultValue: "删除失败" }));
      }
    },
    [deleteView, active, fallbackView, selectView, reloadViews, message],
  );

  const makeDefault = useCallback(
    async (v: SavedView) => {
      try {
        await setDefault(v.id);
        await reloadViews();
      } catch {
        /* noop */
      }
    },
    [setDefault, reloadViews],
  );

  // Favorite/unfavorite is per-user (backend UiState); works for any view (incl. system).
  const toggleFavorite = useCallback(
    (v: SavedView) => {
      setFavorite(v.id, !v.is_favorite)
        .then(() => reloadViews())
        .catch(() => {});
    },
    [setFavorite, reloadViews],
  );

  // ---- Dirty state: applied filter diverges from the active view's definition ----
  const appliedFilter = useMemo<FilterValue>(
    () => ({ match: applied.match, criteria: applied.criteria, columns: applied.columns, ordering: applied.ordering }),
    [applied],
  );
  const isDirty = !!active && !filtersEqual(appliedFilter, viewToFilter(active));
  const canUpdateActive = !!active && !active.is_system && canEditView(active, isAdmin);
  const revertActive = useCallback(() => {
    if (active) selectView(active);
  }, [active, selectView]);

  // ---- Table params / columns ----
  const params = useMemo(() => {
    const out: Record<string, string> = {};
    if (applied.criteria.length) out.filter = JSON.stringify({ match: applied.match, criteria: applied.criteria });
    if (submittedSearch) out.search = submittedSearch;
    return out;
  }, [applied.match, applied.criteria, submittedSearch]);

  const allColumns = useEntityColumns(fields, columnOverrides);
  const allColumnOptions = useMemo(
    () => fields.filter((f) => f.listable !== false).map((f) => ({ key: f.name, label: f.label })),
    [fields],
  );
  const visibleColumns = useMemo(() => {
    if (!applied.columns.length) return allColumns;
    const byKey = new Map(allColumns.map((c) => [String(c.key), c]));
    return applied.columns.map((k) => byKey.get(k)).filter(Boolean) as typeof allColumns;
  }, [allColumns, applied.columns]);

  // Field labels (filter builder) come straight from the schema (localized).
  const fieldLabel = useCallback((f: FieldDef) => f.label, []);

  // Header-menu "Filter": open the panel pre-seeded with a new criterion on this
  // column (uses the field's first operator, awaiting a value).
  const openColumnFilter = useCallback(
    (field: string) => {
      const fdef = fields.find((f) => f.name === field);
      setPanelSeed({
        match: applied.match,
        criteria: [...applied.criteria, { field, operator: fdef?.operators[0]?.value ?? "", value: null }],
        columns: applied.columns,
        ordering: applied.ordering,
      });
      setPanelEditing(active && !active.is_system ? active : null);
      setPanelOpen(true);
    },
    [fields, applied, active],
  );

  // Header-menu "Remove": drop the column from the working set (marks dirty).
  const removeColumn = useCallback(
    (key: string) => {
      const current = applied.columns.length ? applied.columns : allColumnOptions.map((o) => o.key);
      const next = current.filter((k) => k !== key);
      // Never remove the last column: an empty `columns` array is the "show all"
      // sentinel, so it would otherwise restore every column instead of hiding one.
      if (next.length) patchApplied({ columns: next });
    },
    [patchApplied, applied.columns, allColumnOptions],
  );

  // Sort is view-level (controlled), so the table doesn't remount on sort; it
  // only remounts on org switch / page-size / refetch. Widths persist per user+org.
  const tableKey = `${activeOrgId ?? "0"}-${applied.pageSize}-${tick}`;
  const widthStorageKey = `${entity}:${userId ?? 0}:${activeOrgId ?? 0}`;

  // Clear the stored per-column widths and remount the table (via tick → tableKey)
  // so it re-hydrates to the schema's default widths.
  const resetWidths = useCallback(() => {
    saveColumnWidths(widthStorageKey, {});
    setTick((t) => t + 1);
  }, [widthStorageKey]);

  return {
    // schema + views
    fields,
    views,
    favoriteIds,
    active,
    applied,
    hydrated,
    visibleColumns,
    allColumnOptions,
    fieldLabel,
    // search (explicit: setSearch updates the text, submitSearch runs it)
    search,
    setSearch,
    submitSearch,
    // table
    params,
    tableKey,
    widthStorageKey,
    refetch,
    resetWidths,
    // dirty
    isDirty,
    canUpdateActive,
    appliedFilter,
    // view-select actions
    selectView,
    openNewView,
    openEditView,
    removeView,
    makeDefault,
    toggleFavorite,
    revertActive,
    // filter panel
    panelOpen,
    panelSeed,
    panelEditing,
    openPanel,
    closePanel,
    applyAdhoc,
    saveAsView,
    updateActiveView,
    // column actions (drag-reorder, header menu)
    reorderColumns,
    setSort,
    openColumnFilter,
    removeColumn,
  };
}

export type ListView = ReturnType<typeof useListView>;
