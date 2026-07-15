<template>
  <div class="log-analyzer">
    <n-alert type="info" class="mb-4">
      粘贴或上传服务器日志，自动解析时间、级别与 IP，支持按级别、关键词、时间范围过滤与统计。所有解析在浏览器本地完成。
    </n-alert>

    <!-- 输入区 -->
    <div class="card mb-4">
      <div class="section-header mb-3">
        <span class="pane-label">日志输入</span>
        <n-space>
          <n-upload :show-file-list="false" accept=".log,.txt" @change="handleFileUpload">
            <n-button size="small">
              <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><polyline points="16 13 12 9 8 13"/><line x1="12" y1="9" x2="12" y2="19"/></svg></span>上传日志文件
            </n-button>
          </n-upload>
          <n-button size="small" @click="loadExample">加载示例</n-button>
          <n-button size="small" @click="clearAll" :disabled="!logInput">清空</n-button>
        </n-space>
      </div>
      <n-input
        v-model:value="logInput"
        type="textarea"
        :rows="8"
        :autosize="false"
        placeholder="粘贴日志内容，每行一条。支持常见日志格式：&#10;2024-01-01 12:00:00 INFO 192.168.1.1 服务启动&#10;[2024-01-01T12:00:00Z] ERROR 10.0.0.1 连接失败"
        class="log-input"
      />
      <div class="input-meta mt-2" v-if="logInput">
        <n-tag size="small" :bordered="false">共 {{ totalLines }} 行</n-tag>
        <n-tag size="small" :bordered="false" type="info">解析到 {{ parsedLogs.length }} 条有效日志</n-tag>
      </div>
    </div>

    <!-- 统计区 -->
    <div class="card mb-4" v-if="parsedLogs.length > 0">
      <div class="pane-label mb-3">级别统计</div>
      <div class="stats-grid">
        <div
          v-for="lv in levelStats"
          :key="lv.level"
          class="stat-card"
          :class="`stat-${lv.level.toLowerCase()}`"
          :style="{ opacity: levelFilter.includes(lv.level) ? 1 : 0.4 }"
          @click="toggleLevel(lv.level)"
        >
          <div class="stat-level">{{ lv.level }}</div>
          <div class="stat-count">{{ lv.count }}</div>
          <div class="stat-percent">{{ lv.percent }}%</div>
        </div>
      </div>

      <!-- Top IP 统计 -->
      <div class="pane-label mb-2 mt-4">Top IP 统计（前 10）</div>
      <n-data-table
        :columns="ipColumns"
        :data="topIps"
        :bordered="false"
        :single-line="false"
        size="small"
        :pagination="false"
      />
    </div>

    <!-- 过滤区 -->
    <div class="card mb-4" v-if="parsedLogs.length > 0">
      <div class="pane-label mb-3">过滤条件</div>
      <div class="filter-grid">
        <div class="filter-item">
          <label>日志级别</label>
          <n-checkbox-group v-model:value="levelFilter">
            <n-space>
              <n-checkbox v-for="lv in availableLevels" :key="lv" :value="lv" :label="lv" />
            </n-space>
          </n-checkbox-group>
        </div>
        <div class="filter-item">
          <label>关键词搜索</label>
          <n-input v-model:value="keyword" placeholder="输入关键词（不区分大小写）" clearable />
        </div>
        <div class="filter-item">
          <label>时间范围</label>
          <n-date-picker
            v-model:value="timeRange"
            type="datetimerange"
            clearable
            style="width: 100%"
          />
        </div>
      </div>
      <div class="filter-actions mt-3">
        <n-button size="small" @click="selectAllLevels">全选级别</n-button>
        <n-button size="small" @click="levelFilter = []">清空级别</n-button>
        <n-button size="small" @click="resetFilter">重置过滤</n-button>
      </div>
    </div>

    <!-- 过滤结果 -->
    <div class="card" v-if="parsedLogs.length > 0">
      <div class="section-header mb-3">
        <span class="pane-label">过滤结果</span>
        <n-tag size="small" :bordered="false" type="success">显示 {{ filteredLogs.length }} / {{ parsedLogs.length }} 条</n-tag>
      </div>
      <n-empty v-if="filteredLogs.length === 0" description="没有匹配的日志" />
      <div v-else class="log-list">
        <div
          v-for="(log, i) in displayLogs"
          :key="i"
          class="log-line"
          :class="`log-${log.level.toLowerCase()}`"
        >
          <span class="log-line-no">{{ log.lineNo }}</span>
          <span class="log-time" v-if="log.time">{{ log.timeStr }}</span>
          <span class="log-level" :class="`lv-${log.level.toLowerCase()}`">{{ log.level }}</span>
          <span class="log-ip" v-if="log.ip">{{ log.ip }}</span>
          <span class="log-msg">{{ log.message }}</span>
        </div>
        <div class="load-more" v-if="filteredLogs.length > displayLimit">
          <n-button size="small" @click="displayLimit += 200">加载更多（剩余 {{ filteredLogs.length - displayLimit }} 条）</n-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  NAlert, NInput, NButton, NTag, NEmpty, NSpace, NUpload, NCheckbox,
  NCheckboxGroup, NDatePicker, NDataTable, useMessage,
} from 'naive-ui'
import type { UploadFileInfo, DataTableColumns } from 'naive-ui'

