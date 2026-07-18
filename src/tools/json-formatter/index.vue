<template>
  <div class="json-formatter">
    <div class="toolbar">
      <n-space align="center" wrap>
        <n-button type="primary" @click="format">格式化</n-button>
        <n-button @click="compress">压缩</n-button>
        <n-button @click="toCsv">转 CSV</n-button>
        <n-button @click="toTsv">转 TSV</n-button>
        <n-button @click="clearAll">清空</n-button>
      </n-space>
      <n-space align="center" wrap>
        <n-input
          v-model:value="jsonPath"
          placeholder="JSONPath，如 $.store.book[0].title"
          style="width: 240px"
          size="small"
        />
        <n-button size="small" @click="queryJsonPath">JSONPath 查询</n-button>
        <n-button size="small" @click="showSchema = !showSchema">
          {{ showSchema ? '隐藏 Schema' : 'Schema 校验' }}
        </n-button>
      </n-space>
      <n-tag v-if="errorMsg" type="error">{{ errorMsg }}</n-tag>
      <n-tag v-else-if="input && isValid && !errorMsg" type="success">✓ JSON 合法</n-tag>
    </div>

    <div v-if="showSchema" class="schema-panel">
      <div class="pane-label">JSON Schema</div>
      <n-space align="center" class="mb-2">
        <n-button size="small" type="primary" @click="validateSchema">校验</n-button>
        <n-button size="small" @click="loadSampleSchema">加载示例 Schema</n-button>
      </n-space>
      <n-input
        v-model:value="schemaInput"
        type="textarea"
        placeholder='输入 JSON Schema，例如 {"type":"object","properties":{"name":{"type":"string"}}}'
        :autosize="false"
        rows="6"
        class="code-input"
      />
    </div>

    <div class="editor-area">
      <div class="editor-pane">
        <div class="pane-label">输入</div>
        <n-input
          v-model:value="input"
          type="textarea"
          placeholder='粘贴 JSON，例如：{"key":"value"}'
          class="code-input"
          :autosize="false"
          rows="16"
        />
      </div>
      <div class="editor-pane">
        <div class="pane-label">输出</div>
        <n-input
          :value="output"
          type="textarea"
          readonly
          class="code-input"
          :autosize="false"
          rows="16"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NButton, NSpace, NInput, NTag } from 'naive-ui'

const input = ref('')
const output = ref('')
const errorMsg = ref('')
const jsonPath = ref('')
const showSchema = ref(false)
const schemaInput = ref('')

const isValid = computed(() => {
  if (!input.value.trim()) return false
  try { JSON.parse(input.value); return true } catch { return false }
})

function parseInput(): unknown {
  return JSON.parse(input.value)
}

function format() {
  try {
    const obj = parseInput()
    output.value = JSON.stringify(obj, null, 2)
    errorMsg.value = ''
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : String(e)
    output.value = ''
  }
}

function compress() {
  try {
    const obj = parseInput()
    output.value = JSON.stringify(obj)
    errorMsg.value = ''
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : String(e)
    output.value = ''
  }
}

async function queryJsonPath() {
  if (!jsonPath.value.trim()) {
    errorMsg.value = '请输入 JSONPath 表达式'
    return
  }
  try {
    const { JSONPath } = await import('jsonpath-plus')
    const obj = parseInput()
    const result = JSONPath({ path: jsonPath.value, json: obj as object | any[] | null })
    output.value = JSON.stringify(result, null, 2)
    errorMsg.value = ''
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : String(e)
    output.value = ''
  }
}

async function validateSchema() {
  if (!schemaInput.value.trim()) {
    errorMsg.value = '请输入 JSON Schema'
    return
  }
  try {
    const Ajv = (await import('ajv')).default
    const ajv = new Ajv({ allErrors: true })
    const schema = JSON.parse(schemaInput.value)
    const validate = ajv.compile(schema)
    const data = parseInput()
    const valid = validate(data)
    if (valid) {
      output.value = '✓ JSON 数据符合 Schema'
      errorMsg.value = ''
    } else {
      output.value = (validate.errors || [])
        .map((err) => `${err.instancePath || '/'}: ${err.message}`)
        .join('\n')
      errorMsg.value = 'Schema 校验失败'
    }
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : String(e)
    output.value = ''
  }
}

function loadSampleSchema() {
  schemaInput.value = JSON.stringify(
    {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number', minimum: 0 },
      },
      required: ['name'],
    },
    null,
    2
  )
}

function jsonToFlatRows(data: unknown): Record<string, string>[] {
  if (!Array.isArray(data)) {
    throw new Error('只有 JSON 数组才能转换为 CSV/TSV')
  }
  const rows: Record<string, string>[] = []
  const keys = new Set<string>()
  for (const item of data) {
    const flat: Record<string, string> = {}
    flatten(item, '', flat)
    rows.push(flat)
    Object.keys(flat).forEach((k) => keys.add(k))
  }
  return rows
}

function flatten(value: unknown, prefix: string, result: Record<string, string>) {
  if (value === null || value === undefined) return
  if (typeof value === 'object' && !Array.isArray(value)) {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const key = prefix ? `${prefix}.${k}` : k
      if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
        flatten(v, key, result)
      } else {
        result[key] = String(v ?? '')
      }
    }
  } else {
    result[prefix || 'value'] = String(value)
  }
}

function escapeCsv(value: string, delimiter: string) {
  if (value.includes(delimiter) || value.includes('"') || value.includes('\n')) {
    return '"' + value.replace(/"/g, '""') + '"'
  }
  return value
}

function convertToDelimited(delimiter: string) {
  try {
    const rows = jsonToFlatRows(parseInput())
    if (rows.length === 0) {
      output.value = ''
      return
    }
    const keys = Object.keys(rows[0])
    const lines = [
      keys.join(delimiter),
      ...rows.map((row) => keys.map((k) => escapeCsv(row[k] ?? '', delimiter)).join(delimiter)),
    ]
    output.value = lines.join('\n')
    errorMsg.value = ''
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : String(e)
    output.value = ''
  }
}

function toCsv() {
  convertToDelimited(',')
}

function toTsv() {
  convertToDelimited('\t')
}

function clearAll() {
  input.value = ''
  output.value = ''
  errorMsg.value = ''
  jsonPath.value = ''
  schemaInput.value = ''
  showSchema.value = false
}
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}
.schema-panel {
  margin-bottom: 16px;
  padding: 12px;
  background: #f8f8f8;
  border-radius: 8px;
}
.editor-area {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  margin-bottom: 8px;
  text-transform: uppercase;
}
.code-input :deep(textarea) {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
}
.mb-2 {
  margin-bottom: 8px;
}
.dark .schema-panel {
  background: #2a2a3a;
}
@media (max-width: 768px) {
  .editor-area {
    grid-template-columns: 1fr;
  }
}
</style>
