<template>
  <div class="pdf-merge">
    <n-alert type="info" class="mb-4">
      上传多个 PDF 文件并按顺序合并为一个。处理过程在浏览器本地完成，文件不会上传到服务器。基于 pdf-lib 实现。
    </n-alert>

    <div class="card mb-4">
      <h3 class="text-sm font-bold mb-3">上传 PDF 文件</h3>
      <n-upload
        accept="application/pdf"
        multiple
        directory-dnd
        :show-file-list="false"
        :custom-request="handleUpload"
      >
        <n-upload-dragger>
          <div class="upload-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
          </div>
          <div class="upload-text">点击或拖拽 PDF 文件到此处</div>
          <div class="upload-hint">支持多文件上传</div>
        </n-upload-dragger>
      </n-upload>
    </div>

    <div class="card mb-4" v-if="pdfList.length > 0">
      <div class="list-header">
        <h3 class="text-sm font-bold">文件列表（{{ pdfList.length }} 个）</h3>
        <span class="list-hint">可上移 / 下移调整合并顺序</span>
      </div>

      <div class="file-list">
        <div v-for="(item, index) in pdfList" :key="item.id" class="file-item">
          <div class="file-index">{{ index + 1 }}</div>
          <div class="file-info">
            <div class="file-name">
              <span class=" file-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><text x="7" y="19" font-size="7" stroke="none" fill="currentColor">PDF</text></svg></span>
              {{ item.name }}
            </div>
            <div class="file-meta">{{ formatSize(item.size) }} · {{ item.pageCount }} 页</div>
          </div>
          <div class="file-actions">
            <n-button size="tiny" quaternary :disabled="index === 0" @click="moveUp(index)">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
            </n-button>
            <n-button size="tiny" quaternary :disabled="index === pdfList.length - 1" @click="moveDown(index)">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
            </n-button>
            <n-button size="tiny" quaternary type="error" @click="removeFile(index)">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </n-button>
          </div>
        </div>
      </div>

      <div class="toolbar mt-4">
        <n-button type="primary" @click="merge" :loading="merging" :disabled="pdfList.length < 2">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></span>
          合并 PDF
        </n-button>
        <n-button @click="clearAll">清空</n-button>
      </div>
    </div>

    <n-alert :type="statusType" v-if="statusMsg" class="mt-4" closable @close="statusMsg = ''">
      {{ statusMsg }}
    </n-alert>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NUpload, NUploadDragger, NAlert } from 'naive-ui'
import type { UploadCustomRequestOptions } from 'naive-ui'

// pdf-lib 的类型较复杂，这里使用 any 简化处理
interface PdfItem {
  id: string
  name: string
  size: number
  pageCount: number
  bytes: ArrayBuffer
}

const pdfList = ref<PdfItem[]>([])
const merging = ref(false)
const statusMsg = ref('')
const statusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

// 动态加载 pdf-lib CDN 脚本
function loadPdfLib(): Promise<any> {
  return new Promise((resolve, reject) => {
    const w = window as any
    if (w.PDFLib) {
      resolve(w.PDFLib)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js'
    script.async = true
    script.onload = () => {
      if (w.PDFLib) {
        resolve(w.PDFLib)
      } else {
        reject(new Error('pdf-lib 加载失败'))
      }
    }
    script.onerror = () => reject(new Error('pdf-lib 加载失败，请检查网络连接'))
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
async function handleUpload({ file }: UploadCustomRequestOptions) {
  const rawFile = file.file as File
  if (!rawFile) return

  try {
    const arrayBuffer = await rawFile.arrayBuffer()
    const pdfLib = await loadPdfLib()
    const pdfDoc = await pdfLib.PDFDocument.load(arrayBuffer)
    const pageCount = pdfDoc.getPageCount()

    pdfList.value.push({
      id: file.id || String(Date.now()),
      name: rawFile.name,
      size: rawFile.size,
      pageCount,
      bytes: arrayBuffer,
    })
    statusMsg.value = ''
  } catch (e: any) {
    statusMsg.value = `加载文件 ${rawFile.name} 失败：${e.message || e}`
    statusType.value = 'error'
  }
}

// 上移
function moveUp(index: number) {
  if (index === 0) return
  const list = pdfList.value
  ;[list[index - 1], list[index]] = [list[index], list[index - 1]]
  pdfList.value = [...list]
}

// 下移
function moveDown(index: number) {
  const list = pdfList.value
  if (index === list.length - 1) return
  ;[list[index + 1], list[index]] = [list[index], list[index + 1]]
  pdfList.value = [...list]
}

// 移除文件
function removeFile(index: number) {
  pdfList.value.splice(index, 1)
}

// 清空
function clearAll() {
  pdfList.value = []
  statusMsg.value = ''
}

// 合并 PDF
async function merge() {
  if (pdfList.value.length < 2) {
    statusMsg.value = '请至少上传 2 个 PDF 文件'
    statusType.value = 'warning'
    return
  }

  merging.value = true
  statusMsg.value = '正在合并...'
  statusType.value = 'info'

  try {
    const pdfLib = await loadPdfLib()
    const mergedPdf = await pdfLib.PDFDocument.create()

    // 按顺序复制所有页面
    for (const item of pdfList.value) {
      const srcDoc = await pdfLib.PDFDocument.load(item.bytes)
      const pages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices())
      pages.forEach((page: any) => mergedPdf.addPage(page))
    }

    const mergedBytes = await mergedPdf.save()
    const blob = new Blob([mergedBytes], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = 'merged.pdf'
    a.click()
    URL.revokeObjectURL(url)

    statusMsg.value = `合并成功！已将 ${pdfList.value.length} 个文件合并为一个 PDF`
    statusType.value = 'success'
  } catch (e: any) {
    statusMsg.value = '合并失败：' + (e.message || e)
    statusType.value = 'error'
  } finally {
    merging.value = false
  }
}
</script>

<style scoped>
.pdf-merge {
  max-width: 1000px;
  margin: 0 auto;
}

.upload-icon {
  font-size: 40px;
  color: #888;
  margin-bottom: 8px;
}

.dark .upload-icon {
  color: #aaa;
}

.upload-text {
  font-size: 14px;
  font-weight: 500;
}

.upload-hint {
  font-size: 12px;
  color: #888;
  margin-top: 4px;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.list-hint {
  font-size: 12px;
  color: #888;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
}

.dark .file-item {
  border-color: #333;
  background: #1e1e2e;
}

.file-index {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #36ad6a;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
}

.file-icon {
  color: #ff5252;
  font-size: 16px;
}

.file-meta {
  font-size: 12px;
  color: #888;
  margin-top: 2px;
}

.dark .file-meta {
  color: #aaa;
}

.file-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.toolbar {
  display: flex;
  gap: 12px;
}
</style>
