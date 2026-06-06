import { type ReactNode } from "react";
import { Button, Input, Space, Tooltip, theme } from "antd";
import { FilterOutlined, SearchOutlined } from "@ant-design/icons";
import i18n from "@/locale/i18n";
import DataTable from "@/components/modules/base/DataTable";
import type { ColumnOverride } from "@/hooks/core/useEntityColumns";
import ViewSelect from "./ViewSelect";
import FilterPanel from "./FilterPanel";
import ViewDirtyBanner from "./ViewDirtyBanner";
import { useListView } from "./useListView";

/** Handle passed to the entity-specific slots (actions / extras). */
export type ListViewApi = { refetch: () => void };

type Props = {
  entity: string;
  /** ViewSet base URL (e.g. "/api/contacts/contacts/"). */
  endpoint: string;
  /** Per-field cell overrides for the schema-driven columns (stable / memoized). */
  columnOverrides?: Record<string, ColumnOverride>;
  searchPlaceholder?: string;
  selectable?: boolean;
  onRowClick?: (record: Record<string, unknown>) => void;
  renderSummary?: (total: number) => ReactNode;
  /** Right-hand toolbar cluster — Create button, view toggles, overflow menu. */
  actions?: (api: ListViewApi) => ReactNode;
  /** Portals rendered alongside the list — form drawers, modals. */
  extras?: (api: ListViewApi) => ReactNode;
};

/**
 * Default shell for an entity list page: the Bigin-style toolbar (filter +
 * view picker + search), the unsaved-view banner, the server-driven table, and
 * the filter panel. All state lives in {@link useListView}; entity pages supply
 * only their cells, toolbar actions and drawers.
 */
export default function EntityListView({
  entity,
  endpoint,
  columnOverrides,
  searchPlaceholder,
  selectable = true,
  onRowClick,
  renderSummary,
  actions,
  extras,
}: Props) {
  const { token } = theme.useToken();
  const lv = useListView(entity, columnOverrides);
  const api: ListViewApi = { refetch: lv.refetch };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        background: token.colorBgContainer,
      }}
    >
      <style>{`
        .seacube-list-toolbar .ant-input-affix-wrapper { height: 32px; background: #f9fbfd; border-color: #d8e1e8; }
      `}</style>

      {/* Toolbar */}
      <div
        className="seacube-list-toolbar"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          minHeight: 56,
          padding: "0 20px",
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          background: "#fff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <Tooltip title={i18n.t("common.filter", { defaultValue: "筛选" })}>
            <Button
              shape="circle"
              icon={<FilterOutlined />}
              onClick={lv.openPanel}
              style={{
                width: 32,
                height: 32,
                border: 0,
                background: lv.applied.criteria.length ? "#1A73E8" : "#eaf2ff",
                color: lv.applied.criteria.length ? "#fff" : token.colorPrimary,
                boxShadow: "none",
              }}
            />
          </Tooltip>
          <ViewSelect
            views={lv.views}
            active={lv.active}
            favorites={lv.favoriteIds}
            onSelect={lv.selectView}
            onNewView={lv.openNewView}
            onEditView={lv.openEditView}
            onDeleteView={lv.removeView}
            onSetDefault={lv.makeDefault}
            onToggleFavorite={lv.toggleFavorite}
          />
          {/* Search pill: input rounded on the left, a flush blue button cap on
              the right. Explicit search — typing only updates the text; the query
              runs on Enter / the button. Clearing the box resets results. */}
          <Space.Compact>
            <Input
              allowClear
              placeholder={searchPlaceholder ?? i18n.t("common.search", { defaultValue: "搜索" })}
              value={lv.search}
              onChange={(e) => {
                lv.setSearch(e.target.value);
                if (e.target.value === "") lv.submitSearch("");
              }}
              onPressEnter={() => lv.submitSearch(lv.search)}
              style={{ width: 236, height: 32, borderRadius: "18px 0 0 18px" }}
            />
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={() => lv.submitSearch(lv.search)}
              style={{ width: 44, height: 32, borderRadius: "0 18px 18px 0", boxShadow: "none" }}
            />
          </Space.Compact>
        </div>

        {actions && <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{actions(api)}</div>}
      </div>

      {/* The active view has unsaved tweaks (Zoho-style). System views can't be
          updated in place, so the banner offers save-as / revert only. */}
      {lv.isDirty && lv.active && (
        <ViewDirtyBanner
          viewName={lv.active.name}
          canUpdate={lv.canUpdateActive}
          onUpdate={() => lv.updateActiveView(lv.appliedFilter)}
          onSaveAs={lv.openPanel}
          onRevert={lv.revertActive}
        />
      )}

      {lv.hydrated && (
        <DataTable
          key={lv.tableKey}
          endpoint={endpoint}
          columns={lv.visibleColumns}
          params={lv.params}
          defaultOrdering={lv.applied.ordering}
          defaultPageSize={lv.applied.pageSize}
          widthStorageKey={lv.widthStorageKey}
          selectable={selectable}
          onReorderColumns={lv.reorderColumns}
          onSortChange={lv.setSort}
          onFilterColumn={lv.openColumnFilter}
          onRemoveColumn={lv.removeColumn}
          onRowClick={onRowClick}
          renderSummary={renderSummary}
        />
      )}

      <FilterPanel
        open={lv.panelOpen}
        fields={lv.fields}
        labelFor={lv.fieldLabel}
        allColumns={lv.allColumnOptions}
        value={lv.panelSeed}
        activeSavedView={lv.panelEditing}
        onClose={lv.closePanel}
        onApply={lv.applyAdhoc}
        onSaveAs={lv.saveAsView}
        onUpdate={lv.updateActiveView}
      />

      {extras?.(api)}
    </div>
  );
}
