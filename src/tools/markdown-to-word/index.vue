<template>
  <div class="markdown-to-word">
    <!-- 工具栏 -->
    <div class="toolbar">
      <n-space>
        <n-button type="primary" @click="downloadDoc" :disabled="!markdown.trim()">
          下载 Word 文档
        </n-button>
        <n-button @click="loadExample">加载示例</n-button>
        <n-button @click="clearAll" :disabled="!markdown">清空</n-button>
      </n-space>
    </div>

    <!-- 编辑与预览区域 -->
    <div class="editor-grid">
      <div class="editor-pane">
        <div class="pane-label mb-2">Markdown 输入</div>
        <n-input
          v-model:value="markdown"
          type="textarea"
          placeholder="在此输入 Markdown 内容..."
          class="code-input"
          :autosize="false"
          rows="22"
        />
      </div>
      <div class="editor-pane">
        <div class="pane-label mb-2">渲染预览</div>
        <div class="preview-content card" v-html="renderedHtml"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { NInput, NButton, NSpace } from 'naive-ui'
import { useMessage } from 'naive-ui'

const message = useMessage()

// Markdown 输入内容
const markdown = ref(`# 文档标题

## 功能介绍

这是一个 **Markdown 转 Word** 工具，可以将 Markdown 内容转换为 Word 文档（.doc）。

### 主要特性

- 支持 GitHub Flavored Markdown 语法
- 实时预览渲染效果
- 纯前端转换，无需上传文件
- 一键下载 .doc 文档

### 表格示例

| 功能 | 格式 | 说明 |
|------|------|------|
| 标题 | h1-h6 | 支持六级标题 |
| 列表 | ul/ol | 有序与无序列表 |
| 代码 | pre/code | 支持代码块 |
| 表格 | table | 支持表格语法 |

### 代码示例

\`\`\`javascript
function greet(name) {
  return 'Hello, ' + name + '!'
}
\`\`\`

> 这是一个引用块，用于强调重要信息。

### 结语

点击上方"下载 Word 文档"按钮即可生成 .doc 文件。
`)

// marked 与 dompurify 引用
let markedParse: ((src: string) => string) | null = null
let purify: ((dirty: string) => string) | null = null
const ready = ref(false)

// 挂载时加载依赖库
onMounted(async () => {
  const [markedModule, domPurifyModule] = await Promise.all([
    import('marked'),
    import('dompurify'),
  ])
  const marked = markedModule.marked
  marked.setOptions({ gfm: true, breaks: true })
  markedParse = (src: string) => marked.parse(src) as string
  purify = domPurifyModule.default.sanitize
  ready.value = true
})

// 渲染后的 HTML（经过 XSS 过滤）
const renderedHtml = computed(() => {
  if (!markedParse || !purify || !markdown.value) return ''
  try {
    const raw = markedParse(markdown.value)
    return purify(raw)
  } catch {
    return '<p style="color:red">Markdown 解析出错</p>'
  }
})

// 加载示例内容
function loadExample() {
  markdown.value = `# 示例文档

## 1. 简介

这是一份 **示例文档**，演示 Markdown 的各种语法。

## 2. 列表

### 无序列表

- 第一项
- 第二项
  - 嵌套项 A
  - 嵌套项 B

### 有序列表

1. 步骤一
2. 步骤二
3. 步骤三

## 3. 文本格式

支持 *斜体*、**粗体**、\`行内代码\` 和 [链接](https://example.com)。

## 4. 表格

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| name | string | 是 | 用户名 |
| age | number | 否 | 年龄 |

## 5. 代码块

\`\`\`python
def fibonacci(n):
    a, b = 0, 1
    for _ in range(n):
        print(a, end=' ')
        a, b = b, a + b
\`\`\`

## 6. 引用

> 任何足够先进的技术，都与魔法无异。
> —— 亚瑟·克拉克
`
  message.success('已加载示例内容')
}

// 清空内容
function clearAll() {
  markdown.value = ''
  message.success('已清空')
}

