<template>
  <div class="aes-encrypt">
    <n-tabs type="segment" animated>
      <n-tab-pane name="encrypt" tab="加密">
        <n-space vertical>
          <n-input v-model:value="plainText" type="textarea" placeholder="请输入明文" :rows="4" />
          <n-input v-model:value="secretKey" placeholder="输入密码" />
          <n-select v-model:value="mode" :options="modeOptions" style="width: 160px" />
          <n-button type="primary" @click="encrypt" :disabled="!canEncrypt">加密</n-button>
          <n-input v-if="encrypted" :value="encrypted" readonly placeholder="加密结果">
            <template #suffix>
              <n-button text @click="copy(encrypted)">复制</n-button>
            </template>
          </n-input>
        </n-space>
      </n-tab-pane>
      <n-tab-pane name="decrypt" tab="解密">
        <n-space vertical>
          <n-input v-model:value="cipherText" type="textarea" placeholder="请输入密文" :rows="4" />
          <n-input v-model:value="secretKey2" placeholder="输入密码" />
          <n-select v-model:value="mode2" :options="modeOptions" style="width: 160px" />
          <n-button type="primary" @click="decrypt" :disabled="!canDecrypt">解密</n-button>
          <n-input v-if="decrypted" :value="decrypted" readonly placeholder="解密结果" />
        </n-space>
      </n-tab-pane>
    </n-tabs>
    <n-alert v-if="error" type="error" class="mt-4">{{ error }}</n-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NTabs, NTabPane, NSpace, NInput, NButton, NSelect, NAlert } from 'naive-ui'

const plainText = ref('')
const secretKey = ref('')
const mode = ref('aes-256-gcm')
const encrypted = ref('')
const cipherText = ref('')
const secretKey2 = ref('')
const mode2 = ref('aes-256-gcm')
const decrypted = ref('')
const error = ref('')

const modeOptions = [
  { label: 'AES-128-GCM', value: 'aes-128-gcm' },
  { label: 'AES-192-GCM', value: 'aes-192-gcm' },
  { label: 'AES-256-GCM', value: 'aes-256-gcm' },
]

const canEncrypt = computed(() => plainText.value && secretKey.value)
const canDecrypt = computed(() => cipherText.value && secretKey2.value)

function toBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}

function fromBase64(str: string): Uint8Array {
  return Uint8Array.from(atob(str), c => c.charCodeAt(0))
}

async function deriveKey(password: string, salt: Uint8Array, modeName: string): Promise<CryptoKey> {
  const keyLen = modeName.includes('128') ? 16 : modeName.includes('192') ? 24 : 32
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']
  )
  return await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: keyLen * 8 },
    false,
    ['encrypt', 'decrypt']
  )
}

async function encrypt() {
  error.value = ''
  try {
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const key = await deriveKey(secretKey.value, salt, mode.value)
    const encoder = new TextEncoder()
    const cipherBuf = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv }, key, encoder.encode(plainText.value)
    )
    const cipher = new Uint8Array(cipherBuf)
    const combined = new Uint8Array(salt.length + iv.length + cipher.length)
    combined.set(salt, 0)
    combined.set(iv, salt.length)
    combined.set(cipher, salt.length + iv.length)
    encrypted.value = toBase64(combined.buffer)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    error.value = '加密失败：' + msg
  }
}

async function decrypt() {
  error.value = ''
  try {
    const combined = fromBase64(cipherText.value)
    const salt = combined.slice(0, 16)
    const iv = combined.slice(16, 28)
    const data = combined.slice(28)
    const key = await deriveKey(secretKey2.value, salt, mode2.value)
    const plainBuf = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv }, key, data
    )
    decrypted.value = new TextDecoder().decode(plainBuf)
  } catch (e: unknown) {
    error.value = '解密失败：密码错误或密文损坏'
  }
}

function copy(text: string) {
  navigator.clipboard.writeText(text)
}
</script>

<style scoped>
.aes-encrypt { max-width: 800px; margin: 0 auto; }
.mt-4 { margin-top: 16px; }
</style>
