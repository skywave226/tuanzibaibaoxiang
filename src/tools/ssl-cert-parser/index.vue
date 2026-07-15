<template>
  <div class="ssl-cert-parser">
    <!-- 输入区 -->
    <div class="input-section">
      <n-input
        v-model:value="certInput"
        type="textarea"
        placeholder="在此粘贴 PEM 格式的 SSL 证书，以 -----BEGIN CERTIFICATE----- 开头..."
        :rows="8"
        clearable
      />
      <div class="action-row">
        <n-space>
          <n-button type="primary" @click="parseCert" :loading="parsing">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="12 18 12 12 9 15"/><line x1="15" y1="15" x2="12" y2="12"/></svg>
            解析证书
          </n-button>
          <n-button @click="loadSample" quaternary>加载示例</n-button>
          <n-button @click="clearAll" quaternary>清空</n-button>
        </n-space>
      </div>
    </div>

    <!-- 错误提示 -->
    <n-alert v-if="errorMsg" type="error" :bordered="false" class="error-alert">
      {{ errorMsg }}
    </n-alert>

    <!-- 解析结果 -->
    <div v-if="certInfo" class="result-section">
      <!-- 证书状态概览 -->
      <div class="overview-cards">
        <n-card class="overview-card" :bordered="false" size="small">
          <div class="overview-label">有效期状态</div>
          <div class="overview-value">
            <n-tag :type="validityStatus.type" size="small" :bordered="false">
              {{ validityStatus.text }}
            </n-tag>
          </div>
        </n-card>
        <n-card class="overview-card" :bordered="false" size="small">
          <div class="overview-label">剩余天数</div>
          <div class="overview-value">{{ remainingDays }}</div>
        </n-card>
        <n-card class="overview-card" :bordered="false" size="small">
          <div class="overview-label">证书版本</div>
          <div class="overview-value">v{{ certInfo.version }}</div>
        </n-card>
        <n-card class="overview-card" :bordered="false" size="small">
          <div class="overview-label">签名算法</div>
          <div class="overview-value small">{{ certInfo.signatureAlgorithm }}</div>
        </n-card>
      </div>

      <!-- 详细字段 -->
      <n-divider>证书详情</n-divider>
      <n-descriptions :column="1" label-placement="left" bordered size="small">
        <n-descriptions-item label="版本">v{{ certInfo.version }}</n-descriptions-item>
        <n-descriptions-item label="序列号">
          <code class="serial-code">{{ certInfo.serialNumber }}</code>
        </n-descriptions-item>
        <n-descriptions-item label="签名算法">{{ certInfo.signatureAlgorithm }}</n-descriptions-item>
        <n-descriptions-item label="颁发者 (Issuer)">{{ certInfo.issuer }}</n-descriptions-item>
        <n-descriptions-item label="主题 (Subject)">{{ certInfo.subject }}</n-descriptions-item>
        <n-descriptions-item label="生效时间">{{ certInfo.notBefore }}</n-descriptions-item>
        <n-descriptions-item label="过期时间">{{ certInfo.notAfter }}</n-descriptions-item>
        <n-descriptions-item label="公钥算法">{{ certInfo.publicKeyAlgorithm }}</n-descriptions-item>
        <n-descriptions-item label="公钥长度">{{ certInfo.publicKeySize }}</n-descriptions-item>
        <n-descriptions-item v-if="certInfo.sanList.length > 0" label="主题备用名称 (SAN)">
          <n-space size="small">
            <n-tag v-for="(san, i) in certInfo.sanList" :key="i" size="small" :bordered="false">
              {{ san }}
            </n-tag>
          </n-space>
        </n-descriptions-item>
        <n-descriptions-item v-if="certInfo.extensions.length > 0" label="扩展信息">
          <div class="ext-list">
            <div v-for="(ext, i) in certInfo.extensions" :key="i" class="ext-item">
              <n-tag :type="ext.critical ? 'warning' : 'default'" size="tiny" :bordered="false">
                {{ ext.critical ? '关键' : '非关键' }}
              </n-tag>
              <span class="ext-name">{{ ext.name }}</span>
            </div>
          </div>
        </n-descriptions-item>
      </n-descriptions>

      <!-- 主题/颁发者详情 -->
      <n-divider>主题与颁发者详情</n-divider>
      <div class="detail-grid">
        <n-card title="主题 (Subject)" :bordered="false" size="small">
          <n-descriptions :column="1" size="small" label-align="left">
            <n-descriptions-item v-for="item in certInfo.subjectFields" :key="item.label" :label="item.label">
              {{ item.value }}
            </n-descriptions-item>
          </n-descriptions>
        </n-card>
        <n-card title="颁发者 (Issuer)" :bordered="false" size="small">
          <n-descriptions :column="1" size="small" label-align="left">
            <n-descriptions-item v-for="item in certInfo.issuerFields" :key="item.label" :label="item.label">
              {{ item.value }}
            </n-descriptions-item>
          </n-descriptions>
        </n-card>
      </div>
    </div>

    <!-- 说明 -->
    <div class="info-section">
      <n-divider>使用说明</n-divider>
      <n-alert type="info" :bordered="false">
        粘贴 PEM 格式的 X.509 证书（含 -----BEGIN CERTIFICATE----- 头尾），本工具在前端纯本地解析 ASN.1 DER 结构，提取证书字段，不会上传任何数据。支持 RSA 与 ECDSA 公钥算法识别。
      </n-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  NInput, NButton, NSpace, NAlert, NCard, NDivider,
  NDescriptions, NDescriptionsItem, NTag,
} from 'naive-ui'

