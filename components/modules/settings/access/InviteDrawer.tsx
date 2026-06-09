import { useEffect, useState } from "react";
import { Alert, App, Button, Drawer, Form, Input, Select } from "antd";
import i18n from "@/locale/i18n";
import { applyFieldErrors } from "@/components/modules/settings/formErrors";
import { useAccessViewSets, roleOptions, profileOptions, type Role, type Profile } from "./shared";

/** Add an *existing* account to the active org (membership only — never creates an account). */
export default function InviteDrawer({
  open,
  roles,
  profiles,
  orgName,
  onClose,
  onSaved,
}: {
  open: boolean;
  roles: Role[];
  profiles: Profile[];
  orgName: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { message } = App.useApp();
  const { usersVS } = useAccessViewSets();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) form.resetFields();
  }, [open, form]);

  const onFinish = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      // Adds an existing account to this org (membership); never creates an account.
      await usersVS.action({ action: "invite", body: values });
      message.success(i18n.t("access.invited", { defaultValue: "已加入机构" }));
      onSaved();
      onClose();
    } catch (err) {
      if (!applyFieldErrors(form, err)) {
        message.error(i18n.t("access.inviteFailed", { defaultValue: "邀请失败" }));
      }
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
      title={i18n.t("access.inviteExisting", { defaultValue: "邀请已有用户" })}
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button onClick={onClose}>{i18n.t("common.cancel", { defaultValue: "取消" })}</Button>
          <Button type="primary" loading={saving} onClick={() => form.submit()}>
            {i18n.t("access.invite", { defaultValue: "邀请" })}
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        {orgName ? (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            title={`${i18n.t("access.willJoin", { defaultValue: "将加入机构" })}：${orgName}`}
          />
        ) : null}
        <Form.Item
          name="identifier"
          label={i18n.t("access.identifier", { defaultValue: "用户名或邮箱" })}
          rules={[{ required: true, message: i18n.t("account.required", { defaultValue: "必填" }) }]}
        >
          <Input placeholder={i18n.t("access.identifierHint", { defaultValue: "输入已有账号的用户名或邮箱" })} />
        </Form.Item>
        <div style={{ display: "flex", gap: 16 }}>
          <Form.Item name="role_id" label={i18n.t("access.role", { defaultValue: "角色" })} style={{ flex: 1 }}>
            <Select
              allowClear
              options={roleOptions(roles)}
              placeholder={i18n.t("access.selectRole", { defaultValue: "选择角色" })}
            />
          </Form.Item>
          <Form.Item name="profile_id" label={i18n.t("access.profile", { defaultValue: "权限方案" })} style={{ flex: 1 }}>
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
