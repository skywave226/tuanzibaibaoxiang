<template>
  <div class="relation-graph-maker">
    <!-- 顶部操作栏 -->
    <div class="action-bar">
      <n-button type="primary" @click="copyCode">复制代码</n-button>
      <n-button @click="openMermaidLive" ghost>在 Mermaid Live Editor 中打开</n-button>
      <n-button @click="loadExample">加载示例</n-button>
      <n-button @click="clearAll">清空</n-button>
    </div>

    <!-- 输入区 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title">关系描述（Mermaid graph 语法）</span>
        <n-tag size="small" type="info">支持 flowchart / graph 语法</n-tag>
      </div>
      <n-input
        v-model:value="rawInput"
        type="textarea"
        :rows="12"
        placeholder="graph TD&#10;A[开始] --> B{是否完成?}&#10;B -->|是| C[结束]&#10;B -->|否| D[继续执行]"
        class="raw-input"
      />
    </div>

    <!-- 生成结果 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title">Mermaid 代码</span>
        <n-tag size="small" type="info">可粘贴到 Mermaid Live Editor</n-tag>
      </div>
      <pre class="code-block"><code v-html="highlightedCode"></code></pre>
    </div>

    <!-- 语法参考 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title">语法参考</span>
      </div>
      <n-collapse>
        <n-collapse-item title="Mermaid graph 常用语法" name="syntax">
          <div class="syntax-ref">
            <p><strong>方向</strong>：</p>
            <pre class="ref-code">graph TB   &lt;!-- 自上而下 (Top-Bottom) --&gt;
graph TD   &lt;!-- 同 TB --&gt;
graph LR   &lt;!-- 从左到右 (Left-Right) --&gt;
graph RL   &lt;!-- 从右到左 --&gt;
graph BT   &lt;!-- 自下而上 --&gt;</pre>

            <p><strong>节点形状</strong>：</p>
            <pre class="ref-code" v-pre>id[矩形]
id(圆角矩形)
id([体育场形])
id[[子程序]]
id[(圆柱/数据库)]
id((圆形))
id&gt;不对称形&lt;
id{菱形/判断}
id{{六边形}}
id[/平行四边形/]
id[\平行四边形反转\]</pre>

            <p><strong>连线类型</strong>：</p>
            <pre class="ref-code">A --&gt; B      &lt;!-- 实线箭头 --&gt;
A --- B      &lt;!-- 实线无箭头 --&gt;
A -.- B      &lt;!-- 虚线 --&gt;
A === B      &lt;!-- 加粗实线 --&gt;
A --&gt;|标签| B  &lt;!-- 带标签的箭头 --&gt;
A -- 文本 -- B
A -. 文本 .&gt; B</pre>

            <p><strong>子图</strong>：</p>
            <pre class="ref-code">graph TB
  subgraph 模块一
    A --&gt; B
  end
  subgraph 模块二
    C --&gt; D
  end
  B --&gt; C</pre>

            <p><strong>样式</strong>：</p>
            <pre class="ref-code">style A fill:#f9f,stroke:#333,stroke-width:2px
classDef redNode fill:#fdd,stroke:#f00
class A,B redNode</pre>
          </div>
        </n-collapse-item>
      </n-collapse>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NButton, NInput, NTag, NCollapse, NCollapseItem, useMessage } from 'naive-ui'

const message = useMessage()
const rawInput = ref<string>('')

// 最终的 Mermaid 代码
const mermaidCode = computed(() => {
  const text = rawInput.value.trim()
  if (!text) return 'graph TD'
  // 若用户已写 graph/flowchart 关键字则原样返回
  if (/^\s*(graph|flowchart)\s+\w+/im.test(text)) return text
  // 否则补上 graph TD 前缀
  return `graph TD\n${text}`
})

// 代码高亮（轻量自实现）
const highlightedCode = computed(() => {
  let html = mermaidCode.value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // 高亮方向关键字 graph / flowchart 及方向 TB/TD/LR/RL/BT
  html = html.replace(
    /^(graph|flowchart)\s+(TB|TD|LR|RL|BT)/gim,
    '<span class="hl-kw">$1</span> <span class="hl-dir">$2</span>'
  )

  // 高亮 subgraph ... end
  html = html.replace(
    /^(\s*)(subgraph)\s+(.+)$/gim,
    '$1<span class="hl-kw">$2</span> <span class="hl-name">$3</span>'
  )
  html = html.replace(/^(\s*)(end)\s*$/gim, '$1<span class="hl-kw">$2</span>')

  // 高亮样式定义 classDef / class / style
  html = html.replace(
    /^(\s*)(classDef|class|style)\s+/gim,
    '$1<span class="hl-attr">$2</span> '
  )

  // 高亮节点形状符号
  html = html.replace(/(\[\]|\(\)|\{\}|\(\(\)\)|&gt;&lt;|\/\/|\\\\)/g, '<span class="hl-op">$1</span>')

  // 高亮箭头/连线
  html = html.replace(/(-&gt;|---|--|==|-\.)/g, '<span class="hl-line">$1</span>')

  // 高亮标签文本 |文本|
  html = html.replace(/\|([^|]+)\|/g, '|<span class="hl-str">$1</span>|')

  return html
})

// 复制代码
function copyCode(): void {
  if (!mermaidCode.value.trim() || mermaidCode.value.trim() === 'graph TD') {
    message.warning('暂无可复制的内容')
    return
  }
  navigator.clipboard.writeText(mermaidCode.value)
  message.success('Mermaid 代码已复制到剪贴板')
}

// 在 Mermaid Live Editor 中打开
function openMermaidLive(): void {
  if (!mermaidCode.value.trim() || mermaidCode.value.trim() === 'graph TD') {
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
  rawInput.value = `graph TD
    A[用户访问] --> B{是否登录?}
    B -->|是| C[进入首页]
    B -->|否| D[跳转登录页]
    D --> E[输入账号密码]
    E --> F{验证成功?}
    F -->|是| C
    F -->|否| D
    C --> G[访问内容]
    G --> H((结束))`
  message.success('示例已加载')
}

// 清空
function clearAll(): void {
  rawInput.value = ''
}
</script>

<style scoped>
.relation-graph-maker {
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

.code-block :deep(.hl-dir) {
  color: #f38ba8;
  font-weight: 700;
}

.code-block :deep(.hl-name) {
  color: #89b4fa;
}

.code-block :deep(.hl-op) {
  color: #a6e3a1;
  font-weight: 600;
}

.code-block :deep(.hl-line) {
  color: #94e2d5;
}

.code-block :deep(.hl-str) {
  color: #f9e2af;
}

.code-block :deep(.hl-attr) {
  color: #fab387;
  font-weight: 600;
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