// ====== ASN.1 DER 解析器 ======
interface ASN1Node {
  tag: number
  tagClass: number       // 0=universal, 2=context
  constructed: boolean
  valueOffset: number
  valueEnd: number
  children: ASN1Node[]
  raw: Uint8Array
}

// 解析单个 TLV 节点
function parseNode(der: Uint8Array, offset: number): { node: ASN1Node; nextOffset: number } {
  if (offset >= der.length) throw new Error('ASN.1 解析：偏移超出范围')
  const tagByte = der[offset]
  const tagClass = (tagByte >> 6) & 0x03
  const constructed = (tagByte & 0x20) !== 0
  let tagNumber = tagByte & 0x1F
  let pos = offset + 1

  // 多字节标签
  if (tagNumber === 0x1F) {
    tagNumber = 0
    while (pos < der.length) {
      const b = der[pos++]
      tagNumber = (tagNumber << 7) | (b & 0x7F)
      if ((b & 0x80) === 0) break
    }
  }

  // 长度解析
  if (pos >= der.length) throw new Error('ASN.1 解析：缺少长度字节')
  const lenByte = der[pos++]
  let length: number
  if (lenByte < 0x80) {
    length = lenByte
  } else {
    const numBytes = lenByte & 0x7F
    if (numBytes === 0) throw new Error('ASN.1 解析：不支持不定长度编码')
    length = 0
    for (let i = 0; i < numBytes; i++) {
      if (pos >= der.length) throw new Error('ASN.1 解析：长度字节不完整')
      length = (length << 8) | der[pos++]
    }
  }

  const valueOffset = pos
  const valueEnd = pos + length
  if (valueEnd > der.length) throw new Error('ASN.1 解析：数值长度超出数据范围')

  // 递归解析子节点
  const children: ASN1Node[] = []
  if (constructed) {
    let childOffset = valueOffset
    while (childOffset < valueEnd) {
      const { node: child, nextOffset } = parseNode(der, childOffset)
      children.push(child)
      childOffset = nextOffset
    }
  }

  return {
    node: { tag: tagNumber, tagClass, constructed, valueOffset, valueEnd, children, raw: der },
    nextOffset: valueEnd,
  }
}

// 解码 OID
function decodeOID(node: ASN1Node): string {
  const bytes = node.raw.slice(node.valueOffset, node.valueEnd)
  if (bytes.length === 0) return ''
  let result = Math.floor(bytes[0] / 40) + '.' + (bytes[0] % 40)
  let value = 0
  for (let i = 1; i < bytes.length; i++) {
    value = (value << 7) | (bytes[i] & 0x7F)
    if ((bytes[i] & 0x80) === 0) {
      result += '.' + value
      value = 0
    }
  }
  return result
}

