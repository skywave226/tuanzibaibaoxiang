<template>
  <div class="text-to-speech">
    <n-alert type="info" class="mb-4">
      基于 Web Speech API，语音合成在浏览器本地完成，无需联网。
    </n-alert>

    <div class="card mb-4">
      <div class="pane-label mb-2">文本内容</div>
      <n-input
        v-model:value="text"
        type="textarea"
        placeholder="输入要朗读的文本，如：你好，欢迎使用文本转语音工具。"
        rows="6"
        :autosize="false"
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

    <div class="toolbar">
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
import { NButton, NSpace, NInput, NSelect, NSlider, NAlert } from 'naive-ui'

const supported = ref(typeof window !== 'undefined' && 'speechSynthesis' in window)

const text = ref('你好，欢迎使用文本转语音工具。可以在此输入任意文本进行朗读。')
const lang = ref('zh-CN')
const voiceURI = ref('')
const rate = ref(1)
const pitch = ref(1)
const volume = ref(1)

const voices = ref<SpeechSynthesisVoice[]>([])
const speaking = ref(false)
const paused = ref(false)
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
  { label: '葡萄牙语', value: 'pt-PT' },
  { label: '阿拉伯语', value: 'ar-SA' },
]

// 根据语言筛选可用语音
const voiceOptions = computed(() => {
  return voices.value
    .filter(v => v.lang.startsWith(lang.value.split('-')[0]))
    .map(v => ({
      label: `${v.name} (${v.lang})`,
      value: v.voiceURI,
    }))
})

// 预计时长（按平均每分钟 150 词计算）
const estimatedDuration = computed(() => {
  if (!text.value.trim()) return 0
  // 中文按字符数，英文按单词数估算
  const isChinese = /[\u4e00-\u9fa5]/.test(text.value)
  const count = isChinese
    ? text.value.replace(/[^\u4e00-\u9fa5]/g, '').length
    : text.value.split(/\s+/).filter(Boolean).length
  const seconds = Math.round((count / (isChinese ? 250 : 150)) * 60 / rate.value)
  return seconds
})

let utterance: SpeechSynthesisUtterance | null = null

function loadVoices() {
  if (!supported.value) return
  voices.value = window.speechSynthesis.getVoices()
  // 默认选择当前语言的第一个语音
  if (!voiceURI.value && voiceOptions.value.length > 0) {
    voiceURI.value = voiceOptions.value[0].value
  }
}

function speak() {
  if (!supported.value || !text.value.trim()) return

  // 停止之前的朗读
  window.speechSynthesis.cancel()

  utterance = new SpeechSynthesisUtterance(text.value)
  utterance.lang = lang.value
  utterance.rate = rate.value
  utterance.pitch = pitch.value
  utterance.volume = volume.value

  // 选择语音
  const selectedVoice = voices.value.find(v => v.voiceURI === voiceURI.value)
  if (selectedVoice) {
    utterance.voice = selectedVoice
  }

  utterance.onstart = () => {
    speaking.value = true
    paused.value = false
    statusMsg.value = '正在朗读...'
    statusType.value = 'success'
  }

  utterance.onend = () => {
    speaking.value = false
    paused.value = false
    statusMsg.value = '朗读完成'
    statusType.value = 'info'
  }

  utterance.onerror = (e) => {
    speaking.value = false
    paused.value = false
    statusMsg.value = '朗读出错：' + (e.error || '未知错误')
    statusType.value = 'error'
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

// 语言切换时重置语音选择
watch(lang, () => {
  voiceURI.value = ''
  loadVoices()
})

onMounted(() => {
  if (!supported.value) return
  loadVoices()
  // 部分浏览器异步加载语音列表
  window.speechSynthesis.onvoiceschanged = loadVoices
})

onUnmounted(() => {
  if (supported.value) {
    window.speechSynthesis.cancel()
  }
})
</script>

<style scoped>
.text-to-speech {
  max-width: 900px;
  margin: 0 auto;
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