// 生成 Word 兼容的 HTML 文档
function generateDocHtml(): string {
  const html = markedParse ? markedParse(markdown.value) : ''
  const safeHtml = purify ? purify(html) : html
  // 使用 Word 兼容的 HTML 命名空间
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>文档</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
</w:WordDocument>
</xml>
<![endif]-->
<style>
@page WordSection1 {
  size: 595.3pt 841.9pt;
  margin: 72pt 90pt 72pt 90pt;
}
div.WordSection1 { page: WordSection1; }
body { font-family: '宋体', SimSun, serif; font-size: 12pt; line-height: 1.6; }
h1 { font-size: 22pt; font-weight: bold; }
h2 { font-size: 18pt; font-weight: bold; }
h3 { font-size: 14pt; font-weight: bold; }
h4 { font-size: 12pt; font-weight: bold; }
pre { font-family: 'Consolas', monospace; font-size: 10pt; background: #f5f5f5; padding: 8pt; }
code { font-family: 'Consolas', monospace; font-size: 10pt; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1pt solid #000; padding: 6pt; }
th { background: #e0e0e0; font-weight: bold; }
blockquote { border-left: 3pt solid #999; padding-left: 12pt; color: #666; }
a { color: #0563c1; text-decoration: underline; }
</style>
</head>
<body>
<div class="WordSection1">
${safeHtml}
</div>
</body>
</html>`
}

// 下载 Word 文档
function downloadDoc() {
  if (!markdown.value.trim()) {
    message.warning('请先输入 Markdown 内容')
    return
  }
  if (!ready.value) {
    message.warning('库正在加载中，请稍候')
    return
  }
  const docHtml = generateDocHtml()
  // 使用 Word MIME 类型生成 .doc 文件
  const blob = new Blob(['\ufeff', docHtml], {
    type: 'application/msword',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'document.doc'
  a.click()
  URL.revokeObjectURL(url)
  message.success('Word 文档已下载')
}
</script>

<style scoped>
.markdown-to-word {
  max-width: 1000px;
  margin: 0 auto;
}

.toolbar {
  margin-bottom: 16px;
}

.editor-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  height: calc(100vh - 200px);
  min-height: 500px;
}

@media (max-width: 768px) {
  .editor-grid {
    grid-template-columns: 1fr;
    height: auto;
  }
}

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
}

.code-input :deep(textarea) {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.preview-content {
  overflow-y: auto;
  height: 100%;
  padding: 16px;
  line-height: 1.8;
}

.preview-content :deep(h1) {
  font-size: 2em;
  font-weight: bold;
  margin: 0.67em 0;
  border-bottom: 1px solid #e8e8e8;
  padding-bottom: 0.3em;
}

.preview-content :deep(h2) {
  font-size: 1.5em;
  font-weight: bold;
  margin: 0.83em 0;
  border-bottom: 1px solid #e8e8e8;
  padding-bottom: 0.3em;
}

.preview-content :deep(h3) {
  font-size: 1.17em;
  font-weight: bold;
  margin: 1em 0;
}

.preview-content :deep(pre) {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 1em 0;
}

.dark .preview-content :deep(pre) {
  background: #1e1e1e;
}

.preview-content :deep(code) {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 0.9em;
}

.preview-content :deep(blockquote) {
  border-left: 4px solid #36ad6a;
  padding-left: 16px;
  margin: 1em 0;
  color: #666;
}

.dark .preview-content :deep(blockquote) {
  color: #aaa;
}

.preview-content :deep(ul) {
  padding-left: 2em;
  margin: 1em 0;
}

.preview-content :deep(li) {
  margin: 0.5em 0;
}

.preview-content :deep(a) {
  color: #36ad6a;
  text-decoration: none;
}

.preview-content :deep(a:hover) {
  text-decoration: underline;
}

.preview-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}

.preview-content :deep(th),
.preview-content :deep(td) {
  border: 1px solid #e8e8e8;
  padding: 8px 12px;
  text-align: left;
}

.dark .preview-content :deep(th),
.dark .preview-content :deep(td) {
  border-color: #2a2a4a;
}

.preview-content :deep(th) {
  background: #f5f5f5;
  font-weight: bold;
}

.dark .preview-content :deep(th) {
  background: #1e1e1e;
}
</style>
