import { useState } from "react";
import { App, Button, Form, Input, Modal, Space, Typography } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import { useAuthStore } from "@/stores/authStore";
import { useLocaleStore } from "@/stores/localeStore";
import { AuthService } from "@/services/DataService";
import { colors } from "@/constants/theme";
import i18n from "@/locale/i18n";
import { SettingsSection } from "@/components/modules/settings/SettingsSection";
import { SettingCard } from "@/components/modules/settings/SettingCard";
import { applyFieldErrors } from "@/components/modules/settings/formErrors";

function PasswordForm({ onDone }: { onDone: () => void }) {
  const { message } = App.useApp();
  const logout = useAuthStore((s) => s.logout);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const onFinish = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      await AuthService.changePassword(values);
      onDone();
      // The backend blacklists existing tokens, so re-auth is required.
      // logout() clears state; the root layout redirects to /(auth)/login.
      message.success(i18n.t("account.passwordChanged", { defaultValue: "密码已修改，请重新登录" }));
      await logout();
    } catch (err) {
      if (!applyFieldErrors(form, err)) {
        message.error(i18n.t("account.passwordFailed", { defaultValue: "修改失败，请重试" }));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Form.Item
        name="old_password"
        label={i18n.t("account.currentPassword", { defaultValue: "当前密码" })}
        rules={[{ required: true, message: i18n.t("account.required", { defaultValue: "必填" }) }]}
      >
        <Input.Password autoComplete="current-password" />
      </Form.Item>
      <Form.Item
        name="new_password"
        label={i18n.t("account.newPassword", { defaultValue: "新密码" })}
        rules={[{ required: true, message: i18n.t("account.required", { defaultValue: "必填" }) }]}
      >
        <Input.Password autoComplete="new-password" />
      </Form.Item>
      <Form.Item
        name="new_password2"
        label={i18n.t("account.confirmPassword", { defaultValue: "确认新密码" })}
        dependencies={["new_password"]}
        rules={[
          { required: true, message: i18n.t("account.required", { defaultValue: "必填" }) },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue("new_password") === value) return Promise.resolve();
              return Promise.reject(new Error(i18n.t("account.passwordMismatch", { defaultValue: "两次输入的密码不一致" })));
            },
          }),
        ]}
      >
        <Input.Password autoComplete="new-password" />
      </Form.Item>
      <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
        <Button type="primary" htmlType="submit" loading={saving}>
          {i18n.t("account.updatePassword", { defaultValue: "更新密码" })}
        </Button>
      </Form.Item>
    </Form>
  );
}

function PasswordSection() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <SettingCard
        title={i18n.t("account.password", { defaultValue: "密码" })}
        description={i18n.t("account.passwordDesc", { defaultValue: "定期更新密码可以更好地保护账户安全" })}
        extra={
          <Button type="primary" onClick={() => setOpen(true)}>
            {i18n.t("account.changePassword", { defaultValue: "更改密码" })}
          </Button>
        }
      />
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        destroyOnHidden
        title={i18n.t("account.changePassword", { defaultValue: "更改密码" })}
      >
        <PasswordForm onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}

function SecurityTipsSection() {
  const tips = [
    i18n.t("account.tipLength", { defaultValue: "使用至少 8 位，包含大小写字母与数字的密码" }),
    i18n.t("account.tipUnique", { defaultValue: "不要在多个网站重复使用同一密码" }),
    i18n.t("account.tipRelogin", { defaultValue: "修改密码后会退出所有设备，需要重新登录" }),
  ];
  return (
    <SettingCard title={i18n.t("account.securityTips", { defaultValue: "安全建议" })}>
      <Space orientation="vertical" size={14} style={{ width: "100%" }}>
        {tips.map((tip) => (
          <div key={tip} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <CheckCircleOutlined style={{ color: colors.primary, fontSize: 16, marginTop: 3, flexShrink: 0 }} />
            <Typography.Text type="secondary">{tip}</Typography.Text>
          </div>
        ))}
      </Space>
    </SettingCard>
  );
}

export default function SecuritySettings() {
  useLocaleStore((s) => s.locale);
  return (
    <SettingsSection title={i18n.t("settings.security", { defaultValue: "安全设置" })}>
      <PasswordSection />
      <SecurityTipsSection />
    </SettingsSection>
  );
}
