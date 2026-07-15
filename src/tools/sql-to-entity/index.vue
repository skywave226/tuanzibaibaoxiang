<template>
  <div class="sql-to-entity">
    <div class="toolbar">
      <n-space>
        <n-button type="primary" @click="convert">生成实体</n-button>
        <n-button @click="loadExample">示例</n-button>
        <n-button @click="copy" :disabled="!result">复制</n-button>
        <n-button @click="clear" :disabled="!input && !result">清空</n-button>
      </n-space>
      <n-space align="center">
        <span class="opt-label">接口名</span>
        <n-input
          v-model:value="interfaceName"
          placeholder="如：User"
          style="width: 180px"
          size="small"
        />
      </n-space>
    </div>

    <div class="options mb-4">
      <n-space>
        <n-checkbox v-model:checked="exportKeyword">导出（export）</n-checkbox>
        <n-checkbox v-model:checked="readonlyAll">所有字段只读（readonly）</n-checkbox>
        <n-checkbox v-model:checked="markPkComment">主键添加注释标记</n-checkbox>
      </n-space>
    </div>

    <div class="editor-area">
      <div class="editor-pane">
        <div class="pane-label">CREATE TABLE 语句</div>
        <n-input
          v-model:value="input"
          type="textarea"
          placeholder="粘贴 CREATE TABLE 语句，例如：CREATE TABLE users (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(50) NOT NULL, ...)"
          :rows="18"
          :autosize="false"
          class="code-input"
        />
      </div>
      <div class="editor-pane">
        <div class="pane-label">TypeScript 接口</div>
        <n-input
          :value="result"
          type="textarea"
          readonly
          :rows="18"
          :autosize="false"
          placeholder="生成的 TypeScript interface 将显示在此处..."
          class="code-output"
        />
      </div>
    </div>

    <n-alert
      type="error"
      v-if="errorMsg"
      class="mt-4"
      closable
      @close="errorMsg = ''"
    >
      {{ errorMsg }}
    </n-alert>

    <div class="type-map card mt-4">
      <h3 class="text-sm font-bold mb-3">类型映射表</h3>
      <div class="map-grid">
        <div class="map-item" v-for="m in typeMapList" :key="m.sql">
          <code class="sql-type">{{ m.sql }}</code>
          <span class="arrow">→</span>
          <code class="ts-type">{{ m.ts }}</code>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NSpace, NInput, NAlert, NCheckbox, useMessage } from 'naive-ui'

const message = useMessage()
const input = ref('')
const result = ref('')
const errorMsg = ref('')
const interfaceName = ref('')
const exportKeyword = ref(true)
const readonlyAll = ref(false)
const markPkComment = ref(true)

// 类型映射展示列表
const typeMapList = [
  { sql: 'INT / BIGINT / SMALLINT', ts: 'number' },
  { sql: 'VARCHAR / CHAR / TEXT', ts: 'string' },
  { sql: 'DATETIME / TIMESTAMP', ts: 'Date' },
  { sql: 'BOOLEAN / BOOL', ts: 'boolean' },
  { sql: 'DECIMAL / FLOAT / DOUBLE', ts: 'number' },
  { sql: 'JSON / JSONB', ts: 'Record<string, any>' },
]

// 示例 SQL
const exampleSql = `CREATE TABLE user_orders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  order_no VARCHAR(32) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status TINYINT NOT NULL DEFAULT 0,
  remark TEXT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  paid_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL,
  metadata JSON NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);`

// ==================== 类型映射 ====================

