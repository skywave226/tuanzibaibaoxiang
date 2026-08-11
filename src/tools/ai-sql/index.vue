<template>
  <div class="ai-sql">
    <n-alert type="info" class="mb-4">
      调用你提供的 OpenAI 兼容接口（支持自定义 baseURL、API Key、模型），根据表结构和自然语言需求生成 SQL 查询。所有配置仅保存在浏览器本地。
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
      <div class="param-row mb-3">
        <span>数据库类型</span>
        <n-select
          v-model:value="dbType"
          :options="dbOptions"
          style="width: 180px"
          size="small"
        />
      </div>

      <div class="pane-label mb-2">表结构描述</div>
      <n-input
        v-model:value="tableSchema"
        type="textarea"
        :rows="6"
        placeholder="描述相关表结构，例如：&#10;users(id INT, name VARCHAR(50), age INT, created_at DATETIME)&#10;orders(id INT, user_id INT, amount DECIMAL(10,2), status VARCHAR(20))"
      />

      <div class="pane-label mb-2 mt-3">自然语言查询需求</div>
      <n-input
        v-model:value="query"
        type="textarea"
        :rows="4"
        placeholder="用自然语言描述你的查询需求，例如：查询每个用户的订单总金额，按金额降序排列前 10 名"
      />

      <div class="toolbar mt-3">
        <n-button
          type="primary"
          @click="generate"
          :loading="loading"
          :disabled="!query.trim()"
        >
          生成 SQL
        </n-button>
        <n-button @click="clear">清空</n-button>
      </div>
    </div>

    <div class="card" v-if="outputText">
      <div class="result-header mb-2 flex justify-between items-center flex-wrap gap-2">
        <h3 class="text-sm font-bold">生成的 SQL</h3>
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
import {
  NAlert,
  NCollapse,
  NCollapseItem,
  NInput,
  NButton,
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

const CONFIG_KEY = 'ai_sql_config'

const config = ref<Config>({
  baseURL: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-3.5-turbo',
})

const dbType = ref('MySQL')
const tableSchema = ref('')
const query = ref('')
const outputText = ref('')
const loading = ref(false)
const error = ref('')

const dbOptions = [
  { label: 'MySQL', value: 'MySQL' },
  { label: 'PostgreSQL', value: 'PostgreSQL' },
  { label: 'SQLite', value: 'SQLite' },
  { label: 'SQL Server', value: 'SQL Server' },
  { label: 'Oracle', value: 'Oracle' },
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
  const schemaSection = tableSchema.value.trim()
    ? `以下是相关的表结构：\n\n${tableSchema.value}\n`
    : '（未提供表结构，请根据需求合理假设表名和字段）\n'

  return `你是一位资深数据库工程师。请根据以下信息生成一条可在 ${dbType.value} 中运行的 SQL 查询语句。

${schemaSection}
查询需求：${query.value}

要求：
1. 只输出 SQL 语句，使用代码块包裹（\`\`\`sql）。
2. 使用 ${dbType.value} 的标准语法与函数。
3. 注意表别名、字段大小写与关键字转义。
4. 如需聚合或连接，请确保语句正确且高效。`
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
        temperature: 0.1,
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
  tableSchema.value = ''
  query.value = ''
  outputText.value = ''
  error.value = ''
}
</script>

<style scoped>
.ai-sql { max-width: 900px; margin: 0 auto; }

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
