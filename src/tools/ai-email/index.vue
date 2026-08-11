<template>
  <div class="ai-email">
    <n-alert type="info" class="mb-4">
      调用你提供的 OpenAI 兼容接口生成商务邮件。所有配置仅保存在浏览器本地。
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
        <span>邮件类型</span>
        <n-radio-group v-model:value="emailType" size="small">
          <n-radio-button value="new">撰写新邮件</n-radio-button>
          <n-radio-button value="reply">回复邮件</n-radio-button>
          <n-radio-button value="followup">跟进邮件</n-radio-button>
          <n-radio-button value="thanks">感谢邮件</n-radio-button>
          <n-radio-button value="apology">道歉邮件</n-radio-button>
        </n-radio-group>
      </div>

      <div class="param-row mb-3">
        <span>语气</span>
        <n-select v-model:value="tone" :options="toneOptions" style="width: 160px" size="small" />
      </div>

      <div class="form-grid mb-3">
        <div class="form-item">
          <label>收件人描述</label>
          <n-input v-model:value="recipient" placeholder="如：客户张总、技术部全体成员" />
        </div>
        <div class="form-item">
          <label>邮件主题 / 目的</label>
          <n-input v-model:value="subject" placeholder="如：项目进度汇报、产品报价咨询" />
        </div>
      </div>

      <div class="pane-label mb-2">补充说明（关键要点、背景信息等）</div>
      <n-input
        v-model:value="inputText"
        type="textarea"
        :rows="6"
        placeholder="输入邮件需要涵盖的关键要点或背景信息，例如：项目已完成 80%，预计下周交付，需协调测试资源..."
      />

      <div class="toolbar mt-3">
        <n-button type="primary" @click="generate" :loading="loading" :disabled="!subject.trim()">
          生成邮件
        </n-button>
        <n-button @click="clear">清空</n-button>
      </div>
    </div>

    <div class="card" v-if="outputText">
      <div class="result-header mb-2 flex justify-between items-center flex-wrap gap-2">
        <h3 class="text-sm font-bold">生成结果</h3>
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
import { NAlert, NCollapse, NCollapseItem, NInput, NButton, NRadioGroup, NRadioButton, NSelect, NSpace, useMessage } from 'naive-ui'
import { useCopy } from '@/composables/useCopy'

interface Config {
  baseURL: string
  apiKey: string
  model: string
}

const CONFIG_KEY = 'ai_email_config'
const message = useMessage()
const { copy: copyText } = useCopy()

const config = ref<Config>({
  baseURL: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-3.5-turbo',
})

const emailType = ref<'new' | 'reply' | 'followup' | 'thanks' | 'apology'>('new')
const tone = ref('formal')
const recipient = ref('')
const subject = ref('')
const inputText = ref('')
const outputText = ref('')
const loading = ref(false)
const error = ref('')

const toneOptions = [
  { label: '正式商务', value: 'formal' },
  { label: '友好亲切', value: 'friendly' },
  { label: '严肃认真', value: 'serious' },
  { label: '热情温暖', value: 'warm' },
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
    formal: '正式商务',
    friendly: '友好亲切',
    serious: '严肃认真',
    warm: '热情温暖',
  }
  const typeMap: Record<string, string> = {
    new: '撰写一封新邮件',
    reply: '撰写一封回复邮件',
    followup: '撰写一封跟进邮件，用于推动事项进展',
    thanks: '撰写一封感谢邮件',
    apology: '撰写一封道歉邮件',
  }

  const lines: string[] = []
  lines.push(`请以"${toneMap[tone.value]}"的语气${typeMap[emailType.value]}。`)
  lines.push(`收件人：${recipient.value || '未指定'}`)
  lines.push(`邮件主题 / 目的：${subject.value}`)
  if (inputText.value.trim()) {
    lines.push(`补充说明：${inputText.value}`)
  }
  lines.push('')
  lines.push('请输出完整的邮件正文，包含恰当的称呼、正文与落款。只输出邮件内容，不要额外解释。')

  return lines.join('\n')
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
  recipient.value = ''
  subject.value = ''
  inputText.value = ''
  outputText.value = ''
  error.value = ''
}
</script>

<style scoped>
.ai-email { max-width: 900px; margin: 0 auto; }

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

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-item label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
}

.dark .form-item label { color: #aaa; }

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

@media (max-width: 768px) {
  .config-grid { grid-template-columns: 1fr; }
  .form-grid { grid-template-columns: 1fr; }
}
</style>
