<template>
  <div class="connection-string-parser">
    <n-tabs type="line" animated>
      <!-- 解析连接串 -->
      <n-tab-pane name="parse" tab="解析连接串">
        <div class="section">
          <n-input
            v-model:value="inputStr"
            type="textarea"
            placeholder="输入数据库连接字符串，例如：mysql://user:pass@host:3306/dbname"
            :rows="3"
            @keydown.enter="parse"
          />
          <div class="action-bar">
            <n-button type="primary" @click="parse">解析</n-button>
            <n-button @click="clearParse">清空</n-button>
          </div>
        </div>

        <!-- 常见示例 -->
        <div class="section">
          <div class="section-title">常见连接串示例</div>
          <n-space>
            <n-button
              v-for="ex in examples"
              :key="ex.label"
              size="small"
              @click="loadExample(ex.value)"
            >
              {{ ex.label }}
            </n-button>
          </n-space>
        </div>

        <!-- 错误提示 -->
        <n-alert v-if="parseError" type="error" class="section" :show-icon="true">
          {{ parseError }}
        </n-alert>

        <!-- 解析结果 -->
        <div v-if="parsed" class="section">
          <div class="section-title">解析结果</div>
          <table class="result-table">
            <tbody>
              <tr>
                <td class="key">协议</td>
                <td class="val">
                  <n-tag v-if="parsed.protocol" size="small" type="info">{{ parsed.protocol }}</n-tag>
                  <span v-else class="placeholder">-</span>
                </td>
              </tr>
              <tr>
                <td class="key">用户名</td>
                <td class="val">{{ parsed.username || '-' }}</td>
              </tr>
              <tr>
                <td class="key">密码</td>
                <td class="val">{{ parsed.password || '-' }}</td>
              </tr>
              <tr>
                <td class="key">主机</td>
                <td class="val">{{ parsed.host || '-' }}</td>
              </tr>
              <tr>
                <td class="key">端口</td>
                <td class="val">{{ parsed.port || '-' }}</td>
              </tr>
              <tr>
                <td class="key">数据库名</td>
                <td class="val">{{ parsed.database || '-' }}</td>
              </tr>
            </tbody>
          </table>

          <template v-if="queryData.length">
            <div class="section-title mt">查询参数</div>
            <n-data-table
              :columns="queryColumns"
              :data="queryData"
              :bordered="false"
              size="small"
            />
          </template>
        </div>
      </n-tab-pane>

      <!-- 构建连接串 -->
      <n-tab-pane name="build" tab="构建连接串">
        <div class="section">
          <n-form label-placement="left" label-width="100">
            <n-form-item label="协议">
              <n-select v-model:value="buildForm.protocol" :options="protocolOptions" />
            </n-form-item>
            <n-form-item label="用户名">
              <n-input v-model:value="buildForm.username" placeholder="用户名" />
            </n-form-item>
            <n-form-item label="密码">
              <n-input
                v-model:value="buildForm.password"
                placeholder="密码"
                type="password"
                show-password-on="click"
              />
            </n-form-item>
            <n-form-item label="主机">
              <n-input v-model:value="buildForm.host" placeholder="localhost 或 127.0.0.1" />
            </n-form-item>
            <n-form-item label="端口">
              <n-input v-model:value="buildForm.port" placeholder="留空使用默认端口" />
            </n-form-item>
            <n-form-item label="数据库名">
              <n-input v-model:value="buildForm.database" placeholder="数据库名称" />
            </n-form-item>
          </n-form>

          <!-- 查询参数 -->
          <div class="section-title">查询参数（可选）</div>
          <div class="query-builder">
            <div v-for="(item, idx) in buildForm.queryParams" :key="idx" class="query-row">
              <n-input v-model:value="item.key" placeholder="参数名" class="query-input" />
              <span class="query-eq">=</span>
              <n-input v-model:value="item.value" placeholder="参数值" class="query-input" />
              <n-button size="small" type="error" ghost @click="removeQueryParam(idx)">删除</n-button>
            </div>
            <n-button size="small" dashed @click="addQueryParam">+ 添加参数</n-button>
          </div>

          <div class="action-bar">
            <n-button type="primary" @click="build">生成连接串</n-button>
            <n-button @click="copyBuild">复制结果</n-button>
            <n-button @click="clearBuild">清空</n-button>
          </div>

          <div v-if="buildOutput" class="build-output">
            <div class="section-title">生成的连接串</div>
            <n-input :value="buildOutput" type="textarea" readonly :rows="3" />
          </div>
        </div>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  NTabs, NTabPane, NInput, NButton, NSpace, NTag, NAlert,
  NDataTable, NForm, NFormItem, NSelect, useMessage,
} from 'naive-ui'

