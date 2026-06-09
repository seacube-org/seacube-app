import { useState } from "react";
import { Button, Dropdown, theme, Tooltip } from "antd";
import type { MenuProps } from "antd";
import {
  ColumnWidthOutlined,
  ExportOutlined,
  HistoryOutlined,
  MoreOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import i18n from "@/locale/i18n";
import { useCan } from "@/stores/authStore";
import ExportDialog from "./ExportDialog";
import ExportHistoryDrawer from "./ExportHistoryDrawer";

type Props = {
  endpoint: string;
  entity: string;
  /** Permission module key (e.g. "contacts") — gates the export entries. */
  moduleKey: string;
  /** Current-view query for export (columns + filter/search/ordering). */
  exportParams: Record<string, string>;
  onRefresh: () => void;
  onResetWidths: () => void;
};

/** Shared list "..." overflow menu — Export (current view) / 导出历史 / Refresh / Reset widths. */
export default function ListActionsMenu({ endpoint, entity, moduleKey, exportParams, onRefresh, onResetWidths }: Props) {
  const { token } = theme.useToken();
  const [exportOpen, setExportOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [open, setOpen] = useState(false);
  // Export + history are hidden for users without the module's 'export' action —
  // mirrors the backend, which gates the export endpoint (and history) on 'export'.
  const canExport = useCan(moduleKey, "export");

  const items = [
    canExport && { key: "export", icon: <ExportOutlined />, label: i18n.t("listMenu.export", { defaultValue: "导出" }) },
    canExport && {
      key: "history",
      icon: <HistoryOutlined />,
      label: i18n.t("listMenu.exportHistory", { defaultValue: "导出历史" }),
    },
    canExport && { type: "divider" },
    { key: "refresh", icon: <ReloadOutlined />, label: i18n.t("listMenu.refresh", { defaultValue: "刷新列表" }) },
    { key: "reset", icon: <ColumnWidthOutlined />, label: i18n.t("listMenu.resetWidths", { defaultValue: "重置列宽" }) },
  ].filter(Boolean) as NonNullable<MenuProps["items"]>;

  const onClick: MenuProps["onClick"] = ({ key }) => {
    if (key === "export") setExportOpen(true);
    else if (key === "history") setHistoryOpen(true);
    else if (key === "refresh") onRefresh();
    else if (key === "reset") onResetWidths();
  };

  return (
    <>
      {/* Light-blue chip matching the toolbar's filter button; deepens on hover /
          when open for feedback. The popup gets a rounded card + soft shadow,
          roomy items, muted icons and a blue hover. */}
      <style>{`
        .seacube-list-menu-btn {
          background: #eaf2ff !important;
          border-color: transparent !important;
          color: ${token.colorPrimary} !important;
        }
        .seacube-list-menu-btn:hover,
        .seacube-list-menu-btn.is-open {
          background: #1A73E8 !important;
          color: #fff !important;
        }
        .seacube-list-menu-pop .ant-dropdown-menu {
          min-width: 184px;
          padding: 6px;
          border-radius: 10px;
          box-shadow: 0 6px 24px rgba(15, 30, 60, 0.12);
        }
        .seacube-list-menu-pop .ant-dropdown-menu-item {
          padding: 7px 12px !important;
          border-radius: 7px;
          font-size: 13px;
          color: #344054;
        }
        .seacube-list-menu-pop .ant-dropdown-menu-item .ant-dropdown-menu-item-icon {
          font-size: 15px;
          min-width: 16px;
          color: #6b7a90;
          margin-inline-end: 10px;
        }
        .seacube-list-menu-pop .ant-dropdown-menu-item:hover {
          background: #eef5ff !important;
          color: ${token.colorPrimary};
        }
        .seacube-list-menu-pop .ant-dropdown-menu-item:hover .ant-dropdown-menu-item-icon {
          color: ${token.colorPrimary};
        }
        .seacube-list-menu-pop .ant-dropdown-menu-item-divider {
          margin: 5px 8px;
          background: #eef1f5;
        }
      `}</style>
      <Dropdown
        menu={{ items, onClick }}
        trigger={["click"]}
        placement="bottomRight"
        onOpenChange={setOpen}
        rootClassName="seacube-list-menu-pop"
      >
        <Tooltip title={i18n.t("listMenu.more", { defaultValue: "更多" })} open={open ? false : undefined}>
          <Button
            shape="circle"
            icon={<MoreOutlined />}
            className={`seacube-list-menu-btn${open ? " is-open" : ""}`}
            style={{ width: 32, height: 32, boxShadow: "none" }}
          />
        </Tooltip>
      </Dropdown>
      {/* Only mounted when the export entries are reachable — keeps the export
          dialog/history drawer out of the tree entirely for non-exporters. */}
      {canExport && (
        <>
          <ExportDialog
            open={exportOpen}
            onClose={() => setExportOpen(false)}
            endpoint={endpoint}
            exportParams={exportParams}
          />
          <ExportHistoryDrawer open={historyOpen} onClose={() => setHistoryOpen(false)} entity={entity} />
        </>
      )}
    </>
  );
}
