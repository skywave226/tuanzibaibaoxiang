<template>
  <div class="site-stats">
    <h2 class="text-xl font-bold mb-4">访问统计</h2>
    <p class="text-gray-500 mb-6">数据保存在浏览器本地，仅统计当前设备的访问记录。</p>

    <div class="filter-bar mb-6">
      <n-radio-group v-model:value="range" size="small" @update:value="updateStats">
        <n-radio-button value="today">今天</n-radio-button>
        <n-radio-button value="week">近 7 天</n-radio-button>
        <n-radio-button value="month">近 30 天</n-radio-button>
        <n-radio-button value="all">全部</n-radio-button>
      </n-radio-group>
      <n-button size="small" @click="exportCsv">导出 CSV</n-button>
    </div>

    <div class="stats-grid">
      <n-card class="stat-card">
        <div class="stat-value">{{ filteredStats.total }}</div>
        <div class="stat-label">总访问量</div>
      </n-card>
      <n-card class="stat-card">
        <div class="stat-value">{{ filteredStats.uniqueTools }}</div>
        <div class="stat-label">访问过的工具</div>
      </n-card>
      <n-card class="stat-card">
        <div class="stat-value">{{ filteredStats.avgPerDay }}</div>
        <div class="stat-label">日均访问</div>
      </n-card>
    </div>

    <n-card title="访问趋势" class="mt-6">
      <n-empty v-if="trendData.length === 0" description="暂无数据" />
      <div v-else class="trend-chart">
        <div class="trend-bars">
          <div v-for="item in trendData" :key="item.date" class="trend-bar-wrapper">
            <div class="trend-bar" :style="{ height: `${(item.count / trendMax) * 100}%` }"></div>
          </div>
        </div>
        <div class="trend-labels">
          <span v-for="item in visibleTrendLabels" :key="item.date">{{ item.label }}</span>
        </div>
      </div>
    </n-card>

    <n-card title="热门工具排行" class="mt-6">
      <n-empty v-if="filteredStats.topTools.length === 0" description="暂无数据" />
      <div v-else class="rank-list">
        <div v-for="(item, index) in filteredStats.topTools" :key="item.path" class="rank-item">
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
      <n-empty v-if="filteredStats.recent.length === 0" description="暂无数据" />
      <n-timeline v-else>
        <n-timeline-item
          v-for="record in filteredStats.recent"
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
import { NCard, NEmpty, NButton, NTimeline, NTimelineItem, NRadioGroup, NRadioButton } from 'naive-ui'
import { getVisits, type VisitRecord } from '@/composables/useVisitStats'

type Range = 'today' | 'week' | 'month' | 'all'

const range = ref<Range>('week')
const visits = ref<VisitRecord[]>([])

interface StatsResult {
  total: number
  uniqueTools: number
  avgPerDay: number
  topTools: { path: string; name: string; count: number }[]
  recent: VisitRecord[]
}

const filteredStats = ref<StatsResult>({ total: 0, uniqueTools: 0, avgPerDay: 0, topTools: [], recent: [] })

onMounted(() => {
  visits.value = getVisits()
  updateStats()
})

