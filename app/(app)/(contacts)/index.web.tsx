import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "expo-router";
import type { Href } from "expo-router";
import { App, Avatar, Button, Input, Tag, Tooltip, Typography, theme } from "antd";
import {
  AppstoreOutlined, FilterOutlined, MoreOutlined, PlusOutlined, SearchOutlined, UnorderedListOutlined,
} from "@ant-design/icons";
import { useAuthStore, useCan, useIsActiveAdmin } from "@/stores/authStore";
import DataTable from "@/components/modules/base/DataTable";
import { useEntityColumns, type ColumnOverride } from "@/hooks/core/useEntityColumns";
import i18n from "@/locale/i18n";
import ContactFormDrawer from "@/components/modules/contacts/ContactFormDrawer";
import { CONTACTS_URL, typeColor, typeLabel, type ContactRow, type ContactType } from "@/components/modules/contacts/shared";
import ViewSelect from "@/components/modules/views/ViewSelect";
import FilterPanel from "@/components/modules/views/FilterPanel";
import ViewDirtyBanner from "@/components/modules/views/ViewDirtyBanner";
import { useSavedViews } from "@/components/modules/views/useSavedViews";
import { useUiState } from "@/components/modules/views/useUiState";
import type { SaveViewMeta } from "@/components/modules/views/SaveViewModal";
import {
  canEditView, filtersEqual, viewToFilter,
  type FieldDef, type FilterValue, type SavedView,
} from "@/components/modules/views/types";

const ENTITY = "contact";

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";
}

type Applied = FilterValue & { pageSize: number };
const BASE_APPLIED: Applied = { match: "all", criteria: [], columns: [], ordering: "", pageSize: 20 };

function fromSaved(v: SavedView): Applied {
  return { ...viewToFilter(v), pageSize: v.page_size || 20 };
}

