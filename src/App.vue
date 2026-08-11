<template>
  <n-config-provider :theme="theme" :theme-overrides="themeOverrides" :locale="naiveLocale" :date-locale="naiveDateLocale">
    <n-message-provider>
      <router-view />
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  NConfigProvider,
  NMessageProvider,
  zhCN,
  dateZhCN,
  enUS,
  dateEnUS,
  jaJP,
  dateJaJP,
  koKR,
  dateKoKR,
  ruRU,
  dateRuRU,
  frFR,
  dateFrFR,
  deDE,
  dateDeDE,
  esAR,
  dateEsAR,
  itIT,
  dateItIT,
  ptBR,
  datePtBR,
  zhTW,
  dateZhTW,
  darkTheme,
} from 'naive-ui'
import type { GlobalThemeOverrides } from 'naive-ui'
import { useDark } from '@/composables/useDark'
import { i18n, type SupportedLocale } from '@/i18n'

const { isDark } = useDark()
const theme = computed(() => (isDark.value ? darkTheme : null))

const FONT_STACK =
  "'Sora', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif"

const lightOverrides: GlobalThemeOverrides = {
  common: {
    fontFamily: FONT_STACK,
    borderRadius: '10px',
    borderRadiusSmall: '8px',
    primaryColor: '#2f9e5f',
    primaryColorHover: '#288a52',
    primaryColorPressed: '#247a47',
    primaryColorSuppl: '#2f9e5f',
    infoColor: '#3b82f6',
    borderColor: '#e7e9ee',
    dividerColor: '#ebedf0',
    textColorBase: '#1a2230',
    textColor1: '#1a2230',
    textColor2: '#4a5568',
    textColor3: '#6b7480',
    bodyColor: 'transparent',
    cardColor: '#ffffff',
    modalColor: '#ffffff',
    popoverColor: '#ffffff',
    tableHeaderColor: '#f7f8fa',
    inputColor: '#ffffff',
    actionColor: '#f4f6f8',
    tagColor: '#f4f6f8',
    hoverColor: '#f4f6f8',
  },
}

const darkOverrides: GlobalThemeOverrides = {
  common: {
    fontFamily: FONT_STACK,
    borderRadius: '10px',
    borderRadiusSmall: '8px',
    primaryColor: '#5bd6a0',
    primaryColorHover: '#6fe0b0',
    primaryColorPressed: '#4cc999',
    primaryColorSuppl: '#5bd6a0',
    borderColor: '#232d44',
    dividerColor: '#232d44',
    textColorBase: '#e8eef7',
    textColor1: '#e8eef7',
    textColor2: '#c2cdde',
    textColor3: '#8b97ac',
    bodyColor: 'transparent',
    cardColor: '#121a2b',
    modalColor: '#121a2b',
    popoverColor: '#161f33',
    tableHeaderColor: '#161f33',
    inputColor: '#161f33',
    actionColor: '#1c2740',
    tagColor: '#1c2740',
    hoverColor: '#1c2740',
  },
}

const themeOverrides = computed<GlobalThemeOverrides>(() =>
  isDark.value ? darkOverrides : lightOverrides,
)

const naiveLocales: Record<SupportedLocale, { locale: any; dateLocale: any }> = {
  'zh-CN': { locale: zhCN, dateLocale: dateZhCN },
  en: { locale: enUS, dateLocale: dateEnUS },
  es: { locale: esAR, dateLocale: dateEsAR },
  fr: { locale: frFR, dateLocale: dateFrFR },
  de: { locale: deDE, dateLocale: dateDeDE },
  ja: { locale: jaJP, dateLocale: dateJaJP },
  it: { locale: itIT, dateLocale: dateItIT },
  ko: { locale: koKR, dateLocale: dateKoKR },
  'zh-TW': { locale: zhTW, dateLocale: dateZhTW },
  ru: { locale: ruRU, dateLocale: dateRuRU },
  pt: { locale: ptBR, dateLocale: datePtBR },
}

const currentLocale = computed<SupportedLocale>(() => i18n.global.locale.value as SupportedLocale)
const naiveLocale = computed(() => naiveLocales[currentLocale.value].locale)
const naiveDateLocale = computed(() => naiveLocales[currentLocale.value].dateLocale)
</script>
