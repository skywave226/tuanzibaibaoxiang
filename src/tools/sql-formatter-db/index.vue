<template>
  <div class="sql-formatter-db">
    <div class="toolbar">
      <n-space wrap>
        <n-select
          v-model:value="dialect"
          :options="dialectOptions"
          style="width: 180px"
          size="small"
        />
        <n-select
          v-model:value="indentSize"
          :options="indentOptions"
          style="width: 130px"
          size="small"
        />
        <n-select
          v-model:value="keywordCase"
          :options="keywordCaseOptions"
          style="width: 130px"
          size="small"
        />
      </n-space>
      <n-space>
        <n-button type="primary" @click="format">格式化</n-button>
        <n-button @click="compress">压缩</n-button>
        <n-button @click="loadExample">示例</n-button>
        <n-button @click="copy" :disabled="!output">复制</n-button>
        <n-button @click="clear" :disabled="!input && !output">清空</n-button>
      </n-space>
    </div>

    <div class="editor-area">
      <div class="editor-pane">
        <div class="pane-label">SQL 输入</div>
        <n-input
          v-model:value="input"
          type="textarea"
          placeholder="请输入要格式化的 SQL 语句..."
          :rows="16"
          :autosize="false"
          class="code-input"
        />
      </div>
      <div class="editor-pane">
        <div class="pane-label">格式化结果</div>
        <n-input
          :value="output"
          type="textarea"
          readonly
          :rows="16"
          :autosize="false"
          placeholder="格式化后的 SQL 将显示在此处..."
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
    <n-alert type="success" v-if="output" class="mt-3" :show-icon="false">
      已格式化 · {{ stats.lines }} 行 · {{ stats.chars }} 字符 · 方言：{{ dialectLabel }}
    </n-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NButton, NSpace, NInput, NSelect, NAlert, useMessage } from 'naive-ui'

const message = useMessage()
const input = ref('')
const output = ref('')
const errorMsg = ref('')
const dialect = ref<string>('mysql')
const indentSize = ref<number>(2)
const keywordCase = ref<string>('upper')

// 方言选项
const dialectOptions = [
  { label: 'MySQL', value: 'mysql' },
  { label: 'PostgreSQL', value: 'postgresql' },
  { label: 'SQL Server', value: 'sqlserver' },
]
const indentOptions = [
  { label: '缩进 2 空格', value: 2 },
  { label: '缩进 4 空格', value: 4 },
]
const keywordCaseOptions = [
  { label: '关键字大写', value: 'upper' },
  { label: '关键字小写', value: 'lower' },
]

const dialectLabel = computed(
  () => dialectOptions.find((d) => d.value === dialect.value)?.label || ''
)

const stats = computed(() => ({
  lines: output.value ? output.value.split('\n').length : 0,
  chars: output.value.length,
}))

// 示例 SQL
const exampleSql = `select u.id, u.name, u.email, o.order_no, o.amount
from users u
left join orders o on o.user_id = u.id
where u.status = 'active' and o.amount > 100
group by u.id, u.name, u.email
having sum(o.amount) > 500
order by o.amount desc limit 10;

insert into users (name, email, status, created_at) values ('Tom', 'tom@example.com', 'active', now());

update users set status = 'inactive', updated_at = now() where last_login < '2023-01-01';

delete from users where status = 'deleted';`

// ==================== SQL 关键字集合 ====================

