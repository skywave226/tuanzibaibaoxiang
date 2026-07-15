<template>
  <div class="mind-map-maker">
    <!-- 顶部操作栏 -->
    <div class="action-bar">
      <n-button type="primary" @click="copyCode">复制代码</n-button>
      <n-button @click="openMermaidLive" ghost>在 Mermaid Live Editor 中打开</n-button>
      <n-button @click="loadExample">加载示例</n-button>
      <n-button @click="clearAll">清空</n-button>
    </div>

    <!-- 输入模式切换 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title">输入内容</span>
        <n-radio-group v-model:value="inputMode" size="small">
          <n-radio-button value="mermaid">Mermaid mindmap 语法</n-radio-button>
          <n-radio-button value="indent">缩进文本</n-radio-button>
        </n-radio-group>
      </div>

      <n-input
        v-model:value="rawInput"
        type="textarea"
        :placeholder="placeholderText"
        :rows="14"
        class="raw-input"
      />

      <div v-if="inputMode === 'indent'" class="hint-text">
        提示：使用缩进（空格或 Tab）表示层级，第一行为根节点。例如：
        <code>根节点 / 子节点1 / 孙节点1</code>
      </div>
    </div>

    <!-- 生成结果 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title">Mermaid mindmap 代码</span>
        <n-tag size="small" type="info">复制后可粘贴到 Mermaid Live Editor</n-tag>
      </div>
      <pre class="code-block"><code v-html="highlightedCode"></code></pre>
    </div>

    <!-- 语法参考 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title">语法参考</span>
      </div>
      <n-collapse>
        <n-collapse-item title="Mermaid mindmap 语法说明" name="syntax">
          <div class="syntax-ref">
            <p><strong>基本结构</strong>：以 <code>mindmap</code> 开头，根节点写在下一行。</p>
            <pre class="ref-code">mindmap
  Root
    Child A
      Grandchild A1
    Child B</pre>
            <p><strong>节点形状</strong>：</p>
            <pre class="ref-code">mindmap
  Root
    [Square Shape]
    (Rounded Shape)
    ((Circle Shape))
    &gt;Asymmetric Shape&lt;</pre>
            <p><strong>图标与样式</strong>：可在节点后使用 <code>::icon()</code> 添加图标。</p>
            <pre class="ref-code">mindmap
  Root
    Child::icon(fa fa-book)</pre>
          </div>
        </n-collapse-item>
      </n-collapse>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NButton, NInput, NRadioGroup, NRadioButton, NTag, NCollapse, NCollapseItem, useMessage } from 'naive-ui'

const message = useMessage()
const inputMode = ref<'mermaid' | 'indent'>('indent')
const rawInput = ref<string>('')

// 占位提示文本
const placeholderText = computed(() => {
  if (inputMode.value === 'mermaid') {
    return 'mindmap\n  root((思维导图))\n    分支一\n      子节点 1\n      子节点 2\n    分支二'
  }
  return '思维导图\n  分支一\n    子节点 1\n    子节点 2\n  分支二'
})

// 缩进文本 → Mermaid mindmap 转换
function indentToMermaid(text: string): string {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0)
  if (lines.length === 0) return 'mindmap'

  // 计算每行缩进层级
  const parsed = lines.map(line => {
    const match = line.match(/^[\t ]*/)
    const indentStr = match ? match[0] : ''
    // 把 tab 当作 4 空格统一计算
    const indent = indentStr.replace(/\t/g, '    ').length
    return { indent, text: line.trim() }
  })

  // 找到最小缩进作为根层级
  const minIndent = Math.min(...parsed.map(p => p.indent))
  const out: string[] = ['mindmap']

  for (const item of parsed) {
    const level = Math.floor((item.indent - minIndent) / 2)
    const safe = escapeMermaidNode(item.text)
    const prefix = '  '.repeat(Math.max(0, level) + 1)
    out.push(`${prefix}${safe}`)
  }

  return out.join('\n')
}

// 转义 Mermaid 节点文本中的特殊字符（保留形状语法）
function escapeMermaidNode(text: string): string {
  // 若用户已写出形状语法则保留
  if (/^[\[\(\{<].*[\]\)\}>]$/.test(text)) return text
  return text
}

