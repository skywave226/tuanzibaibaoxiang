<template>
  <n-config-provider :theme="theme" :locale="naiveLocale" :date-locale="naiveDateLocale">
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
import { useDark } from '@/composables/useDark'
import { i18n, type SupportedLocale } from '@/i18n'

const { isDark } = useDark()
const theme = computed(() => isDark.value ? darkTheme : null)

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
