import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { configureDataService, AuthService, AuthError } from '@/services/DataService';

const TOKEN_KEYS = { access: 'seacube_access', refresh: 'seacube_refresh' };

async function storeGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return localStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

async function storeSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') { localStorage.setItem(key, value); return; }
  await SecureStore.setItemAsync(key, value);
}

async function storeDel(key: string): Promise<void> {
  if (Platform.OS === 'web') { localStorage.removeItem(key); return; }
  await SecureStore.deleteItemAsync(key);
}

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

export const useAuthStore = create<AuthState>((set) => {
  configureDataService({
    getAccessToken: () => storeGet(TOKEN_KEYS.access),
    getRefreshToken: () => storeGet(TOKEN_KEYS.refresh),
    setTokens: async (access, refresh) => {
      await storeSet(TOKEN_KEYS.access, access);
      await storeSet(TOKEN_KEYS.refresh, refresh);
    },
    clearTokens: async () => {
      await storeDel(TOKEN_KEYS.access);
      await storeDel(TOKEN_KEYS.refresh);
    },
  });

  return {
    user: null,
    isAuthenticated: false,
    isLoading: true,

    initialize: async () => {
      set({ isLoading: true });
      try {
        const access = await storeGet(TOKEN_KEYS.access);
        if (access) {
          const user = await AuthService.getMe() as User;
          set({ user, isAuthenticated: true });
        }
      } catch {
        await storeDel(TOKEN_KEYS.access);
        await storeDel(TOKEN_KEYS.refresh);
      } finally {
        set({ isLoading: false });
      }
    },

    login: async (username, password) => {
      await AuthService.login(username, password);
      const user = await AuthService.getMe() as User;
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
