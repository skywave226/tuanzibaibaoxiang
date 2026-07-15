<template>
  <div class="ssh-keygen">
    <n-alert type="warning" class="mb-4">
      安全提示：密钥对完全在浏览器本地生成，私钥不会上传到任何服务器。请妥善保管生成的私钥，不要在不安全的渠道分享。本工具生成的密钥可用于测试与学习，生产环境建议使用 ssh-keygen 命令行工具。
    </n-alert>

    <!-- 配置区 -->
    <div class="card mb-4">
      <div class="pane-label mb-3">密钥配置</div>
      <div class="config-grid">
        <div class="form-item">
          <label>算法</label>
          <n-select v-model:value="algorithm" :options="algorithmOptions" />
        </div>
        <div class="form-item" v-if="algorithm === 'rsa'">
          <label>RSA 密钥长度</label>
          <n-select v-model:value="rsaBits" :options="rsaBitsOptions" />
        </div>
        <div class="form-item" v-if="algorithm === 'ecdsa'">
          <label>ECDSA 曲线</label>
          <n-select v-model:value="ecdsaCurve" :options="ecdsaCurveOptions" />
        </div>
        <div class="form-item">
          <label>注释（comment）</label>
          <n-input v-model:value="comment" placeholder="user@host" />
        </div>
      </div>
      <div class="actions mt-4">
        <n-button type="primary" :loading="generating" @click="generate">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="14.5" r="5.5"/><path d="M21 3l-9 9"/><path d="M15 3h6v6"/></svg></span>生成密钥对
        </n-button>
        <n-button @click="clearAll" :disabled="!publicKey">清空</n-button>
      </div>
    </div>

    <!-- 错误提示 -->
    <n-alert type="error" v-if="errorMsg" class="mb-4" closable @close="errorMsg = ''">
      {{ errorMsg }}
    </n-alert>

    <!-- 结果区 -->
    <template v-if="publicKey">
      <!-- 指纹 -->
      <div class="card mb-4">
        <div class="pane-label mb-2">密钥指纹</div>
        <div class="fingerprint-box">
          <span class="fp-label">SHA256:</span>
          <code class="fp-value">{{ fingerprint }}</code>
        </div>
        <div class="key-meta mt-2">
          <n-tag size="small" :bordered="false" type="info">{{ keyTypeLabel }}</n-tag>
          <n-tag size="small" :bordered="false" type="info">{{ bitsLabel }}</n-tag>
          <n-tag size="small" :bordered="false">{{ comment }}</n-tag>
        </div>
      </div>

      <!-- 公钥 -->
      <div class="card mb-4">
        <div class="result-header mb-2">
          <span class="pane-label">公钥（Public Key）</span>
          <n-button size="small" type="primary" @click="copyPublic">复制</n-button>
        </div>
        <n-input
          :value="publicKey"
          type="textarea"
          readonly
          :rows="3"
          :autosize="false"
          class="key-output pub-output"
        />
        <div class="hint">将此公钥添加到服务器的 ~/.ssh/authorized_keys 文件中</div>
      </div>

      <!-- 私钥 -->
      <div class="card mb-4">
        <div class="result-header mb-2">
          <span class="pane-label">私钥（Private Key）</span>
          <n-space>
            <n-button size="small" type="primary" @click="copyPrivate">复制</n-button>
            <n-button size="small" @click="downloadPrivate">下载</n-button>
          </n-space>
        </div>
        <n-input
          :value="privateKey"
          type="textarea"
          readonly
          :rows="14"
          :autosize="false"
          class="key-output priv-output"
        />
        <div class="hint danger">请妥善保管私钥，切勿泄露。保存为 id_&lt;type&gt; 文件并设置 600 权限。</div>
      </div>
    </template>

    <div class="card" v-else-if="!generating">
      <n-empty description="选择算法后点击「生成密钥对」按钮" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  NAlert, NSelect, NInput, NButton, NTag, NEmpty, NSpace, useMessage,
} from 'naive-ui'

const message = useMessage()

// 算法类型
type AlgoType = 'rsa' | 'ecdsa' | 'ed25519'

const algorithm = ref<AlgoType>('ed25519')
const rsaBits = ref(2048)
const ecdsaCurve = ref<'P-256' | 'P-384' | 'P-521'>('P-256')
const comment = ref('user@host')

const generating = ref(false)
const errorMsg = ref('')
const publicKey = ref('')
const privateKey = ref('')
const fingerprint = ref('')

