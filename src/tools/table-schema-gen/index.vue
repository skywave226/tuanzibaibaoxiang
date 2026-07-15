<template>
  <div class="table-schema-gen">
    <!-- 表配置区 -->
    <div class="card mb-4">
      <div class="config-section">
        <div class="config-item">
          <label>表名</label>
          <n-input
            v-model:value="tableName"
            placeholder="例如：users"
            style="width: 240px"
          />
        </div>
        <div class="config-item">
          <label>数据库方言</label>
          <n-select
            v-model:value="dialect"
            :options="dialectOptions"
            style="width: 180px"
          />
        </div>
      </div>
    </div>

    <!-- 字段编辑区 -->
    <div class="card mb-4">
      <div class="toolbar mb-3">
        <n-button type="primary" @click="addField">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></span>
          添加字段
        </n-button>
        <n-button @click="loadExample">加载示例</n-button>
        <n-button @click="clearFields">清空</n-button>
      </div>

      <n-data-table
        :columns="columns"
        :data="fields"
        :bordered="true"
        :single-line="false"
        size="small"
        :pagination="false"
        :row-key="rowKey"
        :scroll-x="900"
      />
    </div>

    <!-- 生成的 DDL -->
    <div class="card" v-if="fields.length > 0">
      <div class="result-header mb-3">
        <div class="pane-label">生成的 DDL 语句</div>
        <div class="actions">
          <n-button size="small" @click="copySql">
            <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></span>
            {{ copied ? '已复制' : '复制' }}
          </n-button>
        </div>
      </div>
      <n-input
        :value="generatedSql"
        type="textarea"
        readonly
        :rows="12"
        :autosize="false"
      />
    </div>

    <!-- 空状态提示 -->
    <div class="card" v-else>
      <n-empty description="点击「添加字段」或「加载示例」开始设计表结构" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import {
  NInput,
  NButton,
  NSelect,
  NSwitch,
  NDataTable,
  NEmpty,
} from 'naive-ui'
import type { DataTableColumns, SelectOption } from 'naive-ui'

// 字段定义
interface Field {
  id: number
  name: string
  type: string
  length: string
  primaryKey: boolean
  nullable: boolean
  defaultValue: string
  comment: string
}

// 数据库方言
type Dialect = 'mysql' | 'postgresql'

const tableName = ref('users')
const dialect = ref<Dialect>('mysql')
const fields = ref<Field[]>([])
const copied = ref(false)

// 自增 id
let nextId = 1

// 方言选项
const dialectOptions: SelectOption[] = [
  { label: 'MySQL', value: 'mysql' },
  { label: 'PostgreSQL', value: 'postgresql' },
]

// 字段类型选项
const typeOptions: SelectOption[] = [
  { label: 'INT', value: 'INT' },
  { label: 'BIGINT', value: 'BIGINT' },
  { label: 'VARCHAR', value: 'VARCHAR' },
  { label: 'TEXT', value: 'TEXT' },
  { label: 'DATETIME', value: 'DATETIME' },
  { label: 'TIMESTAMP', value: 'TIMESTAMP' },
  { label: 'DECIMAL', value: 'DECIMAL' },
  { label: 'FLOAT', value: 'FLOAT' },
  { label: 'BOOLEAN', value: 'BOOLEAN' },
  { label: 'JSON', value: 'JSON' },
]

// 支持长度 / 精度的类型
const lengthTypes = new Set(['VARCHAR', 'CHAR', 'DECIMAL', 'FLOAT', 'INT', 'BIGINT'])

// 判断该类型是否支持长度
function supportsLength(type: string): boolean {
  return lengthTypes.has(type.toUpperCase())
}

// 行 key
function rowKey(row: Field) {
  return row.id
}

