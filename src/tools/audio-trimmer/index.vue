<template>
  <div class="audio-trimmer">
    <n-alert type="info" class="mb-4">
      基于 Web Audio API 解码音频并绘制波形，可在浏览器本地剪辑音频片段并导出为 WAV 文件。
    </n-alert>

    <div class="card mb-4">
      <div class="pane-label mb-2">上传音频文件</div>
      <n-upload
        :show-file-list="false"
        :custom-request="handleUpload"
        accept="audio/*"
      >
        <n-button type="primary">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><polyline points="16 13 12 9 8 13"/><line x1="12" y1="9" x2="12" y2="19"/></svg></span>
          选择音频文件
        </n-button>
      </n-upload>
      <div v-if="fileName" class="file-info mt-3">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 13v-2a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2"/><path d="M12 15a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2"/></svg>
        <span>{{ fileName }}</span>
        <span class="muted">（{{ fileSize }}）</span>
      </div>
    </div>

    <div class="card mb-4" v-if="audioBuffer">
      <div class="wave-header">
        <h3 class="text-sm font-bold">波形预览</h3>
        <div class="duration-info">
          总时长：{{ formatTime(duration) }}
        </div>
      </div>
      <div class="waveform-container" ref="waveformContainer">
        <canvas
          ref="canvasEl"
          @mousedown="onCanvasMouseDown"
          @mousemove="onCanvasMouseMove"
          @mouseup="onCanvasMouseUp"
          @mouseleave="onCanvasMouseUp"
        />
        <!-- 选区拖动手柄 -->
        <div
          v-if="selectionReady"
          class="selection-handle left"
          :style="{ left: selectionLeftPercent + '%' }"
        ></div>
        <div
          v-if="selectionReady"
          class="selection-handle right"
          :style="{ left: selectionRightPercent + '%' }"
        ></div>
      </div>
      <div class="time-marks">
        <span>0:00</span>
        <span>{{ formatTime(duration) }}</span>
      </div>
    </div>

    <div class="card mb-4" v-if="audioBuffer">
      <h3 class="text-sm font-bold mb-3">剪辑区间</h3>
      <div class="trim-inputs">
        <div class="input-group">
          <label>开始时间</label>
          <n-input-number
            v-model:value="startTime"
            :min="0"
            :max="endTime"
            :step="0.1"
            size="small"
            style="width: 140px"
          >
            <template #suffix>秒</template>
          </n-input-number>
        </div>
        <div class="input-group">
          <label>结束时间</label>
          <n-input-number
            v-model:value="endTime"
            :min="startTime"
            :max="duration"
            :step="0.1"
            size="small"
            style="width: 140px"
          >
            <template #suffix>秒</template>
          </n-input-number>
        </div>
        <div class="input-group">
          <label>片段时长</label>
          <div class="duration-display">{{ formatTime(endTime - startTime) }}</div>
        </div>
      </div>
      <div class="trim-slider mt-3">
        <n-slider
          v-model:value="sliderRange"
          range
          :min="0"
          :max="Math.floor(duration * 100)"
          :step="1"
          :format-tooltip="formatTooltip"
        />
      </div>
    </div>

    <div class="toolbar mt-4" v-if="audioBuffer">
      <n-space>
        <n-button type="primary" @click="preview" v-if="!playing">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg></span>
          预览片段
        </n-button>
        <n-button type="warning" @click="stopPreview" v-else>
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="2"/></svg></span>
          停止预览
        </n-button>
        <n-button type="primary" @click="exportTrim" :loading="exporting" ghost>
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="3" x2="12" y2="15"/></svg></span>
          导出剪辑 (WAV)
        </n-button>
        <n-button @click="download" :disabled="!resultUrl">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></span>
          下载文件
        </n-button>
        <n-button @click="reset">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg></span>
          重置
        </n-button>
      </n-space>
    </div>

    <div class="card mt-4" v-if="resultUrl">
      <div class="pane-label mb-2">导出结果</div>
      <div class="result-info mb-2">
        时长：{{ formatTime(resultDuration) }} · 大小：{{ resultSize }}
      </div>
      <audio :src="resultUrl" controls style="width: 100%" />
    </div>

    <n-alert
      :type="statusType"
      v-if="statusMsg"
      class="mt-4"
      closable
      @close="statusMsg = ''"
    >
      {{ statusMsg }}
    </n-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount, nextTick } from 'vue'
