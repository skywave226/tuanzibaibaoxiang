<template>
  <div class="er-diagram-gen">
    <!-- 顶部操作栏 -->
    <div class="action-bar">
      <n-button type="primary" @click="copyCode">复制代码</n-button>
      <n-button @click="loadExample">加载示例</n-button>
      <n-button @click="clearAll">清空全部</n-button>
    </div>

    <!-- 数据表管理 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title">数据表（{{ tables.length }}）</span>
        <n-button size="small" type="primary" ghost @click="addTable">+ 添加表</n-button>
      </div>

      <div v-if="tables.length === 0" class="empty-tip">
        暂无数据表，点击"添加表"开始设计
      </div>

      <div v-for="table in tables" :key="table.id" class="table-card">
        <!-- 表头 -->
        <div class="card-header">
          <n-input
            v-model:value="table.name"
            placeholder="表名（如 USER）"
            class="table-name-input"
          />
          <n-button size="small" type="error" ghost @click="removeTable(table.id)">删除表</n-button>
        </div>

        <!-- 字段列表 -->
        <div class="field-list">
          <div class="field-row field-head">
            <span class="col-pk">主键</span>
            <span class="col-name">字段名</span>
            <span class="col-type">类型</span>
            <span class="col-op">操作</span>
          </div>
          <div v-for="field in table.fields" :key="field.id" class="field-row">
            <n-checkbox v-model:checked="field.isPrimaryKey" class="col-pk" />
            <n-input v-model:value="field.name" placeholder="字段名" class="col-name" size="small" />
            <n-input v-model:value="field.type" placeholder="如 int" class="col-type" size="small" />
            <n-button
              size="tiny"
              type="error"
              text
              class="col-op"
              @click="removeField(table.id, field.id)"
            >
              删除
            </n-button>
          </div>
          <div v-if="table.fields.length === 0" class="field-empty">暂无字段</div>
          <n-button size="small" dashed block @click="addField(table.id)">+ 添加字段</n-button>
        </div>
      </div>
    </div>

    <!-- 关系管理 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title">关系（{{ relationships.length }}）</span>
        <n-button
          size="small"
          type="primary"
          ghost
          :disabled="tables.length < 2"
          @click="addRelation"
        >
          + 添加关系
        </n-button>
      </div>
      <div v-if="tables.length < 2" class="hint-text">至少需要 2 个表才能添加关系</div>

      <div v-for="rel in relationships" :key="rel.id" class="relation-card">
        <div class="relation-row">
          <n-select
            v-model:value="rel.fromTableId"
            :options="tableOptions"
            placeholder="表 A"
            class="rel-select"
            size="small"
            @update:value="rel.fromFieldId = ''"
          />
          <n-select
            v-model:value="rel.fromFieldId"
            :options="fieldOptions(rel.fromTableId)"
            placeholder="字段 A"
            class="rel-select"
            size="small"
          />
          <span class="rel-arrow">→</span>
          <n-select
            v-model:value="rel.toTableId"
            :options="tableOptions"
            placeholder="表 B"
            class="rel-select"
            size="small"
            @update:value="rel.toFieldId = ''"
          />
          <n-select
            v-model:value="rel.toFieldId"
            :options="fieldOptions(rel.toTableId)"
            placeholder="字段 B"
            class="rel-select"
            size="small"
          />
        </div>
        <div class="relation-row">
          <n-select
            v-model:value="rel.type"
            :options="relTypeOptions"
            class="rel-type-select"
            size="small"
          />
          <n-input v-model:value="rel.label" placeholder="关系标签（如 places）" class="rel-label" size="small" />
          <n-button size="small" type="error" ghost @click="removeRelation(rel.id)">删除</n-button>
        </div>
      </div>
    </div>

    <!-- 生成结果 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title">Mermaid 代码</span>
        <n-tag size="small" type="info">可粘贴到 Mermaid Live Editor 查看</n-tag>
      </div>
      <pre class="code-block"><code v-html="highlightedCode"></code></pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NButton, NInput, NSelect, NCheckbox, NTag, useMessage } from 'naive-ui'

// 字段数据结构
interface Field {
  id: string
  name: string
  type: string
  isPrimaryKey: boolean
}

// 表数据结构
interface Table {
  id: string
  name: string
  fields: Field[]
}

// 关系数据结构
interface Relationship {
  id: string
  fromTableId: string
  fromFieldId: string
  toTableId: string
  toFieldId: string
  type: '1:1' | '1:N' | 'N:M'
  label: string
}

const message = useMessage()
const tables = ref<Table[]>([])
const relationships = ref<Relationship[]>([])

// 关系类型 → Mermaid 操作符映射
const relOpMap: Record<string, string> = {
  '1:1': '||--||',
  '1:N': '||--o{',
  'N:M': '}o--o{',
}