// 将 SQL 类型名映射为 TypeScript 类型
function mapSqlType(rawType: string): string {
  // 取类型名主体（去掉参数，如 VARCHAR(255) -> VARCHAR）
  const type = rawType.toUpperCase().replace(/\(.*\)/, '').trim()

  // 整数 / 浮点
  if (
    /^(TINY|SMALL|MEDIUM|BIG)?INT(TEGER)?$/.test(type) ||
    /^(SMALL)?SERIAL$/.test(type) ||
    /^(BIG)?SERIAL$/.test(type) ||
    type === 'BIT' ||
    type === 'MONEY' ||
    type === 'SMALLMONEY' ||
    type === 'NUMERIC' ||
    type === 'DECIMAL' ||
    type === 'DEC' ||
    type === 'FIXED' ||
    type === 'FLOAT' ||
    type === 'DOUBLE' ||
    type === 'REAL' ||
    type === 'DOUBLE PRECISION'
  ) {
    return 'number'
  }

  // 日期 / 时间
  if (
    type === 'DATETIME' ||
    type === 'DATETIME2' ||
    type === 'DATETIMEOFFSET' ||
    type === 'TIMESTAMP' ||
    type === 'TIMESTAMPTZ' ||
    type === 'SMALLDATETIME' ||
    type === 'DATE'
  ) {
    return 'Date'
  }
  if (type === 'TIME' || type === 'TIMETZ') {
    return 'string'
  }

  // 布尔
  if (type === 'BOOLEAN' || type === 'BOOL') {
    return 'boolean'
  }

  // JSON
  if (type === 'JSON' || type === 'JSONB') {
    return 'Record<string, any>'
  }

  // 二进制 → string（base64 等）
  if (
    type === 'BLOB' ||
    type === 'TINYBLOB' ||
    type === 'MEDIUMBLOB' ||
    type === 'LONGBLOB' ||
    type === 'BINARY' ||
    type === 'VARBINARY' ||
    type === 'BYTEA' ||
    type === 'IMAGE' ||
    type === 'ROWVERSION'
  ) {
    return 'string'
  }

  // 文本 / 字符串 / 枚举 / UUID
  if (
    type === 'CHAR' ||
    type === 'NCHAR' ||
    type === 'VARCHAR' ||
    type === 'NVARCHAR' ||
    type === 'TEXT' ||
    type === 'TINYTEXT' ||
    type === 'MEDIUMTEXT' ||
    type === 'LONGTEXT' ||
    type === 'NTEXT' ||
    type === 'CLOB' ||
    type === 'ENUM' ||
    type === 'SET' ||
    type === 'UUID' ||
    type === 'UNIQUEIDENTIFIER' ||
    type === 'INET' ||
    type === 'CIDR' ||
    type === 'MACADDR' ||
    type === 'INTERVAL'
  ) {
    return 'string'
  }

  // 年份 → number
  if (type === 'YEAR') {
    return 'number'
  }

  // 默认
  return 'any'
}

// ==================== 列定义解析 ====================

interface ColumnInfo {
  name: string        // 去除引号后的字段名
  tsType: string      // TypeScript 类型
  isNullable: boolean // 是否可空
  isPk: boolean       // 是否主键
  comment?: string    // 注释
}

interface TableInfo {
  name: string
  interfaceName: string
  columns: ColumnInfo[]
}

// 去除标识符的引号 / 反引号 / 方括号
function stripQuotes(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return trimmed
  // 反引号
  if (trimmed.startsWith('`') && trimmed.endsWith('`')) {
    return trimmed.slice(1, -1)
  }
  // 双引号
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1)
  }
  // 单引号（一般不用于标识符，兼容）
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1)
  }
  // 方括号（SQL Server）
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

// 将字段名格式化为合法 TS 标识符（非法则加引号）
function formatFieldName(name: string): string {
  if (!name) return name
  if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)) {
    // 包含需要转义的字符
    return `"${name.replace(/"/g, '\\"')}"`
  }
  return name
}

// 将 snake_case 表名转为 PascalCase 接口名
function toPascalCase(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join('')
    .replace(/[^a-zA-Z0-9]/g, '') || 'UnknownTable'
}

// 在 SQL 中找到与 openIdx 处 '(' 匹配的 ')' 的索引
function findMatchingParen(sql: string, openIdx: number): number {
  let depth = 0
  let i = openIdx
  let inStr: string | null = null
  while (i < sql.length) {
    const ch = sql[i]
    // 字符串内部不计数
    if (inStr) {
      if (ch === '\\') {
        i += 2
        continue
      }
      if (ch === inStr) {
        inStr = null
      }
      i++
      continue
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      inStr = ch
      i++
      continue
    }
    if (ch === '(') depth++
    else if (ch === ')') {
      depth--
      if (depth === 0) return i
    }
    i++
  }
  return -1
}

// 按顶层逗号拆分（忽略括号与字符串内的逗号）
function splitTopLevel(body: string): string[] {
  const parts: string[] = []
  let depth = 0
  let inStr: string | null = null
  let start = 0
  for (let i = 0; i < body.length; i++) {
    const ch = body[i]
    if (inStr) {
      if (ch === '\\') {
        i++
        continue
      }
      if (ch === inStr) inStr = null
      continue
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      inStr = ch
      continue
    }
    if (ch === '(') depth++
    else if (ch === ')') depth--
    else if (ch === ',' && depth === 0) {
      parts.push(body.slice(start, i))
      start = i + 1
    }
  }
  parts.push(body.slice(start))
  return parts
}

