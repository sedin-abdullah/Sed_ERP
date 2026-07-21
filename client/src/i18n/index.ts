import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import pt from './locales/pt.json';
import ar from './locales/ar.json';
import zh from './locales/zh.json';
import hi from './locales/hi.json';
import ja from './locales/ja.json';

/** The nine supported languages. `dir: 'rtl'` flags Arabic for layout mirroring. */
export const LANGUAGES = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'es', label: 'Español', dir: 'ltr' },
  { code: 'fr', label: 'Français', dir: 'ltr' },
  { code: 'de', label: 'Deutsch', dir: 'ltr' },
  { code: 'pt', label: 'Português', dir: 'ltr' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },
  { code: 'zh', label: '中文', dir: 'ltr' },
  { code: 'hi', label: 'हिन्दी', dir: 'ltr' },
  { code: 'ja', label: '日本語', dir: 'ltr' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

const resources = {
  en: { translation: en }, es: { translation: es }, fr: { translation: fr },
  de: { translation: de }, pt: { translation: pt }, ar: { translation: ar },
  zh: { translation: zh }, hi: { translation: hi }, ja: { translation: ja },
};

/** Mirror the document direction + lang to the active language (RTL for Arabic). */
export function applyDirection(lang: string): void {
  const meta = LANGUAGES.find((l) => l.code === lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = meta?.dir ?? 'ltr';
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: LANGUAGES.map((l) => l.code),
    interpolation: { escapeValue: false },
    detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'], lookupLocalStorage: 'sederp-lang' },
  });

applyDirection(i18n.resolvedLanguage ?? 'en');
i18n.on('languageChanged', applyDirection);

export default i18n;
