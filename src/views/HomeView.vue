<template>
  <div class="home">
    <div class="home-header">
      <!-- 分类筛选横幅 -->
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

      <!-- 首页 Hero -->
      <template v-else>
        <div class="home-hero">
          <h1 class="hero-title">{{ headerTitle }}</h1>
          <p class="hero-sub">{{ headerSubtitle }}</p>
        </div>

        <!-- 快捷分类胶囊（仅首页、无搜索时显示） -->
        <div v-if="!searchQuery" class="category-pills">
          <button
            v-for="cat in topCategories"
            :key="cat"
            class="category-pill"
            :style="{
              '--pill-color': getCategoryStyle(cat).color,
              '--pill-bg': getCategoryStyle(cat).bg,
            }"
            @click="goToCategory(cat)"
          >
            <span class="pill-icon" v-html="getCategoryIcon(cat)"></span>
            <span class="pill-label">{{ translateCategory(cat) }}</span>
            <span class="pill-count">{{ getToolCountByCategory(cat) }}</span>
          </button>
        </div>

        <!-- 最近使用 -->
        <div v-if="!searchQuery && recentTools.length > 0" class="recent-section">
          <div class="section-label">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>{{ t('home.recently_used') || '最近使用' }}</span>
          </div>
          <div class="recent-list">
            <div
              v-for="tool in recentTools"
              :key="tool.path"
              class="recent-item"
              @click="goToTool(tool.path)"
            >
              <span
                class="recent-dot"
                :style="{ background: getCategoryStyle(tool.category).color }"
              ></span>
              <span class="recent-name">{{ tool.name }}</span>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- 工具列表标题 -->
    <div v-if="!searchQuery && activeCategory === '__all__' && recentTools.length > 0" class="list-label">
      {{ t('home.all_tools') || '全部工具' }}
    </div>

    <!-- 工具网格 -->
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

    <!-- 空状态 -->
    <div v-if="displayTools.length === 0" class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <p class="empty-text">{{ t('home.no_results') }}</p>
    </div>

    <!-- 页脚 -->
    <footer v-if="activeCategory === '__all__' && !searchQuery" class="home-footer">
      <span>{{ t('home.tool_count', { count: displayTools.length }) }}</span>
      <span class="footer-dot">·</span>
      <span>{{ t('home.footer_hint') || '所有工具均在浏览器本地运行，数据不会上传服务器' }}</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { NTag } from 'naive-ui'
import { getLocalizedTools, categories, tools } from '@/tools/registry'
import { getCategoryStyle, getCategoryIcon } from '@/composables/useCategoryStyle'
import { getVisitStats, type VisitRecord } from '@/composables/useVisitStats'
import type { SupportedLocale } from '@/i18n'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()

function goToTool(path: string) {
  router.push(path)
}

function goToCategory(cat: string) {
  router.push({ path: '/', query: { category: cat } })
}

const currentLocale = computed<SupportedLocale>(() => locale.value as SupportedLocale)
const localizedTools = computed(() => getLocalizedTools(currentLocale.value))

function translateCategory(category: string) {
  return t(`categories.${category}`, category)
}

function getToolCountByCategory(cat: string) {
  return tools.filter(t => t.category === cat).length
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

  if (activeCategory.value !== '__all__') {
    list = list.filter(t => t.category === activeCategory.value)
  }

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

// 取前 8 个分类作为快捷入口
const topCategories = computed(() => categories.slice(0, 8))

// 最近访问工具
const recentVisits = ref<VisitRecord[]>([])

onMounted(() => {
  const stats = getVisitStats()
  // 去重，取最近 6 个
  const seen = new Set<string>()
  recentVisits.value = stats.recent.filter(v => {
    if (v.path === '/' || seen.has(v.path)) return false
    seen.add(v.path)
    return true
  }).slice(0, 6)
})

const recentTools = computed(() => {
  return recentVisits.value
    .map(v => localizedTools.value.find(t => t.path === v.path))
    .filter(Boolean)
    .slice(0, 6) as typeof localizedTools.value
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

/* ===== 快捷分类胶囊 ===== */
.category-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
}

.category-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: var(--r-pill);
  border: 1px solid var(--border);
  background: var(--surface);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-2);
  transition: all 0.2s var(--ease);
}

.category-pill:hover {
  border-color: var(--pill-color);
  background: var(--pill-bg);
  color: var(--pill-color);
  transform: translateY(-1px);
}

.pill-icon {
  display: flex;
  align-items: center;
}

.pill-icon :deep(svg) {
  width: 14px;
  height: 14px;
}

.pill-count {
  font-size: 11px;
  font-weight: 600;
  color: var(--faint);
  background: var(--surface-3);
  padding: 1px 6px;
  border-radius: var(--r-pill);
  transition: all 0.2s var(--ease);
}

.category-pill:hover .pill-count {
  background: var(--pill-bg);
  color: var(--pill-color);
}

/* ===== 最近使用 ===== */
.recent-section {
  margin-top: 22px;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.03em;
  color: var(--muted);
  margin-bottom: 10px;
}

.section-label svg {
  color: var(--faint);
}

.recent-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.recent-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: var(--r-sm);
  background: var(--surface);
  border: 1px solid var(--border);
  font-size: 13px;
  color: var(--text-2);
  cursor: pointer;
  transition: all 0.2s var(--ease);
}

.recent-item:hover {
  border-color: var(--brand-soft-2);
  background: var(--brand-soft);
  color: var(--brand);
}

.recent-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.recent-name {
  font-weight: 500;
}

/* ===== 列表标签 ===== */
.list-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--faint);
  margin: 26px 0 12px;
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

/* ===== 空状态 ===== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  color: var(--faint);
}

.empty-state svg {
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
  color: var(--muted);
}

/* ===== 页脚 ===== */
.home-footer {
  margin-top: 40px;
  padding: 20px 0 10px;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--faint);
}

.footer-dot {
  opacity: 0.5;
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

  .category-pills {
    gap: 6px;
  }

  .category-pill {
    padding: 6px 10px;
    font-size: 12px;
  }

  .recent-list {
    flex-direction: column;
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
