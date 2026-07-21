<template>
  <div class="ai-writer">
    <n-alert type="info" class="mb-4">
      调用你提供的 OpenAI 兼容接口（支持自定义 baseURL、API Key、模型）。所有配置仅保存在浏览器本地。
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

    <div class="card mb-4">
      <div class="mode-row mb-3">
        <span>任务类型</span>
        <n-radio-group v-model:value="task" size="small">
          <n-radio-button value="write">继续写作</n-radio-button>
          <n-radio-button value="rewrite">改写润色</n-radio-button>
          <n-radio-button value="title">生成标题</n-radio-button>
          <n-radio-button value="summary">提炼摘要</n-radio-button>
          <n-radio-button value="expand">扩写内容</n-radio-button>
        </n-radio-group>
      </div>

      <div class="param-row mb-3">
        <span>语气风格</span>
        <n-select v-model:value="tone" :options="toneOptions" style="width: 160px" size="small" />
        <span class="ml-4">输出长度</span>
        <n-select v-model:value="length" :options="lengthOptions" style="width: 120px" size="small" />
      </div>

      <div class="pane-label mb-2">输入内容 / 提示词</div>
      <n-input
        v-model:value="inputText"
        type="textarea"
        :rows="8"
        placeholder="输入需要 AI 处理的文字或主题..."
      />

      <div class="toolbar mt-3">
        <n-button type="primary" @click="generate" :loading="loading" :disabled="!inputText.trim()">
          生成
        </n-button>
        <n-button @click="clear">清空</n-button>
      </div>
    </div>

    <div class="card" v-if="outputText">
      <div class="result-header mb-2 flex justify-between items-center flex-wrap gap-2">
        <h3 class="text-sm font-bold">AI 生成结果</h3>
        <n-space>
          <n-button size="small" @click="copy">复制</n-button>
          <n-button size="small" @click="useAsInput">结果作为输入</n-button>
          <n-button size="small" @click="outputText = ''">隐藏</n-button>
        </n-space>
      </div>
      <n-input v-model:value="outputText" type="textarea" :rows="12" readonly />
    </div>

    <n-alert v-if="error" type="error" class="mt-4" closable @close="error = ''">{{ error }}</n-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NAlert, NCollapse, NCollapseItem, NInput, NButton, NRadioGroup, NRadioButton, NSelect, NSpace } from 'naive-ui'

interface Config {
  baseURL: string
  apiKey: string
  model: string
}

const CONFIG_KEY = 'ai_writer_config'

const config = ref<Config>({
  baseURL: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-3.5-turbo',
})

const task = ref<'write' | 'rewrite' | 'title' | 'summary' | 'expand'>('write')
const tone = ref('professional')
const length = ref('medium')
const inputText = ref('')
const outputText = ref('')
const loading = ref(false)
const error = ref('')

const toneOptions = [
  { label: '专业正式', value: 'professional' },
  { label: '轻松随意', value: 'casual' },
  { label: '幽默风趣', value: 'humorous' },
  { label: '营销种草', value: 'marketing' },
  { label: '学术严谨', value: 'academic' },
]

const lengthOptions = [
  { label: '简短', value: 'short' },
  { label: '适中', value: 'medium' },
  { label: '详细', value: 'long' },
]

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

function buildPrompt(): string {
  const toneMap: Record<string, string> = {
    professional: '专业正式',
    casual: '轻松随意',
    humorous: '幽默风趣',
    marketing: '营销种草',
    academic: '学术严谨',
  }
  const lengthMap: Record<string, string> = {
    short: '简短（100字以内）',
    medium: '适中（200-400字）',
    long: '详细（500字以上）',
  }

  const prefix = `请以"${toneMap[tone.value]}"的风格，生成${lengthMap[length.value]}的内容。`

  switch (task.value) {
    case 'write':
      return `${prefix}根据以下主题或开头继续写作：\n\n${inputText.value}`
    case 'rewrite':
      return `${prefix}改写并润色以下内容，使其更通顺、有吸引力：\n\n${inputText.value}`
    case 'title':
      return `请为以下内容生成 5 个吸引人的标题，风格为"${toneMap[tone.value]}"：\n\n${inputText.value}`
    case 'summary':
      return `请提炼以下内容的摘要，${lengthMap[length.value]}：\n\n${inputText.value}`
    case 'expand':
      return `${prefix}扩写以下内容，增加细节和可读性：\n\n${inputText.value}`
    default:
      return inputText.value
  }
}

async function generate() {
  error.value = ''
  outputText.value = ''
  loading.value = true

  if (!config.value.baseURL || !config.value.apiKey) {
    error.value = '请先填写 API Base URL 和 API Key'
    loading.value = false
    return
  }

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
        messages: [{ role: 'user', content: buildPrompt() }],
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`HTTP ${response.status}: ${err}`)
    }

    const data = await response.json()
    outputText.value = data.choices?.[0]?.message?.content || '未返回内容'
  } catch (e: unknown) {
    error.value = '生成失败：' + (e instanceof Error ? e.message : String(e))
  } finally {
    loading.value = false
  }
}

function copy() {
  navigator.clipboard.writeText(outputText.value)
}

function useAsInput() {
  inputText.value = outputText.value
  outputText.value = ''
}

function clear() {
  inputText.value = ''
  outputText.value = ''
  error.value = ''
}
</script>

<style scoped>
.ai-writer { max-width: 900px; margin: 0 auto; }

.config-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.config-item label {
  font-size: 12px;
  color: #888;
  font-weight: 500;
}

.mode-row, .param-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
}

.toolbar {
  display: flex;
  gap: 12px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.ml-4 { margin-left: 16px; }

@media (max-width: 768px) {
  .config-grid { grid-template-columns: 1fr; }
}
</style>
