<template>
  <div class="video-screenshot">
    <n-alert type="info" class="mb-4">
      通过 HTMLVideoElement 与 Canvas 在浏览器本地截取视频画面，支持精确时间定位与逐帧截图。
    </n-alert>

    <div class="card mb-4">
      <div class="pane-label mb-2">上传视频文件</div>
      <n-upload
        :show-file-list="false"
        :custom-request="handleUpload"
        accept="video/*"
      >
        <n-button type="primary">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><polyline points="16 13 12 9 8 13"/><line x1="12" y1="9" x2="12" y2="19"/></svg></span>
          选择视频文件
        </n-button>
      </n-upload>
      <div v-if="fileName" class="file-info mt-3">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
        <span>{{ fileName }}</span>
        <span class="muted">（{{ fileSize }}）</span>
      </div>
    </div>

    <div class="preview-area" v-if="videoUrl">
      <div class="video-wrap">
        <video
          ref="videoEl"
          :src="videoUrl"
          @loadedmetadata="onLoadedMetadata"
          @seeked="onSeeked"
          @timeupdate="onTimeUpdate"
          crossorigin="anonymous"
          controls
        />
      </div>
    </div>

    <div class="card mt-4" v-if="videoReady">
      <h3 class="text-sm font-bold mb-3">时间点选择</h3>
      <div class="time-row">
        <span class="time-label">当前时间</span>
        <span class="time-value">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
      </div>
      <n-slider
        v-model:value="currentTime"
        :min="0"
        :max="Math.floor(duration)"
        :step="0.01"
        :format-tooltip="formatTime"
        class="mt-2"
      />
      <div class="time-controls mt-3">
        <n-button size="small" @click="stepFrame(-1)">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg></span>上一帧
        </n-button>
        <n-button size="small" @click="stepFrame(1)">
          下一帧<span class=" ml-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></span>
        </n-button>
        <n-button size="small" @click="seekTo(0)">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg></span>回到开头
        </n-button>
        <n-input-number
          v-model:value="currentTime"
          :min="0"
          :max="duration"
          :step="0.1"
          size="small"
          style="width: 140px"
        >
          <template #suffix>秒</template>
        </n-input-number>
      </div>
    </div>

    <div class="toolbar mt-4" v-if="videoReady">
      <n-space>
        <n-button type="primary" @click="capture" :loading="capturing">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg></span>
          截取当前帧
        </n-button>
        <n-select
          v-model:value="imageFormat"
          :options="formatOptions"
          style="width: 140px"
        />
        <n-button @click="download" :disabled="!capturedUrl">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></span>
          下载图片
        </n-button>
        <n-button @click="clearCaptured" :disabled="!capturedUrl">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></span>
          清空
        </n-button>
      </n-space>
    </div>

    <div class="card mt-4" v-if="capturedUrl">
      <div class="pane-label mb-2">截图结果</div>
      <div class="captured-info mb-2">
        格式：{{ imageFormat.toUpperCase() }} · 分辨率：{{ capturedWidth }} × {{ capturedHeight }} · 大小：{{ capturedSize }}
      </div>
      <div class="captured-preview">
        <img :src="capturedUrl" alt="截图预览" />
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
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { NUpload, NButton, NSpace, NSelect, NSlider, NInputNumber, NAlert } from 'naive-ui'
import type { UploadCustomRequestOptions } from 'naive-ui'

const videoEl = ref<HTMLVideoElement | null>(null)
const videoUrl = ref('')
const fileName = ref('')
const fileSize = ref('')
const duration = ref(0)
const currentTime = ref(0)
const videoReady = ref(false)
const capturing = ref(false)
const imageFormat = ref<'png' | 'jpeg'>('png')
const capturedUrl = ref('')
const capturedSize = ref('')
const capturedWidth = ref(0)
const capturedHeight = ref(0)
const statusMsg = ref('')
const statusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

const formatOptions = [
  { label: 'PNG (无损)', value: 'png' },
  { label: 'JPEG (压缩)', value: 'jpeg' },
]

const fps = computed(() => 25) // 默认按 25 帧估算逐帧步进