import { NUpload, NButton, NSpace, NInputNumber, NSlider, NAlert } from 'naive-ui'
import type { UploadCustomRequestOptions } from 'naive-ui'

const fileName = ref('')
const fileSize = ref('')
const audioBuffer = ref<AudioBuffer | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)
const waveformContainer = ref<HTMLDivElement | null>(null)
const playing = ref(false)
const exporting = ref(false)
const resultUrl = ref('')
const resultSize = ref('')
const resultDuration = ref(0)
const statusMsg = ref('')
const statusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

const startTime = ref(0)
const endTime = ref(0)

// 滑块使用整数百分比 * 100 以提升精度
const sliderRange = ref<[number, number]>([0, 0])

const duration = computed(() => audioBuffer.value?.duration || 0)
const selectionReady = computed(() => !!audioBuffer.value)
const selectionLeftPercent = computed(() =>
  duration.value ? (startTime.value / duration.value) * 100 : 0
)
const selectionRightPercent = computed(() =>
  duration.value ? (endTime.value / duration.value) * 100 : 100
)

function formatTime(sec: number) {
  if (!isFinite(sec) || sec < 0) sec = 0
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  const ms = Math.floor((sec % 1) * 100)
  return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

function formatTooltip(val: number) {
  return formatTime(val / 100)
}

let audioCtx: AudioContext | null = null
let originalFile: File | null = null
let sourceNode: AudioBufferSourceNode | null = null

// 同步滑块与输入框
watch(sliderRange, (val) => {
  startTime.value = val[0] / 100
  endTime.value = val[1] / 100
})

watch(startTime, (val) => {
  if (audioCtx) {
    sliderRange.value = [Math.round(val * 100), sliderRange.value[1]]
  }
})

watch(endTime, (val) => {
  if (audioCtx) {
    sliderRange.value = [sliderRange.value[0], Math.round(val * 100)]
  }
})

async function handleUpload({ file }: UploadCustomRequestOptions) {
  if (!file.file) return
  reset()
  originalFile = file.file
  fileName.value = file.name
  fileSize.value = formatSize(file.file.size)
  statusMsg.value = '正在解码音频...'
  statusType.value = 'info'
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    const arrayBuffer = await file.file.arrayBuffer()
    const decoded = await audioCtx.decodeAudioData(arrayBuffer)
    audioBuffer.value = decoded
    startTime.value = 0
    endTime.value = decoded.duration
    sliderRange.value = [0, Math.floor(decoded.duration * 100)]
    statusMsg.value = '解码完成，可拖动选择剪辑区间'
    statusType.value = 'success'
    await nextTick()
    drawWaveform()
  } catch (e) {
    statusMsg.value = '解码失败：该格式可能不被浏览器支持'
    statusType.value = 'error'
  }
}

// 绘制波形
function drawWaveform() {
  const canvas = canvasEl.value
  const buffer = audioBuffer.value
  if (!canvas || !buffer) return
  const container = waveformContainer.value
  const width = container?.clientWidth || 800
  const height = 120
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, width, height)

  // 取第一声道数据用于绘制
  const channelData = buffer.getChannelData(0)
  const samplesPerPixel = Math.floor(channelData.length / width)
  const isDark = document.documentElement.classList.contains('dark')

  // 绘制中线
  ctx.strokeStyle = isDark ? '#3a3a3f' : '#e0e0e0'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, height / 2)
  ctx.lineTo(width, height / 2)
  ctx.stroke()

  // 绘制波形柱
  ctx.fillStyle = isDark ? '#6ea8fe' : '#3b82f6'
  for (let x = 0; x < width; x++) {
    const start = x * samplesPerPixel
    let min = 1
    let max = -1
    for (let i = 0; i < samplesPerPixel; i++) {
      const v = channelData[start + i] || 0
      if (v < min) min = v
      if (v > max) max = v
    }
    const y1 = (1 - (max + 1) / 2) * height
    const y2 = (1 - (min + 1) / 2) * height
    ctx.fillRect(x, y1, 1, Math.max(1, y2 - y1))
  }

  // 绘制选区
  drawSelection(ctx, width, height, isDark)
}

