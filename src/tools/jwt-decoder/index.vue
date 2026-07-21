<template>
  <div class="jwt-decoder">
    <div class="card mb-4">
      <div class="pane-label mb-2">JWT Token</div>
      <n-input
        v-model:value="token"
        type="textarea"
        placeholder="请输入 JWT Token，例如 eyJhbGciOiJIUzI1NiIs..."
        :rows="4"
      />
      <div class="toolbar mt-3 flex gap-3 flex-wrap">
        <n-button type="primary" @click="decode">解码</n-button>
        <n-button @click="useExample">示例</n-button>
        <n-button @click="clear">清空</n-button>
      </div>
    </div>

    <n-alert v-if="error" type="error" class="mb-4" closable @close="error = ''">{{ error }}</n-alert>

    <div v-if="decoded" class="sections">
      <div class="section">
        <div class="section-header">
          <div class="section-title">Header（头部）</div>
          <n-space>
            <n-button size="tiny" quaternary @click="copy(decoded.headerJson)">复制 JSON</n-button>
            <n-button size="tiny" quaternary @click="copy(decoded.headerRaw)">复制 Base64</n-button>
          </n-space>
        </div>
        <pre>{{ decoded.headerJson }}</pre>
        <div class="meta-line">算法：{{ decoded.alg }} / 类型：{{ decoded.typ }}</div>
      </div>

      <div class="section">
        <div class="section-header">
          <div class="section-title">Payload（负载）</div>
          <n-space>
            <n-button size="tiny" quaternary @click="copy(decoded.payloadJson)">复制 JSON</n-button>
            <n-button size="tiny" quaternary @click="copy(decoded.payloadRaw)">复制 Base64</n-button>
          </n-space>
        </div>
        <pre>{{ decoded.payloadJson }}</pre>
        <div class="claims-list" v-if="claims.length > 0">
          <div v-for="claim in claims" :key="claim.name" class="claim-item">
            <span class="claim-name">{{ claim.name }}</span>
            <span class="claim-value">{{ claim.value }}</span>
            <span class="claim-desc" v-if="claim.desc">{{ claim.desc }}</span>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <div class="section-title">Signature（签名）</div>
          <n-button size="tiny" quaternary @click="copy(decoded.signature)">复制</n-button>
        </div>
        <pre class="signature">{{ decoded.signature }}</pre>
      </div>

      <div class="section">
        <div class="section-title">签名验证</div>
        <div class="verify-row">
          <n-input v-model:value="secret" type="password" show-password-on="mousedown" placeholder="输入 secret / 公钥以验证签名（可选）" class="secret-input" />
          <n-button @click="verifySignature" :loading="verifying">验证</n-button>
        </div>
        <n-alert v-if="verifyResult" :type="verifyResult.valid ? 'success' : 'error'" class="mt-3">
          {{ verifyResult.message }}
        </n-alert>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NInput, NButton, NAlert, NSpace, useMessage } from 'naive-ui'

const message = useMessage()
const token = ref('')
const secret = ref('')
const error = ref('')
const verifying = ref(false)
const verifyResult = ref<{ valid: boolean; message: string } | null>(null)

interface DecodedResult {
  headerJson: string
  headerRaw: string
  payloadJson: string
  payloadRaw: string
  signature: string
  alg: string
  typ: string
  header: Record<string, unknown>
  payload: Record<string, unknown>
}

const decoded = ref<DecodedResult | null>(null)

const commonClaims: Record<string, string> = {
  iss: '签发者（Issuer）',
  sub: '主题（Subject）',
  aud: '受众（Audience）',
  exp: '过期时间（Expiration）',
  nbf: '生效时间（Not Before）',
  iat: '签发时间（Issued At）',
  jti: '唯一标识（JWT ID）',
  scope: '权限范围',
  permissions: '权限列表',
  roles: '角色列表',
  name: '用户名',
  email: '邮箱',
}

const claims = computed(() => {
  if (!decoded.value) return []
  return Object.entries(decoded.value.payload).map(([name, value]) => {
    let displayValue: string
    if (name === 'exp' || name === 'nbf' || name === 'iat') {
      const ts = Number(value) * 1000
      displayValue = `${value} (${new Date(ts).toLocaleString('zh-CN')})`
    } else {
      displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value)
    }
    return {
      name,
      value: displayValue,
      desc: commonClaims[name],
    }
  })
})

