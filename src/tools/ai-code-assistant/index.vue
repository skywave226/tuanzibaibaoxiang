<template>
  <div class="ai-code-assistant">
    <n-alert type="info" class="mb-4">
      调用你提供的 OpenAI 兼容接口（支持自定义 baseURL、API Key、模型）进行代码生成、解释、重构与 Bug 修复。所有配置仅保存在浏览器本地。
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
      <div class="task-row mb-3">
        <span>任务类型</span>
        <n-radio-group v-model:value="task" size="small">
          <n-radio-button value="generate">代码生成</n-radio-button>
          <n-radio-button value="explain">代码解释</n-radio-button>
          <n-radio-button value="refactor">代码重构</n-radio-button>
          <n-radio-button value="fix">Bug 修复</n-radio-button>
        </n-radio-group>
      </div>

      <div class="param-row mb-3">
        <span>编程语言</span>
        <n-select
          v-model:value="language"
          :options="languageOptions"
          style="width: 180px"
          size="small"
          filterable
        />
      </div>

      <div class="pane-label mb-2">输入内容 / 代码</div>
      <n-input
        v-model:value="inputText"
        type="textarea"
        :rows="10"
        :placeholder="inputPlaceholder"
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
      <n-input v-model:value="outputText" type="textarea" :rows="14" readonly />
    </div>

    <n-alert v-if="error" type="error" class="mt-4" closable @close="error = ''">{{ error }}</n-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  NAlert,
  NCollapse,
  NCollapseItem,
  NInput,
  NButton,
  NRadioGroup,
  NRadioButton,
  NSelect,
  NSpace,
} from 'naive-ui'
import { useCopy } from '@/composables/useCopy'

const { copy: copyText } = useCopy()

interface Config {
  baseURL: string
  apiKey: string
  model: string
}

const CONFIG_KEY = 'ai_code_config'

const config = ref<Config>({
  baseURL: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-3.5-turbo',
})

type TaskType = 'generate' | 'explain' | 'refactor' | 'fix'

const task = ref<TaskType>('generate')
const language = ref('JavaScript')
const inputText = ref('')
const outputText = ref('')
const loading = ref(false)
const error = ref('')

const languageOptions = [
  { label: 'JavaScript', value: 'JavaScript' },
  { label: 'TypeScript', value: 'TypeScript' },
  { label: 'Python', value: 'Python' },
  { label: 'Java', value: 'Java' },
  { label: 'Go', value: 'Go' },
  { label: 'Rust', value: 'Rust' },
  { label: 'C++', value: 'C++' },
  { label: 'PHP', value: 'PHP' },
  { label: 'SQL', value: 'SQL' },
  { label: 'Shell', value: 'Shell' },
]

const inputPlaceholder = computed(() => {
  switch (task.value) {
    case 'generate':
      return '描述你想要生成的代码功能，例如：实现一个快速排序算法...'
    case 'explain':
      return '粘贴需要解释的代码...'
    case 'refactor':
      return '粘贴需要重构/优化的代码...'
    case 'fix':
      return '粘贴有 Bug 的代码，可附上错误信息...'
    default:
      return '输入内容...'
  }
})

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
  const lang = language.value

  switch (task.value) {
    case 'generate':
      return `你是一位资深${lang}工程师。请根据以下需求生成高质量的${lang}代码，要求代码规范、可读性强，并附带简要注释说明关键逻辑：\n\n${inputText.value}`
    case 'explain':
      return `你是一位资深${lang}工程师。请逐行解释以下${lang}代码的功能、逻辑和实现思路，必要时指出潜在问题：\n\n\`\`\`${lang}\n${inputText.value}\n\`\`\``
    case 'refactor':
      return `你是一位资深${lang}工程师。请重构并优化以下${lang}代码，提升其可读性、性能与可维护性，并说明你做了哪些改进：\n\n\`\`\`${lang}\n${inputText.value}\n\`\`\``
    case 'fix':
      return `你是一位资深${lang}工程师。请找出以下${lang}代码中的 Bug 并修复，输出修复后的完整代码，并简要说明问题原因：\n\n\`\`\`${lang}\n${inputText.value}\n\`\`\``
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
        temperature: 0.2,
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
  copyText(outputText.value)
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
.ai-code-assistant { max-width: 900px; margin: 0 auto; }

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

.task-row,
.param-row {
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

.toolbar { display: flex; gap: 12px; }

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
