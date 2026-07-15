<template>
  <div class="video-to-gif">
    <n-alert type="info" class="mb-4">
      使用 Canvas 逐帧截取视频，并通过纯手写的 LZW 编码器生成 GIF 动图，无需任何外部依赖。支持设置起止时间、帧率与尺寸。
    </n-alert>

    <div class="card mb-4">
      <div class="pane-label mb-2">视频文件</div>
      <n-upload
        :show-file-list="false"
        @change="handleUpload"
        accept="video/*"
      >
        <n-button type="primary">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><polyline points="16 13 12 9 8 13"/><line x1="12" y1="9" x2="12" y2="19"/></svg></span>
          选择视频
        </n-button>
      </n-upload>
      <div class="text-info mt-2" v-if="fileName">
        <span>文件：{{ fileName }}</span>
        <span v-if="videoDuration">时长：{{ videoDuration.toFixed(2) }} 秒</span>
        <span v-if="videoSize">尺寸：{{ videoSize }}</span>
      </div>
    </div>

    <div class="card mb-4" v-if="fileName">
      <h3 class="text-sm font-bold mb-3">转换参数</h3>

      <div class="config-section">
        <div class="config-item">
          <label>开始时间：{{ startTime.toFixed(1) }} 秒</label>
          <n-slider
            v-model:value="startTime"
            :min="0"
            :max="Math.max(0, videoDuration - 0.1)"
            :step="0.1"
            style="width: 220px"
          />
        </div>

        <div class="config-item">
          <label>结束时间：{{ endTime.toFixed(1) }} 秒</label>
          <n-slider
            v-model:value="endTime"
            :min="0.1"
            :max="videoDuration"
            :step="0.1"
            style="width: 220px"
          />
        </div>

        <div class="config-item">
          <label>帧率：{{ fps }} fps</label>
          <n-slider v-model:value="fps" :min="5" :max="30" :step="1" style="width: 160px" />
        </div>

        <div class="config-item">
          <label>最大宽度：{{ maxWidth }} px</label>
          <n-select
            v-model:value="maxWidth"
            :options="widthOptions"
            style="width: 130px"
          />
        </div>

        <div class="config-item">
          <label>抖动（提升画质）</label>
          <n-switch v-model:value="dither">
            <template #checked>开启</template>
            <template #unchecked>关闭</template>
          </n-switch>
        </div>
      </div>

      <div class="hint mt-3">
        预计帧数：{{ estimatedFrames }} 帧，GIF 延迟：{{ Math.round(100 / fps) }} / 100 秒
      </div>
    </div>

    <div class="toolbar mb-4" v-if="fileName">
      <n-space>
        <n-button
          type="primary"
          @click="convert"
          :loading="converting"
          :disabled="converting"
        >
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></span>
          生成 GIF
        </n-button>
        <n-button @click="download" v-if="gifUrl" :disabled="converting">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></span>
          下载 GIF
        </n-button>
      </n-space>
    </div>

    <div class="progress mt-4" v-if="converting || progress > 0">
      <n-progress
        type="line"
        :percentage="progress"
        :indicator-placement="'inside'"
        processing
      />
      <div class="hint mt-1">{{ progressText }}</div>
    </div>

    <div class="preview mt-4" v-if="gifUrl">
      <div class="pane-label mb-2">预览</div>
      <img :src="gifUrl" alt="GIF 预览" />
      <div class="text-info mt-2">
        <span>输出大小：{{ formatSize(gifSize) }}</span>
      </div>
    </div>

    <n-alert
      :type="statusType"
      v-if="statusMsg"
      class="mt-4"
      closable
      @close="statusMsg = ''"
    >
      {{ statusMsg }}
    </n-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount, watch } from 'vue'
import {
  NUpload,
  NButton,
  NSlider,
  NSelect,
  NSwitch,
  NProgress,
  NAlert,
  NSpace,
  useMessage,
} from 'naive-ui'
import type { UploadFileInfo } from 'naive-ui'

const message = useMessage()

const fileName = ref('')
const videoDuration = ref(0)
const videoSize = ref('')
const startTime = ref(0)
const endTime = ref(0)
const fps = ref(10)
const maxWidth = ref(480)
const dither = ref(true)
const converting = ref(false)
const progress = ref(0)
const progressText = ref('')
const gifUrl = ref('')
const gifSize = ref(0)
const statusMsg = ref('')
const statusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

