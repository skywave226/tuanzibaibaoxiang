<template>
  <div class="year-selector card">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <n-button quaternary circle @click="$emit('prev')" :disabled="year <= 1900">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </n-button>
        <n-input-number
          :value="year"
          :min="1900"
          :max="2100"
          class="w-32"
          @update:value="$emit('update:year', $event ?? year)"
        />
        <n-button quaternary circle @click="$emit('next')" :disabled="year >= 2100">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </n-button>
      </div>
      <n-button size="small" @click="$emit('today')">
        <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span>
        今年
      </n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NButton, NInputNumber } from 'naive-ui'

defineProps<{
  year: number
}>()

defineEmits<{
  'update:year': [value: number]
  'prev': []
  'next': []
  'today': []
}>()
</script>