function drawSelection(ctx: CanvasRenderingContext2D, width: number, height: number, isDark: boolean) {
  const left = (startTime.value / duration.value) * width
  const right = (endTime.value / duration.value) * width
  // 选区背景
  ctx.fillStyle = isDark ? 'rgba(110, 168, 254, 0.2)' : 'rgba(59, 130, 246, 0.15)'
  ctx.fillRect(left, 0, right - left, height)
  // 选区边线
  ctx.strokeStyle = isDark ? '#6ea8fe' : '#3b82f6'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(left, 0)
  ctx.lineTo(left, height)
  ctx.moveTo(right, 0)
  ctx.lineTo(right, height)
  ctx.stroke()
}

// Canvas 上的选区拖动（拖动中间区域整体平移）
let dragging = false
let dragStartX = 0
let dragStartTime = 0
let dragEndTime = 0

function onCanvasMouseDown(e: MouseEvent) {
  if (!audioBuffer.value) return
  dragging = true
  dragStartX = e.offsetX
  dragStartTime = startTime.value
  dragEndTime = endTime.value
}

function onCanvasMouseMove(e: MouseEvent) {
  if (!dragging || !audioBuffer.value || !canvasEl.value) return
  const width = canvasEl.value.width
  const deltaSec = ((e.offsetX - dragStartX) / width) * duration.value
  const span = dragEndTime - dragStartTime
  let newStart = dragStartTime + deltaSec
  let newEnd = dragEndTime + deltaSec
  if (newStart < 0) {
    newStart = 0
    newEnd = span
  }
  if (newEnd > duration.value) {
    newEnd = duration.value
    newStart = duration.value - span
  }
  startTime.value = newStart
  endTime.value = newEnd
  drawWaveform()
}

function onCanvasMouseUp() {
  dragging = false
}

// 预览播放片段
function preview() {
  if (!audioBuffer.value || !audioCtx) return
  stopPreview()
  sourceNode = audioCtx.createBufferSource()
  sourceNode.buffer = audioBuffer.value
  sourceNode.connect(audioCtx.destination)
  sourceNode.start(0, startTime.value, endTime.value - startTime.value)
  sourceNode.onended = () => {
    playing.value = false
  }
  playing.value = true
  statusMsg.value = `正在预览 ${formatTime(startTime.value)} - ${formatTime(endTime.value)}`
  statusType.value = 'info'
}

function stopPreview() {
  if (sourceNode) {
    try {
      sourceNode.onended = null
      sourceNode.stop()
    } catch {
      // 忽略已停止的错误
    }
    sourceNode = null
  }
  playing.value = false
}

// 从 AudioBuffer 截取指定区间
function sliceBuffer(buffer: AudioBuffer, startSec: number, endSec: number): AudioBuffer {
  const ctx = audioCtx!
  const sampleRate = buffer.sampleRate
  const startSample = Math.floor(startSec * sampleRate)
  const endSample = Math.floor(endSec * sampleRate)
  const length = endSample - startSample
  const out = ctx.createBuffer(buffer.numberOfChannels, length, sampleRate)
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const src = buffer.getChannelData(c)
    const dst = out.getChannelData(c)
    for (let i = 0; i < length; i++) {
      dst[i] = src[startSample + i]
    }
  }
  return out
}

// 编码为 16 位 PCM WAV
function encodeWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const numSamples = buffer.length
  const bytesPerSample = 2
  const blockAlign = numChannels * bytesPerSample
  const dataSize = numSamples * blockAlign
  const bufferSize = 44 + dataSize

  const arrayBuffer = new ArrayBuffer(bufferSize)
  const view = new DataView(arrayBuffer)

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i))
    }
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 16, true)
  writeString(36, 'data')
  view.setUint32(40, dataSize, true)

  const channels: Float32Array[] = []
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c))
  }
  let offset = 44
  for (let i = 0; i < numSamples; i++) {
    for (let c = 0; c < numChannels; c++) {
      let sample = Math.max(-1, Math.min(1, channels[c][i]))
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff
      view.setInt16(offset, sample, true)
      offset += 2
    }
  }
  return new Blob([arrayBuffer], { type: 'audio/wav' })
}

