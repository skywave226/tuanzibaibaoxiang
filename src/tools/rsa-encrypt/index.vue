<template>
  <div class="rsa-encrypt">
    <n-alert type="info" class="mb-4">
      RSA 非对称加密：公钥加密，私钥解密。点击"生成密钥对"创建新密钥。
    </n-alert>
    
    <n-space vertical>
      <n-button type="primary" @click="generateKeyPair" :loading="generating">生成密钥对</n-button>
      
      <div v-if="publicKey" class="key-section">
        <div class="label">公钥（用于加密）</div>
        <n-input :value="publicKey" type="textarea" readonly :rows="4" />
        <n-button size="small" @click="copy(publicKey)">复制公钥</n-button>
      </div>
      
      <div v-if="privateKey" class="key-section">
        <div class="label">私钥（用于解密，请妥善保管）</div>
        <n-input :value="privateKey" type="textarea" readonly :rows="4" />
        <n-button size="small" @click="copy(privateKey)">复制私钥</n-button>
      </div>
      
      <n-tabs type="segment" animated v-if="publicKey && privateKey">
        <n-tab-pane name="encrypt" tab="加密">
          <n-space vertical>
            <n-input v-model:value="plainText" type="textarea" placeholder="请输入明文" :rows="4" />
            <n-button type="primary" @click="encrypt" :disabled="!plainText">加密</n-button>
            <n-input v-if="encrypted" :value="encrypted" readonly type="textarea" :rows="4" placeholder="加密结果">
              <template #suffix><n-button text @click="copy(encrypted)">复制</n-button></template>
            </n-input>
          </n-space>
        </n-tab-pane>
        
        <n-tab-pane name="decrypt" tab="解密">
          <n-space vertical>
            <n-input v-model:value="cipherText" type="textarea" placeholder="请输入密文" :rows="4" />
            <n-button type="primary" @click="decrypt" :disabled="!cipherText">解密</n-button>
            <n-input v-if="decrypted" :value="decrypted" readonly type="textarea" :rows="4" placeholder="解密结果" />
          </n-space>
        </n-tab-pane>
      </n-tabs>
    </n-space>
    
    <n-alert v-if="error" type="error" class="mt-4">{{ error }}</n-alert>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NAlert, NSpace, NButton, NTabs, NTabPane, NInput } from 'naive-ui'

const generating = ref(false)
const publicKey = ref('')
const privateKey = ref('')
const plainText = ref('')
const encrypted = ref('')
const cipherText = ref('')
const decrypted = ref('')
const error = ref('')
let keyPair: CryptoKeyPair | null = null

function toBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}

function fromBase64(str: string): Uint8Array {
  return Uint8Array.from(atob(str), c => c.charCodeAt(0))
}

async function generateKeyPair() {
  generating.value = true
  error.value = ''
  try {
    keyPair = await crypto.subtle.generateKey(
      { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
      true,
      ['encrypt', 'decrypt']
    )
    const pubKeyBuf = await crypto.subtle.exportKey('spki', keyPair.publicKey)
    const privKeyBuf = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)
    publicKey.value = toBase64(pubKeyBuf)
    privateKey.value = toBase64(privKeyBuf)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    error.value = '生成密钥失败：' + msg
  } finally {
    generating.value = false
  }
}

async function encrypt() {
  if (!keyPair) return
  error.value = ''
  try {
    const encoder = new TextEncoder()
    const cipherBuf = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, keyPair.publicKey, encoder.encode(plainText.value))
    encrypted.value = toBase64(cipherBuf)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    error.value = '加密失败：' + msg
  }
}

async function decrypt() {
  if (!keyPair) return
  error.value = ''
  try {
    const data = fromBase64(cipherText.value)
    const plainBuf = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, keyPair.privateKey, data)
    decrypted.value = new TextDecoder().decode(plainBuf)
  } catch (e: unknown) {
    error.value = '解密失败：密钥不匹配或密文损坏'
  }
}

function copy(text: string) {
  navigator.clipboard.writeText(text)
}
</script>

<style scoped>
.rsa-encrypt { max-width: 900px; margin: 0 auto; }
.mb-4 { margin-bottom: 16px; }
.mt-4 { margin-top: 16px; }
.key-section { margin-top: 16px; }
.label { margin-bottom: 8px; font-weight: 500; }
</style>
