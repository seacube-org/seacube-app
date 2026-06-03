import { View, Text, StyleSheet } from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { useLocaleStore } from '@/stores/localeStore';
import i18n from '@/locale/i18n';

// Native placeholder — the rich account-settings UI is web-only (index.web.tsx).
export default function AccountSettings() {
  useLocaleStore((s) => s.locale);
  const user = useAuthStore((s) => s.user);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{i18n.t('account.title', { defaultValue: '账户设置' })}</Text>
      <Text style={styles.row}>{user?.username}</Text>
      {!!user?.email && <Text style={styles.row}>{user.email}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#F4F5F7' },
  title: { fontSize: 20, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
  row: { fontSize: 15, color: '#374151', marginTop: 4 },
});
