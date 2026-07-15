<template>
  <div class="tts-audio-synth">
    <n-alert type="info" class="mb-4">
      基于 Web Speech API（SpeechSynthesis）在浏览器本地合成语音。
    </n-alert>

    <n-alert type="warning" class="mb-4" v-if="!canRecord">
      注意：SpeechSynthesis API 不支持直接导出音频文件。本工具通过 getDisplayMedia 捕获标签页音频并使用 MediaRecorder 录制为 WebM。录制时请在弹窗中选择"当前标签页"并勾选"分享标签页音频"。
    </n-alert>

    <div class="card mb-4">
      <div class="pane-label mb-2">文本内容</div>
      <n-input
        v-model:value="text"
        type="textarea"
        placeholder="输入要合成的文本，如：你好，欢迎使用 TTS 音频合成工具。"
        rows="6"
      />
      <div class="text-info mt-2">
        <span>字符数：{{ text.length }}</span>
        <span v-if="estimatedDuration">预计时长：约 {{ estimatedDuration }} 秒</span>
      </div>
    </div>

    <div class="card mb-4">
      <h3 class="text-sm font-bold mb-3">语音设置</h3>

      <div class="config-section">
        <div class="config-item">
          <label>语言</label>
          <n-select
            v-model:value="lang"
            :options="langOptions"
            style="width: 240px"
            placeholder="选择语言"
          />
        </div>

        <div class="config-item">
          <label>语音</label>
          <n-select
            v-model:value="voiceURI"
            :options="voiceOptions"
            style="width: 280px"
            placeholder="选择语音"
            :disabled="voices.length === 0"
          />
        </div>
      </div>

      <div class="config-section mt-4">
        <div class="config-item">
          <label>语速：{{ rate.toFixed(1) }}x</label>
          <n-slider v-model:value="rate" :min="0.5" :max="2" :step="0.1" style="width: 200px" />
        </div>

        <div class="config-item">
          <label>音调：{{ pitch.toFixed(1) }}</label>
          <n-slider v-model:value="pitch" :min="0" :max="2" :step="0.1" style="width: 200px" />
        </div>

        <div class="config-item">
          <label>音量：{{ Math.round(volume * 100) }}%</label>
          <n-slider v-model:value="volume" :min="0" :max="1" :step="0.1" style="width: 200px" />
        </div>
      </div>
    </div>

    <div class="toolbar mb-4">
      <n-space>
        <n-button type="primary" @click="speak" :disabled="!text.trim() || speaking">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg></span>
          播放
        </n-button>
        <n-button @click="pause" :disabled="!speaking || paused">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg></span>
          暂停
        </n-button>
        <n-button @click="resume" :disabled="!paused">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg></span>
          继续
        </n-button>
        <n-button @click="stop" :disabled="!speaking">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="2"/></svg></span>
          停止
        </n-button>
        <n-button
          type="primary"
          ghost
          @click="recordAndExport"
          :loading="recording"
          :disabled="recording || !canRecord"
        >
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg></span>
          录制并导出
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
        当前浏览器不支持 Web Speech API，请使用 Chrome、Edge 或 Safari 浏览器。
      </n-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  NButton,
  NSpace,
  NInput,
  NSelect,
  NSlider,
  NAlert,
  useMessage,
} from 'naive-ui'

const message = useMessage()
const supported = ref(typeof window !== 'undefined' && 'speechSynthesis' in window)
// 录制需要 getDisplayMedia 与 MediaRecorder
const canRecord = ref(
  typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getDisplayMedia === 'function' &&
    typeof window.MediaRecorder !== 'undefined',
)

const text = ref('你好，欢迎使用 TTS 音频合成工具。可以在此输入任意文本进行语音合成与录制。')
const lang = ref('zh-CN')
const voiceURI = ref('')
const rate = ref(1)
const pitch = ref(1)
const volume = ref(1)

const voices = ref<SpeechSynthesisVoice[]>([])
const speaking = ref(false)
const paused = ref(false)
const recording = ref(false)
const statusMsg = ref('')
const statusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

// 常用语言选项
const langOptions = [
  { label: '中文（简体）', value: 'zh-CN' },
  { label: '中文（繁体）', value: 'zh-TW' },
  { label: '中文（香港）', value: 'zh-HK' },
  { label: '英语（美国）', value: 'en-US' },
  { label: '英语（英国）', value: 'en-GB' },
  { label: '日语', value: 'ja-JP' },
  { label: '韩语', value: 'ko-KR' },
  { label: '法语', value: 'fr-FR' },
  { label: '德语', value: 'de-DE' },
  { label: '西班牙语', value: 'es-ES' },
  { label: '俄语', value: 'ru-RU' },
  { label: '意大利语', value: 'it-IT' },
]

// 根据语言筛选可用语音
const voiceOptions = computed(() => {
  return voices.value
    .filter((v) => v.lang.startsWith(lang.value.split('-')[0]))
    .map((v) => ({
      label: `${v.name} (${v.lang})`,
      value: v.voiceURI,
    }))
})

// 预计时长（按平均每分钟 150 词计算）
const estimatedDuration = computed(() => {
  if (!text.value.trim()) return 0
  const isChinese = /[\u4e00-\u9fa5]/.test(text.value)
  const count = isChinese
    ? text.value.replace(/[^\u4e00-\u9fa5]/g, '').length
    : text.value.split(/\s+/).filter(Boolean).length
  return Math.round(((count / (isChinese ? 250 : 150)) * 60) / rate.value)
})

let utterance: SpeechSynthesisUtterance | null = null
let mediaRecorder: MediaRecorder | null = null
let displayStream: MediaStream | null = null
let chunks: Blob[] = []