// 解码整数（返回十六进制字符串）
function decodeIntegerHex(node: ASN1Node): string {
  const bytes = node.raw.slice(node.valueOffset, node.valueEnd)
  let hex = ''
  for (const b of bytes) hex += b.toString(16).padStart(2, '0')
  // 去除前导 00（正整数符号位）
  if (hex.length > 2 && hex.startsWith('00')) hex = hex.slice(2)
  return hex.toUpperCase()
}

// 解码时间
function decodeTime(node: ASN1Node): string {
  const str = decodeString(node)
  try {
    if (node.tag === 0x17) {
      // UTCTime: YYMMDDHHmmssZ
      let yy = parseInt(str.slice(0, 2))
      yy = yy < 50 ? 2000 + yy : 1900 + yy
      const MM = str.slice(2, 4)
      const DD = str.slice(4, 6)
      const hh = str.slice(6, 8)
      const mm = str.slice(8, 10)
      const ss = str.length >= 12 ? str.slice(10, 12) : '00'
      return `${yy}-${MM}-${DD} ${hh}:${mm}:${ss} UTC`
    } else {
      // GeneralizedTime: YYYYMMDDHHmmssZ
      const yyyy = str.slice(0, 4)
      const MM = str.slice(4, 6)
      const DD = str.slice(6, 8)
      const hh = str.slice(8, 10)
      const mm = str.slice(10, 12)
      const ss = str.length >= 14 ? str.slice(12, 14) : '00'
      return `${yyyy}-${MM}-${DD} ${hh}:${mm}:${ss} UTC`
    }
  } catch {
    return str
  }
}

// 解码字符串（支持多种 ASN.1 字符串类型）
function decodeString(node: ASN1Node): string {
  const bytes = node.raw.slice(node.valueOffset, node.valueEnd)
  // BMPString (UTF-16BE)
  if (node.tag === 0x1E) {
    let str = ''
    for (let i = 0; i < bytes.length; i += 2) {
      const code = (bytes[i] << 8) | bytes[i + 1]
      str += String.fromCharCode(code)
    }
    return str
  }
  return new TextDecoder('utf-8').decode(bytes)
}

// OID 名称映射
const oidNames: Record<string, string> = {
  '2.5.4.3': 'CN',
  '2.5.4.6': 'C',
  '2.5.4.7': 'L',
  '2.5.4.8': 'ST',
  '2.5.4.10': 'O',
  '2.5.4.11': 'OU',
  '1.2.840.113549.1.9.1': 'emailAddress',
  '2.5.29.14': 'subjectKeyIdentifier',
  '2.5.29.15': 'keyUsage',
  '2.5.29.17': 'subjectAltName',
  '2.5.29.19': 'basicConstraints',
  '2.5.29.31': 'cRLDistributionPoints',
  '2.5.29.32': 'certificatePolicies',
  '2.5.29.35': 'authorityKeyIdentifier',
  '2.5.29.37': 'extKeyUsage',
  '1.3.6.1.5.5.7.1.1': 'authorityInfoAccess',
  '1.3.6.1.5.5.7.1.11': 'subjectInfoAccess',
}

// 算法 OID 映射
const algoNames: Record<string, string> = {
  '1.2.840.113549.1.1.1': 'RSA',
  '1.2.840.113549.1.1.5': 'SHA1withRSA',
  '1.2.840.113549.1.1.11': 'SHA256withRSA',
  '1.2.840.113549.1.1.12': 'SHA384withRSA',
  '1.2.840.113549.1.1.13': 'SHA512withRSA',
  '1.2.840.10045.2.1': 'ECDSA (EC)',
  '1.2.840.10045.4.3.2': 'SHA256withECDSA',
  '1.2.840.10045.4.3.3': 'SHA384withECDSA',
  '1.2.840.10045.4.3.4': 'SHA512withECDSA',
  '1.3.101.112': 'Ed25519',
  '1.3.101.113': 'Ed448',
}

// EC 曲线 OID 映射
const curveNames: Record<string, string> = {
  '1.2.840.10045.3.1.7': 'P-256',
  '1.3.132.0.34': 'P-384',
  '1.3.132.0.35': 'P-521',
}

