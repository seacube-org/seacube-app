import { useEffect, useState } from "react";
import { App, Button, Drawer, Form, Input, Select, Switch } from "antd";
import i18n from "@/locale/i18n";
import { applyFieldErrors } from "@/components/modules/settings/formErrors";
import { useAccessViewSets, roleTypeLabel, ROLE_TYPE_OPTIONS, type Role } from "./shared";

/** Create / edit a role (name, type, parent, peer-visibility, description). */
export default function RoleDrawer({
  open,
  role,
  roles,
  onClose,
  onSaved,
}: {
  open: boolean;
  role: Role | null; // null = create
  roles: Role[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { message } = App.useApp();
  const { rolesVS } = useAccessViewSets();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const isEdit = role != null;

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({
      name: role?.name ?? "",
      role_type: role?.role_type ?? "STAFF",
      parent: role?.parent ?? undefined,
      is_peer_visible: role?.is_peer_visible ?? false,
      description: role?.description ?? "",
    });
  }, [open, role, form]);

  const onFinish = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      if (isEdit) await rolesVS.update({ id: role.id, body: values });
      else await rolesVS.create({ body: values });
      message.success(i18n.t("account.saved", { defaultValue: "已保存" }));
      onSaved();
      onClose();
    } catch (err) {
      if (!applyFieldErrors(form, err)) {
        message.error(i18n.t("account.saveFailed", { defaultValue: "保存失败，请重试" }));
      }
    } finally {
      setSaving(false);
    }
  };

  // A role cannot be its own parent.
  const parentOptions = roles.filter((r) => r.id !== role?.id).map((r) => ({ value: r.id, label: r.name }));

  return (
    <Drawer
      open={open}
      onClose={onClose}
      styles={{ wrapper: { width: 480 } }}
      destroyOnHidden
      title={
        isEdit
          ? i18n.t("access.editRole", { defaultValue: "编辑角色" })
          : i18n.t("access.newRole", { defaultValue: "新建角色" })
      }
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button onClick={onClose}>{i18n.t("common.cancel", { defaultValue: "取消" })}</Button>
          <Button type="primary" loading={saving} onClick={() => form.submit()}>
            {i18n.t("account.save", { defaultValue: "保存" })}
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="name"
          label={i18n.t("access.roleName", { defaultValue: "角色名称" })}
          rules={[{ required: true, message: i18n.t("account.required", { defaultValue: "必填" }) }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="role_type" label={i18n.t("access.roleType", { defaultValue: "类型" })}>
          <Select options={ROLE_TYPE_OPTIONS.map((o) => ({ value: o.value, label: roleTypeLabel(o.value) }))} />
        </Form.Item>
        <Form.Item
          name="parent"
          label={i18n.t("access.parentRole", { defaultValue: "上级角色" })}
          tooltip={i18n.t("access.parentRoleHint", { defaultValue: "下级角色的数据对上级可见" })}
        >
          <Select
            allowClear
            options={parentOptions}
            placeholder={i18n.t("access.noParent", { defaultValue: "无（顶级角色）" })}
          />
        </Form.Item>
        <Form.Item
          name="is_peer_visible"
          label={i18n.t("access.peerVisible", { defaultValue: "同级互相可见" })}
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
        <Form.Item name="description" label={i18n.t("access.description", { defaultValue: "描述" })}>
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
