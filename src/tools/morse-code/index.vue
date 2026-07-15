<template>
  <div class="morse-code">
    <n-alert type="info" class="mb-4">
      摩斯密码用点（·）和划（—）表示字母与数字。中文编码时先转为 Unicode 编码再进行编码。
    </n-alert>

    <div class="toolbar">
      <n-space>
        <n-button type="primary" @click="encode">编码 →</n-button>
        <n-button type="primary" @click="decode">← 解码</n-button>
        <n-button @click="clearAll">清空</n-button>
      </n-space>
      <n-space>
        <n-radio-group v-model:value="symbolStyle" size="small">
          <n-radio-button value="dot">· —</n-radio-button>
          <n-radio-button value="symbol">. -</n-radio-button>
        </n-radio-group>
      </n-space>
    </div>

    <div class="editor-area">
      <div class="editor-pane">
        <div class="pane-label">原文</div>
        <n-input
          v-model:value="text"
          type="textarea"
          placeholder="输入文本，如：HELLO WORLD 或 你好"
          rows="10"
          :autosize="false"
        />
      </div>
      <div class="editor-pane">
        <div class="pane-label">摩斯密码</div>
        <n-input
          v-model:value="result"
          type="textarea"
          placeholder="编码/解码结果"
          rows="10"
          :autosize="false"
        />
      </div>
    </div>

    <n-alert type="error" v-if="errorMsg" class="mt-4" closable @close="errorMsg = ''">
      {{ errorMsg }}
    </n-alert>

    <div class="card mt-4" v-if="result">
      <h3 class="text-sm font-bold mb-3">音频播放</h3>
      <n-space align="center">
        <n-button type="primary" @click="playMorse" :loading="playing">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg></span>
          播放
        </n-button>
        <n-button @click="stopMorse" :disabled="!playing">停止</n-button>
        <span class="text-sm text-gray-500">速度：{{ speed }}ms / 单位</span>
        <n-slider v-model:value="speed" :min="50" :max="500" :step="50" style="width: 200px" />
      </n-space>
    </div>

    <div class="card mt-4">
      <h3 class="text-sm font-bold mb-3">摩斯密码对照表</h3>
      <div class="morse-table">
        <div v-for="(item, index) in morseTable" :key="index" class="morse-item">
          <span class="char">{{ item.char }}</span>
          <span class="code">{{ item.code }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NButton, NSpace, NInput, NAlert, NRadioGroup, NRadioButton, NSlider } from 'naive-ui'

const text = ref('')
const result = ref('')
const errorMsg = ref('')
const symbolStyle = ref<'dot' | 'symbol'>('symbol')
const speed = ref(150)
const playing = ref(false)

// 摩斯密码映射表（点· 划—）
const morseMap: Record<string, string> = {
  A: '·—', B: '—···', C: '—·—·', D: '—··', E: '·',
  F: '··—·', G: '——·', H: '····', I: '··', J: '·———',
  K: '—·—', L: '·—··', M: '——', N: '—·', O: '———',
  P: '·——·', Q: '——·—', R: '·—·', S: '···', T: '—',
  U: '··—', V: '···—', W: '·——', X: '—··—', Y: '—·——',
  Z: '——··',
  '0': '—————', '1': '·————', '2': '··———', '3': '···——',
  '4': '····—', '5': '·····', '6': '—····', '7': '——···',
  '8': '———··', '9': '————·',
  '.': '·—·—·—', ',': '——··——', '?': '··——··',
  "'": '·————·', '!': '—·——·—', '/': '—··—·',
  '(': '—·——·', ')': '—·——·—', '&': '·—···',
  ':': '———···', ';': '—·—·—·', '=': '—···—',
  '+': '·—·—·', '-': '—····—', '_': '··——·—',
  '"': '·—··—·', '$': '···—··—', '@': '·——·—·',
}

// 反向映射
const reverseMorseMap: Record<string, string> = {}
Object.entries(morseMap).forEach(([char, code]) => {
  reverseMorseMap[code] = char
})

// 对照表数据
const morseTable = computed(() => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  return chars.split('').map(c => ({
    char: c,
    code: morseMap[c] || '',
  }))
})

// 转换符号样式
function formatCode(code: string): string {
  if (symbolStyle.value === 'symbol') {
    return code.replace(/·/g, '.').replace(/—/g, '-')
  }
  return code
}

function parseCode(code: string): string {
  // 统一转换为 · 和 —
  return code.replace(/\./g, '·').replace(/-/g, '—').trim()
}

