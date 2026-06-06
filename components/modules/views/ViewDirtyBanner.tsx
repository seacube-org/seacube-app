import { Button, Space, theme } from "antd";
import i18n from "@/locale/i18n";

type Props = {
  viewName: string;
  canUpdate: boolean;
  onUpdate: () => void;
  onSaveAs: () => void;
  onRevert: () => void;
};

/**
 * Zoho-style banner shown when the active saved view's applied filter diverges
 * from its stored definition. Reusable across module list pages.
 */
export default function ViewDirtyBanner({ viewName, canUpdate, onUpdate, onSaveAs, onRevert }: Props) {
  const { token } = theme.useToken();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "8px 24px",
        background: "#eef4ff",
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        fontSize: 13,
        color: token.colorText,
      }}
    >
      <span>{i18n.t("views.dirtyNotice", { defaultValue: "「{{name}}」有未保存的更改", name: viewName })}</span>
      <Space size={8}>
        {canUpdate && (
          <Button type="primary" size="small" onClick={onUpdate}>
            {i18n.t("views.updateView", { defaultValue: "更新视图" })}
          </Button>
        )}
        <Button size="small" onClick={onSaveAs}>
          {i18n.t("views.saveAsView", { defaultValue: "另存为视图" })}
        </Button>
        <Button size="small" type="text" onClick={onRevert}>
          {i18n.t("views.reset", { defaultValue: "还原" })}
        </Button>
      </Space>
    </div>
  );
}
