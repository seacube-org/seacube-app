import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import i18n from '@/locale/i18n';

const LOCALE_KEY = 'seacube_locale';
const SUPPORTED = ['zh-Hans', 'en'] as const;
type Locale = typeof SUPPORTED[number];

async function getStored(): Promise<string | null> {
  if (Platform.OS === 'web') return localStorage.getItem(LOCALE_KEY);
  return SecureStore.getItemAsync(LOCALE_KEY);
}

async function setStored(locale: string): Promise<void> {
  if (Platform.OS === 'web') { localStorage.setItem(LOCALE_KEY, locale); return; }
  await SecureStore.setItemAsync(LOCALE_KEY, locale);
}

type LocaleState = {
  locale: Locale;
  isLoading: boolean;
  initialize: () => Promise<void>;
  changeLocale: (locale: Locale) => Promise<void>;
};

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: 'zh-Hans',
  isLoading: true,

  initialize: async () => {
    set({ isLoading: true });
    try {
      const stored = await getStored();
      if (stored && SUPPORTED.includes(stored as Locale)) {
        i18n.locale = stored;
        set({ locale: stored as Locale });
      } else {
        i18n.locale = 'zh-Hans';
      }
    } finally {
      set({ isLoading: false });
    }
  },

  changeLocale: async (locale) => {
    i18n.locale = locale;
    await setStored(locale);
    set({ locale });
  },
}));

export const useI18n = () => i18n;
