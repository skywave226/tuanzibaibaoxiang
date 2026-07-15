<template>
  <div class="stats-chart-maker">
    <!-- 顶部操作栏 -->
    <div class="action-bar">
      <n-button type="primary" @click="loadExample">加载示例</n-button>
      <n-button @click="addRow" ghost>+ 添加数据</n-button>
      <n-button @click="clearAll">清空</n-button>
      <n-button @click="exportPng" :disabled="rows.length === 0">导出 PNG</n-button>
    </div>

    <!-- 图表配置 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title">图表配置</span>
      </div>
      <div class="config-row">
        <span class="config-label">图表类型</span>
        <n-radio-group v-model:value="chartType" size="small">
          <n-radio-button value="bar">柱状图</n-radio-button>
          <n-radio-button value="line">折线图</n-radio-button>
          <n-radio-button value="pie">饼图</n-radio-button>
          <n-radio-button value="radar">雷达图</n-radio-button>
        </n-radio-group>
      </div>
      <div class="config-row">
        <span class="config-label">配色方案</span>
        <n-select
          v-model:value="paletteKey"
          :options="paletteOptions"
          size="small"
          class="palette-select"
        />
      </div>
      <div class="config-row">
        <span class="config-label">图表标题</span>
        <n-input v-model:value="chartTitle" placeholder="图表标题（可选）" size="small" class="title-input" />
      </div>
    </div>

    <!-- 数据输入区 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title">数据列表（{{ rows.length }}）</span>
      </div>

      <div v-if="rows.length === 0" class="empty-tip">
        暂无数据，点击"添加数据"开始
      </div>

      <div v-for="row in rows" :key="row.id" class="data-row">
        <n-input v-model:value="row.label" placeholder="标签" class="row-label" size="small" />
        <n-input-number
          v-model:value="row.value"
          placeholder="数值"
          class="row-value"
          size="small"
        />
        <n-button size="small" type="error" text @click="removeRow(row.id)">删除</n-button>
      </div>
    </div>

    <!-- 图表预览 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title">图表预览</span>
      </div>
      <div class="canvas-wrap">
        <canvas ref="canvasRef" :width="canvasWidth" :height="canvasHeight"></canvas>
        <div v-if="rows.length === 0" class="empty-overlay">无数据</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue'
import { NButton, NInput, NInputNumber, NRadioGroup, NRadioButton, NSelect, useMessage } from 'naive-ui'

// 数据行结构
interface DataRow {
  id: string
  label: string
  value: number
}

const message = useMessage()
const rows = ref<DataRow[]>([])
const chartType = ref<'bar' | 'line' | 'pie' | 'radar'>('bar')
const paletteKey = ref<string>('default')
const chartTitle = ref<string>('')

const canvasRef = ref<HTMLCanvasElement | null>(null)
const canvasWidth = 760
const canvasHeight = 460

// 配色方案
const palettes: Record<string, string[]> = {
  default: ['#36ad6a', '#2080f0', '#f0a020', '#d03050', '#8a2be2', '#00bcd4', '#ff9800', '#795548'],
  warm: ['#ff6b6b', '#ee5a52', '#fa8231', '#f7b731', '#fed330', '#26de81', '#2bcbba', '#45aaf2'],
  cool: ['#5ac8fa', '#2196f3', '#3f51b5', '#673ab7', '#9c27b0', '#e91e63', '#00bcd4', '#009688'],
  pastel: ['#a8e6cf', '#dcedc1', '#ffd3b6', '#ffaaa5', '#ff8b94', '#c9b1ff', '#a0e7e5', '#b4f8c8'],
  mono: ['#37474f', '#455a64', '#546e7a', '#607d8b', '#78909c', '#90a4ae', '#b0bec5', '#cfd8dc'],
}

