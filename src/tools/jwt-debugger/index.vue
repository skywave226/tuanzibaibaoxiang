<template>
  <div class="jwt-debugger">
    <!-- 输入区 -->
    <n-card class="input-card" :bordered="false">
      <div class="card-title">
        <span class=" title-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg></span>
        <span>JWT Token 输入</span>
      </div>
      <n-input
        v-model:value="token"
        type="textarea"
        placeholder="粘贴 JWT Token，例如：eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lInQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
        :rows="5"
        clearable
      />
      <div class="actions">
        <n-space>
          <n-button size="small" @click="loadSample">载入示例</n-button>
          <n-button size="small" @click="token = ''">清空</n-button>
        </n-space>
      </div>
    </n-card>

    <!-- 错误提示 -->
    <n-alert v-if="errorMsg" type="error" class="mt-4" :bordered="false">
      {{ errorMsg }}
    </n-alert>

    <!-- 警告提示 -->
    <n-alert
      v-if="decoded && decoded.algNone"
      type="warning"
      class="mt-4"
      title="安全警告"
      :bordered="false"
    >
      该 Token 的 Header 中 alg 为 <strong>none</strong>，表示不使用签名算法。这是一种不安全的配置，攻击者可伪造任意 Payload，请勿在生产环境使用。
    </n-alert>

    <!-- 解析结果 -->
    <template v-if="decoded">
      <!-- Token 分段预览 -->
      <div class="segments mt-4">
        <span class="seg header-seg">{{ decoded.headerRaw }}</span>
        <span class="seg-dot">.</span>
        <span class="seg payload-seg">{{ decoded.payloadRaw }}</span>
        <span class="seg-dot">.</span>
        <span class="seg signature-seg">{{ decoded.signature }}</span>
      </div>

      <!-- 三段内容展示 -->
      <div class="sections mt-4">
        <!-- Header -->
        <n-card class="section-card" :bordered="false">
          <div class="section-header">
            <n-tag type="info" :bordered="false" size="small">HEADER</n-tag>
            <span class="section-sub">头部信息</span>
            <n-button text size="tiny" class="copy-btn" @click="copyText(decoded.headerStr)">复制</n-button>
          </div>
          <pre class="code-block">{{ decoded.headerStr }}</pre>
        </n-card>

        <!-- Payload -->
        <n-card class="section-card" :bordered="false">
          <div class="section-header">
            <n-tag type="success" :bordered="false" size="small">PAYLOAD</n-tag>
            <span class="section-sub">负载信息</span>
            <n-button text size="tiny" class="copy-btn" @click="copyText(decoded.payloadStr)">复制</n-button>
          </div>
          <pre class="code-block">{{ decoded.payloadStr }}</pre>

          <!-- 关键字段说明 -->
          <div class="claims" v-if="decoded.claims.length > 0">
            <div class="claims-title">关键字段说明</div>
            <div class="claim-row" v-for="claim in decoded.claims" :key="claim.key">
              <span class="claim-key">{{ claim.key }}</span>
              <span class="claim-desc">{{ claim.desc }}</span>
            </div>
          </div>
        </n-card>

        <!-- Signature -->
        <n-card class="section-card" :bordered="false">
          <div class="section-header">
            <n-tag type="warning" :bordered="false" size="small">SIGNATURE</n-tag>
            <span class="section-sub">签名部分</span>
          </div>
          <pre class="code-block signature-block">{{ decoded.signature || '(空 - alg:none 模式无签名)' }}</pre>
          <div class="signature-note">
            签名仅用于完整性校验，无法在客户端解密。验证签名需要服务端的密钥。
          </div>
        </n-card>
      </div>

      <!-- 过期时间检查 -->
      <n-card class="mt-4 expiry-card" :bordered="false">
        <div class="card-title">
          <span class=" title-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>
          <span>过期时间检查</span>
        </div>
        <div v-if="!decoded.hasExp" class="expiry-row">
          <n-tag :bordered="false" type="default">无 exp 字段</n-tag>
          <span class="expiry-text">该 Token 未声明过期时间（exp），可能永久有效或由服务端控制。</span>
        </div>
        <div v-else class="expiry-info">
          <div class="expiry-row">
            <span class="expiry-label">过期时间</span>
            <span class="expiry-value">{{ decoded.expDate }}</span>
            <n-tag :type="decoded.expired ? 'error' : 'success'" :bordered="false" size="small">
              {{ decoded.expired ? '已过期' : '有效' }}
            </n-tag>
          </div>
          <div class="expiry-row" v-if="decoded.hasIat">
            <span class="expiry-label">签发时间</span>
            <span class="expiry-value">{{ decoded.iatDate }}</span>
          </div>
          <div class="expiry-row" v-if="decoded.hasNbf">
            <span class="expiry-label">生效时间</span>
            <span class="expiry-value">{{ decoded.nbfDate }}</span>
          </div>
          <div class="expiry-row" v-if="decoded.expired">
            <span class="expiry-label">已过期</span>
            <span class="expiry-value warning-text">约 {{ decoded.expiredAgo }}</span>
          </div>
          <div class="expiry-row" v-else>
            <span class="expiry-label">剩余有效</span>
            <span class="expiry-value success-text">{{ decoded.remaining }}</span>
          </div>
        </div>
      </n-card>
    </template>

    <!-- 空状态 -->
    <n-empty v-else-if="!token && !errorMsg" description="请输入 JWT Token 进行调试" class="mt-8" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NInput, NButton, NCard, NTag, NAlert, NEmpty, NSpace, useMessage } from 'naive-ui'

