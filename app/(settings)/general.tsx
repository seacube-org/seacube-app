import SettingPlaceholder from "@/components/modules/settings/SettingPlaceholder";

// Native placeholder — the full general-settings UI is web-only (general.web.tsx).
export default function GeneralSettings() {
  return <SettingPlaceholder titleKey="settings.general" defaultValue="基础设置" />;
}