const relTypeOptions = [
  { label: '1:1（一对一）', value: '1:1' },
  { label: '1:N（一对多）', value: '1:N' },
  { label: 'N:M（多对多）', value: 'N:M' },
]

// 表选项（用于关系选择）
const tableOptions = computed(() =>
  tables.value.map(t => ({ label: t.name || '(未命名表)', value: t.id }))
)

// 根据表 id 生成字段选项
function fieldOptions(tableId: string) {
  const table = tables.value.find(t => t.id === tableId)
  if (!table) return []
  return table.fields.map(f => ({ label: f.name || '(未命名)', value: f.id }))
}

// 生成唯一 id
function genId(): string {
  if (crypto.randomUUID) return crypto.randomUUID()
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// ===== 表与字段操作 =====
function addTable(): void {
  tables.value.push({
    id: genId(),
    name: '',
    fields: [],
  })
}

function removeTable(id: string): void {
  tables.value = tables.value.filter(t => t.id !== id)
  // 同步移除引用该表的关系
  relationships.value = relationships.value.filter(
    r => r.fromTableId !== id && r.toTableId !== id
  )
}

function addField(tableId: string): void {
  const table = tables.value.find(t => t.id === tableId)
  if (table) {
    table.fields.push({
      id: genId(),
      name: '',
      type: 'int',
      isPrimaryKey: table.fields.length === 0,
    })
  }
}

function removeField(tableId: string, fieldId: string): void {
  const table = tables.value.find(t => t.id === tableId)
  if (table) {
    table.fields = table.fields.filter(f => f.id !== fieldId)
  }
}

// ===== 关系操作 =====
function addRelation(): void {
  if (tables.value.length < 2) return
  relationships.value.push({
    id: genId(),
    fromTableId: tables.value[0].id,
    fromFieldId: '',
    toTableId: tables.value[1].id,
    toFieldId: '',
    type: '1:N',
    label: '',
  })
}

function removeRelation(id: string): void {
  relationships.value = relationships.value.filter(r => r.id !== id)
}

// ===== 生成 Mermaid 代码 =====
const mermaidCode = computed(() => {
  const lines: string[] = ['erDiagram']

  // 生成关系行
  for (const rel of relationships.value) {
    const fromTable = tables.value.find(t => t.id === rel.fromTableId)
    const toTable = tables.value.find(t => t.id === rel.toTableId)
    if (!fromTable || !toTable) continue
    const fromName = fromTable.name
    const toName = toTable.name
    if (!fromName || !toName) continue
    const op = relOpMap[rel.type] || '||--o{'
    const label = rel.label || 'relates'
    lines.push(`    ${fromName} ${op} ${toName} : "${escapeMermaid(label)}"`)
  }

  // 生成表定义
  for (const table of tables.value) {
    if (!table.name) continue
    if (table.fields.length === 0) continue
    lines.push(`    ${table.name} {`)
    for (const field of table.fields) {
      const type = field.type || 'string'
      const pk = field.isPrimaryKey ? ' PK' : ''
      lines.push(`        ${type} ${field.name}${pk}`)
    }
    lines.push(`    }`)
  }

  return lines.join('\n')
})

// 转义 Mermaid 字符串中的特殊字符
function escapeMermaid(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

// 代码高亮（轻量自实现，零依赖）
const highlightedCode = computed(() => {
  let html = mermaidCode.value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // 高亮 erDiagram 关键字
  html = html.replace(/^erDiagram$/m, '<span class="hl-kw">erDiagram</span>')

  // 高亮关系操作符（如 ||--o{ }o--o{ ||--|| 等）
  html = html.replace(
    /(?:\|o|\|\||\}o|\}\|)(?:--|\.\.)(?:o\||\|\||o\{|\|\{)/g,
    '<span class="hl-op">$&</span>'
  )

  // 高亮 PK 标记
  html = html.replace(/\b(PK)\b/g, '<span class="hl-attr">$1</span>')

  // 高亮关系标签字符串 : "..."
  html = html.replace(/: "([^"]*)"/g, ': "<span class="hl-str">$1</span>"')

  // 高亮类型关键字（行首缩进后的常见类型）
  html = html.replace(
    /^(\s+)(int|integer|bigint|smallint|string|varchar|char|text|decimal|numeric|float|double|boolean|bool|date|datetime|timestamp|time|json|blob|uuid)(\s)/gm,
    '$1<span class="hl-type">$2</span>$3'
  )

  return html
})

// 复制 Mermaid 代码
function copyCode(): void {
  if (!mermaidCode.value || mermaidCode.value === 'erDiagram') {
    message.warning('暂无可复制的内容，请先添加表')
    return
  }
  navigator.clipboard.writeText(mermaidCode.value)
  message.success('Mermaid 代码已复制到剪贴板')
}

// ===== 加载示例 =====
function loadExample(): void {
  const userTable: Table = {
    id: genId(),
    name: 'USER',
    fields: [
      mkField('id', 'bigint', true),
      mkField('username', 'varchar'),
      mkField('email', 'varchar'),
      mkField('created_at', 'datetime'),
    ],
  }
  const orderTable: Table = {
    id: genId(),
    name: 'ORDER',
    fields: [
      mkField('id', 'bigint', true),
      mkField('user_id', 'bigint'),
      mkField('amount', 'decimal'),
      mkField('status', 'varchar'),
    ],
  }
  const itemTable: Table = {
    id: genId(),
    name: 'ORDER_ITEM',
    fields: [
      mkField('id', 'bigint', true),
      mkField('order_id', 'bigint'),
      mkField('product_name', 'varchar'),
      mkField('quantity', 'int'),
    ],
  }
  tables.value = [userTable, orderTable, itemTable]
  relationships.value = [
    {
      id: genId(),
      fromTableId: userTable.id,
      fromFieldId: userTable.fields[0].id,
      toTableId: orderTable.id,
      toFieldId: orderTable.fields[1].id,
      type: '1:N',
      label: 'places',
    },
    {
      id: genId(),
      fromTableId: orderTable.id,
      fromFieldId: orderTable.fields[0].id,
      toTableId: itemTable.id,
      toFieldId: itemTable.fields[1].id,
      type: '1:N',
      label: 'contains',
    },
  ]
  message.success('示例已加载')
}

// 快速创建字段
function mkField(name: string, type: string, isPrimaryKey = false): Field {
  return { id: genId(), name, type, isPrimaryKey }
}

// 清空全部
function clearAll(): void {
  tables.value = []
  relationships.value = []
}
</script>

<style scoped>
.er-diagram-gen {
  max-width: 1000px;
  margin: 0 auto;
}

.action-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.empty-tip {
  padding: 24px;
  text-align: center;
  color: #999;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
}

.hint-text {
  color: #999;
  font-size: 13px;
  margin-bottom: 8px;
}

/* 表卡片 */
.table-card {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 14px;
  margin-bottom: 12px;
  background: #fff;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.table-name-input {
  max-width: 280px;
}

/* 字段列表 */
.field-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-head {
  font-size: 12px;
  color: #999;
  padding: 0 4px 4px;
}

.field-row .col-pk {
  width: 44px;
  flex-shrink: 0;
  text-align: center;
}

.field-row .col-name {
  flex: 2;
}

.field-row .col-type {
  flex: 1.2;
}

.field-row .col-op {
  width: 48px;
  flex-shrink: 0;
  text-align: center;
}

.field-empty {
  color: #bbb;
  font-size: 13px;
  text-align: center;
  padding: 8px 0;
}

/* 关系卡片 */
.relation-card {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 14px;
  margin-bottom: 12px;
  background: #fff;
}

.relation-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.relation-row:last-child {
  margin-bottom: 0;
}

.rel-select {
  flex: 1;
  min-width: 120px;
}

.rel-arrow {
  color: #36ad6a;
  font-weight: 700;
  font-size: 16px;
  flex-shrink: 0;
}

.rel-type-select {
  width: 160px;
  flex-shrink: 0;
}

.rel-label {
  flex: 1;
  min-width: 160px;
}

/* Mermaid 代码块 */
.code-block {
  background: #1e1e2e;
  border-radius: 8px;
  padding: 16px;
  overflow: auto;
  font-family: 'Fira Code', 'Consolas', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #cdd6f4;
  max-height: 420px;
  white-space: pre;
}

/* 代码高亮配色 */
.code-block :deep(.hl-kw) {
  color: #cba6f7;
  font-weight: 700;
}

.code-block :deep(.hl-attr) {
  color: #fab387;
  font-weight: 700;
}

.code-block :deep(.hl-op) {
  color: #a6e3a1;
  font-weight: 600;
}

.code-block :deep(.hl-str) {
  color: #f9e2af;
}

.code-block :deep(.hl-type) {
  color: #89b4fa;
}

/* 深色模式适配 */
.dark .section-title {
  color: #e0e0e0;
}

.dark .empty-tip {
  color: #777;
  border-color: #2a2a4a;
}

.dark .table-card,
.dark .relation-card {
  background: #181828;
  border-color: #2a2a4a;
}

.dark .field-head {
  color: #666;
}

.dark .field-empty {
  color: #555;
}

.dark .hint-text {
  color: #777;
}

/* 深色模式下代码块保持深色背景，无需额外调整 */
</style>
