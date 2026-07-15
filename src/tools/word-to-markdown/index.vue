<template>
  <div class="word-to-markdown">
    <n-alert type="info" class="mb-4">
      上传 .docx 文件，自动提取内容并转换为 Markdown 格式。处理过程在浏览器本地完成。基于 mammoth.js 实现。
    </n-alert>

    <div class="card mb-4">
      <h3 class="text-sm font-bold mb-3">上传 Word 文档</h3>
      <n-upload
        accept=".docx"
        :max="1"
        :show-file-list="false"
        @change="handleUpload"
      >
        <n-upload-dragger>
          <div class="upload-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 12h6"/><path d="M9 16h6"/></svg>
          </div>
          <div class="upload-text">点击或拖拽 .docx 文件到此处</div>
          <div class="upload-hint">仅支持 .docx 格式，不支持 .doc</div>
        </n-upload-dragger>
      </n-upload>

      <div class="file-info-box" v-if="fileName">
        <div class="file-name">
          <span class=" file-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 12h6"/><path d="M9 16h6"/></svg></span>
          {{ fileName }}
        </div>
        <div class="file-meta">{{ formatSize(fileSize) }}</div>
        <n-button size="small" quaternary type="error" @click="clear">移除</n-button>
      </div>
    </div>

    <div class="toolbar mb-4" v-if="fileName">
      <n-button type="primary" @click="convert" :loading="converting" :disabled="!fileBuffer">
        <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></span>
        转换为 Markdown
      </n-button>
    </div>

    <div class="card" v-if="markdown">
      <div class="result-header">
        <h3 class="text-sm font-bold">转换结果</h3>
        <div class="result-actions">
          <n-button size="small" type="primary" @click="copy">复制</n-button>
          <n-button size="small" @click="download">下载 .md</n-button>
        </div>
      </div>
      <n-input
        v-model:value="markdown"
        type="textarea"
        :autosize="{ minRows: 12, maxRows: 30 }"
        readonly
      />
      <div class="result-meta mt-2">
        <span>字符数：{{ markdown.length }}</span>
        <span>行数：{{ markdown.split('\n').length }}</span>
      </div>
    </div>

    <n-alert :type="statusType" v-if="statusMsg" class="mt-4" closable @close="statusMsg = ''">
      {{ statusMsg }}
    </n-alert>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NUpload, NUploadDragger, NInput, NAlert } from 'naive-ui'
import type { UploadFileInfo } from 'naive-ui'

const fileName = ref('')
const fileSize = ref(0)
const fileBuffer = ref<ArrayBuffer | null>(null)
const markdown = ref('')
const converting = ref(false)
const statusMsg = ref('')
const statusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