const paletteOptions = [
  { label: '默认', value: 'default' },
  { label: '暖色', value: 'warm' },
  { label: '冷色', value: 'cool' },
  { label: '马卡龙', value: 'pastel' },
  { label: '单色阶', value: 'mono' },
]

// 生成唯一 id
function genId(): string {
  if (crypto.randomUUID) return crypto.randomUUID()
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// 数据行操作
function addRow(): void {
  rows.value.push({ id: genId(), label: '', value: 0 })
}

function removeRow(id: string): void {
  rows.value = rows.value.filter(r => r.id !== id)
}

function clearAll(): void {
  rows.value = []
}

// 加载示例
function loadExample(): void {
  rows.value = [
    { id: genId(), label: '一月', value: 120 },
    { id: genId(), label: '二月', value: 200 },
    { id: genId(), label: '三月', value: 150 },
    { id: genId(), label: '四月', value: 280 },
    { id: genId(), label: '五月', value: 230 },
    { id: genId(), label: '六月', value: 310 },
  ]
  chartTitle.value = '2024 年上半年销售数据'
  message.success('示例已加载')
}

// 获取当前颜色
function getColor(index: number): string {
  const palette = palettes[paletteKey.value] || palettes.default
  return palette[index % palette.length]
}

// 绘制图表
function drawChart(): void {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 清空画布
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)
  // 背景
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  // 标题
  if (chartTitle.value) {
    ctx.fillStyle = '#333333'
    ctx.font = 'bold 18px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(chartTitle.value, canvasWidth / 2, 32)
  }

  if (rows.value.length === 0) return

  const validRows = rows.value.filter(r => r.label && !isNaN(r.value))
  if (validRows.length === 0) return

  switch (chartType.value) {
    case 'bar':
      drawBar(ctx, validRows)
      break
    case 'line':
      drawLine(ctx, validRows)
      break
    case 'pie':
      drawPie(ctx, validRows)
      break
    case 'radar':
      drawRadar(ctx, validRows)
      break
  }
}

// 柱状图
function drawBar(ctx: CanvasRenderingContext2D, data: DataRow[]): void {
  const chartTop = 60
  const chartBottom = canvasHeight - 50
  const chartLeft = 60
  const chartRight = canvasWidth - 30
  const chartHeight = chartBottom - chartTop
  const chartWidth = chartRight - chartLeft

  const maxValue = Math.max(...data.map(d => d.value), 1)
  const barWidth = chartWidth / data.length * 0.6
  const gap = chartWidth / data.length

  // 绘制 Y 轴刻度
  ctx.strokeStyle = '#e0e0e0'
  ctx.fillStyle = '#999999'
  ctx.font = '11px sans-serif'
  ctx.textAlign = 'right'
  for (let i = 0; i <= 5; i++) {
    const y = chartBottom - (chartHeight / 5) * i
    const value = (maxValue / 5) * i
    ctx.beginPath()
    ctx.moveTo(chartLeft, y)
    ctx.lineTo(chartRight, y)
    ctx.stroke()
    ctx.fillText(value.toFixed(0), chartLeft - 8, y + 4)
  }

  // 绘制柱子
  data.forEach((row, i) => {
    const x = chartLeft + gap * i + (gap - barWidth) / 2
    const barHeight = (row.value / maxValue) * chartHeight
    const y = chartBottom - barHeight
    ctx.fillStyle = getColor(i)
    ctx.fillRect(x, y, barWidth, barHeight)

    // 数值标签
    ctx.fillStyle = '#333333'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(row.value.toString(), x + barWidth / 2, y - 6)

    // X 轴标签
    ctx.fillStyle = '#666666'
    ctx.font = '12px sans-serif'
    ctx.fillText(row.label, x + barWidth / 2, chartBottom + 18)
  })

  // 坐标轴
  ctx.strokeStyle = '#cccccc'
  ctx.beginPath()
  ctx.moveTo(chartLeft, chartTop)
  ctx.lineTo(chartLeft, chartBottom)
  ctx.lineTo(chartRight, chartBottom)
  ctx.stroke()
}