// 最终生成的 Mermaid 代码
const mermaidCode = computed(() => {
  if (!rawInput.value.trim()) return 'mindmap'
  if (inputMode.value === 'mermaid') {
    // 若用户已写 mindmap 关键字，则原样返回
    if (/^\s*mindmap\b/im.test(rawInput.value)) return rawInput.value.trim()
    return 'mindmap\n' + rawInput.value
  }
  return indentToMermaid(rawInput.value)
})

// 代码高亮（轻量自实现）
const highlightedCode = computed(() => {
  let html = mermaidCode.value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // 高亮 mindmap 关键字
  html = html.replace(/^mindmap$/m, '<span class="hl-kw">mindmap</span>')

  // 高亮形状包裹符
  html = html.replace(/(\[|\]|\(|\)|\{|\})/g, '<span class="hl-op">$1</span>')

  // 高亮图标
  html = html.replace(/::icon\(([^)]+)\)/g, '::icon(<span class="hl-attr">$1</span>)')

  return html
})

// 复制代码
function copyCode(): void {
  if (!mermaidCode.value.trim() || mermaidCode.value.trim() === 'mindmap') {
    message.warning('暂无可复制的内容')
    return
  }
  navigator.clipboard.writeText(mermaidCode.value)
  message.success('Mermaid 代码已复制到剪贴板')
}

// 在 Mermaid Live Editor 中打开
function openMermaidLive(): void {
  if (!mermaidCode.value.trim() || mermaidCode.value.trim() === 'mindmap') {
    message.warning('暂无内容，请先输入')
    return
  }
  const code = mermaidCode.value
  const payload = { code, mermaid: { theme: 'default' }, autoSync: true, updateDiagram: true }
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
  const url = `https://mermaid.live/edit#base64:${encoded}`
  window.open(url, '_blank')
}

// 加载示例
function loadExample(): void {
  inputMode.value = 'indent'
  rawInput.value = `思维导图
  产品规划
    市场调研
      用户访谈
      竞品分析
    功能设计
      核心功能
      辅助功能
    开发计划
      前端开发
      后端开发
      测试上线`
  message.success('示例已加载')
}

// 清空
function clearAll(): void {
  rawInput.value = ''
}
</script>

<style scoped>
.mind-map-maker {
  max-width: 1000px;
  margin: 0 auto;
}

.action-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.raw-input {
  font-family: 'Fira Code', 'Consolas', 'Courier New', monospace;
  font-size: 13px;
}

.hint-text {
  margin-top: 8px;
  color: #999;
  font-size: 13px;
}

.hint-text code {
  background: #f5f5f5;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 12px;
  color: #d63384;
}

/* Mermaid 代码块 */
.code-block {
  background: #1e1e2e;
  border-radius: 8px;
  padding: 16px;
  overflow: auto;
  font-family: 'Fira Code', 'Consolas', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #cdd6f4;
  max-height: 420px;
  white-space: pre;
}

.code-block :deep(.hl-kw) {
  color: #cba6f7;
  font-weight: 700;
}

.code-block :deep(.hl-op) {
  color: #a6e3a1;
  font-weight: 600;
}

.code-block :deep(.hl-attr) {
  color: #fab387;
}

/* 语法参考 */
.syntax-ref {
  color: #555;
  font-size: 13px;
  line-height: 1.8;
}

.syntax-ref p {
  margin: 8px 0 4px;
}

.syntax-ref code {
  background: #f5f5f5;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 12px;
  color: #d63384;
}

.ref-code {
  background: #f7f7f9;
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 10px 12px;
  font-family: 'Fira Code', 'Consolas', 'Courier New', monospace;
  font-size: 12px;
  color: #333;
  margin: 6px 0 10px;
  white-space: pre;
  overflow-x: auto;
}

/* 深色模式 */
.dark .section-title {
  color: #e0e0e0;
}

.dark .hint-text {
  color: #888;
}

.dark .hint-text code {
  background: #2a2a4a;
  color: #f9e2af;
}

.dark .syntax-ref {
  color: #aaa;
}

.dark .syntax-ref code {
  background: #2a2a4a;
  color: #f9e2af;
}

.dark .ref-code {
  background: #1a1a2e;
  border-color: #2a2a4a;
  color: #ddd;
}
</style>
