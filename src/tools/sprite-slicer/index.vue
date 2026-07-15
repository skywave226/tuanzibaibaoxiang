<template>
  <div class="tool-container sprite-slicer">
    <div class="card mb-4">
      <h3 class="section-title">上传精灵图</h3>
      <div
        class="drop-zone"
        :class="{ dragging: isDragging }"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="onDrop"
        @click="triggerFileInput"
      >
        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          style="display: none"
          @change="onFileChange"
        />
        <div v-if="!imageLoaded" class="drop-hint">
          <div class="upload-icon">⬆</div>
          <div>拖拽精灵图到此处，或点击选择文件</div>
          <div class="sub-hint">支持 PNG / JPG / GIF / WEBP</div>
        </div>
        <div v-else class="loaded-info">
          <span class="info-tag">{{ fileName }}</span>
          <span class="info-tag">{{ imgWidth }} × {{ imgHeight }} px</span>
          <n-button size="small" quaternary type="error" @click.stop="clearImage">移除</n-button>
        </div>
      </div>
    </div>

    <div class="card mb-4" v-if="imageLoaded">
      <div class="header-row">
        <h3 class="section-title">切片设置 & 预览</h3>
        <div class="config-row">
          <div class="config-item">
            <label>行数</label>
            <n-input-number v-model:value="rows" :min="1" :max="64" size="small" style="width: 90px" />
          </div>
          <div class="config-item">
            <label>列数</label>
            <n-input-number v-model:value="cols" :min="1" :max="64" size="small" style="width: 90px" />
          </div>
          <div class="config-item">
            <label>边距</label>
            <n-input-number v-model:value="padding" :min="0" :step="1" size="small" style="width: 90px" />
          </div>
          <div class="config-item">
            <n-button size="small" @click="applyGrid">应用网格</n-button>
            <n-button size="small" quaternary @click="resetRegions">重置区域</n-button>
          </div>
        </div>
      </div>

      <div class="preview-grid">
        <div class="canvas-panel">
          <canvas
            ref="mainCanvasRef"
            :width="canvasW"
            :height="canvasH"
            class="main-canvas"
            @mousedown="onCanvasMouseDown"
          ></canvas>
          <div class="canvas-hint">
            点击帧选中 · 拖拽边线调整选中帧区域 · 蓝框为选中帧
          </div>
          <div class="frame-info" v-if="selectedIdx >= 0">
            帧 #{{ selectedIdx }}：
            x={{ regions[selectedIdx]?.x }}, y={{ regions[selectedIdx]?.y }},
            w={{ regions[selectedIdx]?.w }}, h={{ regions[selectedIdx]?.h }}
          </div>
        </div>

        <div class="frames-panel">
          <div class="frames-header">
            <span>帧列表 ({{ regions.length }})</span>
            <n-button size="small" @click="exportAll">导出全部</n-button>
          </div>
          <div class="frames-list">
            <div
              v-for="(_r, i) in regions"
              :key="i"
              class="frame-thumb"
              :class="{ selected: i === selectedIdx }"
              @click="selectedIdx = i"
            >
              <canvas
                :ref="(el) => setThumbRef(el as HTMLCanvasElement, i)"
                width="64"
                height="64"
                class="thumb-canvas"
              ></canvas>
              <div class="thumb-label">#{{ i }}</div>
            </div>
            <div v-if="regions.length === 0" class="empty-hint">点击"应用网格"生成帧</div>
          </div>
        </div>
      </div>
    </div>

    <div class="card" v-if="imageLoaded && selectedIdx >= 0">
      <div class="header-row">
        <h3 class="section-title">选中帧设置</h3>
        <div class="frame-actions">
          <n-button size="small" @click="exportFrame(selectedIdx)">导出此帧</n-button>
          <n-button size="small" quaternary @click="duplicateFrame">复制帧</n-button>
          <n-button size="small" quaternary type="error" @click="deleteFrame">删除帧</n-button>
        </div>
      </div>
      <div class="region-grid">
        <div class="field"><span>X</span><n-input-number v-model:value="regions[selectedIdx].x" :min="0" :step="1" /></div>
        <div class="field"><span>Y</span><n-input-number v-model:value="regions[selectedIdx].y" :min="0" :step="1" /></div>
        <div class="field"><span>宽 W</span><n-input-number v-model:value="regions[selectedIdx].w" :min="1" :step="1" /></div>
        <div class="field"><span>高 H</span><n-input-number v-model:value="regions[selectedIdx].h" :min="1" :step="1" /></div>
      </div>
      <div class="single-preview">
        <canvas ref="singleCanvasRef" class="single-canvas"></canvas>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, watch } from 'vue'
