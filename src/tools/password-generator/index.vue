<template>
  <div class="password-generator">
    <div class="card mb-4">
      <div class="config-section">
        <div class="config-item">
          <label>密码长度</label>
          <n-input-number v-model:value="length" :min="4" :max="128" class="w-40" />
        </div>
        <div class="config-item">
          <label>生成数量</label>
          <n-input-number v-model:value="count" :min="1" :max="20" class="w-40" />
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
          <n-checkbox v-model:checked="includeSymbols">包含特殊符号 (!@#$%)</n-checkbox>
        </div>
      </div>

      <div class="flex items-center gap-2 mt-4">
        <n-button type="primary" @click="generate">生成密码</n-button>
        <n-button @click="copyAll" :disabled="passwords.length === 0">复制全部</n-button>
        <n-button @click="clearAll">清空</n-button>
      </div>
    </div>

    <div class="card" v-if="passwords.length > 0">
      <div class="pane-label mb-2">生成结果</div>
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
import { ref } from 'vue'
import { NInputNumber, NCheckbox, NButton, NTag, NEmpty, useMessage } from 'naive-ui'

const message = useMessage()
const length = ref(16)
const count = ref(5)
const includeUppercase = ref(true)
const includeLowercase = ref(true)
const includeNumbers = ref(true)
const includeSymbols = ref(true)
const passwords = ref<string[]>([])

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz'
const NUMBERS = '0123456789'
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?'

function generate() {
  let charset = ''
  if (includeUppercase.value) charset += UPPERCASE
  if (includeLowercase.value) charset += LOWERCASE
  if (includeNumbers.value) charset += NUMBERS
  if (includeSymbols.value) charset += SYMBOLS

  if (!charset) {
    message.warning('请至少选择一种字符类型')
    return
  }

  const result: string[] = []
  for (let i = 0; i < count.value; i++) {
    let password = ''
    const array = new Uint32Array(length.value)
    crypto.getRandomValues(array)
    for (let j = 0; j < length.value; j++) {
      password += charset[array[j] % charset.length]
    }
    result.push(password)
  }
  passwords.value = result
}

function getStrengthType(pwd: string): 'error' | 'warning' | 'success' {
  let score = 0
  if (pwd.length >= 8) score++
  if (pwd.length >= 12) score++
  if (pwd.length >= 16) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[a-z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++

  if (score <= 3) return 'error'
  if (score <= 5) return 'warning'
  return 'success'
}

function getStrengthLabel(pwd: string): string {
  let score = 0
  if (pwd.length >= 8) score++
  if (pwd.length >= 12) score++
  if (pwd.length >= 16) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[a-z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++

  if (score <= 3) return '弱'
  if (score <= 5) return '中'
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

.config-item label {
  font-size: 14px;
  font-weight: 500;
  min-width: 80px;
}

.options-section {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.password-list {
  max-height: 400px;
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
</style>
