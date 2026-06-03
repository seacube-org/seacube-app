import { Empty, Tabs } from "antd";
import { useActiveMembership, useIsActiveAdmin } from "@/stores/authStore";
import { useLocaleStore } from "@/stores/localeStore";
import i18n from "@/locale/i18n";
import { SettingsSection } from "@/components/modules/settings/SettingsSection";
import UsersTab from "@/components/modules/settings/access/UsersTab";
import RolesTab from "@/components/modules/settings/access/RolesTab";
import ProfilesTab from "@/components/modules/settings/access/ProfilesTab";

export default function AccessSettings() {
  useLocaleStore((s) => s.locale);
  const activeMembership = useActiveMembership();
  const isAdmin = useIsActiveAdmin();
  const orgName = activeMembership?.organization.name ?? "";

  if (!isAdmin) {
    return (
      <SettingsSection title={i18n.t("settings.access", { defaultValue: "用户与权限" })}>
        <Empty description={i18n.t("access.noPermission", { defaultValue: "无权限访问" })} />
      </SettingsSection>
    );
  }

  const items = [
    { key: "users", label: i18n.t("access.users", { defaultValue: "用户" }), children: <UsersTab orgName={orgName} /> },
    { key: "roles", label: i18n.t("access.roles", { defaultValue: "角色" }), children: <RolesTab /> },
    { key: "profiles", label: i18n.t("access.profiles", { defaultValue: "权限方案" }), children: <ProfilesTab /> },
  ];

  return (
    <SettingsSection title={i18n.t("settings.access", { defaultValue: "用户与权限" })}>
      {/* Users, roles and profiles here all belong to the active org (shown in the header). */}
      <Tabs defaultActiveKey="users" items={items} />
    </SettingsSection>
  );
}
