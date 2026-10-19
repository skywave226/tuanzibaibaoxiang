import type { Component } from 'vue'

export interface ToolMeta {
  name: string
  path: string
  description: string
  category: string
  keywords: string[]
  component: () => Promise<{ default: Component }>
}
