<template>
  <div class="ai-report">
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
        <span>报告类型</span>
        <n-radio-group v-model:value="reportType" size="small">
          <n-radio-button value="daily">日报</n-radio-button>
          <n-radio-button value="weekly">周报</n-radio-button>
          <n-radio-button value="monthly">月报</n-radio-button>
          <n-radio-button value="quarterly">季度报告</n-radio-button>
        </n-radio-group>
      </div>

      <div class="param-row mb-3">
        <span>语气风格</span>
        <n-select v-model:value="tone" :options="toneOptions" style="width: 160px" size="small" />
      </div>

      <div class="pane-label mb-2">本周工作要点（每行一个要点）</div>
      <n-input
        v-model:value="workPoints"
        type="textarea"
        :rows="8"
        placeholder="例如：&#10;完成了用户登录模块的开发&#10;修复了支付流程的 3 个 bug&#10;参加了产品需求评审会议"
      />

      <div class="pane-label mb-2 mt-3">遇到的问题（可选）</div>
      <n-input
        v-model:value="problems"
        type="textarea"
        :rows="4"
        placeholder="例如：&#10;第三方接口文档不完善，对接进度受阻"
      />

      <div class="pane-label mb-2 mt-3">下周计划（可选）</div>
      <n-input
        v-model:value="nextPlan"
        type="textarea"
        :rows="4"
        placeholder="例如：&#10;完成订单管理模块&#10;优化首页加载性能"
      />

      <div class="toolbar mt-3">
        <n-button type="primary" @click="generate" :loading="loading" :disabled="!workPoints.trim()">
          生成报告
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
      <n-input v-model:value="outputText" type="textarea" :rows="14" readonly />
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

const CONFIG_KEY = 'ai_report_config'

const config = ref<Config>({
  baseURL: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-3.5-turbo',
})

const reportType = ref<'daily' | 'weekly' | 'monthly' | 'quarterly'>('weekly')
const tone = ref('concise')
const workPoints = ref('')
const problems = ref('')
const nextPlan = ref('')
const outputText = ref('')
const loading = ref(false)
const error = ref('')

const toneOptions = [
  { label: '简洁务实', value: 'concise' },
  { label: '详细完整', value: 'detailed' },
  { label: '数据导向', value: 'data' },
  { label: '成果展示', value: 'showcase' },
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
    daily: '日报',
    weekly: '周报',
    monthly: '月报',
    quarterly: '季度报告',
  }
  const toneMap: Record<string, string> = {
    concise: '简洁务实，突出重点，避免冗余',
    detailed: '详细完整，条理清晰，覆盖全面',
    data: '数据导向，用量化指标说明进展与成果',
    showcase: '成果展示，强调价值与贡献，积极正向',
  }

  const points = workPoints.value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, i) => `${i + 1}. ${line}`)
    .join('\n')

  const problemSection = problems.value.trim()
    ? `\n\n【遇到的问题】\n${problems.value.trim()}`
    : ''

  const planSection = nextPlan.value.trim()
    ? `\n\n【下周计划】\n${nextPlan.value.trim()}`
    : ''

  return `请根据以下信息，生成一份工作${typeMap[reportType.value]}。要求语气风格：${toneMap[tone.value]}。

【工作要点】
${points}${problemSection}${planSection}

请按照工作${typeMap[reportType.value]}的标准结构组织内容，包含：概述、主要工作、问题与风险、下一步计划等部分。输出使用 Markdown 格式。`
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
        temperature: 0.5,
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
  workPoints.value = ''
  problems.value = ''
  nextPlan.value = ''
  outputText.value = ''
  error.value = ''
}
</script>

<style scoped>
.ai-report { max-width: 900px; margin: 0 auto; }

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

.mt-3 { margin-top: 12px; }

@media (max-width: 768px) {
  .config-grid { grid-template-columns: 1fr; }
}
</style>