const message = useMessage()

const token = ref('')

interface ClaimInfo {
  key: string
  desc: string
}

interface DecodedJWT {
  headerRaw: string
  payloadRaw: string
  headerStr: string
  payloadStr: string
  signature: string
  algNone: boolean
  hasExp: boolean
  expired: boolean
  expDate: string
  hasIat: boolean
  iatDate: string
  hasNbf: boolean
  nbfDate: string
  remaining: string
  expiredAgo: string
  claims: ClaimInfo[]
}

// 标准 JWT 字段说明
const claimDescMap: Record<string, string> = {
  iss: '签发者（Issuer）',
  sub: '主体（Subject），通常为用户 ID',
  aud: '接收方（Audience）',
  exp: '过期时间（Expiration Time），Unix 时间戳',
  nbf: '生效时间（Not Before），在此之前无效',
  iat: '签发时间（Issued At）',
  jti: '唯一标识（JWT ID）',
}

// Base64URL 解码（自动补齐 padding）
function base64UrlDecode(input: string): string {
  let str = input.replace(/-/g, '+').replace(/_/g, '/')
  // 补齐 padding
  const pad = str.length % 4
  if (pad) {
    str += '='.repeat(4 - pad)
  }
  // 处理 UTF-8 字符
  const binary = atob(str)
  // 转为 UTF-8 字符串
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
  return new TextDecoder('utf-8').decode(bytes)
}

// 计算解码结果
const decoded = computed<DecodedJWT | null>(() => {
  const raw = token.value.trim()
  if (!raw) return null

  const parts = raw.split('.')
  if (parts.length !== 3) {
    return null
  }

  try {
    const headerRaw = parts[0]
    const payloadRaw = parts[1]
    const signature = parts[2]

    const header = JSON.parse(base64UrlDecode(headerRaw))
    const payload = JSON.parse(base64UrlDecode(payloadRaw))

    const algNone = String(header.alg || '').toLowerCase() === 'none'

    // 处理时间字段
    const now = Date.now()
    const hasExp = typeof payload.exp === 'number'
    const hasIat = typeof payload.iat === 'number'
    const hasNbf = typeof payload.nbf === 'number'
    const expired = hasExp ? payload.exp * 1000 < now : false

    const expDate = hasExp ? new Date(payload.exp * 1000).toLocaleString('zh-CN') : ''
    const iatDate = hasIat ? new Date(payload.iat * 1000).toLocaleString('zh-CN') : ''
    const nbfDate = hasNbf ? new Date(payload.nbf * 1000).toLocaleString('zh-CN') : ''

    // 计算剩余时间或已过期时长
    let remaining = ''
    let expiredAgo = ''
    if (hasExp) {
      const diff = payload.exp * 1000 - now
      if (diff > 0) {
        remaining = formatDuration(diff)
      } else {
        expiredAgo = formatDuration(-diff)
      }
    }

    // 提取标准字段说明
    const claims: ClaimInfo[] = Object.keys(payload)
      .filter(k => claimDescMap[k])
      .map(k => ({ key: k, desc: claimDescMap[k] }))

    return {
      headerRaw,
      payloadRaw,
      headerStr: JSON.stringify(header, null, 2),
      payloadStr: JSON.stringify(payload, null, 2),
      signature,
      algNone,
      hasExp,
      expired,
      expDate,
      hasIat,
      iatDate,
      hasNbf,
      nbfDate,
      remaining,
      expiredAgo,
      claims,
    }
  } catch {
    return null
  }
})