// 解析 Name 结构（RDNSequence）
interface NameField { label: string; value: string }
function parseName(node: ASN1Node): { full: string; fields: NameField[] } {
  const fields: NameField[] = []
  const parts: string[] = []
  for (const rdn of node.children) {
    for (const atv of rdn.children) {
      if (atv.children.length < 2) continue
      const oid = decodeOID(atv.children[0])
      const valNode = atv.children[1]
      const val = decodeString(valNode)
      const label = oidNames[oid] || oid
      fields.push({ label, value: val })
      parts.push(`${label}=${val}`)
    }
  }
  return { full: parts.join(', '), fields }
}

// ====== X.509 证书解析 ======
interface CertInfo {
  version: number
  serialNumber: string
  signatureAlgorithm: string
  issuer: string
  subject: string
  notBefore: string
  notAfter: string
  publicKeyAlgorithm: string
  publicKeySize: string
  sanList: string[]
  extensions: { name: string; critical: boolean }[]
  subjectFields: NameField[]
  issuerFields: NameField[]
}

function parseCertificate(der: Uint8Array): CertInfo {
  // 顶层 Certificate SEQUENCE
  const { node: cert } = parseNode(der, 0)
  if (cert.children.length < 3) throw new Error('证书结构不完整')

  // TBSCertificate
  const tbs = cert.children[0]
  let idx = 0

  // 版本（可选，[0] EXPLICIT）
  let version = 1
  if (tbs.children[0].tagClass === 2 && tbs.children[0].tag === 0) {
    const versionNode = tbs.children[0].children[0]
    const versionBytes = versionNode.raw.slice(versionNode.valueOffset, versionNode.valueEnd)
    version = versionBytes.length > 0 ? versionBytes[0] + 1 : 1
    idx = 1
  }

  // 序列号
  const serialHex = decodeIntegerHex(tbs.children[idx])
  idx++

  // 签名算法
  const sigAlgoOID = decodeOID(tbs.children[idx].children[0])
  const sigAlgoName = algoNames[sigAlgoOID] || sigAlgoOID
  idx++

  // 颁发者
  const issuerInfo = parseName(tbs.children[idx])
  idx++

  // 有效期
  const validity = tbs.children[idx]
  const notBefore = decodeTime(validity.children[0])
  const notAfter = decodeTime(validity.children[1])
  idx++

  // 主题
  const subjectInfo = parseName(tbs.children[idx])
  idx++

  // 公钥信息
  const spki = tbs.children[idx]
  idx++
  const pkAlgoOID = decodeOID(spki.children[0].children[0])
  let pkAlgoName = algoNames[pkAlgoOID] || pkAlgoOID
  let pkSize = '—'

  if (pkAlgoOID === '1.2.840.113549.1.1.1') {
    // RSA: 解析公钥 BIT STRING 中的 RSAPublicKey
    const bitStringNode = spki.children[1]
    const bitBytes = bitStringNode.raw.slice(bitStringNode.valueOffset + 1, bitStringNode.valueEnd)
    const { node: rsaKey } = parseNode(bitBytes, 0)
    if (rsaKey.children.length >= 1) {
      const modulusHex = decodeIntegerHex(rsaKey.children[0])
      pkSize = (modulusHex.length * 4) + ' bit'
    }
  } else if (pkAlgoOID === '1.2.840.10045.2.1') {
    // EC: 参数中的曲线 OID
    if (spki.children[0].children.length >= 2) {
      const curveOID = decodeOID(spki.children[0].children[1])
      const curveName = curveNames[curveOID] || curveOID
      pkAlgoName = `${pkAlgoName} (${curveName})`
      pkSize = curveName === 'P-256' ? '256 bit' : curveName === 'P-384' ? '384 bit' : curveName === 'P-521' ? '521 bit' : curveName
    }
  } else if (pkAlgoOID === '1.3.101.112') {
    pkSize = '256 bit'
  } else if (pkAlgoOID === '1.3.101.113') {
    pkSize = '456 bit'
  }

  // 扩展（可选，[3] EXPLICIT）
  const sanList: string[] = []
  const extensions: { name: string; critical: boolean }[] = []
  for (let i = idx; i < tbs.children.length; i++) {
    const child = tbs.children[i]
    if (child.tagClass === 2 && child.tag === 3) {
      // Extensions SEQUENCE
      const extSeq = child.children[0]
      for (const ext of extSeq.children) {
        const extOID = decodeOID(ext.children[0])
        let critical = false
        let valueNodeIdx = 1
        if (ext.children.length >= 3) {
          // 有 critical 字段
          const critNode = ext.children[1]
          const critBytes = critNode.raw.slice(critNode.valueOffset, critNode.valueEnd)
          critical = critBytes.length > 0 && critBytes[0] !== 0
          valueNodeIdx = 2
        }
        const extName = oidNames[extOID] || extOID
        extensions.push({ name: extName, critical })

        // 解析 SAN
        if (extOID === '2.5.29.17') {
          const extValueNode = ext.children[valueNodeIdx]
          const extBytes = extValueNode.raw.slice(extValueNode.valueOffset, extValueNode.valueEnd)
          const { node: sanSeq } = parseNode(extBytes, 0)
          for (const gn of sanSeq.children) {
            // context-specific 标签
            if (gn.tagClass === 2) {
              if (gn.tag === 2) sanList.push('DNS:' + decodeString(gn))        // dNSName
              else if (gn.tag === 7) {                                          // iPAddress
                const ipBytes = gn.raw.slice(gn.valueOffset, gn.valueEnd)
                if (ipBytes.length === 4) {
                  sanList.push('IP:' + Array.from(ipBytes).join('.'))
                } else if (ipBytes.length === 16) {
                  // IPv6
                  const parts: string[] = []
                  for (let j = 0; j < 16; j += 2) parts.push(ipBytes[j].toString(16) + ipBytes[j + 1].toString(16))
                  sanList.push('IP:' + parts.join(':'))
                }
              }
              else if (gn.tag === 1) sanList.push('email:' + decodeString(gn)) // rfc822Name
              else if (gn.tag === 6) sanList.push('URI:' + decodeString(gn))   // URI
            }
          }
        }
      }
    }
  }

  return {
    version,
    serialNumber: serialHex,
    signatureAlgorithm: sigAlgoName,
    issuer: issuerInfo.full,
    subject: subjectInfo.full,
    notBefore,
    notAfter,
    publicKeyAlgorithm: pkAlgoName,
    publicKeySize: pkSize,
    sanList,
    extensions,
    subjectFields: subjectInfo.fields,
    issuerFields: issuerInfo.fields,
  }
}

