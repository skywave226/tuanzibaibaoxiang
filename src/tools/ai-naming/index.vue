<template>
  <div class="ai-naming">
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
        <span>命名类型</span>
        <n-radio-group v-model:value="namingType" size="small">
          <n-radio-button value="product">产品名</n-radio-button>
          <n-radio-button value="project">项目名</n-radio-button>
          <n-radio-button value="brand">品牌名</n-radio-button>
          <n-radio-button value="domain">域名</n-radio-button>
          <n-radio-button value="app">APP 名</n-radio-button>
          <n-radio-button value="team">团队名</n-radio-button>
        </n-radio-group>
      </div>

      <div class="input-row mb-3">
        <div class="input-item">
          <label>行业 / 领域</label>
          <n-input v-model:value="industry" placeholder="如：在线教育" />
        </div>
        <div class="input-item">
          <label>关键词 / 调性</label>
          <n-input v-model:value="keywords" placeholder="如：科技、简洁、易记" />
        </div>
      </div>

      <div class="param-row mb-3">
        <span>命名风格</span>
        <n-select v-model:value="style" :options="styleOptions" style="width: 150px" size="small" />
        <span class="ml-4">字数限制</span>
        <n-select v-model:value="wordLimit" :options="wordLimitOptions" style="width: 110px" size="small" />
        <span class="ml-4">生成数量</span>
        <n-select v-model:value="count" :options="countOptions" style="width: 100px" size="small" />
      </div>

      <div class="toolbar mt-3">
        <n-button type="primary" @click="generate" :loading="loading" :disabled="!industry.trim()">
          生成名称
        </n-button>
        <n-button @click="clear">清空</n-button>
      </div>
    </div>

    <div class="card" v-if="outputText">
      <div class="result-header mb-2 flex justify-between items-center flex-wrap gap-2">
        <h3 class="text-sm font-bold">AI 生成结果</h3>
        <n-space>
          <n-button size="small" @click="copy">复制</n-button>
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
import { useCopy } from '@/composables/useCopy'

const { copy: copyText } = useCopy()

interface Config {
  baseURL: string
  apiKey: string
  model: string
}

const CONFIG_KEY = 'ai_naming_config'

const config = ref<Config>({
  baseURL: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-3.5-turbo',
})

const namingType = ref<'product' | 'project' | 'brand' | 'domain' | 'app' | 'team'>('product')
const industry = ref('')
const keywords = ref('')
const style = ref('modern')
const wordLimit = ref('unlimited')
const count = ref(10)
const outputText = ref('')
const loading = ref(false)
const error = ref('')

const styleOptions = [
  { label: '现代简约', value: 'modern' },
  { label: '古典文雅', value: 'classical' },
  { label: '科技未来', value: 'futuristic' },
  { label: '活泼有趣', value: 'lively' },
  { label: '国际范', value: 'international' },
]

const wordLimitOptions = [
  { label: '不限', value: 'unlimited' },
  { label: '2 字', value: '2' },
  { label: '3 字', value: '3' },
  { label: '4 字', value: '4' },
]

const countOptions = [
  { label: '5 个', value: 5 },
  { label: '10 个', value: 10 },
  { label: '15 个', value: 15 },
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
  const typeMap: Record<string, string> = {
    product: '产品名称',
    project: '项目名称',
    brand: '品牌名称',
    domain: '域名',
    app: 'APP 名称',
    team: '团队名称',
  }
  const styleMap: Record<string, string> = {
    modern: '现代简约',
    classical: '古典文雅',
    futuristic: '科技未来',
    lively: '活泼有趣',
    international: '国际范',
  }
  const wordLimitText = wordLimit.value === 'unlimited'
    ? '字数不限'
    : `字数限制为 ${wordLimit.value} 个字`

  const keywordSection = keywords.value.trim()
    ? `\n关键词/调性：${keywords.value.trim()}`
    : ''

  return `请为一款「${industry.value.trim()}」领域的${typeMap[namingType.value]}生成 ${count.value} 个候选方案。

要求：
- 命名风格：${styleMap[style.value]}
- ${wordLimitText}
- 名称应简洁好记、富有辨识度、易于传播
- 每个名称附带一句话释义说明其寓意

${keywordSection ? keywordSection + '\n' : ''}请按以下格式输出：
1. 【名称】 —— 释义
2. 【名称】 —— 释义
...`
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
        temperature: 0.9,
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

function clear() {
  industry.value = ''
  keywords.value = ''
  outputText.value = ''
  error.value = ''
}
</script>

<style scoped>
.ai-naming { max-width: 900px; margin: 0 auto; }

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

.mode-row, .param-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.input-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.input-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-item label {
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

.mt-3 { margin-top: 12px; }
.ml-4 { margin-left: 16px; }

@media (max-width: 768px) {
  .config-grid { grid-template-columns: 1fr; }
  .input-row { grid-template-columns: 1fr; }
}
</style>
