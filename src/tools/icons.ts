import { shallowRef } from 'vue'
import { getCategoryIcon } from '@/composables/useCategoryStyle'

const iconLoaders = import.meta.glob('../generated/tool-icons/*.json')
const loadedIcons = shallowRef<Record<string, Record<string, string>>>({})
const loading = new Map<string, Promise<void>>()

export function loadToolIcons(category: string): Promise<void> {
  if (loadedIcons.value[category]) return Promise.resolve()
  const pending = loading.get(category)
  if (pending) return pending
  const loader = iconLoaders[`../generated/tool-icons/${category}.json`]
  if (!loader) return Promise.reject(new Error(`Missing icons for ${category}`))
  const request = loader().then(module => {
    loadedIcons.value = {
      ...loadedIcons.value,
      [category]: (module as { default: Record<string, string> }).default,
    }
  }).finally(() => loading.delete(category))
  loading.set(category, request)
  return request
}

export function getToolIcon(path: string, category: string): string {
  return loadedIcons.value[category]?.[path] || getCategoryIcon(category)
}