const message = useMessage()

// 解析后的日志结构
interface ParsedLog {
  lineNo: number
  raw: string
  time: number | null // 时间戳
  timeStr: string
  level: string
  ip: string
  message: string
}

const logInput = ref('')
const levelFilter = ref<string[]>([])
const keyword = ref('')
const timeRange = ref<[number, number] | null>(null)
const displayLimit = ref(200)

// ============ 日志解析 ============
// 级别关键词映射
const LEVEL_KEYWORDS: Record<string, string[]> = {
  ERROR: ['error', 'err', 'fatal', 'critical', 'crit'],
  WARN: ['warn', 'warning'],
  INFO: ['info', 'information'],
  DEBUG: ['debug', 'trace'],
}

// 时间正则：匹配常见日志时间格式
const TIME_PATTERNS = [
  // 2024-01-01 12:00:00 或 2024-01-01T12:00:00
  /(\d{4}[-/]\d{2}[-/]\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)/,
  // [10/Oct/2024:13:55:36 +0800]
  /\[(\d{2}\/\w{3}\/\d{4}:\d{2}:\d{2}:\d{2}\s*[+-]\d{4})\]/,
  // [12:00:00]
  /\[(\d{2}:\d{2}:\d{2})\]/,
]

const IP_REGEX = /\b((?:\d{1,3}\.){3}\d{1,3})\b/

// 月份映射
const MONTH_MAP: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
}

// 解析时间字符串为时间戳
function parseTime(timeStr: string): number | null {
  // 标准 ISO 格式
  const isoMatch = timeStr.match(/^(\d{4})[-/](\d{2})[-/](\d{2})[T\s](\d{2}):(\d{2}):(\d{2})/)
  if (isoMatch) {
    const d = new Date(
      parseInt(isoMatch[1], 10),
      parseInt(isoMatch[2], 10) - 1,
      parseInt(isoMatch[3], 10),
      parseInt(isoMatch[4], 10),
      parseInt(isoMatch[5], 10),
      parseInt(isoMatch[6], 10),
    )
    return d.getTime()
  }
  // nginx 格式 10/Oct/2024:13:55:36 +0800
  const nginxMatch = timeStr.match(/^(\d{2})\/(\w{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2})/)
  if (nginxMatch && MONTH_MAP[nginxMatch[2]] !== undefined) {
    const d = new Date(
      parseInt(nginxMatch[3], 10),
      MONTH_MAP[nginxMatch[2]],
      parseInt(nginxMatch[1], 10),
      parseInt(nginxMatch[4], 10),
      parseInt(nginxMatch[5], 10),
      parseInt(nginxMatch[6], 10),
    )
    return d.getTime()
  }
  return null
}

// 从文本提取日志级别
function extractLevel(text: string): string {
  const lower = text.toLowerCase()
  // 优先匹配大写级别词
  for (const [level, words] of Object.entries(LEVEL_KEYWORDS)) {
    for (const w of words) {
      // 匹配 \b级别\b 形式
      const re = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
      if (re.test(lower)) return level
    }
  }
  return 'OTHER'
}

