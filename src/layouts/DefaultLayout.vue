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
          <span class="font-bold text-lg logo-text">团子百宝箱</span>
        </router-link>
      </div>
      <div class="header-center">
        <n-input
          v-model:value="searchQuery"
          placeholder="搜索工具..."
          clearable
          round
          class="search-input"
          @update:value="onSearch"
        >
          <template #prefix>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </template>
        </n-input>
      </div>
      <div class="header-right">
        <n-button quaternary circle @click="toggleDark">
          <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        </n-button>
      </div>
    </header>
    <div class="layout-body">
      <aside class="layout-sidebar">
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
    <n-drawer v-model:show="showSidebar" :width="240" placement="left">
      <n-drawer-content title="工具分类" closable>
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
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NInput, NButton, NMenu, NDrawer, NDrawerContent } from 'naive-ui'
import { categories, tools } from '@/tools/registry'
import { useDark } from '@/composables/useDark'
import { categoryIcons, renderCategoryIcon } from '@/composables/useCategoryStyle'

const route = useRoute()
const router = useRouter()
const { isDark, toggle: toggleDark } = useDark()
const searchQuery = ref('')
const showSidebar = ref(false)
const selectedCategory = ref('__all__')

const menuOptions = computed(() => {
  const allItem = {
    label: '全部工具',
    key: '__all__',
    icon: renderCategoryIcon(categoryIcons['其他']),
  }
  const categoryItems = categories.map(c => ({
    label: `${c} (${tools.filter(t => t.category === c).length})`,
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

function onSearch(value: string) {
  // 搜索时跳转首页并带上搜索词
  if (route.path !== '/') {
    router.push({ path: '/', query: { q: value || undefined } })
  } else {
    router.replace({ query: { ...route.query, q: value || undefined } })
  }
}
</script>

<style scoped>
.layout {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.layout-header {
  display: flex;
  align-items: center;
  padding: 0 20px;
  height: 60px;
  background: white;
  border-bottom: 1px solid #e8e8e8;
  gap: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
}

.dark .layout-header {
  background: #1e293b;
  border-bottom-color: #334155;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
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
  color: inherit;
  padding: 6px 10px;
  border-radius: 10px;
  transition: background 0.2s;
}

.logo:hover {
  background: rgba(54, 173, 106, 0.08);
}

.dark .logo:hover {
  background: rgba(99, 226, 183, 0.1);
}

.logo-text {
  font-size: 18px;
  letter-spacing: -0.3px;
}

.header-center {
  flex: 1;
  max-width: 520px;
  margin: 0 auto;
}

:deep(.search-input .n-input__input-el) {
  font-size: 14px;
}

:deep(.search-input.n-input--focus) {
  box-shadow: 0 0 0 3px rgba(54, 173, 106, 0.15);
}

.dark :deep(.search-input.n-input--focus) {
  box-shadow: 0 0 0 3px rgba(99, 226, 183, 0.15);
}

.header-right {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.layout-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.layout-sidebar {
  width: 220px;
  flex-shrink: 0;
  padding: 16px 10px;
  overflow-y: auto;
  background: white;
  border-right: 1px solid #e8e8e8;
}

.dark .layout-sidebar {
  background: #1e293b;
  border-right-color: #334155;
}

/* 优化菜单选中态 */
:deep(.n-menu .n-menu-item-content--selected) {
  background: rgba(54, 173, 106, 0.1);
  border-radius: 8px;
  color: #36ad6a;
  font-weight: 600;
}

.dark :deep(.n-menu .n-menu-item-content--selected) {
  background: rgba(99, 226, 183, 0.12);
  color: #63e2b7;
}

:deep(.n-menu .n-menu-item-content):hover {
  border-radius: 8px;
}

:deep(.n-menu .n-menu-item-content--selected::before) {
  display: none;
}

.layout-main {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

@media (min-width: 1280px) {
  .layout-main {
    padding: 24px;
  }
}

/* 平板及以下：隐藏桌面侧边栏，显示汉堡按钮 */
@media (max-width: 768px) {
  .layout-header {
    padding: 0 12px;
    gap: 8px;
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
    padding: 12px;
  }
}

/* 超小屏：进一步压缩 */
@media (max-width: 480px) {
  .layout-header {
    padding: 0 8px;
  }

  .header-center {
    margin: 0;
  }
}
</style>
