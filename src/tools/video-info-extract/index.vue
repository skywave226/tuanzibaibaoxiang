<template>
  <div class="video-info-extract">
    <n-alert type="info" class="mb-4">
      通过 HTMLVideoElement 读取视频文件的元数据信息，包括时长、分辨率、宽高比、格式、估算比特率等，全部在浏览器本地完成。
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
          preload="metadata"
        />
      </div>
    </div>

    <div class="info-cards mt-4" v-if="infoLoaded">
      <div class="info-card-grid">
        <div class="info-card">
          <div class="info-icon"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
          <div class="info-content">
            <div class="info-label">时长</div>
            <div class="info-value">{{ durationText }}</div>
            <div class="info-sub">{{ duration.toFixed(2) }} 秒</div>
          </div>
        </div>

        <div class="info-card">
          <div class="info-icon"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></div>
          <div class="info-content">
            <div class="info-label">分辨率</div>
            <div class="info-value">{{ videoWidth }} × {{ videoHeight }}</div>
            <div class="info-sub">{{ resolutionLabel }}</div>
          </div>
        </div>

        <div class="info-card">
          <div class="info-icon"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg></div>
          <div class="info-content">
            <div class="info-label">宽高比</div>
            <div class="info-value">{{ aspectRatio }}</div>
            <div class="info-sub">{{ orientation }}</div>
          </div>
        </div>

        <div class="info-card">
          <div class="info-icon"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
          <div class="info-content">
            <div class="info-label">文件大小</div>
            <div class="info-value">{{ fileSize }}</div>
            <div class="info-sub">{{ fileBytes }} 字节</div>
          </div>
        </div>

        <div class="info-card">
          <div class="info-icon"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 13h2"/><path d="M14 13h2"/><path d="M9 17h2"/><path d="M14 17h2"/></svg></div>
          <div class="info-content">
            <div class="info-label">文件格式</div>
            <div class="info-value">{{ fileFormat }}</div>
            <div class="info-sub">{{ mimeType || '未知 MIME' }}</div>
          </div>
        </div>

        <div class="info-card">
          <div class="info-icon"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 0 0-10 10h20A10 10 0 0 0 12 2z"/><path d="M12 12l4-4"/></svg></div>
          <div class="info-content">
            <div class="info-label">估算比特率</div>
            <div class="info-value">{{ bitrate }}</div>
            <div class="info-sub">{{ bitrateNote }}</div>
          </div>
        </div>

        <div class="info-card">
          <div class="info-icon"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg></div>
          <div class="info-content">
            <div class="info-label">总帧数 (估算)</div>
            <div class="info-value">{{ estimatedFrames }}</div>
            <div class="info-sub">按 {{ assumedFps }} fps 估算</div>
          </div>
        </div>

        <div class="info-card">
          <div class="info-icon"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg></div>
          <div class="info-content">
            <div class="info-label">像素总数</div>
            <div class="info-value">{{ totalPixels }}</div>
            <div class="info-sub">≈ {{ megapixels }} MP</div>
          </div>
        </div>
      </div>
    </div>

    <div class="card mt-4" v-if="infoLoaded">
      <h3 class="text-sm font-bold mb-3">详细信息</h3>
      <n-descriptions :column="2" label-placement="left" bordered>
        <n-descriptions-item label="文件名">{{ fileName }}</n-descriptions-item>
        <n-descriptions-item label="文件扩展名">.{{ fileExtension }}</n-descriptions-item>
        <n-descriptions-item label="时长（秒）">{{ duration.toFixed(3) }}</n-descriptions-item>
        <n-descriptions-item label="时长（格式化）">{{ durationText }}</n-descriptions-item>
        <n-descriptions-item label="视频宽度">{{ videoWidth }} px</n-descriptions-item>
        <n-descriptions-item label="视频高度">{{ videoHeight }} px</n-descriptions-item>
        <n-descriptions-item label="宽高比">{{ aspectRatio }}</n-descriptions-item>
        <n-descriptions-item label="方向">{{ orientation }}</n-descriptions-item>
        <n-descriptions-item label="文件大小">{{ fileSize }}</n-descriptions-item>
        <n-descriptions-item label="字节数">{{ fileBytes }}</n-descriptions-item>
        <n-descriptions-item label="MIME 类型">{{ mimeType || '未提供' }}</n-descriptions-item>
        <n-descriptions-item label="比特率（估算）">{{ bitrate }}</n-descriptions-item>
        <n-descriptions-item label="估算总帧数">{{ estimatedFrames }}</n-descriptions-item>
        <n-descriptions-item label="像素总数">{{ totalPixels }}</n-descriptions-item>
      </n-descriptions>
    </div>

    <div class="toolbar mt-4" v-if="infoLoaded">
      <n-space>
        <n-button @click="copyInfo">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></span>
          复制信息
        </n-button>
        <n-button @click="reset">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg></span>
          重置
        </n-button>
      </n-space>
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
import { ref, computed } from 'vue'
import { NUpload, NButton, NSpace, NAlert, NDescriptions, NDescriptionsItem } from 'naive-ui'
import type { UploadCustomRequestOptions } from 'naive-ui'

