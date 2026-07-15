<template>
  <div class="txt-to-epub">
    <n-alert type="info" class="mb-4">
      上传 TXT 文本文件，配置书籍信息和章节规则，生成符合 EPUB 2/3 规范的电子书。处理过程在浏览器本地完成。基于 JSZip 实现。
    </n-alert>

    <div class="card mb-4">
      <h3 class="text-sm font-bold mb-3">上传 TXT 文件</h3>
      <n-upload
        accept=".txt,text/plain"
        :max="1"
        :show-file-list="false"
        @change="handleUpload"
      >
        <n-upload-dragger>
          <div class="upload-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div class="upload-text">点击或拖拽 TXT 文件到此处</div>
          <div class="upload-hint">支持 UTF-8 / GBK 编码文本</div>
        </n-upload-dragger>
      </n-upload>

      <div class="file-info-box" v-if="fileName">
        <div class="file-name">
          <span class=" file-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></span>
          {{ fileName }}
        </div>
        <div class="file-meta">{{ formatSize(fileSize) }} · {{ charCount }} 字符</div>
        <n-button size="small" quaternary type="error" @click="clear">移除</n-button>
      </div>
    </div>

    <div class="card mb-4" v-if="fileName">
      <h3 class="text-sm font-bold mb-3">书籍信息</h3>
      <div class="config-section">
        <div class="config-item">
          <label>书名</label>
          <n-input v-model:value="bookTitle" placeholder="请输入书名" style="width: 260px" />
        </div>
        <div class="config-item">
          <label>作者</label>
          <n-input v-model:value="bookAuthor" placeholder="请输入作者" style="width: 200px" />
        </div>
      </div>

      <h3 class="text-sm font-bold mb-3 mt-4">章节设置</h3>
      <div class="config-section">
        <div class="config-item">
          <label>章节分隔规则</label>
          <n-select
            v-model:value="chapterMode"
            :options="chapterOptions"
            style="width: 220px"
          />
        </div>
        <div class="config-item" v-if="chapterMode === 'custom'">
          <label>自定义分隔符（正则）</label>
          <n-input v-model:value="customPattern" placeholder="如：第.+章" style="width: 220px" />
        </div>
        <div class="config-item">
          <label>每章最大字数</label>
          <n-input-number v-model:value="maxChars" :min="0" :max="100000" :step="500" />
          <div class="hint">设为 0 表示不按字数拆分</div>
        </div>
      </div>

      <div class="chapter-preview mt-3" v-if="chapters.length > 0">
        <div class="range-label">将生成 {{ chapters.length }} 章：</div>
        <div class="chapter-list">
          <div v-for="(ch, i) in chapters.slice(0, 10)" :key="i" class="chapter-item">
            <span class="ch-num">{{ i + 1 }}.</span>
            <span class="ch-title">{{ ch.title }}</span>
            <span class="ch-words">{{ ch.content.length }} 字</span>
          </div>
          <div v-if="chapters.length > 10" class="ch-more">...还有 {{ chapters.length - 10 }} 章</div>
        </div>
      </div>

      <div class="toolbar mt-4">
        <n-button type="primary" @click="generate" :loading="generating" :disabled="!fileName">
          <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="12 18 12 12 9 15"/><line x1="15" y1="15" x2="12" y2="12"/></svg></span>
          生成 EPUB
        </n-button>
      </div>
    </div>

    <n-alert :type="statusType" v-if="statusMsg" class="mt-4" closable @close="statusMsg = ''">
      {{ statusMsg }}
    </n-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NButton, NUpload, NUploadDragger, NInput, NInputNumber, NSelect, NAlert } from 'naive-ui'
import type { UploadFileInfo } from 'naive-ui'

interface Chapter {
  title: string
  content: string
}

const fileName = ref('')
const fileSize = ref(0)
const fileContent = ref('')
const charCount = ref(0)
const bookTitle = ref('未命名电子书')
const bookAuthor = ref('匿名')
const chapterMode = ref<'line' | 'chapter' | 'custom' | 'none'>('chapter')
const customPattern = ref('第.+章')
const maxChars = ref(0)
const generating = ref(false)
const statusMsg = ref('')
const statusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

const chapterOptions = [
  { label: '按"第X章"标题拆分', value: 'chapter' },
  { label: '按空行拆分', value: 'line' },
  { label: '自定义正则拆分', value: 'custom' },
  { label: '不拆分（整本为一章）', value: 'none' },
]