// 动态加载 mammoth.js CDN 脚本
function loadMammoth(): Promise<any> {
  return new Promise((resolve, reject) => {
    const w = window as any
    if (w.mammoth) {
      resolve(w.mammoth)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js'
    script.async = true
    script.onload = () => {
      if (w.mammoth) resolve(w.mammoth)
      else reject(new Error('mammoth.js 加载失败'))
    }
    script.onerror = () => reject(new Error('mammoth.js 加载失败，请检查网络连接'))
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
async function handleUpload(data: { file: Required<UploadFileInfo>; fileList: Required<UploadFileInfo>[]; event?: Event }) {
  const rawFile = data.file?.file
  if (!rawFile) return
  fileName.value = rawFile.name
  fileSize.value = rawFile.size
  fileBuffer.value = await rawFile.arrayBuffer()
  markdown.value = ''
  statusMsg.value = ''
}

// 清除
function clear() {
  fileName.value = ''
  fileSize.value = 0
  fileBuffer.value = null
  markdown.value = ''
  statusMsg.value = ''
}

// 转换
async function convert() {
  if (!fileBuffer.value) return

  converting.value = true
  statusMsg.value = '正在加载转换引擎并转换...'
  statusType.value = 'info'

  try {
    const mammoth = await loadMammoth()
    // 提取 HTML
    const result = await mammoth.convertToHtml({ arrayBuffer: fileBuffer.value })
    const html = result.value
    // 将 HTML 转换为 Markdown
    markdown.value = htmlToMarkdown(html)
    statusMsg.value = '转换成功！'
    statusType.value = 'success'
  } catch (e: any) {
    statusMsg.value = '转换失败：' + (e.message || e)
    statusType.value = 'error'
  } finally {
    converting.value = false
  }
}

// 简易 HTML 转 Markdown 转换器
function htmlToMarkdown(html: string): string {
  // 创建临时 DOM 元素解析 HTML
  const container = document.createElement('div')
  container.innerHTML = html
  return nodeToMarkdown(container).trim()
}

// 递归遍历 DOM 节点转换为 Markdown
function nodeToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent || '').replace(/\s+/g, ' ')
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return ''

  const el = node as HTMLElement
  const tag = el.tagName.toLowerCase()
  const children = Array.from(el.childNodes).map(nodeToMarkdown).join('')

  switch (tag) {
    case 'h1':
      return '\n# ' + children.trim() + '\n\n'
    case 'h2':
      return '\n## ' + children.trim() + '\n\n'
    case 'h3':
      return '\n### ' + children.trim() + '\n\n'
    case 'h4':
      return '\n#### ' + children.trim() + '\n\n'
    case 'h5':
      return '\n##### ' + children.trim() + '\n\n'
    case 'h6':
      return '\n###### ' + children.trim() + '\n\n'
    case 'p':
      return children.trim() + '\n\n'
    case 'br':
      return '  \n'
    case 'strong':
    case 'b':
      return '**' + children.trim() + '**'
    case 'em':
    case 'i':
      return '*' + children.trim() + '*'
    case 'u':
      return children
    case 's':
    case 'del':
      return '~~' + children.trim() + '~~'
    case 'code':
      return '`' + children + '`'
    case 'pre':
      return '\n```\n' + el.textContent + '\n```\n\n'
    case 'blockquote':
      return children.trim().split('\n').map((l: string) => '> ' + l).join('\n') + '\n\n'
    case 'a': {
      const href = el.getAttribute('href') || ''
      return '[' + children.trim() + '](' + href + ')'
    }
    case 'img': {
      const alt = el.getAttribute('alt') || ''
      const src = el.getAttribute('src') || ''
      return '![' + alt + '](' + src + ')'
    }
    case 'ul':
      return Array.from(el.children)
        .map(li => '- ' + nodeToMarkdown(li).trim())
        .join('\n') + '\n\n'
    case 'ol':
      return Array.from(el.children)
        .map((li, i) => (i + 1) + '. ' + nodeToMarkdown(li).trim())
        .join('\n') + '\n\n'
    case 'li':
      return children
    case 'table':
      return tableToMarkdown(el)
    case 'hr':
      return '\n---\n\n'
    default:
      return children
  }
}

// 表格转换为 Markdown 表格
function tableToMarkdown(table: HTMLElement): string {
  const rows = Array.from(table.querySelectorAll('tr'))
  if (rows.length === 0) return ''
  const lines: string[] = []
  rows.forEach((row, rowIndex) => {
    const cells = Array.from(row.querySelectorAll('th, td'))
      .map(cell => nodeToMarkdown(cell).trim().replace(/\|/g, '\\|'))
    lines.push('| ' + cells.join(' | ') + ' |')
    // 表头后添加分隔行
    if (rowIndex === 0) {
      lines.push('| ' + cells.map(() => '---').join(' | ') + ' |')
    }
  })
  return '\n' + lines.join('\n') + '\n\n'
}

// 复制
async function copy() {
  if (!markdown.value) return
  try {
    await navigator.clipboard.writeText(markdown.value)
    statusMsg.value = '已复制到剪贴板'
    statusType.value = 'success'
  } catch {
    statusMsg.value = '复制失败，请手动复制'
    statusType.value = 'error'
  }
}

// 下载
function download() {
  if (!markdown.value) return
  const blob = new Blob([markdown.value], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = (fileName.value.replace(/\.docx$/i, '') || 'document') + '.md'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.word-to-markdown {
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

.file-info-box {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
}

.dark .file-info-box {
  border-color: #333;
  background: #1e1e2e;
}

.file-info-box .file-name {
  flex: 1;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.file-icon {
  color: #2b7cd6;
  font-size: 18px;
}

.file-meta {
  font-size: 12px;
  color: #888;
}

.dark .file-meta {
  color: #aaa;
}

.toolbar {
  display: flex;
  gap: 12px;
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.result-actions {
  display: flex;
  gap: 8px;
}

.result-meta {
  display: flex;
  gap: 24px;
  font-size: 12px;
  color: #888;
}

.dark .result-meta {
  color: #aaa;
}
</style>
