import type { ToolMeta } from '@/types/tool'
import type { SupportedLocale } from '@/i18n'
import toolTranslations from '@/i18n/toolTranslations.json'

const toolModules = import.meta.glob('./**/index.vue')
const metaModules = import.meta.glob('./**/meta.ts', { eager: true })

export const tools: ToolMeta[] = Object.entries(metaModules)
  .filter(([path]) => path.endsWith('/meta.ts'))
  .map(([path, mod]) => {
    const meta = (mod as any).default
    const componentPath = path.replace('/meta.ts', '/index.vue')
    const loader = toolModules[componentPath]
    return {
      ...meta,
      component: loader,
    }
  })
  .sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category)
    return a.name.localeCompare(b.name)
  })

export const categories = [...new Set(tools.map(t => t.category))]

export function getToolByPath(path: string): ToolMeta | undefined {
  return tools.find(t => t.path === path)
}

export function searchTools(query: string): ToolMeta[] {
  const q = query.toLowerCase().trim()
  if (!q) return tools
  return tools.filter(t =>
    t.name.toLowerCase().includes(q) ||
    t.description.toLowerCase().includes(q) ||
    t.keywords.some(k => k.toLowerCase().includes(q))
  )
}

/** 获取单个工具的本地化元数据 */
export function localizeTool(tool: ToolMeta, locale: SupportedLocale): ToolMeta {
  if (locale === 'zh-CN') return tool
  const tr = (toolTranslations as Record<string, Partial<Record<SupportedLocale, { name?: string; description?: string; keywords?: string[] }>>>)[tool.path]?.[locale]
  if (!tr) return tool
  return {
    ...tool,
    name: tr.name || tool.name,
    description: tr.description || tool.description,
    keywords: tr.keywords?.length ? tr.keywords : tool.keywords,
  }
}

/** 获取指定语言的全部工具列表 */
export function getLocalizedTools(locale: SupportedLocale): ToolMeta[] {
  if (locale === 'zh-CN') return tools
  return tools.map(t => localizeTool(t, locale))
}
