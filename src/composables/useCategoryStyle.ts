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
  'AI 辅助': { bg: '#f3e8ff', color: '#9333ea', darkBg: '#3b0764', darkColor: '#d8b4fe' },
  'API 测试': { bg: '#fff7ed', color: '#ea580c', darkBg: '#431407', darkColor: '#fdba74' },
  'PDF 工具': { bg: '#fff0e6', color: '#c75100', darkBg: '#4a2815', darkColor: '#ffb380' },
  '图片工具': { bg: '#e6f7ff', color: '#0066cc', darkBg: '#0f2d47', darkColor: '#74c0fc' },
  '文档工具': { bg: '#f6ffed', color: '#389e0d', darkBg: '#1a3a1a', darkColor: '#95de64' },
  '文档处理': { bg: '#f0f9ff', color: '#0284c7', darkBg: '#0c4a6e', darkColor: '#7dd3fc' },
  '开发工具': { bg: '#fff2f0', color: '#cf1322', darkBg: '#4a1a1a', darkColor: '#ff9c9c' },
  '文本处理': { bg: '#fffbe6', color: '#d48806', darkBg: '#4a3a12', darkColor: '#ffd666' },
  '文本工具': { bg: '#fffbeb', color: '#b45309', darkBg: '#451a03', darkColor: '#fcd34d' },
  '数据可视化': { bg: '#e6fffb', color: '#08979c', darkBg: '#0a3a3a', darkColor: '#5cdbd3' },
  '数据工具': { bg: '#ecfeff', color: '#0e7490', darkBg: '#083344', darkColor: '#67e8f9' },
  '数据库工具': { bg: '#f0f9ff', color: '#0369a1', darkBg: '#0c4a6e', darkColor: '#7dd3fc' },
  '编码转换': { bg: '#f0f5ff', color: '#1d39c4', darkBg: '#151c4a', darkColor: '#85a5ff' },
  '编码工具': { bg: '#eef2ff', color: '#4338ca', darkBg: '#1e1b4b', darkColor: '#a5b4fc' },
  '网络工具': { bg: '#e6f4ff', color: '#0958d9', darkBg: '#0f274a', darkColor: '#74a9ff' },
  '加密安全': { bg: '#f2f0ff', color: '#531dab', darkBg: '#24133d', darkColor: '#b39ddb' },
  '安全工具': { bg: '#fefce8', color: '#a16207', darkBg: '#422006', darkColor: '#fde047' },
  '设计工具': { bg: '#fff0f6', color: '#c41d7f', darkBg: '#4a1a33', darkColor: '#ffadd2' },
  '生活工具': { bg: '#e8f5e9', color: '#2e7d32', darkBg: '#1a3a1a', darkColor: '#a5d6a7' },
  '生活计算': { bg: '#f0fdf4', color: '#16a34a', darkBg: '#14532d', darkColor: '#86efac' },
  '计算工具': { bg: '#e3f2fd', color: '#1565c0', darkBg: '#0d2a47', darkColor: '#90caf9' },
  '视频工具': { bg: '#fce4ec', color: '#ad1457', darkBg: '#4a1a2e', darkColor: '#f48fb1' },
  '音频工具': { bg: '#e0f7fa', color: '#00838f', darkBg: '#0a3338', darkColor: '#80deea' },
  '音视频处理': { bg: '#fdf4ff', color: '#a21caf', darkBg: '#3b0a40', darkColor: '#e879f9' },
  '游戏工具': { bg: '#f3e5f5', color: '#6a1b9a', darkBg: '#2a1538', darkColor: '#ce93d8' },
  '游戏开发': { bg: '#faf5ff', color: '#7c3aed', darkBg: '#2e1065', darkColor: '#c4b5fd' },
  '教育工具': { bg: '#e8eaf6', color: '#283593', darkBg: '#151a3d', darkColor: '#9fa8da' },
  '教育学习': { bg: '#eef2ff', color: '#3730a3', darkBg: '#1e1b4b', darkColor: '#a5b4fc' },
  'SEO 工具': { bg: '#e0f2f1', color: '#00695c', darkBg: '#0a2e2a', darkColor: '#80cbc4' },
  '站长工具': { bg: '#f0fdfa', color: '#0d9488', darkBg: '#042f2e', darkColor: '#5eead4' },
  '运维工具': { bg: '#f1f5f9', color: '#475569', darkBg: '#1e293b', darkColor: '#94a3b8' },
  '办公工具': { bg: '#fff7ed', color: '#c2410c', darkBg: '#431407', darkColor: '#fdba74' },
  '日期时间': { bg: '#fff1f2', color: '#be123c', darkBg: '#4c0519', darkColor: '#fda4af' },
  '生成器': { bg: '#f0fdf4', color: '#15803d', darkBg: '#14532d', darkColor: '#86efac' },
  '其他': { bg: '#f5f5f5', color: '#595959', darkBg: '#2a2a2a', darkColor: '#a6a6a6' },
}

