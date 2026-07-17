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
        <div class="tool-icon" v-html="tool.icon"></div>
        <div class="tool-info">
          <div class="tool-name">{{ tool.name }}</div>
          <div class="tool-desc">{{ tool.description }}</div>
        </div>
        <div class="tool-category">
          <n-tag size="small" :bordered="false">{{ tool.category }}</n-tag>
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
  gap: 12px;
}

@media (min-width: 769px) {
  .tool-grid {
    gap: 16px;
  }
}

.tool-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  background: white;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.tool-card:hover {
  border-color: #36ad6a;
  box-shadow: 0 2px 12px rgba(54, 173, 106, 0.1);
  transform: translateY(-2px);
}

.dark .tool-card {
  background: #1e2a4a;
}

.dark .tool-card:hover {
  border-color: #63e2b7;
  box-shadow: 0 2px 12px rgba(99, 226, 183, 0.1);
}

.tool-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: #f0f9eb;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #36ad6a;
}

.dark .tool-icon {
  background: #1a3a2a;
  color: #63e2b7;
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
}

/* 移动端：缩小标题与图标 */
@media (max-width: 480px) {
  .home-header h1 {
    font-size: 1.25rem;
  }

  .tool-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
  }

  .tool-card {
    padding: 10px;
    gap: 8px;
  }

  .tool-name {
    font-size: 13px;
  }

  .tool-desc {
    font-size: 11px;
  }
}
</style>