function loadVoices() {
  if (!supported.value) return
  voices.value = window.speechSynthesis.getVoices()
  if (!voiceURI.value && voiceOptions.value.length > 0) {
    voiceURI.value = voiceOptions.value[0].value
  }
}

// 合成语音播放
function speak() {
  if (!supported.value || !text.value.trim()) return
  window.speechSynthesis.cancel()

  utterance = new SpeechSynthesisUtterance(text.value)
  utterance.lang = lang.value
  utterance.rate = rate.value
  utterance.pitch = pitch.value
  utterance.volume = volume.value

  const selectedVoice = voices.value.find((v) => v.voiceURI === voiceURI.value)
  if (selectedVoice) utterance.voice = selectedVoice

  utterance.onstart = () => {
    speaking.value = true
    paused.value = false
    if (!recording.value) {
      statusMsg.value = '正在朗读...'
      statusType.value = 'success'
    }
  }
  utterance.onend = () => {
    speaking.value = false
    paused.value = false
    // 录制模式：朗读结束后停止录制
    if (recording.value && mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
    } else {
      statusMsg.value = '朗读完成'
      statusType.value = 'info'
    }
  }
  utterance.onerror = (e) => {
    speaking.value = false
    paused.value = false
    statusMsg.value = '朗读出错：' + (e.error || '未知错误')
    statusType.value = 'error'
    if (recording.value && mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
    }
  }

  window.speechSynthesis.speak(utterance)
}

function pause() {
  if (!supported.value || !speaking.value) return
  window.speechSynthesis.pause()
  paused.value = true
  statusMsg.value = '已暂停'
  statusType.value = 'info'
}

function resume() {
  if (!supported.value || !paused.value) return
  window.speechSynthesis.resume()
  paused.value = false
  statusMsg.value = '继续朗读...'
  statusType.value = 'success'
}

function stop() {
  if (!supported.value) return
  window.speechSynthesis.cancel()
  speaking.value = false
  paused.value = false
  statusMsg.value = '已停止'
  statusType.value = 'info'
}

// 录制标签页音频并导出
async function recordAndExport() {
  if (!canRecord.value || !text.value.trim()) return
  if (!supported.value) {
    message.error('当前浏览器不支持语音合成')
    return
  }

  try {
    statusMsg.value = '请在弹窗中选择"当前标签页"并勾选"分享标签页音频"'
    statusType.value = 'info'

    // 请求捕获标签页音频（需同时请求视频，多数浏览器要求视频才能共享音频）
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    })
    const audioTracks = stream.getAudioTracks()
    if (audioTracks.length === 0) {
      stream.getTracks().forEach((t) => t.stop())
      statusMsg.value = '未捕获到音频，请确保勾选了"分享标签页音频"'
      statusType.value = 'error'
      return
    }

    displayStream = stream
    const audioStream = new MediaStream(audioTracks)

    // 选择支持的编码格式
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ]
    const mimeType = mimeTypes.find((t) => MediaRecorder.isTypeSupported(t)) || ''
    mediaRecorder = new MediaRecorder(audioStream, mimeType ? { mimeType } : undefined)
    chunks = []

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType || 'audio/webm' })
      const ext = (mimeType || 'audio/webm').includes('mp4') ? 'm4a' : 'webm'
      downloadBlob(blob, `tts_${Date.now()}.${ext}`)
      // 释放屏幕共享流
      displayStream?.getTracks().forEach((t) => t.stop())
      displayStream = null
      mediaRecorder = null
      recording.value = false
      statusMsg.value = '录制完成，已导出音频文件'
      statusType.value = 'success'
    }

    recording.value = true
    mediaRecorder.start()
    statusMsg.value = '录制中，即将开始朗读...'
    statusType.value = 'info'

    // 监听用户手动停止屏幕共享
    audioTracks[0].addEventListener('ended', () => {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop()
      }
    })

    // 开始朗读（utterance.onend 会触发停止录制）
    window.speechSynthesis.cancel()
    utterance = new SpeechSynthesisUtterance(text.value)
    utterance.lang = lang.value
    utterance.rate = rate.value
    utterance.pitch = pitch.value
    utterance.volume = volume.value
    const selectedVoice = voices.value.find((v) => v.voiceURI === voiceURI.value)
    if (selectedVoice) utterance.voice = selectedVoice

    utterance.onstart = () => {
      speaking.value = true
      paused.value = false
    }
    utterance.onend = () => {
      speaking.value = false
      paused.value = false
      // 延迟一点确保尾音被录制
      setTimeout(() => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop()
        }
      }, 500)
    }
    utterance.onerror = (e) => {
      speaking.value = false
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop()
      }
      statusMsg.value = '朗读出错：' + (e.error || '未知错误')
      statusType.value = 'error'
    }

    window.speechSynthesis.speak(utterance)
  } catch (err) {
    recording.value = false
    if ((err as Error).name === 'NotAllowedError') {
      statusMsg.value = '已取消录制授权'
      statusType.value = 'warning'
    } else {
      statusMsg.value = '录制失败：' + (err as Error).message
      statusType.value = 'error'
    }
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

watch(lang, () => {
  voiceURI.value = ''
  loadVoices()
})

onMounted(() => {
  if (!supported.value) return
  loadVoices()
  window.speechSynthesis.onvoiceschanged = loadVoices
})

onUnmounted(() => {
  if (supported.value) window.speechSynthesis.cancel()
  if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop()
  if (displayStream) displayStream.getTracks().forEach((t) => t.stop())
})
</script>

<style scoped>
.tts-audio-synth {
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
  font-size: 12px;
  color: #888;
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

.toolbar {
  display: flex;
  gap: 12px;
}
</style>
