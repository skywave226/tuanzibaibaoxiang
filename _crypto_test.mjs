// 临时端到端验证脚本：验证 Keccak-256 / RIPEMD-160 / secp256k1 / Base58Check / EIP-55 实现
// 测试后删除
import crypto from 'crypto'

// ====== Hex / 字节工具 ======
function toHex(b) { return Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('') }
function hexToBytes(hex) { const o = new Uint8Array(hex.length / 2); for (let i = 0; i < o.length; i++) o[i] = parseInt(hex.substr(i * 2, 2), 16); return o }
function bigToHexPadded(v, bytes) { let h = v.toString(16); if (h.length > bytes * 2) h = h.slice(-bytes * 2); return h.padStart(bytes * 2, '0') }
function enc(s) { return new TextEncoder().encode(s) }
function sha256(data) { return Uint8Array.from(crypto.createHash('sha256').update(Buffer.from(data)).digest()) }

// ====== Keccak-256（Ethereum 原始版本，padding 0x01...0x80）======
const KECCAK_RC = [
  0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an, 0x8000000080008000n, 0x000000000000808bn, 0x0000000080000001n,
  0x8000000080008081n, 0x8000000000008009n, 0x000000000000008an, 0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
  0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n, 0x8000000000008003n, 0x8000000000008002n, 0x8000000000000080n,
  0x000000000000800an, 0x800000008000000an, 0x8000000080008081n, 0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n,
]
const KECCAK_ROT = [[0, 36, 3, 41, 18], [1, 44, 10, 45, 2], [62, 6, 43, 15, 61], [28, 55, 25, 21, 56], [27, 20, 39, 8, 14]]
const MASK64 = 0xFFFFFFFFFFFFFFFFn
function rotl64(x, n) { const nn = BigInt(n); return (((x << nn) | (x >> (64n - nn))) & MASK64) }
function keccakF(state) {
  for (let round = 0; round < 24; round++) {
    const C = new Array(5); for (let x = 0; x < 5; x++) C[x] = state[x] ^ state[x + 5] ^ state[x + 10] ^ state[x + 15] ^ state[x + 20]
    const D = new Array(5); for (let x = 0; x < 5; x++) D[x] = C[(x + 4) % 5] ^ rotl64(C[(x + 1) % 5], 1)
    for (let x = 0; x < 5; x++) for (let y = 0; y < 5; y++) state[x + 5 * y] ^= D[x]
    const B = new Array(25).fill(0n)
    for (let x = 0; x < 5; x++) for (let y = 0; y < 5; y++) B[y + 5 * ((2 * x + 3 * y) % 5)] = rotl64(state[x + 5 * y], KECCAK_ROT[x][y])
    for (let x = 0; x < 5; x++) for (let y = 0; y < 5; y++) state[x + 5 * y] = (B[x + 5 * y] ^ ((~B[((x + 1) % 5) + 5 * y]) & B[((x + 2) % 5) + 5 * y])) & MASK64
    state[0] ^= KECCAK_RC[round]
  }
}
function keccak256(data) {
  const rate = 136
  const padded = new Uint8Array(Math.ceil((data.length + 1) / rate) * rate)
  padded.set(data); padded[data.length] = 0x01; padded[padded.length - 1] |= 0x80
  const state = new Array(25).fill(0n)
  for (let off = 0; off < padded.length; off += rate) {
    for (let i = 0; i < rate; i++) { const laneIdx = i >> 3, byteOffset = i & 7; state[laneIdx] ^= BigInt(padded[off + i]) << (BigInt(byteOffset) * 8n) }
    keccakF(state)
  }
  const out = new Uint8Array(32)
  for (let i = 0; i < 32; i++) { const laneIdx = i >> 3, byteOffset = i & 7; out[i] = Number((state[laneIdx] >> (BigInt(byteOffset) * 8n)) & 0xffn) }
  return out
}