function isInRange(timestamp: number, r: Range): boolean {
  const now = new Date()
  now.setHours(23, 59, 59, 999)
  const d = new Date(timestamp)
  if (r === 'today') {
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
  }
  if (r === 'week') {
    const start = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)
    start.setHours(0, 0, 0, 0)
    return d >= start && d <= now
  }
  if (r === 'month') {
    const start = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000)
    start.setHours(0, 0, 0, 0)
    return d >= start && d <= now
  }
  return true
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function updateStats() {
  visits.value = getVisits()
  const filtered = visits.value.filter(v => isInRange(v.timestamp, range.value))

  const toolMap = new Map<string, { name: string; count: number }>()
  filtered.forEach((v) => {
    if (v.path === '/') return
    const existing = toolMap.get(v.path)
    if (existing) {
      existing.count += 1
    } else {
      toolMap.set(v.path, { name: v.name || v.path, count: 1 })
    }
  })

  const topTools = Array.from(toolMap.entries())
    .map(([path, { name, count }]) => ({ path, name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const dayMap = new Map<string, number>()
  filtered.forEach(v => {
    const date = formatDate(v.timestamp)
    dayMap.set(date, (dayMap.get(date) || 0) + 1)
  })
  const dayCount = dayMap.size || 1

  filteredStats.value = {
    total: filtered.length,
    uniqueTools: toolMap.size,
    avgPerDay: Math.round(filtered.length / dayCount),
    topTools,
    recent: filtered.slice(-20).reverse(),
  }
}

const maxCount = computed(() => {
  if (filteredStats.value.topTools.length === 0) return 1
  return filteredStats.value.topTools[0].count
})

const trendData = computed(() => {
  const filtered = visits.value.filter(v => isInRange(v.timestamp, range.value))
  const dayMap = new Map<string, number>()
  const now = new Date()

  if (range.value === 'today') {
    for (let i = 0; i < 24; i++) {
      const hour = String(i).padStart(2, '0')
      dayMap.set(`${formatDate(now.getTime())} ${hour}:00`, 0)
    }
    filtered.forEach(v => {
      const d = new Date(v.timestamp)
      const key = `${formatDate(v.timestamp)} ${String(d.getHours()).padStart(2, '0')}:00`
      dayMap.set(key, (dayMap.get(key) || 0) + 1)
    })
  } else {
    const days = range.value === 'week' ? 7 : range.value === 'month' ? 30 : 30
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const key = formatDate(d.getTime())
      dayMap.set(key, 0)
    }
    filtered.forEach(v => {
      const key = formatDate(v.timestamp)
      dayMap.set(key, (dayMap.get(key) || 0) + 1)
    })
  }

  return Array.from(dayMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }))
})

const trendMax = computed(() => {
  if (trendData.value.length === 0) return 1
  return Math.max(...trendData.value.map(d => d.count), 1)
})

const visibleTrendLabels = computed(() => {
  const total = trendData.value.length
  if (total <= 8) return trendData.value.map(d => ({ date: d.date, label: formatShortLabel(d.date) }))
  const step = Math.ceil(total / 6)
  return trendData.value
    .map((d, i) => (i % step === 0 || i === total - 1 ? { date: d.date, label: formatShortLabel(d.date) } : null))
    .filter(Boolean) as { date: string; label: string }[]
})

function formatShortLabel(dateStr: string): string {
  if (dateStr.includes(':')) {
    return dateStr.slice(-5)
  }
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function formatTime(ts: number) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function clearStats() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('web_tool_visits')
  updateStats()
}

function exportCsv() {
  const filtered = visits.value.filter(v => isInRange(v.timestamp, range.value))
  const rows = [
    ['时间', '页面', '路径'],
    ...filtered.map(v => [formatTime(v.timestamp), v.name, v.path]),
  ]
  const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `site-stats-${range.value}-${formatDate(Date.now())}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.site-stats {
  max-width: 720px;
  margin: 0 auto;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
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

.trend-chart {
  padding: 12px 0;
}

.trend-bars {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 160px;
  padding-bottom: 8px;
}

.trend-bar-wrapper {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: flex-end;
}

.trend-bar {
  width: 100%;
  background: #36ad6a;
  border-radius: 4px 4px 0 0;
  min-height: 4px;
  transition: height 0.3s;
}

.trend-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #888;
  margin-top: 8px;
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

.dark .rank-bar-wrapper,
.dark .trend-bar-wrapper {
  background: #2a2a4a;
}

.dark .rank-count {
  color: #aaa;
}

.dark .trend-labels {
  color: #888;
}

@media (max-width: 480px) {
  .rank-item {
    grid-template-columns: 28px 1fr 60px 32px;
    gap: 8px;
  }
}
</style>
