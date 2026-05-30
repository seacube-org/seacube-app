import { useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { getViewSet, AuthError, ApiError } from '@/services/DataService';
import { useAuthStore } from '@/stores/authStore';
import { API_ENDPOINTS } from '@/constants/Constants';

export function useDataService() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  const handleError = useCallback(async (error: unknown) => {
    if (error instanceof AuthError) {
      await logout();
      router.replace('/login');
    }
    throw error;
  }, [logout, router]);

  const getViewSetSafe = useCallback((url: string) => {
    const vs = getViewSet(url);
    return {
      list: (...args: Parameters<typeof vs.list>) => vs.list(...args).catch(handleError),
      retrieve: (...args: Parameters<typeof vs.retrieve>) => vs.retrieve(...args).catch(handleError),
      create: (...args: Parameters<typeof vs.create>) => vs.create(...args).catch(handleError),
      update: (...args: Parameters<typeof vs.update>) => vs.update(...args).catch(handleError),
      delete: (...args: Parameters<typeof vs.delete>) => vs.delete(...args).catch(handleError),
      options: () => vs.options().catch(handleError),
      action: (...args: Parameters<typeof vs.action>) => vs.action(...args).catch(handleError),
    };
  }, [handleError]);

  return { getViewSet: getViewSetSafe, handleError, endpoints: API_ENDPOINTS };
}