export default function ContactsPage() {
  const activeOrgId = useAuthStore((s) => s.activeOrgId);
  const userId = useAuthStore((s) => s.user?.id);
  const isAdmin = useIsActiveAdmin();
  const canCreate = useCan("contacts", "create");
  const { message } = App.useApp();
  const { token } = theme.useToken();
  const router = useRouter();

  const { views, fields, loading: viewsLoading, reload: reloadViews, createView, updateView, deleteView, setDefault, setFavorite } = useSavedViews(ENTITY);
  const uiState = useUiState(ENTITY);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [tick, setTick] = useState(0); // bump to refetch after a contact save

  const [active, setActive] = useState<SavedView | null>(null);
  const [applied, setApplied] = useState<Applied>(BASE_APPLIED);

  // All views (incl. built-ins) are SavedView rows now, so favorites are simply
  // the ids the backend marks is_favorite (per-user via UiState).
  const favoriteIds = useMemo(() => new Set(views.filter((v) => v.is_favorite).map((v) => v.id)), [views]);

  // Filter panel
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelSeed, setPanelSeed] = useState<FilterValue>(BASE_APPLIED);
  const [panelEditing, setPanelEditing] = useState<SavedView | null>(null);

  // Debounced server-side search.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // The seeded "All" built-in — fallback when nothing else is selected/resolved.
  const fallbackView = useCallback(
    () => views.find((v) => v.is_system && v.system_key === "all") ?? views.find((v) => v.is_system) ?? views[0] ?? null,
    [views],
  );

  // Select a view + persist the choice (and current applied filter) as UI state.
  const select = useCallback((v: SavedView, app: Applied) => {
    setActive(v);
    setApplied(app);
    uiState.save({ active_view: v.id, active_view_key: "", state: app }).catch(() => {});
  }, [uiState]);

  const selectView = useCallback((v: SavedView) => select(v, fromSaved(v)), [select]);

  // Restore last session (or default / All) once views have loaded.
  const restored = useRef(false);
  useEffect(() => {
    if (viewsLoading || restored.current || !views.length) return;
    restored.current = true;
    (async () => {
      const saved = await uiState.load().catch(() => null);
      const target =
        (saved?.active_view != null ? views.find((v) => v.id === saved.active_view) : undefined)
        ?? views.find((v) => v.is_default)
        ?? fallbackView();
      if (!target) return;
      setActive(target);
      // Overlay persisted ad-hoc filter state only when resuming that same view.
      const st = (saved?.active_view === target.id ? saved?.state : undefined) as Partial<Applied> | undefined;
      setApplied(st && Object.keys(st).length ? { ...fromSaved(target), ...st } : fromSaved(target));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewsLoading, views.length]);

  // Keep `active` pointing at the freshest row after any reload (e.g. a locale
  // switch re-localizes system names; an edit changes flags) — match by id.
  useEffect(() => {
    setActive((cur) => (cur ? views.find((v) => v.id === cur.id) ?? cur : cur));
  }, [views]);

  // ---- Filter panel actions ----
  const openPanel = () => {
    setPanelSeed({ match: applied.match, criteria: applied.criteria, columns: applied.columns, ordering: applied.ordering });
    setPanelEditing(active && !active.is_system ? active : null);
    setPanelOpen(true);
  };
  const openNewView = () => {
    setPanelSeed(BASE_APPLIED);
    setPanelEditing(null);
    setPanelOpen(true);
  };
  const openEditView = (v: SavedView) => {
    selectView(v);
    setPanelSeed(fromSaved(v));
    setPanelEditing(v);
    setPanelOpen(true);
  };

  const applyAdhoc = (v: FilterValue) => {
    if (active) select(active, { ...v, pageSize: applied.pageSize });
    setPanelOpen(false);
  };

  const saveAsView = async (v: FilterValue, meta: SaveViewMeta) => {
    try {
      // The modal collects an is_shared checkbox; the API field is `visibility`.
      const created = (await createView({
        ...v,
        name: meta.name,
        is_favorite: meta.is_favorite,
        visibility: meta.is_shared ? "shared" : "private",
      })) as SavedView;
      await reloadViews();
      selectView(created);
      message.success(i18n.t("views.saved", { defaultValue: "已保存视图" }));
    } catch (e) {
      message.error(i18n.t("contacts.saveFailed", { defaultValue: "保存失败，请重试" }));
      throw e; // keep the save modal / panel open so the user's input isn't lost
    }
  };

  const updateActiveView = async (v: FilterValue) => {
    if (!active || active.is_system) return;
    try {
      const updated = (await updateView(active.id, v)) as SavedView;
      await reloadViews();
      selectView(updated);
      setPanelOpen(false);
      message.success(i18n.t("views.updated", { defaultValue: "视图已更新" }));
    } catch {
      message.error(i18n.t("contacts.saveFailed", { defaultValue: "保存失败，请重试" }));
    }
  };

  const removeView = async (v: SavedView) => {
    try {
      await deleteView(v.id);
      if (active?.id === v.id) { const fb = fallbackView(); if (fb) selectView(fb); }
      await reloadViews();
    } catch {
      message.error(i18n.t("contacts.deleteFailed", { defaultValue: "删除失败" }));
    }
  };

  const makeDefault = async (v: SavedView) => {
    try { await setDefault(v.id); await reloadViews(); } catch { /* noop */ }
  };

  // Favorite/unfavorite is per-user (backend UiState); works for any view (incl. system).
  const toggleFavorite = (v: SavedView) => {
    setFavorite(v.id, !v.is_favorite).then(() => reloadViews()).catch(() => {});
  };

  // ---- Dirty state: applied filter diverges from the active view's definition ----
  const appliedFilter: FilterValue = { match: applied.match, criteria: applied.criteria, columns: applied.columns, ordering: applied.ordering };
  const isDirty = !!active && !filtersEqual(appliedFilter, viewToFilter(active));
  const canUpdateActive = !!active && !active.is_system && canEditView(active, isAdmin);
  const revertActive = () => { if (active) selectView(active); };

  // ---- Table params / columns ----
  const params = useMemo(() => {
    const out: Record<string, string> = {};
    if (applied.criteria.length) out.filter = JSON.stringify({ match: applied.match, criteria: applied.criteria });
    if (debouncedSearch) out.search = debouncedSearch;
    return out;
  }, [applied.match, applied.criteria, debouncedSearch]);

  // Columns come from the backend field schema (label/type/sortable/width); only
  // the domain cells (avatar name, colored type tag, raw currency code) override
  // the by-type default renderer. See docs/schema-driven-columns.md.
  const columnOverrides = useMemo<Record<string, ColumnOverride>>(() => ({
    name: {
      render: (v, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <Avatar size={30} style={{ background: typeColor((r as ContactRow).type) === "purple" ? "#722ed1" : token.colorPrimary, flexShrink: 0 }}>{initials(String(v ?? ""))}</Avatar>
          <Typography.Text strong ellipsis>{String(v ?? "")}</Typography.Text>
        </div>
      ),
    },
    type: { render: (v) => <Tag color={typeColor(v as ContactType)}>{typeLabel(v as ContactType)}</Tag> },
    currency: { render: (v) => (v ? String(v) : <Typography.Text type="secondary">—</Typography.Text>) },
  }), [token]);

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

  // Field labels (filter builder) now come straight from the schema (localized).
  const fieldLabel = useCallback((f: FieldDef) => f.label, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", background: token.colorBgContainer }}>
      <style>{`
        .contacts-bigin-toolbar .ant-input-affix-wrapper { height: 32px; border-radius: 18px; background: #f9fbfd; border-color: #d8e1e8; }
      `}</style>

      {/* Toolbar */}
      <div
        className="contacts-bigin-toolbar"
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          gap: 12, minHeight: 56, padding: "0 20px", borderBottom: `1px solid ${token.colorBorderSecondary}`, background: "#fff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <Tooltip title={i18n.t("common.filter", { defaultValue: "筛选" })}>
            <Button
              shape="circle" icon={<FilterOutlined />} onClick={openPanel}
              style={{ width: 32, height: 32, border: 0, background: applied.criteria.length ? "#1A73E8" : "#eaf2ff", color: applied.criteria.length ? "#fff" : token.colorPrimary, boxShadow: "none" }}
            />
          </Tooltip>
          <ViewSelect
            views={views}
            active={active}
            favorites={favoriteIds}
            onSelect={selectView}
            onNewView={openNewView}
            onEditView={openEditView}
            onDeleteView={removeView}
            onSetDefault={makeDefault}
            onToggleFavorite={toggleFavorite}
          />
          <Input
            allowClear
            prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
            placeholder={i18n.t("contacts.searchPlaceholder", { defaultValue: "搜索名称、邮箱或电话" })}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 280 }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", padding: 3, borderRadius: 18, background: "#f4f7f9" }}>
            <Button shape="circle" icon={<UnorderedListOutlined />} style={{ width: 28, height: 28, border: 0, background: "#dff0fb", color: "#2277a8", boxShadow: "none" }} />
            <Button shape="circle" icon={<AppstoreOutlined />} style={{ width: 28, height: 28, border: 0, background: "transparent", color: token.colorTextSecondary, boxShadow: "none" }} />
          </div>
          {canCreate && (
            <Button
              icon={<PlusOutlined />} onClick={() => setFormOpen(true)}
              style={{ height: 32, border: 0, borderRadius: 18, paddingInline: 18, background: token.colorPrimary, color: "#fff", fontWeight: 700, boxShadow: "none" }}
            >
              {i18n.t("contacts.new", { defaultValue: "新建联系人" })}
            </Button>
          )}
          <Button shape="circle" icon={<MoreOutlined />} style={{ width: 32, height: 32, border: 0, background: "#eaf2ff", color: token.colorPrimary, boxShadow: "none" }} />
        </div>
      </div>

      {/* The active view has unsaved tweaks (Zoho-style). System views can't be
          updated in place, so the banner offers save-as / revert only. */}
      {isDirty && active && (
        <ViewDirtyBanner
          viewName={active.name}
          canUpdate={canUpdateActive}
          onUpdate={() => updateActiveView(appliedFilter)}
          onSaveAs={openPanel}
          onRevert={revertActive}
        />
      )}

      <DataTable
        key={`${activeOrgId ?? "0"}-${applied.ordering}-${applied.pageSize}-${tick}`}
        endpoint={CONTACTS_URL}
        columns={visibleColumns}
        params={params}
        defaultOrdering={applied.ordering}
        defaultPageSize={applied.pageSize}
        widthStorageKey={`${ENTITY}:${userId ?? 0}:${activeOrgId ?? 0}`}
        selectable
        onRowClick={(r) => router.push(`/(app)/(contacts)/${r.id}` as Href)}
        renderSummary={(total) => (
          <span>{i18n.t("contacts.total", { defaultValue: "联系人总数" })} · <b style={{ color: token.colorText }}>{total}</b></span>
        )}
      />

      <FilterPanel
        open={panelOpen}
        fields={fields}
        labelFor={fieldLabel}
        allColumns={allColumnOptions}
        value={panelSeed}
        activeSavedView={panelEditing}
        onClose={() => setPanelOpen(false)}
        onApply={applyAdhoc}
        onSaveAs={saveAsView}
        onUpdate={updateActiveView}
      />

      <ContactFormDrawer
        open={formOpen}
        contact={null}
        onClose={() => setFormOpen(false)}
        onSaved={() => setTick((t) => t + 1)}
      />
    </div>
  );
}
