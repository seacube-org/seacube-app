import SettingPlaceholder from "@/components/modules/settings/SettingPlaceholder";

// Native placeholder — the full security-settings UI is web-only (security.web.tsx).
export default function SecuritySettings() {
  return <SettingPlaceholder titleKey="settings.security" defaultValue="安全设置" />;
}
