import { Dropdown, Button, Popconfirm, theme } from "antd";
import type { MenuProps } from "antd";
import {
  DownOutlined, StarFilled, StarOutlined, EditOutlined, DeleteOutlined, PlusOutlined,
  PushpinOutlined, PushpinFilled,
} from "@ant-design/icons";
import i18n from "@/locale/i18n";
import { activeViewId, type ActiveView, type SavedView, type SystemView } from "./types";

type Props = {
  systemViews: SystemView[];
  views: SavedView[];
  active: ActiveView;
  onSelectSystem: (v: SystemView) => void;
  onSelectSaved: (v: SavedView) => void;
  onNewView: () => void;
  onEditView: (v: SavedView) => void;
  onDeleteView: (v: SavedView) => void;
  onSetDefault: (v: SavedView) => void;
  onToggleFavorite: (v: SavedView) => void;
};

export default function ViewSelect({
  systemViews, views, active, onSelectSystem, onSelectSaved, onNewView, onEditView, onDeleteView,
  onSetDefault, onToggleFavorite,
}: Props) {
  const { token } = theme.useToken();
  const mine = views.filter((v) => v.is_mine);
  const shared = views.filter((v) => !v.is_mine && v.is_shared);

  const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();

  // Favorite + default are per-user, so every visible view gets those toggles;
  // edit/delete stay owner-only.
  const savedLabel = (v: SavedView) => (
    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 240 }}>
      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.name}</span>
      <Button
        type="text" size="small"
        icon={v.is_favorite
          ? <StarFilled style={{ color: "#faad14" }} />
          : <StarOutlined style={{ color: token.colorTextTertiary }} />}
        title={i18n.t("views.favorite", { defaultValue: "收藏" })}
        onClick={(e) => { stop(e); onToggleFavorite(v); }}
      />
      <Button
        type="text" size="small"
        icon={v.is_default
          ? <PushpinFilled style={{ color: token.colorPrimary }} />
          : <PushpinOutlined style={{ color: token.colorTextTertiary }} />}
        title={i18n.t("views.setDefault", { defaultValue: "设为默认" })}
        onClick={(e) => { stop(e); onSetDefault(v); }}
      />
      {v.is_mine && (
        <>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={(e) => { stop(e); onEditView(v); }} />
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
    </div>
  );

  const items: MenuProps["items"] = [
    {
      type: "group",
      label: i18n.t("views.systemViews", { defaultValue: "系统视图" }),
      children: systemViews.map((v) => ({ key: `sys:${v.key}`, label: v.name })),
    },
    ...(mine.length
      ? [{ type: "group" as const, label: i18n.t("views.myViews", { defaultValue: "我的视图" }),
          children: mine.map((v) => ({ key: `view:${v.id}`, label: savedLabel(v) })) }]
      : []),
    ...(shared.length
      ? [{ type: "group" as const, label: i18n.t("views.sharedViews", { defaultValue: "共享视图" }),
          children: shared.map((v) => ({ key: `view:${v.id}`, label: savedLabel(v) })) }]
      : []),
    { type: "divider" },
    { key: "__new", icon: <PlusOutlined />, label: i18n.t("views.newView", { defaultValue: "新建视图" }) },
  ];

  const onClick: MenuProps["onClick"] = ({ key }) => {
    if (key === "__new") return onNewView();
    if (key.startsWith("sys:")) {
      const v = systemViews.find((s) => `sys:${s.key}` === key);
      if (v) onSelectSystem(v);
    } else if (key.startsWith("view:")) {
      const v = views.find((s) => `view:${s.id}` === key);
      if (v) onSelectSaved(v);
    }
  };

  const activeName = active.view.name;

  return (
    <Dropdown
      trigger={["click"]}
      menu={{ items, onClick, selectedKeys: [activeViewId(active)] }}
    >
      <Button style={{ height: 32, borderRadius: 18, fontWeight: 600, paddingInline: 14, borderColor: "#c7d4df" }}>
        {activeName} <DownOutlined style={{ fontSize: 10, color: token.colorTextSecondary }} />
      </Button>
    </Dropdown>
  );
}
