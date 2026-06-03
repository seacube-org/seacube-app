import { useMemo, useState } from "react";
import { App, Button, Form, Input, Select, Typography } from "antd";
import { useAuthStore } from "@/stores/authStore";
import { useLocaleStore } from "@/stores/localeStore";
import i18n from "@/locale/i18n";
import { SettingsSection } from "@/components/modules/settings/SettingsSection";
import { SettingCard } from "@/components/modules/settings/SettingCard";
import { applyFieldErrors } from "@/components/modules/settings/formErrors";

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{ display: "flex", gap: 16, padding: "7px 0" }}>
      <Typography.Text type="secondary" style={{ width: 88, flexShrink: 0 }}>
        {label}
      </Typography.Text>
      <Typography.Text>{value || "—"}</Typography.Text>
    </div>
  );
}

function ProfileForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const { message } = App.useApp();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const initial = useMemo(
    () => ({
      first_name: user?.first_name ?? "",
      last_name: user?.last_name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
    }),
    [user],
  );

  const onFinish = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      await updateProfile(values);
      message.success(i18n.t("account.saved", { defaultValue: "已保存" }));
      onDone();
    } catch (err) {
      if (!applyFieldErrors(form, err)) {
        message.error(i18n.t("account.saveFailed", { defaultValue: "保存失败，请重试" }));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form form={form} layout="vertical" initialValues={initial} onFinish={onFinish} requiredMark={false}>
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
      <Form.Item style={{ marginBottom: 0 }}>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button onClick={onCancel} disabled={saving}>
            {i18n.t("common.cancel", { defaultValue: "取消" })}
          </Button>
          <Button type="primary" htmlType="submit" loading={saving}>
            {i18n.t("account.save", { defaultValue: "保存" })}
          </Button>
        </div>
      </Form.Item>
    </Form>
  );
}

function ProfileSection() {
  const user = useAuthStore((s) => s.user);
  const [editing, setEditing] = useState(false);
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ");

  return (
    <SettingCard
      title={i18n.t("account.profile", { defaultValue: "个人资料" })}
      description={i18n.t("account.profileDesc", { defaultValue: "管理你的姓名、邮箱和联系方式" })}
      extra={
        editing ? undefined : (
          // Gate editing until /me has loaded: the form is mounted on click and
          // captures initialValues then, so opening it with a null user would let
          // a save overwrite the profile with blank strings.
          <Button onClick={() => setEditing(true)} disabled={!user}>
            {i18n.t("common.edit", { defaultValue: "编辑" })}
          </Button>
        )
      }
    >
      {editing ? (
        <ProfileForm onDone={() => setEditing(false)} onCancel={() => setEditing(false)} />
      ) : (
        <>
          <InfoRow label={i18n.t("account.username", { defaultValue: "用户名" })} value={user?.username} />
          <InfoRow label={i18n.t("account.name", { defaultValue: "姓名" })} value={fullName} />
          <InfoRow label={i18n.t("account.email", { defaultValue: "邮箱" })} value={user?.email} />
          <InfoRow label={i18n.t("account.phone", { defaultValue: "电话" })} value={user?.phone} />
        </>
      )}
    </SettingCard>
  );
}

function PreferencesSection() {
  const locale = useLocaleStore((s) => s.locale);
  const changeLocale = useLocaleStore((s) => s.changeLocale);

  return (
    <SettingCard
      title={i18n.t("account.preferences", { defaultValue: "偏好" })}
      description={i18n.t("account.languageDesc", { defaultValue: "选择界面显示语言" })}
      extra={
        <Select
          value={locale}
          style={{ width: 180 }}
          onChange={(v) => changeLocale(v)}
          options={[
            { value: "zh-Hans", label: "简体中文" },
            { value: "en", label: "English" },
          ]}
        />
      }
    />
  );
}

export default function GeneralSettings() {
  useLocaleStore((s) => s.locale); // re-render when locale changes
  return (
    <SettingsSection title={i18n.t("settings.general", { defaultValue: "基础设置" })}>
      <ProfileSection />
      <PreferencesSection />
    </SettingsSection>
  );
}
