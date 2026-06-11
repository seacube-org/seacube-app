import { useEffect, useState } from "react";
import { Alert, App, Button, Drawer, Form, Input, Select, Space } from "antd";
import { useAuthStore } from "@/stores/authStore";
import i18n from "@/locale/i18n";
import { applyFieldErrors } from "@/components/modules/settings/formErrors";
import { useAccessViewSets, roleOptions, profileOptions, type Member, type Role, type Profile } from "./shared";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton";

/** Create / edit a member (and, in edit mode, remove them from the active org). */
export default function MemberDrawer({
  open,
  member,
  roles,
  profiles,
  orgName,
  onClose,
  onSaved,
}: {
  open: boolean;
  member: Member | null; // null = create
  roles: Role[];
  profiles: Profile[];
  orgName: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { message } = App.useApp();
  const { usersVS } = useAccessViewSets();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const isEdit = member != null;

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({
      username: member?.username ?? "",
      email: member?.email ?? "",
      first_name: member?.first_name ?? "",
      last_name: member?.last_name ?? "",
      phone: member?.phone ?? "",
      role_id: member?.role?.id ?? undefined,
      profile_id: member?.profile?.id ?? undefined,
      password: undefined,
    });
  }, [open, member, form]);

  const onFinish = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      if (isEdit) {
        const { first_name, last_name, email, phone, role_id, profile_id } = values;
        // Send null (not undefined) so clearing a Select un-assigns it — the
        // backend treats a missing key as "no change".
        await usersVS.update({
          id: member.id,
          body: { first_name, last_name, email, phone, role_id: role_id ?? null, profile_id: profile_id ?? null },
        });
      } else {
        await usersVS.create({ body: values });
      }
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

  // "Remove" = delete this member's membership in the active org (the backend
  // keeps the global account and their other orgs). Lives here behind the edit
  // drawer rather than as a row action, to avoid accidental removals.
  const remove = async () => {
    if (!member) return;
    setSaving(true);
    try {
      await usersVS.delete({ id: member.id });
      message.success(i18n.t("access.removed", { defaultValue: "已移出机构" }));
      onSaved();
      onClose();
    } catch {
      message.error(i18n.t("access.removeFailed", { defaultValue: "移出失败" }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      styles={{ wrapper: { width: 480 } }}
      destroyOnHidden
      title={
        isEdit
          ? i18n.t("access.editMember", { defaultValue: "编辑用户" })
          : i18n.t("access.newUser", { defaultValue: "新建用户" })
      }
      footer={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {/* Destructive action tucked into the drawer footer, edit-mode only, never for self. */}
          {isEdit && member && member.id !== currentUserId ? (
            <ConfirmDeleteButton
              title={i18n.t("access.removeConfirm", { defaultValue: "将该成员移出本机构？" })}
              description={i18n.t("access.removeHint", { defaultValue: "账号与其他机构不受影响" })}
              onConfirm={remove}
              label={i18n.t("access.removeFromOrg", { defaultValue: "移出机构" })}
            />
          ) : (
            <span />
          )}
          <Space>
            <Button onClick={onClose}>{i18n.t("common.cancel", { defaultValue: "取消" })}</Button>
            <Button type="primary" loading={saving} onClick={() => form.submit()}>
              {i18n.t("account.save", { defaultValue: "保存" })}
            </Button>
          </Space>
        </div>
      }
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        {!isEdit && orgName ? (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            title={`${i18n.t("access.willJoin", { defaultValue: "将加入机构" })}：${orgName}`}
          />
        ) : null}
        <Form.Item
          name="username"
          label={i18n.t("account.username", { defaultValue: "用户名" })}
          rules={isEdit ? [] : [{ required: true, message: i18n.t("account.required", { defaultValue: "必填" }) }]}
        >
          <Input disabled={isEdit} autoComplete="off" />
        </Form.Item>
        {!isEdit && (
          <Form.Item
            name="password"
            label={i18n.t("access.initialPassword", { defaultValue: "初始密码" })}
            rules={[{ required: true, message: i18n.t("account.required", { defaultValue: "必填" }) }]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
        )}
        <div style={{ display: "flex", gap: 16 }}>
          <Form.Item name="first_name" label={i18n.t("account.firstName", { defaultValue: "名" })} style={{ flex: 1 }}>
            <Input />
          </Form.Item>
          <Form.Item name="last_name" label={i18n.t("account.lastName", { defaultValue: "姓" })} style={{ flex: 1 }}>
            <Input />
          </Form.Item>
        </div>
        <Form.Item
          name="email"
          label={i18n.t("account.email", { defaultValue: "邮箱" })}
          rules={[{ type: "email", message: i18n.t("account.emailInvalid", { defaultValue: "邮箱格式不正确" }) }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="phone" label={i18n.t("account.phone", { defaultValue: "电话" })}>
          <Input />
        </Form.Item>
        <div style={{ display: "flex", gap: 16 }}>
          <Form.Item name="role_id" label={i18n.t("access.role", { defaultValue: "角色" })} style={{ flex: 1 }}>
            <Select
              allowClear
              options={roleOptions(roles)}
              placeholder={i18n.t("access.selectRole", { defaultValue: "选择角色" })}
            />
          </Form.Item>
          <Form.Item
            name="profile_id"
            label={i18n.t("access.profile", { defaultValue: "权限方案" })}
            style={{ flex: 1 }}
          >
            <Select
              allowClear
              options={profileOptions(profiles)}
              placeholder={i18n.t("access.selectProfile", { defaultValue: "选择权限方案" })}
            />
          </Form.Item>
        </div>
      </Form>
    </Drawer>
  );
}
