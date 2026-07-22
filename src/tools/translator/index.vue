<template>
  <div class="translator">
    <n-alert type="info" class="mb-4">
      调用你提供的 OpenAI 兼容接口进行中英文翻译。所有配置仅保存在浏览器本地。
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
      <div class="direction-row mb-3">
        <span>翻译方向</span>
        <n-radio-group v-model:value="direction" size="small">
          <n-radio-button value="auto">自动检测</n-radio-button>
          <n-radio-button value="zh2en">中译英</n-radio-button>
          <n-radio-button value="en2zh">英译中</n-radio-button>
        </n-radio-group>
      </div>

      <div class="pane-label mb-2">输入文本</div>
      <n-input
        v-model:value="inputText"
        type="textarea"
        :rows="8"
        placeholder="输入需要翻译的中文或英文..."
      />

      <div class="toolbar mt-3">
        <n-button type="primary" @click="translate" :loading="loading" :disabled="!inputText.trim()">
          翻译
        </n-button>
        <n-button @click="clear">清空</n-button>
      </div>
    </div>

    <div class="card" v-if="outputText">
      <div class="result-header mb-2 flex justify-between items-center flex-wrap gap-2">
        <h3 class="text-sm font-bold">翻译结果</h3>
        <n-space>
          <n-button size="small" @click="copy">复制</n-button>
          <n-button size="small" @click="useAsInput">结果作为输入</n-button>
          <n-button size="small" @click="outputText = ''">隐藏</n-button>
        </n-space>
      </div>
      <n-input v-model:value="outputText" type="textarea" :rows="8" readonly />
    </div>

    <n-alert v-if="error" type="error" class="mt-4" closable @close="error = ''">{{ error }}</n-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NAlert, NCollapse, NCollapseItem, NInput, NButton, NRadioGroup, NRadioButton, NSpace, useMessage } from 'naive-ui'

interface Config {
  baseURL: string
  apiKey: string
  model: string
}

const CONFIG_KEY = 'translator_config'
const message = useMessage()

const config = ref<Config>({
  baseURL: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-3.5-turbo',
})

const direction = ref<'auto' | 'zh2en' | 'en2zh'>('auto')
const inputText = ref('')
const outputText = ref('')
const loading = ref(false)
const error = ref('')

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
  message.success('配置已保存')
}

function buildPrompt(): string {
  const dirMap: Record<string, string> = {
    auto: '检测到中文则翻译成英文，检测到英文则翻译成中文',
    zh2en: '将以下中文翻译成自然流畅的英文',
    en2zh: '将以下英文翻译成自然流畅的中文',
  }
  return `${dirMap[direction.value]}。只输出翻译结果，不要解释，不要加引号：\n\n${inputText.value}`
}

async function translate() {
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
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`HTTP ${response.status}: ${err}`)
    }

    const data = await response.json()
    outputText.value = data.choices?.[0]?.message?.content || '未返回内容'
  } catch (e: unknown) {
    error.value = '翻译失败：' + (e instanceof Error ? e.message : String(e))
  } finally {
    loading.value = false
  }
}

function copy() {
  navigator.clipboard.writeText(outputText.value).then(() => {
    message.success('已复制')
  }).catch(() => {
    message.error('复制失败')
  })
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
.translator { max-width: 900px; margin: 0 auto; }

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

.direction-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
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
