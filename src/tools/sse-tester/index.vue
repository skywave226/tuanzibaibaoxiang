<template>
  <div class="sse-tester">
    <!-- 连接配置 -->
    <n-card class="config-card" :bordered="false">
      <div class="card-title">
        <span class=" title-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m9.9-2.83a10 10 0 0 1 0 14.14m-11.32 0a10 10 0 0 1 0-14.14"/></svg></span>
        <span>SSE 连接配置</span>
      </div>

      <div class="url-line">
        <n-input
          v-model:value="url"
          placeholder="https://api.example.com/events"
          class="url-input"
          @keyup.enter="connect"
          :disabled="connected"
        />
        <n-button v-if="!connected" type="primary" @click="connect" :loading="connecting">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg></span>
          连接
        </n-button>
        <n-button v-else type="error" @click="disconnect">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="2"/></svg></span>
          断开
        </n-button>
      </div>

      <!-- 连接状态 -->
      <div class="status-line mt-3">
        <n-tag :type="statusType" :bordered="false" size="small">
          {{ statusText }}
        </n-tag>
        <span class="meta-item" v-if="connected">已连接 {{ connectedDuration }}</span>
        <span class="meta-item" v-if="messageCount > 0">收到 {{ messageCount }} 条消息</span>
      </div>
    </n-card>

    <!-- CORS 提示 -->
    <n-alert type="info" class="mt-4" :bordered="false">
      <template #header>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        关于 EventSource 限制
      </template>
      EventSource API 仅支持 GET 请求且不支持自定义请求头。目标服务器需配置 CORS 允许跨域，且必须设置 <code>Content-Type: text/event-stream</code> 响应头。
    </n-alert>

    <!-- 消息日志 -->
    <n-card class="mt-4 log-card" :bordered="false">
      <div class="card-title">
        <span class=" title-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg></span>
        <span>消息日志</span>
        <div class="log-actions">
          <n-select
            v-model:value="eventFilter"
            :options="eventOptions"
            placeholder="筛选事件类型"
            size="small"
            style="width: 180px"
            clearable
          />
          <n-button size="small" @click="clearLogs" :disabled="messages.length === 0">
            清空
          </n-button>
          <n-button size="small" @click="copyLogs" :disabled="messages.length === 0">
            复制
          </n-button>
        </div>
      </div>

      <n-empty v-if="filteredMessages.length === 0" description="暂无消息" class="mt-4" />

      <div v-else class="log-list" ref="logListRef">
        <div
          v-for="msg in filteredMessages"
          :key="msg.id"
          class="log-item"
          :class="{ 'log-error': msg.type === '__error__', 'log-open': msg.type === '__open__', 'log-close': msg.type === '__close__' }"
        >
          <div class="log-head">
            <span class="log-type" :class="typeClass(msg.type)">{{ msg.type }}</span>
            <span class="log-time">{{ msg.time }}</span>
            <span class="log-id" v-if="msg.eventId">#{{ msg.eventId }}</span>
          </div>
          <pre class="log-data">{{ msg.data }}</pre>
        </div>
      </div>
    </n-card>

    <!-- 事件类型统计 -->
    <n-card v-if="eventStats.length > 0" class="mt-4 stats-card" :bordered="false">
      <div class="card-title">
        <span class=" title-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></span>
        <span>事件类型统计</span>
      </div>
      <div class="stats-list">
        <div class="stat-item" v-for="stat in eventStats" :key="stat.type">
          <span class="stat-type" :class="typeClass(stat.type)">{{ stat.type }}</span>
          <span class="stat-count">{{ stat.count }} 次</span>
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, nextTick } from 'vue'
import {
  NInput, NButton, NCard, NTag, NAlert, NEmpty, NSelect, useMessage,
} from 'naive-ui'

const message = useMessage()

interface SseMessage {
  id: number
  type: string  // 事件类型，特殊值：__open__/__close__/__error__
  data: string
  time: string
  eventId: string
}

const url = ref('')
const connected = ref(false)
const connecting = ref(false)
const messages = ref<SseMessage[]>([])
const eventFilter = ref<string | null>(null)
const logListRef = ref<HTMLElement | null>(null)

