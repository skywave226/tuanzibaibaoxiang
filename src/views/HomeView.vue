<template>
  <div class="home">
    <div class="home-header">
      <div v-if="activeCategory !== '__all__'" class="category-banner">
        <div
          class="category-banner-icon"
          :style="{
            background: getCategoryStyle(activeCategory).bg,
            color: getCategoryStyle(activeCategory).color,
          }"
          v-html="getCategoryIcon(activeCategory)"
        ></div>
        <div class="category-banner-info">
          <h1 class="category-banner-title">{{ translateCategory(activeCategory) }}</h1>
          <p class="category-banner-count">{{ t('home.tools_count', { count: displayTools.length }) }}</p>
        </div>
        <router-link to="/" class="category-banner-back">
          {{ t('home.view_all') }}
        </router-link>
      </div>
      <template v-else>
        <h1 class="text-2xl font-bold">{{ headerTitle }}</h1>
        <p class="text-gray-500 mt-2">{{ headerSubtitle }}</p>
      </template>
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
        <div v-if="activeCategory === '__all__'" class="tool-category">
          <n-tag
            size="small"
            :bordered="false"
            :style="{
              '--n-color': getCategoryStyle(tool.category).bg,
              '--n-text-color': getCategoryStyle(tool.category).color,
            }"
          >
            {{ translateCategory(tool.category) }}
          </n-tag>
        </div>
      </a>
    </div>
    <n-empty v-if="displayTools.length === 0" :description="t('home.no_results')" class="mt-16" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { NTag, NEmpty } from 'naive-ui'
import { tools } from '@/tools/registry'
import { getCategoryStyle, getCategoryIcon } from '@/composables/useCategoryStyle'

const route = useRoute()
const { t } = useI18n()
const baseUrl = import.meta.env.BASE_URL

function translateCategory(category: string) {
  return t(`categories.${category}`, category)
}

const activeCategory = computed(() => (route.query.category as string) || '__all__')
const searchQuery = computed(() => (route.query.q as string) || '')

const headerTitle = computed(() => {
  if (searchQuery.value) return t('home.search_result', { query: searchQuery.value })
  return t('home.title')
})

const headerSubtitle = computed(() => {
  const parts: string[] = []
  if (searchQuery.value) parts.push(t('home.filter_hint_keyword', { keyword: searchQuery.value }))
  if (parts.length) {
    return t('home.tool_count_filtered', { count: displayTools.value.length, filters: parts.join('，') })
  }
  return t('home.tool_count', { count: displayTools.value.length })
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
  margin-bottom: 16px;
}

.category-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
  border-radius: 16px;
  background: white;
  border: 1px solid #f0f0f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.dark .category-banner {
  background: #1e293b;
  border-color: #334155;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
}

.category-banner-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.category-banner-icon :deep(svg) {
  width: 26px;
  height: 26px;
}

.category-banner-info {
  flex: 1;
  min-width: 0;
}

.category-banner-title {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
  color: #333;
}

.dark .category-banner-title {
  color: #f1f5f9;
}

.category-banner-count {
  font-size: 13px;
  color: #888;
  margin-top: 2px;
}

.dark .category-banner-count {
  color: #94a3b8;
}

.category-banner-back {
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 500;
  color: #36ad6a;
  text-decoration: none;
  padding: 6px 12px;
  border-radius: 20px;
  background: rgba(54, 173, 106, 0.08);
  transition: background 0.2s;
}

.category-banner-back:hover {
  background: rgba(54, 173, 106, 0.15);
}

.dark .category-banner-back {
  color: #63e2b7;
  background: rgba(99, 226, 183, 0.12);
}

.dark .category-banner-back:hover {
  background: rgba(99, 226, 183, 0.2);
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
  .category-banner {
    padding: 14px 16px;
    gap: 12px;
  }

  .category-banner-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
  }

  .category-banner-icon :deep(svg) {
    width: 22px;
    height: 22px;
  }

  .category-banner-title {
    font-size: 16px;
  }

  .category-banner-back {
    padding: 5px 10px;
    font-size: 12px;
  }

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
