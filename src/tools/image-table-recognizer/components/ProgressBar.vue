<template>
  <div class="progress-bar card" v-if="loading">
    <div class="progress-header">
      <span class="text-sm font-medium">{{ label }}</span>
      <span class="text-sm text-gray-500">{{ progress }}%</span>
    </div>
    <div class="progress-track">
      <div class="progress-fill" :style="{ width: progress + '%' }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  loading: boolean
  progress: number
  label: string
}>()
</script>

<style scoped>
.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.progress-track {
  height: 8px;
  background: #e8e8e8;
  border-radius: 4px;
  overflow: hidden;
}

.dark .progress-track {
  background: #2a2a4a;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #36ad6a 0%, #63e2b7 100%);
  transition: width 0.3s ease;
  border-radius: 4px;
}
</style>