let eventSource: EventSource | null = null
let msgId = 0
let connectedAt = 0
let timerHandle: number | null = null

// 状态文本
const statusText = computed(() => {
  if (connected.value) return '已连接'
  if (connecting.value) return '连接中...'
  return '未连接'
})

const statusType = computed<'success' | 'info' | 'warning' | 'error' | 'default'>(() => {
  if (connected.value) return 'success'
  if (connecting.value) return 'info'
  return 'default'
})

// 已连接时长
const connectedDuration = ref('00:00')
function updateDuration() {
  if (!connectedAt) return
  const sec = Math.floor((Date.now() - connectedAt) / 1000)
  const m = String(Math.floor(sec / 60)).padStart(2, '0')
  const s = String(sec % 60).padStart(2, '0')
  connectedDuration.value = `${m}:${s}`
}

// 消息总数
const messageCount = computed(() => messages.value.filter(m => !m.type.startsWith('__')).length)

// 事件类型选项
const eventOptions = computed(() => {
  const types = new Set<string>()
  messages.value.forEach(m => {
    if (!m.type.startsWith('__')) types.add(m.type)
  })
  return Array.from(types).map(t => ({ label: t, value: t }))
})

// 事件类型统计
const eventStats = computed(() => {
  const map: Record<string, number> = {}
  messages.value.forEach(m => {
    if (!m.type.startsWith('__')) {
      map[m.type] = (map[m.type] || 0) + 1
    }
  })
  return Object.keys(map).map(type => ({ type, count: map[type] })).sort((a, b) => b.count - a.count)
})

// 筛选后的消息
const filteredMessages = computed(() => {
  if (!eventFilter.value) return messages.value
  return messages.value.filter(m => m.type === eventFilter.value)
})

// 类型样式类
function typeClass(type: string): string {
  if (type === '__open__') return 'type-open'
  if (type === '__close__') return 'type-close'
  if (type === '__error__') return 'type-error'
  if (type === 'message') return 'type-message'
  return 'type-custom'
}

// 添加消息并自动滚动
function addMessage(type: string, data: string, eventId: string = '') {
  messages.value.push({
    id: ++msgId,
    type,
    data,
    time: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
    eventId,
  })
  // 限制最多保留 500 条
  if (messages.value.length > 500) {
    messages.value = messages.value.slice(-500)
  }
  nextTick(() => {
    if (logListRef.value) {
      logListRef.value.scrollTop = logListRef.value.scrollHeight
    }
  })
}

// 连接 SSE
function connect() {
  if (!url.value.trim()) {
    message.warning('请输入 SSE URL')
    return
  }
  try {
    new URL(url.value)
  } catch {
    message.error('URL 格式无效')
    return
  }

  disconnect()
  connecting.value = true
  messages.value = []

  try {
    eventSource = new EventSource(url.value)

    eventSource.onopen = () => {
      connected.value = true
      connecting.value = false
      connectedAt = Date.now()
      updateDuration()
      timerHandle = window.setInterval(updateDuration, 1000)
      addMessage('__open__', '连接已建立')
    }

    // 默认 message 事件
    eventSource.onmessage = (e: MessageEvent) => {
      addMessage('message', e.data, e.lastEventId)
    }

    // 监听 error
    eventSource.onerror = () => {
      if (eventSource && eventSource.readyState === EventSource.CLOSED) {
        // 已断开
        addMessage('__close__', '连接已关闭')
        cleanup()
      } else {
        addMessage('__error__', '连接错误，正在尝试重连...')
      }
    }
  } catch (e) {
    connecting.value = false
    addMessage('__error__', '创建 EventSource 失败：' + (e instanceof Error ? e.message : String(e)))
  }
}

// 断开连接
function disconnect() {
  if (eventSource) {
    eventSource.close()
    addMessage('__close__', '已主动断开连接')
    cleanup()
  }
}

function cleanup() {
  connected.value = false
  connecting.value = false
  connectedAt = 0
  if (timerHandle) {
    clearInterval(timerHandle)
    timerHandle = null
  }
  eventSource = null
}