// 判断是否为约束定义行（非列定义）
function isConstraintLine(firstWord: string): boolean {
  const w = firstWord.toUpperCase()
  return (
    w === 'PRIMARY' ||
    w === 'FOREIGN' ||
    w === 'CONSTRAINT' ||
    w === 'UNIQUE' ||
    w === 'INDEX' ||
    w === 'KEY' ||
    w === 'CHECK' ||
    w === 'FULLTEXT' ||
    w === 'SPATIAL' ||
    w === 'CLUSTERED' ||
    w === 'NONCLUSTERED'
  )
}

// 从 PRIMARY KEY (col1, col2) 中提取列名
function parsePrimaryKeyCols(part: string): string[] {
  const match = part.match(/PRIMARY\s+KEY\s*\(([^)]*)\)/i)
  if (!match) return []
  return match[1]
    .split(',')
    .map((c) => stripQuotes(c.trim()))
    .filter(Boolean)
}

// 从字段定义中提取 COMMENT 'xxx'
function parseComment(part: string): string | undefined {
  const match = part.match(/COMMENT\s+'((?:[^'\\]|\\.)*)'/i)
  return match ? match[1] : undefined
}

// 解析单个字段定义
function parseColumn(part: string): ColumnInfo | null {
  const trimmed = part.trim()
  if (!trimmed) return null

  // 拆分 token：第一个为字段名，第二个为类型（可能带参数）
  const tokens: string[] = []
  let i = 0
  while (i < trimmed.length && tokens.length < 2) {
    // 跳过空白
    while (i < trimmed.length && /\s/.test(trimmed[i])) i++
    if (i >= trimmed.length) break
    const start = i
    // 标识符或带引号
    if (trimmed[i] === '`' || trimmed[i] === '"' || trimmed[i] === "'" || trimmed[i] === '[') {
      const quote = trimmed[i]
      i++
      while (i < trimmed.length) {
        if (quote === '[' && trimmed[i] === ']') {
          i++
          break
        }
        if (quote !== '[' && trimmed[i] === quote) {
          i++
          break
        }
        i++
      }
      tokens.push(trimmed.slice(start, i))
    } else if (/[a-zA-Z0-9_$#@]/.test(trimmed[i])) {
      // 类型名可能带括号参数，如 VARCHAR(255) / DECIMAL(10,2) / ENUM('a','b')
      while (i < trimmed.length && /[a-zA-Z0-9_$#@]/.test(trimmed[i])) i++
      // 如果紧接着是 '('，则吞掉到匹配 ')' 的整段作为类型
      if (trimmed[i] === '(') {
        const close = findMatchingParen(trimmed, i)
        if (close > i) {
          i = close + 1
        }
      }
      tokens.push(trimmed.slice(start, i))
    } else {
      i++
    }
  }

  if (tokens.length === 0) return null
  const rawName = stripQuotes(tokens[0])
  if (!rawName) return null

  // 若是约束行，跳过（主键在 parsePrimaryKeyCols 单独处理）
  if (isConstraintLine(rawName)) return null

  const rawType = tokens[1] || ''
  const tsType = mapSqlType(rawType)

  // 检测 NOT NULL / NULL
  const upper = trimmed.toUpperCase()
  const hasNotNull = /\bNOT\s+NULL\b/.test(upper)
  const hasExplicitNull = !hasNotNull && /\bNULL\b/.test(upper)
  // 默认：无 NOT NULL 则视为可空
  const isNullable = !hasNotNull

  // 检测列级主键
  const hasColumnPk = /\bPRIMARY\s+KEY\b/.test(upper)

  const comment = parseComment(trimmed)

  return {
    name: rawName,
    tsType,
    isNullable: hasExplicitNull ? true : isNullable,
    isPk: hasColumnPk,
    comment,
  }
}

// 解析建表语句
function parseCreateTables(sql: string): TableInfo[] {
  const tables: TableInfo[] = []
  // 匹配 CREATE [TEMP] TABLE [IF NOT EXISTS] [`"]?name[`"]? (
  const re =
    /CREATE\s+(?:TEMP(?:ORARY)?\s+|UNLOGGED\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([`"\[]?)([\w$.]+)\1\s*\(/gi

  let m: RegExpExecArray | null
  while ((m = re.exec(sql)) !== null) {
    const tableName = m[2].split('.').pop() || m[2] // 去掉 schema 前缀
    const openParen = sql.indexOf('(', m.index)
    if (openParen === -1) continue
    const closeParen = findMatchingParen(sql, openParen)
    if (closeParen === -1) continue
    const body = sql.slice(openParen + 1, closeParen)
    const parts = splitTopLevel(body)

    const columns: ColumnInfo[] = []
    const pkCols: string[] = []

    for (const part of parts) {
      const trimmed = part.trim()
      if (!trimmed) continue
      // 先检查是否为表级主键定义
      if (/^\s*PRIMARY\s+KEY\b/i.test(trimmed)) {
        pkCols.push(...parsePrimaryKeyCols(trimmed))
        continue
      }
      const col = parseColumn(part)
      if (col) columns.push(col)
    }

    // 标记表级主键
    if (pkCols.length > 0) {
      for (const pkName of pkCols) {
        const col = columns.find(
          (c) => c.name.toLowerCase() === pkName.toLowerCase()
        )
        if (col) {
          col.isPk = true
          col.isNullable = false
        }
      }
    }

    tables.push({
      name: tableName,
      interfaceName: toPascalCase(tableName),
      columns,
    })
  }

  return tables
}

// ==================== 生成接口 ====================

function generateInterface(table: TableInfo, index: number): string {
  // 接口名：用户输入的名称仅用于第一个表，其余使用表名派生
  let ifaceName = table.interfaceName
  if (index === 0 && interfaceName.value.trim()) {
    ifaceName = interfaceName.value.trim()
  }

  const prefix = (exportKeyword.value ? 'export ' : '') + 'interface '
  const lines: string[] = []
  lines.push(`${prefix}${ifaceName} {`)

  for (const col of table.columns) {
    // 主键注释
    if (col.isPk && markPkComment.value) {
      lines.push(`  /** 主键 */`)
    } else if (col.comment) {
      lines.push(`  /** ${col.comment} */`)
    }
    const readonly = readonlyAll.value || col.isPk
    const optional = col.isNullable && !col.isPk ? '?' : ''
    const roPrefix = readonly ? 'readonly ' : ''
    lines.push(`  ${roPrefix}${formatFieldName(col.name)}${optional}: ${col.tsType};`)
  }

  lines.push('}')
  return lines.join('\n')
}

function convert() {
  errorMsg.value = ''
  result.value = ''

  if (!input.value.trim()) {
    errorMsg.value = '请输入 CREATE TABLE 语句'
    return
  }

  try {
    const tables = parseCreateTables(input.value)
    if (tables.length === 0) {
      errorMsg.value = '未识别到 CREATE TABLE 语句，请检查输入'
      return
    }
    const hasColumns = tables.some((t) => t.columns.length > 0)
    if (!hasColumns) {
      errorMsg.value = '未解析到任何字段，请检查建表语句格式'
      return
    }
    // 自动填充默认接口名
    if (!interfaceName.value.trim() && tables.length > 0) {
      interfaceName.value = tables[0].interfaceName
    }
    result.value = tables.map((t, i) => generateInterface(t, i)).join('\n\n')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    errorMsg.value = '解析失败：' + msg
    result.value = ''
  }
}

function loadExample() {
  input.value = exampleSql
  interfaceName.value = ''
  errorMsg.value = ''
  convert()
}

function copy() {
  if (!result.value) return
  navigator.clipboard.writeText(result.value).then(() => {
    message.success('已复制到剪贴板')
  }).catch(() => {
    message.error('复制失败，请手动复制')
  })
}

function clear() {
  input.value = ''
  result.value = ''
  interfaceName.value = ''
  errorMsg.value = ''
}
</script>

<style scoped>
.sql-to-entity {
  max-width: 1000px;
  margin: 0 auto;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}

.options {
  display: flex;
  align-items: center;
}

.opt-label {
  font-size: 13px;
  color: #555;
}

.dark .opt-label {
  color: #aaa;
}

.editor-area {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.editor-pane {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dark .pane-label {
  color: #999;
}

.code-input :deep(textarea),
.code-output :deep(textarea) {
  font-family: 'Fira Code', 'Consolas', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.card {
  padding: 16px;
  border-radius: 8px;
  background: #f5f5f5;
}

.dark .card {
  background: #1e2a4a;
}

.type-map h3 {
  margin: 0;
  font-size: 14px;
  color: #333;
}

.dark .type-map h3 {
  color: #e0e0e0;
}

.map-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 8px 16px;
}

.map-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.sql-type {
  color: #2080f0;
  font-family: 'Fira Code', monospace;
}

.ts-type {
  color: #18a058;
  font-family: 'Fira Code', monospace;
}

.arrow {
  color: #999;
}

.dark .arrow {
  color: #666;
}

.mt-3 {
  margin-top: 12px;
}

.mt-4 {
  margin-top: 16px;
}

.mb-3 {
  margin-bottom: 12px;
}

.mb-4 {
  margin-bottom: 16px;
}

@media (max-width: 768px) {
  .editor-area {
    grid-template-columns: 1fr;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
