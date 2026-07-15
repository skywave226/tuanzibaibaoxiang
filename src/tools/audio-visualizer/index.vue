<template>
  <div class="audio-visualizer">
    <n-alert type="info" class="mb-4">
      基于 Web Audio API 的 AnalyserNode 实时分析音频频谱与波形，支持文件播放或麦克风输入。
    </n-alert>

    <div class="card mb-4">
      <div class="pane-label mb-2">音频来源</div>
      <div class="source-tabs">
        <n-button
          :type="sourceType === 'file' ? 'primary' : 'default'"
          @click="switchSource('file')"
        >
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 13v-2a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2"/><path d="M12 15a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2"/></svg></span>
          音频文件
        </n-button>
        <n-button
          :type="sourceType === 'mic' ? 'primary' : 'default'"
          @click="switchSource('mic')"
        >
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg></span>
          麦克风输入
        </n-button>
      </div>

      <div class="mt-3" v-if="sourceType === 'file'">
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
        <div v-if="fileName" class="file-info mt-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 13v-2a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2"/><path d="M12 15a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2"/></svg>
          <span>{{ fileName }}</span>
        </div>
        <div class="audio-player mt-3" v-if="audioUrl">
          <audio :src="audioUrl" controls style="width: 100%" />
        </div>
      </div>
    </div>

    <div class="card mb-4" v-if="active">
      <h3 class="text-sm font-bold mb-3">可视化设置</h3>
      <div class="config-section">
        <div class="config-item">
          <label>可视化模式</label>
          <n-select
            v-model:value="vizMode"
            :options="vizModeOptions"
            style="width: 200px"
          />
        </div>
        <div class="config-item">
          <label>FFT 精度</label>
          <n-select
            v-model:value="fftSize"
            :options="fftOptions"
            style="width: 160px"
          />
        </div>
        <div class="config-item">
          <label>平滑度：{{ smoothing.toFixed(2) }}</label>
          <n-slider
            v-model:value="smoothing"
            :min="0"
            :max="0.99"
            :step="0.01"
            style="width: 180px"
          />
        </div>
        <div class="config-item">
          <label>柱条数量：{{ barCount }}</label>
          <n-slider
            v-model:value="barCount"
            :min="16"
            :max="128"
            :step="8"
            style="width: 180px"
          />
        </div>
      </div>
    </div>

    <div class="canvas-card" v-if="active">
      <div class="canvas-header">
        <span class="pane-label">{{ vizMode === 'bars' ? '频谱柱状图' : vizMode === 'wave' ? '波形图' : '环形频谱' }}</span>
        <div class="canvas-actions">
          <n-tag :type="running ? 'success' : 'default'" size="small" round>
            {{ running ? '运行中' : '已停止' }}
          </n-tag>
        </div>
      </div>
      <div class="canvas-wrap">
        <canvas ref="canvasEl" />
      </div>
    </div>

    <div class="toolbar mt-4" v-if="active">
      <n-space>
        <n-button type="primary" @click="start" v-if="!running">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg></span>
          开始可视化
        </n-button>
        <n-button type="warning" @click="stop" v-else>
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="2"/></svg></span>
          停止
        </n-button>
        <n-button @click="reset" :disabled="running">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg></span>
          重置
        </n-button>
      </n-space>
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
import { ref, onBeforeUnmount, watch } from 'vue'
import { NUpload, NButton, NSpace, NSelect, NSlider, NAlert, NTag } from 'naive-ui'
import type { UploadCustomRequestOptions } from 'naive-ui'

const sourceType = ref<'file' | 'mic'>('file')
const fileName = ref('')
const audioUrl = ref('')
const active = ref(false)
const running = ref(false)
const canvasEl = ref<HTMLCanvasElement | null>(null)
const statusMsg = ref('')
const statusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

const vizMode = ref<'bars' | 'wave' | 'circular'>('bars')
const fftSize = ref(2048)
const smoothing = ref(0.8)
const barCount = ref(64)

const vizModeOptions = [
  { label: '频谱柱状图', value: 'bars' },
  { label: '波形图', value: 'wave' },
  { label: '环形频谱', value: 'circular' },
]
const fftOptions = [
  { label: '512', value: 512 },
  { label: '1024', value: 1024 },
  { label: '2048', value: 2048 },
  { label: '4096', value: 4096 },
  { label: '8192', value: 8192 },
]