// 解析章节
const chapters = computed<Chapter[]>(() => {
  if (!fileContent.value) return []
  const content = fileContent.value
  let result: Chapter[] = []

  if (chapterMode.value === 'none') {
    result = [{ title: bookTitle.value || '正文', content }]
  } else if (chapterMode.value === 'line') {
    // 按空行拆分
    const blocks = content.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean)
    result = blocks.map((b, i) => ({
      title: `第${i + 1}节`,
      content: b,
    }))
  } else if (chapterMode.value === 'chapter') {
    // 按第X章拆分
    const regex = /^[\s]*第[零一二三四五六七八九十百千万0-9]+[章节回卷]/m
    const lines = content.split('\n')
    let currentTitle = '前言'
    let currentContent = ''
    for (const line of lines) {
      if (regex.test(line.trim())) {
        if (currentContent.trim()) {
          result.push({ title: currentTitle, content: currentContent.trim() })
        }
        currentTitle = line.trim()
        currentContent = ''
      } else {
        currentContent += line + '\n'
      }
    }
    if (currentContent.trim()) {
      result.push({ title: currentTitle, content: currentContent.trim() })
    }
  } else if (chapterMode.value === 'custom') {
    // 自定义正则拆分
    try {
      const regex = new RegExp(customPattern.value, 'm')
      const lines = content.split('\n')
      let currentTitle = '前言'
      let currentContent = ''
      for (const line of lines) {
        if (regex.test(line.trim())) {
          if (currentContent.trim()) {
            result.push({ title: currentTitle, content: currentContent.trim() })
          }
          currentTitle = line.trim()
          currentContent = ''
        } else {
          currentContent += line + '\n'
        }
      }
      if (currentContent.trim()) {
        result.push({ title: currentTitle, content: currentContent.trim() })
      }
    } catch {
      result = [{ title: bookTitle.value || '正文', content }]
    }
  }

  // 按最大字数拆分
  if (maxChars.value > 0) {
    const split: Chapter[] = []
    for (const ch of result) {
      if (ch.content.length <= maxChars.value) {
        split.push(ch)
      } else {
        let offset = 0
        let part = 1
        while (offset < ch.content.length) {
          const end = Math.min(offset + maxChars.value, ch.content.length)
          split.push({
            title: ch.title + (part > 1 ? `（${part}）` : ''),
            content: ch.content.slice(offset, end),
          })
          offset = end
          part++
        }
      }
    }
    result = split
  }

  return result
})

// 格式化文件大小
function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

// 处理文件上传，自动检测编码
async function handleUpload(data: { file: Required<UploadFileInfo>; fileList: Required<UploadFileInfo>[]; event?: Event }) {
  const rawFile = data.file?.file
  if (!rawFile) return
  fileName.value = rawFile.name
  fileSize.value = rawFile.size
  // 默认书名使用文件名
  bookTitle.value = rawFile.name.replace(/\.txt$/i, '')

  // 读取并尝试解码，优先 UTF-8，失败则用 GBK
  const buffer = await rawFile.arrayBuffer()
  try {
    const decoder = new TextDecoder('utf-8')
    const text = decoder.decode(buffer)
    // 检测是否有乱码特征（大量替换字符）
    const replacementCount = (text.match(/\uFFFD/g) || []).length
    if (replacementCount > text.length * 0.01) {
      throw new Error('可能非 UTF-8 编码')
    }
    fileContent.value = text
  } catch {
    // 尝试 GBK 解码
    try {
      const decoder = new TextDecoder('gbk')
      fileContent.value = decoder.decode(buffer)
    } catch {
      // 兜底
      const decoder = new TextDecoder('utf-8')
      fileContent.value = decoder.decode(buffer)
    }
  }
  charCount.value = fileContent.value.length
  statusMsg.value = ''
}

// 清除
function clear() {
  fileName.value = ''
  fileSize.value = 0
  fileContent.value = ''
  charCount.value = 0
  statusMsg.value = ''
}

