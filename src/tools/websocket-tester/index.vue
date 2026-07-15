<template>
  <div class="websocket-tester">
    <n-alert type="info" class="mb-4">
      使用浏览器原生 WebSocket API 连接服务器。仅支持 ws:// 和 wss:// 协议，且不可访问受限端口。
    </n-alert>

    <!-- 连接配置区 -->
    <div class="card mb-4">
      <div class="connection-line">
        <n-input
          v-model:value="url"
          placeholder="wss://echo.websocket.org"
          class="url-input"
          :disabled="connected"
          @keyup.enter="!connected ? connect() : disconnect()"
        />
        <div class="status-indicator" :class="statusClass">
          <span class="status-dot"></span>
          <span class="status-text">{{ statusText }}</span>
        </div>
        <n-button
          :type="connected ? 'error' : 'primary'"
          @click="connected ? disconnect() : connect()"
          :loading="connecting"
        >
          {{ connected ? '断开连接' : '连接' }}
        </n-button>
        <n-button @click="clearLogs" :disabled="logs.length === 0">清空日志</n-button>
      </div>

      <div class="options mt-3">
        <n-space align="center">
          <n-checkbox v-model:checked="autoReconnect" :disabled="connected">断线自动重连</n-checkbox>
          <n-checkbox v-model:checked="logTimestamp">日志显示时间戳</n-checkbox>
        </n-space>
      </div>
    </div>

    <!-- 消息发送区 -->
    <div class="card mb-4">
      <div class="pane-label mb-2">发送消息</div>
      <div class="send-line">
        <n-input
          v-model:value="sendText"
          type="textarea"
          placeholder="输入要发送的消息（支持 JSON 或纯文本）"
          rows="3"
          :autosize="false"
          class="send-area"
          :disabled="!connected"
          @keyup.ctrl.enter="sendMessage"
        />
      </div>
      <div class="flex items-center gap-2 mt-3">
        <n-button
          type="primary"
          @click="sendMessage"
          :disabled="!connected || !sendText.trim()"
        >
          发送
        </n-button>
        <n-button @click="sendText = ''" :disabled="!connected">清空</n-button>
        <span class="text-sm text-gray-400">Ctrl + Enter 快速发送</span>
      </div>
    </div>

    <!-- 消息日志区 -->
    <div class="card">
      <div class="flex items-center justify-between mb-2">
        <div class="pane-label">消息日志（{{ logs.length }} 条）</div>
        <n-select
          v-model:value="logFilter"
          :options="filterOptions"
          size="small"
          style="width: 140px"
        />
      </div>
      <div class="log-container">
        <div v-if="filteredLogs.length === 0" class="text-gray-400 text-center py-8">
          暂无消息日志
        </div>
        <div v-else>
          <div
            v-for="(log, index) in filteredLogs"
            :key="index"
            class="log-item"
            :class="log.type"
          >
            <div class="log-meta">
              <n-tag :type="logTagType(log.type)" size="small" :bordered="false">
                {{ logLabel(log.type) }}
              </n-tag>
              <span v-if="logTimestamp" class="log-time">{{ log.time }}</span>
            </div>
            <div class="log-content font-mono">{{ log.message }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onBeforeUnmount } from 'vue'
import { NButton, NInput, NSelect, NCheckbox, NSpace, NAlert, NTag, useMessage } from 'naive-ui'

type LogType = 'sent' | 'received' | 'system' | 'error'

interface LogItem {
  type: LogType
  message: string
  time: string
}

const message = useMessage()

const url = ref('wss://echo.websocket.org')
const sendText = ref('')
const connected = ref(false)
const connecting = ref(false)
const autoReconnect = ref(false)
const logTimestamp = ref(true)
const logFilter = ref<'all' | 'sent' | 'received'>('all')
const logs = ref<LogItem[]>([])

let ws: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null

const filterOptions = [
  { label: '全部', value: 'all' },
  { label: '已发送', value: 'sent' },
  { label: '已接收', value: 'received' },
]

const statusClass = computed(() => ({
  'status-connecting': connecting.value,
  'status-online': connected.value,
  'status-offline': !connected.value && !connecting.value,
}))

const statusText = computed(() => {
  if (connecting.value) return '连接中...'
  if (connected.value) return '已连接'
  return '未连接'
})

const filteredLogs = computed(() => {
  if (logFilter.value === 'all') return logs.value
  return logs.value.filter(l => l.type === logFilter.value)
})

function logTagType(type: LogType): 'success' | 'info' | 'warning' | 'error' {
  switch (type) {
    case 'sent': return 'success'
    case 'received': return 'info'
    case 'system': return 'warning'
    case 'error': return 'error'
  }
}

function logLabel(type: LogType): string {
  switch (type) {
    case 'sent': return '发送'
    case 'received': return '接收'
    case 'system': return '系统'
    case 'error': return '错误'
  }
}