// 折线图
function drawLine(ctx: CanvasRenderingContext2D, data: DataRow[]): void {
  const chartTop = 60
  const chartBottom = canvasHeight - 50
  const chartLeft = 60
  const chartRight = canvasWidth - 30
  const chartHeight = chartBottom - chartTop
  const chartWidth = chartRight - chartLeft

  const maxValue = Math.max(...data.map(d => d.value), 1)

  // 网格线
  ctx.strokeStyle = '#e0e0e0'
  ctx.fillStyle = '#999999'
  ctx.font = '11px sans-serif'
  ctx.textAlign = 'right'
  for (let i = 0; i <= 5; i++) {
    const y = chartBottom - (chartHeight / 5) * i
    const value = (maxValue / 5) * i
    ctx.beginPath()
    ctx.moveTo(chartLeft, y)
    ctx.lineTo(chartRight, y)
    ctx.stroke()
    ctx.fillText(value.toFixed(0), chartLeft - 8, y + 4)
  }

  // 折线
  ctx.strokeStyle = getColor(0)
  ctx.lineWidth = 2
  ctx.beginPath()
  data.forEach((row, i) => {
    const x = chartLeft + (chartWidth / (data.length - 1 || 1)) * i
    const y = chartBottom - (row.value / maxValue) * chartHeight
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.stroke()

  // 数据点和标签
  data.forEach((row, i) => {
    const x = chartLeft + (chartWidth / (data.length - 1 || 1)) * i
    const y = chartBottom - (row.value / maxValue) * chartHeight
    ctx.fillStyle = getColor(i)
    ctx.beginPath()
    ctx.arc(x, y, 5, 0, Math.PI * 2)
    ctx.fill()
    // 数值
    ctx.fillStyle = '#333333'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(row.value.toString(), x, y - 12)
    // X 标签
    ctx.fillStyle = '#666666'
    ctx.fillText(row.label, x, chartBottom + 18)
  })

  // 坐标轴
  ctx.strokeStyle = '#cccccc'
  ctx.beginPath()
  ctx.moveTo(chartLeft, chartTop)
  ctx.lineTo(chartLeft, chartBottom)
  ctx.lineTo(chartRight, chartBottom)
  ctx.stroke()
}

// 饼图
function drawPie(ctx: CanvasRenderingContext2D, data: DataRow[]): void {
  const cx = canvasWidth / 2
  const cy = canvasHeight / 2 + 10
  const radius = Math.min(canvasWidth, canvasHeight) / 2 - 80
  const total = data.reduce((sum, d) => sum + d.value, 0)
  if (total === 0) return

  let startAngle = -Math.PI / 2
  data.forEach((row, i) => {
    const angle = (row.value / total) * Math.PI * 2
    const endAngle = startAngle + angle
    // 扇形
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, radius, startAngle, endAngle)
    ctx.closePath()
    ctx.fillStyle = getColor(i)
    ctx.fill()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.stroke()

    // 标签
    const midAngle = (startAngle + endAngle) / 2
    const labelX = cx + Math.cos(midAngle) * (radius * 0.7)
    const labelY = cy + Math.sin(midAngle) * (radius * 0.7)
    const percent = ((row.value / total) * 100).toFixed(1)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${percent}%`, labelX, labelY + 4)

    // 外部图例
    const legendY = 60 + i * 22
    ctx.fillStyle = getColor(i)
    ctx.fillRect(canvasWidth - 130, legendY, 12, 12)
    ctx.fillStyle = '#333333'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`${row.label} (${row.value})`, canvasWidth - 112, legendY + 10)

    startAngle = endAngle
  })
}

// 雷达图
function drawRadar(ctx: CanvasRenderingContext2D, data: DataRow[]): void {
  const cx = canvasWidth / 2
  const cy = canvasHeight / 2 + 10
  const radius = Math.min(canvasWidth, canvasHeight) / 2 - 80
  const sides = data.length
  if (sides < 3) {
    ctx.fillStyle = '#999'
    ctx.font = '13px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('雷达图至少需要 3 个数据点', cx, cy)
    return
  }

  const maxValue = Math.max(...data.map(d => d.value), 1)
  const angleStep = (Math.PI * 2) / sides

  // 绘制网格（5 层）
  ctx.strokeStyle = '#e0e0e0'
  for (let level = 1; level <= 5; level++) {
    const r = (radius / 5) * level
    ctx.beginPath()
    for (let i = 0; i <= sides; i++) {
      const angle = -Math.PI / 2 + angleStep * i
      const x = cx + Math.cos(angle) * r
      const y = cy + Math.sin(angle) * r
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }

  // 绘制轴线
  ctx.strokeStyle = '#cccccc'
  for (let i = 0; i < sides; i++) {
    const angle = -Math.PI / 2 + angleStep * i
    const x = cx + Math.cos(angle) * radius
    const y = cy + Math.sin(angle) * radius
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  // 绘制数据多边形
  ctx.beginPath()
  data.forEach((row, i) => {
    const angle = -Math.PI / 2 + angleStep * i
    const r = (row.value / maxValue) * radius
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.closePath()
  ctx.fillStyle = getColor(0) + '66' // 半透明填充
  ctx.fill()
  ctx.strokeStyle = getColor(0)
  ctx.lineWidth = 2
  ctx.stroke()

  // 数据点和标签
  data.forEach((row, i) => {
    const angle = -Math.PI / 2 + angleStep * i
    const r = (row.value / maxValue) * radius
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    ctx.fillStyle = getColor(i)
    ctx.beginPath()
    ctx.arc(x, y, 4, 0, Math.PI * 2)
    ctx.fill()
    // 标签
    const labelR = radius + 20
    const labelX = cx + Math.cos(angle) * labelR
    const labelY = cy + Math.sin(angle) * labelR
    ctx.fillStyle = '#333333'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${row.label}`, labelX, labelY)
    ctx.fillStyle = '#999999'
    ctx.font = '11px sans-serif'
    ctx.fillText(`(${row.value})`, labelX, labelY + 14)
  })
}