// 通用关键字（用于大写化识别）
const COMMON_KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'CROSS',
  'OUTER', 'NATURAL', 'ON', 'USING', 'AS', 'AND', 'OR', 'NOT', 'IN', 'IS',
  'NULL', 'BETWEEN', 'LIKE', 'EXISTS', 'GROUP', 'BY', 'HAVING', 'ORDER', 'ASC',
  'DESC', 'LIMIT', 'OFFSET', 'UNION', 'ALL', 'INTERSECT', 'EXCEPT', 'INSERT',
  'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'INDEX',
  'DATABASE', 'VIEW', 'ALTER', 'ADD', 'DROP', 'PRIMARY', 'KEY', 'FOREIGN',
  'REFERENCES', 'CONSTRAINT', 'UNIQUE', 'DEFAULT', 'CHECK', 'WITH', 'RECURSIVE',
  'RETURNING', 'DISTINCT', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'IF', 'EXISTS',
  'AUTO_INCREMENT', 'AUTOINCREMENT', 'CASCADE', 'RESTRICT', 'TEMP', 'TEMPORARY',
  'SCHEMA', 'TRIGGER', 'PROCEDURE', 'FUNCTION', 'BEGIN', 'COMMIT', 'ROLLBACK',
  'TRANSACTION', 'GRANT', 'REVOKE', 'PRIVILEGES', 'PUBLIC', 'CAST', 'CONVERT',
  'CURRENT_DATE', 'CURRENT_TIME', 'CURRENT_TIMESTAMP', 'NOW', 'TRUE', 'FALSE',
  'TOP', 'ROWNUM', 'OFFSET', 'FETCH', 'NEXT', 'ROWS', 'ONLY', 'PARTITION',
  'OVER', 'WINDOW', 'PRECEDING', 'FOLLOWING', 'UNBOUNDED', 'RANGE', 'ROWS',
  'IDENTITY', 'COLLATE', 'COLLATION', 'ENGINE', 'CHARSET', 'CHARACTER',
  'IF EXISTS', 'IF NOT EXISTS',
])

// PostgreSQL 特有关键字
const PG_KEYWORDS = new Set([
  'SERIAL', 'BIGSERIAL', 'SMALLSERIAL', 'RETURNING', 'ARRAY', 'HSTORE',
  'JSONB', 'INTERVAL', 'TIMESTAMPTZ', 'TIMETZ', 'UUID', 'CIDR', 'INET',
  'MACADDR', 'TSVECTOR', 'TSQUERY', 'CUBE', 'LTREE', 'MONEY', 'BIT',
  'BYTEA', 'POINT', 'LINE', 'LSEG', 'BOX', 'PATH', 'POLYGON', 'CIRCLE',
  'SEQUENCE', 'OWNED', 'GENERATED', 'STORED', 'VIRTUAL', 'ENCODE', 'DECODE',
  'ILIKE', 'SIMILAR', 'CONFLICT', 'DO', 'NOTHING', 'LOCK', 'SHARE',
  'ACCESS', 'EXCLUSIVE', 'ANALYZE', 'VACUUM', 'REINDEX', 'CLUSTER',
  'EXPLAIN', 'ANALYZE', 'VERBOSE', 'FORMAT', 'TEXT', 'XML',
])

// MySQL 特有关键字
const MYSQL_KEYWORDS = new Set([
  'AUTO_INCREMENT', 'UNSIGNED', 'ZEROFILL', 'BINARY', 'VARBINARY', 'ENUM',
  'SET', 'TINYTEXT', 'MEDIUMTEXT', 'LONGTEXT', 'TINYINT', 'SMALLINT',
  'MEDIUMINT', 'BIGINT', 'INT', 'INTEGER', 'DECIMAL', 'NUMERIC', 'FLOAT',
  'DOUBLE', 'BIT', 'DATETIME', 'TIMESTAMP', 'DATE', 'TIME', 'YEAR',
  'CHAR', 'VARCHAR', 'BLOB', 'TINYBLOB', 'MEDIUMBLOB', 'LONGBLOB',
  'ENGINE', 'CHARSET', 'COLLATE', 'COLLATION', 'DEFAULT', 'COMMENT',
  'LOCK', 'UNLOCK', 'DUAL', 'LIMIT', 'OFFSET', 'SQL_CALC_FOUND_ROWS',
  'SQL_NO_CACHE', 'SQL_CACHE', 'STRAIGHT_JOIN', 'HIGH_PRIORITY',
  'LOW_PRIORITY', 'DELAYED', 'IGNORE', 'REPLACE', 'DUPLICATE', 'KEY',
  'UPDATE', 'ON', 'DUPLICATE', 'VALUES',
])

