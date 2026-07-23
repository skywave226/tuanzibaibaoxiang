import { h } from 'vue'
import { NIcon } from 'naive-ui'

export interface CategoryStyle {
  bg: string
  color: string
  darkBg: string
  darkColor: string
}

export const categoryColors: Record<string, CategoryStyle> = {
  'AI 工具': { bg: '#f0e6ff', color: '#7b2cbf', darkBg: '#2d1b4e', darkColor: '#c77dff' },
  'PDF 工具': { bg: '#fff0e6', color: '#c75100', darkBg: '#4a2815', darkColor: '#ffb380' },
  '图片工具': { bg: '#e6f7ff', color: '#0066cc', darkBg: '#0f2d47', darkColor: '#74c0fc' },
  '文档工具': { bg: '#f6ffed', color: '#389e0d', darkBg: '#1a3a1a', darkColor: '#95de64' },
  '开发工具': { bg: '#fff2f0', color: '#cf1322', darkBg: '#4a1a1a', darkColor: '#ff9c9c' },
  '文本工具': { bg: '#fffbe6', color: '#d48806', darkBg: '#4a3a12', darkColor: '#ffd666' },
  '数据工具': { bg: '#e6fffb', color: '#08979c', darkBg: '#0a3a3a', darkColor: '#5cdbd3' },
  '编码工具': { bg: '#f0f5ff', color: '#1d39c4', darkBg: '#151c4a', darkColor: '#85a5ff' },
  '网络工具': { bg: '#e6f4ff', color: '#0958d9', darkBg: '#0f274a', darkColor: '#74a9ff' },
  '加密安全': { bg: '#f2f0ff', color: '#531dab', darkBg: '#24133d', darkColor: '#b39ddb' },
  '设计工具': { bg: '#fff0f6', color: '#c41d7f', darkBg: '#4a1a33', darkColor: '#ffadd2' },
  '生活工具': { bg: '#e8f5e9', color: '#2e7d32', darkBg: '#1a3a1a', darkColor: '#a5d6a7' },
  '计算工具': { bg: '#e3f2fd', color: '#1565c0', darkBg: '#0d2a47', darkColor: '#90caf9' },
  '视频工具': { bg: '#fce4ec', color: '#ad1457', darkBg: '#4a1a2e', darkColor: '#f48fb1' },
  '音频工具': { bg: '#e0f7fa', color: '#00838f', darkBg: '#0a3338', darkColor: '#80deea' },
  '游戏工具': { bg: '#f3e5f5', color: '#6a1b9a', darkBg: '#2a1538', darkColor: '#ce93d8' },
  '教育工具': { bg: '#e8eaf6', color: '#283593', darkBg: '#151a3d', darkColor: '#9fa8da' },
  'SEO 工具': { bg: '#e0f2f1', color: '#00695c', darkBg: '#0a2e2a', darkColor: '#80cbc4' },
  '其他': { bg: '#f5f5f5', color: '#595959', darkBg: '#2a2a2a', darkColor: '#a6a6a6' },
}

export const categoryIcons: Record<string, string> = {
  'AI 工具': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 12 2.5 12"/><path d="M12 12v9.5"/></svg>',
  'PDF 工具': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>',
  '图片工具': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
  '文档工具': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>',
  '开发工具': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  '文本工具': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>',
  '数据工具': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
  '编码工具': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  '网络工具': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
  '加密安全': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  '设计工具': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
  '生活工具': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  '计算工具': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="16" y1="14" x2="16" y2="14.01"/><path d="M8 14h.01"/><path d="M8 18h.01"/><path d="M16 18h.01"/></svg>',
  '视频工具': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="14" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>',
  '音频工具': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
  '游戏工具': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><rect x="2" y="6" width="20" height="12" rx="2"/></svg>',
  '教育工具': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>',
  'SEO 工具': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>',
  '其他': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>',
}

export function getCategoryStyle(category: string): CategoryStyle {
  return categoryColors[category] || categoryColors['其他']
}

export function getCategoryIcon(category: string): string {
  return categoryIcons[category] || categoryIcons['其他']
}

export function renderCategoryIcon(svg: string) {
  return () => h(NIcon, { innerHTML: svg })
}
