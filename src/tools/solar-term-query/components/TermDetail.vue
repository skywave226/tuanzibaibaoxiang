<template>
  <div class="term-detail card">
    <div class="detail-header">
      <div>
        <h2 class="text-2xl font-bold">{{ term.name }}</h2>
        <div class="text-gray-500 mt-1">
          {{ term.date }} · {{ term.lunar.yearGanZhi }}年 {{ term.lunar.yearShengXiao }}年
        </div>
        <div class="text-amber-600 text-sm mt-1">
          农历 {{ term.lunar.monthName }}{{ term.lunar.dayName }}
        </div>
      </div>
      <n-button quaternary circle @click="$emit('close')">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </n-button>
    </div>

    <div class="detail-content">
      <div class="detail-section">
        <h3 class="section-title">
          <span class=" mr-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></span>
          节气含义
        </h3>
        <p>{{ term.info.description }}</p>
      </div>

      <div class="detail-section">
        <h3 class="section-title">
          <span class=" mr-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
          传统习俗
        </h3>
        <p>{{ term.info.custom }}</p>
      </div>

      <div class="detail-section">
        <h3 class="section-title">
          <span class=" mr-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></span>
          养生建议
        </h3>
        <p>{{ term.info.health }}</p>
      </div>

      <div class="detail-section poem-section" v-if="term.poem">
        <h3 class="section-title">
          <span class=" mr-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></span>
          相关诗词
        </h3>
        <div class="poem-content">
          <div class="poem-title">{{ term.poem.title }}</div>
          <div class="poem-author">[{{ term.poem.dynasty }}] {{ term.poem.author }}</div>
          <pre class="poem-text">{{ term.poem.content }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NButton } from 'naive-ui'
import type { SolarTermWithDate } from '../composables/useSolarTerm'

defineProps<{
  term: SolarTermWithDate
}>()

defineEmits<{
  'close': []
}>()
</script>

<style scoped>
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e8e8e8;
}

.dark .detail-header {
  border-bottom-color: #2a2a4a;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-section {
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
}

.dark .detail-section {
  background: #1a1a2e;
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #36ad6a;
}

.detail-section p {
  font-size: 14px;
  line-height: 1.8;
  color: #555;
}

.dark .detail-section p {
  color: #ccc;
}

.poem-section {
  background: linear-gradient(135deg, #f0f9eb 0%, #f9f9f9 100%);
}

.dark .poem-section {
  background: linear-gradient(135deg, #1a3a2a 0%, #1a1a2e 100%);
}

.poem-content {
  text-align: center;
  padding: 8px 0;
}

.poem-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 4px;
  color: #333;
}

.dark .poem-title {
  color: #e0e0e0;
}

.poem-author {
  font-size: 13px;
  color: #888;
  margin-bottom: 12px;
}

.poem-text {
  font-size: 14px;
  line-height: 2;
  color: #555;
  font-family: 'STKaiti', 'KaiTi', 'SimSun', serif;
  white-space: pre-wrap;
  margin: 0;
}

.dark .poem-text {
  color: #ccc;
}
</style>