// 数据表列定义（可编辑单元格）
const columns = computed<DataTableColumns<Field>>(() => [
  {
    title: '字段名',
    key: 'name',
    width: 150,
    render(row) {
      return h(NInput, {
        value: row.name,
        size: 'small',
        placeholder: 'field_name',
        'onUpdate:value': (v: string) => {
          row.name = v
        },
      })
    },
  },
  {
    title: '类型',
    key: 'type',
    width: 140,
    render(row) {
      return h(NSelect, {
        value: row.type,
        size: 'small',
        options: typeOptions,
        'onUpdate:value': (v: string) => {
          row.type = v
          // 切换为不支持长度的类型时清空长度
          if (!supportsLength(v)) {
            row.length = ''
          }
        },
      })
    },
  },
  {
    title: '长度 / 精度',
    key: 'length',
    width: 120,
    render(row) {
      return h(
        NInput,
        {
          value: row.length,
          size: 'small',
          placeholder: supportsLength(row.type) ? '如 255 或 10,2' : '不需要',
          disabled: !supportsLength(row.type),
          'onUpdate:value': (v: string) => {
            row.length = v
          },
        },
      )
    },
  },
  {
    title: '主键',
    key: 'primaryKey',
    width: 80,
    align: 'center',
    render(row) {
      return h(NSwitch, {
        value: row.primaryKey,
        size: 'small',
        'onUpdate:value': (v: boolean) => {
          row.primaryKey = v
          // 主键默认不可空
          if (v) row.nullable = false
        },
      })
    },
  },
  {
    title: '可空',
    key: 'nullable',
    width: 80,
    align: 'center',
    render(row) {
      return h(NSwitch, {
        value: row.nullable,
        size: 'small',
        disabled: row.primaryKey,
        'onUpdate:value': (v: boolean) => {
          row.nullable = v
        },
      })
    },
  },
  {
    title: '默认值',
    key: 'defaultValue',
    width: 150,
    render(row) {
      return h(NInput, {
        value: row.defaultValue,
        size: 'small',
        placeholder: '如 0 / NULL / NOW()',
        'onUpdate:value': (v: string) => {
          row.defaultValue = v
        },
      })
    },
  },
  {
    title: '注释',
    key: 'comment',
    render(row) {
      return h(NInput, {
        value: row.comment,
        size: 'small',
        placeholder: '字段说明',
        'onUpdate:value': (v: string) => {
          row.comment = v
        },
      })
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 80,
    align: 'center',
    render(row) {
      return h(
        NButton,
        {
          size: 'small',
          quaternary: true,
          type: 'error',
          onClick: () => removeField(row.id),
        },
        { default: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', width: '16', height: '16', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
          h('polyline', { points: '3 6 5 6 21 6' }),
          h('path', { d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' }),
        ]) },
      )
    },
  },
])

// 添加字段
function addField() {
  fields.value.push({
    id: nextId++,
    name: '',
    type: 'VARCHAR',
    length: '255',
    primaryKey: false,
    nullable: true,
    defaultValue: '',
    comment: '',
  })
}

// 删除字段
function removeField(id: number) {
  fields.value = fields.value.filter(f => f.id !== id)
}

// 清空字段
function clearFields() {
  fields.value = []
  tableName.value = ''
}

// 加载示例表结构
function loadExample() {
  tableName.value = 'users'
  fields.value = [
    { id: nextId++, name: 'id', type: 'BIGINT', length: '', primaryKey: true, nullable: false, defaultValue: '', comment: '主键 ID' },
    { id: nextId++, name: 'username', type: 'VARCHAR', length: '50', primaryKey: false, nullable: false, defaultValue: '', comment: '用户名' },
    { id: nextId++, name: 'email', type: 'VARCHAR', length: '100', primaryKey: false, nullable: false, defaultValue: '', comment: '邮箱地址' },
    { id: nextId++, name: 'age', type: 'INT', length: '', primaryKey: false, nullable: true, defaultValue: '0', comment: '年龄' },
    { id: nextId++, name: 'balance', type: 'DECIMAL', length: '10,2', primaryKey: false, nullable: false, defaultValue: '0.00', comment: '账户余额' },
    { id: nextId++, name: 'is_active', type: 'BOOLEAN', length: '', primaryKey: false, nullable: false, defaultValue: 'TRUE', comment: '是否启用' },
    { id: nextId++, name: 'created_at', type: 'DATETIME', length: '', primaryKey: false, nullable: false, defaultValue: 'CURRENT_TIMESTAMP', comment: '创建时间' },
    { id: nextId++, name: 'profile', type: 'JSON', length: '', primaryKey: false, nullable: true, defaultValue: '', comment: '扩展资料' },
  ]
}

// 标识符引用：MySQL 用反引号，PostgreSQL 用双引号
function quoteIdentifier(name: string): string {
  const clean = name.trim()
  if (!clean) return clean
  return dialect.value === 'mysql' ? `\`${clean}\`` : `"${clean}"`
}

// 转义 SQL 字符串中的单引号
function escapeSqlString(s: string): string {
  return s.replace(/'/g, "''")
}

// 构建列类型（含长度 / 精度，并按方言映射）
function buildColumnType(field: Field): string {
  const type = field.type.toUpperCase()
  let mappedType = type

  // 方言类型映射
  if (dialect.value === 'postgresql') {
    if (type === 'DATETIME') mappedType = 'TIMESTAMP'
  } else {
    // MySQL：BOOLEAN 等价于 TINYINT(1)
    if (type === 'BOOLEAN') mappedType = 'TINYINT(1)'
  }

  // 长度 / 精度
  if (supportsLength(type) && field.length.trim()) {
    return `${mappedType}(${field.length.trim()})`
  }
  return mappedType
}

// 格式化默认值：数字 / SQL 关键字 / 函数原样输出，其余按字符串加引号
function formatDefault(value: string): string {
  const v = value.trim()
  if (!v) return ''
  // 数字
  if (/^-?\d+(\.\d+)?$/.test(v)) return v
  // SQL 关键字与函数（大写形式）
  const upperKeywords = ['NULL', 'TRUE', 'FALSE', 'CURRENT_TIMESTAMP', 'NOW()', 'CURRENT_DATE']
  if (upperKeywords.includes(v.toUpperCase())) return v.toUpperCase()
  // 含括号的函数调用原样输出
  if (/\w+\(\)/i.test(v)) return v
  // 其余按字符串字面量
  return `'${escapeSqlString(v)}'`
}

// 生成 CREATE TABLE DDL
const generatedSql = computed(() => {
  const table = tableName.value.trim()
  const validFields = fields.value.filter(f => f.name.trim())
  if (!table || validFields.length === 0) return ''

  const lines: string[] = []
  lines.push(`CREATE TABLE ${quoteIdentifier(table)} (`)

  const columnLines: string[] = []
  const commentLines: string[] = []

  for (const field of validFields) {
    let line = `  ${quoteIdentifier(field.name)} ${buildColumnType(field)}`

    if (field.primaryKey) {
      line += ' PRIMARY KEY'
    }
    // 主键隐式 NOT NULL
    if (!field.nullable || field.primaryKey) {
      line += ' NOT NULL'
    }
    // 默认值
    const def = formatDefault(field.defaultValue)
    if (def) {
      line += ` DEFAULT ${def}`
    }

    // MySQL：行内注释
    if (dialect.value === 'mysql' && field.comment.trim()) {
      line += ` COMMENT '${escapeSqlString(field.comment.trim())}'`
    }

    columnLines.push(line)

    // PostgreSQL：使用 COMMENT ON COLUMN 语句
    if (dialect.value === 'postgresql' && field.comment.trim()) {
      commentLines.push(
        `COMMENT ON COLUMN ${quoteIdentifier(table)}.${quoteIdentifier(field.name)} IS '${escapeSqlString(field.comment.trim())}';`,
      )
    }
  }

  lines.push(columnLines.join(',\n'))
  lines.push(');')

  // 追加 PostgreSQL 注释语句
  if (commentLines.length > 0) {
    lines.push('')
    lines.push(commentLines.join('\n'))
  }

  return lines.join('\n')
})

// 复制 SQL 到剪贴板
async function copySql() {
  const sql = generatedSql.value
  if (!sql) return
  try {
    await navigator.clipboard.writeText(sql)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 1500)
  } catch {
    // 剪贴板不可用时回退方案
    const textarea = document.createElement('textarea')
    textarea.value = sql
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 1500)
  }
}
</script>

<style scoped>
.table-schema-gen {
  max-width: 1000px;
  margin: 0 auto;
}

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
}

.dark .pane-label {
  color: #aaa;
}

.config-section {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  align-items: center;
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

.dark .config-item label {
  color: #aaa;
}

.toolbar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.actions {
  display: flex;
  gap: 8px;
}
</style>