async function exportTrim() {
  if (!audioBuffer.value || !audioCtx) return
  exporting.value = true
  statusMsg.value = '正在导出剪辑...'
  statusType.value = 'info'
  try {
    const sliced = sliceBuffer(audioBuffer.value, startTime.value, endTime.value)
    const blob = encodeWav(sliced)
    if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
    resultUrl.value = URL.createObjectURL(blob)
    resultSize.value = formatSize(blob.size)
    resultDuration.value = sliced.duration
    statusMsg.value = '导出完成'
    statusType.value = 'success'
  } catch (e) {
    statusMsg.value = '导出失败：' + (e as Error).message
    statusType.value = 'error'
  } finally {
    exporting.value = false
  }
}

function download() {
  if (!resultUrl.value) return
  const baseName = originalFile ? originalFile.name.replace(/\.[^.]+$/, '') : 'audio'
  const a = document.createElement('a')
  a.href = resultUrl.value
  a.download = `${baseName}_trim_${startTime.value.toFixed(1)}-${endTime.value.toFixed(1)}.wav`
  a.click()
}

function reset() {
  stopPreview()
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
  resultUrl.value = ''
  resultSize.value = ''
  resultDuration.value = 0
  audioBuffer.value = null
  fileName.value = ''
  fileSize.value = ''
  startTime.value = 0
  endTime.value = 0
  sliderRange.value = [0, 0]
  originalFile = null
  statusMsg.value = ''
}

// 监听深色模式变化重绘波形
const observer = new MutationObserver(() => {
  if (audioBuffer.value) drawWaveform()
})

onBeforeUnmount(() => {
  stopPreview()
  observer.disconnect()
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
  if (audioCtx) audioCtx.close()
})

// 容器挂载后观察深色模式变化
nextTick(() => {
  if (waveformContainer.value) {
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  }
})

// 窗口尺寸变化重绘
if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    if (audioBuffer.value) drawWaveform()
  })
}
</script>

<style scoped>
.audio-trimmer {
  max-width: 1000px;
  margin: 0 auto;
}

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #333;
}

.dark .file-info {
  color: #ddd;
}

.muted {
  color: #999;
  font-size: 13px;
}

.wave-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.duration-info {
  font-size: 13px;
  color: #555;
  font-family: monospace;
}

.dark .duration-info {
  color: #aaa;
}

.waveform-container {
  position: relative;
  width: 100%;
  background: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
}

.dark .waveform-container {
  background: #1f1f23;
}

.waveform-container canvas {
  display: block;
  width: 100%;
  cursor: ew-resize;
  height: 120px;
}

.selection-handle {
  position: absolute;
  top: 0;
  width: 4px;
  height: 120px;
  background: #3b82f6;
  cursor: ew-resize;
  transform: translateX(-2px);
  pointer-events: none;
  border-radius: 2px;
}

.dark .selection-handle {
  background: #6ea8fe;
}

.time-marks {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #888;
  margin-top: 4px;
  font-family: monospace;
}

.trim-inputs {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group label {
  font-size: 13px;
  font-weight: 500;
  color: #555;
}

.dark .input-group label {
  color: #aaa;
}

.duration-display {
  font-family: monospace;
  font-weight: 600;
  font-size: 15px;
  color: #3b82f6;
  padding: 4px 0;
}

.dark .duration-display {
  color: #6ea8fe;
}

.trim-slider {
  margin-top: 12px;
}

.toolbar {
  display: flex;
  gap: 12px;
}

.result-info {
  font-size: 13px;
  color: #555;
}

.dark .result-info {
  color: #aaa;
}

.card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #eee;
}

.dark .card {
  background: #18181c;
  border-color: #2d2d33;
}
</style>