// SQL Server 特有关键字
const SQLSERVER_KEYWORDS = new Set([
  'TOP', 'IDENTITY', 'ROWGUIDCOL', 'NCHAR', 'NVARCHAR', 'NTEXT', 'IMAGE',
  'MONEY', 'SMALLMONEY', 'DATETIME2', 'DATETIMEOFFSET', 'DATE', 'TIME',
  'ROWVERSION', 'TIMESTAMP', 'MERGE', 'OUTPUT', 'INTO', 'PIVOT', 'UNPIVOT',
  'TABLESAMPLE', 'APPLY', 'CROSS', 'OUTER', 'TRY_CONVERT', 'TRY_CAST',
  'OFFSET', 'FETCH', 'NEXT', 'ROWS', 'ONLY', 'WITH', 'TIES', 'NOLOCK',
  'READPAST', 'ROWLOCK', 'UPDLOCK', 'HOLDLOCK', 'TABLOCK', 'TABLOCKX',
  'XLOCK', 'SET', 'NOCOUNT', 'TRAN', 'TRANSACTION', 'XACT', 'SPARSE',
  'FILESTREAM', 'FILTERED', 'PERSISTED', 'NOT',
])

// 组合子句关键字（按最长优先匹配）
const COMPOUND_KEYWORDS: string[] = [
  // 3 词组合
  'CREATE UNIQUE INDEX',
  'LEFT OUTER JOIN',
  'RIGHT OUTER JOIN',
  'FULL OUTER JOIN',
  'NATURAL LEFT JOIN',
  'NATURAL RIGHT JOIN',
  'IS NOT NULL',
  'IF NOT EXISTS',
  // 2 词组合
  'GROUP BY',
  'ORDER BY',
  'INSERT INTO',
  'DELETE FROM',
  'UNION ALL',
  'INNER JOIN',
  'LEFT JOIN',
  'RIGHT JOIN',
  'FULL JOIN',
  'CROSS JOIN',
  'NATURAL JOIN',
  'PRIMARY KEY',
  'FOREIGN KEY',
  'CREATE TABLE',
  'CREATE INDEX',
  'CREATE VIEW',
  'CREATE DATABASE',
  'ALTER TABLE',
  'IS NULL',
  'NOT NULL',
  'IF EXISTS',
  'UNION ALL',
  'ON CONFLICT',
  'MERGE INTO',
  'CREATE TEMPORARY TABLE',
  'CREATE GLOBAL TEMPORARY TABLE',
]

// 需要换行（处于语句基线）的主要子句
const CLAUSE_NEWLINE = new Set([
  'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT',
  'OFFSET', 'UNION', 'UNION ALL', 'INTERSECT', 'EXCEPT', 'INSERT INTO',
  'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'CREATE TABLE', 'CREATE INDEX',
  'CREATE UNIQUE INDEX', 'CREATE VIEW', 'CREATE DATABASE', 'ALTER TABLE',
  'CREATE TEMPORARY TABLE', 'CREATE GLOBAL TEMPORARY TABLE',
  'WITH', 'RETURNING', 'INTO', 'ON CONFLICT', 'MERGE INTO',
])

// JOIN 类关键字（换行，与基线对齐）
const JOIN_KEYWORDS = new Set([
  'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'CROSS JOIN',
  'NATURAL JOIN', 'NATURAL LEFT JOIN', 'NATURAL RIGHT JOIN',
  'LEFT OUTER JOIN', 'RIGHT OUTER JOIN', 'FULL OUTER JOIN',
])