const algorithmOptions = [
  { label: 'Ed25519（推荐，最现代）', value: 'ed25519' },
  { label: 'RSA（兼容性最好）', value: 'rsa' },
  { label: 'ECDSA（椭圆曲线）', value: 'ecdsa' },
]

const rsaBitsOptions = [
  { label: '2048 位', value: 2048 },
  { label: '3072 位', value: 3072 },
  { label: '4096 位', value: 4096 },
]

const ecdsaCurveOptions = [
  { label: 'P-256（nistp256）', value: 'P-256' },
  { label: 'P-384（nistp384）', value: 'P-384' },
  { label: 'P-521（nistp521）', value: 'P-521' },
]

// 密钥类型标签
const keyTypeLabel = computed(() => {
  if (algorithm.value === 'rsa') return `ssh-rsa`
  if (algorithm.value === 'ed25519') return `ssh-ed25519`
  const curve = ecdsaCurve.value.replace('P-', '').toLowerCase()
  return `ecdsa-sha2-nistp${curve === '256' ? '256' : curve === '384' ? '384' : '521'}`
})

// 位长标签
const bitsLabel = computed(() => {
  if (algorithm.value === 'rsa') return `${rsaBits.value} 位`
  if (algorithm.value === 'ed25519') return '256 位'
  if (ecdsaCurve.value === 'P-256') return '256 位'
  if (ecdsaCurve.value === 'P-384') return '384 位'
  return '521 位'
})

// ============ SSH wire format 工具函数 ============

// 字符串转 UTF-8 字节
function strToBytes(s: string): Uint8Array {
  return new TextEncoder().encode(s)
}

// base64url 字符串解码为字节数组
function b64urlToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/')
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

// 字节数组转 base64（标准）
function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

// 拼接多个字节数组
function concatBytes(...arrs: Uint8Array[]): Uint8Array {
  const total = arrs.reduce((s, a) => s + a.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const a of arrs) {
    out.set(a, offset)
    offset += a.length
  }
  return out
}

// 写入 4 字节大端 uint32
function sshUint32(n: number): Uint8Array {
  const out = new Uint8Array(4)
  new DataView(out.buffer).setUint32(0, n >>> 0)
  return out
}

// 写入 SSH string（4 字节长度前缀 + 内容）
function sshString(bytes: Uint8Array): Uint8Array {
  const out = new Uint8Array(4 + bytes.length)
  new DataView(out.buffer).setUint32(0, bytes.length)
  out.set(bytes, 4)
  return out
}

// 写入 SSH mpint（多精度整数）
function toMpint(bytes: Uint8Array): Uint8Array {
  // 去除前导零
  let i = 0
  while (i < bytes.length - 1 && bytes[i] === 0) i++
  let trimmed = bytes.subarray(i)
  // 若最高位为 1，需补前导 0x00 以保持正数
  if (trimmed.length > 0 && (trimmed[0] & 0x80)) {
    const padded = new Uint8Array(trimmed.length + 1)
    padded.set(trimmed, 1)
    trimmed = padded
  }
  return sshString(trimmed)
}

// ============ 公钥 blob 生成 ============

// RSA 公钥 blob
function rsaPublicBlob(nB64: string, eB64: string): Uint8Array {
  return concatBytes(
    sshString(strToBytes('ssh-rsa')),
    toMpint(b64urlToBytes(eB64)),
    toMpint(b64urlToBytes(nB64)),
  )
}

// Ed25519 公钥 blob
function ed25519PublicBlob(pubB64: string): Uint8Array {
  return concatBytes(
    sshString(strToBytes('ssh-ed25519')),
    sshString(b64urlToBytes(pubB64)),
  )
}

// ECDSA 公钥 blob
function ecdsaPublicBlob(curve: string, xB64: string, yB64: string): Uint8Array {
  const curveName = curve === 'P-256' ? 'nistp256' : curve === 'P-384' ? 'nistp384' : 'nistp521'
  const keyType = `ecdsa-sha2-${curveName}`
  // 未压缩点：0x04 + x + y
  const xBytes = b64urlToBytes(xB64)
  const yBytes = b64urlToBytes(yB64)
  const point = concatBytes(new Uint8Array([0x04]), xBytes, yBytes)
  return concatBytes(
    sshString(strToBytes(keyType)),
    sshString(strToBytes(curveName)),
    sshString(point),
  )
}

// ============ 私钥（OpenSSH 新格式）生成 ============

