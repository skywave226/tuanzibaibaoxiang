<template>
  <div class="image-compress">
    <div class="upload-section">
      <n-upload
        multiple
        directory-dnd
        :show-file-list="false"
        @change="handleUpload"
        accept="image/*"
      >
        <n-upload-dragger>
          <div class="upload-drag-content">
            <div class="text-lg">点击或拖拽图片到此处</div>
            <div class="text-gray-500">支持 JPG、PNG、WebP、GIF，可一次选择多张</div>
          </div>
        </n-upload-dragger>
      </n-upload>
    </div>

    <div class="global-controls" v-if="tasks.length > 0">
      <n-space align="center">
        <span class="control-label">输出格式</span>
        <n-select v-model:value="outputFormat" :options="formatOptions" style="width: 120px" />
        <span class="control-label">质量</span>
        <n-slider v-model:value="quality" :min="10" :max="100" :step="5" style="width: 160px" />
        <span class="quality-label">{{ quality }}%</span>
        <n-button type="primary" @click="compressAll" :loading="compressingCount > 0">
          全部压缩
        </n-button>
        <n-button @click="downloadAll" :disabled="doneCount === 0">打包下载 (ZIP)</n-button>
        <n-button @click="clearAll" type="error" ghost>清空</n-button>
      </n-space>
      <div class="summary" v-if="tasks.length > 0">
        共 {{ tasks.length }} 张，已完成 {{ doneCount }} 张，
        原图总计 {{ formatSize(totalOriginalSize) }}，
        压缩后总计 {{ formatSize(totalCompressedSize) }}，
        节省 {{ formatSize(totalOriginalSize - totalCompressedSize) }}
      </div>
    </div>

    <div class="task-list" v-if="tasks.length > 0">
      <n-card
        v-for="task in tasks"
        :key="task.id"
        size="small"
        class="task-card"
        :class="{ done: task.status === 'done', error: task.status === 'error' }"
      >
        <div class="task-row">
          <div class="thumb">
            <img :src="task.originalUrl" :alt="task.name" />
          </div>
          <div class="task-info">
            <div class="task-name" :title="task.name">{{ task.name }}</div>
            <div class="task-meta">
              <span>原图：{{ formatSize(task.originalSize) }}</span>
              <span v-if="task.compressedSize > 0">
                压缩后：{{ formatSize(task.compressedSize) }}
              </span>
              <span v-if="task.compressedSize > 0" class="saving">
                节省 {{ savingRate(task) }}
              </span>
            </div>
            <div class="task-status">
              <n-tag v-if="task.status === 'pending'" size="small">待压缩</n-tag>
              <n-tag v-else-if="task.status === 'compressing'" size="small" type="warning">压缩中</n-tag>
              <n-tag v-else-if="task.status === 'done'" size="small" type="success">完成</n-tag>
              <n-tag v-else size="small" type="error">失败</n-tag>
              <span v-if="task.error" class="error-msg">{{ task.error }}</span>
            </div>
          </div>
          <div class="task-actions">
            <n-button
              size="small"
              type="primary"
              @click="compressOne(task)"
              :loading="task.status === 'compressing'"
              :disabled="task.status === 'compressing'"
            >
              压缩
            </n-button>
            <n-button
              size="small"
              @click="downloadOne(task)"
              :disabled="task.status !== 'done'"
            >
              下载
            </n-button>
            <n-button size="small" quaternary type="error" @click="removeTask(task)">删除</n-button>
          </div>
        </div>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import {
  NUpload,
  NUploadDragger,
  NButton,
  NSlider,
  NSelect,
  NSpace,
  NCard,
  NTag,
} from 'naive-ui'
import type { UploadFileInfo } from 'naive-ui'

interface ImageTask {
  id: string
  file: File
  name: string
  originalUrl: string
  originalSize: number
  compressedUrl: string
  compressedSize: number
  status: 'pending' | 'compressing' | 'done' | 'error'
  error: string
}

const tasks = ref<ImageTask[]>([])
const quality = ref(80)
const outputFormat = ref<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg')

const formatOptions = [
  { label: 'JPEG', value: 'image/jpeg' },
  { label: 'PNG', value: 'image/png' },
  { label: 'WebP', value: 'image/webp' },
]

const compressingCount = computed(() => tasks.value.filter((t) => t.status === 'compressing').length)
const doneCount = computed(() => tasks.value.filter((t) => t.status === 'done').length)
const totalOriginalSize = computed(() =>
  tasks.value.reduce((sum, t) => sum + t.originalSize, 0)
)
const totalCompressedSize = computed(() =>
  tasks.value.reduce((sum, t) => sum + (t.compressedSize || 0), 0)
)

let idCounter = 0

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

const savingRate = (task: ImageTask) => {
  if (!task.originalSize || !task.compressedSize) return '0%'
  const rate = ((task.originalSize - task.compressedSize) / task.originalSize) * 100
  return (rate > 0 ? '-' : '+') + Math.abs(rate).toFixed(1) + '%'
}

