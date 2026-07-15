<template>
  <div class="view-toggle card">
    <n-button-group>
      <n-button :type="view === 'list' ? 'primary' : 'default'" @click="$emit('update:view', 'list')">
        <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg></span>
        列表
      </n-button>
      <n-button :type="view === 'calendar' ? 'primary' : 'default'" @click="$emit('update:view', 'calendar')">
        <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span>
        日历
      </n-button>
    </n-button-group>
  </div>
</template>

<script setup lang="ts">
import { NButton, NButtonGroup } from 'naive-ui'

defineProps<{
  view: 'list' | 'calendar'
}>()

defineEmits<{
  'update:view': [view: 'list' | 'calendar']
}>()
</script>

<style scoped>
.view-toggle {
  display: flex;
  justify-content: flex-end;
  padding: 12px 16px;
}
</style>
