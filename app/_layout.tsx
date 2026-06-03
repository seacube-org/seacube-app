import '../global.css';
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useLocaleStore } from '@/stores/localeStore';
import ThemeProvider from '@/components/providers/ThemeProvider';

export default function RootLayout() {
  const { isAuthenticated, isLoading, initialize } = useAuthStore();
  const initLocale = useLocaleStore((s) => s.initialize);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    Promise.all([initialize(), initLocale()]);
  }, [initialize, initLocale]);

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuth) router.replace('/(auth)/login');
    if (isAuthenticated && inAuth) router.replace('/(app)');
  }, [isAuthenticated, isLoading, segments, router]);

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="(settings)" />
      </Stack>
    </ThemeProvider>
  );
}
