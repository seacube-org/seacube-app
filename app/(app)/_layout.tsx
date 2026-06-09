import { Tabs } from "expo-router";
import i18n from "@/locale/i18n";
import { useLocaleStore } from "@/stores/localeStore";

export default function AppLayout() {
  useLocaleStore((s) => s.locale); // re-render when locale resolves
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: i18n.t("nav.dashboard") }} />
      <Tabs.Screen name="products" options={{ title: i18n.t("nav.products"), href: null }} />
      <Tabs.Screen name="(sales)" options={{ title: i18n.t("nav.sales"), href: null }} />
      <Tabs.Screen name="(purchases)" options={{ title: i18n.t("nav.purchases"), href: null }} />
      <Tabs.Screen name="contacts" options={{ title: i18n.t("nav.contacts"), href: null }} />
      <Tabs.Screen name="(inventory)" options={{ title: i18n.t("nav.inventory"), href: null }} />
      <Tabs.Screen name="(production)" options={{ title: i18n.t("nav.production"), href: null }} />
      <Tabs.Screen name="(logistics)" options={{ title: i18n.t("nav.logistics"), href: null }} />
    </Tabs>
  );
}
