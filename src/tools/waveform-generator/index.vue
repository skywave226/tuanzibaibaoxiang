<template>
  <div class="waveform-generator">
    <n-alert type="info" class="mb-4">
      基于 Web Audio API 解码音频并提取波形数据，使用 Canvas 绘制波形图。支持多种配色方案并导出 PNG。
    </n-alert>

    <div class="card mb-4">
      <div class="pane-label mb-2">音频文件</div>
      <n-upload
        :show-file-list="false"
        @change="handleUpload"
        accept="audio/*"
      >
        <n-button type="primary">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><polyline points="16 13 12 9 8 13"/><line x1="12" y1="9" x2="12" y2="19"/></svg></span>
          选择音频
        </n-button>
      </n-upload>
      <div class="text-info mt-2" v-if="fileName">
        <span>文件：{{ fileName }}</span>
        <span v-if="duration">时长：{{ duration.toFixed(2) }} 秒</span>
        <span v-if="sampleRate">采样率：{{ sampleRate }} Hz</span>
        <span v-if="channels">声道：{{ channels }}</span>
      </div>
    </div>

    <div class="card mb-4" v-if="audioBuffer">
      <h3 class="text-sm font-bold mb-3">样式设置</h3>

      <div class="config-section">
        <div class="config-item">
          <label>配色方案</label>
          <n-select
            v-model:value="scheme"
            :options="schemeOptions"
            style="width: 200px"
          />
        </div>

        <div class="config-item">
          <label>波形方向</label>
          <n-select
            v-model:value="orientation"
            :options="orientationOptions"
            style="width: 140px"
          />
        </div>

        <div class="config-item">
          <label>画布宽度：{{ canvasWidth }} px</label>
          <n-slider
            v-model:value="canvasWidth"
            :min="400"
            :max="1600"
            :step="50"
            style="width: 220px"
          />
        </div>

        <div class="config-item">
          <label>画布高度：{{ canvasHeight }} px</label>
          <n-slider
            v-model:value="canvasHeight"
            :min="120"
            :max="600"
            :step="20"
            style="width: 220px"
          />
        </div>

        <div class="config-item">
          <label>柱状宽度：{{ barWidth }} px</label>
          <n-slider v-model:value="barWidth" :min="1" :max="10" :step="1" style="width: 140px" />
        </div>

        <div class="config-item">
          <label>柱状间距：{{ barGap }} px</label>
          <n-slider v-model:value="barGap" :min="0" :max="8" :step="1" style="width: 140px" />
        </div>

        <div class="config-item">
          <label>镜像（上下对称）</label>
          <n-switch v-model:value="mirror">
            <template #checked>开启</template>
            <template #unchecked>关闭</template>
          </n-switch>
        </div>
      </div>
    </div>

    <div class="toolbar mb-4" v-if="audioBuffer">
      <n-space>
        <n-button type="primary" @click="draw">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg></span>
          重新绘制
        </n-button>
        <n-button @click="download" :disabled="!dataUrl">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></span>
          导出 PNG
        </n-button>
      </n-space>
    </div>

    <div class="preview mt-4" v-if="dataUrl">
      <div class="pane-label mb-2">波形预览</div>
      <img :src="dataUrl" alt="波形图" />
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

    <div class="card mt-4" v-if="!supported">
      <n-alert type="warning">
        当前浏览器不支持 Web Audio API，请使用现代浏览器。
      </n-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import {
  NUpload,
  NButton,
  NSelect,
  NSlider,
  NSwitch,
  NAlert,
  NSpace,
  useMessage,
} from 'naive-ui'
import type { UploadFileInfo } from 'naive-ui'

const message = useMessage()
const supported = ref(
  typeof window !== 'undefined' &&
    (window.AudioContext !== undefined || (window as any).webkitAudioContext !== undefined),
)

const fileName = ref('')
const audioBuffer = ref<AudioBuffer | null>(null)
const dataUrl = ref('')

const scheme = ref('ocean')
const orientation = ref<'horizontal' | 'vertical'>('horizontal')
const canvasWidth = ref(1000)
const canvasHeight = ref(240)
const barWidth = ref(2)
const barGap = ref(1)
const mirror = ref(true)
const statusMsg = ref('')
const statusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

const duration = computed(() => audioBuffer.value?.duration ?? 0)
const sampleRate = computed(() => audioBuffer.value?.sampleRate ?? 0)
const channels = computed(() => audioBuffer.value?.numberOfChannels ?? 0)

// 配色方案：[背景, 波形主色, 波形副色]
const schemeOptions = [
  { label: '海洋蓝', value: 'ocean' },
  { label: '霓虹紫', value: 'neon' },
  { label: '极光绿', value: 'aurora' },
  { label: '落日橙', value: 'sunset' },
  { label: '经典黑', value: 'classic' },
  { label: '极简白', value: 'light' },
]

const orientationOptions = [
  { label: '横向', value: 'horizontal' },
  { label: '纵向', value: 'vertical' },
]

// 获取配色
function getScheme(name: string): { bg: string; primary: string; secondary: string } {
  const map: Record<string, { bg: string; primary: string; secondary: string }> = {
    ocean: { bg: '#0a1929', primary: '#36cfc9', secondary: '#1890ff' },
    neon: { bg: '#1a0b2e', primary: '#ff4d9d', secondary: '#9256ff' },
    aurora: { bg: '#06121a', primary: '#52f59b', secondary: '#3a86ff' },
    sunset: { bg: '#2a0e1a', primary: '#ff8a3d', secondary: '#ff4d6d' },
    classic: { bg: '#000000', primary: '#39ff14', secondary: '#00e676' },
    light: { bg: '#ffffff', primary: '#1890ff', secondary: '#69b1ff' },
  }
  return map[name] || map.ocean
}

