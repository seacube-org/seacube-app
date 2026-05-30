import { View, Text, StyleSheet } from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import i18n from '@/locale/i18n';
import { useLocaleStore } from '@/stores/localeStore';

export default function Dashboard() {
  useLocaleStore(s => s.locale); // re-render when locale resolves
  const user = useAuthStore((s) => s.user);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>SeaCube ERP</Text>
      <Text style={styles.subtitle}>{i18n.t('dashboard.welcome', { name: user?.first_name || user?.username })}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F5F7' },
  title: { fontSize: 24, fontWeight: '700', color: '#1A73E8' },
  subtitle: { fontSize: 16, color: '#6B7280', marginTop: 8 },
});
