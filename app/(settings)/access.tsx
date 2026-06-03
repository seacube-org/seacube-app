import SettingPlaceholder from '@/components/modules/settings/SettingPlaceholder';

// Native placeholder — the user/role/permission UI is web-only (access.web.tsx).
export default function AccessSettings() {
  return <SettingPlaceholder titleKey="settings.access" defaultValue="用户与权限" />;
}
