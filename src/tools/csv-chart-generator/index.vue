<template>
  <div class="csv-chart-generator">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <n-space>
        <n-button type="primary" @click="renderChart">生成图表</n-button>
        <n-button @click="loadExample">示例</n-button>
        <n-button @click="clearAll">清空</n-button>
        <n-button :disabled="!canExport" @click="exportPng">导出 PNG</n-button>
      </n-space>
      <n-tag v-if="errorMsg" type="error">{{ errorMsg }}</n-tag>
      <n-tag v-else-if="headers.length > 0" type="success">{{ rowCount }} 行数据</n-tag>
    </div>

    <!-- CSV 输入区 -->
    <div class="input-section">
      <div class="pane-label">CSV 输入（首行为表头）</div>
      <n-input
        v-model:value="csvInput"
        type="textarea"
        placeholder="输入 CSV 数据，例如：&#10;month,sales,cost&#10;Jan,100,80&#10;Feb,150,120"
        class="code-input"
        :autosize="false"
        rows="8"
      />
    </div>

    <!-- 配置区 -->
    <div class="config-section" v-if="headers.length > 0">
      <div class="pane-label">图表配置</div>
      <div class="config-grid">
        <div class="config-item">
          <span class="config-label">图表类型</span>
          <n-select v-model:value="chartType" :options="chartTypeOptions" />
        </div>
        <div class="config-item">
          <span class="config-label">X 轴列</span>
          <n-select v-model:value="xColumn" :options="columnOptions" />
        </div>
        <div class="config-item">
          <span class="config-label">Y 轴列（可多选）</span>
          <n-select
            v-model:value="yColumns"
            multiple
            :options="numericColumnOptions"
            placeholder="选择数值列"
          />
        </div>
        <div class="config-item">
          <span class="config-label">图表标题</span>
          <n-input v-model:value="chartTitle" placeholder="输入图表标题" />
        </div>
      </div>
    </div>

    <!-- Canvas 图表展示 -->
    <div class="chart-section" v-if="headers.length > 0">
      <div class="pane-label">图表预览</div>
      <div class="canvas-wrapper">
        <canvas ref="canvasRef" width="900" height="500"></canvas>
      </div>
    </div>

    <n-empty v-else description="输入 CSV 数据并点击生成图表" class="mt-4" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import { NButton, NSpace, NInput, NTag, NSelect, NEmpty, useMessage } from 'naive-ui'

const message = useMessage()
const csvInput = ref('')
const errorMsg = ref('')
const headers = ref<string[]>([])
const rows = ref<string[][]>([])
const chartType = ref<'bar' | 'line' | 'pie'>('bar')
const xColumn = ref<string>('')
const yColumns = ref<string[]>([])
const chartTitle = ref('')
const canvasRef = ref<HTMLCanvasElement | null>(null)
const canExport = ref(false)

const chartTypeOptions = [
  { label: '柱状图', value: 'bar' },
  { label: '折线图', value: 'line' },
  { label: '饼图', value: 'pie' },
]

// 行数
const rowCount = computed(() => rows.value.length)

// 列选项
const columnOptions = computed(() =>
  headers.value.map(h => ({ label: h, value: h }))
)

// 数值列选项（仅显示包含数值数据的列）
const numericColumnOptions = computed(() => {
  return headers.value
    .map((h, idx) => {
      // 检查该列是否含数值
      const numericCount = rows.value.filter(r => {
        const v = r[idx]
        return v !== undefined && v !== '' && !isNaN(Number(v))
      }).length
      return { label: `${h}${numericCount === 0 ? '（无数值）' : ''}`, value: h, disabled: numericCount === 0 }
    })
})

// 解析 CSV（简易版，支持引号包裹的字段）
function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '"') {
      inQuotes = !inQuotes
      cur += ch
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && text[i + 1] === '\n') i++
      if (cur.length > 0) lines.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  if (cur.length > 0) lines.push(cur)

  const splitLine = (line: string): string[] => {
    const result: string[] = []
    let field = ''
    let inQ = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') { field += '"'; i++ }
        else inQ = !inQ
      } else if (ch === ',' && !inQ) {
        result.push(field)
        field = ''
      } else {
        field += ch
      }
    }
    result.push(field)
    return result.map(s => s.trim())
  }

  if (lines.length === 0) return { headers: [], rows: [] }
  const hdrs = splitLine(lines[0])
  const dataRows = lines.slice(1).map(splitLine)
  return { headers: hdrs, rows: dataRows }
}

// 生成图表
function renderChart(): void {
  errorMsg.value = ''
  if (!csvInput.value.trim()) {
    errorMsg.value = '请输入 CSV 数据'
    return
  }
  const parsed = parseCSV(csvInput.value)
  if (parsed.headers.length === 0) {
    errorMsg.value = 'CSV 解析失败'
    return
  }
  headers.value = parsed.headers
  rows.value = parsed.rows

  // 默认选择第一列为 X，第一数值列为 Y
  if (!xColumn.value || !headers.value.includes(xColumn.value)) {
    xColumn.value = headers.value[0]
  }
  if (yColumns.value.length === 0) {
    const firstNumeric = headers.value.find((_h, idx) =>
      rows.value.some(r => {
        const v = r[idx]
        return v !== undefined && v !== '' && !isNaN(Number(v))
      })
    )
    if (firstNumeric) yColumns.value = [firstNumeric]
  }
  if (yColumns.value.length === 0) {
    errorMsg.value = '未找到可用的数值列'
    return
  }

  nextTick(() => drawChart())
  message.success('图表已生成')
}