import { NInputNumber, NButton, useMessage } from 'naive-ui'

const message = useMessage()

interface Region { x: number; y: number; w: number; h: number }

const fileInputRef = ref<HTMLInputElement | null>(null)
const mainCanvasRef = ref<HTMLCanvasElement | null>(null)
const singleCanvasRef = ref<HTMLCanvasElement | null>(null)

const isDragging = ref(false)
const imageLoaded = ref(false)
const fileName = ref('')
const imgWidth = ref(0)
const imgHeight = ref(0)

const rows = ref(4)
const cols = ref(4)
const padding = ref(0)

const regions = ref<Region[]>([])
const selectedIdx = ref(-1)

const canvasW = 600
const canvasH = 400

let img = new Image()
let thumbRefs: HTMLCanvasElement[] = []

function triggerFileInput() {
  fileInputRef.value?.click()
}

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    loadFile(target.files[0])
  }
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  const file = e.dataTransfer?.files[0]
  if (file) loadFile(file)
}

function loadFile(file: File) {
  if (!file.type.startsWith('image/')) {
    message.error('请选择图片文件')
    return
  }
  fileName.value = file.name
  const reader = new FileReader()
  reader.onload = (e) => {
    const src = e.target?.result as string
    img = new Image()
    img.onload = () => {
      imgWidth.value = img.width
      imgHeight.value = img.height
      imageLoaded.value = true
      applyGrid()
      nextTick(() => drawAll())
    }
    img.src = src
  }
  reader.readAsDataURL(file)
}

function clearImage() {
  imageLoaded.value = false
  regions.value = []
  selectedIdx.value = -1
  fileName.value = ''
  imgWidth.value = 0
  imgHeight.value = 0
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function applyGrid() {
  if (!imageLoaded.value) return
  const r = Math.max(1, rows.value)
  const c = Math.max(1, cols.value)
  const cellW = Math.floor(imgWidth.value / c)
  const cellH = Math.floor(imgHeight.value / r)
  const list: Region[] = []
  for (let ri = 0; ri < r; ri++) {
    for (let ci = 0; ci < c; ci++) {
      list.push({
        x: ci * cellW + padding.value,
        y: ri * cellH + padding.value,
        w: Math.max(1, cellW - padding.value * 2),
        h: Math.max(1, cellH - padding.value * 2),
      })
    }
  }
  regions.value = list
  selectedIdx.value = list.length > 0 ? 0 : -1
  nextTick(() => drawAll())
}

function resetRegions() {
  applyGrid()
}

// ---------- 绘制 ----------
function drawMain() {
  const canvas = mainCanvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, canvasW, canvasH)
  ctx.fillStyle = '#fafafa'
  ctx.fillRect(0, 0, canvasW, canvasH)

  if (!imageLoaded.value) return

  // 等比缩放绘制原图
  const scale = Math.min(canvasW / imgWidth.value, canvasH / imgHeight.value)
  const dw = imgWidth.value * scale
  const dh = imgHeight.value * scale
  const dx = (canvasW - dw) / 2
  const dy = (canvasH - dh) / 2

  ctx.drawImage(img, dx, dy, dw, dh)

  // 绘制切片网格
  ctx.strokeStyle = 'rgba(25, 118, 210, 0.5)'
  ctx.lineWidth = 1
  for (let i = 0; i < regions.value.length; i++) {
    const r = regions.value[i]
    ctx.strokeRect(dx + r.x * scale, dy + r.y * scale, r.w * scale, r.h * scale)
  }

  // 高亮选中帧
  if (selectedIdx.value >= 0 && selectedIdx.value < regions.value.length) {
    const r = regions.value[selectedIdx.value]
    ctx.strokeStyle = '#1976d2'
    ctx.lineWidth = 2
    ctx.strokeRect(dx + r.x * scale, dy + r.y * scale, r.w * scale, r.h * scale)
    ctx.fillStyle = 'rgba(25, 118, 210, 0.15)'
    ctx.fillRect(dx + r.x * scale, dy + r.y * scale, r.w * scale, r.h * scale)
    // 帧编号
    ctx.fillStyle = '#1976d2'
    ctx.font = 'bold 12px sans-serif'
    ctx.fillText('#' + selectedIdx.value, dx + r.x * scale + 4, dy + r.y * scale + 14)
  }
}