// 动态加载 JSZip CDN 脚本
function loadJSZip(): Promise<any> {
  return new Promise((resolve, reject) => {
    const w = window as any
    if (w.JSZip) {
      resolve(w.JSZip)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js'
    script.async = true
    script.onload = () => {
      if (w.JSZip) resolve(w.JSZip)
      else reject(new Error('JSZip 加载失败'))
    }
    script.onerror = () => reject(new Error('JSZip 加载失败，请检查网络连接'))
    document.head.appendChild(script)
  })
}

// HTML 转义
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// 生成 EPUB
async function generate() {
  if (!fileContent.value) return
  if (chapters.value.length === 0) {
    statusMsg.value = '未能解析出任何章节内容'
    statusType.value = 'warning'
    return
  }

  generating.value = true
  statusMsg.value = '正在生成 EPUB...'
  statusType.value = 'info'

  try {
    const JSZip = await loadJSZip()
    const zip = new JSZip()

    const title = bookTitle.value || '未命名电子书'
    const author = bookAuthor.value || '匿名'
    const bookId = 'tool-' + Date.now()
    const chapterList = chapters.value
    const now = new Date()
    const dateStr = now.toISOString().replace(/\.\d+Z$/, 'Z')

    // 1. mimetype（必须为第一个且不压缩）
    zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' })

    // 2. META-INF/container.xml
    zip.file('META-INF/container.xml',
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">\n' +
      '  <rootfiles>\n' +
      '    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>\n' +
      '  </rootfiles>\n' +
      '</container>')

    // 3. 各章节 XHTML 文件
    const manifestItems: string[] = []
    const spineItems: string[] = []
    const navPoints: string[] = []
    chapterList.forEach((ch, i) => {
      const id = `chapter${i + 1}`
      const fileName = `${id}.xhtml`
      manifestItems.push(
        `    <item id="${id}" href="${fileName}" media-type="application/xhtml+xml"/>`)
      spineItems.push(`    <itemref idref="${id}"/>`)
      navPoints.push(
        `    <navPoint id="${id}" playOrder="${i + 1}">\n` +
        `      <navLabel><text>${escapeHtml(ch.title).substring(0, 80)}</text></navLabel>\n` +
        `      <content src="${fileName}"/>\n` +
        `    </navPoint>`)

      // 构建章节内容
      const paragraphs = ch.content.split(/\n+/).filter(Boolean)
        .map(p => `      <p>${escapeHtml(p)}</p>`).join('\n')
      const xhtml =
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<!DOCTYPE html>\n' +
        '<html xmlns="http://www.w3.org/1999/xhtml">\n' +
        '<head><title>' + escapeHtml(ch.title) + '</title>\n' +
        '<link rel="stylesheet" type="text/css" href="style.css"/>\n</head>\n' +
        '<body>\n' +
        '  <h1>' + escapeHtml(ch.title) + '</h1>\n' +
        paragraphs + '\n' +
        '</body>\n</html>'
      zip.file('OEBPS/' + fileName, xhtml)
    })

    // 4. 样式文件
    zip.file('OEBPS/style.css',
      'body { font-family: serif; line-height: 1.6; margin: 5%; }\n' +
      'h1 { font-size: 1.4em; text-align: center; margin: 1em 0; }\n' +
      'p { text-indent: 2em; margin: 0.5em 0; }')

    // 5. content.opf（包描述文件）
    const manifest = manifestItems.join('\n') +
      '\n    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>\n' +
      '    <item id="css" href="style.css" media-type="text/css"/>'
    const opf =
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">\n' +
      '  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">\n' +
      '    <dc:identifier id="BookId">urn:uuid:' + bookId + '</dc:identifier>\n' +
      '    <dc:title>' + escapeHtml(title) + '</dc:title>\n' +
      '    <dc:creator opf:role="aut">' + escapeHtml(author) + '</dc:creator>\n' +
      '    <dc:language>zh-CN</dc:language>\n' +
      '    <dc:date>' + dateStr + '</dc:date>\n' +
      '  </metadata>\n' +
      '  <manifest>\n' + manifest + '\n  </manifest>\n' +
      '  <spine toc="ncx">\n' + spineItems.join('\n') + '\n  </spine>\n' +
      '</package>'
    zip.file('OEBPS/content.opf', opf)

    // 6. toc.ncx（目录）
    const ncx =
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN" "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">\n' +
      '<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">\n' +
      '  <head>\n' +
      '    <meta name="dtb:uid" content="urn:uuid:' + bookId + '"/>\n' +
      '    <meta name="dtb:depth" content="1"/>\n' +
      '    <meta name="dtb:totalPageCount" content="0"/>\n' +
      '    <meta name="dtb:maxPageNumber" content="0"/>\n' +
      '  </head>\n' +
      '  <docTitle><text>' + escapeHtml(title) + '</text></docTitle>\n' +
      '  <navMap>\n' + navPoints.join('\n') + '\n  </navMap>\n' +
      '</ncx>'
    zip.file('OEBPS/toc.ncx', ncx)

    // 生成并下载
    const blob = await zip.generateAsync({
      type: 'blob',
      mimeType: 'application/epub+zip',
      compression: 'DEFLATE',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = (title || 'book') + '.epub'
    a.click()
    URL.revokeObjectURL(url)

    statusMsg.value = `生成成功！共 ${chapterList.length} 章，已开始下载`
    statusType.value = 'success'
  } catch (e: any) {
    statusMsg.value = '生成失败：' + (e.message || e)
    statusType.value = 'error'
  } finally {
    generating.value = false
  }
}
</script>

<style scoped>
.txt-to-epub {
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

.config-section {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  align-items: flex-start;
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

.dark .hint {
  color: #999;
}

.range-label {
  font-size: 13px;
  color: #555;
  margin-bottom: 8px;
}

.dark .range-label {
  color: #aaa;
}

.chapter-list {
  max-height: 280px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
  padding: 8px 12px;
}

.dark .chapter-list {
  border-color: #333;
  background: #1e1e2e;
}

.chapter-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
}

.dark .chapter-item {
  border-bottom-color: #2a2a3a;
}

.chapter-item:last-child {
  border-bottom: none;
}

.ch-num {
  width: 28px;
  color: #888;
  flex-shrink: 0;
}

.dark .ch-num {
  color: #aaa;
}

.ch-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ch-words {
  color: #888;
  font-size: 12px;
  flex-shrink: 0;
}

.dark .ch-words {
  color: #aaa;
}

.ch-more {
  text-align: center;
  font-size: 12px;
  color: #888;
  padding: 8px 0;
}

.toolbar {
  display: flex;
  gap: 12px;
}
</style>