const videoEl = ref<HTMLVideoElement | null>(null)
const videoUrl = ref('')
const fileName = ref('')
const fileSize = ref('')
const fileBytes = ref(0)
const mimeType = ref('')
const duration = ref(0)
const videoWidth = ref(0)
const videoHeight = ref(0)
const infoLoaded = ref(false)
const statusMsg = ref('')
const statusType = ref<'info' | 'success' | 'warning' | 'error'>('info')
const assumedFps = ref(30)

// 时长格式化
const durationText = computed(() => {
  if (!duration.value) return '0:00'
  const totalSec = Math.floor(duration.value)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
})

// 文件扩展名
const fileExtension = computed(() => {
  if (!fileName.value) return ''
  const parts = fileName.value.split('.')
  return parts.length > 1 ? parts.pop()!.toLowerCase() : ''
})

// 文件格式
const fileFormat = computed(() => {
  const ext = fileExtension.value.toUpperCase()
  const map: Record<string, string> = {
    MP4: 'MP4',
    WEBM: 'WebM',
    OGG: 'Ogg',
    MOV: 'QuickTime',
    AVI: 'AVI',
    MKV: 'Matroska',
    M4V: 'MPEG-4',
    FLV: 'Flash Video',
    WMV: 'Windows Media',
    '3GP': '3GPP',
  }
  return map[ext] || ext || '未知'
})

// 宽高比（简化为常见比值）
const aspectRatio = computed(() => {
  if (!videoWidth.value || !videoHeight.value) return '-'
  const w = videoWidth.value
  const h = videoHeight.value
  const g = gcd(w, h)
  const rw = w / g
  const rh = h / g
  // 常见宽高比标识
  const common: Record<string, string> = {
    '16:9': '16:9',
    '4:3': '4:3',
    '21:9': '21:9',
    '9:16': '9:16',
    '1:1': '1:1',
    '3:2': '3:2',
    '2:1': '2:1',
  }
  const ratioStr = `${rw}:${rh}`
  if (common[ratioStr]) return common[ratioStr]
  // 数值比
  return (w / h).toFixed(2) + ':1'
})

const orientation = computed(() => {
  if (!videoWidth.value || !videoHeight.value) return '-'
  if (videoWidth.value > videoHeight.value) return '横向 (Landscape)'
  if (videoWidth.value < videoHeight.value) return '纵向 (Portrait)'
  return '正方形 (Square)'
})

// 估算比特率 = 文件大小 * 8 / 时长
const bitrate = computed(() => {
  if (!duration.value || !fileBytes.value) return '-'
  const bps = (fileBytes.value * 8) / duration.value
  return formatBitrate(bps)
})

const bitrateNote = computed(() => {
  if (!duration.value || !fileBytes.value) return '总比特率（含音视频）'
  const bps = (fileBytes.value * 8) / duration.value
  if (bps >= 10_000_000) return '高码率（高清视频）'
  if (bps >= 2_000_000) return '中等码率（标清/高清）'
  if (bps >= 500_000) return '低码率（流畅播放）'
  return '极低码率（语音/动画）'
})

// 估算总帧数
const estimatedFrames = computed(() => {
  if (!duration.value) return '-'
  return Math.round(duration.value * assumedFps.value).toLocaleString()
})

// 像素总数
const totalPixels = computed(() => {
  if (!videoWidth.value || !videoHeight.value) return '-'
  return (videoWidth.value * videoHeight.value).toLocaleString()
})