export const categoryIcons: Record<string, string> = {
  'AI 工具': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 12 2.5 12"/><path d="M12 12v9.5"/><circle cx="17" cy="7" r="1.5"/><path d="M17 5.5V4"/><path d="M18.5 7H20"/></svg>',
  'AI 辅助': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5z"/><path d="M19 16v3"/><path d="M17.5 17.5h3"/></svg>',
  'API 测试': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/><line x1="9" y1="6" x2="15" y2="6"/><line x1="6" y1="9" x2="6" y2="15"/><line x1="18" y1="9" x2="18" y2="15"/><line x1="9" y1="18" x2="15" y2="18"/></svg>',
  'PDF 工具': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M9 13h1.5a1 1 0 0 1 0 2H9z"/><path d="M9 15v2"/><path d="M14 13v4"/><path d="M14 13h1.5"/><path d="M14 15h1"/></svg>',
  '图片工具': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/><path d="M17 3l4 4"/><path d="M19 5l-2 2"/></svg>',
  '文档工具': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>',
  '文档处理': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13l2 2 4-4"/><path d="M8 17l2 2 4-4"/></svg>',
  '开发工具': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/><line x1="13" y1="4" x2="11" y2="20"/></svg>',
  '文本处理': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/><path d="M8 20l-2 2"/><path d="M16 20l2 2"/></svg>',
  '文本工具': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>',
  '数据可视化': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6" rx="0.5"/><rect x="12" y="8" width="3" height="10" rx="0.5"/><rect x="17" y="5" width="3" height="13" rx="0.5"/><path d="M7 10l5-3 5 2"/></svg>',
  '数据工具': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
  '数据库工具': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v6c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 11v6c0 1.66 4 3 9 3s9-1.34 9-3v-6"/><path d="M9 9l2 2 4-4"/></svg>',
  '编码转换': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 11 21 7 17 3"/><polyline points="7 13 3 17 7 21"/><line x1="21" y1="7" x2="9" y2="7"/><line x1="3" y1="17" x2="15" y2="17"/><path d="M12 12l3 3"/><path d="M15 12l-3 3"/></svg>',
  '编码工具': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  '网络工具': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M8 8l4 4 4-4"/><path d="M8 16l4-4 4 4"/></svg>',
  '加密安全': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1.5"/><line x1="12" y1="17.5" x2="12" y2="19"/></svg>',
  '安全工具': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6z"/><path d="M9 12l2 2 4-4"/><path d="M12 2v0"/></svg>',
  '设计工具': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.047a1.55 1.55 0 0 1 1.648-1.562c1.313 0 2.375-1.062 2.375-2.375s-1.062-2.375-2.375-2.375a1.55 1.55 0 0 1-1.648-1.562c0-.395.148-.758.438-1.047.257-.29.437-.688.437-1.125C13.648 2.746 12.926 2 12 2z"/></svg>',
  '生活工具': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/><path d="M12 4l1 2"/><path d="M12 4l-1 2"/></svg>',
  '生活计算': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><path d="M8 10h.01"/><path d="M12 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h4"/></svg>',
  '计算工具': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="16" y1="14" x2="16" y2="14.01"/><path d="M8 14h.01"/><path d="M8 18h.01"/><path d="M16 18h.01"/><path d="M12 10l2 2"/><path d="M14 10l-2 2"/></svg>',
  '视频工具': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="14" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>',
  '音频工具': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><path d="M3 12v2"/><path d="M21 10v2"/></svg>',
  '音视频处理': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><polygon points="10 8 15 5 15 11 10 8"/><path d="M2 10v4"/></svg>',
  '游戏工具': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><rect x="2" y="6" width="20" height="12" rx="2"/></svg>',
  '游戏开发': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><circle cx="15" cy="13" r="0.5"/><circle cx="18" cy="11" r="0.5"/><path d="M12 2v4"/><path d="M10 4h4"/></svg>',
  '教育工具': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>',
  '教育学习': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M9 7h6"/><path d="M9 11h4"/><circle cx="16" cy="11" r="0.5"/></svg>',
  'SEO 工具': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/><path d="M9 9l4 4"/><path d="M13 9l-4 4"/></svg>',
  '站长工具': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M8 8l4 4 4-4"/><path d="M8 16l4-4 4 4"/></svg>',
  '运维工具': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="6" rx="1"/><rect x="2" y="15" width="20" height="6" rx="1"/><circle cx="6" cy="6" r="0.5"/><circle cx="6" cy="18" r="0.5"/><path d="M10 6h8"/><path d="M10 18h8"/><path d="M12 9v6"/><path d="M10 12h4"/></svg>',
  '办公工具': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/><line x1="15" y1="9" x2="15" y2="21"/><path d="M5 5h2"/><path d="M5 7h2"/></svg>',
  '日期时间': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/></svg>',
  '生成器': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3l3 4h8l3-4"/><path d="M5 21l3-4h8l3 4"/><rect x="7" y="7" width="10" height="10" rx="1"/><circle cx="10" cy="10" r="0.5"/><circle cx="14" cy="10" r="0.5"/><circle cx="10" cy="14" r="0.5"/><circle cx="14" cy="14" r="0.5"/></svg>',
  '其他': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>',
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