// 绘制图表
function drawChart(): void {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  const isDark = document.documentElement.classList.contains('dark')
  const textColor = isDark ? '#cdd6f4' : '#333'
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'

  // 准备数据
  const xIdx = headers.value.indexOf(xColumn.value)
  const yIdxs = yColumns.value.map(c => headers.value.indexOf(c))
  if (xIdx < 0 || yIdxs.some(i => i < 0)) return

  const labels = rows.value.map(r => r[xIdx] || '')
  const series = yIdxs.map((yi, si) => ({
    name: yColumns.value[si],
    data: rows.value.map(r => Number(r[yi]) || 0),
  }))

  const padL = 60, padR = 30, padT = 50, padB = 60
  const W = canvas.width
  const H = canvas.height
  const chartW = W - padL - padR
  const chartH = H - padT - padB

  // 标题
  if (chartTitle.value) {
    ctx.fillStyle = textColor
    ctx.font = 'bold 18px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(chartTitle.value, W / 2, 24)
  }

  if (chartType.value === 'pie') {
    drawPie(ctx, labels, series, padL, padT, chartW, chartH, textColor)
  } else {
    // 计算最大值
    let maxVal = 0
    series.forEach(s => s.data.forEach(v => { if (v > maxVal) maxVal = v }))
    if (maxVal === 0) maxVal = 1
    const niceMax = niceNumber(maxVal)

    // 绘制网格和 Y 轴
    ctx.strokeStyle = gridColor
    ctx.fillStyle = textColor
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'right'
    const ySteps = 5
    for (let i = 0; i <= ySteps; i++) {
      const y = padT + chartH - (i / ySteps) * chartH
      ctx.beginPath()
      ctx.moveTo(padL, y)
      ctx.lineTo(padL + chartW, y)
      ctx.stroke()
      const val = (i / ySteps) * niceMax
      ctx.fillText(val.toFixed(0), padL - 6, y + 3)
    }

    // X 轴标签
    ctx.textAlign = 'center'
    const n = labels.length
    if (chartType.value === 'bar') {
      // 柱状图分组
      const groupW = chartW / n
      const barW = Math.min(20, (groupW * 0.7) / series.length)
      const colors = ['#5b8ff9', '#5ad8a6', '#f6bd16', '#e86452', '#6dc8ec']
      series.forEach((s, si) => {
        ctx.fillStyle = colors[si % colors.length]
        s.data.forEach((v, i) => {
          const x = padL + i * groupW + groupW / 2 + (si - (series.length - 1) / 2) * (barW + 2) - barW / 2
          const h = (v / niceMax) * chartH
          const y = padT + chartH - h
          ctx.fillRect(x, y, barW, h)
        })
        // 图例
        ctx.fillRect(padL + chartW + 6, padT + si * 18, 12, 12)
        ctx.fillStyle = textColor
        ctx.textAlign = 'left'
        ctx.fillText(s.name, padL + chartW + 22, padT + si * 18 + 10)
        ctx.fillStyle = colors[si % colors.length]
      })
    } else {
      // 折线图
      const stepX = n > 1 ? chartW / (n - 1) : chartW
      const colors = ['#5b8ff9', '#5ad8a6', '#f6bd16', '#e86452', '#6dc8ec']
      series.forEach((s, si) => {
        ctx.strokeStyle = colors[si % colors.length]
        ctx.fillStyle = colors[si % colors.length]
        ctx.lineWidth = 2
        ctx.beginPath()
        s.data.forEach((v, i) => {
          const x = padL + i * stepX
          const y = padT + chartH - (v / niceMax) * chartH
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        })
        ctx.stroke()
        // 数据点
        s.data.forEach((v, i) => {
          const x = padL + i * stepX
          const y = padT + chartH - (v / niceMax) * chartH
          ctx.beginPath()
          ctx.arc(x, y, 3, 0, Math.PI * 2)
          ctx.fill()
        })
        // 图例
        ctx.fillRect(padL + chartW + 6, padT + si * 18, 12, 12)
        ctx.fillStyle = textColor
        ctx.textAlign = 'left'
        ctx.fillText(s.name, padL + chartW + 22, padT + si * 18 + 10)
        ctx.strokeStyle = colors[si % colors.length]
        ctx.fillStyle = colors[si % colors.length]
      })
    }

    // X 轴刻度标签
    ctx.fillStyle = textColor
    ctx.textAlign = 'center'
    ctx.font = '11px sans-serif'
    const labelStep = Math.max(1, Math.ceil(n / 12))
    labels.forEach((lbl, i) => {
      if (i % labelStep !== 0 && i !== n - 1) return
      const x = chartType.value === 'bar'
        ? padL + i * (chartW / n) + (chartW / n) / 2
        : padL + i * (n > 1 ? chartW / (n - 1) : 0)
      const text = String(lbl).length > 8 ? String(lbl).slice(0, 8) + '…' : String(lbl)
      ctx.fillText(text, x, padT + chartH + 16)
    })
  }

  canExport.value = true
}