function drawThumbs() {
  for (let i = 0; i < regions.value.length; i++) {
    const canvas = thumbRefs[i]
    if (!canvas) continue
    const ctx = canvas.getContext('2d')
    if (!ctx) continue
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const r = regions.value[i]
    if (r.w <= 0 || r.h <= 0) continue
    // 等比填充到 64x64
    const scale = Math.min(canvas.width / r.w, canvas.height / r.h)
    const dw = r.w * scale
    const dh = r.h * scale
    const dx = (canvas.width - dw) / 2
    const dy = (canvas.height - dh) / 2
    ctx.drawImage(img, r.x, r.y, r.w, r.h, dx, dy, dw, dh)
  }
}

function drawSingle() {
  const canvas = singleCanvasRef.value
  if (!canvas || selectedIdx.value < 0) return
  const r = regions.value[selectedIdx.value]
  if (!r) return
  canvas.width = r.w
  canvas.height = r.h
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h)
}

function drawAll() {
  drawMain()
  drawThumbs()
  drawSingle()
}

function setThumbRef(el: HTMLCanvasElement | null, i: number) {
  if (el) {
    thumbRefs[i] = el
    // 设置后立即绘制该缩略图
    nextTick(() => {
      const ctx = el.getContext('2d')
      if (!ctx || !imageLoaded.value) return
      const r = regions.value[i]
      if (!r || r.w <= 0 || r.h <= 0) return
      ctx.clearRect(0, 0, el.width, el.height)
      const scale = Math.min(el.width / r.w, el.height / r.h)
      const dw = r.w * scale
      const dh = r.h * scale
      const dx = (el.width - dw) / 2
      const dy = (el.height - dh) / 2
      ctx.drawImage(img, r.x, r.y, r.w, r.h, dx, dy, dw, dh)
    })
  }
}

// ---------- 画布交互：点击选择帧 ----------
function onCanvasMouseDown(e: MouseEvent) {
  const canvas = mainCanvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const mx = ((e.clientX - rect.left) * canvas.width) / rect.width
  const my = ((e.clientY - rect.top) * canvas.height) / rect.height

  const scale = Math.min(canvasW / imgWidth.value, canvasH / imgHeight.value)
  const dw = imgWidth.value * scale
  const dh = imgHeight.value * scale
  const dx = (canvasW - dw) / 2
  const dy = (canvasH - dh) / 2

  // 将屏幕坐标转换为图像坐标
  const imgX = (mx - dx) / scale
  const imgY = (my - dy) / scale

  // 查找点击的帧
  for (let i = 0; i < regions.value.length; i++) {
    const r = regions.value[i]
    if (imgX >= r.x && imgX <= r.x + r.w && imgY >= r.y && imgY <= r.y + r.h) {
      selectedIdx.value = i
      nextTick(() => drawAll())
      return
    }
  }
}

// ---------- 导出 ----------
function exportFrame(idx: number) {
  if (idx < 0 || idx >= regions.value.length) return
  const r = regions.value[idx]
  const canvas = document.createElement('canvas')
  canvas.width = r.w
  canvas.height = r.h
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.drawImage(img, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h)
  const dataUrl = canvas.toDataURL('image/png')
  downloadDataUrl(dataUrl, `${fileName.value.replace(/\.[^.]+$/, '')}_frame_${idx}.png`)
  message.success(`已导出帧 #${idx}`)
}

function exportAll() {
  if (regions.value.length === 0) {
    message.warning('没有可导出的帧')
    return
  }
  regions.value.forEach((r, i) => {
    const canvas = document.createElement('canvas')
    canvas.width = r.w
    canvas.height = r.h
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(img, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h)
    const dataUrl = canvas.toDataURL('image/png')
    downloadDataUrl(dataUrl, `${fileName.value.replace(/\.[^.]+$/, '')}_frame_${i}.png`)
  })
  message.success(`已导出 ${regions.value.length} 帧`)
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

function duplicateFrame() {
  if (selectedIdx.value < 0) return
  const r = regions.value[selectedIdx.value]
  regions.value.splice(selectedIdx.value + 1, 0, { ...r })
  selectedIdx.value = selectedIdx.value + 1
  nextTick(() => drawAll())
}

function deleteFrame() {
  if (selectedIdx.value < 0) return
  regions.value.splice(selectedIdx.value, 1)
  // 清理缩略图引用
  thumbRefs.splice(selectedIdx.value, 1)
  if (regions.value.length === 0) {
    selectedIdx.value = -1
  } else if (selectedIdx.value >= regions.value.length) {
    selectedIdx.value = regions.value.length - 1
  }
  nextTick(() => drawAll())
}

// 重新分配缩略图引用数组（v-for 变化后重置）
watch(regions, () => {
  thumbRefs = []
  nextTick(() => drawAll())
}, { deep: false })

watch(selectedIdx, () => {
  nextTick(() => drawAll())
})

watch([rows, cols, padding], () => {
  // 仅在网格参数变化时若已加载则重切（避免编辑时被覆盖，仅在 imageLoaded 时由按钮触发更稳妥）
  // 这里不自动应用，需点击应用网格
})

onMounted(() => {
  // 初始化空画布
  const canvas = mainCanvasRef.value
  if (canvas) {
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#fafafa'
      ctx.fillRect(0, 0, canvasW, canvasH)
    }
  }
})
</script>

