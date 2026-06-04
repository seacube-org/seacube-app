import { useEffect } from "react";
import { Checkbox, Form, Input, Modal } from "antd";
import i18n from "@/locale/i18n";

export type SaveViewMeta = { name: string; is_favorite: boolean; is_shared: boolean };

type Props = {
  open: boolean;
  isAdmin: boolean;
  saving?: boolean;
  initial?: Partial<SaveViewMeta>;
  onClose: () => void;
  onSave: (meta: SaveViewMeta) => void;
};

export default function SaveViewModal({ open, isAdmin, saving, initial, onClose, onSave }: Props) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        name: initial?.name ?? "",
        is_favorite: initial?.is_favorite ?? false,
        is_shared: initial?.is_shared ?? false,
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
      <Form form={form} layout="vertical" onFinish={(v) => onSave(v as SaveViewMeta)}>
        <Form.Item
          name="name"
          label={i18n.t("views.viewName", { defaultValue: "视图名称" })}
          rules={[{ required: true, message: i18n.t("common.required", { defaultValue: "必填" }) }]}
        >
          <Input autoFocus />
        </Form.Item>
        <Form.Item name="is_favorite" valuePropName="checked" style={{ marginBottom: 8 }}>
          <Checkbox>{i18n.t("views.markFavorite", { defaultValue: "标记为收藏" })}</Checkbox>
        </Form.Item>
        {isAdmin && (
          <Form.Item name="is_shared" valuePropName="checked" style={{ marginBottom: 0 }}>
            <Checkbox>{i18n.t("views.shareWithOrg", { defaultValue: "共享给机构（所有成员可见）" })}</Checkbox>
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