// 解析单行日志
function parseLine(line: string, lineNo: number): ParsedLog {
  const trimmed = line.trim()
  let time: number | null = null
  let timeStr = ''
  let remaining = trimmed

  // 匹配时间
  for (const pattern of TIME_PATTERNS) {
    const m = trimmed.match(pattern)
    if (m) {
      timeStr = m[1]
      time = parseTime(timeStr)
      remaining = trimmed.replace(m[0], '').trim()
      break
    }
  }

  // 匹配 IP
  const ipMatch = trimmed.match(IP_REGEX)
  const ip = ipMatch ? ipMatch[1] : ''

  // 提取级别
  const level = extractLevel(trimmed)

  // 提取消息：去除时间后的内容，若为空则用原始行
  const msg = remaining || trimmed

  return { lineNo, raw: trimmed, time, timeStr, level, ip, message: msg }
}

// 解析全部日志
const parsedLogs = computed<ParsedLog[]>(() => {
  if (!logInput.value.trim()) return []
  const lines = logInput.value.split('\n')
  const result: ParsedLog[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue
    result.push(parseLine(line, i + 1))
  }
  return result
})

const totalLines = computed(() => logInput.value.split('\n').filter(l => l.trim()).length)

// ============ 统计 ============
// 可用级别列表
const availableLevels = computed(() => {
  const set = new Set(parsedLogs.value.map(l => l.level))
  return Array.from(set).sort()
})

// 级别统计
const levelStats = computed(() => {
  const total = parsedLogs.value.length
  const counts: Record<string, number> = {}
  for (const log of parsedLogs.value) {
    counts[log.level] = (counts[log.level] || 0) + 1
  }
  return Object.entries(counts)
    .map(([level, count]) => ({
      level,
      count,
      percent: total > 0 ? ((count / total) * 100).toFixed(1) : '0',
    }))
    .sort((a, b) => b.count - a.count)
})

// Top IP 统计
interface IpStat {
  ip: string
  count: number
  percent: string
}