// 解析结果数据结构
interface ParseResult {
  protocol: string
  username: string
  password: string
  host: string
  port: string
  database: string
  queryParams: Record<string, string>
}

const message = useMessage()

// ===== 解析模式 =====
const inputStr = ref('')
const parseError = ref('')
const parsed = ref<ParseResult | null>(null)

// 查询参数表格列定义
const queryColumns = [
  { title: '参数名', key: 'key' },
  { title: '参数值', key: 'value' },
]

// 查询参数表格数据
const queryData = computed(() => {
  if (!parsed.value) return []
  return Object.entries(parsed.value.queryParams).map(([key, value]) => ({ key, value }))
})

// 常见连接串示例
const examples = [
  { label: 'MySQL', value: 'mysql://root:123456@localhost:3306/mydb' },
  { label: 'PostgreSQL', value: 'postgresql://user:pass@localhost:5432/mydb?sslmode=require' },
  { label: 'MongoDB', value: 'mongodb://admin:pass@localhost:27017/testdb?authSource=admin' },
  { label: 'Redis', value: 'redis://default:password@localhost:6379/0' },
  { label: 'MSSQL', value: 'mssql://sa:Password123@localhost:1433/master' },
]

// 解析连接串核心逻辑
function parse(): void {
  parseError.value = ''
  const raw = inputStr.value.trim()
  if (!raw) {
    parseError.value = '请输入连接字符串'
    parsed.value = null
    return
  }

  let str = raw
  const result: ParseResult = {
    protocol: '', username: '', password: '', host: '',
    port: '', database: '', queryParams: {},
  }

  // 提取协议 protocol://
  const protocolMatch = str.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):\/\//)
  if (protocolMatch) {
    result.protocol = protocolMatch[1].toLowerCase()
    str = str.slice(protocolMatch[0].length)
  }

  // 分离认证部分与剩余部分（取最后一个 @，避免密码含 @ 被误切）
  const atIndex = str.lastIndexOf('@')
  let authPart = ''
  let rest = ''
  if (atIndex !== -1) {
    authPart = str.slice(0, atIndex)
    rest = str.slice(atIndex + 1)
  } else {
    rest = str
  }

  // 解析用户名密码
  if (authPart) {
    const colonIndex = authPart.indexOf(':')
    if (colonIndex !== -1) {
      result.username = safeDecode(authPart.slice(0, colonIndex))
      result.password = safeDecode(authPart.slice(colonIndex + 1))
    } else {
      result.username = safeDecode(authPart)
    }
  }

  // 分离查询参数 ?key=value&...
  const queryIndex = rest.indexOf('?')
  let hostPortDb = ''
  let queryStr = ''
  if (queryIndex !== -1) {
    hostPortDb = rest.slice(0, queryIndex)
    queryStr = rest.slice(queryIndex + 1)
  } else {
    hostPortDb = rest
  }

  // 分离主机端口与数据库名（首个 / 之前为主机端口）
  const slashIndex = hostPortDb.indexOf('/')
  if (slashIndex !== -1) {
    result.database = safeDecode(hostPortDb.slice(slashIndex + 1))
    hostPortDb = hostPortDb.slice(0, slashIndex)
  } else {
    // Redis 的 /0 形式已在上面处理；无 / 则无数据库
  }

  // 解析主机端口，兼容 IPv6 [::1]:port
  if (hostPortDb.startsWith('[')) {
    const bracketEnd = hostPortDb.indexOf(']')
    if (bracketEnd !== -1) {
      result.host = hostPortDb.slice(1, bracketEnd)
      const afterBracket = hostPortDb.slice(bracketEnd + 1)
      if (afterBracket.startsWith(':')) {
        result.port = afterBracket.slice(1)
      }
    } else {
      result.host = hostPortDb
    }
  } else {
    const colonIndex = hostPortDb.lastIndexOf(':')
    if (colonIndex !== -1) {
      result.host = hostPortDb.slice(0, colonIndex)
      result.port = hostPortDb.slice(colonIndex + 1)
    } else {
      result.host = hostPortDb
    }
  }

  // 解析查询参数
  if (queryStr) {
    for (const pair of queryStr.split('&')) {
      if (!pair) continue
      const eqIndex = pair.indexOf('=')
      if (eqIndex !== -1) {
        const key = safeDecode(pair.slice(0, eqIndex))
        const value = safeDecode(pair.slice(eqIndex + 1))
        result.queryParams[key] = value
      } else {
        result.queryParams[safeDecode(pair)] = ''
      }
    }
  }

  if (!result.host && !result.protocol) {
    parseError.value = '无法解析该连接字符串，请检查格式'
    parsed.value = null
    return
  }

  parsed.value = result
}