// ====== RIPEMD-160 ======
const RL = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,7,4,13,1,10,6,15,3,12,0,9,5,2,14,11,8,3,10,14,4,9,15,8,1,2,7,0,6,13,11,5,12,1,9,11,10,0,8,12,4,13,3,7,15,14,5,6,2,4,0,5,9,7,12,2,10,14,1,3,8,11,6,15,13]
const RR = [5,14,7,0,9,2,11,4,13,6,15,8,1,10,3,12,6,11,3,7,0,13,5,10,14,15,8,12,4,9,1,2,15,5,1,3,7,14,6,9,11,8,12,2,10,0,4,13,8,6,4,1,3,11,15,0,5,12,2,13,9,7,10,14,12,15,10,4,1,5,8,7,6,2,13,14,0,3,9,11]
const SL = [11,14,15,12,5,8,7,9,11,13,14,15,6,7,9,8,7,6,8,13,11,9,7,15,7,12,15,9,11,7,13,12,11,13,6,7,14,9,13,15,14,8,13,6,5,12,7,5,11,12,14,15,14,15,9,8,9,14,5,6,8,6,5,12,9,15,5,11,6,8,13,12,5,12,13,14,11,8,5,6]
const SR = [8,9,9,11,13,15,15,5,7,7,8,11,14,14,12,6,9,13,15,7,12,8,9,11,7,7,12,7,6,15,13,11,9,7,15,11,8,6,6,14,12,13,5,14,13,13,7,5,15,5,8,11,14,14,6,14,6,9,12,9,12,5,15,8,8,5,12,9,12,5,14,6,8,13,6,5,15,13,11,11]
const KL = [0x00000000, 0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xa953fd4e]
const KR = [0x50a28be6, 0x5c4dd124, 0x6d703ef3, 0x7a6d76e9, 0x00000000]
function rol32(x, n) { return ((x << n) | (x >>> (32 - n))) >>> 0 }
function ripemdF(round, x, y, z) { switch (round) { case 0: return (x ^ y ^ z) >>> 0; case 1: return ((x & y) | (~x & z)) >>> 0; case 2: return ((x | ~y) ^ z) >>> 0; case 3: return ((x & z) | (y & ~z)) >>> 0; default: return (x ^ (y | ~z)) >>> 0 } }
function ripemd160(data) {
  let h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476, h4 = 0xc3d2e1f0
  const bitLen = BigInt(data.length) * 8n; const padded = []
  for (let i = 0; i < data.length; i++) padded.push(data[i]); padded.push(0x80)
  while (padded.length % 64 !== 56) padded.push(0)
  for (let i = 0; i < 8; i++) padded.push(Number((bitLen >> BigInt(i * 8)) & 0xffn))
  for (let off = 0; off < padded.length; off += 64) {
    const X = new Array(16)
    for (let j = 0; j < 16; j++) { const b0 = padded[off + j * 4], b1 = padded[off + j * 4 + 1], b2 = padded[off + j * 4 + 2], b3 = padded[off + j * 4 + 3]; X[j] = ((b0) | (b1 << 8) | (b2 << 16) | (b3 << 24)) >>> 0 }
    let A = h0, B = h1, C = h2, D = h3, E = h4; let Ap = h0, Bp = h1, Cp = h2, Dp = h3, Ep = h4
    for (let j = 0; j < 80; j++) {
      const r = Math.floor(j / 16)
      const tt = (rol32((A + ripemdF(r, B, C, D) + X[RL[j]] + KL[r]) >>> 0, SL[j]) + E) >>> 0
      A = E; E = D; D = rol32(C, 10); C = B; B = tt
      const tt2 = (rol32((Ap + ripemdF(4 - r, Bp, Cp, Dp) + X[RR[j]] + KR[r]) >>> 0, SR[j]) + Ep) >>> 0
      Ap = Ep; Ep = Dp; Dp = rol32(Cp, 10); Cp = Bp; Bp = tt2
    }
    const T = (h1 + C + Dp) >>> 0; h1 = (h2 + D + Ep) >>> 0; h2 = (h3 + E + Ap) >>> 0; h3 = (h4 + A + Bp) >>> 0; h4 = (h0 + B + Cp) >>> 0; h0 = T
  }
  const out = new Uint8Array(20); const hs = [h0, h1, h2, h3, h4]
  for (let i = 0; i < 5; i++) { out[i * 4] = hs[i] & 0xff; out[i * 4 + 1] = (hs[i] >>> 8) & 0xff; out[i * 4 + 2] = (hs[i] >>> 16) & 0xff; out[i * 4 + 3] = (hs[i] >>> 24) & 0xff }
  return out
}

// ====== secp256k1 ======
const P = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2Fn
const Gx = 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798n
const Gy = 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8n
function mod(a, m) { return ((a % m) + m) % m }
function modPow(base, exp, m) { let r = 1n; base = mod(base, m); while (exp > 0n) { if (exp & 1n) r = (r * base) % m; base = (base * base) % m; exp >>= 1n } return r }
function modInverse(a, m) { return modPow(a, m - 2n, m) }
function pointAdd(p1, p2) {
  if (p1 === null) return p2; if (p2 === null) return p1
  const [x1, y1] = p1, [x2, y2] = p2
  if (x1 === x2 && mod(y1 + y2, P) === 0n) return null
  let m
  if (x1 === x2 && y1 === y2) m = mod(3n * x1 * x1 * modInverse(mod(2n * y1, P), P), P)
  else m = mod((y2 - y1) * modInverse(mod(x2 - x1, P), P), P)
  const x3 = mod(m * m - x1 - x2, P), y3 = mod(m * (x1 - x3) - y1, P)
  return [x3, y3]
}
function scalarMult(k, point) { let R = null, cur = point; while (k > 0n) { if (k & 1n) R = pointAdd(R, cur); cur = pointAdd(cur, cur); k >>= 1n } return R }

