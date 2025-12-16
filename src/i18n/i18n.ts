import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { AppLang } from './lang';

import en from '../locales/en/common.json';
import cs from '../locales/cs/common.json';
import de from '../locales/de/common.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    cs: { translation: cs },
    de: { translation: de },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export function changeLanguage(lang: AppLang) {
  i18n.changeLanguage(lang);
}

export default i18n;
