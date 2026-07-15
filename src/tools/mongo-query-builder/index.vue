<template>
  <div class="mongo-query-builder">
    <!-- 顶部工具栏：逻辑组合 + 操作按钮 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <n-tag :bordered="false" type="info">逻辑组合</n-tag>
        <n-radio-group v-model:value="logic">
          <n-radio-button value="AND">AND（且）</n-radio-button>
          <n-radio-button value="OR">OR（或）</n-radio-button>
        </n-radio-group>
      </div>
      <div class="toolbar-right">
        <n-button type="primary" @click="addCondition">+ 添加条件</n-button>
        <n-button @click="loadSample">加载示例</n-button>
        <n-button @click="clearAll">清空</n-button>
      </div>
    </div>

    <!-- 条件列表 -->
    <div class="conditions">
      <n-empty v-if="conditions.length === 0" description="点击「添加条件」开始构建查询" />
      <div v-for="cond in conditions" :key="cond.id" class="condition-row">
        <n-input
          v-model:value="cond.field"
          placeholder="字段名，如 name"
          class="field-input"
        />
        <n-select
          v-model:value="cond.operator"
          :options="operatorOptions"
          class="op-select"
        />
        <!-- $exists 使用布尔开关 -->
        <n-switch
          v-if="cond.operator === '$exists'"
          v-model:value="cond.boolValue"
        >
          <template #checked>存在</template>
          <template #unchecked>不存在</template>
        </n-switch>
        <!-- $in / $nin 输入多个值 -->
        <n-input
          v-else-if="cond.operator === '$in' || cond.operator === '$nin'"
          v-model:value="cond.value"
          placeholder="多个值，逗号分隔，如 a,b,c"
          class="value-input"
        />
        <!-- 其余操作符输入单值 -->
        <n-input
          v-else
          v-model:value="cond.value"
          placeholder="值，如 Alice / 18 / true"
          class="value-input"
        />
        <n-button quaternary type="error" @click="removeCondition(cond.id)">删除</n-button>
      </div>
    </div>

    <!-- JSON 预览与编辑区 -->
    <div class="json-area">
      <div class="json-header">
        <span class="json-title">查询 JSON</span>
        <div class="json-actions">
          <n-button size="small" @click="copyJson">复制</n-button>
          <n-button size="small" type="primary" @click="applyJson">应用 JSON</n-button>
        </div>
      </div>
      <n-input
        v-model:value="jsonText"
        type="textarea"
        :autosize="{ minRows: 8, maxRows: 24 }"
        class="json-textarea"
        placeholder="生成的 MongoDB 查询 JSON，可直接编辑后点击「应用 JSON」回填到构建器"
      />
      <n-tag v-if="jsonError" type="error" size="small" class="json-error">
        JSON 解析失败：{{ jsonError }}
      </n-tag>
      <n-tag v-else-if="parsedValid" type="success" size="small" class="json-error">
        ✓ JSON 合法
      </n-tag>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { NInput, NSelect, NButton, NTag, NEmpty, NRadioGroup, NRadioButton, NSwitch, useMessage } from 'naive-ui'

// 消息提示
const message = useMessage()

// 条件结构定义
interface Condition {
  id: number
  field: string
  operator: string
  value: string
  boolValue: boolean
}

// 操作符选项
const operatorOptions = [
  { label: '$eq 等于', value: '$eq' },
  { label: '$ne 不等于', value: '$ne' },
  { label: '$gt 大于', value: '$gt' },
  { label: '$gte 大于等于', value: '$gte' },
  { label: '$lt 小于', value: '$lt' },
  { label: '$lte 小于等于', value: '$lte' },
  { label: '$in 包含于', value: '$in' },
  { label: '$nin 不包含于', value: '$nin' },
  { label: '$regex 正则匹配', value: '$regex' },
  { label: '$exists 字段存在', value: '$exists' },
]

// 自增 ID
let idSeed = 1
function nextId(): number {
  return idSeed++
}

const logic = ref<'AND' | 'OR'>('AND')
const conditions = ref<Condition[]>([])
const jsonText = ref('')
const jsonError = ref('')

// 解析标量值：尝试数字、布尔、null，否则视为字符串
function parseScalar(str: string): string | number | boolean | null {
  const trimmed = str.trim()
  if (trimmed === '') return ''
  // null
  if (trimmed === 'null') return null
  // 布尔
  if (trimmed === 'true') return true
  if (trimmed === 'false') return false
  // 数字（整数或小数）
  if (/^-?\d+$/.test(trimmed) || /^-?\d+\.\d+$/.test(trimmed)) {
    const num = Number(trimmed)
    if (!isNaN(num)) return num
  }
  return trimmed
}

// 根据条件生成 MongoDB 查询对象
function generateQuery(): Record<string, unknown> {
  const valid = conditions.value.filter(c => c.field.trim())
  if (valid.length === 0) return {}

  const clauses: Record<string, unknown>[] = valid.map(c => {
    const op = c.operator
    let val: unknown
    if (op === '$exists') {
      val = c.boolValue
    } else if (op === '$in' || op === '$nin') {
      val = c.value
        .split(',')
        .map(s => parseScalar(s))
        .filter(v => v !== '')
    } else {
      val = parseScalar(c.value)
    }
    // $eq 使用简写形式 { field: value }
    if (op === '$eq') {
      return { [c.field]: val }
    }
    return { [c.field]: { [op]: val } }
  })

  if (clauses.length === 1) return clauses[0]

  if (logic.value === 'AND') {
    // 合并同字段的操作符到同一对象
    const merged: Record<string, unknown> = {}
    for (const clause of clauses) {
      for (const [k, v] of Object.entries(clause)) {
        const existing = merged[k]
        if (
          existing !== null &&
          typeof existing === 'object' &&
          !Array.isArray(existing) &&
          v !== null &&
          typeof v === 'object' &&
          !Array.isArray(v)
        ) {
          merged[k] = { ...(existing as object), ...(v as object) }
        } else {
          merged[k] = v
        }
      }
    }
    return merged
  }

  // OR 组合
  return { $or: clauses }
}

