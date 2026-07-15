<template>
  <div class="csv-to-json">
    <!-- 配置区域 -->
    <div class="card mb-4">
      <div class="config-title mb-2">解析选项</div>
      <div class="config-grid">
        <div class="config-item">
          <label>分隔符</label>
          <n-select
            v-model:value="delimiter"
            :options="delimiterOptions"
            size="small"
          />
        </div>
        <div class="config-item">
          <label>引号字符</label>
          <n-select
            v-model:value="quoteChar"
            :options="quoteOptions"
            size="small"
          />
        </div>
        <div class="config-item">
          <label>第一行为表头</label>
          <n-switch v-model:value="hasHeader" size="small" />
        </div>
        <div class="config-item">
          <label>自动类型推断</label>
          <n-switch v-model:value="typeInfer" size="small" />
        </div>
        <div class="config-item">
          <label>缩进</label>
          <n-select
            v-model:value="indent"
            :options="indentOptions"
            size="small"
          />
        </div>
        <div class="config-item">
          <label>输出模式</label>
          <n-select
            v-model:value="outputMode"
            :options="outputModeOptions"
            size="small"
          />
        </div>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar mb-3">
      <n-space>
        <n-upload
          :show-file-list="false"
          accept=".csv,.txt"
          @change="handleFileUpload"
        >
          <n-button size="small">导入 CSV 文件</n-button>
        </n-upload>
        <n-button size="small" @click="loadExample">加载示例</n-button>
        <n-button size="small" @click="clearAll" :disabled="!csvInput">清空</n-button>
      </n-space>
    </div>

    <!-- 输入输出区域 -->
    <div class="editor-grid">
      <div class="editor-pane">
        <div class="pane-label mb-2">CSV 输入</div>
        <n-input
          v-model:value="csvInput"
          type="textarea"
          placeholder="粘贴 CSV 内容，例如：&#10;name,age,city&#10;张三,25,北京"
          class="code-input"
          :autosize="false"
          rows="18"
        />
      </div>
      <div class="editor-pane">
        <div class="pane-header mb-2">
          <span class="pane-label">JSON 输出</span>
          <n-button
            v-if="jsonOutput"
            size="tiny"
            @click="copyJson"
          >复制</n-button>
        </div>
        <n-input
          :value="jsonOutput"
          type="textarea"
          :rows="18"
          readonly
          class="code-input"
          placeholder="转换后的 JSON 将显示在这里"
        />
      </div>
    </div>

    <!-- 状态提示 -->
    <n-alert
      v-if="errorMsg"
      type="error"
      class="mt-3"
      closable
      @close="errorMsg = ''"
    >
      {{ errorMsg }}
    </n-alert>
    <div class="stats mt-3" v-if="jsonOutput && !errorMsg">
      <n-tag size="small" type="success">✓ 转换成功</n-tag>
      <n-tag size="small" v-if="rowCount > 0">数据行：{{ rowCount }}</n-tag>
      <n-tag size="small" v-if="colCount > 0">字段数：{{ colCount }}</n-tag>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  NInput,
  NButton,
  NSelect,
  NSwitch,
  NUpload,
  NAlert,
  NTag,
  NSpace,
} from 'naive-ui'
import { useMessage } from 'naive-ui'
import type { UploadFileInfo } from 'naive-ui'

const message = useMessage()

// CSV 输入内容
const csvInput = ref('')
// JSON 输出内容
const jsonOutput = ref('')
const errorMsg = ref('')

// 配置选项
const delimiter = ref(',')
const quoteChar = ref('"')
const hasHeader = ref(true)
const typeInfer = ref(true)
const indent = ref<number | string>(2)
const outputMode = ref<'array' | 'object'>('array')

// 分隔符选项
const delimiterOptions = [
  { label: '逗号（,）', value: ',' },
  { label: '分号（;）', value: ';' },
  { label: '制表符（\\t）', value: '\t' },
  { label: '竖线（|）', value: '|' },
]

// 引号选项
const quoteOptions = [
  { label: '双引号（"）', value: '"' },
  { label: '单引号（\'）', value: "'" },
]

// 缩进选项
const indentOptions = [
  { label: '2 空格', value: 2 },
  { label: '4 空格', value: 4 },
  { label: '制表符', value: '\t' },
  { label: '压缩（无空格）', value: 0 },
]

// 输出模式选项
const outputModeOptions = [
  { label: '数组（每行为对象）', value: 'array' },
  { label: '对象（按列分组）', value: 'object' },
]

// 行数与列数
const rowCount = ref(0)
const colCount = ref(0)