// 错误信息
const errorMsg = computed(() => {
  const raw = token.value.trim()
  if (!raw) return ''
  if (raw.split('.').length !== 3) return 'JWT 格式错误：应为 header.payload.signature 三段结构，以 . 分隔'
  if (!decoded.value) return 'JWT 解析失败：Base64URL 解码或 JSON 解析出错，请检查 Token 是否完整'
  return ''
})

// 格式化时长
function formatDuration(ms: number): string {
  const sec = Math.floor(ms / 1000)
  if (sec < 60) return `${sec} 秒`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} 分 ${sec % 60} 秒`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour} 时 ${min % 60} 分`
  const day = Math.floor(hour / 24)
  return `${day} 天 ${hour % 24} 时`
}

// 载入示例 Token
function loadSample() {
  // 示例：HS256 算法，包含 iat 和 exp（exp 设为当前时间后 1 小时）
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    sub: '1234567890',
    name: 'John Doe',
    admin: true,
    iat: now,
    exp: now + 3600,
  }
  const enc = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  token.value = `${enc(header)}.${enc(payload)}.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`
}

// 复制文本
async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    message.success('已复制')
  } catch {
    message.error('复制失败，请手动复制')
  }
}
</script>

<style scoped>
.jwt-debugger {
  max-width: 1000px;
  margin: 0 auto;
}

.mt-4 {
  margin-top: 16px;
}

.mt-8 {
  margin-top: 32px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
}

.title-icon {
  font-size: 18px;
  color: #18a058;
}

.actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

/* Token 分段预览 */
.segments {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 12.5px;
  background: #f5f5f5;
  padding: 10px 12px;
  border-radius: 6px;
  word-break: break-all;
}

.seg-dot {
  color: #999;
  font-weight: bold;
}

.header-seg {
  color: #2080f0;
}

.payload-seg {
  color: #18a058;
}

.signature-seg {
  color: #f0a020;
}

/* 段落卡片 */
.sections {
  display: grid;
  gap: 16px;
}

.section-card {
  background: #fafafa;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.section-sub {
  font-size: 13px;
  color: #888;
}

.copy-btn {
  margin-left: auto;
}

.code-block {
  margin: 0;
  font-family: 'Fira Code', 'Consolas', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  padding: 12px;
  background: #fff;
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
  color: #333;
  border: 1px solid #eee;
}

.signature-block {
  word-break: break-all;
  color: #d63384;
}

.signature-note {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}

/* 字段说明 */
.claims {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #e0e0e0;
}

.claims-title {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  margin-bottom: 8px;
}

.claim-row {
  display: flex;
  gap: 12px;
  padding: 4px 0;
  font-size: 13px;
}

.claim-key {
  font-family: 'Fira Code', 'Consolas', monospace;
  color: #2080f0;
  font-weight: 600;
  min-width: 48px;
}

.claim-desc {
  color: #666;
}

/* 过期时间卡片 */
.expiry-card {
  background: #fafafa;
}

.expiry-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.expiry-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.expiry-label {
  font-size: 13px;
  color: #888;
  min-width: 80px;
}

.expiry-value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.warning-text {
  color: #d03050;
}

.success-text {
  color: #18a058;
}

.expiry-text {
  font-size: 13px;
  color: #666;
  margin-left: 8px;
}

/* 深色模式适配 */
.dark .card-title,
.dark .section-sub,
.dark .code-block,
.dark .expiry-value,
.dark .claim-desc {
  color: rgba(255, 255, 255, 0.85);
}

.dark .segments,
.dark .section-card,
.dark .expiry-card,
.dark .code-block {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.09);
}

.dark .code-block {
  border-color: rgba(255, 255, 255, 0.09);
}

.dark .seg-dot {
  color: rgba(255, 255, 255, 0.4);
}

.dark .header-seg {
  color: #70c0e8;
}

.dark .payload-seg {
  color: #63e2b6;
}

.dark .signature-seg {
  color: #f0c060;
}

.dark .signature-block {
  color: #ff9eb1;
}

.dark .claim-key {
  color: #70c0e8;
}

.dark .expiry-label,
.dark .claims-title,
.dark .section-label,
.dark .signature-note {
  color: rgba(255, 255, 255, 0.45);
}

.dark .expiry-text,
.dark .claim-desc {
  color: rgba(255, 255, 255, 0.65);
}

.dark .warning-text {
  color: #ff7080;
}

.dark .success-text {
  color: #63e2b6;
}

.dark .title-icon {
  color: #63e2b6;
}
</style>
