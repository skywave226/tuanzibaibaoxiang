<template>
  <div class="heatmap-maker">
    <!-- 顶部操作栏 -->
    <div class="action-bar">
      <n-button type="primary" @click="loadExample">加载示例</n-button>
      <n-button @click="clearAll">清空</n-button>
      <n-button @click="exportPng" :disabled="matrix.length === 0">导出 PNG</n-button>
    </div>

    <!-- 数据输入 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title">数据输入</span>
        <n-radio-group v-model:value="inputMode" size="small">
          <n-radio-button value="csv">CSV 输入</n-radio-button>
          <n-radio-button value="manual">手动输入</n-radio-button>
        </n-radio-group>
      </div>

      <!-- CSV 输入 -->
      <div v-if="inputMode === 'csv'">
        <n-input
          v-model:value="csvInput"
          type="textarea"
          :rows="10"
          placeholder="第一行为列标签（含表头角），后续每行为：行标签,数值1,数值2,...&#10;例如：&#10;,1月,2月,3月&#10;北京,12,15,18&#10;上海,18,20,22"
          class="csv-input"
        />
        <div class="hint-text">
          第一行为列标签（首格留空作为行标签列），后续每行第一列为行标签，其余为数值。
        </div>
        <n-button size="small" type="primary" ghost @click="parseCsv" class="parse-btn">解析数据</n-button>
      </div>

      <!-- 手动输入 -->
      <div v-else>
        <div class="manual-controls">
          <span class="config-label">行数</span>
          <n-input-number v-model:value="rowCount" :min="1" :max="20" size="small" @update:value="resizeMatrix" />
          <span class="config-label">列数</span>
          <n-input-number v-model:value="colCount" :min="1" :max="20" size="small" @update:value="resizeMatrix" />
        </div>

        <div class="manual-table-wrap">
          <table class="manual-table">
            <thead>
              <tr>
                <th></th>
                <th v-for="(_col, ci) in colLabels" :key="ci">
                  <n-input v-model:value="colLabels[ci]" size="tiny" placeholder="列" class="label-cell" />
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, ri) in matrix" :key="ri">
                <td>
                  <n-input v-model:value="rowLabels[ri]" size="tiny" placeholder="行" class="label-cell" />
                </td>
                <td v-for="(_, ci) in row" :key="ci">
                  <n-input-number
                    v-model:value="matrix[ri][ci]"
                    size="tiny"
                    :show-button="false"
                    class="value-cell"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 配置 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title">配置</span>
      </div>
      <div class="config-row">
        <span class="config-label">颜色梯度</span>
        <n-select
          v-model:value="gradientKey"
          :options="gradientOptions"
          size="small"
          class="gradient-select"
        />
      </div>
      <div class="config-row">
        <span class="config-label">显示数值</span>
        <n-switch v-model:value="showValues" size="small" />
      </div>
      <div class="config-row">
        <span class="config-label">显示图例</span>
        <n-switch v-model:value="showLegend" size="small" />
      </div>
      <!-- 渐变预览条 -->
      <div class="gradient-preview">
        <span class="gradient-min">{{ minValue }}</span>
        <div class="gradient-bar" :style="gradientBarStyle"></div>
        <span class="gradient-max">{{ maxValue }}</span>
      </div>
    </div>

    <!-- 热力图预览 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title">热力图预览</span>
      </div>
      <div class="canvas-wrap">
        <canvas ref="canvasRef" :width="canvasWidth" :height="canvasHeight"></canvas>
        <div v-if="matrix.length === 0" class="empty-overlay">无数据</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { NButton, NInput, NInputNumber, NRadioGroup, NRadioButton, NSelect, NSwitch, useMessage } from 'naive-ui'

const message = useMessage()
const inputMode = ref<'csv' | 'manual'>('csv')
const csvInput = ref<string>('')

// 矩阵数据
const matrix = ref<number[][]>([])
const rowLabels = ref<string[]>([])
const colLabels = ref<string[]>([])

// 行列数（手动模式）
const rowCount = ref<number>(5)
const colCount = ref<number>(5)

// 配置
const gradientKey = ref<string>('greenYellowRed')
const showValues = ref<boolean>(true)
const showLegend = ref<boolean>(true)

const canvasRef = ref<HTMLCanvasElement | null>(null)
const canvasWidth = 760
const canvasHeight = 460

// 颜色梯度方案
const gradients: Record<string, string[]> = {
  greenYellowRed: ['#2ecc71', '#f1c40f', '#e74c3c'],
  blueCyan: ['#2c3e50', '#3498db', '#1abc9c'],
  purplePink: ['#34495e', '#9b59b6', '#fd79a8'],
  whiteBlue: ['#ffffff', '#74b9ff', '#0984e3'],
  redYellow: ['#d63031', '#fdcb6e', '#ffeaa7'],
  viridis: ['#440154', '#3b528b', '#21918c', '#5ec962', '#fde725'],
}

