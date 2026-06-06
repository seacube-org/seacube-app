import SettingPlaceholder from "@/components/modules/settings/SettingPlaceholder";

// Native placeholder — the full organizations UI is web-only (organizations.web.tsx).
export default function OrganizationsSettings() {
  return <SettingPlaceholder titleKey="settings.organizations" defaultValue="我的机构" />;
}
