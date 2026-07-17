<template>
  <div class="site-stats">
    <h2 class="text-xl font-bold mb-4">访问统计</h2>
    <p class="text-gray-500 mb-6">数据保存在浏览器本地，仅统计当前设备的访问记录。</p>

    <div class="stats-grid">
      <n-card class="stat-card">
        <div class="stat-value">{{ stats.total }}</div>
        <div class="stat-label">总访问量</div>
      </n-card>
      <n-card class="stat-card">
        <div class="stat-value">{{ stats.today }}</div>
        <div class="stat-label">今日访问</div>
      </n-card>
      <n-card class="stat-card">
        <div class="stat-value">{{ stats.uniqueTools }}</div>
        <div class="stat-label">访问过的工具</div>
      </n-card>
    </div>

    <n-card title="热门工具排行" class="mt-6">
      <n-empty v-if="stats.topTools.length === 0" description="暂无数据" />
      <div v-else class="rank-list">
        <div
          v-for="(item, index) in stats.topTools"
          :key="item.path"
          class="rank-item"
        >
          <div class="rank-index">{{ index + 1 }}</div>
          <router-link :to="item.path" class="rank-name">{{ item.name }}</router-link>
          <div class="rank-bar-wrapper">
            <div class="rank-bar" :style="{ width: `${(item.count / maxCount) * 100}%` }"></div>
          </div>
          <div class="rank-count">{{ item.count }}</div>
        </div>
      </div>
    </n-card>

    <n-card title="最近访问" class="mt-6">
      <n-empty v-if="stats.recent.length === 0" description="暂无数据" />
      <n-timeline v-else>
        <n-timeline-item
          v-for="record in stats.recent"
          :key="record.timestamp"
          :title="record.name"
          :time="formatTime(record.timestamp)"
        />
      </n-timeline>
    </n-card>

    <div class="actions mt-6">
      <n-button type="error" ghost @click="clearStats">清空本地数据</n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { NCard, NEmpty, NButton, NTimeline, NTimelineItem } from 'naive-ui'
import { getVisitStats } from '@/composables/useVisitStats'

const stats = ref(getVisitStats())

const maxCount = computed(() => {
  if (stats.value.topTools.length === 0) return 1
  return stats.value.topTools[0].count
})

function formatTime(ts: number) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function clearStats() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('web_tool_visits')
  stats.value = getVisitStats()
}

onMounted(() => {
  stats.value = getVisitStats()
})
</script>

<style scoped>
.site-stats {
  max-width: 720px;
  margin: 0 auto;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
}

.stat-card {
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #36ad6a;
}

.stat-label {
  margin-top: 4px;
  color: #888;
  font-size: 14px;
}

.rank-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rank-item {
  display: grid;
  grid-template-columns: 28px 1fr 120px 36px;
  align-items: center;
  gap: 12px;
}

.rank-index {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f0f9eb;
  color: #36ad6a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.rank-name {
  color: inherit;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-name:hover {
  color: #36ad6a;
}

.rank-bar-wrapper {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.rank-bar {
  height: 100%;
  background: #36ad6a;
  border-radius: 4px;
  transition: width 0.3s;
}

.rank-count {
  text-align: right;
  font-size: 14px;
  color: #666;
}

.actions {
  display: flex;
  justify-content: flex-end;
}

.dark .rank-index {
  background: #1a3a2a;
  color: #63e2b7;
}

.dark .rank-bar-wrapper {
  background: #2a2a4a;
}

.dark .rank-count {
  color: #aaa;
}

@media (max-width: 480px) {
  .rank-item {
    grid-template-columns: 28px 1fr 60px 32px;
    gap: 8px;
  }
}
</style>