// 获取当前方言的关键字集合
function getDialectKeywords(): Set<string> {
  const set = new Set(COMMON_KEYWORDS)
  if (dialect.value === 'postgresql') {
    PG_KEYWORDS.forEach((k) => set.add(k))
  } else if (dialect.value === 'mysql') {
    MYSQL_KEYWORDS.forEach((k) => set.add(k))
  } else if (dialect.value === 'sqlserver') {
    SQLSERVER_KEYWORDS.forEach((k) => set.add(k))
  }
  return set
}

// ==================== 词法分析 ====================

type TokenType = 'string' | 'comment' | 'punct' | 'whitespace' | 'word'
interface Token {
  type: TokenType
  value: string
}

// 将 SQL 拆分为 token，保留字符串与注释原样
function tokenize(sql: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  const len = sql.length
  while (i < len) {
    const ch = sql[i]
    // 空白字符
    if (/\s/.test(ch)) {
      let j = i
      while (j < len && /\s/.test(sql[j])) j++
      tokens.push({ type: 'whitespace', value: sql.slice(i, j) })
      i = j
      continue
    }
    // 行注释 --
    if (ch === '-' && sql[i + 1] === '-') {
      let j = i
      while (j < len && sql[j] !== '\n') j++
      tokens.push({ type: 'comment', value: sql.slice(i, j) })
      i = j
      continue
    }
    // 块注释 /* */
    if (ch === '/' && sql[i + 1] === '*') {
      let j = i + 2
      while (j < len && !(sql[j] === '*' && sql[j + 1] === '/')) j++
      j = Math.min(j + 2, len)
      tokens.push({ type: 'comment', value: sql.slice(i, j) })
      i = j
      continue
    }
    // 字符串字面量（单引号、双引号、反引号）
    if (ch === "'" || ch === '"' || ch === '`') {
      const quote = ch
      let j = i + 1
      while (j < len) {
        if (sql[j] === quote) {
          // 处理转义（引号重复）
          if (sql[j + 1] === quote) {
            j += 2
            continue
          }
          j++
          break
        }
        // 反斜杠转义
        if (sql[j] === '\\') {
          j += 2
          continue
        }
        j++
      }
      tokens.push({ type: 'string', value: sql.slice(i, j) })
      i = j
      continue
    }
    // 标点与运算符
    if ('(),;.'.includes(ch)) {
      tokens.push({ type: 'punct', value: ch })
      i++
      continue
    }
    // 运算符（多字符）
    if (/[=<>!+\-*/%&|^~]/.test(ch)) {
      let j = i
      while (j < len && /[=<>!+\-*/%&|^~]/.test(sql[j])) j++
      tokens.push({ type: 'punct', value: sql.slice(i, j) })
      i = j
      continue
    }
    // 标识符 / 关键字 / 数字
    if (/[a-zA-Z0-9_$@#]/.test(ch)) {
      let j = i
      while (j < len && /[a-zA-Z0-9_$#@.\-]/.test(sql[j])) j++
      tokens.push({ type: 'word', value: sql.slice(i, j) })
      i = j
      continue
    }
    // 其他
    tokens.push({ type: 'punct', value: ch })
    i++
  }
  return tokens
}

// 跳过空白获取下一个非空白 token
function nextNonWs(tokens: Token[], idx: number): Token | null {
  for (let k = idx; k < tokens.length; k++) {
    if (tokens[k].type !== 'whitespace') return tokens[k]
  }
  return null
}

// 尝试匹配组合关键字，返回 { keyword, endIdx }
function matchCompound(
  tokens: Token[],
  idx: number
): { keyword: string; endIdx: number } | null {
  // 收集从 idx 开始的连续 word token（跳过空白）
  const words: { value: string; tokenIdx: number }[] = []
  let k = idx
  while (k < tokens.length && words.length < 4) {
    const t = tokens[k]
    if (t.type === 'whitespace') {
      // 单个空白分隔允许，连续空白也允许
      k++
      continue
    }
    if (t.type === 'word') {
      words.push({ value: t.value.toUpperCase(), tokenIdx: k })
      k++
      continue
    }
    break
  }
  if (words.length === 0) return null
  // 从最长到最短尝试匹配
  for (let n = Math.min(words.length, 4); n >= 2; n--) {
    const candidate = words.slice(0, n).map((w) => w.value).join(' ')
    if (COMPOUND_KEYWORDS.includes(candidate)) {
      return { keyword: candidate, endIdx: words[n - 1].tokenIdx + 1 }
    }
  }
  return null
}

// ==================== 格式化 ====================

function indentStr(level: number): string {
  return ' '.repeat(level * indentSize.value)
}

function formatKeyword(word: string, keywords: Set<string>): string {
  const up = word.toUpperCase()
  if (keywords.has(up)) {
    return keywordCase.value === 'upper' ? up : up.toLowerCase()
  }
  return word
}

function formatSql(): string {
  const tokens = tokenize(input.value)
  if (tokens.length === 0) return ''
  const keywords = getDialectKeywords()

  const lines: string[] = []
  let currentLine = ''
  let parenDepth = 0
  // 括号上下文栈：'function' 表示函数调用（抑制逗号换行），'group' 表示分组（允许逗号换行）
  const parenStack: ('function' | 'group')[] = []

  // 上一个有意义的 token 类型，用于判断函数调用
  let lastMeaningful: Token | null = null

  const pushLine = () => {
    lines.push(currentLine.replace(/\s+$/, ''))
    currentLine = ''
  }

  const append = (text: string) => {
    currentLine += text
  }

  let i = 0
  const n = tokens.length
  while (i < n) {
    const token = tokens[i]

    if (token.type === 'whitespace') {
      i++
      continue
    }

    if (token.type === 'comment') {
      // 注释独占一行
      if (currentLine.trim()) pushLine()
      append(token.value)
      pushLine()
      lastMeaningful = token
      i++
      continue
    }

    if (token.type === 'string') {
      append((currentLine && !/[([{]$/.test(currentLine) ? ' ' : '') + token.value)
      lastMeaningful = token
      i++
      continue
    }

    if (token.type === 'punct') {
      const v = token.value
      if (v === '(') {
        // 判断是函数调用还是分组
        const isFunction =
          lastMeaningful !== null &&
          lastMeaningful.type === 'word' &&
          !keywords.has(lastMeaningful.value.toUpperCase())
        parenStack.push(isFunction ? 'function' : 'group')
        parenDepth++
        append('(')
        lastMeaningful = token
        i++
        continue
      }
      if (v === ')') {
        if (parenStack.length > 0) {
          parenStack.pop()
        }
        parenDepth = Math.max(0, parenDepth - 1)
        // 移除行尾可能的多余空格
        currentLine = currentLine.replace(/\s+$/, '')
        append(')')
        lastMeaningful = token
        i++
        continue
      }
      if (v === ',') {
        // 逗号后换行+缩进（函数调用内部不换行）
        const inFunction = parenStack.length > 0 && parenStack[parenStack.length - 1] === 'function'
        append(',')
        if (inFunction) {
          // 函数参数：逗号后加空格，不换行
          append(' ')
        } else {
          pushLine()
          append(indentStr(parenDepth + 1))
        }
        lastMeaningful = token
        i++
        continue
      }
      if (v === ';') {
        append(';')
        pushLine()
        // 语句之间空一行
        if (nextNonWs(tokens, i + 1)) pushLine()
        lastMeaningful = token
        i++
        continue
      }
      if (v === '.') {
        // 成员访问，无空格
        append('.')
        lastMeaningful = token
        i++
        continue
      }
      // 其他运算符
      const needSpace = /[+\-*/%=<>!&|^~]/.test(v) && !/[(.[{]$/.test(currentLine)
      append((needSpace ? ' ' : '') + v)
      lastMeaningful = token
      i++
      continue
    }

    // word token
    // 尝试匹配组合关键字
    const compound = matchCompound(tokens, i)
    if (compound) {
      const kw = compound.keyword
      const isJoin = JOIN_KEYWORDS.has(kw)
      const isClause = CLAUSE_NEWLINE.has(kw)

      if (isClause || isJoin) {
        // 主要子句或 JOIN：换行 + 当前基线缩进
        if (currentLine.trim()) pushLine()
        append(indentStr(parenDepth) + formatKeyword(kw, keywords))
      } else {
        // 其他组合关键字（PRIMARY KEY 等）保持行内
        append((currentLine && !/[(.\s]$/.test(currentLine) ? ' ' : '') + formatKeyword(kw, keywords))
      }
      lastMeaningful = { type: 'word', value: kw }
      i = compound.endIdx
      continue
    }

    // 单个 word
    const up = token.value.toUpperCase()
    // ON / AND / OR 等连接词保持行内
    if (up === 'ON' || up === 'AND' || up === 'OR') {
      append(' ' + formatKeyword(token.value, keywords))
      lastMeaningful = token
      i++
      continue
    }
    // 主要子句或 JOIN（单个关键字）：换行 + 基线缩进
    if (CLAUSE_NEWLINE.has(up) || JOIN_KEYWORDS.has(up)) {
      if (currentLine.trim()) pushLine()
      append(indentStr(parenDepth) + formatKeyword(token.value, keywords))
      lastMeaningful = token
      i++
      continue
    }
    // 普通单词
    const formatted = formatKeyword(token.value, keywords)
    const needSpace =
      currentLine !== '' &&
      !/[(.\s]$/.test(currentLine) &&
      !/^[,;)]/.test(formatted)
    append((needSpace ? ' ' : '') + formatted)
    lastMeaningful = token
    i++
  }

  if (currentLine.trim()) pushLine()
  return lines.join('\n')
}

// ==================== 操作函数 ====================

function format() {
  errorMsg.value = ''
  if (!input.value.trim()) {
    errorMsg.value = '请输入 SQL 语句'
    output.value = ''
    return
  }
  try {
    output.value = formatSql()
    if (!output.value.trim()) {
      errorMsg.value = '格式化结果为空，请检查输入'
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    errorMsg.value = '格式化失败：' + msg
    output.value = ''
  }
}

// 压缩为单行
function compress() {
  errorMsg.value = ''
  if (!input.value.trim()) {
    errorMsg.value = '请输入 SQL 语句'
    output.value = ''
    return
  }
  try {
    const tokens = tokenize(input.value)
    const keywords = getDialectKeywords()
    let compressed = ''
    for (const t of tokens) {
      if (t.type === 'whitespace') {
        // 多个空白压缩为单空格
        if (compressed && !/[(.[\s]$/.test(compressed)) compressed += ' '
        continue
      }
      if (t.type === 'word') {
        compressed += formatKeyword(t.value, keywords)
      } else if (t.type === 'string' || t.type === 'comment') {
        compressed += t.value
      } else {
        // 标点：逗号后加空格
        compressed += t.value
        if (t.value === ',') compressed += ' '
      }
    }
    output.value = compressed.replace(/\s+/g, ' ').replace(/\s*,\s*/g, ', ').replace(/\s*;\s*/g, '; ').trim()
    if (output.value && !output.value.endsWith(';')) output.value += ';'
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    errorMsg.value = '压缩失败：' + msg
  }
}

function loadExample() {
  input.value = exampleSql
  errorMsg.value = ''
  format()
}

function copy() {
  if (!output.value) return
  navigator.clipboard.writeText(output.value).then(() => {
    message.success('已复制到剪贴板')
  }).catch(() => {
    message.error('复制失败，请手动复制')
  })
}

function clear() {
  input.value = ''
  output.value = ''
  errorMsg.value = ''
}
</script>

<style scoped>
.sql-formatter-db {
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

.mt-3 {
  margin-top: 12px;
}

.mt-4 {
  margin-top: 16px;
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