const widthOptions = [
  { label: '320 px', value: 320 },
  { label: '480 px', value: 480 },
  { label: '640 px', value: 640 },
  { label: '800 px', value: 800 },
]

const estimatedFrames = computed(() => {
  if (endTime.value <= startTime.value) return 0
  return Math.max(1, Math.floor((endTime.value - startTime.value) * fps.value))
})

// 视频元数据加载后初始化起止时间
function initTimeRange() {
  startTime.value = 0
  endTime.value = Math.min(videoDuration.value, 5) // 默认前 5 秒
}

// 结束时间不能小于开始时间
watch(startTime, (v) => {
  if (v >= endTime.value) endTime.value = Math.min(videoDuration.value, v + 0.5)
})

const handleUpload = ({ file }: { file: UploadFileInfo }) => {
  if (!file.file) return
  lastFile = file.file
  fileName.value = file.name
  videoSize.value = formatSize(file.file.size)

  if (gifUrl.value) {
    URL.revokeObjectURL(gifUrl.value)
    gifUrl.value = ''
  }

  const video = document.createElement('video')
  video.preload = 'metadata'
  video.src = URL.createObjectURL(file.file)
  video.onloadedmetadata = () => {
    videoDuration.value = video.duration
    videoSize.value = `${video.videoWidth}×${video.videoHeight}`
    initTimeRange()
    URL.revokeObjectURL(video.src)
  }
  video.onerror = () => {
    statusMsg.value = '视频元数据读取失败'
    statusType.value = 'error'
  }
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

// 跳转到指定时间并等待帧就绪
function seek(video: HTMLVideoElement, t: number): Promise<void> {
  return new Promise((resolve) => {
    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked)
      requestAnimationFrame(() => resolve())
    }
    video.addEventListener('seeked', onSeeked)
    video.currentTime = Math.min(t, video.duration - 0.001)
  })
}

// 抽取视频帧
async function extractFrames(
  file: File,
  start: number,
  end: number,
  fpsValue: number,
  maxW: number,
  onProgress: (p: number, text: string) => void,
): Promise<{ data: Uint8ClampedArray; width: number; height: number }[]> {
  const video = document.createElement('video')
  video.src = URL.createObjectURL(file)
  video.muted = true
  video.playsInline = true

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve()
    video.onerror = () => reject(new Error('视频加载失败'))
  })

  let w = video.videoWidth
  let h = video.videoHeight
  if (w > maxW) {
    h = Math.round((h * maxW) / w)
    w = maxW
  }

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  const total = Math.max(1, Math.floor((end - start) * fpsValue))
  const frames: { data: Uint8ClampedArray; width: number; height: number }[] = []

  for (let i = 0; i < total; i++) {
    const t = start + i / fpsValue
    await seek(video, t)
    ctx.drawImage(video, 0, 0, w, h)
    const imgData = ctx.getImageData(0, 0, w, h)
    frames.push({ data: imgData.data, width: w, height: h })
    onProgress(Math.round((i / total) * 60), `抽取帧 ${i + 1}/${total}`)
  }

  URL.revokeObjectURL(video.src)
  return frames
}

// 构建 6×6×6 = 216 色固定调色板（Web 安全色）
function buildPalette(): number[] {
  const pal: number[] = []
  for (let r = 0; r < 6; r++) {
    for (let g = 0; g < 6; g++) {
      for (let b = 0; b < 6; b++) {
        pal.push((r * 51 << 16) | (g * 51 << 8) | (b * 51))
      }
    }
  }
  return pal
}

// 将 RGBA 像素量化为调色板索引（可选 Floyd-Steinberg 抖动）
function quantizeFrame(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  useDither: boolean,
): Uint8Array {
  const out = new Uint8Array(width * height)
  const buf = new Float32Array(rgba) // 工作缓冲区

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      let r = buf[i]
      let g = buf[i + 1]
      let b = buf[i + 2]

      let ri = Math.max(0, Math.min(5, Math.round(r / 51)))
      let gi = Math.max(0, Math.min(5, Math.round(g / 51)))
      let bi = Math.max(0, Math.min(5, Math.round(b / 51)))

      out[y * width + x] = ri * 36 + gi * 6 + bi

      if (useDither) {
        const pr = ri * 51
        const pg = gi * 51
        const pb = bi * 51
        const er = r - pr
        const eg = g - pg
        const eb = b - pb
        // Floyd-Steinberg 误差扩散
        distributeError(buf, x + 1, y, width, height, er, eg, eb, 7 / 16)
        distributeError(buf, x - 1, y + 1, width, height, er, eg, eb, 3 / 16)
        distributeError(buf, x, y + 1, width, height, er, eg, eb, 5 / 16)
        distributeError(buf, x + 1, y + 1, width, height, er, eg, eb, 1 / 16)
      }
    }
  }
  return out
}

