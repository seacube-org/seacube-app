import { View, Text, StyleSheet } from "react-native";
import { useLocaleStore } from "@/stores/localeStore";
import { colors } from "@/constants/theme";
import i18n from "@/locale/i18n";

// Native placeholder — the products CRUD UI is web-only for now (index.web.tsx).
export default function ProductsScreen() {
  useLocaleStore((s) => s.locale); // re-render when locale resolves
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{i18n.t("inventory.products", { defaultValue: "产品" })}</Text>
      <Text style={styles.subtitle}>{i18n.t("common.comingSoon", { defaultValue: "即将推出" })}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: 24,
  },
  title: { fontSize: 20, fontWeight: "700", color: colors.text.primary },
  subtitle: { fontSize: 14, color: colors.text.secondary, marginTop: 8 },
});