// 监听数据变化重绘
watch(
  [rows, chartType, paletteKey, chartTitle],
  () => {
    nextTick(drawChart)
  },
  { deep: true }
)

onMounted(() => {
  nextTick(drawChart)
})

// 导出 PNG
function exportPng(): void {
  const canvas = canvasRef.value
  if (!canvas || rows.value.length === 0) {
    message.warning('暂无可导出的内容')
    return
  }
  const url = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = url
  a.download = `chart-${Date.now()}.png`
  a.click()
  message.success('PNG 已导出')
}
</script>

<style scoped>
.stats-chart-maker {
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

.config-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.config-label {
  width: 80px;
  flex-shrink: 0;
  color: #666;
  font-size: 13px;
}

.palette-select {
  width: 200px;
}

.title-input {
  flex: 1;
  max-width: 320px;
}

.data-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.data-row .row-label {
  flex: 1;
  min-width: 160px;
}

.data-row .row-value {
  width: 200px;
  flex-shrink: 0;
}

.canvas-wrap {
  position: relative;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  background: #fff;
  padding: 16px;
  text-align: center;
}

.canvas-wrap canvas {
  display: block;
  margin: 0 auto;
  max-width: 100%;
}

.empty-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #999;
  font-size: 14px;
}

/* 深色模式 */
.dark .section-title {
  color: #e0e0e0;
}

.dark .config-label {
  color: #aaa;
}

.dark .empty-tip {
  color: #777;
  border-color: #2a2a4a;
}

.dark .canvas-wrap {
  background: #181828;
  border-color: #2a2a4a;
}

.dark .empty-overlay {
  color: #777;
}
</style>
