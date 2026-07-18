<template>
  <div class="password-generator">
    <div class="card mb-4">
      <n-tabs v-model:value="mode" type="line" animated class="mb-4">
        <n-tab-pane name="random" tab="随机密码">
          <div class="config-section">
            <div class="config-item">
              <label>密码长度</label>
              <n-input-number v-model:value="length" :min="4" :max="128" class="w-40" />
            </div>
            <div class="config-item">
              <label>生成数量</label>
              <n-input-number v-model:value="count" :min="1" :max="50" class="w-40" />
            </div>
          </div>

          <div class="options-section mt-4">
            <div class="option-item">
              <n-checkbox v-model:checked="includeUppercase">包含大写字母 (A-Z)</n-checkbox>
            </div>
            <div class="option-item">
              <n-checkbox v-model:checked="includeLowercase">包含小写字母 (a-z)</n-checkbox>
            </div>
            <div class="option-item">
              <n-checkbox v-model:checked="includeNumbers">包含数字 (0-9)</n-checkbox>
            </div>
            <div class="option-item">
              <n-checkbox v-model:checked="includeSymbols">包含特殊符号</n-checkbox>
            </div>
            <div class="option-item">
              <n-checkbox v-model:checked="excludeAmbiguous">排除易混淆字符 (0O1lI)</n-checkbox>
            </div>
            <div class="option-item">
              <n-checkbox v-model:checked="requireEachType">确保每种选中类型至少一个</n-checkbox>
            </div>
          </div>

          <div class="custom-symbols mt-4" v-if="includeSymbols">
            <label>自定义符号集</label>
            <n-input v-model:value="customSymbols" placeholder="例如：!@#$%^&*" />
          </div>
        </n-tab-pane>

        <n-tab-pane name="passphrase" tab="口令短语">
          <div class="config-section">
            <div class="config-item">
              <label>单词数量</label>
              <n-input-number v-model:value="wordCount" :min="3" :max="12" class="w-40" />
            </div>
            <div class="config-item">
              <label>生成数量</label>
              <n-input-number v-model:value="count" :min="1" :max="50" class="w-40" />
            </div>
          </div>
          <div class="options-section mt-4">
            <div class="option-item">
              <n-checkbox v-model:checked="passphraseCapitalize">每个单词首字母大写</n-checkbox>
            </div>
            <div class="option-item">
              <n-checkbox v-model:checked="passphraseIncludeNumber">末尾追加随机数字</n-checkbox>
            </div>
            <div class="option-item">
              <n-checkbox v-model:checked="passphraseSeparatorCustom">自定义分隔符</n-checkbox>
            </div>
          </div>
          <div class="custom-symbols mt-4" v-if="passphraseSeparatorCustom">
            <label>分隔符</label>
            <n-input v-model:value="passphraseSeparator" placeholder="例如：- 或 _" />
          </div>
        </n-tab-pane>
      </n-tabs>

      <div class="flex items-center gap-2 mt-4">
        <n-button type="primary" @click="generate">生成密码</n-button>
        <n-button @click="copyAll" :disabled="passwords.length === 0">复制全部</n-button>
        <n-button @click="clearAll">清空</n-button>
      </div>
    </div>

    <div class="card" v-if="passwords.length > 0">
      <div class="pane-label mb-2">生成结果（平均熵: {{ averageEntropy.toFixed(1) }} bits）</div>
      <div class="password-list">
        <div v-for="(pwd, index) in passwords" :key="index" class="password-item">
          <span class="password-index text-gray-400">{{ index + 1 }}.</span>
          <span class="password-value font-mono">{{ pwd }}</span>
          <div class="password-strength">
            <n-tag :type="getStrengthType(pwd)" size="small">
              {{ getStrengthLabel(pwd) }}
            </n-tag>
          </div>
          <n-button text size="tiny" @click="copyOne(pwd)">复制</n-button>
        </div>
      </div>
    </div>

    <div class="card mt-4" v-else>
      <n-empty description="配置选项后点击生成按钮" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NInputNumber, NCheckbox, NButton, NTag, NEmpty, NTabs, NTabPane, NInput, useMessage } from 'naive-ui'