function encode() {
  errorMsg.value = ''
  try {
    const input = text.value.toUpperCase()
    const words = input.split(/\s+/)

    const encodedWords = words.map(word => {
      return Array.from(word).map(ch => {
        // 中文：先转 Unicode 编码
        if (/[\u4e00-\u9fa5]/.test(ch)) {
          const code = ch.charCodeAt(0)
          // 将 Unicode 码转为数字串后逐位编码
          const digits = code.toString(10)
          return digits.split('').map(d => formatCode(morseMap[d] || '')).join(' ') + '  #  '
        }
        // 英文/数字/标点
        if (morseMap[ch]) {
          return formatCode(morseMap[ch])
        }
        // 未知字符跳过
        return ''
      }).filter(Boolean).join(' ')
    })

    result.value = encodedWords.join(' / ')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    errorMsg.value = '编码失败：' + msg
  }
}

function decode() {
  errorMsg.value = ''
  try {
    const input = text.value.trim()
    const words = input.split(/\s*\/\s*/)
    const decodedWords = words.map(word => {
      const codes = word.trim().split(/\s+/)
      let decoded = ''
      let buffer = ''

      for (const code of codes) {
        if (code === '#') {
          // 中文 Unicode 标记，将 buffer 中的数字解码为字符
          if (buffer) {
            decoded += String.fromCharCode(parseInt(buffer, 10))
            buffer = ''
          }
        } else if (/^\d+$/.test(code)) {
          // 纯数字，可能是中文 Unicode 的组成部分
          buffer += code
        } else {
          // 如果有缓冲的数字，先解码
          if (buffer) {
            decoded += String.fromCharCode(parseInt(buffer, 10))
            buffer = ''
          }
          const normalized = parseCode(code)
          decoded += reverseMorseMap[normalized] || '?'
        }
      }
      // 处理剩余 buffer
      if (buffer) {
        decoded += String.fromCharCode(parseInt(buffer, 10))
      }
      return decoded
    })

    result.value = decodedWords.join(' ')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    errorMsg.value = '解码失败：' + msg
  }
}

function clearAll() {
  text.value = ''
  result.value = ''
  errorMsg.value = ''
}

// 音频播放
let audioContext: AudioContext | null = null
let timer: number | null = null

function playMorse() {
  if (!result.value) return
  stopMorse()

  try {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    playing.value = true

    const normalized = result.value.replace(/\./g, '·').replace(/-/g, '—')
    const symbols = normalized.split('')
    let time = audioContext.currentTime

    const playSymbol = (symbol: string) => {
      const duration = symbol === '·' ? speed.value : speed.value * 3
      const osc = audioContext!.createOscillator()
      const gain = audioContext!.createGain()
      osc.frequency.value = 600
      gain.gain.setValueAtTime(0, time)
      gain.gain.linearRampToValueAtTime(0.3, time + 5)
      gain.gain.setValueAtTime(0.3, time + duration - 5)
      gain.gain.linearRampToValueAtTime(0, time + duration)
      osc.connect(gain)
      gain.connect(audioContext!.destination)
      osc.start(time)
      osc.stop(time + duration)
      time += duration + speed.value
    }

    for (const symbol of symbols) {
      if (symbol === '·' || symbol === '—') {
        playSymbol(symbol)
      } else if (symbol === ' ') {
        time += speed.value
      } else if (symbol === '/') {
        time += speed.value * 3
      }
    }

    const totalTime = (time - audioContext.currentTime) * 1000
    timer = window.setTimeout(() => {
      playing.value = false
    }, totalTime)
  } catch (e: unknown) {
    errorMsg.value = '音频播放失败：浏览器不支持 Web Audio API'
    playing.value = false
  }
}

function stopMorse() {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  if (audioContext) {
    audioContext.close()
    audioContext = null
  }
  playing.value = false
}
</script>

<style scoped>
.morse-code {
  max-width: 1000px;
  margin: 0 auto;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}

.editor-area {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.morse-table {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
}

.morse-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  border-radius: 6px;
  background: #f5f5f5;
  font-family: 'Fira Code', 'Consolas', monospace;
}

.dark .morse-item {
  background: #1e2a4a;
}

.morse-item .char {
  font-weight: 700;
  font-size: 14px;
  margin-bottom: 4px;
}

.morse-item .code {
  font-size: 12px;
  color: #36ad6a;
}

.dark .morse-item .code {
  color: #63e2b7;
}

@media (max-width: 768px) {
  .editor-area {
    grid-template-columns: 1fr;
  }
}
</style>