const gradientOptions = [
  { label: '绿→黄→红', value: 'greenYellowRed' },
  { label: '深蓝→青', value: 'blueCyan' },
  { label: '紫→粉', value: 'purplePink' },
  { label: '白→蓝', value: 'whiteBlue' },
  { label: '红→黄', value: 'redYellow' },
  { label: 'Viridis（科学）', value: 'viridis' },
]

// 计算最小/最大值
const flatValues = computed(() => matrix.value.flat().filter(v => !isNaN(v)))
const minValue = computed(() => flatValues.value.length ? Math.min(...flatValues.value) : 0)
const maxValue = computed(() => flatValues.value.length ? Math.max(...flatValues.value) : 0)

// 渐变预览条样式
const gradientBarStyle = computed(() => {
  const colors = gradients[gradientKey.value] || gradients.greenYellowRed
  return { background: `linear-gradient(to right, ${colors.join(', ')})` }
})

// 调整手动矩阵大小
function resizeMatrix(): void {
  // 调整行
  while (matrix.value.length < rowCount.value) {
    const row: number[] = []
    for (let i = 0; i < colCount.value; i++) row.push(0)
    matrix.value.push(row)
    rowLabels.value.push(`行${matrix.value.length}`)
  }
  while (matrix.value.length > rowCount.value) {
    matrix.value.pop()
    rowLabels.value.pop()
  }
  // 调整列
  matrix.value.forEach(row => {
    while (row.length < colCount.value) row.push(0)
    while (row.length > colCount.value) row.pop()
  })
  while (colLabels.value.length < colCount.value) {
    colLabels.value.push(`列${colLabels.value.length + 1}`)
  }
  while (colLabels.value.length > colCount.value) {
    colLabels.value.pop()
  }
}

// 解析 CSV 输入
function parseCsv(): void {
  const text = csvInput.value.trim()
  if (!text) {
    message.warning('请输入 CSV 数据')
    return
  }
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0)
  if (lines.length < 2) {
    message.warning('至少需要表头行和一行数据')
    return
  }
  // 解析列标签
  const headerCells = lines[0].split(',').map(c => c.trim())
  colLabels.value = headerCells.slice(1)
  // 解析数据行
  const newMatrix: number[][] = []
  const newRowLabels: string[] = []
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',').map(c => c.trim())
    if (cells.length === 0) continue
    newRowLabels.push(cells[0])
    const row = cells.slice(1).map(c => {
      const n = parseFloat(c)
      return isNaN(n) ? 0 : n
    })
    newMatrix.push(row)
  }
  matrix.value = newMatrix
  rowLabels.value = newRowLabels
  rowCount.value = newMatrix.length
  colCount.value = colLabels.value.length
  message.success(`已解析 ${newMatrix.length} 行 × ${colLabels.value.length} 列数据`)
}

// 颜色插值：根据数值返回颜色
function getColorForValue(value: number): string {
  const colors = gradients[gradientKey.value] || gradients.greenYellowRed
  const min = minValue.value
  const max = maxValue.value
  if (max === min) return colors[Math.floor(colors.length / 2)]
  const ratio = (value - min) / (max - min)
  const segments = colors.length - 1
  const idx = ratio * segments
  const lower = Math.floor(idx)
  const upper = Math.min(lower + 1, segments)
  const t = idx - lower
  return interpolateColor(colors[lower], colors[upper], t)
}

// 颜色插值
function interpolateColor(c1: string, c2: string, t: number): string {
  const rgb1 = hexToRgb(c1)
  const rgb2 = hexToRgb(c2)
  if (!rgb1 || !rgb2) return c1
  const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * t)
  const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * t)
  const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * t)
  return `rgb(${r}, ${g}, ${b})`
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!m) return null
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  }
}

// 判断颜色是否偏亮（用于选择文字颜色）
function isLightColor(r: number, g: number, b: number): boolean {
  // 使用相对亮度
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6
}

