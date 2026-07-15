import type { ToolMeta } from '@/types/tool'

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
