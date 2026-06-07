import SettingPlaceholder from "@/components/modules/settings/SettingPlaceholder";

// Native placeholder — the full credit-period config UI is web-only (credit-periods.web.tsx).
export default function CreditPeriodsSettings() {
  return <SettingPlaceholder titleKey="settings.creditPeriods" defaultValue="账期设置" />;
}