const message = useMessage()
const mode = ref<'random' | 'passphrase'>('random')
const length = ref(16)
const count = ref(5)
const wordCount = ref(5)
const includeUppercase = ref(true)
const includeLowercase = ref(true)
const includeNumbers = ref(true)
const includeSymbols = ref(true)
const excludeAmbiguous = ref(false)
const requireEachType = ref(true)
const customSymbols = ref('!@#$%^&*()_+-=[]{}|;:,.<>?')
const passphraseCapitalize = ref(true)
const passphraseIncludeNumber = ref(true)
const passphraseSeparatorCustom = ref(false)
const passphraseSeparator = ref('-')
const passwords = ref<string[]>([])

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz'
const NUMBERS = '0123456789'
const AMBIGUOUS = '0O1lI'

const WORD_LIST = [
  'apple', 'river', 'mountain', 'ocean', 'forest', 'thunder', 'silent', 'rapid',
  'bright', 'shadow', 'crystal', 'dragon', 'eagle', 'falcon', 'garden', 'harbor',
  'island', 'jungle', 'knight', 'lemon', 'meadow', 'nebula', 'oracle', 'phoenix',
  'quartz', 'rocket', 'sunset', 'tiger', 'unicorn', 'valley', 'wizard', 'zenith',
  'amber', 'brave', 'cosmic', 'diamond', 'emerald', 'frozen', 'golden', 'hidden',
  'iron', 'jade', 'keen', 'lunar', 'misty', 'noble', 'obsidian', 'polar',
  'quiet', 'ruby', 'solar', 'timber', 'urban', 'vivid', 'wild', 'young',
]

const averageEntropy = computed(() => {
  if (passwords.value.length === 0) return 0
  return passwords.value.reduce((sum, pwd) => sum + calculateEntropy(pwd), 0) / passwords.value.length
})

function getCharset(): string {
  let charset = ''
  if (includeUppercase.value) charset += UPPERCASE
  if (includeLowercase.value) charset += LOWERCASE
  if (includeNumbers.value) charset += NUMBERS
  if (includeSymbols.value) charset += customSymbols.value || '!@#$%^&*()_+-=[]{}|;:,.<>?'

  if (excludeAmbiguous.value) {
    for (const ch of AMBIGUOUS) {
      charset = charset.replace(ch, '')
    }
  }
  return charset
}

function ensureEachType(pwd: string): string {
  const required: string[] = []
  if (includeUppercase.value) required.push(pickRandom(UPPERCASE.replace(excludeAmbiguous.value ? /[OI]/g : '', '')))
  if (includeLowercase.value) required.push(pickRandom(LOWERCASE.replace(excludeAmbiguous.value ? /[l]/g : '', '')))
  if (includeNumbers.value) required.push(pickRandom(NUMBERS.replace(excludeAmbiguous.value ? /[01]/g : '', '')))
  if (includeSymbols.value) required.push(pickRandom(customSymbols.value || '!@#$%^&*()_+-=[]{}|;:,.<>?'))

  if (required.length === 0) return pwd

  const arr = pwd.split('')
  for (let i = 0; i < required.length; i++) {
    arr[i] = required[i]
  }
  return shuffle(arr).join('')
}