function formatTime(sec: number) {
  if (!isFinite(sec)) return '0:00.00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  const ms = Math.floor((sec % 1) * 100)
  return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

let originalFile: File | null = null

function handleUpload({ file }: UploadCustomRequestOptions) {
  if (!file.file) return
  reset()
  originalFile = file.file
  fileName.value = file.name
  fileSize.value = formatSize(file.file.size)
  if (videoUrl.value) URL.revokeObjectURL(videoUrl.value)
  videoUrl.value = URL.createObjectURL(file.file)
  statusMsg.value = '视频加载中...'
  statusType.value = 'info'
}

function onLoadedMetadata() {
  duration.value = videoEl.value?.duration || 0
  videoReady.value = true
  statusMsg.value = '视频已就绪，可拖动时间轴选择截图位置'
  statusType.value = 'success'
}

function onTimeUpdate() {
  if (videoEl.value && !capturing.value) {
    currentTime.value = videoEl.value.currentTime
  }
}

function onSeeked() {
  // seek 完成后同步时间
  if (videoEl.value) {
    currentTime.value = videoEl.value.currentTime
  }
}

function seekTo(time: number) {
  if (!videoEl.value) return
  videoEl.value.currentTime = Math.max(0, Math.min(time, duration.value))
}

// 监听滑块变化时跳转视频
watch(currentTime, (val) => {
  if (videoEl.value && Math.abs(videoEl.value.currentTime - val) > 0.05) {
    videoEl.value.currentTime = val
  }
})

// 逐帧步进
function stepFrame(direction: number) {
  if (!videoEl.value) return
  const step = 1 / fps.value
  const next = videoEl.value.currentTime + direction * step
  seekTo(next)
}

async function capture() {
  if (!videoEl.value) return
  capturing.value = true
  statusMsg.value = '正在截取画面...'
  statusType.value = 'info'
  try {
    const video = videoEl.value
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const mime = imageFormat.value === 'png' ? 'image/png' : 'image/jpeg'
    const quality = imageFormat.value === 'jpeg' ? 0.92 : undefined
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, mime, quality)
    )
    if (!blob) throw new Error('截图失败')
    if (capturedUrl.value) URL.revokeObjectURL(capturedUrl.value)
    capturedUrl.value = URL.createObjectURL(blob)
    capturedSize.value = formatSize(blob.size)
    capturedWidth.value = canvas.width
    capturedHeight.value = canvas.height
    statusMsg.value = '截取成功'
    statusType.value = 'success'
  } catch (e) {
    statusMsg.value = '截图失败：' + (e as Error).message
    statusType.value = 'error'
  } finally {
    capturing.value = false
  }
}

function download() {
  if (!capturedUrl.value) return
  const baseName = originalFile ? originalFile.name.replace(/\.[^.]+$/, '') : 'screenshot'
  const a = document.createElement('a')
  a.href = capturedUrl.value
  a.download = `${baseName}_${currentTime.value.toFixed(2)}s.${imageFormat.value}`
  a.click()
}

function clearCaptured() {
  if (capturedUrl.value) URL.revokeObjectURL(capturedUrl.value)
  capturedUrl.value = ''
  capturedSize.value = ''
  capturedWidth.value = 0
  capturedHeight.value = 0
}

function reset() {
  clearCaptured()
  if (videoUrl.value) URL.revokeObjectURL(videoUrl.value)
  videoUrl.value = ''
  fileName.value = ''
  fileSize.value = ''
  duration.value = 0
  currentTime.value = 0
  videoReady.value = false
  originalFile = null
  statusMsg.value = ''
}

onBeforeUnmount(() => {
  if (videoUrl.value) URL.revokeObjectURL(videoUrl.value)
  if (capturedUrl.value) URL.revokeObjectURL(capturedUrl.value)
})
</script>

<style scoped>
.video-screenshot {
  max-width: 1000px;
  margin: 0 auto;
}

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #333;
}

.dark .file-info {
  color: #ddd;
}

.muted {
  color: #999;
  font-size: 13px;
}

.preview-area {
  margin-top: 16px;
}

.video-wrap {
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  justify-content: center;
}

.video-wrap video {
  width: 100%;
  max-height: 480px;
  display: block;
}

.time-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.time-label {
  color: #888;
  font-weight: 500;
}

.time-value {
  font-weight: 600;
  font-family: monospace;
}

.time-controls {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.toolbar {
  display: flex;
  gap: 12px;
}

.captured-info {
  font-size: 13px;
  color: #555;
}

.dark .captured-info {
  color: #aaa;
}

.captured-preview {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  justify-content: center;
}

.dark .captured-preview {
  background: #1f1f23;
}

.captured-preview img {
  max-width: 100%;
  max-height: 480px;
  border-radius: 4px;
}

.card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #eee;
}

.dark .card {
  background: #18181c;
  border-color: #2d2d33;
}
</style>