let audioCtx: AudioContext | null = null
let analyser: AnalyserNode | null = null
let source: AudioBufferSourceNode | MediaElementAudioSourceNode | MediaStreamAudioSourceNode | null = null
let audioEl: HTMLAudioElement | null = null
let micStream: MediaStream | null = null
let rafId: number | null = null

function switchSource(type: 'file' | 'mic') {
  if (running.value) stop()
  sourceType.value = type
  active.value = false
  statusMsg.value = ''
}

async function handleUpload({ file }: UploadCustomRequestOptions) {
  if (!file.file) return
  cleanupSource()
  fileName.value = file.name
  if (audioUrl.value) URL.revokeObjectURL(audioUrl.value)
  audioUrl.value = URL.createObjectURL(file.file)
  active.value = true
  statusMsg.value = '文件已加载，点击“开始可视化”'
  statusType.value = 'success'
}

async function start() {
  if (sourceType.value === 'file') {
    await startFile()
  } else {
    await startMic()
  }
}

async function startFile() {
  if (!audioUrl.value) return
  try {
    ensureAudioCtx()
    cleanupSource()
    // 使用 HTMLAudioElement 作为播放源
    audioEl = new Audio()
    audioEl.src = audioUrl.value
    audioEl.crossOrigin = 'anonymous'
    audioEl.loop = true
    source = audioCtx!.createMediaElementSource(audioEl)
    setupAnalyser()
    await audioEl.play()
    running.value = true
    startDraw()
    statusMsg.value = '正在可视化音频文件'
    statusType.value = 'success'
  } catch (e) {
    statusMsg.value = '播放失败：' + (e as Error).message
    statusType.value = 'error'
  }
}

async function startMic() {
  try {
    ensureAudioCtx()
    cleanupSource()
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    source = audioCtx!.createMediaStreamSource(micStream)
    setupAnalyser()
    running.value = true
    active.value = true
    startDraw()
    statusMsg.value = '正在可视化麦克风输入'
    statusType.value = 'success'
  } catch (e) {
    statusMsg.value = '无法访问麦克风，请检查权限设置'
    statusType.value = 'error'
  }
}

function ensureAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  // 浏览器要求用户交互后才能恢复
  if (audioCtx.state === 'suspended') audioCtx.resume()
}

function setupAnalyser() {
  analyser = audioCtx!.createAnalyser()
  analyser.fftSize = fftSize.value
  analyser.smoothingTimeConstant = smoothing.value
  source!.connect(analyser)
  // 文件与麦克风都连接到 destination 才能听到声音
  analyser.connect(audioCtx!.destination)
}

function startDraw() {
  const draw = () => {
    if (!running.value || !analyser || !canvasEl.value) return
    rafId = requestAnimationFrame(draw)
    if (vizMode.value === 'bars') drawBars()
    else if (vizMode.value === 'wave') drawWave()
    else drawCircular()
  }
  draw()
}

function getCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; width: number; height: number } {
  const canvas = canvasEl.value!
  const parent = canvas.parentElement!
  const width = parent.clientWidth
  const height = 280
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  }
  const ctx = canvas.getContext('2d')!
  const isDark = document.documentElement.classList.contains('dark')
  // 背景
  ctx.fillStyle = isDark ? '#18181c' : '#0f0f17'
  ctx.fillRect(0, 0, width, height)
  return { canvas, ctx, width, height }
}

// 频谱柱状图
function drawBars() {
  const { ctx, width, height } = getCanvas()
  if (!analyser) return
  const bufferLength = analyser.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)
  analyser.getByteFrequencyData(dataArray)

  const bars = barCount.value
  const barWidth = width / bars
  const gap = Math.max(1, barWidth * 0.15)
  for (let i = 0; i < bars; i++) {
    // 取低频部分并对数采样以获得更好的视觉效果
    const idx = Math.floor(Math.pow(i / bars, 1.5) * (bufferLength * 0.7))
    const value = dataArray[idx] || 0
    const barHeight = (value / 255) * height * 0.95
    const x = i * barWidth
    const y = height - barHeight
    // 渐变色
    const hue = (i / bars) * 280
    const grad = ctx.createLinearGradient(0, y, 0, height)
    grad.addColorStop(0, `hsl(${hue}, 90%, 60%)`)
    grad.addColorStop(1, `hsl(${hue}, 90%, 35%)`)
    ctx.fillStyle = grad
    ctx.fillRect(x + gap / 2, y, barWidth - gap, barHeight)
  }
}

