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
import { ref, computed, watch, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NInput, NButton, NMenu, NDrawer, NDrawerContent, NIcon } from 'naive-ui'
import { categories, tools } from '@/tools/registry'
import { useDark } from '@/composables/useDark'

const route = useRoute()
const router = useRouter()
const { isDark, toggle: toggleDark } = useDark()
const searchQuery = ref('')
const showSidebar = ref(false)

const categoryIcons: Record<string, string> = {
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

function renderIcon(svg: string) {
  return () => h(NIcon, { innerHTML: svg })
}

const menuOptions = computed(() => {
  const allItem = {
    label: '全部工具',
    key: '__all__',
    icon: renderIcon(categoryIcons['其他']),
  }
  const categoryItems = categories.map(c => ({
    label: `${c} (${tools.filter(t => t.category === c).length})`,
    key: c,
    icon: renderIcon(categoryIcons[c] || categoryIcons['其他']),
  }))
  return [allItem, ...categoryItems]
})

// 从 URL query 同步当前激活分类
const activeCategory = computed(() => (route.query.category as string) || '__all__')

// 从 URL query 同步搜索词
watch(() => route.query.q, (q) => {
  searchQuery.value = typeof q === 'string' ? q : ''
}, { immediate: true })

function onCategoryChange(key: string) {
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
  padding: 24px;
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