// URL 安全解码
function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

function loadExample(value: string): void {
  inputStr.value = value
  parse()
}

function clearParse(): void {
  inputStr.value = ''
  parsed.value = null
  parseError.value = ''
}

// ===== 构建模式 =====
interface BuildParam {
  key: string
  value: string
}

const buildForm = ref({
  protocol: 'mysql',
  username: '',
  password: '',
  host: '',
  port: '',
  database: '',
  queryParams: [] as BuildParam[],
})

const buildOutput = ref('')

const protocolOptions = [
  { label: 'mysql://', value: 'mysql' },
  { label: 'postgresql://', value: 'postgresql' },
  { label: 'postgres://', value: 'postgres' },
  { label: 'mongodb://', value: 'mongodb' },
  { label: 'redis://', value: 'redis' },
  { label: 'mssql://', value: 'mssql' },
]

function addQueryParam(): void {
  buildForm.value.queryParams.push({ key: '', value: '' })
}

function removeQueryParam(idx: number): void {
  buildForm.value.queryParams.splice(idx, 1)
}

// 反向构建连接串
function build(): void {
  const f = buildForm.value
  let str = ''
  if (f.protocol) str += f.protocol + '://'
  if (f.username) {
    str += encodeURIComponent(f.username)
    if (f.password) str += ':' + encodeURIComponent(f.password)
    str += '@'
  }
  // 主机含冒号（IPv6）需加方括号
  if (f.host.includes(':')) {
    str += '[' + f.host + ']'
  } else {
    str += f.host
  }
  if (f.port) str += ':' + f.port
  if (f.database) str += '/' + encodeURIComponent(f.database)
  const validParams = f.queryParams.filter(p => p.key)
  if (validParams.length) {
    str += '?' + validParams
      .map(p => encodeURIComponent(p.key) + '=' + encodeURIComponent(p.value))
      .join('&')
  }
  buildOutput.value = str
  message.success('已生成连接串')
}

function copyBuild(): void {
  if (!buildOutput.value) {
    message.warning('请先生成连接串')
    return
  }
  navigator.clipboard.writeText(buildOutput.value)
  message.success('已复制到剪贴板')
}

function clearBuild(): void {
  buildForm.value = {
    protocol: 'mysql',
    username: '', password: '', host: '', port: '',
    database: '', queryParams: [],
  }
  buildOutput.value = ''
}
</script>

<style scoped>
.connection-string-parser {
  max-width: 1000px;
  margin: 0 auto;
}

.section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #666;
  margin-bottom: 10px;
}

.section-title.mt {
  margin-top: 20px;
}

.action-bar {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}

/* 解析结果表格 */
.result-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  overflow: hidden;
}

.result-table td {
  padding: 10px 14px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
}

.result-table tr:last-child td {
  border-bottom: none;
}

.result-table .key {
  width: 120px;
  background: #fafafa;
  color: #888;
  font-weight: 500;
}

.result-table .val {
  color: #333;
  word-break: break-all;
}

.placeholder {
  color: #bbb;
}

/* 构建模式查询参数 */
.query-builder {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}

.query-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.query-input {
  flex: 1;
}

.query-eq {
  color: #999;
  font-weight: 600;
}

.build-output {
  margin-top: 20px;
}

/* 深色模式适配 */
.dark .section-title {
  color: #aaa;
}

.dark .result-table {
  border-color: #2a2a4a;
}

.dark .result-table td {
  border-bottom-color: #2a2a4a;
}

.dark .result-table .key {
  background: #1f1f3a;
  color: #999;
}

.dark .result-table .val {
  color: #e0e0e0;
}

.dark .query-eq {
  color: #666;
}
</style>
