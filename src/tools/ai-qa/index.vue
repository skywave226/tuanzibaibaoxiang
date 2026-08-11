<template>
  <div class="ai-qa">
    <n-alert type="info" class="mb-4">
      调用你提供的 OpenAI 兼容接口（支持自定义 baseURL、API Key、模型）。支持多轮对话与上下文记忆，所有配置仅保存在浏览器本地。
    </n-alert>

    <n-collapse class="mb-4">
      <n-collapse-item title="接口配置" name="config">
        <div class="config-grid">
          <div class="config-item">
            <label>API Base URL</label>
            <n-input v-model:value="config.baseURL" placeholder="https://api.openai.com/v1" />
          </div>
          <div class="config-item">
            <label>API Key</label>
            <n-input v-model:value="config.apiKey" type="password" show-password-on="mousedown" placeholder="sk-..." />
          </div>
          <div class="config-item">
            <label>模型</label>
            <n-input v-model:value="config.model" placeholder="gpt-3.5-turbo" />
          </div>
        </div>
        <div class="mt-3">
          <n-button size="small" @click="saveConfig">保存配置到本地</n-button>
        </div>
      </n-collapse-item>
    </n-collapse>

    <div class="card chat-card">
      <div class="chat-header flex justify-between items-center mb-3">
        <h3 class="text-sm font-bold">对话窗口</h3>
        <n-button size="small" quaternary @click="clearConversation" :disabled="!messages.length">
          清空对话
        </n-button>
      </div>

      <div class="chat-body" ref="chatBodyRef">
        <div v-if="!messages.length" class="empty-hint">
          开始与 AI 对话吧，输入你的问题并按发送。
        </div>

        <div
          v-for="(msg, index) in messages"
          :key="index"
          class="message-row"
          :class="msg.role === 'user' ? 'message-user' : 'message-assistant'"
        >
          <div class="message-avatar">{{ msg.role === 'user' ? '我' : 'AI' }}</div>
          <div class="message-bubble">
            <pre class="message-content">{{ msg.content }}</pre>
            <n-button
              v-if="msg.role === 'assistant'"
              class="copy-btn"
              size="tiny"
              quaternary
              @click="copyMessage(msg.content)"
            >
              复制
            </n-button>
          </div>
        </div>

        <div v-if="loading" class="message-row message-assistant">
          <div class="message-avatar">AI</div>
          <div class="message-bubble">
            <span class="typing">AI 正在思考...</span>
          </div>
        </div>
      </div>

      <div class="chat-input mt-3">
        <n-input
          v-model:value="inputText"
          type="textarea"
          :rows="3"
          placeholder="输入你的问题，Enter 发送，Shift + Enter 换行..."
          @keydown.enter.exact.prevent="send"
        />
        <n-button
          type="primary"
          class="send-btn"
          :loading="loading"
          :disabled="!inputText.trim()"
          @click="send"
        >
          发送
        </n-button>
      </div>
    </div>

    <n-alert v-if="error" type="error" class="mt-4" closable @close="error = ''">{{ error }}</n-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { NAlert, NCollapse, NCollapseItem, NInput, NButton } from 'naive-ui'
import { useCopy } from '@/composables/useCopy'

const { copy: copyText } = useCopy()

interface Config {
  baseURL: string
  apiKey: string
  model: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const CONFIG_KEY = 'ai_qa_config'

const config = ref<Config>({
  baseURL: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-3.5-turbo',
})

const messages = ref<ChatMessage[]>([])
const inputText = ref('')
const loading = ref(false)
const error = ref('')
const chatBodyRef = ref<HTMLElement | null>(null)

onMounted(() => {
  const saved = localStorage.getItem(CONFIG_KEY)
  if (saved) {
    try {
      config.value = JSON.parse(saved)
    } catch {
      // ignore
    }
  }
})

function saveConfig() {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config.value))
}

function scrollToBottom() {
  nextTick(() => {
    if (chatBodyRef.value) {
      chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight
    }
  })
}

async function send() {
  const content = inputText.value.trim()
  if (!content || loading.value) return

  error.value = ''

  if (!config.value.baseURL || !config.value.apiKey) {
    error.value = '请先填写 API Base URL 和 API Key'
    return
  }

  // 追加用户消息并清空输入框
  messages.value.push({ role: 'user', content })
  inputText.value = ''
  loading.value = true
  scrollToBottom()

  try {
    const url = config.value.baseURL.replace(/\/$/, '') + '/chat/completions'
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.value.apiKey}`,
      },
      body: JSON.stringify({
        model: config.value.model,
        messages: messages.value.map((m) => ({ role: m.role, content: m.content })),
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`HTTP ${response.status}: ${err}`)
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || '未返回内容'
    messages.value.push({ role: 'assistant', content: reply })
    scrollToBottom()
  } catch (e: unknown) {
    error.value = '请求失败：' + (e instanceof Error ? e.message : String(e))
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

function clearConversation() {
  messages.value = []
  error.value = ''
}

// 复制单条消息内容
function copyMessage(content: string) {
  copyText(content)
}
</script>

<style scoped>
.ai-qa { max-width: 900px; margin: 0 auto; }

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-item label {
  font-size: 13px;
  font-weight: 500;
  color: #555;
}

.dark .config-item label { color: #aaa; }

.chat-card {
  display: flex;
  flex-direction: column;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-body {
  height: 420px;
  overflow-y: auto;
  padding: 12px;
  background: var(--card-color, #f7f8fa);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dark .chat-body {
  background: rgba(255, 255, 255, 0.04);
}

.empty-hint {
  margin: auto;
  color: #999;
  font-size: 13px;
}

.message-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  max-width: 100%;
}

.message-user {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  background: #18a058;
}

.message-assistant .message-avatar {
  background: #36ad6a;
}

.message-user .message-avatar {
  background: #2080f0;
}

.message-bubble {
  max-width: 75%;
  padding: 10px 14px;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  word-break: break-word;
}

.dark .message-bubble {
  background: rgba(255, 255, 255, 0.08);
}

.message-user .message-bubble {
  background: #2080f0;
  color: #fff;
}

.dark .message-user .message-bubble {
  background: #2080f0;
  color: #fff;
}

.message-content {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.6;
}

.copy-btn {
  margin-top: 6px;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.copy-btn:hover {
  opacity: 1;
}

.typing {
  color: #999;
  font-size: 13px;
}

.chat-input {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.send-btn {
  flex-shrink: 0;
}
</style>
