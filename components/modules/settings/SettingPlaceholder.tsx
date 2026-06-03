import { View, Text, StyleSheet } from 'react-native';
import { useLocaleStore } from '@/stores/localeStore';
import { colors } from '@/constants/theme';
import i18n from '@/locale/i18n';

/**
 * Native placeholder for a web-only settings section (heading only). The locale
 * subscription + i18n lookup are colocated here so the title re-renders on
 * language change.
 */
export default function SettingPlaceholder({ titleKey, defaultValue }: { titleKey: string; defaultValue: string }) {
  useLocaleStore((s) => s.locale);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{i18n.t(titleKey, { defaultValue })}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: colors.background },
  title: { fontSize: 20, fontWeight: '700', color: colors.text.primary },
});