// 清空日志
function clearLogs() {
  messages.value = []
}

// 复制日志
async function copyLogs() {
  const text = filteredMessages.value
    .map(m => `[${m.time}] ${m.type}: ${m.data}`)
    .join('\n')
  try {
    await navigator.clipboard.writeText(text)
    message.success('已复制日志')
  } catch {
    message.error('复制失败，请手动复制')
  }
}

// 组件卸载时清理
onUnmounted(() => {
  if (eventSource) {
    eventSource.close()
  }
  if (timerHandle) {
    clearInterval(timerHandle)
  }
})
</script>

<style scoped>
.sse-tester {
  max-width: 1000px;
  margin: 0 auto;
}

.mt-3 {
  margin-top: 12px;
}

.mt-4 {
  margin-top: 16px;
}

.mr-1 {
  margin-right: 4px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
}

.title-icon {
  font-size: 18px;
  color: #18a058;
}

.url-line {
  display: flex;
  gap: 12px;
  align-items: center;
}

.url-input {
  flex: 1;
}

.status-line {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.meta-item {
  font-size: 13px;
  color: #888;
}

.log-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
  align-items: center;
}

/* 消息日志 */
.log-list {
  max-height: 500px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 4px 0;
}

.log-item {
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 4px;
  border-left: 3px solid #2080f0;
  font-size: 13px;
}

.log-item.log-error {
  border-left-color: #d03050;
  background: rgba(208, 48, 80, 0.06);
}

.log-item.log-open {
  border-left-color: #18a058;
  background: rgba(24, 160, 88, 0.06);
}

.log-item.log-close {
  border-left-color: #f0a020;
  background: rgba(240, 160, 32, 0.06);
}

.log-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.log-type {
  font-weight: 600;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 12px;
  padding: 1px 6px;
  border-radius: 3px;
  background: rgba(32, 128, 240, 0.1);
  color: #2080f0;
}

.type-message { background: rgba(32, 128, 240, 0.1); color: #2080f0; }
.type-custom { background: rgba(138, 43, 226, 0.1); color: #8a2be2; }
.type-open { background: rgba(24, 160, 88, 0.1); color: #18a058; }
.type-close { background: rgba(240, 160, 32, 0.1); color: #b07810; }
.type-error { background: rgba(208, 48, 80, 0.1); color: #d03050; }

.log-time {
  font-size: 11px;
  color: #999;
  font-family: 'Fira Code', 'Consolas', monospace;
}

.log-id {
  font-size: 11px;
  color: #888;
  font-family: 'Fira Code', 'Consolas', monospace;
}

.log-data {
  margin: 0;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 12.5px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  color: #333;
}

/* 统计 */
.stats-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 13px;
}

.stat-count {
  font-family: 'Fira Code', 'Consolas', monospace;
  color: #666;
  font-weight: 600;
}

/* 深色模式适配 */
.dark .card-title,
.dark .log-data {
  color: rgba(255, 255, 255, 0.85);
}

.dark .log-item {
  background: rgba(255, 255, 255, 0.03);
}

.dark .log-item.log-error {
  background: rgba(208, 48, 80, 0.1);
}

.dark .log-item.log-open {
  background: rgba(24, 160, 88, 0.1);
}

.dark .log-item.log-close {
  background: rgba(240, 160, 32, 0.1);
}

.dark .meta-item,
.dark .log-time,
.dark .log-id,
.dark .stat-count {
  color: rgba(255, 255, 255, 0.55);
}

.dark .stat-item {
  background: rgba(255, 255, 255, 0.03);
}

.dark .type-message { background: rgba(32, 128, 240, 0.18); color: #70c0e8; }
.dark .type-custom { background: rgba(138, 43, 226, 0.18); color: #c4a0e8; }
.dark .type-open { background: rgba(24, 160, 88, 0.18); color: #63e2b6; }
.dark .type-close { background: rgba(240, 160, 32, 0.18); color: #f0c060; }
.dark .type-error { background: rgba(208, 48, 80, 0.18); color: #ff7080; }

.dark .title-icon {
  color: #63e2b6;
}
</style>
