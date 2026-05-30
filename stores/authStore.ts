import { create } from 'zustand';
import { configureDataService, AuthService } from '@/services/DataService';
import { storageGet, storageSet, storageDel } from '@/utils/storage';

const TOKEN_KEYS = { access: 'seacube_access', refresh: 'seacube_refresh' };

type User = { id: number; username: string; email: string; first_name: string; last_name: string; role?: unknown };

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialize: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => {
  configureDataService({
    getAccessToken: () => storageGet(TOKEN_KEYS.access),
    getRefreshToken: () => storageGet(TOKEN_KEYS.refresh),
    setTokens: async (access, refresh) => {
      await storageSet(TOKEN_KEYS.access, access);
      await storageSet(TOKEN_KEYS.refresh, refresh);
    },
    clearTokens: async () => {
      await storageDel(TOKEN_KEYS.access);
      await storageDel(TOKEN_KEYS.refresh);
    },
  });

  return {
    user: null,
    isAuthenticated: false,
    isLoading: true,

    initialize: async () => {
      set({ isLoading: true });
      try {
        const access = await storageGet(TOKEN_KEYS.access);
        if (access) {
          const user = await AuthService.getMe() as User;
          set({ user, isAuthenticated: true });
        }
      } catch {
        await get().logout();
      } finally {
        set({ isLoading: false });
      }
    },

    login: async (username, password) => {
      const user = await AuthService.login(username, password) as User;
      set({ user, isAuthenticated: true });
    },

    logout: async () => {
      await AuthService.logout();
      set({ user: null, isAuthenticated: false });
    },

    fetchMe: async () => {
      const user = await AuthService.getMe() as User;
      set({ user });
    },
  };
});
