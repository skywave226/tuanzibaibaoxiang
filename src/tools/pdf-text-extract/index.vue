<template>
  <div class="pdf-text-extract">
    <!-- 文件上传区域：支持拖拽与点击 -->
    <n-upload
      :show-file-list="false"
      accept="application/pdf"
      :multiple="false"
      @change="handleUpload"
    >
      <n-upload-dragger class="upload-dragger">
        <div class="upload-inner">
          <span class=" upload-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><text x="7" y="19" font-size="7" stroke="none" fill="currentColor">PDF</text></svg></span>
          <p class="upload-text">点击或拖拽 PDF 文件到此处</p>
          <p class="upload-hint">仅支持 .pdf 格式文件</p>
        </div>
      </n-upload-dragger>
    </n-upload>

    <!-- 文件信息展示 -->
    <div class="card mt-4" v-if="fileName">
      <div class="file-info">
        <span class="file-name">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></span>
          {{ fileName }}
        </span>
        <span class="file-meta" v-if="fileSize">（{{ fileSize }}）</span>
      </div>
    </div>

    <!-- 提取进度 -->
    <div class="card mt-4" v-if="extracting">
      <div class="progress-row">
        <span class="progress-label">正在提取文本...</span>
        <span class="progress-text">{{ progress }}%</span>
      </div>
      <n-progress
        type="line"
        :percentage="progress"
        :show-indicator="false"
        class="mt-2"
      />
      <p class="progress-hint mt-2">首次使用需加载 pdf.js 库，请稍候</p>
    </div>

    <!-- 提取结果 -->
    <div class="card mt-4" v-if="extractedText">
      <div class="result-header">
        <div class="result-title">提取结果</div>
        <n-space>
          <n-button size="small" @click="copyText">复制文本</n-button>
          <n-button size="small" type="primary" @click="downloadText">
            下载 .txt
          </n-button>
        </n-space>
      </div>
      <n-input
        v-model:value="extractedText"
        type="textarea"
        :rows="16"
        readonly
        placeholder="提取的文本内容将显示在这里"
        class="text-output"
      />
      <div class="text-stats mt-2">
        <n-tag size="small">字符数：{{ charCount }}</n-tag>
        <n-tag size="small">行数：{{ lineCount }}</n-tag>
      </div>
    </div>

    <!-- 元数据信息 -->
    <div class="card mt-4" v-if="pdfMeta">
      <div class="result-title mb-2">PDF 元数据</div>
      <div class="meta-grid">
        <div class="meta-item" v-if="pdfMeta.numPages">
          <span class="meta-label">页数：</span>
          <span class="meta-value">{{ pdfMeta.numPages }}</span>
        </div>
        <div class="meta-item" v-if="pdfMeta.title">
          <span class="meta-label">标题：</span>
          <span class="meta-value">{{ pdfMeta.title }}</span>
        </div>
        <div class="meta-item" v-if="pdfMeta.author">
          <span class="meta-label">作者：</span>
          <span class="meta-value">{{ pdfMeta.author }}</span>
        </div>
        <div class="meta-item" v-if="pdfMeta.creator">
          <span class="meta-label">创建者：</span>
          <span class="meta-value">{{ pdfMeta.creator }}</span>
        </div>
      </div>
    </div>

    <!-- 错误提示 -->
    <n-alert v-if="errorMsg" type="error" class="mt-4" closable @close="errorMsg = ''">
      {{ errorMsg }}
    </n-alert>

    <!-- 使用说明 -->
    <div class="card mt-4" v-if="!extractedText && !extracting">
      <div class="result-title mb-2">使用说明</div>
      <ul class="tips-list">
        <li>支持文本型 PDF 文件，扫描件（图片型 PDF）无法直接提取文字</li>
        <li>首次使用时会动态加载 pdf.js 库（约 1MB），后续使用会更快</li>
        <li>所有处理均在浏览器本地完成，文件不会上传到服务器</li>
        <li>提取后可复制或下载为 .txt 文本文件</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  NUpload,
  NUploadDragger,
  NButton,
  NInput,
  NProgress,
  NAlert,
  NTag,
  NSpace,
} from 'naive-ui'
import { useMessage } from 'naive-ui'
import type { UploadFileInfo } from 'naive-ui'

const message = useMessage()

