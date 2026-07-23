<template>
  <div class="tool-view">
    <div class="tool-header" v-if="meta">
      <n-breadcrumb>
        <n-breadcrumb-item>
          <router-link to="/">{{ t('nav.home') }}</router-link>
        </n-breadcrumb-item>
        <n-breadcrumb-item>{{ meta.name }}</n-breadcrumb-item>
      </n-breadcrumb>
      <h2 class="text-xl font-bold mt-3">{{ meta.name }}</h2>
      <p class="text-gray-500 text-sm mt-1">{{ meta.description }}</p>
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
.tool-header a {
  text-decoration: none;
  color: inherit;
}
</style>
