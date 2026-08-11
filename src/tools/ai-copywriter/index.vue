<template>
  <div class="ai-copywriter">
    <n-alert type="info" class="mb-4">
      调用你提供的 OpenAI 兼容接口生成营销文案。所有配置仅保存在浏览器本地。
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
      <div class="type-row mb-3">
        <span>文案类型</span>
        <n-radio-group v-model:value="copyType" size="small">
          <n-radio-button value="product">产品描述</n-radio-button>
          <n-radio-button value="ad">广告语</n-radio-button>
          <n-radio-button value="seeding">种草文案</n-radio-button>
          <n-radio-button value="moments">朋友圈文案</n-radio-button>
          <n-radio-button value="video">短视频脚本</n-radio-button>
          <n-radio-button value="seo">SEO 文章</n-radio-button>
        </n-radio-group>
      </div>

      <div class="param-row mb-3">
        <span>语气风格</span>
        <n-select v-model:value="tone" :options="toneOptions" style="width: 160px" size="small" />
        <span class="ml-4">字数要求</span>
        <n-select v-model:value="length" :options="lengthOptions" style="width: 160px" size="small" />
      </div>

      <div class="pane-label mb-2">产品 / 主题描述</div>
      <n-input
        v-model:value="inputText"
        type="textarea"
        :rows="6"
        placeholder="输入产品名称、特点、卖点或主题描述，例如：一款主打保湿的天然面膜，适合干性肌肤..."
      />

      <div class="toolbar mt-3">
        <n-button type="primary" @click="generate" :loading="loading" :disabled="!inputText.trim()">
          生成文案
        </n-button>
        <n-button @click="clear">清空</n-button>
      </div>
    </div>

    <div class="card" v-if="outputText">
      <div class="result-header mb-2 flex justify-between items-center flex-wrap gap-2">
        <h3 class="text-sm font-bold">生成结果</h3>
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
import { NAlert, NCollapse, NCollapseItem, NInput, NButton, NRadioGroup, NRadioButton, NSelect, NSpace, useMessage } from 'naive-ui'
import { useCopy } from '@/composables/useCopy'

interface Config {
  baseURL: string
  apiKey: string
  model: string
}

const CONFIG_KEY = 'ai_copywriter_config'
const message = useMessage()
const { copy: copyText } = useCopy()

const config = ref<Config>({
  baseURL: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-3.5-turbo',
})

const copyType = ref<'product' | 'ad' | 'seeding' | 'moments' | 'video' | 'seo'>('product')
const tone = ref('professional')
const length = ref('medium')
const inputText = ref('')
const outputText = ref('')
const loading = ref(false)
const error = ref('')

const toneOptions = [
  { label: '专业正式', value: 'professional' },
  { label: '轻松活泼', value: 'casual' },
  { label: '幽默搞笑', value: 'humorous' },
  { label: '情感走心', value: 'emotional' },
  { label: '促销紧迫', value: 'urgent' },
  { label: '高端大气', value: 'premium' },
]

const lengthOptions = [
  { label: '简短（50字）', value: 'short' },
  { label: '适中（100-200字）', value: 'medium' },
  { label: '详细（300字以上）', value: 'long' },
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
  message.success('配置已保存')
}

function buildPrompt(): string {
  const toneMap: Record<string, string> = {
    professional: '专业正式',
    casual: '轻松活泼',
    humorous: '幽默搞笑',
    emotional: '情感走心',
    urgent: '促销紧迫',
    premium: '高端大气',
  }
  const lengthMap: Record<string, string> = {
    short: '简短（约50字）',
    medium: '适中（100-200字）',
    long: '详细（300字以上）',
  }
  const typeMap: Record<string, string> = {
    product: '产品描述文案，突出产品特点与卖点，吸引目标用户',
    ad: '广告语，简短有力、朗朗上口，突出核心卖点',
    seeding: '种草文案，以第一人称真实体验口吻撰写，适合社交平台发布',
    moments: '朋友圈文案，简短有吸引力，适合配图发布，可带适量 emoji',
    video: '短视频脚本，包含分镜描述、画面内容与口播文案',
    seo: 'SEO 文章，包含标题、关键词布局与正文，结构清晰利于搜索引擎收录',
  }

  const prefix = `请以"${toneMap[tone.value]}"的语气风格，生成${lengthMap[length.value]}的${typeMap[copyType.value]}。`
  return `${prefix}\n\n产品 / 主题信息：\n${inputText.value}`
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
        temperature: 0.8,
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
.ai-copywriter { max-width: 900px; margin: 0 auto; }

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

.type-row, .param-row {
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
