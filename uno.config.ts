import { defineConfig, presetUno } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
  ],
  shortcuts: {
    'btn': 'px-4 py-2 rounded-lg cursor-pointer inline-flex items-center gap-2',
    'card': 'p-4 rounded-lg bg-white dark:bg-gray-800 shadow-sm',
  },
})
