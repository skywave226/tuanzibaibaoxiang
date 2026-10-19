<template>
  <div class="layout">
    <header class="layout-header">
      <div class="header-left">
        <n-button quaternary circle class="menu-toggle" @click="showSidebar = true">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </n-button>
        <router-link to="/" class="logo">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 100 100" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="layout-logo-grad" x1="0" y1="0" x2="100" y2="100">
                <stop offset="0%" stop-color="#36ad6a"/>
                <stop offset="100%" stop-color="#1e8e4e"/>
              </linearGradient>
            </defs>
            <rect width="100" height="100" rx="22" fill="url(#layout-logo-grad)"/>
            <path d="M28 38 V28 C28 22 33 17 39 17 H61 C67 17 72 22 72 28 V38" stroke="white" stroke-width="7" stroke-linecap="round"/>
            <rect x="17" y="38" width="66" height="43" rx="9" fill="white"/>
            <rect x="43" y="38" width="14" height="16" rx="3" fill="url(#layout-logo-grad)"/>
          </svg>
          <span class="font-bold text-lg logo-text">{{ t('nav.logo_text') }}</span>
        </router-link>
      </div>
      <div class="header-center" @focusin="searchOpen = true" @focusout="onSearchFocusOut">
        <n-input
          v-model:value="searchQuery"
          :placeholder="t('nav.search_placeholder')"
          clearable
          round
          class="search-input"
          @update:value="onSearchInput"
          @keydown="onSearchKeydown"
          @clear="onSearch('')"
        >
          <template #prefix>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </template>
          <template #suffix>
            <kbd v-if="!searchQuery" class="search-kbd">/</kbd>
          </template>
        </n-input>
        <nav v-if="searchOpen && searchSuggestions.length" class="search-suggestions" aria-label="工具搜索建议">
          <router-link
            v-for="tool in searchSuggestions"
            :key="tool.path"
            :to="tool.path"
            class="search-suggestion"
            @click="searchOpen = false"
          >
            <span>{{ tool.name }}</span>
            <span class="suggestion-category">{{ translateCategory(tool.category) }}</span>
          </router-link>
        </nav>
      </div>
      <div class="header-right">
        <n-select
          :value="currentLocale"
          :options="localeOptions"
          size="small"
          class="locale-select"
          :loading="localeLoading"
          @update:value="onLocaleChange"
        />
        <n-button quaternary circle @click="toggleDark">
          <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        </n-button>
      </div>
    </header>
    <div class="layout-body">
      <aside class="layout-sidebar">
        <div class="sidebar-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          <span>{{ t('nav.categories') }}</span>
        </div>
        <n-menu
          :options="menuOptions"
          :value="activeCategory"
          @update:value="onCategoryChange"
        />
      </aside>
      <main class="layout-main">
        <router-view />
      </main>
    </div>

    <!-- 移动端抽屉式侧边栏 -->
    <n-drawer v-model:show="showSidebar" :width="260" placement="left">
      <n-drawer-content :title="t('nav.categories')" closable>
        <n-menu
          :options="menuOptions"
          :value="activeCategory"
          @update:value="onCategoryChange"
        />
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { NInput, NButton, NMenu, NDrawer, NDrawerContent, NSelect } from 'naive-ui'
import { categories, categoryCounts, getLocalizedTools, loadToolLocale } from '@/tools/registry'
import { useDark } from '@/composables/useDark'
import { categoryIcons, renderCategoryIcon } from '@/composables/useCategoryStyle'
import { SUPPORT_LOCALES, setLocale, type SupportedLocale } from '@/i18n'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const { isDark, toggle: toggleDark } = useDark()
const searchQuery = ref('')
const searchOpen = ref(false)
const showSidebar = ref(false)
const localeLoading = ref(false)
const selectedCategory = ref('__all__')

function translateCategory(category: string) {
  return t(`categories.${category}`, category)
}

const localeOptions = computed(() =>
  SUPPORT_LOCALES.map(l => ({
    label: l.name,
    value: l.code,
  }))
)

const currentLocale = computed<SupportedLocale>(() => locale.value as SupportedLocale)

const searchSuggestions = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return []
  return getLocalizedTools(currentLocale.value)
    .filter(tool => tool.name.toLowerCase().includes(query)
      || tool.description.toLowerCase().includes(query)
      || tool.keywords.some(keyword => keyword.toLowerCase().includes(query)))
    .slice(0, 5)
})

async function onLocaleChange(value: SupportedLocale) {
  localeLoading.value = true
  try {
    await loadToolLocale(value)
    setLocale(value)
  } catch (error) {
    console.error('Tool translations could not be loaded', error)
  } finally {
    localeLoading.value = false
  }
}

const menuOptions = computed(() => {
  const allItem = {
    label: t('nav.all_tools'),
    key: '__all__',
    icon: renderCategoryIcon(categoryIcons['其他']),
  }
  const categoryItems = categories.map(c => ({
    label: `${translateCategory(c)} (${categoryCounts[c]})`,
    key: c,
    icon: renderCategoryIcon(categoryIcons[c] || categoryIcons['其他']),
  }))
  return [allItem, ...categoryItems]
})

// 从 URL query 同步当前激活分类
watch(() => route.query.category, (category) => {
  selectedCategory.value = typeof category === 'string' ? category : '__all__'
}, { immediate: true })

const activeCategory = computed(() => selectedCategory.value)

// 从 URL query 同步搜索词
watch(() => route.query.q, (q) => {
  searchQuery.value = typeof q === 'string' ? q : ''
}, { immediate: true })

