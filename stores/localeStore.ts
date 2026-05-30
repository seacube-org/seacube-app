import { create } from 'zustand';
import i18n from '@/locale/i18n';
import { storageGet, storageSet } from '@/utils/storage';

const LOCALE_KEY = 'seacube_locale';
const SUPPORTED = ['zh-Hans', 'en'] as const;
type Locale = typeof SUPPORTED[number];

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
      const stored = await storageGet(LOCALE_KEY);
      if (stored && SUPPORTED.includes(stored as Locale)) {
        i18n.locale = stored;
        set({ locale: stored as Locale });
      } else {
        const matched = SUPPORTED.includes(i18n.locale as Locale) ? i18n.locale as Locale : 'zh-Hans';
        set({ locale: matched });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  changeLocale: async (locale) => {
    i18n.locale = locale;
    await storageSet(LOCALE_KEY, locale);
    set({ locale });
  },
}));

export const useI18n = () => i18n;