function distributeError(
  buf: Float32Array,
  x: number,
  y: number,
  width: number,
  height: number,
  er: number,
  eg: number,
  eb: number,
  factor: number,
) {
  if (x < 0 || x >= width || y < 0 || y >= height) return
  const i = (y * width + x) * 4
  buf[i] += er * factor
  buf[i + 1] += eg * factor
  buf[i + 2] += eb * factor
}

// LZW 编码 + 变长位打包（LSB 优先），返回打包后的字节流
function lzwAndPack(indexedPixels: Uint8Array, minCodeSize: number): number[] {
  const clearCode = 1 << minCodeSize
  const endCode = clearCode + 1
  let codeSize = minCodeSize + 1
  let nextCode = clearCode + 2

  // 字典：key = (prefix<<8)|k -> code，使用 Int16Array 提速
  const dict = new Int16Array(1 << 20).fill(-1)

  const out: number[] = []
  let bitBuf = 0
  let bitCount = 0

  const write = (code: number) => {
    bitBuf |= code << bitCount
    bitCount += codeSize
    while (bitCount >= 8) {
      out.push(bitBuf & 0xff)
      bitBuf >>= 8
      bitCount -= 8
    }
  }

  const resetDict = () => {
    dict.fill(-1)
    nextCode = clearCode + 2
    codeSize = minCodeSize + 1
  }

  write(clearCode)

  if (indexedPixels.length === 0) {
    write(endCode)
    if (bitCount > 0) out.push(bitBuf & 0xff)
    return out
  }

  let prefix = indexedPixels[0]
  for (let i = 1; i < indexedPixels.length; i++) {
    const k = indexedPixels[i]
    const key = (prefix << 8) | k
    const existing = dict[key]
    if (existing !== -1) {
      prefix = existing
    } else {
      write(prefix)
      if (nextCode <= 4095) {
        dict[key] = nextCode
        nextCode++
        // 当字典大小达到 2^codeSize 时增加码长
        if (nextCode === 1 << codeSize && codeSize < 12) {
          codeSize++
        }
      } else {
        // 字典已满，发送清除码并重置
        write(clearCode)
        resetDict()
      }
      prefix = k
    }
  }
  write(prefix)
  write(endCode)
  if (bitCount > 0) out.push(bitBuf & 0xff)
  return out
}

// 组装 GIF 文件
function encodeGIF(
  frames: { data: Uint8Array; width: number; height: number }[],
  width: number,
  height: number,
  palette: number[],
  delay: number,
): Uint8Array {
  const bytes: number[] = []
  const pushU16 = (v: number) => {
    bytes.push(v & 0xff)
    bytes.push((v >> 8) & 0xff)
  }

  // GIF89a 头部
  bytes.push(0x47, 0x49, 0x46, 0x38, 0x39, 0x61)
  // 逻辑屏幕描述符
  pushU16(width)
  pushU16(height)
  bytes.push(0xf7) // 全局颜色表标志=1，颜色分辨率=7，排序=0，GCT 大小=7（256 项）
  bytes.push(0) // 背景色索引
  bytes.push(0) // 像素宽高比
  // 全局颜色表（256 项）
  for (let i = 0; i < 256; i++) {
    if (i < palette.length) {
      const c = palette[i]
      bytes.push((c >> 16) & 0xff, (c >> 8) & 0xff, c & 0xff)
    } else {
      bytes.push(0, 0, 0)
    }
  }
  // NETSCAPE 循环扩展（无限循环）
  bytes.push(0x21, 0xff, 0x0b)
  bytes.push(0x4e, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2e, 0x30)
  bytes.push(0x03, 0x01)
  pushU16(0)
  bytes.push(0x00)

  // 每一帧
  for (const frame of frames) {
    // 图形控制扩展
    bytes.push(0x21, 0xf9, 0x04)
    bytes.push(0x00) // 处置方法=0（保留），无透明
    pushU16(delay)
    bytes.push(0)
    bytes.push(0x00)
    // 图像描述符
    bytes.push(0x2c)
    pushU16(0)
    pushU16(0)
    pushU16(frame.width)
    pushU16(frame.height)
    bytes.push(0) // 无局部颜色表
    // 图像数据
    bytes.push(8) // LZW 最小码长
    const packed = lzwAndPack(frame.data, 8)
    let pos = 0
    while (pos < packed.length) {
      const len = Math.min(255, packed.length - pos)
      bytes.push(len)
      for (let i = 0; i < len; i++) bytes.push(packed[pos + i])
      pos += len
    }
    bytes.push(0) // 块终止符
  }

  bytes.push(0x3b) // GIF 结尾
  return new Uint8Array(bytes)
}