// 波形图
function drawWave() {
  const { ctx, width, height } = getCanvas()
  if (!analyser) return
  const bufferLength = analyser.fftSize
  const dataArray = new Uint8Array(bufferLength)
  analyser.getByteTimeDomainData(dataArray)

  ctx.lineWidth = 2
  ctx.strokeStyle = '#22d3ee'
  ctx.beginPath()
  const sliceWidth = width / bufferLength
  let x = 0
  for (let i = 0; i < bufferLength; i++) {
    const v = dataArray[i] / 128
    const y = (v * height) / 2
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
    x += sliceWidth
  }
  ctx.lineTo(width, height / 2)
  ctx.stroke()
}

// 环形频谱
function drawCircular() {
  const { ctx, width, height } = getCanvas()
  if (!analyser) return
  const bufferLength = analyser.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)
  analyser.getByteFrequencyData(dataArray)

  const cx = width / 2
  const cy = height / 2
  const radius = Math.min(width, height) * 0.2
  const bars = barCount.value
  for (let i = 0; i < bars; i++) {
    const idx = Math.floor(Math.pow(i / bars, 1.3) * (bufferLength * 0.6))
    const value = dataArray[idx] || 0
    const barLength = (value / 255) * (Math.min(width, height) * 0.3)
    const angle = (i / bars) * Math.PI * 2 - Math.PI / 2
    const x1 = cx + Math.cos(angle) * radius
    const y1 = cy + Math.sin(angle) * radius
    const x2 = cx + Math.cos(angle) * (radius + barLength)
    const y2 = cy + Math.sin(angle) * (radius + barLength)
    const hue = (i / bars) * 360
    ctx.strokeStyle = `hsl(${hue}, 90%, 60%)`
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }
  // 中心圆
  ctx.fillStyle = 'rgba(34, 211, 238, 0.15)'
  ctx.beginPath()
  ctx.arc(cx, cy, radius - 4, 0, Math.PI * 2)
  ctx.fill()
}

function stop() {
  running.value = false
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  if (audioEl) {
    audioEl.pause()
  }
  statusMsg.value = '已停止'
  statusType.value = 'info'
}

function cleanupSource() {
  if (source) {
    try {
      source.disconnect()
    } catch {
      // 忽略
    }
    source = null
  }
  if (audioEl) {
    audioEl.pause()
    audioEl = null
  }
  if (micStream) {
    micStream.getTracks().forEach((t) => t.stop())
    micStream = null
  }
  if (analyser) {
    try {
      analyser.disconnect()
    } catch {
      // 忽略
    }
    analyser = null
  }
}

function reset() {
  stop()
  cleanupSource()
  if (audioUrl.value) URL.revokeObjectURL(audioUrl.value)
  audioUrl.value = ''
  fileName.value = ''
  active.value = false
  statusMsg.value = ''
}

// 参数变化时实时更新
watch([fftSize, smoothing], () => {
  if (analyser) {
    analyser.fftSize = fftSize.value
    analyser.smoothingTimeConstant = smoothing.value
  }
})

onBeforeUnmount(() => {
  stop()
  cleanupSource()
  if (audioUrl.value) URL.revokeObjectURL(audioUrl.value)
  if (audioCtx) audioCtx.close()
})
</script>

<style scoped>
.audio-visualizer {
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

.source-tabs {
  display: flex;
  gap: 8px;
}

.config-section {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-item label {
  font-size: 13px;
  font-weight: 500;
  color: #555;
}

.dark .config-item label {
  color: #aaa;
}

.canvas-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #eee;
}

.dark .canvas-card {
  background: #18181c;
  border-color: #2d2d33;
}

.canvas-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.canvas-wrap {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.canvas-wrap canvas {
  display: block;
  width: 100%;
  height: 280px;
}

.toolbar {
  display: flex;
  gap: 12px;
}

.audio-player {
  width: 100%;
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
