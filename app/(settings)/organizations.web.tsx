import { useState } from "react";
import { Empty, Tag } from "antd";
import { BankOutlined, RightOutlined } from "@ant-design/icons";
import Card from "@/components/ui/Card";
import { useAuthStore, useIsActiveAdmin, type Membership } from "@/stores/authStore";
import { useLocaleStore } from "@/stores/localeStore";
import { colors } from "@/constants/theme";
import i18n from "@/locale/i18n";
import { SettingsSection } from "@/components/modules/settings/SettingsSection";
import { SettingCard } from "@/components/modules/settings/SettingCard";
import { OrgDetailDrawer } from "@/components/modules/settings/OrgDetailDrawer";

export default function OrganizationsSettings() {
  useLocaleStore((s) => s.locale);
  const memberships = useAuthStore((s) => s.user?.memberships) ?? [];
  const activeOrgId = useAuthStore((s) => s.activeOrgId);
  const isActiveAdmin = useIsActiveAdmin();
  const [selected, setSelected] = useState<Membership | null>(null);

  if (memberships.length === 0) {
    return (
      <SettingsSection title={i18n.t("settings.organizations", { defaultValue: "我的机构" })}>
        <Card style={{ borderRadius: 10 }} styles={{ body: { padding: "48px 28px" } }}>
          <Empty description={i18n.t("account.noOrganizations", { defaultValue: "暂无机构" })} />
        </Card>
      </SettingsSection>
    );
  }

  // Update is admin-only and scoped to the active org on the backend.
  const canEditSelected = selected != null && selected.organization.id === activeOrgId && isActiveAdmin;

  return (
    <SettingsSection title={i18n.t("settings.organizations", { defaultValue: "我的机构" })}>
      {memberships.map((m) => (
        <SettingCard
          key={m.id}
          onClick={() => setSelected(m)}
          title={
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <BankOutlined style={{ color: colors.primary }} />
              {m.organization.name}
            </span>
          }
          description={m.role?.name}
          extra={
            <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              {m.organization.id === activeOrgId && (
                <Tag color="green">{i18n.t("account.current", { defaultValue: "当前" })}</Tag>
              )}
              {m.is_default && (
                <Tag color="blue">{i18n.t("account.default", { defaultValue: "默认" })}</Tag>
              )}
              <RightOutlined style={{ color: colors.text.muted, fontSize: 12 }} />
            </span>
          }
        />
      ))}

      <OrgDetailDrawer
        open={selected != null}
        membership={selected}
        canEdit={canEditSelected}
        onClose={() => setSelected(null)}
      />
    </SettingsSection>
  );
}
