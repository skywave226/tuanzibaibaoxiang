import { shallowRef } from 'vue'
import type { ToolMeta } from '@/types/tool'
import type { SupportedLocale } from '@/i18n'
import toolIndex from '../../scripts/tools-data.json'

type ToolTranslation = Pick<ToolMeta, 'name' | 'description' | 'keywords'>
type ToolTranslations = Record<string, ToolTranslation>

const toolModules = import.meta.glob('./**/index.vue')
const localeLoaders = import.meta.glob('../generated/tool-locales/*.json')
const localeData = shallowRef<Partial<Record<SupportedLocale, ToolTranslations>>>({})
const localePromises = new Map<SupportedLocale, Promise<void>>()
const localizedLists = new Map<SupportedLocale, ToolMeta[]>()

export const tools: ToolMeta[] = toolIndex.map(meta => {
  const loader = toolModules[`.${meta.path}/index.vue`]
  if (!loader) throw new Error(`Missing component for ${meta.path}`)
  return {
    ...meta,
    component: loader as ToolMeta['component'],
  }
})

const byPath = new Map(tools.map(tool => [tool.path, tool]))
export const categories = [...new Set(tools.map(tool => tool.category))]
export const categoryCounts: Record<string, number> = {}
for (const tool of tools) categoryCounts[tool.category] = (categoryCounts[tool.category] || 0) + 1

export function getToolByPath(path: string): ToolMeta | undefined {
  return byPath.get(path)
}

export function searchTools(query: string): ToolMeta[] {
  const q = query.toLowerCase().trim()
  if (!q) return tools
  return tools.filter(tool =>
    tool.name.toLowerCase().includes(q) ||
    tool.description.toLowerCase().includes(q) ||
    tool.keywords.some(keyword => keyword.toLowerCase().includes(q))
  )
}

export function loadToolLocale(locale: SupportedLocale): Promise<void> {
  if (locale === 'zh-CN' || localeData.value[locale]) return Promise.resolve()
  const existing = localePromises.get(locale)
  if (existing) return existing
  const loader = localeLoaders[`../generated/tool-locales/${locale}.json`]
  if (!loader) return Promise.reject(new Error(`Missing tool translations for ${locale}`))
  const pending = loader().then(module => {
    const translations = (module as { default: ToolTranslations }).default
    localeData.value = { ...localeData.value, [locale]: translations }
  }).finally(() => localePromises.delete(locale))
  localePromises.set(locale, pending)
  return pending
}

export function localizeTool(tool: ToolMeta, locale: SupportedLocale): ToolMeta {
  if (locale === 'zh-CN') return tool
  const data = localeData.value[locale]
  if (!data) {
    void loadToolLocale(locale).catch(error => console.error(error))
    return tool
  }
  const translated = data[tool.path]
  return translated ? { ...tool, ...translated } : tool
}

export function getLocalizedTools(locale: SupportedLocale): ToolMeta[] {
  if (locale === 'zh-CN') return tools
  const data = localeData.value[locale]
  if (!data) {
    void loadToolLocale(locale).catch(error => console.error(error))
    return tools
  }
  const existing = localizedLists.get(locale)
  if (existing) return existing
  const list = tools.map(tool => data[tool.path] ? { ...tool, ...data[tool.path] } : tool)
  localizedLists.set(locale, list)
  return list
}
