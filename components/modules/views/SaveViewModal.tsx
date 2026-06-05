import { useEffect } from "react";
import { Checkbox, Form, Input, Modal } from "antd";
import i18n from "@/locale/i18n";
import type { Visibility } from "./types";

/** Page-facing payload: name + favorite (modal) plus visibility (from the panel). */
export type SaveViewMeta = { name: string; is_favorite: boolean; visibility: Visibility };

/** What the modal itself collects — visibility is chosen in the panel's section. */
type ModalMeta = Pick<SaveViewMeta, "name" | "is_favorite">;

type Props = {
  open: boolean;
  saving?: boolean;
  initial?: Partial<ModalMeta>;
  onClose: () => void;
  onSave: (meta: ModalMeta) => void;
};

export default function SaveViewModal({ open, saving, initial, onClose, onSave }: Props) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        name: initial?.name ?? "",
        is_favorite: initial?.is_favorite ?? false,
      });
    }
  }, [open, initial, form]);

  return (
    <Modal
      open={open}
      title={i18n.t("views.saveAsView", { defaultValue: "另存为视图" })}
      okText={i18n.t("common.save", { defaultValue: "保存" })}
      cancelText={i18n.t("common.cancel", { defaultValue: "取消" })}
      confirmLoading={saving}
      onCancel={onClose}
      onOk={() => form.submit()}
      width={420}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={(v) => onSave(v as ModalMeta)}>
        <Form.Item
          name="name"
          label={i18n.t("views.viewName", { defaultValue: "视图名称" })}
          rules={[{ required: true, message: i18n.t("common.required", { defaultValue: "必填" }) }]}
        >
          <Input autoFocus />
        </Form.Item>
        <Form.Item name="is_favorite" valuePropName="checked" style={{ marginBottom: 0 }}>
          <Checkbox>{i18n.t("views.markFavorite", { defaultValue: "标记为收藏" })}</Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  );
}
