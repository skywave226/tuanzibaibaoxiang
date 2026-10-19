import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { i18n, type SupportedLocale } from './i18n'
import { loadToolLocale } from './tools/registry'
import 'virtual:uno.css'
import './styles/global.css'

loadToolLocale(i18n.global.locale.value as SupportedLocale)
  .catch(error => console.error('Tool translations could not be loaded', error))
  .finally(() => createApp(App).use(i18n).use(router).mount('#app'))