// 绘制热力图
function drawHeatmap(): void {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvasWidth, canvasHeight)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  if (matrix.value.length === 0 || matrix.value[0].length === 0) return

  const rows = matrix.value.length
  const cols = matrix.value[0].length

  // 布局参数
  const marginLeft = 70
  const marginTop = 50
  const legendHeight = showLegend.value ? 40 : 0
  const marginBottom = 20 + legendHeight
  const marginRight = 20

  const gridWidth = canvasWidth - marginLeft - marginRight
  const gridHeight = canvasHeight - marginTop - marginBottom

  const cellW = gridWidth / cols
  const cellH = Math.min(gridHeight / rows, 60)
  const actualGridHeight = cellH * rows

  // 绘制单元格
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const value = matrix.value[r][c]
      const x = marginLeft + c * cellW
      const y = marginTop + r * cellH
      ctx.fillStyle = getColorForValue(value)
      ctx.fillRect(x, y, cellW, cellH)
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1
      ctx.strokeRect(x, y, cellW, cellH)

      // 数值文本
      if (showValues.value) {
        const color = parseRgbForText(getColorForValue(value))
        ctx.fillStyle = isLightColor(color.r, color.g, color.b) ? '#333333' : '#ffffff'
        ctx.font = '12px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(value.toString(), x + cellW / 2, y + cellH / 2)
      }
    }
  }

  // 列标签
  ctx.fillStyle = '#666666'
  ctx.font = '12px sans-serif'
  ctx.textAlign = 'center'
  for (let c = 0; c < cols; c++) {
    const label = colLabels.value[c] || `列${c + 1}`
    ctx.fillText(label, marginLeft + c * cellW + cellW / 2, marginTop - 8)
  }

  // 行标签
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  for (let r = 0; r < rows; r++) {
    const label = rowLabels.value[r] || `行${r + 1}`
    ctx.fillText(label, marginLeft - 8, marginTop + r * cellH + cellH / 2)
  }

  // 图例
  if (showLegend.value) {
    const legendY = marginTop + actualGridHeight + 30
    const legendW = 200
    const legendX = (canvasWidth - legendW) / 2
    const colors = gradients[gradientKey.value] || gradients.greenYellowRed
    const gradient = ctx.createLinearGradient(legendX, 0, legendX + legendW, 0)
    colors.forEach((color, i) => {
      gradient.addColorStop(i / (colors.length - 1), color)
    })
    ctx.fillStyle = gradient
    ctx.fillRect(legendX, legendY, legendW, 14)
    ctx.strokeStyle = '#cccccc'
    ctx.strokeRect(legendX, legendY, legendW, 14)
    // 数值标签
    ctx.fillStyle = '#666666'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(minValue.value.toString(), legendX, legendY + 18)
    ctx.fillText(maxValue.value.toString(), legendX + legendW, legendY + 18)
  }
}

// 解析 rgb 字符串用于判断文字颜色
function parseRgbForText(rgb: string): { r: number; g: number; b: number } {
  const m = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(rgb)
  if (m) {
    return { r: parseInt(m[1]), g: parseInt(m[2]), b: parseInt(m[3]) }
  }
  return { r: 128, g: 128, b: 128 }
}

// 监听数据变化重绘
watch(
  [matrix, rowLabels, colLabels, gradientKey, showValues, showLegend],
  () => {
    nextTick(drawHeatmap)
  },
  { deep: true }
)

onMounted(() => {
  nextTick(drawHeatmap)
})

// 加载示例
function loadExample(): void {
  csvInput.value = `,1月,2月,3月,4月,5月,6月
北京,2,5,11,14,20,25
上海,5,7,11,16,21,25
广州,14,15,18,22,26,28
哈尔滨,-18,-13,-3,6,14,20
昆明,8,10,13,16,19,20`
  parseCsv()
}

// 清空
function clearAll(): void {
  csvInput.value = ''
  matrix.value = []
  rowLabels.value = []
  colLabels.value = []
}

// 导出 PNG
function exportPng(): void {
  const canvas = canvasRef.value
  if (!canvas || matrix.value.length === 0) {
    message.warning('暂无可导出的内容')
    return
  }
  const url = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = url
  a.download = `heatmap-${Date.now()}.png`
  a.click()
  message.success('PNG 已导出')
}
</script>

<style scoped>
.heatmap-maker {
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

.csv-input {
  font-family: 'Fira Code', 'Consolas', 'Courier New', monospace;
  font-size: 13px;
}

.hint-text {
  margin-top: 8px;
  color: #999;
  font-size: 13px;
}

.parse-btn {
  margin-top: 10px;
}

.manual-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.config-label {
  color: #666;
  font-size: 13px;
  width: 60px;
  flex-shrink: 0;
}

.manual-table-wrap {
  overflow: auto;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 8px;
}

.manual-table {
  border-collapse: separate;
  border-spacing: 4px;
}

.manual-table th,
.manual-table td {
  padding: 0;
}

.label-cell {
  width: 70px;
}

.value-cell {
  width: 60px;
}

.config-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.gradient-select {
  width: 200px;
}

.gradient-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}

.gradient-min,
.gradient-max {
  font-size: 12px;
  color: #666;
  min-width: 30px;
}

.gradient-bar {
  flex: 1;
  height: 14px;
  border-radius: 7px;
  max-width: 360px;
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

.dark .config-label,
.dark .gradient-min,
.dark .gradient-max {
  color: #aaa;
}

.dark .hint-text {
  color: #888;
}

.dark .manual-table-wrap {
  background: #181828;
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
