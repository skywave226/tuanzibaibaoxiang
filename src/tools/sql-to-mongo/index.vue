<template>
  <div class="sql-to-mongo tool-container">
    <!-- 输入区 -->
    <div class="card mb-4">
      <div class="pane-label mb-2">SQL 查询语句</div>
      <n-input
        v-model:value="sqlInput"
        type="textarea"
        placeholder="例如：SELECT name, age FROM users WHERE age >= 18 AND status = 'active' ORDER BY created_at DESC LIMIT 10;"
        :rows="8"
        :autosize="false"
      />
      <div class="toolbar mt-3">
        <n-button type="primary" @click="convert">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg></span>
          转换为 MongoDB
        </n-button>
        <n-button @click="loadExample(0)">示例 1</n-button>
        <n-button @click="loadExample(1)">示例 2</n-button>
        <n-button @click="loadExample(2)">示例 3</n-button>
        <n-button @click="clearAll">清空</n-button>
      </div>
    </div>

    <!-- 转换结果区 -->
    <div class="card" v-if="converted">
      <!-- 查询集合名 -->
      <div class="result-section mb-4" v-if="collectionName">
        <div class="pane-label mb-2">查询集合</div>
        <code class="collection-code">db.{{ collectionName }}.find(...)</code>
      </div>

      <!-- filter -->
      <div class="result-section mb-4" v-if="hasFilter">
        <div class="section-header">
          <span class="pane-label">filter（查询条件）</span>
          <n-button size="small" quaternary @click="copyText(filterJson)">复制</n-button>
        </div>
        <pre class="json-code"><code>{{ filterJson }}</code></pre>
      </div>

      <!-- projection -->
      <div class="result-section mb-4" v-if="hasProjection">
        <div class="section-header">
          <span class="pane-label">projection（字段投影）</span>
          <n-button size="small" quaternary @click="copyText(projectionJson)">复制</n-button>
        </div>
        <pre class="json-code"><code>{{ projectionJson }}</code></pre>
      </div>

      <!-- sort -->
      <div class="result-section mb-4" v-if="hasSort">
        <div class="section-header">
          <span class="pane-label">sort（排序）</span>
          <n-button size="small" quaternary @click="copyText(sortJson)">复制</n-button>
        </div>
        <pre class="json-code"><code>{{ sortJson }}</code></pre>
      </div>

      <!-- limit -->
      <div class="result-section mb-4" v-if="hasLimit">
        <div class="section-header">
          <span class="pane-label">limit（限制条数）</span>
          <n-button size="small" quaternary @click="copyText(limitJson)">复制</n-button>
        </div>
        <pre class="json-code"><code>{{ limitJson }}</code></pre>
      </div>

      <!-- 完整调用语句 -->
      <div class="result-section" v-if="fullStatement">
        <div class="section-header">
          <span class="pane-label">完整调用语句</span>
          <n-button size="small" type="primary" @click="copyText(fullStatement)">复制全部</n-button>
        </div>
        <pre class="json-code full-code"><code>{{ fullStatement }}</code></pre>
      </div>
    </div>

    <!-- 错误提示 -->
    <n-alert
      v-if="errorMsg"
      type="error"
      class="mt-4"
      closable
      @close="errorMsg = ''"
    >
      {{ errorMsg }}
    </n-alert>

    <!-- 操作符映射说明 -->
    <div class="card mt-4">
      <div class="pane-label mb-2">操作符映射</div>
      <div class="map-grid">
        <div class="map-item" v-for="m in operatorMap" :key="m.sql">
          <code class="sql-op">{{ m.sql }}</code>
          <span class="arrow">→</span>
          <code class="mongo-op">{{ m.mongo }}</code>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NInput, NButton, NAlert, useMessage } from 'naive-ui'

// 消息提示
const message = useMessage()

const sqlInput = ref('')
const converted = ref(false)
const errorMsg = ref('')