// 生成随机 check int
function randomUint32(): number {
  const arr = new Uint8Array(4)
  crypto.getRandomValues(arr)
  return (arr[0] << 24) | (arr[1] << 16) | (arr[2] << 8) | arr[3]
}

// 添加 PKCS 风格填充（1,2,3...）至 blocksize 整数倍
function padToBlocksize(content: Uint8Array, blocksize: number): Uint8Array {
  const pad = blocksize - (content.length % blocksize)
  const padding = new Uint8Array(pad)
  for (let i = 0; i < pad; i++) padding[i] = (i + 1) & 0xff
  return concatBytes(content, padding)
}

// 构建 OpenSSH 私钥文件（PEM 格式）
function buildOpenSshPrivateKey(
  pubBlob: Uint8Array,
  privSectionContent: Uint8Array,
): string {
  // 私有段：长度前缀 + 内容 + 填充
  const paddedPriv = padToBlocksize(privSectionContent, 8)
  const privSection = sshString(paddedPriv)

  // 整体结构
  const magic = strToBytes('openssh-key-v1\0')
  const fileContent = concatBytes(
    magic,
    sshString(strToBytes('none')), // ciphername
    sshString(strToBytes('none')), // kdfname
    sshString(new Uint8Array(0)), // kdfoptions
    sshUint32(1), // number of keys
    sshString(pubBlob), // 公钥
    privSection,
  )

  const b64 = bytesToBase64(fileContent)
  // 按 70 字符换行
  const lines: string[] = []
  for (let i = 0; i < b64.length; i += 70) {
    lines.push(b64.slice(i, i + 70))
  }
  return ['-----BEGIN OPENSSH PRIVATE KEY-----', ...lines, '-----END OPENSSH PRIVATE KEY-----', ''].join('\n')
}

// ============ 主生成逻辑 ============

async function generate(): Promise<void> {
  errorMsg.value = ''
  publicKey.value = ''
  privateKey.value = ''
  fingerprint.value = ''
  generating.value = true

  try {
    let pubBlob: Uint8Array
    let privSectionContent: Uint8Array
    let keyTypeStr: string

    const check = randomUint32()

    if (algorithm.value === 'rsa') {
      // RSA 密钥生成
      const keyPair = await crypto.subtle.generateKey(
        {
          name: 'RSASSA-PKCS1-v1_5',
          modulusLength: rsaBits.value,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true,
        ['sign', 'verify'],
      )
      const pubJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey)
      const privJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey)
      if (!pubJwk || !privJwk) throw new Error('导出 RSA JWK 失败')

      pubBlob = rsaPublicBlob(pubJwk.n!, pubJwk.e!)
      keyTypeStr = 'ssh-rsa'

      // 私有段内容：check + check + keytype + n + e + d + iqmp + p + q + comment
      privSectionContent = concatBytes(
        sshUint32(check),
        sshUint32(check),
        sshString(strToBytes('ssh-rsa')),
        toMpint(b64urlToBytes(pubJwk.n!)),
        toMpint(b64urlToBytes(pubJwk.e!)),
        toMpint(b64urlToBytes(privJwk.d!)),
        toMpint(b64urlToBytes(privJwk.qi!)), // iqmp
        toMpint(b64urlToBytes(privJwk.p!)),
        toMpint(b64urlToBytes(privJwk.q!)),
        sshString(strToBytes(comment.value)),
      )
    } else if (algorithm.value === 'ed25519') {
      // Ed25519 密钥生成（需浏览器支持）
      let keyPair: CryptoKeyPair
      try {
        keyPair = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify'])
      } catch {
        throw new Error('当前浏览器不支持 Ed25519，请切换为 RSA 或 ECDSA，或使用新版 Chrome')
      }
      const pubJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey)
      const privJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey)
      if (!pubJwk || !privJwk || !pubJwk.x || !privJwk.d) throw new Error('导出 Ed25519 JWK 失败')

      const pubBytes = b64urlToBytes(pubJwk.x)
      pubBlob = ed25519PublicBlob(pubJwk.x)
      keyTypeStr = 'ssh-ed25519'

      // OpenSSH 私有段：pub(32) + priv(32) 拼接为 64 字节
      const privSeed = b64urlToBytes(privJwk.d)
      const priv64 = concatBytes(pubBytes, privSeed)
      privSectionContent = concatBytes(
        sshUint32(check),
        sshUint32(check),
        sshString(strToBytes('ssh-ed25519')),
        sshString(pubBytes),
        sshString(priv64),
        sshString(strToBytes(comment.value)),
      )
    } else {
      // ECDSA 密钥生成
      const keyPair = await crypto.subtle.generateKey(
        { name: 'ECDSA', namedCurve: ecdsaCurve.value },
        true,
        ['sign', 'verify'],
      )
      const pubJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey)
      const privJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey)
      if (!pubJwk || !privJwk || !pubJwk.x || !pubJwk.y || !privJwk.d) throw new Error('导出 ECDSA JWK 失败')

      const curveName = ecdsaCurve.value === 'P-256' ? 'nistp256' : ecdsaCurve.value === 'P-384' ? 'nistp384' : 'nistp521'
      keyTypeStr = `ecdsa-sha2-${curveName}`

      pubBlob = ecdsaPublicBlob(ecdsaCurve.value, pubJwk.x, pubJwk.y)

      // 公钥点
      const xBytes = b64urlToBytes(pubJwk.x)
      const yBytes = b64urlToBytes(pubJwk.y)
      const point = concatBytes(new Uint8Array([0x04]), xBytes, yBytes)

      privSectionContent = concatBytes(
        sshUint32(check),
        sshUint32(check),
        sshString(strToBytes(keyTypeStr)),
        sshString(strToBytes(curveName)),
        sshString(point),
        toMpint(b64urlToBytes(privJwk.d)),
        sshString(strToBytes(comment.value)),
      )
    }

    // 公钥文本：<type> <base64(blob)> <comment>
    const pubB64 = bytesToBase64(pubBlob)
    publicKey.value = `${keyTypeStr} ${pubB64} ${comment.value}`

    // 私钥 PEM
    privateKey.value = buildOpenSshPrivateKey(pubBlob, privSectionContent)

    // 指纹：SHA256:<base64(sha256(blob))>
    const hashBuf = await crypto.subtle.digest('SHA-256', pubBlob)
    const hashBytes = new Uint8Array(hashBuf)
    fingerprint.value = bytesToBase64(hashBytes)

    message.success('密钥对已生成')
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : String(e)
    message.error('生成失败')
  } finally {
    generating.value = false
  }
}