// 主转换流程
async function convert() {
  if (!fileName.value) return
  if (endTime.value <= startTime.value) {
    message.warning('结束时间需大于开始时间')
    return
  }

  if (!lastFile) {
    message.error('请重新选择视频文件')
    return
  }

  converting.value = true
  progress.value = 0
  progressText.value = '准备中...'

  try {
    const frames = await extractFrames(
      lastFile,
      startTime.value,
      endTime.value,
      fps.value,
      maxWidth.value,
      (p, text) => {
        progress.value = p
        progressText.value = text
      },
    )

    if (frames.length === 0) {
      message.warning('未抽取到任何帧')
      converting.value = false
      return
    }

    const palette = buildPalette()
    const width = frames[0].width
    const height = frames[0].height
    const delay = Math.max(2, Math.round(100 / fps.value))

    // 量化每一帧
    const indexedFrames = frames.map((f, idx) => {
      progress.value = 60 + Math.round((idx / frames.length) * 30)
      progressText.value = `量化帧 ${idx + 1}/${frames.length}`
      return {
        data: quantizeFrame(f.data, f.width, f.height, dither.value),
        width: f.width,
        height: f.height,
      }
    })

    progress.value = 90
    progressText.value = '编码 GIF...'
    await new Promise((r) => setTimeout(r, 0)) // 让 UI 刷新

    const gifBytes = encodeGIF(indexedFrames, width, height, palette, delay)
    const blob = new Blob([gifBytes], { type: 'image/gif' })

    if (gifUrl.value) URL.revokeObjectURL(gifUrl.value)
    gifUrl.value = URL.createObjectURL(blob)
    gifSize.value = blob.size
    progress.value = 100
    progressText.value = '完成'
    statusMsg.value = `生成成功：${frames.length} 帧，${formatSize(blob.size)}`
    statusType.value = 'success'
  } catch (err) {
    statusMsg.value = '转换失败：' + (err as Error).message
    statusType.value = 'error'
  } finally {
    converting.value = false
  }
}

let lastFile: File | null = null

function download() {
  if (!gifUrl.value) return
  const a = document.createElement('a')
  a.href = gifUrl.value
  a.download = `${fileName.value.replace(/\.[^.]+$/, '') || 'video'}.gif`
  a.click()
}

onBeforeUnmount(() => {
  if (gifUrl.value) URL.revokeObjectURL(gifUrl.value)
})
</script>

<style scoped>
.video-to-gif {
  max-width: 1000px;
  margin: 0 auto;
}

.card {
  padding: 16px;
  border: 1px solid var(--n-border-color, #e5e7eb);
  border-radius: 8px;
  background: var(--n-color, #fff);
}

.dark .card {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.09);
}

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
}

.text-info {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  font-size: 12px;
  color: #888;
}

.config-section {
  display: flex;
  gap: 28px;
  flex-wrap: wrap;
  align-items: flex-end;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-item label {
  font-size: 13px;
  font-weight: 500;
  color: #555;
}

.dark .config-item label {
  color: #aaa;
}

.hint {
  font-size: 12px;
  color: #888;
}

.toolbar {
  display: flex;
  gap: 12px;
}

.preview img {
  max-width: 100%;
  max-height: 360px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.dark .preview img {
  border-color: rgba(255, 255, 255, 0.09);
}

.progress {
  padding: 12px 0;
}
</style>