// 转换结果
const collectionName = ref('')
const filterObj = ref<Record<string, unknown> | null>(null)
const projectionObj = ref<Record<string, number> | null>(null)
const sortObj = ref<Record<string, 1 | -1> | null>(null)
const limitValue = ref<number | null>(null)

// 操作符映射展示
const operatorMap = [
  { sql: '=', mongo: '$eq（默认简写）' },
  { sql: '!=', mongo: '$ne' },
  { sql: '>', mongo: '$gt' },
  { sql: '>=', mongo: '$gte' },
  { sql: '<', mongo: '$lt' },
  { sql: '<=', mongo: '$lte' },
  { sql: 'LIKE', mongo: '$regex' },
  { sql: 'IN', mongo: '$in' },
  { sql: 'NOT IN', mongo: '$nin' },
  { sql: 'AND', mongo: '逗号分隔（隐式与）' },
  { sql: 'OR', mongo: '$or' },
  { sql: 'IS NULL', mongo: '$exists: false' },
  { sql: 'IS NOT NULL', mongo: '$exists: true' },
]

// 各部分 JSON 字符串
const filterJson = computed(() => filterObj.value ? JSON.stringify(filterObj.value, null, 2) : '{}')
const projectionJson = computed(() => projectionObj.value ? JSON.stringify(projectionObj.value, null, 2) : '{}')
const sortJson = computed(() => sortObj.value ? JSON.stringify(sortObj.value, null, 2) : '{}')
const limitJson = computed(() => String(limitValue.value ?? 0))

// 是否有对应部分
const hasFilter = computed(() => filterObj.value !== null && Object.keys(filterObj.value).length > 0)
const hasProjection = computed(() => projectionObj.value !== null && Object.keys(projectionObj.value).length > 0)
const hasSort = computed(() => sortObj.value !== null && Object.keys(sortObj.value).length > 0)
const hasLimit = computed(() => limitValue.value !== null)

// 完整调用语句
const fullStatement = computed(() => {
  if (!collectionName.value) return ''
  const parts: string[] = [`db.${collectionName.value}.find(`]
  // filter
  const filterStr = JSON.stringify(filterObj.value || {})
  const projStr = projectionObj.value && Object.keys(projectionObj.value).length > 0
    ? JSON.stringify(projectionObj.value)
    : ''
  if (projStr) {
    parts.push(`${filterStr}, ${projStr}`)
  } else {
    parts.push(filterStr)
  }
  parts.push(')')
  // sort
  if (sortObj.value && Object.keys(sortObj.value).length > 0) {
    parts.push(`.sort(${JSON.stringify(sortObj.value)})`)
  }
  // limit
  if (limitValue.value !== null) {
    parts.push(`.limit(${limitValue.value})`)
  }
  return parts.join('')
})

// ==================== 工具函数 ====================

// 去除标识符的引号 / 反引号 / 方括号
function stripQuotes(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return trimmed
  if (trimmed.startsWith('`') && trimmed.endsWith('`')) return trimmed.slice(1, -1)
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) return trimmed.slice(1, -1)
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) return trimmed.slice(1, -1)
  return trimmed
}