const extensionForMime = (mime: string) => {
  if (mime === 'image/png') return 'png'
  if (mime === 'image/webp') return 'webp'
  return 'jpg'
}

const handleUpload = (data: { file: Required<UploadFileInfo>; fileList: Required<UploadFileInfo>[] }) => {
  const list = data.fileList.length > 0 ? data.fileList : [data.file]
  for (const item of list) {
    const rawFile = item.file
    if (!rawFile || !rawFile.type.startsWith('image/')) continue
    const url = URL.createObjectURL(rawFile)
    tasks.value.push({
      id: String(++idCounter),
      file: rawFile,
      name: rawFile.name,
      originalUrl: url,
      originalSize: rawFile.size,
      compressedUrl: '',
      compressedSize: 0,
      status: 'pending',
      error: '',
    })
  }
}

const compressBlob = (task: ImageTask): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('无法创建 canvas 上下文'))
        return
      }
      ctx.drawImage(img, 0, 0)
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('压缩失败'))
        },
        outputFormat.value,
        outputFormat.value === 'image/png' ? undefined : quality.value / 100
      )
    }
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = task.originalUrl
  })
}

const compressOne = async (task: ImageTask) => {
  if (task.status === 'compressing') return
  task.status = 'compressing'
  task.error = ''
  if (task.compressedUrl) {
    URL.revokeObjectURL(task.compressedUrl)
    task.compressedUrl = ''
    task.compressedSize = 0
  }
  try {
    const blob = await compressBlob(task)
    task.compressedUrl = URL.createObjectURL(blob)
    task.compressedSize = blob.size
    task.status = 'done'
  } catch (e: unknown) {
    task.status = 'error'
    task.error = e instanceof Error ? e.message : '压缩失败'
  }
}

const compressAll = async () => {
  const pending = tasks.value.filter((t) => t.status !== 'compressing')
  await Promise.all(pending.map((t) => compressOne(t)))
}

const downloadOne = (task: ImageTask) => {
  if (!task.compressedUrl) return
  const a = document.createElement('a')
  a.href = task.compressedUrl
  const baseName = task.name.replace(/\.[^.]+$/, '')
  a.download = `${baseName}-compressed.${extensionForMime(outputFormat.value)}`
  a.click()
}

const downloadAll = async () => {
  const doneTasks = tasks.value.filter((t) => t.status === 'done')
  if (doneTasks.length === 0) return
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  for (const task of doneTasks) {
    const ext = extensionForMime(outputFormat.value)
    const baseName = task.name.replace(/\.[^.]+$/, '')
    const response = await fetch(task.compressedUrl)
    const blob = await response.blob()
    zip.file(`${baseName}-compressed.${ext}`, blob)
  }
  const content = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(content)
  const a = document.createElement('a')
  a.href = url
  a.download = `compressed-images-${Date.now()}.zip`
  a.click()
  URL.revokeObjectURL(url)
}

const removeTask = (task: ImageTask) => {
  URL.revokeObjectURL(task.originalUrl)
  if (task.compressedUrl) URL.revokeObjectURL(task.compressedUrl)
  tasks.value = tasks.value.filter((t) => t.id !== task.id)
}

const clearAll = () => {
  for (const task of tasks.value) {
    URL.revokeObjectURL(task.originalUrl)
    if (task.compressedUrl) URL.revokeObjectURL(task.compressedUrl)
  }
  tasks.value = []
}

onBeforeUnmount(() => {
  clearAll()
})
</script>

<style scoped>
.image-compress {
  max-width: 1200px;
  margin: 0 auto;
}
.upload-drag-content {
  padding: 32px;
  text-align: center;
}
.global-controls {
  margin-top: 20px;
  padding: 16px;
  background: #f8f8f8;
  border-radius: 8px;
}
.control-label {
  font-size: 14px;
  color: #666;
}
.quality-label {
  min-width: 48px;
  font-size: 14px;
}
.summary {
  margin-top: 12px;
  font-size: 14px;
  color: #666;
}
.task-list {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.task-card {
  transition: border-color 0.2s;
}
.task-card.done {
  border-left: 4px solid #36ad6a;
}
.task-card.error {
  border-left: 4px solid #d03050;
}
.task-row {
  display: flex;
  align-items: center;
  gap: 16px;
}
.thumb {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #eee;
}
.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.task-info {
  flex: 1;
  min-width: 0;
}
.task-name {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.task-meta {
  margin-top: 6px;
  font-size: 13px;
  color: #666;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.saving {
  color: #36ad6a;
  font-weight: 500;
}
.task-status {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.error-msg {
  color: #d03050;
  font-size: 12px;
}
.task-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
.dark .global-controls {
  background: #2a2a3a;
}
.dark .control-label,
.dark .summary,
.dark .task-meta {
  color: #aaa;
}
@media (max-width: 768px) {
  .task-row {
    flex-direction: column;
    align-items: flex-start;
  }
  .task-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
