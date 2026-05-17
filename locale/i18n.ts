import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';

import en from './en.json';
import zhHans from './zh-Hans.json';

const i18n = new I18n({ en, 'zh-Hans': zhHans });

i18n.defaultLocale = 'zh-Hans';
i18n.enableFallback = true;
i18n.missingBehavior = 'guess';

const deviceLocale = getLocales()[0]?.languageCode ?? 'zh-Hans';
i18n.locale = deviceLocale === 'zh' ? 'zh-Hans' : deviceLocale;

export default i18n;