let audioCtx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!audioCtx) {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext
    audioCtx = new Ctor()
  }
  return audioCtx
}

const handleUpload = ({ file }: { file: UploadFileInfo }) => {
  if (!file.file) return
  fileName.value = file.name
  const ctx = getCtx()
  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const arrayBuffer = e.target?.result as ArrayBuffer
      const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0))
      audioBuffer.value = decoded
      statusMsg.value = `解码成功：${decoded.numberOfChannels} 声道，时长 ${decoded.duration.toFixed(2)} 秒`
      statusType.value = 'success'
      await draw()
    } catch (err) {
      statusMsg.value = '音频解码失败，请检查文件格式'
      statusType.value = 'error'
    }
  }
  reader.readAsArrayBuffer(file.file)
}

// 将音频降采样为指定数量的峰值柱
function getPeaks(buffer: AudioBuffer, count: number): number[] {
  const channel = buffer.getChannelData(0)
  const blockSize = Math.floor(channel.length / count) || 1
  const peaks: number[] = []
  for (let i = 0; i < count; i++) {
    const start = i * blockSize
    const end = Math.min(start + blockSize, channel.length)
    let peak = 0
    for (let j = start; j < end; j++) {
      const v = Math.abs(channel[j])
      if (v > peak) peak = v
    }
    peaks.push(peak)
  }
  // 多声道时取最大声道
  for (let ch = 1; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch)
    for (let i = 0; i < count; i++) {
      const start = i * blockSize
      const end = Math.min(start + blockSize, data.length)
      let peak = 0
      for (let j = start; j < end; j++) {
        const v = Math.abs(data[j])
        if (v > peak) peak = v
      }
      if (peak > peaks[i]) peaks[i] = peak
    }
  }
  return peaks
}

// 绘制波形图
async function draw() {
  if (!audioBuffer.value) return
  await new Promise((r) => requestAnimationFrame(r))

  const canvas = document.createElement('canvas')
  const w = canvasWidth.value
  const h = canvasHeight.value
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  const colors = getScheme(scheme.value)

  // 背景渐变
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h)
  bgGrad.addColorStop(0, colors.bg)
  bgGrad.addColorStop(1, colors.bg)
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, w, h)

  const isHorizontal = orientation.value === 'horizontal'
  // 计算柱数量
  const step = barWidth.value + barGap.value
  const barCount = isHorizontal
    ? Math.floor(w / step)
    : Math.floor(h / step)

  if (barCount <= 0) {
    message.warning('柱状宽度过大，请减小')
    return
  }

  const peaks = getPeaks(audioBuffer.value, barCount)
  // 归一化：找到最大峰值并放大
  const maxPeak = Math.max(...peaks, 0.0001)
  const normPeaks = peaks.map((p) => p / maxPeak)

  // 波形主色渐变
  const grad = isHorizontal
    ? ctx.createLinearGradient(0, 0, 0, h)
    : ctx.createLinearGradient(0, 0, w, 0)
  grad.addColorStop(0, colors.primary)
  grad.addColorStop(1, colors.secondary)
  ctx.fillStyle = grad

  const half = isHorizontal ? h / 2 : w / 2

  for (let i = 0; i < barCount; i++) {
    const v = normPeaks[i]
    const len = v * (isHorizontal ? h / 2 : w / 2)
    const pos = i * step
    if (mirror.value) {
      // 上下镜像
      if (isHorizontal) {
        ctx.fillRect(pos, half - len, barWidth.value, len * 2)
      } else {
        ctx.fillRect(half - len, pos, len * 2, barWidth.value)
      }
    } else {
      // 单向
      if (isHorizontal) {
        ctx.fillRect(pos, h - len, barWidth.value, len)
      } else {
        ctx.fillRect(0, pos, len, barWidth.value)
      }
    }
  }

  dataUrl.value = canvas.toDataURL('image/png')
}

function download() {
  if (!dataUrl.value) return
  const a = document.createElement('a')
  a.href = dataUrl.value
  a.download = `${baseName()}_waveform.png`
  a.click()
}

function baseName(): string {
  const n = fileName.value || 'audio'
  return n.replace(/\.[^.]+$/, '')
}

// 参数变化时自动重绘
watch([scheme, orientation, canvasWidth, canvasHeight, barWidth, barGap, mirror], () => {
  if (audioBuffer.value) draw()
})

onBeforeUnmount(() => {
  if (audioCtx) {
    audioCtx.close()
    audioCtx = null
  }
})
</script>

<style scoped>
.waveform-generator {
  max-width: 1000px;
  margin: 0 auto;
}

.card {
  padding: 16px;
  border: 1px solid var(--n-border-color, #e5e7eb);
  border-radius: 8px;
  background: var(--n-color, #fff);
}

.dark .card {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.09);
}

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
}

.text-info {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  font-size: 12px;
  color: #888;
}

.config-section {
  display: flex;
  gap: 28px;
  flex-wrap: wrap;
  align-items: flex-end;
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

.toolbar {
  display: flex;
  gap: 12px;
}

.preview img {
  max-width: 100%;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.dark .preview img {
  border-color: rgba(255, 255, 255, 0.09);
}
</style>
