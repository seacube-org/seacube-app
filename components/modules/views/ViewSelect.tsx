import { useState, type ReactNode } from "react";
import { Dropdown, Button, Input, Popconfirm, theme } from "antd";
import {
  DownOutlined,
  StarFilled,
  StarOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  PushpinOutlined,
  PushpinFilled,
  SearchOutlined,
} from "@ant-design/icons";
import i18n from "@/locale/i18n";
import type { SavedView } from "./types";

const FAV_COLOR = "#22c55e";

type Props = {
  views: SavedView[];
  active: SavedView | null;
  /** Favorited view ids — per-user, from the backend (UiState). */
  favorites: Set<number>;
  onSelect: (v: SavedView) => void;
  onNewView: () => void;
  onEditView: (v: SavedView) => void;
  onDeleteView: (v: SavedView) => void;
  onSetDefault: (v: SavedView) => void;
  onToggleFavorite: (v: SavedView) => void;
};

export default function ViewSelect({
  views,
  active,
  favorites,
  onSelect,
  onNewView,
  onEditView,
  onDeleteView,
  onSetDefault,
  onToggleFavorite,
}: Props) {
  const { token } = theme.useToken();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"all" | "favorites">("all");
  const [query, setQuery] = useState("");

  const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();
  const q = query.trim().toLowerCase();
  const match = (v: SavedView) => !q || v.name.toLowerCase().includes(q);

  const row = (v: SavedView) => (
    <div
      key={v.id}
      className="scb-view-row"
      style={{
        background: active?.id === v.id ? token.controlItemBgActive : undefined,
        fontWeight: active?.id === v.id ? 600 : 400,
      }}
      onClick={() => {
        onSelect(v);
        setOpen(false);
      }}
    >
      <span style={{ width: 22, flexShrink: 0, display: "inline-flex", justifyContent: "center" }}>
        <Button
          type="text"
          size="small"
          className={favorites.has(v.id) ? "scb-fav" : "scb-fav scb-fav-off"}
          style={{ width: 22, height: 22, minWidth: 0, padding: 0 }}
          title={i18n.t("views.favorite", { defaultValue: "收藏" })}
          icon={
            favorites.has(v.id) ? (
              <StarFilled style={{ color: FAV_COLOR }} />
            ) : (
              <StarOutlined style={{ color: token.colorTextSecondary }} />
            )
          }
          onClick={(e) => {
            stop(e);
            onToggleFavorite(v);
          }}
        />
      </span>
      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.name}</span>
      <span className="scb-row-actions" style={{ display: "inline-flex", gap: 0 }}>
        <Button
          type="text"
          size="small"
          title={i18n.t("views.setDefault", { defaultValue: "设为默认" })}
          icon={
            v.is_default ? (
              <PushpinFilled style={{ color: token.colorPrimary }} />
            ) : (
              <PushpinOutlined style={{ color: token.colorTextTertiary }} />
            )
          }
          onClick={(e) => {
            stop(e);
            onSetDefault(v);
          }}
        />
        {v.is_mine && !v.is_system && (
          <>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={(e) => {
                stop(e);
                onEditView(v);
              }}
            />
            <Popconfirm
              title={i18n.t("views.deleteConfirm", { defaultValue: "删除该视图？" })}
              okText={i18n.t("common.confirm", { defaultValue: "确认" })}
              cancelText={i18n.t("common.cancel", { defaultValue: "取消" })}
              onConfirm={() => onDeleteView(v)}
            >
              <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={stop} />
            </Popconfirm>
          </>
        )}
      </span>
    </div>
  );

  const groups: { label: string; rows: ReactNode[] }[] = [];
  if (tab === "favorites") {
    const rows = views.filter((v) => favorites.has(v.id) && match(v)).map(row);
    if (rows.length) groups.push({ label: i18n.t("views.favorites", { defaultValue: "收藏" }), rows });
  } else {
    const sys = views.filter((v) => v.is_system && match(v)).map(row);
    if (sys.length) groups.push({ label: i18n.t("views.systemViews", { defaultValue: "系统视图" }), rows: sys });
    const mine = views.filter((v) => v.is_mine && !v.is_system && match(v)).map(row);
    if (mine.length) groups.push({ label: i18n.t("views.myViews", { defaultValue: "我的视图" }), rows: mine });
    const shared = views.filter((v) => v.is_shared && !v.is_mine && !v.is_system && match(v)).map(row);
    if (shared.length) groups.push({ label: i18n.t("views.sharedViews", { defaultValue: "共享视图" }), rows: shared });
  }

  const tabBtn = (key: "all" | "favorites", label: string) => (
    <div
      onClick={() => setTab(key)}
      style={{
        cursor: "pointer",
        padding: "8px 2px",
        fontSize: 13,
        fontWeight: tab === key ? 600 : 500,
        color: tab === key ? token.colorPrimary : token.colorTextSecondary,
        borderBottom: `2px solid ${tab === key ? token.colorPrimary : "transparent"}`,
      }}
    >
      {label}
    </div>
  );

  const panel = (
    <div
      style={{
        width: 320,
        background: token.colorBgElevated,
        borderRadius: 10,
        boxShadow: token.boxShadowSecondary,
        border: `1px solid ${token.colorBorderSecondary}`,
        overflow: "hidden",
      }}
    >
      <style>{`
        .scb-view-row { display:flex; align-items:center; gap:8px; padding:7px 10px; margin:1px 8px; border-radius:6px; cursor:pointer; font-size:13.5px; color:${token.colorText}; }
        .scb-view-row:hover { background:${token.controlItemBgHover}; }
        .scb-view-row .scb-row-actions { opacity:0; transition:opacity .12s; }
        .scb-view-row:hover .scb-row-actions { opacity:1; }
        .scb-view-row .scb-fav-off { opacity:.4; transition:opacity .12s; }
        .scb-view-row:hover .scb-fav-off { opacity:.7; }
        .scb-view-row .scb-fav-off:hover { opacity:1; }
      `}</style>

      <div
        style={{
          display: "flex",
          gap: 20,
          padding: "6px 18px 0",
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        {tabBtn("all", i18n.t("views.allViews", { defaultValue: "全部视图" }))}
        {tabBtn("favorites", i18n.t("views.favorites", { defaultValue: "收藏" }))}
      </div>

      <div style={{ padding: "14px 16px 8px" }}>
        <Input
          allowClear
          prefix={<SearchOutlined style={{ color: token.colorTextTertiary, marginInlineEnd: 4 }} />}
          placeholder={i18n.t("views.searchViews", { defaultValue: "搜索视图" })}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div style={{ maxHeight: 320, overflowY: "auto", paddingBottom: 4 }}>
        {groups.length === 0 ? (
          <div style={{ padding: "24px 0", textAlign: "center", color: token.colorTextTertiary, fontSize: 13 }}>
            {i18n.t("views.noViews", { defaultValue: "暂无视图" })}
          </div>
        ) : (
          groups.map((g) => (
            <div key={g.label}>
              <div
                style={{
                  margin: "6px 8px 2px",
                  padding: "5px 10px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: token.colorTextSecondary,
                  background: token.colorFillQuaternary,
                  borderRadius: 6,
                }}
              >
                {g.label}
              </div>
              {g.rows}
            </div>
          ))
        )}
      </div>

      <div
        onClick={() => {
          setOpen(false);
          onNewView();
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "10px 16px",
          borderTop: `1px solid ${token.colorBorderSecondary}`,
          color: token.colorPrimary,
          cursor: "pointer",
          fontWeight: 500,
          fontSize: 13.5,
        }}
      >
        <PlusOutlined /> {i18n.t("views.newView", { defaultValue: "新建视图" })}
      </div>
    </div>
  );

  return (
    <Dropdown trigger={["click"]} open={open} onOpenChange={setOpen} popupRender={() => panel}>
      <Button
        style={{
          height: 32,
          borderRadius: 18,
          fontWeight: 600,
          paddingInline: 16,
          borderColor: open ? token.colorPrimary : "#c7d4df",
          color: token.colorText,
        }}
      >
        {active?.name ?? "—"}{" "}
        <DownOutlined style={{ fontSize: 10, marginInlineStart: 2, color: token.colorTextSecondary }} />
      </Button>
    </Dropdown>
  );
}
