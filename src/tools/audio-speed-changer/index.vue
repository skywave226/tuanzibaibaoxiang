<template>
  <div class="audio-speed-changer">
    <n-alert type="info" class="mb-4">
      基于 Web Audio API 实现音频变速。关闭"保持音调"时变速会同时改变音调；开启时使用重叠相加（OLA）时间拉伸算法保持原音调。导出通过 OfflineAudioContext 离线渲染。
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
      </div>
    </div>

    <div class="card mb-4" v-if="audioBuffer">
      <h3 class="text-sm font-bold mb-3">变速设置</h3>

      <div class="config-section">
        <div class="config-item">
          <label>播放速度：{{ speed.toFixed(2) }}x</label>
          <n-slider
            v-model:value="speed"
            :min="0.5"
            :max="2"
            :step="0.05"
            style="width: 260px"
          />
        </div>

        <div class="config-item">
          <label>保持音调</label>
          <n-switch v-model:value="preservePitch">
            <template #checked>开启</template>
            <template #unchecked>关闭</template>
          </n-switch>
        </div>
      </div>

      <div class="hint mt-2">
        预计输出时长：约 {{ estimatedDuration.toFixed(2) }} 秒
      </div>
    </div>

    <div class="toolbar mb-4" v-if="audioBuffer">
      <n-space>
        <n-button type="primary" @click="playPreview" :disabled="playing">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg></span>
          播放预览
        </n-button>
        <n-button @click="stopPreview" :disabled="!playing">
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
const speed = ref(1)
const preservePitch = ref(true)
const playing = ref(false)
const exporting = ref(false)
const statusMsg = ref('')
const statusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

const duration = computed(() => audioBuffer.value?.length ?? 0)
const sampleRate = computed(() => audioBuffer.value?.sampleRate ?? 0)
// 预计输出时长 = 原始时长 / 速度
const estimatedDuration = computed(() => {
  if (!audioBuffer.value) return 0
  return audioBuffer.value.duration / speed.value
})

let audioCtx: AudioContext | null = null
let currentSource: AudioBufferSourceNode | null = null

// 获取（或创建）AudioContext
function getCtx(): AudioContext {
  if (!audioCtx) {
    const Ctor =
      window.AudioContext || (window as any).webkitAudioContext
    audioCtx = new Ctor()
  }
  return audioCtx
}

// 处理上传：解码音频文件
const handleUpload = ({ file }: { file: UploadFileInfo }) => {
  if (!file.file) return
  stopPreview()
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
    } catch (err) {
      statusMsg.value = '音频解码失败，请检查文件格式'
      statusType.value = 'error'
    }
  }
  reader.readAsArrayBuffer(file.file)
}

// 重叠相加（OLA）时间拉伸：保持音调不变，改变时长
// alpha = 输出时长 / 输入时长 = 1 / speed
function timeStretch(buffer: AudioBuffer, alpha: number): AudioBuffer {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const inputLength = buffer.length
  const outputLength = Math.max(1, Math.round(inputLength * alpha))
  const ctx = getCtx()
  const out = ctx.createBuffer(numChannels, outputLength, sampleRate)

  const N = 2048 // 帧长
  const Hs = Math.floor(N / 4) // 合成步长（75% 重叠）
  const Ha = Hs / alpha // 分析步长

  // 汉宁窗
  const win = new Float32Array(N)
  for (let i = 0; i < N; i++) {
    win[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (N - 1)))
  }

  for (let ch = 0; ch < numChannels; ch++) {
    const input = buffer.getChannelData(ch)
    const output = out.getChannelData(ch)
    const norm = new Float32Array(outputLength)
    let inPos = 0
    let outPos = 0

    while (inPos + N <= inputLength && outPos + N <= outputLength) {
      const base = Math.floor(inPos)
      for (let i = 0; i < N; i++) {
        output[outPos + i] += input[base + i] * win[i]
        norm[outPos + i] += win[i]
      }
      inPos += Ha
      outPos += Hs
    }
    // 归一化重叠相加
    for (let i = 0; i < outputLength; i++) {
      if (norm[i] > 1e-6) output[i] /= norm[i]
    }
  }
  return out
}

// 播放预览
function playPreview() {
  if (!audioBuffer.value) return
  stopPreview()
  const ctx = getCtx()
  if (ctx.state === 'suspended') ctx.resume()

  let bufferToPlay = audioBuffer.value
  // 保持音调时，先用 OLA 拉伸（拉伸系数 = 1/speed），再按原速播放
  if (preservePitch.value && Math.abs(speed.value - 1) > 1e-3) {
    try {
      bufferToPlay = timeStretch(audioBuffer.value, 1 / speed.value)
    } catch (err) {
      message.error('时间拉伸处理失败')
      return
    }
  }

  const source = ctx.createBufferSource()
  source.buffer = bufferToPlay
  // 不保持音调时，直接用 playbackRate 改变速度与音调
  if (!preservePitch.value) {
    source.playbackRate.value = speed.value
  }
  source.connect(ctx.destination)
  source.onended = () => {
    playing.value = false
    currentSource = null
  }
  source.start()
  currentSource = source
  playing.value = true
  statusMsg.value = '正在播放预览...'
  statusType.value = 'info'
}

function stopPreview() {
  if (currentSource) {
    try {
      currentSource.stop()
    } catch {
      // 忽略已停止
    }
    currentSource = null
  }
  playing.value = false
}

// 通过 OfflineAudioContext 离线渲染并导出 WAV
async function exportAudio() {
  if (!audioBuffer.value) return
  exporting.value = true
  statusMsg.value = '正在离线渲染...'
  statusType.value = 'info'

  try {
    const srcBuffer = audioBuffer.value
    let renderBuffer: AudioBuffer = srcBuffer

    // 保持音调时，先按 1/speed 拉伸时长；不保持时直接用原缓冲配合 playbackRate
    if (preservePitch.value && Math.abs(speed.value - 1) > 1e-3) {
      renderBuffer = timeStretch(srcBuffer, 1 / speed.value)
    }

    // 输出时长：保持音调时为拉伸后的长度；否则按速度缩短
    const outputLength =
      preservePitch.value
        ? renderBuffer.length
        : Math.max(1, Math.round(renderBuffer.length / speed.value))

    const offlineCtx = new OfflineAudioContext(
      renderBuffer.numberOfChannels,
      outputLength,
      renderBuffer.sampleRate,
    )

    const source = offlineCtx.createBufferSource()
    source.buffer = renderBuffer
    if (!preservePitch.value) {
      // 不保持音调：用 playbackRate 加速（同时变调）
      source.playbackRate.value = speed.value
    }
    source.connect(offlineCtx.destination)
    source.start()

    const rendered = await offlineCtx.startRendering()
    const blob = audioBufferToWav(rendered)
    downloadBlob(blob, `${baseName()}_${speed.value.toFixed(2)}x.wav`)
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
  stopPreview()
  if (audioCtx) {
    audioCtx.close()
    audioCtx = null
  }
})
</script>

<style scoped>
.audio-speed-changer {
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
