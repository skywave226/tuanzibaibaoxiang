<template>
  <div class="index-optimizer tool-container">
    <!-- 输入区 -->
    <div class="card mb-4">
      <div class="pane-label mb-2">SQL 查询语句</div>
      <n-input
        v-model:value="sqlInput"
        type="textarea"
        placeholder="例如：SELECT * FROM users WHERE email = 'a@b.com' ORDER BY created_at DESC;"
        :rows="8"
        :autosize="false"
      />

      <div class="pane-label mb-2 mt-4">表结构 CREATE TABLE 语句（可选）</div>
      <n-input
        v-model:value="tableInput"
        type="textarea"
        placeholder="例如：CREATE TABLE users (id INT PRIMARY KEY, email VARCHAR(100), created_at DATETIME);"
        :rows="6"
        :autosize="false"
      />

      <div class="toolbar mt-3">
        <n-button type="primary" @click="analyze">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg></span>
          开始分析
        </n-button>
        <n-button @click="loadExample">加载示例</n-button>
        <n-button @click="clearAll">清空</n-button>
      </div>
    </div>

    <!-- 结果区 -->
    <div class="card" v-if="analyzed">
      <!-- 概要 -->
      <div class="summary">
        <div class="summary-item">
          <span class="summary-label">建议总数：</span>
          <strong>{{ suggestions.length }}</strong>
        </div>
        <div class="summary-item">
          <n-tag type="error" size="small" :bordered="false" round>高 {{ highCount }}</n-tag>
        </div>
        <div class="summary-item">
          <n-tag type="warning" size="small" :bordered="false" round>中 {{ mediumCount }}</n-tag>
        </div>
        <div class="summary-item">
          <n-tag type="info" size="small" :bordered="false" round>低 {{ lowCount }}</n-tag>
        </div>
      </div>

      <!-- 建议列表 -->
      <div class="suggestions-list mt-4" v-if="suggestions.length > 0">
        <div class="pane-label mb-2">优化建议</div>
        <div
          v-for="(item, index) in suggestions"
          :key="index"
          class="suggestion-item"
          :class="item.level"
        >
          <div class="suggestion-header">
            <n-tag :type="levelTagType(item.level)" size="small" :bordered="false">
              {{ levelText(item.level) }}
            </n-tag>
            <span class="suggestion-title">{{ item.title }}</span>
          </div>
          <div class="suggestion-detail">
            <div class="detail-row">
              <span class="detail-label">相关字段：</span>
              <code class="field-code" v-for="f in item.fields" :key="f">{{ f }}</code>
            </div>
            <div class="detail-row">
              <span class="detail-label">说明：</span>
              <span>{{ item.description }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">建议：</span>
              <span class="suggestion-tip">{{ item.suggestion }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="empty-tip mt-4" v-else>
        <n-empty description="未发现明显的索引优化点，查询结构良好" />
      </div>

      <!-- 建议的 CREATE INDEX 语句 -->
      <div class="index-statements mt-4" v-if="indexStatements.length > 0">
        <div class="index-header">
          <span class="pane-label">建议的 CREATE INDEX 语句</span>
          <n-button size="small" @click="copyIndexStatements">复制</n-button>
        </div>
        <pre class="index-code"><code>{{ indexStatements.join('\n\n') }}</code></pre>
      </div>
    </div>

    <!-- 规则说明 -->
    <div class="card mt-4">
      <div class="pane-label mb-2">检测规则说明</div>
      <n-list :bordered="false" size="small">
        <n-list-item>① WHERE 条件中等值 / 范围 / IN 字段建议建立索引。</n-list-item>
        <n-list-item>② JOIN ON 连接字段建议建立索引（两侧均建议）。</n-list-item>
        <n-list-item>③ ORDER BY 排序字段建议建立索引，避免文件排序。</n-list-item>
        <n-list-item>④ LIKE '%xxx' 前导通配符无法使用索引，建议改用前缀匹配。</n-list-item>
        <n-list-item>⑤ WHERE 中对字段使用函数（如 LOWER(name)）会导致索引失效。</n-list-item>
        <n-list-item>⑥ OR 条件可能使部分索引失效，建议拆分或使用 UNION。</n-list-item>
      </n-list>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NInput, NButton, NTag, NList, NListItem, NEmpty, useMessage } from 'naive-ui'

// 消息提示
const message = useMessage()

// 优先级类型
type Level = 'high' | 'medium' | 'low'

// 单条建议
interface Suggestion {
  level: Level
  title: string
  fields: string[]
  description: string
  suggestion: string
}

const sqlInput = ref('')
const tableInput = ref('')
const analyzed = ref(false)
const suggestions = ref<Suggestion[]>([])
const indexStatements = ref<string[]>([])

// 各等级数量统计
const highCount = computed(() => suggestions.value.filter(s => s.level === 'high').length)
const mediumCount = computed(() => suggestions.value.filter(s => s.level === 'medium').length)
const lowCount = computed(() => suggestions.value.filter(s => s.level === 'low').length)

// 等级文字
function levelText(level: Level) {
  return level === 'high' ? '高优先级' : level === 'medium' ? '中优先级' : '低优先级'
}

// 等级对应标签颜色
function levelTagType(level: Level): 'error' | 'warning' | 'info' {
  return level === 'high' ? 'error' : level === 'medium' ? 'warning' : 'info'
}

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

// 规范化 SQL：去除字符串字面量、注释，避免后续正则误匹配
function normalizeSql(sql: string): string {
  let out = sql
  // 去除块注释 /* ... */
  out = out.replace(/\/\*[\s\S]*?\*\//g, ' ')
  // 去除行注释 -- ... 与 # ...
  out = out.replace(/(--|#)[^\n]*/g, ' ')
  // 去除单引号字符串，替换为占位 '__STR__'
  out = out.replace(/'(?:[^'\\]|\\.|'')*'/g, "'__STR__'")
  // 去除双引号字符串（部分方言用于字面量）
  out = out.replace(/"(?:[^"\\]|\\.|"")*"/g, '"__STR__"')
  return out
}

// 从 CREATE TABLE 中提取表名
function parseTableNameFromDdl(ddl: string): string | null {
  const m = ddl.match(/CREATE\s+(?:TEMP(?:ORARY)?\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([`"\[]?)([\w$.]+)\1/i)
  if (!m) return null
  return m[2].split('.').pop() || m[2]
}

// 从 CREATE TABLE 中提取字段列表
function parseColumnsFromDdl(ddl: string): string[] {
  const openIdx = ddl.indexOf('(')
  if (openIdx === -1) return []
  // 找到匹配的右括号
  let depth = 0
  let closeIdx = -1
  for (let i = openIdx; i < ddl.length; i++) {
    if (ddl[i] === '(') depth++
    else if (ddl[i] === ')') {
      depth--
      if (depth === 0) { closeIdx = i; break }
    }
  }
  if (closeIdx === -1) return []
  const body = ddl.slice(openIdx + 1, closeIdx)
  const cols: string[] = []
  // 按顶层逗号拆分
  let depth2 = 0
  let start = 0
  for (let i = 0; i <= body.length; i++) {
    const ch = body[i]
    if (ch === '(') depth2++
    else if (ch === ')') depth2--
    else if ((ch === ',' || i === body.length) && depth2 === 0) {
      const part = body.slice(start, i).trim()
      start = i + 1
      if (!part) continue
      // 跳过约束定义行
      const firstWord = (part.match(/^\s*(\w+)/) || [])[1] || ''
      const upper = firstWord.toUpperCase()
      if (['PRIMARY', 'FOREIGN', 'CONSTRAINT', 'UNIQUE', 'INDEX', 'KEY', 'CHECK', 'FULLTEXT', 'SPATIAL'].includes(upper)) {
        continue
      }
      // 提取字段名（第一个 token，可能带引号）
      const nameMatch = part.match(/^([`"\[]?[\w$.]+[`"\]]?)\s/)
      if (nameMatch) {
        cols.push(stripQuotes(nameMatch[1]))
      }
    }
  }
  return cols
}

