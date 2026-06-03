import SettingPlaceholder from '@/components/modules/settings/SettingPlaceholder';

// Native placeholder — the full address book UI is web-only (addresses.web.tsx).
export default function AddressesSettings() {
  return <SettingPlaceholder titleKey="settings.addresses" defaultValue="地址簿" />;
}
