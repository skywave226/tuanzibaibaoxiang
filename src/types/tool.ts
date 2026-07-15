import type { Component } from 'vue'

export interface ToolMeta {
  name: string
  path: string
  icon: string
  description: string
  category: string
  keywords: string[]
  component: Component
}