// 解析 CSV 行，处理引号包裹的字段
function parseCsvLine(line: string, delim: string, quote: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  let i = 0

  while (i < line.length) {
    const char = line[i]
    if (inQuotes) {
      // 在引号内
      if (char === quote) {
        // 检查是否为转义的引号（双引号）
        if (line[i + 1] === quote) {
          current += quote
          i += 2
          continue
        }
        // 引号结束
        inQuotes = false
        i++
        continue
      }
      current += char
      i++
    } else {
      // 不在引号内
      if (char === quote) {
        inQuotes = true
        i++
        continue
      }
      if (char === delim) {
        result.push(current)
        current = ''
        i++
        continue
      }
      current += char
      i++
    }
  }
  // 推入最后一个字段
  result.push(current)
  return result
}

// 类型推断：尝试将字符串转为数字或布尔值
function inferType(value: string): any {
  if (value === '') return value
  // 布尔值
  if (value.toLowerCase() === 'true') return true
  if (value.toLowerCase() === 'false') return false
  if (value.toLowerCase() === 'null') return null
  // 数字（含负数、小数、科学计数法）
  if (/^-?\d+$/.test(value)) {
    const num = parseInt(value, 10)
    if (!isNaN(num) && isFinite(num)) return num
  }
  if (/^-?\d*\.\d+$/.test(value) || /^-?\d+\.?\d*[eE][-+]?\d+$/.test(value)) {
    const num = parseFloat(value)
    if (!isNaN(num) && isFinite(num)) return num
  }
  return value
}

// 执行 CSV 到 JSON 转换
function convert() {
  errorMsg.value = ''
  if (!csvInput.value.trim()) {
    jsonOutput.value = ''
    rowCount.value = 0
    colCount.value = 0
    return
  }

  try {
    const delim = delimiter.value
    const quote = quoteChar.value
    // 按行分割，处理不同换行符
    const lines = csvInput.value.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
    // 过滤空行
    const dataLines = lines.filter(line => line.trim() !== '')

    if (dataLines.length === 0) {
      jsonOutput.value = '[]'
      rowCount.value = 0
      colCount.value = 0
      return
    }

    // 解析所有行
    const rows = dataLines.map(line => parseCsvLine(line, delim, quote))
    colCount.value = Math.max(...rows.map(r => r.length))

    let headers: string[] = []
    let dataRows: string[][]

    if (hasHeader.value) {
      headers = rows[0]
      dataRows = rows.slice(1)
      rowCount.value = dataRows.length
    } else {
      headers = Array.from({ length: colCount.value }, (_, i) => `column_${i + 1}`)
      dataRows = rows
      rowCount.value = dataRows.length
    }

    let result: any

    if (outputMode.value === 'array') {
      // 数组模式：每行为一个对象
      result = dataRows.map(row => {
        const obj: Record<string, any> = {}
        headers.forEach((header, idx) => {
          const value = row[idx] !== undefined ? row[idx] : ''
          obj[header] = typeInfer.value ? inferType(value) : value
        })
        return obj
      })
    } else {
      // 对象模式：按列分组
      result = {}
      headers.forEach((header, idx) => {
        result[header] = dataRows.map(row => {
          const value = row[idx] !== undefined ? row[idx] : ''
          return typeInfer.value ? inferType(value) : value
        })
      })
    }

    // 格式化输出 JSON（缩进可为数字或制表符字符串）
    const indentStr: string | number = indent.value === 0 ? 0 : indent.value
    jsonOutput.value = JSON.stringify(result, null, indentStr)
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : String(e)
    jsonOutput.value = ''
  }
}

// 监听输入与配置变化，自动转换
watch(
  [csvInput, delimiter, quoteChar, hasHeader, typeInfer, indent, outputMode],
  convert,
  { immediate: true }
)

// 处理文件上传
function handleFileUpload({ file }: { file: UploadFileInfo }) {
  if (!file.file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    csvInput.value = e.target?.result as string
    message.success(`已导入文件：${file.name}`)
  }
  reader.readAsText(file.file)
}

// 加载示例
function loadExample() {
  csvInput.value = `name,age,city,active,join_date
张三,25,北京,true,2023-01-15
李四,30,上海,true,2022-11-08
王五,28,广州,false,2023-03-20
赵六,35,深圳,true,2021-06-01`
  message.success('已加载示例数据')
}

// 清空
function clearAll() {
  csvInput.value = ''
  jsonOutput.value = ''
  errorMsg.value = ''
  rowCount.value = 0
  colCount.value = 0
}

// 复制 JSON
async function copyJson() {
  if (!jsonOutput.value) return
  await navigator.clipboard.writeText(jsonOutput.value)
  message.success('已复制到剪贴板')
}
</script>

<style scoped>
.csv-to-json {
  max-width: 1000px;
  margin: 0 auto;
}

.config-title {
  font-size: 14px;
  font-weight: 600;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.config-item label {
  font-size: 13px;
  color: #666;
}

.dark .config-item label {
  color: #aaa;
}

.config-item :deep(.n-select),
.config-item :deep(.n-switch) {
  width: 100%;
}

.toolbar {
  display: flex;
  align-items: center;
}

.editor-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 768px) {
  .editor-grid {
    grid-template-columns: 1fr;
  }
}

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
}

.pane-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.code-input :deep(textarea) {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.stats {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