function base64UrlDecode(str: string): string {
  str += new Array(5 - (str.length % 4)).join('=')
  return atob(str.replace(/\-/g, '+').replace(/\_/g, '/'))
}

function decode() {
  error.value = ''
  decoded.value = null
  verifyResult.value = null

  const t = token.value.trim()
  if (!t) {
    error.value = '请输入 JWT Token'
    return
  }

  const parts = t.split('.')
  if (parts.length !== 3) {
    error.value = 'JWT 格式不正确，应包含 Header.Payload.Signature 三部分'
    return
  }

  try {
    const headerRaw = base64UrlDecode(parts[0])
    const payloadRaw = base64UrlDecode(parts[1])
    const header = JSON.parse(headerRaw)
    const payload = JSON.parse(payloadRaw)

    decoded.value = {
      headerJson: JSON.stringify(header, null, 2),
      headerRaw: parts[0],
      payloadJson: JSON.stringify(payload, null, 2),
      payloadRaw: parts[1],
      signature: parts[2],
      alg: String(header.alg || '未知'),
      typ: String(header.typ || 'JWT'),
      header,
      payload,
    }

    if (payload.exp && payload.exp * 1000 < Date.now()) {
      message.warning('Token 已过期')
    }
  } catch {
    error.value = 'JWT 解码失败，请检查格式是否正确'
  }
}

async function verifySignature() {
  if (!decoded.value) return
  if (!secret.value) {
    verifyResult.value = { valid: false, message: '请输入 Secret 或公钥' }
    return
  }

  verifying.value = true
  try {
    const alg = decoded.value.alg
    const tokenStr = token.value.trim()
    const signingInput = tokenStr.substring(0, tokenStr.lastIndexOf('.'))
    const signature = tokenStr.substring(tokenStr.lastIndexOf('.') + 1)

    if (alg.startsWith('HS')) {
      // HMAC 算法
      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret.value),
        { name: 'HMAC', hash: alg === 'HS384' ? 'SHA-384' : alg === 'HS512' ? 'SHA-512' : 'SHA-256' },
        false,
        ['sign']
      )
      const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signingInput))
      const computed = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

      if (computed === signature) {
        verifyResult.value = { valid: true, message: '签名验证通过' }
      } else {
        verifyResult.value = { valid: false, message: '签名不匹配' }
      }
    } else {
      verifyResult.value = { valid: false, message: `当前仅支持 HMAC 系列算法（HS256/HS384/HS512）验证，当前算法为 ${alg}` }
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    verifyResult.value = { valid: false, message: '验证失败：' + msg }
  } finally {
    verifying.value = false
  }
}

function useExample() {
  // 生成一个示例 HS256 token: header={alg:"HS256",typ:"JWT"}, payload={sub:"1234567890",name:"John Doe",iat:1516239022}
  token.value = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
  secret.value = 'your-256-bit-secret'
  decode()
}

function clear() {
  token.value = ''
  secret.value = ''
  decoded.value = null
  error.value = ''
  verifyResult.value = null
}

function copy(text: string) {
  navigator.clipboard.writeText(text)
  message.success('已复制')
}
</script>

<style scoped>
.jwt-decoder { max-width: 1000px; margin: 0 auto; }

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
}

.sections { display: grid; gap: 16px; }

.section {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 8px;
}

.dark .section { background: #1e1e1e; }

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.section-title { font-weight: bold; color: #333; }

.dark .section-title { color: #e0e0e0; }

pre {
  background: #fff;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.6;
}

.dark pre { background: #000; color: #e0e0e0; }

pre.signature { font-family: monospace; word-break: break-all; }

.meta-line {
  margin-top: 8px;
  font-size: 13px;
  color: #666;
}

.dark .meta-line { color: #aaa; }

.claims-list {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.claim-item {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 8px 12px;
  background: #fff;
  border-radius: 4px;
}

.dark .claim-item { background: #000; }

.claim-name {
  font-weight: 600;
  min-width: 80px;
  color: #36ad6a;
}

.claim-value {
  flex: 1;
  font-family: monospace;
  font-size: 13px;
  word-break: break-all;
}

.claim-desc {
  font-size: 12px;
  color: #888;
}

.verify-row {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.secret-input { flex: 1; min-width: 240px; }
</style>
