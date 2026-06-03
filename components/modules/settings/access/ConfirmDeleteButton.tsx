import { Button, Popconfirm } from "antd";
import i18n from "@/locale/i18n";

/**
 * Danger button gated by a Popconfirm with the shared 确认/取消 labels — used by
 * the access tables (row delete) and the member drawer (remove-from-org).
 */
export function ConfirmDeleteButton({
  title, description, onConfirm, label, link,
}: {
  title: string;
  description?: string;
  onConfirm: () => void;
  label: string;
  /** Render as a borderless link button (for table rows) vs a default danger button. */
  link?: boolean;
}) {
  return (
    <Popconfirm
      title={title}
      description={description}
      onConfirm={onConfirm}
      okText={i18n.t("common.confirm", { defaultValue: "确认" })}
      cancelText={i18n.t("common.cancel", { defaultValue: "取消" })}
    >
      <Button danger type={link ? "link" : "default"} style={link ? { padding: 0 } : undefined}>
        {label}
      </Button>
    </Popconfirm>
  );
}
