import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useLocaleStore } from "@/stores/localeStore";
import { colors } from "@/constants/theme";
import i18n from "@/locale/i18n";

// Native placeholder — the quote form UI is web-only for now (edit.web.tsx).
export default function EditQuoteScreen() {
  useLocaleStore((s) => s.locale);
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {i18n.t("sales.editQuote", { defaultValue: "编辑报价单" })} #{id}
      </Text>
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