// 绘制饼图
function drawPie(
  ctx: CanvasRenderingContext2D,
  labels: string[],
  series: { name: string; data: number[] }[],
  padL: number, padT: number,
  chartW: number, chartH: number,
  textColor: string
): void {
  if (series.length === 0) return
  // 饼图仅使用第一组数据
  const data = series[0].data
  const total = data.reduce((a, b) => a + Math.max(0, b), 0)
  if (total === 0) return
  const cx = padL + chartW / 2
  const cy = padT + chartH / 2
  const r = Math.min(chartW, chartH) / 2 - 20
  const colors = ['#5b8ff9', '#5ad8a6', '#f6bd16', '#e86452', '#6dc8ec', '#945fb9', '#ff9845', '#1e9493']

  let startAngle = -Math.PI / 2
  data.forEach((v, i) => {
    const slice = (Math.max(0, v) / total) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, r, startAngle, startAngle + slice)
    ctx.closePath()
    ctx.fillStyle = colors[i % colors.length]
    ctx.fill()
    // 标签
    const midAngle = startAngle + slice / 2
    const lblX = cx + Math.cos(midAngle) * (r + 14)
    const lblY = cy + Math.sin(midAngle) * (r + 14)
    ctx.fillStyle = textColor
    ctx.font = '11px sans-serif'
    ctx.textAlign = Math.cos(midAngle) >= 0 ? 'left' : 'right'
    const pct = ((v / total) * 100).toFixed(1)
    const lbl = labels[i] || `#${i + 1}`
    ctx.fillText(`${lbl} (${pct}%)`, lblX, lblY + 3)
    startAngle += slice
  })

  // 图例
  ctx.font = '12px sans-serif'
  ctx.textAlign = 'left'
  data.forEach((v, i) => {
    if (v <= 0) return
    const ly = padT + 10 + i * 18
    ctx.fillStyle = colors[i % colors.length]
    ctx.fillRect(padL + 4, ly, 12, 12)
    ctx.fillStyle = textColor
    ctx.fillText(`${labels[i] || '#'}: ${v}`, padL + 22, ly + 10)
  })
}

// 计算"好看"的最大刻度值
function niceNumber(value: number): number {
  if (value <= 0) return 1
  const exp = Math.floor(Math.log10(value))
  const fraction = value / Math.pow(10, exp)
  let niceFraction: number
  if (fraction <= 1) niceFraction = 1
  else if (fraction <= 2) niceFraction = 2
  else if (fraction <= 5) niceFraction = 5
  else niceFraction = 10
  return niceFraction * Math.pow(10, exp)
}

// 导出 PNG
function exportPng(): void {
  const canvas = canvasRef.value
  if (!canvas) return
  const url = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = url
  a.download = `chart-${Date.now()}.png`
  a.click()
  message.success('已导出 PNG')
}

// 加载示例
function loadExample(): void {
  csvInput.value = `month,sales,cost,profit
Jan,1200,800,400
Feb,1500,900,600
Mar,1800,1100,700
Apr,1600,1000,600
May,2000,1200,800
Jun,2200,1300,900
Jul,2500,1500,1000`
  chartType.value = 'bar'
  chartTitle.value = '上半年销售数据'
  renderChart()
}

function clearAll(): void {
  csvInput.value = ''
  errorMsg.value = ''
  headers.value = []
  rows.value = []
  xColumn.value = ''
  yColumns.value = []
  chartTitle.value = ''
  canExport.value = false
  const canvas = canvasRef.value
  if (canvas) {
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
  }
}

// 监听图表类型/列变化重绘
watch([chartType, xColumn, yColumns, chartTitle], () => {
  if (headers.value.length > 0) {
    nextTick(() => drawChart())
  }
})

// 主题变化时重绘
onMounted(() => {
  const observer = new MutationObserver(() => {
    if (headers.value.length > 0) drawChart()
  })
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})
</script>

<style scoped>
.csv-chart-generator {
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

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.input-section {
  margin-bottom: 20px;
}

.code-input :deep(textarea) {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
}

.config-section {
  margin-bottom: 20px;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  padding: 16px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  background: #fafafa;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.config-label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.chart-section {
  margin-top: 8px;
}

.canvas-wrapper {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 16px;
  background: #fff;
  text-align: center;
  overflow: auto;
}

.canvas-wrapper canvas {
  max-width: 100%;
  height: auto;
}

@media (max-width: 768px) {
  .config-grid {
    grid-template-columns: 1fr;
  }
}

/* 深色模式 */
.dark .config-grid {
  background: #181828;
  border-color: #2a2a4a;
}

.dark .canvas-wrapper {
  background: #181828;
  border-color: #2a2a4a;
}

.dark .pane-label {
  color: #888;
}

.dark .config-label {
  color: #aaa;
}
</style>
