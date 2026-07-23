<template>
  <div class="home">
    <div class="home-header">
      <h1 class="text-2xl font-bold">{{ headerTitle }}</h1>
      <p class="text-gray-500 mt-2">共 {{ displayTools.length }} 个工具可用{{ filterHint }}</p>
    </div>
    <div class="tool-grid">
      <a
        v-for="tool in displayTools"
        :key="tool.path"
        :href="`${baseUrl}tools${tool.path}/`"
        class="tool-card"
      >
        <div
          class="tool-icon"
          :style="{
            background: getCategoryStyle(tool.category).bg,
            color: getCategoryStyle(tool.category).color,
          }"
          v-html="tool.icon"
        ></div>
        <div class="tool-info">
          <div class="tool-name">{{ tool.name }}</div>
          <div class="tool-desc">{{ tool.description }}</div>
        </div>
        <div class="tool-category">
          <n-tag
            size="small"
            :bordered="false"
            :style="{
              '--n-color': getCategoryStyle(tool.category).bg,
              '--n-text-color': getCategoryStyle(tool.category).color,
            }"
          >
            {{ tool.category }}
          </n-tag>
        </div>
      </a>
    </div>
    <n-empty v-if="displayTools.length === 0" description="没有找到匹配的工具" class="mt-16" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { NTag, NEmpty } from 'naive-ui'
import { tools } from '@/tools/registry'

const route = useRoute()
const baseUrl = import.meta.env.BASE_URL

const categoryColors: Record<string, { bg: string; color: string; darkBg: string; darkColor: string }> = {
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

function getCategoryStyle(category: string) {
  return categoryColors[category] || categoryColors['其他']
}

const activeCategory = computed(() => (route.query.category as string) || '__all__')
const searchQuery = computed(() => (route.query.q as string) || '')

const headerTitle = computed(() => {
  if (searchQuery.value) return `搜索 "${searchQuery.value}" 的结果`
  if (activeCategory.value !== '__all__') return activeCategory.value
  return '在线工具集合'
})

const filterHint = computed(() => {
  const parts: string[] = []
  if (activeCategory.value !== '__all__') parts.push(`分类：${activeCategory.value}`)
  if (searchQuery.value) parts.push(`关键词：${searchQuery.value}`)
  return parts.length ? `（${parts.join('，')}）` : ''
})

const displayTools = computed(() => {
  let list = tools

  // 分类筛选
  if (activeCategory.value !== '__all__') {
    list = list.filter(t => t.category === activeCategory.value)
  }

  // 关键词搜索（匹配名称、描述、关键词）
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter(t => {
      const inName = t.name.toLowerCase().includes(q)
      const inDesc = t.description.toLowerCase().includes(q)
      const inKeywords = t.keywords.some(k => k.toLowerCase().includes(q))
      return inName || inDesc || inKeywords
    })
  }

  return list
})
</script>

<style scoped>
.home-header {
  margin-bottom: 24px;
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
  gap: 14px;
}

@media (min-width: 769px) {
  .tool-grid {
    gap: 18px;
  }
}

.tool-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border-radius: 16px;
  background: white;
  text-decoration: none;
  color: inherit;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  border: 1px solid transparent;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.tool-card:hover {
  border-color: currentColor;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  transform: translateY(-3px) scale(1.01);
}

.dark .tool-card {
  background: #1e293b;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
}

.dark .tool-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

.tool-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.25s;
}

.tool-card:hover .tool-icon {
  transform: scale(1.08) rotate(-3deg);
}

.dark .tool-name {
  color: #f1f5f9;
}

.dark .tool-desc {
  color: #94a3b8;
}

.tool-info {
  flex: 1;
  min-width: 0;
}

.tool-name {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
}

.tool-desc {
  font-size: 12px;
  color: #888;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tool-category {
  flex-shrink: 0;
  max-width: 80px;
  overflow: hidden;
}

.tool-category :deep(.n-tag__content) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

/* 移动端：单列卡片、更大触摸区域 */
@media (max-width: 640px) {
  .tool-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .tool-card {
    padding: 14px;
    min-height: 64px;
  }

  .tool-category {
    display: none;
  }
}

@media (max-width: 480px) {
  .home-header h1 {
    font-size: 1.25rem;
  }

  .home-header p {
    font-size: 0.875rem;
  }

  .tool-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
  }

  .tool-card {
    padding: 12px;
    gap: 12px;
  }

  .tool-name {
    font-size: 14px;
  }

  .tool-desc {
    font-size: 12px;
  }
}
</style>