function onCategoryChange(key: string) {
  // 立即更新本地选中态，避免路由异步导致高亮闪烁或丢失
  selectedCategory.value = key
  // 点击分类时跳转首页并带上分类参数
  router.push({ path: '/', query: { category: key === '__all__' ? undefined : key } })
  // 移动端：选择后关闭抽屉
  showSidebar.value = false
}

function onSearchKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    onSearch(searchQuery.value)
    searchOpen.value = false
  } else if (e.key === 'ArrowDown' && searchSuggestions.value.length) {
    e.preventDefault()
    document.querySelector<HTMLElement>('.search-suggestions a')?.focus()
  } else if (e.key === 'Escape') {
    searchOpen.value = false
  }
}

function onSearchInput(value: string) {
  searchOpen.value = true
  if (route.path === '/') onSearch(value)
}

function onSearchFocusOut(e: FocusEvent) {
  const container = e.currentTarget as HTMLElement
  if (!container.contains(e.relatedTarget as Node | null)) searchOpen.value = false
}

function onSearch(value: string) {
  // 搜索时跳转首页并带上搜索词
  if (route.path !== '/') {
    router.push({ path: '/', query: { q: value || undefined } })
  } else {
    router.replace({ query: { ...route.query, q: value || undefined, page: undefined } })
  }
}

// 全局键盘快捷键：按 / 聚焦搜索框
function onGlobalKeydown(e: KeyboardEvent) {
  if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
    e.preventDefault()
    const input = document.querySelector('.search-input .n-input__input-el') as HTMLInputElement | null
    input?.focus()
  }
}

onMounted(() => {
  document.addEventListener('keydown', onGlobalKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onGlobalKeydown)
})
</script>

<style scoped>
.layout {
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ===== 顶栏：毛玻璃 + 发丝边 ===== */
.layout-header {
  display: flex;
  align-items: center;
  padding: 0 22px;
  height: 62px;
  gap: 16px;
  background: color-mix(in srgb, var(--surface) 78%, transparent);
  backdrop-filter: saturate(180%) blur(14px);
  -webkit-backdrop-filter: saturate(180%) blur(14px);
  border-bottom: 1px solid var(--border);
  z-index: 10;
}

.header-left {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.menu-toggle {
  display: none;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--text);
  padding: 6px 10px;
  border-radius: var(--r-md);
  transition: background 0.2s var(--ease);
}

.logo:hover {
  background: var(--brand-soft);
}

.logo-text {
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.header-center {
  flex: 1;
  max-width: 520px;
  margin: 0 auto;
  position: relative;
}

.search-suggestions {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  z-index: 20;
  max-height: 280px;
  overflow-y: auto;
  padding: 6px;
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  background: var(--surface);
  box-shadow: var(--shadow-md);
}

.search-suggestion {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 9px 10px;
  border-radius: var(--r-sm);
  color: var(--text);
  text-decoration: none;
  font-size: 13px;
}

.search-suggestion:hover,
.search-suggestion:focus-visible {
  background: var(--brand-soft);
  outline: none;
}

.suggestion-category {
  color: var(--muted);
  font-size: 11px;
  white-space: nowrap;
}

:deep(.search-input .n-input__input-el) {
  font-size: 14px;
}

:deep(.search-input.n-input--focus) {
  box-shadow: 0 0 0 3px var(--brand-ring);
}

.search-kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  font-size: 11px;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-weight: 600;
  color: var(--faint);
  background: var(--surface-3);
  border: 1px solid var(--border);
  border-radius: 4px;
  line-height: 1;
  user-select: none;
}

.header-right {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.locale-select {
  width: 116px;
}

:deep(.locale-select .n-base-selection-input) {
  font-size: 13px;
}

@media (max-width: 768px) {
  .locale-select {
    width: 92px;
  }

  .search-kbd {
    display: none;
  }
}

/* ===== 主体布局 ===== */
.layout-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* ===== 侧边栏 ===== */
.layout-sidebar {
  width: 244px;
  flex-shrink: 0;
  padding: 18px 14px;
  overflow-y: auto;
  background: var(--surface);
  border-right: 1px solid var(--border);
}

.sidebar-title {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 8px 12px;
  margin-bottom: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--faint);
  border-bottom: 1px solid var(--border);
}

.sidebar-title svg {
  opacity: 0.7;
}

/* 菜单激活态：品牌色 + 左侧点睛条 */
:deep(.n-menu .n-menu-item-content) {
  border-radius: var(--r-sm);
  transition: background 0.18s var(--ease), color 0.18s var(--ease);
  position: relative;
}

:deep(.n-menu .n-menu-item-content):hover {
  background: var(--surface-3);
}

:deep(.n-menu .n-menu-item-content--selected) {
  background: var(--brand-soft);
  color: var(--brand);
  font-weight: 600;
}

:deep(.n-menu .n-menu-item-content--selected)::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 18px;
  border-radius: var(--r-pill);
  background: var(--brand);
}

:deep(.n-menu .n-menu-item-content--selected .n-icon) {
  color: var(--brand);
}

/* ===== 主内容区：透明，让 body 氛围透出 ===== */
.layout-main {
  flex: 1;
  overflow-y: auto;
  padding: 26px 24px;
  background: transparent;
}

@media (min-width: 1280px) {
  .layout-main {
    padding: 30px 28px;
  }
}

/* ===== 移动端 ===== */
@media (max-width: 768px) {
  .layout-header {
    padding: 0 12px;
    gap: 8px;
    height: 56px;
  }

  .menu-toggle {
    display: inline-flex;
  }

  .logo-text {
    display: none;
  }

  .layout-sidebar {
    display: none;
  }

  .layout-main {
    padding: 14px;
  }
}

@media (max-width: 480px) {
  .layout-header {
    padding: 0 8px;
  }

  .header-center {
    margin: 0;
  }

  .locale-select {
    width: 82px;
  }
}
</style>