// ====== Base58Check ======
const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
function base58Encode(bytes) { let num = 0n; for (const b of bytes) num = (num << 8n) | BigInt(b); let s = ''; while (num > 0n) { const rem = num % 58n; num = num / 58n; s = ALPHABET[Number(rem)] + s } for (const b of bytes) { if (b === 0) s = '1' + s; else break } return s }
function base58CheckEncode(version, payload) {
  const wv = new Uint8Array(1 + payload.length); wv[0] = version; wv.set(payload, 1)
  const checksum = sha256(sha256(wv)).slice(0, 4)
  const full = new Uint8Array(wv.length + 4); full.set(wv, 0); full.set(checksum, wv.length)
  return base58Encode(full)
}

// ====== EIP-55 ======
function toChecksumAddress(addrHex) {
  const lower = addrHex.toLowerCase()
  const hashHex = toHex(keccak256(enc(lower)))
  let out = '0x'
  for (let i = 0; i < lower.length; i++) { const ch = lower[i]; if (ch >= '0' && ch <= '9') out += ch; else { const nibble = parseInt(hashHex[i], 16); out += nibble >= 8 ? ch.toUpperCase() : ch } }
  return out
}

// ====== 派生函数（与 index.vue 一致）======
function deriveETH(k) {
  const pub = scalarMult(k, [Gx, Gy])
  const px = bigToHexPadded(pub[0], 32), py = bigToHexPadded(pub[1], 32)
  const hash = keccak256(hexToBytes(px + py))
  const addrHex = toHex(hash.slice(12))
  return { address: toChecksumAddress(addrHex), compressedPub: '0x04' + px + py }
}
function deriveBTC(k) {
  const pub = scalarMult(k, [Gx, Gy])
  const px = bigToHexPadded(pub[0], 32)
  const prefix = (pub[1] & 1n) === 0n ? 0x02 : 0x03
  const compressedPub = new Uint8Array(33); compressedPub[0] = prefix; compressedPub.set(hexToBytes(px), 1)
  const ripe = ripemd160(sha256(compressedPub))
  return { address: base58CheckEncode(0x00, ripe), wif: base58CheckEncode(0x80, hexToBytes(bigToHexPadded(k, 32) + '01')), compressedPubHex: toHex(compressedPub) }
}

// ====== 测试 ======
const tests = []
function check(name, got, want) { const ok = got === want; tests.push({ name, ok, got, want }) }

// Keccak-256（权威：js-sha3）
check('Keccak-256("")', toHex(keccak256(enc(''))), 'c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470')
check('Keccak-256("abc")', toHex(keccak256(enc('abc'))), '4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45')
check('Keccak-256("message digest")', toHex(keccak256(enc('message digest'))), '856ab8a3ad0f6168a4d0ba8d77487243f3655db6fc5b0e1669bc05b1287e0147')

// RIPEMD-160（权威：Node crypto）
check('RIPEMD-160("")', toHex(ripemd160(enc(''))), '9c1185a5c5e9fc54612808977ee8f548b2258d31')
check('RIPEMD-160("abc")', toHex(ripemd160(enc('abc'))), '8eb208f7e05d987a9b044a8e98c6b087f15a0bfc')
check('RIPEMD-160("message digest")', toHex(ripemd160(enc('message digest'))), '5d0689ef49d2fae572b881b123a85ffa21595f36')

// secp256k1 标量乘法（权威：以太坊已知"弱私钥"地址，privkey=1→G, =2→2G 点加倍, =3→G+2G 点加法）
check('ETH privkey=1 地址', deriveETH(1n).address.toLowerCase(), '0x7e5f4552091a69125d5dfcb7b8c2659029395bdf')
check('ETH privkey=2 地址 (点加倍)', deriveETH(2n).address.toLowerCase(), '0x2b5ad5c4795c026514f8317c7a215e218dccd6cf')
check('ETH privkey=3 地址 (点加法)', deriveETH(3n).address.toLowerCase(), '0x6813eb9362372eef6200f3b1dbc3f819671cba69')

// EIP-55 自洽性：用已验证的 Keccak 重新计算，应与输出一致
for (const k of [1n, 2n, 3n]) {
  const addr = deriveETH(k).address
  const recomputed = toChecksumAddress(addr.slice(2).toLowerCase())
  check(`EIP-55 自洽 privkey=${k}`, addr, recomputed)
}

// BTC：privkey=1 压缩公钥（G.y 为偶数 → 0x02 前缀）
check('BTC privkey=1 压缩公钥', deriveBTC(1n).compressedPubHex, '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798')
// BTC：privkey=1 压缩 WIF（权威：Bitcoin 规范）
check('BTC privkey=1 WIF', deriveBTC(1n).wif, 'KwDiBf89QgGbjEhKnhXJuH7LrciVrZi3qYjgd9M7rFU73sVHnoqn')

let allPass = true
for (const t of tests) { if (!t.ok) allPass = false; console.log(`${t.ok ? 'PASS' : 'FAIL'}  ${t.name}`); if (!t.ok) { console.log(`  got:  ${t.got}`); console.log(`  want: ${t.want}`) } }
console.log(allPass ? '\nALL TESTS PASSED' : '\nSOME TESTS FAILED')
process.exit(allPass ? 0 : 1)
