<template>
  <div class="tool-view">
    <div class="tool-header" v-if="meta">
      <n-breadcrumb>
        <n-breadcrumb-item>
          <router-link to="/">{{ t('nav.home') }}</router-link>
        </n-breadcrumb-item>
        <n-breadcrumb-item>{{ meta.name }}</n-breadcrumb-item>
      </n-breadcrumb>
      <h2 class="tool-title">{{ meta.name }}</h2>
      <p class="tool-desc">{{ meta.description }}</p>
    </div>
    <div class="tool-content mt-4">
      <component :is="toolComponent" v-if="toolComponent" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { NBreadcrumb, NBreadcrumbItem } from 'naive-ui'
import { getToolByPath, localizeTool } from '@/tools/registry'
import type { SupportedLocale } from '@/i18n'

const route = useRoute()
const { locale, t } = useI18n()

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
</script>

<style scoped>
.tool-view {
  max-width: 100%;
  min-width: 0;
}

.tool-header {
  animation: fade-in 0.4s var(--ease) both;
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

.tool-title {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.25;
  color: var(--text);
  margin-top: 12px;
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

@media (max-width: 640px) {
  .tool-title {
    font-size: 1.125rem;
  }

  .tool-desc {
    font-size: 0.8125rem;
  }
}
</style>