<style scoped>
.tool-container.sprite-slicer {
  max-width: 1000px;
  margin: 0 auto;
}

.card {
  background: #fff;
  border: 1px solid #ebebeb;
  border-radius: 10px;
  padding: 18px 20px;
}

.dark .card {
  background: #1f1f2e;
  border-color: #2e2e3e;
}

.mb-4 {
  margin-bottom: 16px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.dark .section-title {
  color: #eee;
}

.drop-zone {
  border: 2px dashed #bbb;
  border-radius: 10px;
  padding: 36px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}

.drop-zone:hover,
.drop-zone.dragging {
  border-color: #1976d2;
  background: #f0f7ff;
}

.dark .drop-zone {
  border-color: #444;
}

.dark .drop-zone:hover,
.dark .drop-zone.dragging {
  border-color: #64b5f6;
  background: #1e2a3a;
}

.drop-hint {
  color: #888;
}

.dark .drop-hint {
  color: #aaa;
}

.upload-icon {
  font-size: 36px;
  margin-bottom: 8px;
  color: #1976d2;
}

.dark .upload-icon {
  color: #64b5f6;
}

.sub-hint {
  font-size: 12px;
  color: #aaa;
  margin-top: 4px;
}

.loaded-info {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.info-tag {
  padding: 4px 10px;
  background: #e3f2fd;
  border-radius: 6px;
  font-size: 13px;
  color: #1565c0;
  font-family: 'Fira Code', 'Consolas', monospace;
}

.dark .info-tag {
  background: #1e3a4a;
  color: #64b5f6;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  flex-wrap: wrap;
  gap: 12px;
}

.config-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: flex-end;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.config-item label {
  font-size: 12px;
  color: #666;
}

.dark .config-item label {
  color: #aaa;
}

.preview-grid {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 16px;
  align-items: start;
}

.canvas-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.main-canvas {
  width: 100%;
  height: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
}

.dark .main-canvas {
  background: #1a1a2e;
  border-color: #333;
}

.canvas-hint {
  font-size: 12px;
  color: #999;
  text-align: center;
}

.frame-info {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 12px;
  color: #1976d2;
  text-align: center;
}

.dark .frame-info {
  color: #64b5f6;
}

.frames-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.frames-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  color: #555;
}

.dark .frames-header {
  color: #bbb;
}

.frames-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  max-height: 360px;
  overflow-y: auto;
  padding: 4px;
}

.frame-thumb {
  border: 2px solid transparent;
  border-radius: 6px;
  padding: 4px;
  cursor: pointer;
  background: #f7f7f7;
  text-align: center;
}

.dark .frame-thumb {
  background: #2a2a3a;
}

.frame-thumb.selected {
  border-color: #1976d2;
  background: #e3f2fd;
}

.dark .frame-thumb.selected {
  border-color: #64b5f6;
  background: #1e3a4a;
}

.thumb-canvas {
  width: 100%;
  height: auto;
  border-radius: 4px;
  image-rendering: pixelated;
  background: #fff;
}

.dark .thumb-canvas {
  background: #1a1a2e;
}

.thumb-label {
  font-size: 11px;
  color: #666;
  margin-top: 2px;
}

.dark .thumb-label {
  color: #aaa;
}

.empty-hint {
  grid-column: 1 / -1;
  font-size: 13px;
  color: #999;
  padding: 20px;
  text-align: center;
}

.frame-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.region-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field span {
  width: 50px;
  font-size: 12px;
  color: #666;
}

.dark .field span {
  color: #aaa;
}

.field .n-input-number {
  width: 100%;
}

.single-preview {
  display: flex;
  justify-content: center;
  padding: 16px;
  background: #f7f7f7;
  border-radius: 8px;
}

.dark .single-preview {
  background: #2a2a3a;
}

.single-canvas {
  max-width: 100%;
  max-height: 240px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  image-rendering: pixelated;
  background: #fff;
}

.dark .single-canvas {
  background: #1a1a2e;
  border-color: #333;
}

@media (max-width: 760px) {
  .preview-grid {
    grid-template-columns: 1fr;
  }
  .region-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