// ====== Vue 组件逻辑 ======
const certInput = ref('')
const certInfo = ref<CertInfo | null>(null)
const errorMsg = ref('')
const parsing = ref(false)

// PEM 转 DER
function pemToDer(pem: string): Uint8Array {
  const cleaned = pem.replace(/-----BEGIN CERTIFICATE-----/g, '')
    .replace(/-----END CERTIFICATE-----/g, '')
    .replace(/\s/g, '')
  const binary = atob(cleaned)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function parseCert() {
  errorMsg.value = ''
  certInfo.value = null
  if (!certInput.value.trim()) {
    errorMsg.value = '请先粘贴 PEM 格式的证书内容'
    return
  }
  parsing.value = true
  try {
    const der = pemToDer(certInput.value)
    certInfo.value = parseCertificate(der)
  } catch (e: any) {
    errorMsg.value = '解析失败：' + (e.message || '证书格式不正确，请确认输入为有效的 PEM X.509 证书')
  } finally {
    parsing.value = false
  }
}

function clearAll() {
  certInput.value = ''
  certInfo.value = null
  errorMsg.value = ''
}

// 有效期状态
const validityStatus = computed(() => {
  if (!certInfo.value) return { type: 'default' as const, text: '—' }
  const now = new Date()
  const notAfter = new Date(certInfo.value.notAfter.replace(' UTC', 'Z').replace(' ', 'T'))
  const notBefore = new Date(certInfo.value.notBefore.replace(' UTC', 'Z').replace(' ', 'T'))
  if (now < notBefore) return { type: 'warning' as const, text: '未生效' }
  if (now > notAfter) return { type: 'error' as const, text: '已过期' }
  return { type: 'success' as const, text: '有效' }
})

const remainingDays = computed(() => {
  if (!certInfo.value) return '—'
  const now = new Date()
  const notAfter = new Date(certInfo.value.notAfter.replace(' UTC', 'Z').replace(' ', 'T'))
  const diff = notAfter.getTime() - now.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  if (days < 0) return '已过期'
  return days + ' 天'
})

// 加载示例证书（google.com 证书）
function loadSample() {
  certInput.value = `-----BEGIN CERTIFICATE-----
MIIFqzCCBJOgAwIBAgIQBtBhuXEjBApAB8J+noz+sTANBgkqhkiG9w0BAQsFADBC
MQswCQYDVQQGEwJVUzEeMBwGA1UEChMVR29vZ2xlIFRydXN0IFNlcnZpY2VzMRMw
EQYDVQQDEwpHVFMgQ0EgMEMxMB4XDTI1MDYyNjAwMzQ1N1oXDTI1MDkyMzAwMzQ1
NlowezELMAkGA1UEBhMCVVMxEzARBgNVBAgMCkNhbGlmb3JuaWExFjAUBgNVBAcM
DU1vdW50YWluIFZpZXcxEzARBgNVBAoMCkdvb2dsZSBMTEMxGzAZBgNVBAMMEmdv
b2dsZS5jb20gUkNBNDBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABFnvDMKuwYri
dOPCSm9u2r4qXKlL6O1mLZ3v9S1HHULyFll2tvIZ8K7ZKqWtbC5z5+q4XwIEm3KS
jGGdj2N5QrOjggJ9MIICeTAdBgNVHSUEFjAUBggrBgEFBQcDAQYIKwYBBQUHAwIw
EgYDVR0TAQH/BAgwBgEB/wIBAOAdBgNVHQ4EFgQUqp4UvDBdYWu3pOIfZBUKN5C8
4nQwHwYDVR0jBBgwFoAUinKucyP/Y2dwP6iwzPmmZ6cjTNIwewYDVR0fBHMwcTA2
oDSgMoYwaHR0cDovL2NybHMucGtpLmdvb2cvR1RTQ0EwQy9LMWlYU0ZqQmZHL2Ny
bC5jcnQwOqA4oDaGGmh0dHA6Ly9jcmxzLnBraS5nb28vZ3Rzc2cyL2d0c2dhLmNy
dDA4BggrBgEFBQcBAQAsBzAFBggrBgEFBQcwATBYBggrBgEFBQcBAjA7AzBuMAIG
CCsGAQUFBzABhjFodHRwOi8vb2NzcC5wa2kuZ29vZy9ndHNjYTBjMBMGA1UdJQQM
MAoGCCsGAQUFBwMBMA0GCSqGSIb3DQEBCwUAA4IBAQAI2DgTBFnAhRZFnUM6P3ZA
msE3k3OFv8APwB5wB7PPi4YPNJI5UfSns1vLFqgScJ3gNFqEg3QZEkAXeYyU5GFp
pCwSEjFXZ2v7wcd1+Pn8R0F5jxQX4Xf1uFWFfPwb5F2mXy2U9RofjxQ4dQyWtTwU
nm7qqLZ2UnT9zBjxC1nq3S3GhUDMAsR8bQ4Y7Am3fwsz8R8XJZKlFQpviNnLKSlU
5LPRFzvbRm2Rj9AqUb5FBsNvMBR1M5c3W3A6J73nFh7YCgR3P5g1n7JsB6Wv6PEF
hYqx2MYywJJqU7nWqVZc5Gj2yM3wINxdt
-----END CERTIFICATE-----`
}
</script>

<style scoped>
.ssl-cert-parser {
  max-width: 1000px;
  margin: 0 auto;
}

.input-section {
  margin-bottom: 20px;
}

.action-row {
  margin-top: 12px;
}

.error-alert {
  margin-bottom: 20px;
}

.result-section {
  margin-top: 20px;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.overview-card {
  text-align: center;
}

.overview-label {
  font-size: 12px;
  opacity: 0.6;
  margin-bottom: 6px;
}

.overview-value {
  font-size: 16px;
  font-weight: 600;
}

.overview-value.small {
  font-size: 13px;
}

.serial-code {
  word-break: break-all;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.ext-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ext-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ext-name {
  font-size: 13px;
}

.info-section {
  margin-top: 24px;
}

@media (max-width: 768px) {
  .overview-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  .detail-grid {
    grid-template-columns: 1fr;
  }
}

.dark :deep(.n-card) {
  background: rgba(255, 255, 255, 0.03);
}

.dark :deep(.n-descriptions) {
  background: rgba(255, 255, 255, 0.02);
}
</style>