// 复制公钥
async function copyPublic(): Promise<void> {
  if (!publicKey.value) return
  try {
    await navigator.clipboard.writeText(publicKey.value)
    message.success('公钥已复制')
  } catch {
    message.error('复制失败')
  }
}

// 复制私钥
async function copyPrivate(): Promise<void> {
  if (!privateKey.value) return
  try {
    await navigator.clipboard.writeText(privateKey.value)
    message.success('私钥已复制')
  } catch {
    message.error('复制失败')
  }
}

// 下载私钥
function downloadPrivate(): void {
  if (!privateKey.value) return
  const ext = algorithm.value === 'rsa' ? 'rsa' : algorithm.value === 'ed25519' ? 'ed25519' : 'ecdsa'
  const blob = new Blob([privateKey.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `id_${ext}`
  a.click()
  URL.revokeObjectURL(url)
  message.success('已开始下载私钥文件')
}

// 清空
function clearAll(): void {
  publicKey.value = ''
  privateKey.value = ''
  fingerprint.value = ''
  errorMsg.value = ''
  message.info('已清空')
}
</script>

<style scoped>
.ssh-keygen {
  max-width: 1000px;
  margin: 0 auto;
}

.config-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 768px) {
  .config-grid {
    grid-template-columns: 1fr;
  }
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-item label {
  font-size: 13px;
  font-weight: 500;
  color: #555;
}

.dark .form-item label {
  color: #bbb;
}

.actions {
  display: flex;
  gap: 8px;
}

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.fingerprint-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f5f5f5;
  padding: 12px;
  border-radius: 6px;
  flex-wrap: wrap;
}

.dark .fingerprint-box {
  background: #2a2a3e;
}

.fp-label {
  font-size: 13px;
  color: #666;
  font-weight: 600;
}

.dark .fp-label {
  color: #aaa;
}

.fp-value {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 14px;
  color: #2563eb;
  word-break: break-all;
}

.dark .fp-value {
  color: #60a5fa;
}

.key-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.key-output :deep(textarea) {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.5;
}

.pub-output :deep(textarea) {
  word-break: break-all;
}

.priv-output :deep(textarea) {
  white-space: pre;
}

.hint {
  font-size: 12px;
  color: #888;
  margin-top: 6px;
}

.hint.danger {
  color: #dc2626;
}

.dark .hint {
  color: #aaa;
}

.dark .hint.danger {
  color: #f87171;
}
</style>
