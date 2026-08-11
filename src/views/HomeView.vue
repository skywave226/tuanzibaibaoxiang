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
        <div class="home-hero">
          <h1 class="hero-title">{{ headerTitle }}</h1>
          <p class="hero-sub">{{ headerSubtitle }}</p>
        </div>
      </template>
    </div>
    <div class="tool-grid">
      <div
        v-for="(tool, index) in displayTools"
        :key="tool.path"
        class="tool-card reveal"
        :style="{ animationDelay: `${Math.min(index, 18) * 28}ms` }"
        @click="goToTool(tool.path)"
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
      </div>
    </div>
    <n-empty v-if="displayTools.length === 0" :description="t('home.no_results')" class="mt-16" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { NTag, NEmpty } from 'naive-ui'
import { getLocalizedTools } from '@/tools/registry'
import { getCategoryStyle, getCategoryIcon } from '@/composables/useCategoryStyle'
import type { SupportedLocale } from '@/i18n'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()

function goToTool(path: string) {
  router.push(path)
}

const currentLocale = computed<SupportedLocale>(() => locale.value as SupportedLocale)
const localizedTools = computed(() => getLocalizedTools(currentLocale.value))

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
  let list = localizedTools.value

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
  margin-bottom: 22px;
}

/* ===== Hero ===== */
.home-hero {
  padding: 6px 2px 2px;
}

.hero-title {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.2;
  color: var(--text);
}

.hero-sub {
  margin-top: 8px;
  font-size: 14px;
  color: var(--muted);
  letter-spacing: 0.01em;
}

/* ===== 分类横幅 ===== */
.category-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
  border-radius: var(--r-lg);
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-xs);
}

.category-banner-icon {
  width: 52px;
  height: 52px;
  border-radius: var(--r-md);
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
  color: var(--text);
}

.category-banner-count {
  font-size: 13px;
  color: var(--muted);
  margin-top: 2px;
}

.category-banner-back {
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--brand);
  text-decoration: none;
  padding: 7px 14px;
  border-radius: var(--r-pill);
  background: var(--brand-soft);
  transition: background 0.2s var(--ease), transform 0.2s var(--ease);
}

.category-banner-back:hover {
  background: var(--brand-soft-2);
  transform: translateX(-2px);
}

/* ===== 工具网格 ===== */
.tool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
  gap: 14px;
}

@media (min-width: 769px) {
  .tool-grid {
    gap: 16px;
  }
}

.tool-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 15px 16px;
  border-radius: var(--r-lg);
  background: var(--surface);
  text-decoration: none;
  color: var(--text);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-xs);
  cursor: pointer;
  transition: transform 0.28s var(--ease-soft), box-shadow 0.28s var(--ease),
    border-color 0.28s var(--ease);
}

.tool-card:hover {
  border-color: var(--brand-soft-2);
  box-shadow: var(--shadow-md), 0 0 0 1px var(--brand-soft);
  transform: translateY(-3px);
}

.tool-icon {
  width: 46px;
  height: 46px;
  border-radius: var(--r-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.28s var(--ease-soft);
}

.tool-icon :deep(svg) {
  width: 22px;
  height: 22px;
}

.tool-card:hover .tool-icon {
  transform: scale(1.06);
}

.tool-info {
  flex: 1;
  min-width: 0;
}

.tool-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--text);
  margin-bottom: 4px;
  letter-spacing: -0.005em;
}

.tool-desc {
  font-size: 12px;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tool-category {
  flex-shrink: 0;
  max-width: 80px;
  overflow: hidden;
  pointer-events: none;
}

.tool-category :deep(.n-tag__content) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

/* ===== 移动端 ===== */
@media (max-width: 640px) {
  .category-banner {
    padding: 14px 16px;
    gap: 12px;
  }

  .category-banner-icon {
    width: 44px;
    height: 44px;
    border-radius: var(--r-sm);
  }

  .category-banner-icon :deep(svg) {
    width: 22px;
    height: 22px;
  }

  .category-banner-title {
    font-size: 16px;
  }

  .category-banner-back {
    padding: 6px 12px;
    font-size: 12px;
  }

  .tool-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .tool-card {
    min-height: 64px;
  }

  .tool-category {
    display: none;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 22px;
  }

  .hero-sub {
    font-size: 13px;
  }

  .tool-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--r-sm);
  }

  .tool-card {
    padding: 13px 14px;
    gap: 12px;
  }
}
</style>
