<template>
  <div class="audio-noise-reduction">
    <n-alert type="info" class="mb-4">
      基于 Web Audio API 的 BiquadFilterNode（高通/低通滤波）组合实现简单降噪，并支持音量归一化。可对比原始与降噪后效果，导出 WAV。
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
      </div>
    </div>

    <div class="card mb-4" v-if="audioBuffer">
      <h3 class="text-sm font-bold mb-3">降噪参数</h3>

      <div class="config-section">
        <div class="config-item">
          <label>高通滤波截止：{{ highpassFreq }} Hz（去除低频隆隆声）</label>
          <n-slider
            v-model:value="highpassFreq"
            :min="20"
            :max="500"
            :step="10"
            style="width: 260px"
          />
        </div>

        <div class="config-item">
          <label>低通滤波截止：{{ lowpassFreq }} Hz（去除高频噪声）</label>
          <n-slider
            v-model:value="lowpassFreq"
            :min="2000"
            :max="20000"
            :step="100"
            style="width: 260px"
          />
        </div>
      </div>

      <div class="config-section mt-4">
        <div class="config-item">
          <label>音量归一化</label>
          <n-switch v-model:value="normalize">
            <template #checked>开启</template>
            <template #unchecked>关闭</template>
          </n-switch>
        </div>

        <div class="config-item" v-if="normalize">
          <label>目标音量：{{ Math.round(targetLevel * 100) }}%</label>
          <n-slider
            v-model:value="targetLevel"
            :min="0.3"
            :max="1"
            :step="0.05"
            style="width: 200px"
          />
        </div>
      </div>

      <div class="hint mt-3">
        有效频段：{{ highpassFreq }} Hz - {{ lowpassFreq }} Hz
      </div>
    </div>

    <div class="toolbar mb-4" v-if="audioBuffer">
      <n-space>
        <n-button @click="playOriginal" :disabled="playing && !playingProcessed">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg></span>
          播放原始
        </n-button>
        <n-button
          type="primary"
          @click="playProcessed"
          :disabled="playing && playingProcessed"
        >
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg></span>
          播放降噪后
        </n-button>
        <n-button @click="stop" :disabled="!playing">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="2"/></svg></span>
          停止
        </n-button>
        <n-button
          type="primary"
          ghost
          @click="exportAudio"
          :loading="exporting"
          :disabled="exporting"
        >
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></span>
          导出 WAV
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

    <div class="card mt-4" v-if="!supported">
      <n-alert type="warning">
        当前浏览器不支持 Web Audio API，请使用现代浏览器。
      </n-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import {
  NUpload,
  NButton,
  NSlider,
  NSwitch,
  NAlert,
  NSpace,
} from 'naive-ui'
import type { UploadFileInfo } from 'naive-ui'

const supported = ref(
  typeof window !== 'undefined' &&
    (window.AudioContext !== undefined || (window as any).webkitAudioContext !== undefined),
)

const fileName = ref('')
const audioBuffer = ref<AudioBuffer | null>(null)
const highpassFreq = ref(80)
const lowpassFreq = ref(12000)
const normalize = ref(true)
const targetLevel = ref(0.95)
const playing = ref(false)
const playingProcessed = ref(false)
const exporting = ref(false)
const statusMsg = ref('')
const statusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

const duration = computed(() => audioBuffer.value?.duration ?? 0)

let audioCtx: AudioContext | null = null
let currentSource: AudioBufferSourceNode | null = null

function getCtx(): AudioContext {
  if (!audioCtx) {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext
    audioCtx = new Ctor()
  }
  return audioCtx
}

const handleUpload = ({ file }: { file: UploadFileInfo }) => {
  if (!file.file) return
  stop()
  fileName.value = file.name
  const ctx = getCtx()
  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const arrayBuffer = e.target?.result as ArrayBuffer
      const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0))
      audioBuffer.value = decoded
      statusMsg.value = `解码成功：时长 ${decoded.duration.toFixed(2)} 秒`
      statusType.value = 'success'
    } catch (err) {
      statusMsg.value = '音频解码失败，请检查文件格式'
      statusType.value = 'error'
    }
  }
  reader.readAsArrayBuffer(file.file)
}

// 创建降噪处理图：高通 -> 低通 -> (可选归一化增益)
function buildGraph(ctx: AudioContext | OfflineAudioContext, buffer: AudioBuffer) {
  const source = ctx.createBufferSource()
  source.buffer = buffer

  const highpass = ctx.createBiquadFilter()
  highpass.type = 'highpass'
  highpass.frequency.value = highpassFreq.value
  highpass.Q.value = 0.7

  const lowpass = ctx.createBiquadFilter()
  lowpass.type = 'lowpass'
  lowpass.frequency.value = lowpassFreq.value
  lowpass.Q.value = 0.7

  source.connect(highpass)
  highpass.connect(lowpass)

  return { source, lowpass }
}