// 规范化 SQL：去除注释，统一字符串为单引号占位
function normalizeSql(sql: string): string {
  let out = sql
  // 去除块注释
  out = out.replace(/\/\*[\s\S]*?\*\//g, ' ')
  // 去除行注释
  out = out.replace(/(--|#)[^\n]*/g, ' ')
  // 统一换行
  out = out.replace(/\r\n/g, '\n')
  return out
}

// 解析 SQL 字面量值：字符串、数字、布尔、null
function parseLiteral(raw: string): unknown {
  const s = raw.trim()
  if (s === '') return ''
  // 字符串
  if (/^'.*'$/.test(s) || /^".*"$/.test(s)) {
    return s.slice(1, -1).replace(/''/g, "'")
  }
  // null
  if (/^null$/i.test(s)) return null
  // 布尔
  if (/^true$/i.test(s)) return true
  if (/^false$/i.test(s)) return false
  // 数字
  if (/^-?\d+$/.test(s) || /^-?\d+\.\d+$/.test(s)) {
    const num = Number(s)
    if (!isNaN(num)) return num
  }
  // 其他：作为字符串（去除可能的反引号）
  return stripQuotes(s)
}

// 解析 IN 列表：(1, 'a', true)
function parseInList(raw: string): unknown[] {
  const s = raw.trim()
  // 去掉外层括号
  const inner = s.replace(/^\(/, '').replace(/\)$/, '').trim()
  if (!inner) return []
  // 按顶层逗号拆分（不进入嵌套括号）
  const parts: string[] = []
  let depth = 0
  let start = 0
  let inStr: string | null = null
  for (let i = 0; i <= inner.length; i++) {
    const ch = inner[i]
    if (inStr) {
      if (ch === inStr) inStr = null
      continue
    }
    if (ch === "'" || ch === '"') { inStr = ch; continue }
    if (ch === '(') depth++
    else if (ch === ')') depth--
    else if ((ch === ',' || i === inner.length) && depth === 0) {
      parts.push(inner.slice(start, i).trim())
      start = i + 1
    }
  }
  return parts.filter(Boolean).map(parseLiteral)
}

// 解析 SELECT 子句，返回投影字段列表
function parseSelectFields(sql: string): string[] {
  const m = sql.match(/\bSELECT\s+(?:DISTINCT\s+)?([^]*?)\bFROM\b/i)
  if (!m) return []
  const raw = m[1].trim()
  // SELECT *
  if (/^\*$/.test(raw)) return []
  // 按顶层逗号拆分
  const parts: string[] = []
  let depth = 0
  let start = 0
  let inStr: string | null = null
  for (let i = 0; i <= raw.length; i++) {
    const ch = raw[i]
    if (inStr) {
      if (ch === inStr) inStr = null
      continue
    }
    if (ch === "'" || ch === '"') { inStr = ch; continue }
    if (ch === '(') depth++
    else if (ch === ')') depth--
    else if ((ch === ',' || i === raw.length) && depth === 0) {
      parts.push(raw.slice(start, i).trim())
      start = i + 1
    }
  }
  const fields: string[] = []
  for (const part of parts) {
    if (!part || part === '*') continue
    // 处理 field AS alias 形式，取原字段名
    const asMatch = part.match(/^(.+?)\s+AS\s+(\w+)$/i)
    let name = asMatch ? asMatch[1] : part
    // 取最后一个 token（处理 table.column）
    const tokenMatch = name.match(/([`"\[]?[\w.]+[`"\]]?)\s*$/)
    if (tokenMatch) {
      const f = stripQuotes(tokenMatch[1].split('.').pop() || '')
      if (f) fields.push(f)
    }
  }
  return fields
}

// 从 SQL 中提取 FROM 后的集合（表）名
function parseCollection(sql: string): string {
  const m = sql.match(/\bFROM\s+([`"\[]?)([\w$.]+)\1/i)
  if (!m) return ''
  return m[2].split('.').pop() || m[2]
}

// 从 SQL 中提取 WHERE 子句文本
function extractWhereClause(sql: string): string {
  const startMatch = sql.match(/\bWHERE\b/i)
  if (!startMatch) return ''
  const start = startMatch.index! + startMatch[0].length
  const endRe = /\b(GROUP\s+BY|ORDER\s+BY|HAVING|LIMIT|UNION|RETURNING)\b|;|\)(?![^(]*\()/i
  let end = sql.length
  let depth = 0
  for (let i = start; i < sql.length; i++) {
    if (sql[i] === '(') depth++
    else if (sql[i] === ')') {
      if (depth === 0) { end = i; break }
      depth--
    } else {
      const rest = sql.slice(i)
      if (depth === 0) {
        const em = rest.match(endRe)
        if (em && em.index !== undefined) {
          end = i + em.index
          break
        }
      }
    }
  }
  return sql.slice(start, end).trim()
}

// 从 SQL 中提取 ORDER BY 字段及方向
interface OrderField {
  field: string
  direction: 1 | -1
}

function parseOrderBy(sql: string): OrderField[] {
  const fields: OrderField[] = []
  const m = sql.match(/\bORDER\s+BY\s+([^]*?)(?=\bLIMIT\b|\bUNION\b|;|$)/i)
  if (!m) return fields
  const clause = m[1]
  const parts = clause.split(',').map(s => s.trim()).filter(Boolean)
  for (const part of parts) {
    const dirMatch = part.match(/\s+(ASC|DESC)$/i)
    const dir = dirMatch && dirMatch[1].toUpperCase() === 'DESC' ? -1 : 1
    const namePart = dirMatch ? part.slice(0, dirMatch.index) : part
    const nameMatch = namePart.match(/^([`"\[]?[\w.]+[`"\]]?)/)
    if (nameMatch) {
      const f = stripQuotes(nameMatch[1].split('.').pop() || '')
      if (f) fields.push({ field: f, direction: dir })
    }
  }
  return fields
}

// 从 SQL 中提取 LIMIT 值
function parseLimit(sql: string): number | null {
  // 支持 LIMIT n 与 LIMIT offset, n
  const m = sql.match(/\bLIMIT\s+(\d+)(?:\s*,\s*(\d+))?/i)
  if (!m) return null
  // 若有两个数字，第二个才是限制条数
  if (m[2]) return parseInt(m[2], 10)
  return parseInt(m[1], 10)
}

// ==================== WHERE 条件解析 ====================

// 条件项
interface Condition {
  field: string
  operator: string // =, !=, >, >=, <, <=, LIKE, IN, NIN, IS_NULL, IS_NOT_NULL
  value: unknown
}

// 按 AND / OR 拆分 WHERE 子句，递归处理括号
interface LogicGroup {
  type: 'and' | 'or'
  items: Array<Condition | LogicGroup>
}

// 解析 WHERE 子句为逻辑结构
function parseWhere(whereClause: string): LogicGroup | null {
  if (!whereClause.trim()) return null
  // 递归下降解析：先按 OR 拆分（顶层），再按 AND 拆分
  // 注意括号优先级
  const result = splitByLogical(whereClause, 'OR')
  if (result.length === 0) return null
  if (result.length === 1) {
    // 没有 OR，处理 AND
    const andGroup = splitByLogical(whereClause, 'AND')
    if (andGroup.length === 1) {
      // 单个条件或括号组
      const single = andGroup[0]
      if (single.startsWith('(') && isBalancedParenWrap(single)) {
        const inner = single.slice(1, -1).trim()
        return parseWhere(inner)
      }
      const cond = parseCondition(single)
      if (!cond) return null
      return { type: 'and', items: [cond] }
    }
    const items: Array<Condition | LogicGroup> = []
    for (const part of andGroup) {
      if (part.startsWith('(') && isBalancedParenWrap(part)) {
        const inner = part.slice(1, -1).trim()
        const sub = parseWhere(inner)
        if (sub) items.push(sub)
      } else {
        const cond = parseCondition(part)
        if (cond) items.push(cond)
      }
    }
    return { type: 'and', items }
  }
  // 多个 OR 分支
  const items: Array<Condition | LogicGroup> = []
  for (const part of result) {
    const sub = parseWhere(part)
    if (sub) items.push(sub)
  }
  return { type: 'or', items }
}

// 判断字符串是否是被一对平衡的括号包裹（即首字符为 '(' 且最后一个 ')' 与之配对）
function isBalancedParenWrap(s: string): boolean {
  const trimmed = s.trim()
  if (!trimmed.startsWith('(') || !trimmed.endsWith(')')) return false
  let depth = 0
  for (let i = 0; i < trimmed.length; i++) {
    if (trimmed[i] === '(') depth++
    else if (trimmed[i] === ')') {
      depth--
      if (depth === 0 && i !== trimmed.length - 1) return false
    }
  }
  return true
}

// 按顶层 AND / OR 拆分（不进入括号，不进入字符串）
function splitByLogical(s: string, logic: 'AND' | 'OR'): string[] {
  const parts: string[] = []
  let depth = 0
  let start = 0
  let inStr: string | null = null
  const re = new RegExp(`\\b${logic}\\b`, 'gi')
  // 我们逐字符扫描，遇到 logic 关键字（不在括号/字符串内）则拆分
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (inStr) {
      if (ch === inStr) inStr = null
      continue
    }
    if (ch === "'" || ch === '"') { inStr = ch; continue }
    if (ch === '(') { depth++; continue }
    if (ch === ')') { depth--; continue }
    if (depth === 0) {
      // 检查此处是否匹配 logic 关键字
      const rest = s.slice(i)
      const m = rest.match(re)
      if (m && m.index === 0) {
        parts.push(s.slice(start, i).trim())
        start = i + m[0].length
        i += m[0].length - 1
      }
    }
  }
  parts.push(s.slice(start).trim())
  return parts.filter(p => p.length > 0)
}

// 解析单个条件：field op value
function parseCondition(s: string): Condition | null {
  const t = s.trim()
  if (!t) return null

  // IS NULL / IS NOT NULL
  let m = t.match(/^([`"\[]?)([\w.]+)\1\s+IS\s+NOT\s+NULL$/i)
  if (m) {
    return { field: stripQuotes((m[2].split('.').pop() || '')), operator: 'IS_NOT_NULL', value: null }
  }
  m = t.match(/^([`"\[]?)([\w.]+)\1\s+IS\s+NULL$/i)
  if (m) {
    return { field: stripQuotes((m[2].split('.').pop() || '')), operator: 'IS_NULL', value: null }
  }

  // NOT IN (...)
  m = t.match(/^([`"\[]?)([\w.]+)\1\s+NOT\s+IN\s*\(([^]*)\)$/i)
  if (m) {
    return {
      field: stripQuotes((m[2].split('.').pop() || '')),
      operator: 'NIN',
      value: parseInList(m[3]),
    }
  }

  // IN (...)
  m = t.match(/^([`"\[]?)([\w.]+)\1\s+IN\s*\(([^]*)\)$/i)
  if (m) {
    return {
      field: stripQuotes((m[2].split('.').pop() || '')),
      operator: 'IN',
      value: parseInList(m[3]),
    }
  }

  // LIKE 'xxx'
  m = t.match(/^([`"\[]?)([\w.]+)\1\s+LIKE\s+('.*?'|".*?")$/i)
  if (m) {
    const field = stripQuotes((m[2].split('.').pop() || ''))
    // 去掉首尾引号得到 pattern
    let pattern = m[3].slice(1, -1).replace(/''/g, "'")
    // SQL LIKE 通配符转 Mongo 正则： % → .*，_ → .
    const regex = pattern
      .replace(/[.+*?^${}()|[\]\\]/g, '\\$&') // 先转义正则元字符
      .replace(/%/g, '.*')
      .replace(/_/g, '.')
    return { field, operator: 'LIKE', value: regex }
  }

  // 比较操作符：>=, <=, <>, !=, =, >, <
  m = t.match(/^([`"\[]?)([\w.]+)\1\s*(>=|<=|<>|!=|=|>|<)\s*(.+)$/i)
  if (m) {
    const field = stripQuotes((m[2].split('.').pop() || ''))
    let op = m[3]
    if (op === '<>') op = '!='
    const value = parseLiteral(m[4])
    return { field, operator: op, value }
  }

  return null
}

// ==================== 转换为 MongoDB 查询对象 ====================

// 将逻辑结构转为 MongoDB 查询对象
function buildFilter(group: LogicGroup): Record<string, unknown> {
  if (group.type === 'and') {
    // 合并所有条件到同一对象（同字段合并操作符）
    const merged: Record<string, unknown> = {}
    for (const item of group.items) {
      if ('type' in item) {
        // 子逻辑组：若是 AND 子组则合并；若是 OR 子组则作为 $or
        if (item.type === 'or') {
          const orArr = merged.$or
          if (Array.isArray(orArr)) {
            orArr.push(buildFilter(item))
          } else if (Object.keys(merged).length === 0) {
            // 顶层只有 OR，则整体作为 $or
            return { $or: [buildFilter(item)] }
          } else {
            // 已有 AND 条件，又有 OR 子组：需将 AND 条件作为隐式，转为 { $and: [existing, { $or: [...] }] }
            // 简化处理：将 OR 子组作为 $or 字段放入（与现有 AND 并存，MongoDB 语义为隐式 AND）
            merged.$or = [buildFilter(item)]
          }
        } else {
          // AND 子组：递归合并
          const sub = buildFilter(item)
          for (const [k, v] of Object.entries(sub)) {
            mergeField(merged, k, v)
          }
        }
      } else {
        // 单个条件
        const cond = item as Condition
        applyCondition(merged, cond)
      }
    }
    return merged
  }
  // OR 组
  const clauses: Record<string, unknown>[] = []
  for (const item of group.items) {
    if ('type' in item) {
      clauses.push(buildFilter(item))
    } else {
      const single: Record<string, unknown> = {}
      applyCondition(single, item as Condition)
      clauses.push(single)
    }
  }
  if (clauses.length === 1) return clauses[0]
  return { $or: clauses }
}

// 合并同字段的操作符对象
function mergeField(target: Record<string, unknown>, field: string, value: unknown) {
  const existing = target[field]
  if (
    existing !== null && typeof existing === 'object' && !Array.isArray(existing) &&
    value !== null && typeof value === 'object' && !Array.isArray(value)
  ) {
    target[field] = { ...(existing as object), ...(value as object) }
  } else {
    target[field] = value
  }
}

// 将单个条件应用到目标对象
function applyCondition(target: Record<string, unknown>, cond: Condition) {
  switch (cond.operator) {
    case '=':
      target[cond.field] = cond.value
      break
    case '!=':
      target[cond.field] = { $ne: cond.value }
      break
    case '>':
      target[cond.field] = { $gt: cond.value }
      break
    case '>=':
      target[cond.field] = { $gte: cond.value }
      break
    case '<':
      target[cond.field] = { $lt: cond.value }
      break
    case '<=':
      target[cond.field] = { $lte: cond.value }
      break
    case 'LIKE':
      target[cond.field] = { $regex: cond.value }
      break
    case 'IN':
      target[cond.field] = { $in: cond.value as unknown[] }
      break
    case 'NIN':
      target[cond.field] = { $nin: cond.value as unknown[] }
      break
    case 'IS_NULL':
      target[cond.field] = { $exists: false }
      break
    case 'IS_NOT_NULL':
      target[cond.field] = { $exists: true }
      break
  }
}

// ==================== 主转换函数 ====================

function convert() {
  converted.value = false
  errorMsg.value = ''
  filterObj.value = null
  projectionObj.value = null
  sortObj.value = null
  limitValue.value = null
  collectionName.value = ''

  const sqlRaw = sqlInput.value
  if (!sqlRaw.trim()) {
    errorMsg.value = '请输入 SQL 查询语句'
    return
  }

  try {
    const sql = normalizeSql(sqlRaw)

    // 集合名
    const col = parseCollection(sql)
    if (!col) {
      errorMsg.value = '未识别到 FROM 子句或表名，请检查 SQL 语句'
      return
    }
    collectionName.value = col

    // 投影（SELECT 字段）
    const selectFields = parseSelectFields(sql)
    if (selectFields.length > 0) {
      const proj: Record<string, number> = {}
      for (const f of selectFields) {
        proj[f] = 1
      }
      projectionObj.value = proj
    }

    // WHERE → filter
    const whereClause = extractWhereClause(sql)
    if (whereClause) {
      const logic = parseWhere(whereClause)
      if (logic) {
        filterObj.value = buildFilter(logic)
      }
    }
    if (!filterObj.value) filterObj.value = {}

    // ORDER BY → sort
    const orderFields = parseOrderBy(sql)
    if (orderFields.length > 0) {
      const sort: Record<string, 1 | -1> = {}
      for (const o of orderFields) {
        sort[o.field] = o.direction
      }
      sortObj.value = sort
    }

    // LIMIT → limit
    const limit = parseLimit(sql)
    if (limit !== null) {
      limitValue.value = limit
    }

    converted.value = true
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    errorMsg.value = '转换失败：' + msg + '。请检查 SQL 语法是否正确，本工具支持常见 SELECT 查询。'
  }
}

// 复制文本到剪贴板
async function copyText(text: string) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    message.success('已复制到剪贴板')
  } catch {
    message.error('复制失败，请手动复制')
  }
}

// 清空
function clearAll() {
  sqlInput.value = ''
  converted.value = false
  errorMsg.value = ''
  filterObj.value = null
  projectionObj.value = null
  sortObj.value = null
  limitValue.value = null
  collectionName.value = ''
}

// 示例 SQL
const examples = [
  `SELECT name, age, email FROM users
WHERE age >= 18 AND status = 'active' AND role IN ('admin', 'editor')
ORDER BY created_at DESC
LIMIT 10;`,
  `SELECT * FROM products
WHERE (price > 100 OR stock < 10) AND category = 'electronics'
ORDER BY price ASC, name DESC
LIMIT 20;`,
  `SELECT id, title, content FROM articles
WHERE author != 'guest' AND title LIKE '%mongodb%'
  AND published_at IS NOT NULL
ORDER BY published_at DESC
LIMIT 5;`,
]

// 加载示例
function loadExample(index: number) {
  sqlInput.value = examples[index] || examples[0]
  convert()
}
</script>

<style scoped>
.tool-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 16px;
}

/* 卡片 */
.card {
  padding: 16px;
  border-radius: 8px;
  background: #f7f7f9;
  border: 1px solid #ececec;
}

.dark .card {
  background: #1e1e2e;
  border-color: #2a2a3a;
}

.mb-2 {
  margin-bottom: 8px;
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-3 {
  margin-top: 12px;
}

.mt-4 {
  margin-top: 16px;
}

.mr-1 {
  margin-right: 4px;
}

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dark .pane-label {
  color: #aaa;
}

.toolbar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* 结果分区 */
.result-section {
  padding-bottom: 12px;
  border-bottom: 1px dashed #e8e8e8;
}

.result-section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.dark .result-section {
  border-bottom-color: #333;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.collection-code {
  display: inline-block;
  padding: 6px 12px;
  background: #e6f7ff;
  border-radius: 6px;
  font-family: 'Fira Code', 'Consolas', 'Courier New', monospace;
  font-size: 14px;
  color: #1890ff;
  word-break: break-all;
}

.dark .collection-code {
  background: #16243a;
  color: #69c0ff;
}

.json-code {
  margin: 0;
  padding: 14px 16px;
  background: #1e1e2e;
  border-radius: 8px;
  overflow-x: auto;
  font-family: 'Fira Code', 'Consolas', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.7;
  color: #a5d6ff;
}

.dark .json-code {
  background: #0d1117;
}

.json-code code {
  white-space: pre;
}

.full-code {
  background: #1a2332;
}

.dark .full-code {
  background: #0a0f1a;
}

/* 操作符映射表 */
.map-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 8px 16px;
}

.map-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.sql-op {
  color: #2080f0;
  font-family: 'Fira Code', monospace;
}

.mongo-op {
  color: #18a058;
  font-family: 'Fira Code', monospace;
}

.arrow {
  color: #999;
}

.dark .arrow {
  color: #666;
}

/* 响应式 */
@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .map-grid {
    grid-template-columns: 1fr;
  }
}
</style>