// 监听条件变化，实时生成 JSON
watch(
  [conditions, logic],
  () => {
    const query = generateQuery()
    jsonText.value = JSON.stringify(query, null, 2)
    jsonError.value = ''
  },
  { deep: true }
)

// 计算属性：JSON 是否合法（用于显示状态标签）
const parsedValid = ref(false)
watch(jsonText, (val) => {
  if (!val.trim()) {
    parsedValid.value = false
    return
  }
  try {
    JSON.parse(val)
    parsedValid.value = true
  } catch {
    parsedValid.value = false
  }
})

// 添加条件
function addCondition() {
  conditions.value.push({
    id: nextId(),
    field: '',
    operator: '$eq',
    value: '',
    boolValue: true,
  })
}

// 删除条件
function removeCondition(id: number) {
  conditions.value = conditions.value.filter(c => c.id !== id)
}

// 清空
function clearAll() {
  conditions.value = []
  jsonText.value = ''
  jsonError.value = ''
}

// 加载示例查询
function loadSample() {
  conditions.value = [
    { id: nextId(), field: 'status', operator: '$eq', value: 'active', boolValue: true },
    { id: nextId(), field: 'age', operator: '$gte', value: '18', boolValue: true },
    { id: nextId(), field: 'age', operator: '$lte', value: '65', boolValue: true },
    { id: nextId(), field: 'tags', operator: '$in', value: 'vip,new', boolValue: true },
    { id: nextId(), field: 'email', operator: '$exists', value: '', boolValue: true },
  ]
  logic.value = 'AND'
}

// 复制 JSON
async function copyJson() {
  try {
    await navigator.clipboard.writeText(jsonText.value)
    message.success('已复制到剪贴板')
  } catch {
    message.error('复制失败，请手动复制')
  }
}

// 应用 JSON 回填到构建器
function applyJson() {
  const text = jsonText.value.trim()
  if (!text) {
    jsonError.value = '内容为空'
    return
  }
  let obj: Record<string, unknown>
  try {
    obj = JSON.parse(text)
  } catch (e: unknown) {
    jsonError.value = e instanceof Error ? e.message : String(e)
    return
  }
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    jsonError.value = '查询必须是一个 JSON 对象'
    return
  }
  jsonError.value = ''

  const newConditions: Condition[] = []
  let detectedLogic: 'AND' | 'OR' = 'AND'

  // 处理单个字段子句
  const processClause = (field: string, fieldQuery: unknown) => {
    if (fieldQuery === null || typeof fieldQuery !== 'object' || Array.isArray(fieldQuery)) {
      // 简写形式 { field: value } → $eq
      newConditions.push({
        id: nextId(),
        field,
        operator: '$eq',
        value: fieldQuery === null ? 'null' : String(fieldQuery),
        boolValue: false,
      })
    } else {
      for (const [op, val] of Object.entries(fieldQuery as Record<string, unknown>)) {
        if (op === '$exists') {
          newConditions.push({
            id: nextId(),
            field,
            operator: '$exists',
            value: '',
            boolValue: Boolean(val),
          })
        } else if (op === '$in' || op === '$nin') {
          const arr = Array.isArray(val) ? val : []
          newConditions.push({
            id: nextId(),
            field,
            operator: op,
            value: arr.map(v => (v === null ? 'null' : String(v))).join(','),
            boolValue: false,
          })
        } else {
          newConditions.push({
            id: nextId(),
            field,
            operator: op,
            value: val === null ? 'null' : String(val),
            boolValue: false,
          })
        }
      }
    }
  }

  if ('$or' in obj && Array.isArray(obj.$or)) {
    detectedLogic = 'OR'
    for (const clause of obj.$or as object[]) {
      for (const [field, fieldQuery] of Object.entries(clause as Record<string, unknown>)) {
        processClause(field, fieldQuery)
      }
    }
  } else {
    detectedLogic = 'AND'
    for (const [field, fieldQuery] of Object.entries(obj)) {
      processClause(field, fieldQuery)
    }
  }

  conditions.value = newConditions
  logic.value = detectedLogic
  message.success('已应用到构建器')
}
</script>

<style scoped>
.mongo-query-builder {
  max-width: 1000px;
  margin: 0 auto;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.conditions {
  margin-bottom: 24px;
}

.condition-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.field-input {
  flex: 1 1 160px;
  min-width: 140px;
}

.op-select {
  flex: 0 0 170px;
  min-width: 150px;
}

.value-input {
  flex: 2 1 240px;
  min-width: 180px;
}

.json-area {
  border: 1px solid var(--n-border-color, #e0e0e6);
  border-radius: 8px;
  padding: 16px;
  background: var(--n-color, transparent);
}

.json-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.json-title {
  font-weight: 600;
  font-size: 14px;
}

.json-actions {
  display: flex;
  gap: 8px;
}

.json-textarea :deep(textarea) {
  font-family: 'Fira Code', 'Consolas', 'Courier New', monospace;
  font-size: 13px;
}

.json-error {
  margin-top: 8px;
}

/* 深色模式适配 */
.dark .json-area {
  border-color: rgba(255, 255, 255, 0.09);
  background: rgba(255, 255, 255, 0.03);
}

@media (max-width: 640px) {
  .condition-row {
    flex-direction: column;
    align-items: stretch;
  }

  .field-input,
  .op-select,
  .value-input {
    flex: 1 1 auto;
    min-width: 0;
    width: 100%;
  }
}
</style>