// 从 SQL 中提取主表名（FROM 子句）
function parseMainTableFromSql(sql: string): string | null {
  // 匹配 FROM 表名（忽略别名与子查询）
  const m = sql.match(/\bFROM\s+([`"\[]?)([\w$.]+)\1(?:\s+(?:AS\s+)?\w+)?\s*(?:,|JOIN|INNER|LEFT|RIGHT|WHERE|GROUP|ORDER|LIMIT|UNION|;|\)|$)/i)
  if (!m) return null
  return m[2].split('.').pop() || m[2]
}

// 从 SQL 中提取所有 JOIN 的表名与 ON 字段
interface JoinClause {
  table: string
  onFields: string[]
}

function parseJoins(sql: string): JoinClause[] {
  const joins: JoinClause[] = []
  // 匹配 JOIN 表 ON 条件
  const re = /\b(?:INNER|LEFT|RIGHT|FULL|CROSS)?\s*JOIN\s+([`"\[]?)([\w$.]+)\1(?:\s+(?:AS\s+)?\w+)?\s+ON\s+([^]*?)(?=\b(?:INNER|LEFT|RIGHT|FULL|CROSS)?\s*JOIN\b|\bWHERE\b|\bGROUP\b|\bORDER\b|\bLIMIT\b|\bUNION\b|;|$)/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(sql)) !== null) {
    const table = m[2].split('.').pop() || m[2]
    const onClause = m[3]
    // 从 ON 子句提取等值连接字段（field1 = field2）
    const fields = new Set<string>()
    const eqRe = /([`"\[]?[\w.]+[`"\]]?)\s*=\s*([`"\[]?[\w.]+[`"\]]?)/g
    let em: RegExpExecArray | null
    while ((em = eqRe.exec(onClause)) !== null) {
      // 取字段名（去掉表别名前缀）
      const f1 = em[1].split('.').pop() || ''
      const f2 = em[2].split('.').pop() || ''
      // 过滤掉常量（如 1=1）
      if (f1 && !/^\d+$/.test(f1)) fields.add(stripQuotes(f1))
      if (f2 && !/^\d+$/.test(f2)) fields.add(stripQuotes(f2))
    }
    joins.push({ table, onFields: Array.from(fields) })
  }
  return joins
}

// 从 SQL 中提取 WHERE 子句文本（到下一个关键字为止）
function extractWhereClause(sql: string): string {
  const startMatch = sql.match(/\bWHERE\b/i)
  if (!startMatch) return ''
  const start = startMatch.index! + startMatch[0].length
  // 找到结束位置：GROUP / ORDER / LIMIT / UNION / ; / )（顶层）
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

// 从 SQL 中提取 ORDER BY 字段
function parseOrderByFields(sql: string): string[] {
  const fields: string[] = []
  const m = sql.match(/\bORDER\s+BY\s+([^]*?)(?=\bLIMIT\b|\bUNION\b|;|$)/i)
  if (!m) return fields
  const clause = m[1]
  // 按顶层逗号拆分
  const parts = clause.split(',').map(s => s.trim()).filter(Boolean)
  for (const part of parts) {
    // 去掉 ASC / DESC
    const nameMatch = part.match(/^([`"\[]?[\w.]+[`"\]]?)/)
    if (nameMatch) {
      const f = stripQuotes(nameMatch[1].split('.').pop() || '')
      if (f) fields.push(f)
    }
  }
  return fields
}

// 提取 WHERE 等值/范围/IN 条件中的字段
interface WhereCondition {
  field: string
  operator: string // =, >, <, >=, <=, IN, LIKE
  raw: string
  hasFunction: boolean // 字段是否被函数包裹
  isOrBranch: boolean // 是否处于 OR 分支中
}

function parseWhereConditions(whereClause: string): WhereCondition[] {
  const conditions: WhereCondition[] = []
  if (!whereClause) return conditions

  // 按 AND / OR 拆分（保留 OR 标记）
  // 使用正则匹配每个条件
  // 思路：用正则提取形如 field op value 的片段
  const tokens = whereClause.split(/\b(AND|OR)\b/i)
  let isOr = false
  for (const raw of tokens) {
    const t = raw.trim()
    if (!t) continue
    if (/^AND$/i.test(t)) { isOr = false; continue }
    if (/^OR$/i.test(t)) { isOr = true; continue }

    // 尝试匹配：[函数(]field[)] op value
    // 1) field IN (...)
    let m = t.match(/^(?:([A-Z_]+)\s*\(\s*)?([`"\[]?)([\w.]+)\2\s*\)?\s*(IN)\s*\(/i)
    if (m) {
      const fn = m[1]
      const field = stripQuotes((m[3].split('.').pop() || ''))
      conditions.push({
        field,
        operator: 'IN',
        raw: t,
        hasFunction: !!fn,
        isOrBranch: isOr,
      })
      continue
    }
    // 2) field LIKE 'xxx'
    m = t.match(/^(?:([A-Z_]+)\s*\(\s*)?([`"\[]?)([\w.]+)\2\s*\)?\s*(LIKE)\s+/i)
    if (m) {
      const fn = m[1]
      const field = stripQuotes((m[3].split('.').pop() || ''))
      conditions.push({
        field,
        operator: 'LIKE',
        raw: t,
        hasFunction: !!fn,
        isOrBranch: isOr,
      })
      continue
    }
    // 3) field = > < >= <= != value
    m = t.match(/^(?:([A-Z_]+)\s*\(\s*)?([`"\[]?)([\w.]+)\2\s*\)?\s*(>=|<=|<>|!=|=|>|<)\s*/i)
    if (m) {
      const fn = m[1]
      const field = stripQuotes((m[3].split('.').pop() || ''))
      let op = m[4]
      if (op === '<>' || op === '!=') op = '!='
      conditions.push({
        field,
        operator: op,
        raw: t,
        hasFunction: !!fn,
        isOrBranch: isOr,
      })
      continue
    }
  }
  return conditions
}

// ==================== 核心分析函数 ====================

function analyze() {
  analyzed.value = true
  suggestions.value = []
  indexStatements.value = []

  const sqlRaw = sqlInput.value
  if (!sqlRaw.trim()) {
    message.warning('请输入 SQL 查询语句')
    return
  }

  // 规范化 SQL
  const sql = normalizeSql(sqlRaw)

  // 提取表名：优先从 CREATE TABLE，其次从 FROM
  let tableName = ''
  let tableColumns: string[] = []
  if (tableInput.value.trim()) {
    const tName = parseTableNameFromDdl(tableInput.value)
    if (tName) tableName = tName
    tableColumns = parseColumnsFromDdl(tableInput.value)
  }
  if (!tableName) {
    const sqlTable = parseMainTableFromSql(sql)
    if (sqlTable) tableName = sqlTable
  }

  // 1. WHERE 条件分析
  const whereClause = extractWhereClause(sql)
  const whereConditions = parseWhereConditions(whereClause)

  // 收集 WHERE 中适合建索引的字段（= / > / < / >= / <= / IN）
  const indexableFields = new Set<string>()
  for (const cond of whereConditions) {
    if (['=', '>', '<', '>=', '<=', 'IN'].includes(cond.operator)) {
      indexableFields.add(cond.field)
    }
  }
  if (indexableFields.size > 0) {
    const fields = Array.from(indexableFields)
    suggestions.value.push({
      level: 'high',
      title: 'WHERE 条件字段建议建立索引',
      fields,
      description: `WHERE 子句中使用等值 / 范围 / IN 操作的字段（${fields.join(', ')}）是过滤数据的关键，为其建立索引可显著提升查询性能。`,
      suggestion: `为这些字段创建索引；若多字段经常一起查询，可考虑建立联合索引（注意最左前缀原则）。`,
    })
  }

  // 2. JOIN ON 字段分析
  const joins = parseJoins(sql)
  const joinFields = new Set<string>()
  for (const j of joins) {
    for (const f of j.onFields) {
      joinFields.add(f)
    }
  }
  if (joinFields.size > 0) {
    const fields = Array.from(joinFields)
    suggestions.value.push({
      level: 'high',
      title: 'JOIN ON 连接字段建议建立索引',
      fields,
      description: `JOIN 的 ON 条件字段（${fields.join(', ')}）用于连接驱动表与被驱动表，缺少索引会导致全表扫描或嵌套循环性能下降。`,
      suggestion: `在 JOIN 连接字段两侧均建立索引；被驱动表的连接字段索引尤为重要。`,
    })
  }

  // 3. ORDER BY 字段分析
  const orderByFields = parseOrderByFields(sql)
  if (orderByFields.length > 0) {
    suggestions.value.push({
      level: 'medium',
      title: 'ORDER BY 排序字段建议建立索引',
      fields: orderByFields,
      description: `ORDER BY 字段（${orderByFields.join(', ')}）若已有索引，可利用索引有序性避免 filesort（文件排序），提升排序性能。`,
      suggestion: `为排序字段建立索引；若 WHERE 与 ORDER BY 同时存在，可考虑建立联合索引覆盖两者。`,
    })
  }

  // 4. LIKE '%xxx' 前导通配符警告（直接在原始 SQL 中查找 LIKE '%...'）
  const likeMatches = sqlRaw.match(/LIKE\s+'%[^']*'/gi) || []
  if (likeMatches.length > 0) {
    const likeFields = whereConditions.filter(c => c.operator === 'LIKE').map(c => c.field)
    suggestions.value.push({
      level: 'medium',
      title: "LIKE 前导通配符导致索引失效",
      fields: likeFields.length > 0 ? likeFields : ['未知字段'],
      description: `LIKE '%xxx' 形式的前导通配符无法利用 B-Tree 索引，会触发全表扫描。匹配到 ${likeMatches.length} 处：${likeMatches.slice(0, 2).join('、')}${likeMatches.length > 2 ? ' 等' : ''}。`,
      suggestion: `若必须前缀匹配，改为 LIKE 'xxx%'；若需全文检索，建议使用 FULLTEXT 索引或 Elasticsearch 等搜索引擎。`,
    })
  }

  // 5. 函数包裹字段警告
  const functionWrapped = whereConditions.filter(c => c.hasFunction)
  if (functionWrapped.length > 0) {
    const fields = functionWrapped.map(c => c.field)
    suggestions.value.push({
      level: 'medium',
      title: 'WHERE 中字段被函数包裹导致索引失效',
      fields,
      description: `WHERE 条件中对字段使用函数（如 LOWER(name)、DATE(create_time)）会使该字段上的普通索引失效，触发全表扫描。`,
      suggestion: `改为对常量做变换（如 LOWER('ABC')）；或建立函数索引（MySQL 8.0+ / PostgreSQL 支持）；或新增冗余的已变换列并建立索引。`,
    })
  }

  // 6. OR 条件警告
  const hasOr = /\bOR\b/i.test(whereClause)
  if (hasOr) {
    const orFields = whereConditions.filter(c => c.isOrBranch).map(c => c.field)
    suggestions.value.push({
      level: 'low',
      title: 'OR 条件可能导致索引失效',
      fields: orFields.length > 0 ? Array.from(new Set(orFields)) : ['OR 分支字段'],
      description: `WHERE 中使用 OR 连接条件时，若 OR 两侧字段未全部建立索引，可能退化为全表扫描。MySQL 中 OR 连接的等值条件若各自有索引，可能使用 index_merge 优化。`,
      suggestion: `确保 OR 两侧字段均建立索引；或考虑用 UNION ALL 拆分为两条查询；或改写为 IN 列表。`,
    })
  }

  // 7. SELECT * 警告（附加提示）
  if (/\bSELECT\s+\*/i.test(sql)) {
    suggestions.value.push({
      level: 'low',
      title: '避免使用 SELECT *',
      fields: ['*'],
      description: `SELECT * 会返回所有列，无法利用覆盖索引（Using index），且增加 IO 与网络传输开销。`,
      suggestion: `明确列出所需字段；为高频查询字段建立联合索引以实现覆盖索引优化。`,
    })
  }

  // 8. 唯一性低的字段警告（如果提供了表结构且能识别到枚举型字段，仅做通用提示）
  // 此处保持简单，不深入推断字段基数

  // 生成 CREATE INDEX 语句
  generateIndexStatements(tableName, tableColumns, {
    whereFields: Array.from(indexableFields),
    joinFields: Array.from(joinFields),
    orderByFields,
  })
}

// 生成 CREATE INDEX 语句
function generateIndexStatements(
  table: string,
  columns: string[],
  fields: { whereFields: string[]; joinFields: string[]; orderByFields: string[] }
) {
  if (!table) return
  const stmts: string[] = []
  const used = new Set<string>()

  // WHERE 等值字段：单独索引
  for (const f of fields.whereFields) {
    const key = `eq:${f}`
    if (used.has(key)) continue
    used.add(key)
    // 若提供了表结构字段，校验字段是否存在
    if (columns.length > 0 && !columns.includes(f)) continue
    const idxName = `idx_${table}_${f}`.toLowerCase()
    stmts.push(`CREATE INDEX ${idxName} ON ${table} (${f});`)
  }

  // JOIN 字段：单独索引
  for (const f of fields.joinFields) {
    const key = `join:${f}`
    if (used.has(key)) continue
    used.add(key)
    if (columns.length > 0 && !columns.includes(f)) continue
    const idxName = `idx_${table}_${f}`.toLowerCase()
    stmts.push(`CREATE INDEX ${idxName} ON ${table} (${f});`)
  }

  // ORDER BY 字段：单独或联合索引（这里仅生成单字段索引）
  for (const f of fields.orderByFields) {
    const key = `order:${f}`
    if (used.has(key)) continue
    used.add(key)
    if (columns.length > 0 && !columns.includes(f)) continue
    const idxName = `idx_${table}_${f}`.toLowerCase()
    stmts.push(`CREATE INDEX ${idxName} ON ${table} (${f});`)
  }

  // 若 WHERE 有多个等值字段，额外建议一个联合索引
  if (fields.whereFields.length >= 2) {
    const validFields = fields.whereFields.filter(f => columns.length === 0 || columns.includes(f))
    if (validFields.length >= 2) {
      const cols = validFields.join(', ')
      const idxName = `idx_${table}_combined`.toLowerCase()
      stmts.push(`-- 多字段联合索引（按等值查询频率排序，遵循最左前缀原则）\nCREATE INDEX ${idxName} ON ${table} (${cols});`)
    }
  }

  indexStatements.value = stmts
}

// 复制 CREATE INDEX 语句
async function copyIndexStatements() {
  if (indexStatements.value.length === 0) return
  try {
    await navigator.clipboard.writeText(indexStatements.value.join('\n\n'))
    message.success('已复制到剪贴板')
  } catch {
    message.error('复制失败，请手动复制')
  }
}

// 清空
function clearAll() {
  sqlInput.value = ''
  tableInput.value = ''
  analyzed.value = false
  suggestions.value = []
  indexStatements.value = []
}

// 加载示例
function loadExample() {
  sqlInput.value = `SELECT * FROM orders o
JOIN users u ON o.user_id = u.id
WHERE u.status = 'active' AND o.amount > 100
  OR LOWER(u.email) = 'admin@xx.com'
ORDER BY o.created_at DESC
LIMIT 20;`
  tableInput.value = `CREATE TABLE orders (
  id BIGINT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TINYINT NOT NULL,
  created_at DATETIME NOT NULL
);

CREATE TABLE users (
  id BIGINT PRIMARY KEY,
  email VARCHAR(100),
  status VARCHAR(20),
  created_at DATETIME
);`
  analyze()
}
</script>

<style scoped>
.tool-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 16px;
}

/* 卡片样式 */
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

/* 概要 */
.summary {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #555;
}

.dark .summary-item {
  color: #bbb;
}

.summary-item strong {
  color: #ff4d4f;
  font-size: 16px;
}

/* 建议项 */
.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.suggestion-item {
  padding: 12px 14px;
  border-radius: 8px;
  border-left: 4px solid #d9d9d9;
  background: #fafafa;
}

.dark .suggestion-item {
  background: #181828;
}

.suggestion-item.high {
  border-left-color: #ff4d4f;
  background: #fff1f0;
}

.dark .suggestion-item.high {
  background: #2a1a1a;
}

.suggestion-item.medium {
  border-left-color: #faad14;
  background: #fffbe6;
}

.dark .suggestion-item.medium {
  background: #2a2616;
}

.suggestion-item.low {
  border-left-color: #1890ff;
  background: #e6f7ff;
}

.dark .suggestion-item.low {
  background: #16243a;
}

.suggestion-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.suggestion-title {
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

.dark .suggestion-title {
  color: #e0e0e0;
}

.suggestion-detail {
  font-size: 13px;
  color: #555;
  line-height: 1.7;
}

.dark .suggestion-detail {
  color: #bbb;
}

.detail-row {
  margin-bottom: 4px;
}

.detail-label {
  font-weight: 500;
  color: #888;
}

.dark .detail-label {
  color: #999;
}

.field-code {
  display: inline-block;
  padding: 1px 6px;
  margin-right: 4px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 4px;
  font-family: 'Fira Code', Consolas, monospace;
  font-size: 12px;
  color: #c41d7f;
  word-break: break-all;
}

.dark .field-code {
  background: rgba(255, 255, 255, 0.1);
  color: #ff85c0;
}

.suggestion-tip {
  color: #389e0d;
}

.dark .suggestion-tip {
  color: #95de64;
}

/* 索引语句 */
.index-statements {
  border-top: 1px dashed #d9d9d9;
  padding-top: 16px;
}

.dark .index-statements {
  border-top-color: #333;
}

.index-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.index-code {
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

.dark .index-code {
  background: #0d1117;
}

.index-code code {
  white-space: pre;
}

.empty-tip {
  padding: 24px 0;
}
</style>
