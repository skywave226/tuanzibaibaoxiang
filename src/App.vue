<template>
  <n-config-provider :theme="theme" :locale="zhCN" :date-locale="dateZhCN">
    <n-message-provider>
      <router-view />
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NConfigProvider, NMessageProvider, zhCN, dateZhCN, darkTheme } from 'naive-ui'
import { useDark } from '@/composables/useDark'

const { isDark } = useDark()
const theme = computed(() => isDark.value ? darkTheme : null)
</script>
