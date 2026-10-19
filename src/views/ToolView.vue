<template>
  <div class="tool-view">
    <div class="tool-header" v-if="meta">
      <div class="tool-header-top">
        <n-breadcrumb>
          <n-breadcrumb-item>
            <router-link to="/">{{ t('nav.home') }}</router-link>
          </n-breadcrumb-item>
          <n-breadcrumb-item v-if="meta.category">
            <router-link :to="{ path: '/', query: { category: meta.category } }">
              {{ translateCategory(meta.category) }}
            </router-link>
          </n-breadcrumb-item>
          <n-breadcrumb-item>{{ meta.name }}</n-breadcrumb-item>
        </n-breadcrumb>
      </div>
      <div class="tool-header-main">
        <div
          class="tool-header-icon"
          :style="{
            background: getCategoryStyle(meta.category || '').bg,
            color: getCategoryStyle(meta.category || '').color,
          }"
          v-html="meta.icon || getCategoryIcon(meta.category || '')"
        ></div>
        <div class="tool-header-text">
          <h2 class="tool-title">{{ meta.name }}</h2>
          <p class="tool-desc">{{ meta.description }}</p>
        </div>
      </div>
    </div>
    <div class="tool-content mt-4">
      <component :is="toolComponent" v-if="toolComponent" />
    </div>

    <!-- 相关工具推荐 -->
    <div v-if="relatedTools.length > 0" class="related-section">
      <div class="related-label">{{ t('home.related_tools') || '相关工具' }}</div>
      <div class="related-grid">
        <router-link
          v-for="tool in relatedTools"
          :key="tool.path"
          :to="tool.path"
          class="related-card"
        >
          <div
            class="related-icon"
            :style="{
              background: getCategoryStyle(tool.category).bg,
              color: getCategoryStyle(tool.category).color,
            }"
            v-html="tool.icon"
          ></div>
          <div class="related-info">
            <div class="related-name">{{ tool.name }}</div>
            <div class="related-desc">{{ tool.description }}</div>
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { NBreadcrumb, NBreadcrumbItem } from 'naive-ui'
import { getToolByPath, getLocalizedTools, localizeTool } from '@/tools/registry'
import { getCategoryStyle, getCategoryIcon } from '@/composables/useCategoryStyle'
import type { SupportedLocale } from '@/i18n'

const route = useRoute()
const { locale, t } = useI18n()

function translateCategory(category: string) {
  return t(`categories.${category}`, category)
}

const meta = computed(() => {
  const tool = getToolByPath(route.path as string)
  if (!tool) return undefined
  return localizeTool(tool, locale.value as SupportedLocale)
})

const toolComponent = shallowRef<any>(null)

watch(
  () => route.path,
  (path) => {
    const tool = getToolByPath(path)
    if (tool) {
      toolComponent.value = defineAsyncComponent(tool.component as any)
    } else {
      toolComponent.value = null
    }
  },
  { immediate: true },
)

// 相关工具：同分类下的其他工具，最多 4 个
const relatedTools = computed(() => {
  if (!meta.value?.category) return []
  const currentPath = route.path
  const allTools = getLocalizedTools(locale.value as SupportedLocale)
  return allTools
    .filter(t => t.category === meta.value!.category && t.path !== currentPath)
    .slice(0, 4)
})
</script>

<style scoped>
.tool-view {
  max-width: 100%;
  min-width: 0;
}

.tool-header {
  animation: fade-in 0.4s var(--ease) both;
}

.tool-header-top {
  margin-bottom: 14px;
}

.tool-header :deep(.n-breadcrumb) {
  font-size: 12.5px;
  color: var(--muted);
  letter-spacing: 0.01em;
}

.tool-header :deep(.n-breadcrumb__link) {
  color: var(--muted);
  transition: color 0.18s var(--ease);
}

.tool-header :deep(.n-breadcrumb__link:hover) {
  color: var(--brand);
}

.tool-header a {
  text-decoration: none;
  color: inherit;
}

.tool-header-main {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.tool-header-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--r-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tool-header-icon :deep(svg) {
  width: 24px;
  height: 24px;
}

.tool-header-text {
  flex: 1;
  min-width: 0;
}

.tool-title {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.25;
  color: var(--text);
  word-break: break-word;
}

.tool-desc {
  margin-top: 6px;
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--muted);
}

.tool-content {
  min-width: 0;
  overflow-x: hidden;
  margin-top: 18px;
}

/* ===== 相关工具 ===== */
.related-section {
  margin-top: 40px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
}

.related-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--faint);
  margin-bottom: 14px;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(240px, 100%), 1fr));
  gap: 12px;
}

.related-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--r-md);
  background: var(--surface);
  border: 1px solid var(--border);
  cursor: pointer;
  color: inherit;
  text-decoration: none;
  transition: all 0.2s var(--ease);
}

.related-card:hover {
  border-color: var(--brand-soft-2);
  box-shadow: var(--shadow-sm);
  transform: translateY(-2px);
}

.related-card:focus-visible {
  outline: 3px solid var(--brand);
  outline-offset: 3px;
}

.related-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--r-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.related-icon :deep(svg) {
  width: 18px;
  height: 18px;
}

.related-info {
  flex: 1;
  min-width: 0;
}

.related-name {
  font-weight: 600;
  font-size: 13px;
  color: var(--text);
  margin-bottom: 2px;
}

.related-desc {
  font-size: 11px;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 640px) {
  .tool-title {
    font-size: 1.125rem;
  }

  .tool-desc {
    font-size: 0.8125rem;
  }

  .tool-header-icon {
    width: 40px;
    height: 40px;
  }

  .related-grid {
    grid-template-columns: 1fr;
  }
}
</style>