// 播放原始音频
function playOriginal() {
  if (!audioBuffer.value) return
  stop()
  const ctx = getCtx()
  if (ctx.state === 'suspended') ctx.resume()

  const source = ctx.createBufferSource()
  source.buffer = audioBuffer.value
  source.connect(ctx.destination)
  source.onended = () => {
    playing.value = false
    playingProcessed.value = false
    currentSource = null
  }
  source.start()
  currentSource = source
  playing.value = true
  playingProcessed.value = false
  statusMsg.value = '正在播放原始音频...'
  statusType.value = 'info'
}

// 播放降噪后音频（实时滤波 + 归一化增益）
function playProcessed() {
  if (!audioBuffer.value) return
  stop()
  const ctx = getCtx()
  if (ctx.state === 'suspended') ctx.resume()

  const { source, lowpass } = buildGraph(ctx, audioBuffer.value)

  let gainNode: GainNode | null = null
  if (normalize.value) {
    const peak = findPeak(audioBuffer.value)
    const g = peak > 1e-6 ? targetLevel.value / peak : 1
    gainNode = ctx.createGain()
    gainNode.gain.value = g
    lowpass.connect(gainNode)
    gainNode.connect(ctx.destination)
  } else {
    lowpass.connect(ctx.destination)
  }

  source.onended = () => {
    playing.value = false
    playingProcessed.value = false
    currentSource = null
  }
  source.start()
  currentSource = source
  playing.value = true
  playingProcessed.value = true
  statusMsg.value = '正在播放降噪后音频...'
  statusType.value = 'info'
}

function stop() {
  if (currentSource) {
    try {
      currentSource.stop()
    } catch {
      // 忽略已停止
    }
    currentSource = null
  }
  playing.value = false
  playingProcessed.value = false
}

// 查找音频峰值（用于归一化）
function findPeak(buffer: AudioBuffer): number {
  let peak = 0
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch)
    for (let i = 0; i < data.length; i++) {
      const v = Math.abs(data[i])
      if (v > peak) peak = v
    }
  }
  return peak
}

// 离线渲染降噪并导出 WAV
async function exportAudio() {
  if (!audioBuffer.value) return
  exporting.value = true
  statusMsg.value = '正在离线渲染...'
  statusType.value = 'info'

  try {
    const src = audioBuffer.value
    const offlineCtx = new OfflineAudioContext(
      src.numberOfChannels,
      src.length,
      src.sampleRate,
    )

    const { source, lowpass } = buildGraph(offlineCtx, src)

    if (normalize.value) {
      const peak = findPeak(src)
      const g = peak > 1e-6 ? targetLevel.value / peak : 1
      const gainNode = offlineCtx.createGain()
      gainNode.gain.value = g
      lowpass.connect(gainNode)
      gainNode.connect(offlineCtx.destination)
    } else {
      lowpass.connect(offlineCtx.destination)
    }

    source.start()
    const rendered = await offlineCtx.startRendering()
    const blob = audioBufferToWav(rendered)
    downloadBlob(blob, `${baseName()}_denoised.wav`)
    statusMsg.value = '导出成功'
    statusType.value = 'success'
  } catch (err) {
    statusMsg.value = '导出失败：' + (err as Error).message
    statusType.value = 'error'
  } finally {
    exporting.value = false
  }
}

function baseName(): string {
  const n = fileName.value || 'audio'
  return n.replace(/\.[^.]+$/, '')
}

// AudioBuffer 编码为 16-bit PCM WAV
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const bitDepth = 16
  const numSamples = buffer.length
  const bytesPerSample = bitDepth / 8
  const blockAlign = numChannels * bytesPerSample
  const byteRate = sampleRate * blockAlign
  const dataSize = numSamples * blockAlign
  const arrayBuffer = new ArrayBuffer(44 + dataSize)
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
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitDepth, true)
  writeString(36, 'data')
  view.setUint32(40, dataSize, true)

  const channels: Float32Array[] = []
  for (let i = 0; i < numChannels; i++) channels.push(buffer.getChannelData(i))

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

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

onBeforeUnmount(() => {
  stop()
  if (audioCtx) {
    audioCtx.close()
    audioCtx = null
  }
})
</script>

<style scoped>
.audio-noise-reduction {
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
  gap: 32px;
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

.hint {
  font-size: 12px;
  color: #888;
}

.toolbar {
  display: flex;
  gap: 12px;
}
</style>