function nowTime(): string {
  return new Date().toLocaleTimeString()
}

function addLog(type: LogType, msg: string) {
  logs.value.push({ type, message: msg, time: nowTime() })
  // 限制日志数量
  if (logs.value.length > 500) logs.value = logs.value.slice(-500)
  // 自动滚动到底部
  nextTick(() => {
    const container = document.querySelector('.log-container')
    if (container) container.scrollTop = container.scrollHeight
  })
}

// 连接 WebSocket
function connect() {
  if (!url.value.trim()) {
    message.warning('请输入 WebSocket URL')
    return
  }
  if (!url.value.startsWith('ws://') && !url.value.startsWith('wss://')) {
    message.error('URL 必须以 ws:// 或 wss:// 开头')
    return
  }

  disconnect(true)
  connecting.value = true

  try {
    ws = new WebSocket(url.value)
  } catch (e: unknown) {
    connecting.value = false
    addLog('error', '创建连接失败：' + (e instanceof Error ? e.message : String(e)))
    return
  }

  ws.onopen = () => {
    connecting.value = false
    connected.value = true
    addLog('system', `已连接到 ${url.value}`)
  }

  ws.onmessage = (event: MessageEvent) => {
    let data = event.data
    // 处理 Blob 数据
    if (data instanceof Blob) {
      data.text().then(text => addLog('received', text))
    } else {
      addLog('received', String(data))
    }
  }

  ws.onerror = () => {
    addLog('error', '连接发生错误')
  }

  ws.onclose = (event: CloseEvent) => {
    connected.value = false
    connecting.value = false
    addLog('system', `连接已关闭${event.code ? '（code: ' + event.code + (event.reason ? ', ' + event.reason : '') + '）' : ''}`)
    ws = null

    // 自动重连
    if (autoReconnect.value) {
      reconnectTimer = setTimeout(() => {
        addLog('system', '正在自动重连...')
        connect()
      }, 2000)
    }
  }
}

// 断开连接
function disconnect(silent = false) {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  if (ws) {
    if (!silent) addLog('system', '主动断开连接')
    // 移除事件监听避免触发自动重连
    ws.onclose = null
    ws.onerror = null
    ws.onopen = null
    ws.onmessage = null
    try {
      ws.close()
    } catch {
      // 忽略关闭错误
    }
    ws = null
    connected.value = false
    connecting.value = false
  }
}

// 发送消息
function sendMessage() {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    message.warning('WebSocket 未连接')
    return
  }
  const text = sendText.value
  if (!text.trim()) return
  try {
    ws.send(text)
    addLog('sent', text)
    sendText.value = ''
  } catch (e: unknown) {
    addLog('error', '发送失败：' + (e instanceof Error ? e.message : String(e)))
  }
}

function clearLogs() {
  logs.value = []
}

// 组件卸载前清理连接
onBeforeUnmount(() => {
  disconnect(true)
})
</script>

<style scoped>
.websocket-tester {
  max-width: 1000px;
  margin: 0 auto;
}

.connection-line {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.url-input {
  flex: 1;
  min-width: 240px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.status-offline {
  background: rgba(0, 0, 0, 0.06);
  color: #888;
}

.status-offline .status-dot {
  background: #888;
}

.status-connecting {
  background: rgba(208, 122, 0, 0.12);
  color: #d07a00;
}

.status-connecting .status-dot {
  background: #d07a00;
  animation: blink 1s infinite;
}

.status-online {
  background: rgba(54, 173, 106, 0.12);
  color: #36ad6a;
}

.status-online .status-dot {
  background: #36ad6a;
  box-shadow: 0 0 6px #36ad6a;
}

.dark .status-offline {
  background: rgba(255, 255, 255, 0.08);
  color: #aaa;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
}

.send-area :deep(textarea) {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
}

.log-container {
  max-height: 420px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 6px;
  padding: 8px;
}

.dark .log-container {
  background: rgba(0, 0, 0, 0.2);
}

.log-item {
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 6px;
  border-left: 3px solid #888;
}

.log-item.sent {
  border-left-color: #36ad6a;
  background: rgba(54, 173, 106, 0.06);
}

.log-item.received {
  border-left-color: #2080f0;
  background: rgba(32, 128, 240, 0.06);
}

.log-item.system {
  border-left-color: #f0a020;
  background: rgba(240, 160, 32, 0.06);
}

.log-item.error {
  border-left-color: #d03050;
  background: rgba(208, 48, 80, 0.06);
}

.log-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.log-time {
  font-size: 11px;
  color: #999;
}

.log-content {
  font-size: 13px;
  word-break: break-all;
  white-space: pre-wrap;
  line-height: 1.5;
}
</style>
