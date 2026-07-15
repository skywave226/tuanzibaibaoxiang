<template>
  <div class="audio-converter">
    <n-alert type="info" class="mb-4">
      基于 Web Audio API 实现，音频解码与 WAV 编码均在浏览器本地完成。MP3 仅支持编码为 WAV（浏览器原生不支持 MP3 编码）。
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
      <h3 class="text-sm font-bold mb-3">音频信息</h3>
      <div class="info-grid">
        <div class="info-item"><label>时长</label><span>{{ durationText }}</span></div>
        <div class="info-item"><label>采样率</label><span>{{ audioBuffer.sampleRate }} Hz</span></div>
        <div class="info-item"><label>声道数</label><span>{{ audioBuffer.numberOfChannels }}</span></div>
        <div class="info-item"><label>采样数</label><span>{{ audioBuffer.length }}</span></div>
      </div>
    </div>

    <div class="card mb-4" v-if="audioBuffer">
      <h3 class="text-sm font-bold mb-3">输出设置</h3>
      <div class="config-section">
        <div class="config-item">
          <label>输出格式</label>
          <n-select
            v-model:value="outputFormat"
            :options="formatOptions"
            style="width: 240px"
          />
        </div>
        <div class="config-item">
          <label>采样率</label>
          <n-select
            v-model:value="sampleRate"
            :options="sampleRateOptions"
            style="width: 200px"
          />
        </div>
        <div class="config-item">
          <label>声道</label>
          <n-select
            v-model:value="channelCount"
            :options="channelOptions"
            style="width: 160px"
          />
        </div>
      </div>
      <div class="hint mt-2" v-if="outputFormat === 'mp3'">
        注意：浏览器原生不支持 MP3 编码，将输出 WAV 格式（扩展名仍为所选格式）。
      </div>
    </div>

    <div class="toolbar">
      <n-space>
        <n-button
          type="primary"
          @click="convert"
          :loading="converting"
          :disabled="!audioBuffer"
        >
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16V4h2M7 4l-3 3m13 9v8h-2m2 0l3-3"/></svg></span>
          开始转换
        </n-button>
        <n-button
          @click="download"
          :disabled="!resultBlob"
        >
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></span>
          下载文件
        </n-button>
        <n-button @click="reset" :disabled="converting">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg></span>
          重置
        </n-button>
      </n-space>
    </div>

    <div class="card mt-4" v-if="resultBlob">
      <div class="result-row">
        <div>
          <div class="pane-label">转换结果</div>
          <div class="result-info mt-1">
            格式：{{ resultFormat }} · 大小：{{ resultSize }}
          </div>
        </div>
        <audio :src="resultUrl" controls style="width: 100%; max-width: 480px" />
      </div>
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
import { ref, computed, onBeforeUnmount } from 'vue'
import { NUpload, NButton, NSpace, NSelect, NAlert } from 'naive-ui'
import type { UploadCustomRequestOptions } from 'naive-ui'

const fileName = ref('')
const fileSize = ref('')
const audioBuffer = ref<AudioBuffer | null>(null)
const converting = ref(false)
const resultBlob = ref<Blob | null>(null)
const resultUrl = ref('')
const resultFormat = ref('')
const resultSize = ref('')
const statusMsg = ref('')
const statusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

const outputFormat = ref<'wav' | 'mp3'>('wav')
const sampleRate = ref(44100)
const channelCount = ref(2)

const formatOptions = [
  { label: 'WAV (无损 PCM)', value: 'wav' },
  { label: 'MP3 (兼容性更好)', value: 'mp3' },
]
const sampleRateOptions = [
  { label: '44100 Hz (CD 音质)', value: 44100 },
  { label: '48000 Hz (DVD 音质)', value: 48000 },
  { label: '22050 Hz', value: 22050 },
  { label: '16000 Hz', value: 16000 },
  { label: '8000 Hz (语音)', value: 8000 },
]
const channelOptions = [
  { label: '单声道', value: 1 },
  { label: '双声道 (立体声)', value: 2 },
]

const durationText = computed(() => {
  if (!audioBuffer.value) return '0:00'
  return formatTime(audioBuffer.value.duration)
})

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

let audioCtx: AudioContext | null = null
let originalFile: File | null = null

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
    statusMsg.value = '解码完成，可进行转换'
    statusType.value = 'success'
  } catch (e) {
    statusMsg.value = '解码失败：该格式可能不被浏览器支持'
    statusType.value = 'error'
  }
}

// 将 AudioBuffer 重采样并转换为指定声道数的 AudioBuffer
function remixBuffer(buffer: AudioBuffer, targetChannels: number, targetRate: number): AudioBuffer {
  const ctx = audioCtx!
  const length = Math.ceil(buffer.length * targetRate / buffer.sampleRate)
  const out = ctx.createBuffer(targetChannels, length, targetRate)
  for (let c = 0; c < targetChannels; c++) {
    // 取源声道：若源为单声道而目标为立体声，复制到两个声道
    const srcChannel = c < buffer.numberOfChannels ? c : buffer.numberOfChannels - 1
    const src = buffer.getChannelData(srcChannel)
    const dst = out.getChannelData(c)
    // 线性重采样
    for (let i = 0; i < length; i++) {
      const pos = i * buffer.sampleRate / targetRate
      const i0 = Math.floor(pos)
      const i1 = Math.min(i0 + 1, src.length - 1)
      const frac = pos - i0
      dst[i] = src[i0] * (1 - frac) + src[i1] * frac
    }
  }
  return out
}

// 将 AudioBuffer 编码为 16 位 PCM WAV Blob
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

  // RIFF 头
  writeString(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeString(8, 'WAVE')
  // fmt 块
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 16, true) // 位深
  // data 块
  writeString(36, 'data')
  view.setUint32(40, dataSize, true)

  // 写入交错采样数据
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

async function convert() {
  if (!audioBuffer.value || !audioCtx) return
  converting.value = true
  statusMsg.value = '正在转换...'
  statusType.value = 'info'
  try {
    // 重采样与声道转换
    const remixed = remixBuffer(audioBuffer.value, channelCount.value, sampleRate.value)
    const blob = encodeWav(remixed)
    if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
    resultBlob.value = blob
    resultUrl.value = URL.createObjectURL(blob)
    resultFormat.value = outputFormat.value.toUpperCase()
    resultSize.value = formatSize(blob.size)
    statusMsg.value = '转换完成'
    statusType.value = 'success'
  } catch (e) {
    statusMsg.value = '转换失败：' + (e as Error).message
    statusType.value = 'error'
  } finally {
    converting.value = false
  }
}

function download() {
  if (!resultBlob.value) return
  const ext = outputFormat.value
  const baseName = originalFile ? originalFile.name.replace(/\.[^.]+$/, '') : 'audio'
  const a = document.createElement('a')
  a.href = resultUrl.value
  a.download = `${baseName}_converted.${ext}`
  a.click()
}

function reset() {
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
  resultBlob.value = null
  resultUrl.value = ''
  resultFormat.value = ''
  resultSize.value = ''
  audioBuffer.value = null
  fileName.value = ''
  fileSize.value = ''
  originalFile = null
  statusMsg.value = ''
}

onBeforeUnmount(() => {
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
  if (audioCtx) audioCtx.close()
})
</script>

<style scoped>
.audio-converter {
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

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item label {
  font-size: 12px;
  color: #888;
}

.info-item span {
  font-size: 15px;
  font-weight: 600;
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

.hint {
  font-size: 12px;
  color: #d97706;
}

.dark .hint {
  color: #fbbf24;
}

.toolbar {
  display: flex;
  gap: 12px;
}

.result-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
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
