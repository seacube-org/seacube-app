import { Empty, Tag } from "antd";
import { BankOutlined } from "@ant-design/icons";
import Card from "@/components/ui/Card";
import { useAuthStore } from "@/stores/authStore";
import { useLocaleStore } from "@/stores/localeStore";
import { colors } from "@/constants/theme";
import i18n from "@/locale/i18n";
import { SettingsSection } from "@/components/modules/settings/SettingsSection";
import { SettingCard } from "@/components/modules/settings/SettingCard";

export default function OrganizationsSettings() {
  useLocaleStore((s) => s.locale);
  const memberships = useAuthStore((s) => s.user?.memberships) ?? [];

  if (memberships.length === 0) {
    return (
      <SettingsSection title={i18n.t("settings.organizations", { defaultValue: "我的机构" })}>
        <Card style={{ borderRadius: 10 }} styles={{ body: { padding: "48px 28px" } }}>
          <Empty description={i18n.t("account.noOrganizations", { defaultValue: "暂无机构" })} />
        </Card>
      </SettingsSection>
    );
  }

  return (
    <SettingsSection title={i18n.t("settings.organizations", { defaultValue: "我的机构" })}>
      {memberships.map((m) => (
        <SettingCard
          key={m.id}
          title={
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <BankOutlined style={{ color: colors.primary }} />
              {m.organization.name}
            </span>
          }
          description={m.role?.name}
          extra={m.is_default ? <Tag color="blue">{i18n.t("account.default", { defaultValue: "默认" })}</Tag> : undefined}
        />
      ))}
    </SettingsSection>
  );
}