function pickRandom(str: string): string {
  if (!str) return ''
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return str[array[0] % str.length]
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function generateRandomPassword(charset: string, len: number): string {
  const array = new Uint32Array(len)
  crypto.getRandomValues(array)
  let password = ''
  for (let j = 0; j < len; j++) {
    password += charset[array[j] % charset.length]
  }
  return requireEachType.value ? ensureEachType(password) : password
}

function generatePassphrase(): string {
  const sep = passphraseSeparatorCustom.value ? passphraseSeparator.value : '-'
  const words: string[] = []
  const array = new Uint32Array(wordCount.value)
  crypto.getRandomValues(array)
  for (let i = 0; i < wordCount.value; i++) {
    let word = WORD_LIST[array[i] % WORD_LIST.length]
    if (passphraseCapitalize.value) {
      word = word.charAt(0).toUpperCase() + word.slice(1)
    }
    words.push(word)
  }
  let result = words.join(sep)
  if (passphraseIncludeNumber.value) {
    const numArray = new Uint32Array(1)
    crypto.getRandomValues(numArray)
    result += sep + (numArray[0] % 1000)
  }
  return result
}

function generate() {
  passwords.value = []

  if (mode.value === 'random') {
    const charset = getCharset()
    if (!charset) {
      message.warning('请至少选择一种字符类型')
      return
    }
    if (requireEachType.value) {
      const requiredCount = [includeUppercase.value, includeLowercase.value, includeNumbers.value, includeSymbols.value].filter(Boolean).length
      if (length.value < requiredCount) {
        message.warning(`密码长度至少为 ${requiredCount} 才能包含所有选中类型`)
        return
      }
    }
    for (let i = 0; i < count.value; i++) {
      passwords.value.push(generateRandomPassword(charset, length.value))
    }
  }
  else {
    for (let i = 0; i < count.value; i++) {
      passwords.value.push(generatePassphrase())
    }
  }
}

function calculateEntropy(pwd: string): number {
  let pool = 0
  if (/[A-Z]/.test(pwd)) pool += 26
  if (/[a-z]/.test(pwd)) pool += 26
  if (/[0-9]/.test(pwd)) pool += 10
  if (/[^A-Za-z0-9]/.test(pwd)) pool += 32
  if (/[A-Za-z0-9\-]/.test(pwd) && pool === 0) pool = 36
  if (pool === 0) pool = 26
  return Math.log2(Math.pow(pool, pwd.length))
}

function getStrengthType(pwd: string): 'error' | 'warning' | 'success' {
  const entropy = calculateEntropy(pwd)
  if (entropy < 40) return 'error'
  if (entropy < 70) return 'warning'
  return 'success'
}

function getStrengthLabel(pwd: string): string {
  const entropy = calculateEntropy(pwd)
  if (entropy < 40) return '弱'
  if (entropy < 70) return '中'
  return '强'
}

function copyOne(pwd: string) {
  navigator.clipboard.writeText(pwd)
  message.success('已复制')
}

function copyAll() {
  navigator.clipboard.writeText(passwords.value.join('\n'))
  message.success('已复制全部')
}

function clearAll() {
  passwords.value = []
}
</script>

<style scoped>
.config-section {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.config-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.config-item label,
.custom-symbols label {
  font-size: 14px;
  font-weight: 500;
  min-width: 80px;
}

.custom-symbols {
  display: flex;
  align-items: center;
  gap: 12px;
}

.custom-symbols .n-input {
  flex: 1;
}

.options-section {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

.password-list {
  max-height: 500px;
  overflow-y: auto;
}

.password-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.password-item:hover {
  background: rgba(0, 0, 0, 0.04);
}

.dark .password-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.password-index {
  width: 30px;
  text-align: right;
  flex-shrink: 0;
  font-size: 12px;
}

.password-value {
  flex: 1;
  font-size: 14px;
  word-break: break-all;
}

.password-strength {
  flex-shrink: 0;
}

.flex {
  display: flex;
}

.items-center {
  align-items: center;
}

.gap-2 {
  gap: 8px;
}

.mt-4 {
  margin-top: 16px;
}

.mb-4 {
  margin-bottom: 16px;
}

.w-40 {
  width: 160px;
}

.text-gray-400 {
  color: #999;
}

.font-mono {
  font-family: 'Fira Code', 'Consolas', monospace;
}
</style>
