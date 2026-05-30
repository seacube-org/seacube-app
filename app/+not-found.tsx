import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import i18n from '@/locale/i18n';
import { useLocaleStore } from '@/stores/localeStore';

export default function NotFound() {
  useLocaleStore(s => s.locale); // re-render when locale resolves
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>SeaCube ERP</Text>
      <Text style={styles.message}>{i18n.t('common.comingSoon')}</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.replace('/(app)')}>
        <Text style={styles.buttonText}>{i18n.t('common.back')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F5F7', gap: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#1A73E8' },
  message: { fontSize: 16, color: '#6B7280' },
  button: { backgroundColor: '#1A73E8', borderRadius: 8, paddingHorizontal: 24, paddingVertical: 10 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