// 状态变量
const fileName = ref('')
const fileSize = ref('')
const extracting = ref(false)
const progress = ref(0)
const extractedText = ref('')
const errorMsg = ref('')
const pdfMeta = ref<{
  numPages?: number
  title?: string
  author?: string
  creator?: string
} | null>(null)

// 字符与行数统计
const charCount = computed(() => extractedText.value.length)
const lineCount = computed(() =>
  extractedText.value ? extractedText.value.split('\n').length : 0
)

// pdf.js 库引用
let pdfjsLib: any = null

// 动态加载 pdf.js CDN 脚本
async function loadPdfJs(): Promise<any> {
  if (pdfjsLib) return pdfjsLib
  // 使用 CDN 加载 pdf.js
  const script = document.createElement('script')
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
  return new Promise((resolve, reject) => {
    script.onload = () => {
      pdfjsLib = (window as any).pdfjsLib
      // 设置 worker 路径
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
      resolve(pdfjsLib)
    }
    script.onerror = () => reject(new Error('加载 pdf.js 失败，请检查网络连接'))
    document.head.appendChild(script)
  })
}

// 格式化文件大小
function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

// 处理文件上传
async function handleUpload({ file }: { file: UploadFileInfo }) {
  if (!file.file) return
  // 重置状态
  errorMsg.value = ''
  extractedText.value = ''
  pdfMeta.value = null
  fileName.value = file.name
  fileSize.value = formatSize(file.file.size)

  extracting.value = true
  progress.value = 0

  try {
    // 加载 pdf.js 库
    const lib = await loadPdfJs()

    // 读取文件为 ArrayBuffer
    const arrayBuffer = await file.file.arrayBuffer()

    // 加载 PDF 文档
    const loadingTask = lib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise

    // 提取元数据
    const meta = await pdf.getMetadata().catch(() => null)
    const info = meta?.info || {}
    pdfMeta.value = {
      numPages: pdf.numPages,
      title: info.Title || undefined,
      author: info.Author || undefined,
      creator: info.Creator || undefined,
    }

    // 逐页提取文本
    let fullText = ''
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      // 拼接每页文本内容
      const pageText = content.items
        .map((item: any) => item.str)
        .join('')
      fullText += pageText + '\n\n'
      // 更新进度
      progress.value = Math.round((i / pdf.numPages) * 100)
    }

    extractedText.value = fullText.trim()
    message.success(`成功提取 ${pdf.numPages} 页文本`)
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : String(e)
    message.error('PDF 文本提取失败')
  } finally {
    extracting.value = false
    progress.value = 0
  }
}

// 复制文本
async function copyText() {
  if (!extractedText.value) return
  await navigator.clipboard.writeText(extractedText.value)
  message.success('已复制到剪贴板')
}

// 下载文本文件
function downloadText() {
  if (!extractedText.value) return
  const blob = new Blob([extractedText.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName.value.replace(/\.pdf$/i, '') + '.txt'
  a.click()
  URL.revokeObjectURL(url)
  message.success('文件已下载')
}
</script>

<style scoped>
.pdf-text-extract {
  max-width: 1000px;
  margin: 0 auto;
}

.upload-dragger {
  padding: 40px 20px;
}

.upload-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.upload-icon {
  font-size: 48px;
  color: #d03050;
}

.dark .upload-icon {
  color: #ff6b6b;
}

.upload-text {
  font-size: 16px;
  font-weight: 500;
  margin: 0;
}

.upload-hint {
  font-size: 13px;
  color: #999;
  margin: 0;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}

.file-name {
  display: flex;
  align-items: center;
  font-weight: 500;
}

.file-meta {
  color: #999;
}

.progress-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-label {
  font-size: 14px;
  font-weight: 500;
}

.progress-text {
  font-size: 14px;
  color: #36ad6a;
  font-weight: 600;
}

.progress-hint {
  font-size: 12px;
  color: #999;
  margin: 0;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.result-title {
  font-size: 14px;
  font-weight: 600;
}

.text-output :deep(textarea) {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.text-stats {
  display: flex;
  gap: 8px;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.meta-item {
  font-size: 13px;
}

.meta-label {
  color: #888;
}

.meta-value {
  font-weight: 500;
}

.tips-list {
  padding-left: 20px;
  margin: 0;
  font-size: 13px;
  line-height: 1.8;
  color: #666;
}

.dark .tips-list {
  color: #aaa;
}
</style>
