<template>
  <div
    class="term-card card"
    :class="{ 'is-today': isToday }"
    @click="$emit('select', term)"
  >
    <div class="term-header">
      <div class="term-name">{{ term.name }}</div>
      <div class="term-date">{{ formatDate(term.date) }}</div>
    </div>
    <div class="term-lunar text-xs text-amber-600 mb-1">
      {{ term.lunar.monthName }}{{ term.lunar.dayName }}
    </div>
    <div class="term-desc">{{ term.info.description }}</div>
  </div>
</template>

<script setup lang="ts">
import type { SolarTermWithDate } from '../composables/useSolarTerm'

defineProps<{
  term: SolarTermWithDate
  isToday?: boolean
}>()

defineEmits<{
  'select': [term: SolarTermWithDate]
}>()

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}
</script>

<style scoped>
.term-card {
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.term-card:hover {
  border-color: #36ad6a;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(54, 173, 106, 0.15);
}

.term-card.is-today {
  border-color: #f0a020;
  background: linear-gradient(135deg, #fff9e6 0%, #ffffff 100%);
}

.dark .term-card.is-today {
  background: linear-gradient(135deg, #3d3520 0%, #1e2a4a 100%);
}

.term-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.term-name {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.dark .term-name {
  color: #e0e0e0;
}

.term-date {
  font-size: 13px;
  color: #888;
}

.term-lunar {
  margin-bottom: 6px;
}

.term-desc {
  font-size: 12px;
  color: #666;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.dark .term-desc {
  color: #aaa;
}
</style>
