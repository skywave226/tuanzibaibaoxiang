import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN.json'
import en from './locales/en.json'
import es from './locales/es.json'
import fr from './locales/fr.json'
import de from './locales/de.json'
import ja from './locales/ja.json'
import it from './locales/it.json'
import ko from './locales/ko.json'
import zhTW from './locales/zh-TW.json'
import ru from './locales/ru.json'
import pt from './locales/pt.json'
import { categoryTranslations } from './categories'

export const SUPPORT_LOCALES = [
  { code: 'zh-CN', name: '中文（简体）' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'ja', name: '日本語' },
  { code: 'it', name: 'Italiano' },
  { code: 'ko', name: '한국어' },
  { code: 'zh-TW', name: '中文（繁體）' },
  { code: 'ru', name: 'Русский' },
  { code: 'pt', name: 'Português' },
] as const

export type SupportedLocale = (typeof SUPPORT_LOCALES)[number]['code']

const messages = {
  'zh-CN': { ...zhCN, categories: categoryTranslations['zh-CN'] },
  en: { ...en, categories: categoryTranslations.en },
  es: { ...es, categories: categoryTranslations.es },
  fr: { ...fr, categories: categoryTranslations.fr },
  de: { ...de, categories: categoryTranslations.de },
  ja: { ...ja, categories: categoryTranslations.ja },
  it: { ...it, categories: categoryTranslations.it },
  ko: { ...ko, categories: categoryTranslations.ko },
  'zh-TW': { ...zhTW, categories: categoryTranslations['zh-TW'] },
  ru: { ...ru, categories: categoryTranslations.ru },
  pt: { ...pt, categories: categoryTranslations.pt },
}

const STORAGE_KEY = 'tuanzi-locale'

function getInitialLocale(): SupportedLocale {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved && SUPPORT_LOCALES.some(l => l.code === saved)) {
    return saved as SupportedLocale
  }
  const browserLang = navigator.language
  if (browserLang.startsWith('zh')) {
    return browserLang === 'zh-TW' || browserLang === 'zh-HK' ? 'zh-TW' : 'zh-CN'
  }
  const matched = SUPPORT_LOCALES.find(l => browserLang.startsWith(l.code))
  return matched ? (matched.code as SupportedLocale) : 'zh-CN'
}

const initialLocale = getInitialLocale()

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: 'zh-CN',
  messages,
})

document.documentElement.lang = initialLocale

export function setLocale(locale: SupportedLocale) {
  i18n.global.locale.value = locale
  localStorage.setItem(STORAGE_KEY, locale)
  document.documentElement.lang = locale
}