const topIps = computed<IpStat[]>(() => {
  const counts: Record<string, number> = {}
  let total = 0
  for (const log of parsedLogs.value) {
    if (log.ip) {
      counts[log.ip] = (counts[log.ip] || 0) + 1
      total++
    }
  }
  return Object.entries(counts)
    .map(([ip, count]) => ({
      ip,
      count,
      percent: total > 0 ? ((count / total) * 100).toFixed(1) : '0',
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
})

const ipColumns: DataTableColumns<IpStat> = [
  { title: '排名', key: 'rank', width: 70, render: (_, i) => i + 1 },
  { title: 'IP 地址', key: 'ip' },
  { title: '出现次数', key: 'count', width: 120 },
  { title: '占比', key: 'percent', width: 100, render: row => `${row.percent}%` },
]

// ============ 过滤 ============
const filteredLogs = computed<ParsedLog[]>(() => {
  return parsedLogs.value.filter(log => {
    // 级别过滤
    if (levelFilter.value.length > 0 && !levelFilter.value.includes(log.level)) {
      return false
    }
    // 关键词过滤
    if (keyword.value.trim()) {
      const kw = keyword.value.trim().toLowerCase()
      if (!log.raw.toLowerCase().includes(kw)) return false
    }
    // 时间范围过滤
    if (timeRange.value && log.time !== null) {
      const [start, end] = timeRange.value
      if (log.time < start || log.time > end) return false
    }
    return true
  })
})

// 显示的日志（分页加载）
const displayLogs = computed(() => filteredLogs.value.slice(0, displayLimit.value))

// 切换级别过滤
function toggleLevel(level: string): void {
  const idx = levelFilter.value.indexOf(level)
  if (idx >= 0) {
    levelFilter.value.splice(idx, 1)
  } else {
    levelFilter.value.push(level)
  }
}

function selectAllLevels(): void {
  levelFilter.value = [...availableLevels.value]
}

function resetFilter(): void {
  levelFilter.value = []
  keyword.value = ''
  timeRange.value = null
  displayLimit.value = 200
}

// 输入变化时重置过滤并默认全选级别
watch(logInput, () => {
  displayLimit.value = 200
  if (availableLevels.value.length > 0 && levelFilter.value.length === 0) {
    levelFilter.value = [...availableLevels.value]
  }
})

// ============ 文件上传 ============
function handleFileUpload({ file }: { file: UploadFileInfo }): void {
  if (!file.file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    logInput.value = e.target?.result as string
    message.success(`已导入文件：${file.name}`)
  }
  reader.onerror = () => message.error('文件读取失败')
  reader.readAsText(file.file)
}

// 加载示例
function loadExample(): void {
  logInput.value = `2024-10-08 09:00:01 INFO 192.168.1.10 服务启动完成，监听端口 8080
2024-10-08 09:00:05 INFO 192.168.1.10 数据库连接池初始化成功
2024-10-08 09:01:23 WARN 10.0.0.5 响应时间超过阈值: 2500ms
2024-10-08 09:02:11 ERROR 192.168.1.20 用户登录失败：密码错误
2024-10-08 09:02:12 INFO 192.168.1.20 尝试重新登录
2024-10-08 09:03:45 ERROR 10.0.0.5 数据库连接超时
2024-10-08 09:03:46 DEBUG 10.0.0.5 重连数据库，第 1 次尝试
2024-10-08 09:04:00 INFO 192.168.1.20 登录成功
2024-10-08 09:05:30 WARN 172.16.0.8 磁盘空间不足：使用率 85%
2024-10-08 09:06:12 ERROR 192.168.1.20 请求处理异常：NullPointerException
2024-10-08 09:06:13 DEBUG 192.168.1.20 堆栈跟踪开始
2024-10-08 09:07:00 INFO 10.0.0.5 数据库连接恢复
2024-10-08 09:08:22 ERROR 172.16.0.8 文件写入失败：权限拒绝
2024-10-08 09:09:00 INFO 192.168.1.10 定时任务执行完成
2024-10-08 09:10:15 WARN 10.0.0.5 GC 耗时较长: 800ms
2024-10-08 09:11:30 ERROR 192.168.1.20 接口调用超时
2024-10-08 09:12:00 INFO 192.168.1.10 心跳检测正常`
}

function clearAll(): void {
  logInput.value = ''
  levelFilter.value = []
  keyword.value = ''
  timeRange.value = null
  displayLimit.value = 200
}
</script>

<style scoped>
.log-analyzer {
  max-width: 1000px;
  margin: 0 auto;
}

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.log-input :deep(textarea) {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.5;
}

.input-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.stat-card {
  padding: 16px;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
}

.dark .stat-card {
  border-color: #374151;
  background: #1f2937;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.stat-error { border-left: 4px solid #ef4444; }
.stat-warn { border-left: 4px solid #f59e0b; }
.stat-info { border-left: 4px solid #3b82f6; }
.stat-debug { border-left: 4px solid #8b5cf6; }
.stat-other { border-left: 4px solid #6b7280; }

.stat-level {
  font-size: 13px;
  font-weight: 600;
  color: #555;
  text-transform: uppercase;
}

.dark .stat-level {
  color: #bbb;
}

.stat-count {
  font-size: 24px;
  font-weight: bold;
  color: #2563eb;
  margin: 4px 0;
}

.dark .stat-count {
  color: #60a5fa;
}

.stat-percent {
  font-size: 12px;
  color: #888;
}

.filter-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
}

@media (max-width: 768px) {
  .filter-grid {
    grid-template-columns: 1fr;
  }
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-item label {
  font-size: 13px;
  font-weight: 500;
  color: #555;
}

.dark .filter-item label {
  color: #bbb;
}

.filter-actions {
  display: flex;
  gap: 8px;
}

.log-list {
  max-height: 600px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.dark .log-list {
  border-color: #374151;
}

.log-line {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 10px;
  border-bottom: 1px solid #f0f0f0;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.6;
  flex-wrap: wrap;
}

.dark .log-line {
  border-bottom-color: #2a2a3e;
}

.log-line:hover {
  background: #f9fafb;
}

.dark .log-line:hover {
  background: #1f2937;
}

.log-line-no {
  color: #aaa;
  min-width: 40px;
  text-align: right;
  user-select: none;
}

.log-time {
  color: #6b7280;
  white-space: nowrap;
}

.dark .log-time {
  color: #9ca3af;
}

.log-level {
  font-weight: bold;
  min-width: 56px;
  text-align: center;
  padding: 0 6px;
  border-radius: 3px;
}

.lv-error { color: #fff; background: #ef4444; }
.lv-warn { color: #fff; background: #f59e0b; }
.lv-info { color: #fff; background: #3b82f6; }
.lv-debug { color: #fff; background: #8b5cf6; }
.lv-other { color: #fff; background: #6b7280; }

.log-ip {
  color: #059669;
  white-space: nowrap;
}

.dark .log-ip {
  color: #34d399;
}

.log-msg {
  color: #333;
  flex: 1;
  min-width: 0;
  word-break: break-word;
}

.dark .log-msg {
  color: #e0e0e0;
}

.load-more {
  padding: 12px;
  text-align: center;
}
</style>
