import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "expo-router";
import type { Href } from "expo-router";
import { App, Avatar, Button, Input, Tag, Tooltip, Typography, theme } from "antd";
import {
  AppstoreOutlined, FilterOutlined, MoreOutlined, PlusOutlined, SearchOutlined, UnorderedListOutlined,
} from "@ant-design/icons";
import { useAuthStore, useCan, useIsActiveAdmin } from "@/stores/authStore";
import { useLocaleStore } from "@/stores/localeStore";
import DataTable from "@/components/modules/base/DataTable";
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
  type ActiveView, type FieldDef, type FilterValue, type SavedView, type SystemView,
} from "@/components/modules/views/types";

const ENTITY = "contact";

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";
}

type Applied = FilterValue & { pageSize: number };
const BASE_APPLIED: Applied = { match: "all", criteria: [], columns: [], ordering: "name", pageSize: 20 };

function fromSaved(v: SavedView): Applied {
  return { ...viewToFilter(v), pageSize: v.page_size || 20 };
}

export default function ContactsPage() {
  const locale = useLocaleStore((s) => s.locale);
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

  const systemViews = useMemo<SystemView[]>(() => [
    { key: "all", name: i18n.t("contacts.allContacts", { defaultValue: "全部联系人" }), match: "all", criteria: [] },
    { key: "customers", name: typeLabel("CUSTOMER"), match: "all", criteria: [{ field: "type", operator: "is", value: "CUSTOMER" }] },
    { key: "vendors", name: typeLabel("VENDOR"), match: "all", criteria: [{ field: "type", operator: "is", value: "VENDOR" }] },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [locale]);

  const [active, setActive] = useState<ActiveView>(() => ({ kind: "system", view: systemViews[0] }));
  const [applied, setApplied] = useState<Applied>(BASE_APPLIED);

  // Filter panel
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelSeed, setPanelSeed] = useState<FilterValue>(BASE_APPLIED);
  const [panelEditing, setPanelEditing] = useState<SavedView | null>(null);

  // Debounced server-side search.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Select a view (system or saved) + persist the choice as UI state.
  const select = useCallback((next: ActiveView, app: Applied) => {
    setActive(next);
    setApplied(app);
    uiState.save({
      active_view: next.kind === "saved" ? next.view.id : null,
      active_view_key: next.kind === "system" ? next.view.key : "",
      state: app,
    }).catch(() => {});
  }, [uiState]);

  const selectSystem = useCallback((v: SystemView) =>
    select({ kind: "system", view: v }, { ...BASE_APPLIED, match: v.match, criteria: v.criteria }), [select]);
  const selectSaved = useCallback((v: SavedView) =>
    select({ kind: "saved", view: v }, fromSaved(v)), [select]);

  // Restore last session (or default view) once views have loaded.
  const restored = useRef(false);
  useEffect(() => {
    if (viewsLoading || restored.current) return;
    restored.current = true;
    (async () => {
      const saved = await uiState.load().catch(() => null);
      if (saved) {
        if (saved.active_view != null) {
          const v = views.find((x) => x.id === saved.active_view);
          if (v) { setActive({ kind: "saved", view: v }); setApplied(fromSaved(v)); return; }
        }
        // A system view supplies the base filter; persisted ad-hoc state (if any)
        // overlays it. BASE_APPLIED already carries match/criteria/ordering.
        const sys = systemViews.find((s) => s.key === saved.active_view_key);
        const st = (saved.state as Partial<Applied>) ?? {};
        if (sys || st.criteria || st.ordering) {
          const base = sys ? { ...BASE_APPLIED, match: sys.match, criteria: sys.criteria } : BASE_APPLIED;
          setActive(sys ? { kind: "system", view: sys } : active);
          setApplied({ ...base, ...st });
          return;
        }
      }
      const def = views.find((v) => v.is_default);
      if (def) { setActive({ kind: "saved", view: def }); setApplied(fromSaved(def)); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewsLoading]);

  // ---- Filter panel actions ----
  const openPanel = () => {
    setPanelSeed({ match: applied.match, criteria: applied.criteria, columns: applied.columns, ordering: applied.ordering });
    setPanelEditing(active.kind === "saved" ? active.view : null);
    setPanelOpen(true);
  };
  const openNewView = () => {
    setPanelSeed(BASE_APPLIED);
    setPanelEditing(null);
    setPanelOpen(true);
  };
  const openEditView = (v: SavedView) => {
    selectSaved(v);
    setPanelSeed(fromSaved(v));
    setPanelEditing(v);
    setPanelOpen(true);
  };

  const applyAdhoc = (v: FilterValue) => {
    select(active, { ...v, pageSize: applied.pageSize });
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
      selectSaved(created);
      message.success(i18n.t("views.saved", { defaultValue: "已保存视图" }));
    } catch (e) {
      message.error(i18n.t("contacts.saveFailed", { defaultValue: "保存失败，请重试" }));
      throw e; // keep the save modal / panel open so the user's input isn't lost
    }
  };

  const updateActiveView = async (v: FilterValue) => {
    if (active.kind !== "saved") return;
    try {
      const updated = (await updateView(active.view.id, v)) as SavedView;
      await reloadViews();
      selectSaved(updated);
      setPanelOpen(false);
      message.success(i18n.t("views.updated", { defaultValue: "视图已更新" }));
    } catch {
      message.error(i18n.t("contacts.saveFailed", { defaultValue: "保存失败，请重试" }));
    }
  };

  const removeView = async (v: SavedView) => {
    try {
      await deleteView(v.id);
      if (active.kind === "saved" && active.view.id === v.id) selectSystem(systemViews[0]);
      await reloadViews();
    } catch {
      message.error(i18n.t("contacts.deleteFailed", { defaultValue: "删除失败" }));
    }
  };

  const makeDefault = async (v: SavedView) => {
    try { await setDefault(v.id); await reloadViews(); } catch { /* noop */ }
  };

  const toggleFavorite = async (v: SavedView) => {
    try { await setFavorite(v.id, !v.is_favorite); await reloadViews(); } catch { /* noop */ }
  };

  // ---- Dirty state: applied filter diverges from the active saved view's definition ----
  const appliedFilter: FilterValue = { match: applied.match, criteria: applied.criteria, columns: applied.columns, ordering: applied.ordering };
  const isDirty = active.kind === "saved" && !filtersEqual(appliedFilter, viewToFilter(active.view));
  const canUpdateActive = active.kind === "saved" && canEditView(active.view, isAdmin);
  const revertActive = () => { if (active.kind === "saved") selectSaved(active.view); };

  // ---- Table params / columns ----
  const params = useMemo(() => {
    const out: Record<string, string> = {};
    if (applied.criteria.length) out.filter = JSON.stringify({ match: applied.match, criteria: applied.criteria });
    if (debouncedSearch) out.search = debouncedSearch;
    return out;
  }, [applied.match, applied.criteria, debouncedSearch]);

  const baseColumns = useMemo(
    () => [
      {
        title: i18n.t("contacts.name", { defaultValue: "名称" }), dataIndex: "name", key: "name", width: 260, ellipsis: true, sorter: true,
        render: (v: string, r: ContactRow) => (
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <Avatar size={30} style={{ background: typeColor(r.type) === "purple" ? "#722ed1" : token.colorPrimary, flexShrink: 0 }}>{initials(v)}</Avatar>
            <Typography.Text strong ellipsis>{v}</Typography.Text>
          </div>
        ),
      },
      { title: i18n.t("contacts.type", { defaultValue: "类型" }), dataIndex: "type", key: "type", width: 150, sorter: true,
        render: (t: ContactType) => <Tag color={typeColor(t)}>{typeLabel(t)}</Tag> },
      { title: i18n.t("contacts.email", { defaultValue: "邮箱" }), dataIndex: "email", key: "email", width: 260, ellipsis: true, sorter: true,
        render: (v: string) => v || <Typography.Text type="secondary">—</Typography.Text> },
      { title: i18n.t("contacts.phone", { defaultValue: "电话" }), dataIndex: "phone", key: "phone", width: 170, ellipsis: true, sorter: true,
        render: (v: string) => v || <Typography.Text type="secondary">—</Typography.Text> },
      { title: i18n.t("contacts.currency", { defaultValue: "币种" }), dataIndex: "currency", key: "currency", width: 110, sorter: true },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale, token],
  );

  const allColumnOptions = useMemo(
    () => baseColumns.map((c) => ({ key: String(c.key), label: String(c.title) })),
    [baseColumns],
  );

  const visibleColumns = useMemo(() => {
    if (!applied.columns.length) return baseColumns;
    const byKey = new Map(baseColumns.map((c) => [String(c.key), c]));
    return applied.columns.map((k) => byKey.get(k)).filter(Boolean) as typeof baseColumns;
  }, [baseColumns, applied.columns]);

  const fieldLabel = useCallback((f: FieldDef) => {
    const m: Record<string, string> = {
      name: i18n.t("contacts.name", { defaultValue: "名称" }),
      type: i18n.t("contacts.type", { defaultValue: "类型" }),
      email: i18n.t("contacts.email", { defaultValue: "邮箱" }),
      phone: i18n.t("contacts.phone", { defaultValue: "电话" }),
      currency: i18n.t("contacts.currency", { defaultValue: "币种" }),
      payment_terms: i18n.t("contacts.paymentTerms", { defaultValue: "付款账期（天）" }),
      created_at: i18n.t("contacts.created", { defaultValue: "创建时间" }),
    };
    return m[f.name] ?? f.label;
  }, []);

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
            systemViews={systemViews}
            views={views}
            active={active}
            onSelectSystem={selectSystem}
            onSelectSaved={selectSaved}
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

      {/* The active saved view has unsaved tweaks (Zoho-style). */}
      {isDirty && active.kind === "saved" && (
        <ViewDirtyBanner
          viewName={active.view.name}
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