const megapixels = computed(() => {
  if (!videoWidth.value || !videoHeight.value) return '0'
  return ((videoWidth.value * videoHeight.value) / 1_000_000).toFixed(2)
})

// 分辨率标签
const resolutionLabel = computed(() => {
  const h = videoHeight.value
  if (h >= 2160) return '4K UHD'
  if (h >= 1440) return '2K QHD'
  if (h >= 1080) return 'Full HD'
  if (h >= 720) return 'HD'
  if (h >= 480) return 'SD'
  if (h > 0) return '低分辨率'
  return '-'
})

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

function formatBitrate(bps: number) {
  if (bps >= 1_000_000) return (bps / 1_000_000).toFixed(2) + ' Mbps'
  if (bps >= 1_000) return (bps / 1_000).toFixed(0) + ' kbps'
  return bps.toFixed(0) + ' bps'
}

function handleUpload({ file }: UploadCustomRequestOptions) {
  if (!file.file) return
  reset()
  fileName.value = file.name
  fileBytes.value = file.file.size
  fileSize.value = formatSize(file.file.size)
  mimeType.value = file.file.type || ''
  if (videoUrl.value) URL.revokeObjectURL(videoUrl.value)
  videoUrl.value = URL.createObjectURL(file.file)
  statusMsg.value = '正在读取视频信息...'
  statusType.value = 'info'
}

function onLoadedMetadata() {
  const video = videoEl.value
  if (!video) return
  duration.value = video.duration || 0
  videoWidth.value = video.videoWidth || 0
  videoHeight.value = video.videoHeight || 0
  infoLoaded.value = true
  statusMsg.value = '信息提取完成'
  statusType.value = 'success'
}

// 复制信息到剪贴板
async function copyInfo() {
  const lines = [
    `文件名: ${fileName.value}`,
    `文件格式: ${fileFormat.value} (${fileExtension.value})`,
    `MIME 类型: ${mimeType.value || '未知'}`,
    `文件大小: ${fileSize.value} (${fileBytes.value} 字节)`,
    `时长: ${durationText.value} (${duration.value.toFixed(3)} 秒)`,
    `分辨率: ${videoWidth.value} × ${videoHeight.value} (${resolutionLabel.value})`,
    `宽高比: ${aspectRatio.value}`,
    `方向: ${orientation.value}`,
    `估算比特率: ${bitrate.value}`,
    `估算总帧数: ${estimatedFrames.value} (按 ${assumedFps.value} fps)`,
    `像素总数: ${totalPixels.value} (≈ ${megapixels.value} MP)`,
  ]
  const text = lines.join('\n')
  try {
    await navigator.clipboard.writeText(text)
    statusMsg.value = '信息已复制到剪贴板'
    statusType.value = 'success'
  } catch {
    statusMsg.value = '复制失败，请手动选择文本'
    statusType.value = 'warning'
  }
}

function reset() {
  if (videoUrl.value) URL.revokeObjectURL(videoUrl.value)
  videoUrl.value = ''
  fileName.value = ''
  fileSize.value = ''
  fileBytes.value = 0
  mimeType.value = ''
  duration.value = 0
  videoWidth.value = 0
  videoHeight.value = 0
  infoLoaded.value = false
  statusMsg.value = ''
}
</script>

<style scoped>
.video-info-extract {
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
  max-height: 360px;
  display: block;
}

.info-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.info-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 14px;
  transition: all 0.2s;
}

.info-card:hover {
  border-color: #3b82f6;
  transform: translateY(-2px);
}

.dark .info-card {
  background: #18181c;
  border-color: #2d2d33;
}

.dark .info-card:hover {
  border-color: #6ea8fe;
}

.info-icon {
  width: 28px;
  height: 28px;
  color: #3b82f6;
  flex-shrink: 0;
}

.dark .info-icon {
  color: #6ea8fe;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.info-label {
  font-size: 12px;
  color: #888;
}

.info-value {
  font-size: 16px;
  font-weight: 700;
  color: #222;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dark .info-value {
  color: #f0f0f0;
}

.info-sub {
  font-size: 11px;
  color: #aaa;
}

.toolbar {
  display: flex;
  gap: 12px;
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
