<template>
  <div class="tree-diagram-drawer">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <n-space>
        <n-radio-group v-model:value="inputType">
          <n-radio-button value="json">JSON</n-radio-button>
          <n-radio-button value="indent">缩进文本</n-radio-button>
        </n-radio-group>
        <n-radio-group v-model:value="direction">
          <n-radio-button value="horizontal">横向</n-radio-button>
          <n-radio-button value="vertical">纵向</n-radio-button>
        </n-radio-group>
        <n-button type="primary" @click="renderTree">渲染</n-button>
        <n-button @click="loadExample">示例</n-button>
        <n-button @click="clearAll">清空</n-button>
        <n-button :disabled="!rootNode" @click="exportSvg">导出 SVG</n-button>
      </n-space>
      <n-tag v-if="errorMsg" type="error">{{ errorMsg }}</n-tag>
      <n-tag v-else-if="rootNode" type="success">节点数 {{ nodeCount }}</n-tag>
    </div>

    <!-- 输入区 -->
    <div class="input-section">
      <div class="pane-label">
        {{ inputType === 'json' ? 'JSON 输入（{name, children:[]}）' : '缩进文本（每级 2 空格或 Tab）' }}
      </div>
      <n-input
        v-model:value="inputText"
        type="textarea"
        :placeholder="inputType === 'json' ? jsonPlaceholder : indentPlaceholder"
        class="code-input"
        :autosize="false"
        rows="8"
      />
    </div>

    <!-- SVG 渲染区 -->
    <div class="svg-section" v-if="rootNode">
      <div class="pane-label">树状图预览（点击节点折叠/展开）</div>
      <div class="svg-wrapper">
        <svg
          ref="svgRef"
          :width="svgWidth"
          :height="svgHeight"
          :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
        >
          <g v-for="(edge, i) in edges" :key="'e' + i">
            <path
              :d="edge.path"
              :stroke="edgeColor"
              stroke-width="1.5"
              fill="none"
              :opacity="0.6"
            />
          </g>
          <g v-for="(node, i) in visibleNodes" :key="'n' + i" @click="toggleNode(node)">
            <rect
              :x="node.x - nodeWidth / 2"
              :y="node.y - nodeHeight / 2"
              :width="nodeWidth"
              :height="nodeHeight"
              :rx="6"
              :fill="node.collapsed ? collapsedFill : nodeFill"
              :stroke="nodeStroke"
              stroke-width="1.5"
              class="node-rect"
            />
            <text
              :x="node.x"
              :y="node.y"
              :fill="textColor"
              text-anchor="middle"
              dominant-baseline="middle"
              class="node-text"
            >{{ truncate(node.name) }}</text>
            <text
              v-if="node.children && node.children.length > 0"
              :x="node.x + nodeWidth / 2 - 8"
              :y="node.y - nodeHeight / 2 + 8"
              :fill="node.collapsed ? '#fff' : '#888'"
              text-anchor="middle"
              class="collapse-mark"
            >{{ node.collapsed ? '+' : '−' }}</text>
          </g>
        </svg>
      </div>
    </div>

    <n-empty v-else description="输入数据并点击渲染按钮" class="mt-4" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { NButton, NSpace, NInput, NTag, NRadioGroup, NRadioButton, NEmpty, useMessage } from 'naive-ui'

// 树节点数据结构
interface TreeNode {
  name: string
  children: TreeNode[]
  // 渲染用属性
  x: number
  y: number
  depth: number
  collapsed: boolean
  parent: TreeNode | null
}

const message = useMessage()

const jsonPlaceholder = `{
  "name": "Root",
  "children": [
    {"name":"Child A"},
    {"name":"Child B"}
  ]
}`
const indentPlaceholder = `Root
  Child A
    Grandchild A1
  Child B`

const inputType = ref<'json' | 'indent'>('json')
const direction = ref<'horizontal' | 'vertical'>('horizontal')
const inputText = ref('')
const errorMsg = ref('')
const rootNode = ref<TreeNode | null>(null)

// 布局参数
const nodeWidth = 110
const nodeHeight = 36
const hGap = 50 // 同层节点水平间距
const vGap = 70 // 层级垂直间距

// SVG 尺寸
const svgWidth = ref(900)
const svgHeight = ref(500)
const svgRef = ref<SVGSVGElement | null>(null)

// 节点数
const nodeCount = computed(() => {
  let count = 0
  function countNodes(n: TreeNode | null): void {
    if (!n) return
    count++
    n.children.forEach(countNodes)
  }
  countNodes(rootNode.value)
  return count
})

// 主题色（根据深色模式动态计算）
const isDark = computed(() => document.documentElement.classList.contains('dark'))
const nodeFill = computed(() => isDark.value ? '#2a2a4a' : '#e8f4ff')
const collapsedFill = computed(() => isDark.value ? '#4a4a6a' : '#fff4e6')
const nodeStroke = computed(() => isDark.value ? '#5b8ff9' : '#1890ff')
const textColor = computed(() => isDark.value ? '#cdd6f4' : '#333')
const edgeColor = computed(() => isDark.value ? '#5b8ff9' : '#888')

// 可见节点列表
const visibleNodes = computed<TreeNode[]>(() => {
  const list: TreeNode[] = []
  function collect(n: TreeNode | null): void {
    if (!n) return
    list.push(n)
    if (!n.collapsed) n.children.forEach(collect)
  }
  collect(rootNode.value)
  return list
})

// 边列表（路径字符串）
const edges = computed(() => {
  const result: { path: string }[] = []
  function collect(n: TreeNode): void {
    if (n.collapsed) return
    n.children.forEach(child => {
      const p = computePath(n, child)
      result.push({ path: p })
      collect(child)
    })
  }
  if (rootNode.value) collect(rootNode.value)
  return result
})

// 计算贝塞尔曲线路径
function computePath(from: TreeNode, to: TreeNode): string {
  if (direction.value === 'horizontal') {
    // 横向：from 在左侧，to 在右侧
    const x1 = from.x + nodeWidth / 2
    const y1 = from.y
    const x2 = to.x - nodeWidth / 2
    const y2 = to.y
    const midX = (x1 + x2) / 2
    return `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`
  } else {
    // 纵向：from 在上方，to 在下方
    const x1 = from.x
    const y1 = from.y + nodeHeight / 2
    const x2 = to.x
    const y2 = to.y - nodeHeight / 2
    const midY = (y1 + y2) / 2
    return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`
  }
}

// 截断过长文本
function truncate(text: string): string {
  const max = 12
  if (text.length > max) return text.slice(0, max) + '…'
  return text
}

// ====== 解析输入 ======

// JSON 转 TreeNode
function jsonToTreeNode(data: any, parent: TreeNode | null = null, depth = 0): TreeNode {
  const node: TreeNode = {
    name: String(data.name || data.title || 'unnamed'),
    children: [],
    x: 0, y: 0, depth,
    collapsed: false,
    parent,
  }
  if (Array.isArray(data.children)) {
    node.children = data.children.map((c: any) => jsonToTreeNode(c, node, depth + 1))
  }
  return node
}

// 缩进文本转 TreeNode
function indentToTreeNode(text: string): TreeNode {
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length === 0) throw new Error('空文本')
  // 计算缩进（支持空格与 Tab）
  const getIndent = (line: string): number => {
    const match = line.match(/^[\t ]*/)
    if (!match) return 0
    const indent = match[0]
    // Tab 算 1 级，2 个空格算 1 级
    let level = 0
    for (const ch of indent) {
      if (ch === '\t') level += 1
      else level += 0.5
    }
    return Math.floor(level)
  }
  const rootLine = lines[0]
  const rootIndent = getIndent(rootLine)
  const root: TreeNode = {
    name: rootLine.trim(),
    children: [],
    x: 0, y: 0, depth: 0,
    collapsed: false,
    parent: null,
  }
  const stack: TreeNode[] = [root]
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const indent = getIndent(line) - rootIndent
    if (indent <= 0) throw new Error('多个根节点：第 ' + (i + 1) + ' 行')
    const name = line.trim()
    const node: TreeNode = {
      name,
      children: [],
      x: 0, y: 0, depth: indent,
      collapsed: false,
      parent: null,
    }
    // 弹出栈直到找到父节点
    while (stack.length > 1 && stack[stack.length - 1].depth >= indent) {
      stack.pop()
    }
    const parent = stack[stack.length - 1]
    node.parent = parent
    parent.children.push(node)
    stack.push(node)
  }
  return root
}

// ====== 布局算法（简化的 Reingold-Tilford） ======

function layout(): void {
  if (!rootNode.value) return
  // 计算每个节点的子树宽度
  computeSubtreeWidth(rootNode.value)
  // 横向布局：x 按层级递增，y 按子树宽度排列
  if (direction.value === 'horizontal') {
    layoutHorizontal(rootNode.value, 0, 0)
  } else {
    layoutVertical(rootNode.value, 0, 0)
  }
  // 计算 SVG 尺寸
  const allNodes = visibleNodes.value
  if (allNodes.length === 0) {
    svgWidth.value = 900
    svgHeight.value = 500
    return
  }
  const maxX = Math.max(...allNodes.map(n => n.x)) + nodeWidth
  const maxY = Math.max(...allNodes.map(n => n.y)) + nodeHeight
  const minX = Math.min(...allNodes.map(n => n.x)) - nodeWidth
  const minY = Math.min(...allNodes.map(n => n.y)) - nodeHeight
  // 重新对齐到 0,0
  const offsetX = -minX + 20
  const offsetY = -minY + 20
  allNodes.forEach(n => { n.x += offsetX; n.y += offsetY })
  svgWidth.value = Math.max(900, maxX - minX + 40)
  svgHeight.value = Math.max(400, maxY - minY + 40)
}

// 计算子树占用宽度（叶子为 1，否则为子节点之和）
function computeSubtreeWidth(node: TreeNode): number {
  if (node.collapsed || node.children.length === 0) {
    return 1
  }
  let sum = 0
  node.children.forEach(c => { sum += computeSubtreeWidth(c) })
  return sum
}

// 横向布局：深度 → x，宽度 → y
function layoutHorizontal(node: TreeNode, depth: number, startY: number): number {
  node.depth = depth
  node.x = depth * (nodeWidth + hGap)
  if (node.collapsed || node.children.length === 0) {
    node.y = startY + nodeHeight / 2
    return 1
  }
  let totalWidth = 0
  node.children.forEach(c => { totalWidth += computeSubtreeWidth(c) })
  let curY = startY
  let childCount = 0
  node.children.forEach(c => {
    const w = computeSubtreeWidth(c)
    const ret = layoutHorizontal(c, depth + 1, curY + childCount * vGap)
    curY += w * vGap
    childCount += ret
  })
  // 父节点 y 设为子节点 y 的平均
  const visibleChildren = node.children.filter(c => !c.collapsed || c.children.length > 0)
  if (visibleChildren.length > 0) {
    node.y = (node.children[0].y + node.children[node.children.length - 1].y) / 2
  } else {
    node.y = startY + nodeHeight / 2
  }
  return childCount
}

// 纵向布局：深度 → y，宽度 → x
function layoutVertical(node: TreeNode, depth: number, startX: number): number {
  node.depth = depth
  node.y = depth * (nodeHeight + vGap) + nodeHeight / 2
  if (node.collapsed || node.children.length === 0) {
    node.x = startX + nodeWidth / 2
    return 1
  }
  let curX = startX
  let childCount = 0
  node.children.forEach(c => {
    const w = computeSubtreeWidth(c)
    const ret = layoutVertical(c, depth + 1, curX + childCount * hGap)
    curX += w * hGap
    childCount += ret
  })
  const visibleChildren = node.children.filter(c => !c.collapsed || c.children.length > 0)
  if (visibleChildren.length > 0) {
    node.x = (node.children[0].x + node.children[node.children.length - 1].x) / 2
  } else {
    node.x = startX + nodeWidth / 2
  }
  return childCount
}

// 切换节点折叠状态
function toggleNode(node: TreeNode): void {
  if (node.children.length === 0) return
  node.collapsed = !node.collapsed
  layout()
  message.success(node.collapsed ? '已折叠' : '已展开')
}

// 渲染树
function renderTree(): void {
  errorMsg.value = ''
  rootNode.value = null
  if (!inputText.value.trim()) {
    errorMsg.value = '请输入数据'
    return
  }
  try {
    if (inputType.value === 'json') {
      const obj = JSON.parse(inputText.value)
      rootNode.value = jsonToTreeNode(obj)
    } else {
      rootNode.value = indentToTreeNode(inputText.value)
    }
    nextTick(() => {
      layout()
      message.success('渲染成功')
    })
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : String(e)
  }
}

// 导出 SVG
function exportSvg(): void {
  const svg = svgRef.value
  if (!svg) return
  // 序列化 SVG
  const xml = new XMLSerializer().serializeToString(svg)
  const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${xml}`], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `tree-diagram-${Date.now()}.svg`
  a.click()
  URL.revokeObjectURL(url)
  message.success('已导出 SVG')
}

// 加载示例
function loadExample(): void {
  if (inputType.value === 'json') {
    inputText.value = JSON.stringify({
      name: '组织架构',
      children: [
        {
          name: '技术部',
          children: [
            { name: '前端组', children: [{ name: 'Vue' }, { name: 'React' }] },
            { name: '后端组', children: [{ name: 'Java' }, { name: 'Go' }, { name: 'Node' }] },
            { name: '运维组' },
          ],
        },
        {
          name: '产品部',
          children: [{ name: '产品经理' }, { name: 'UI 设计' }],
        },
        {
          name: '市场部',
          children: [{ name: '内容运营' }, { name: '商务' }],
        },
      ],
    }, null, 2)
  } else {
    inputText.value = `组织架构
  技术部
    前端组
      Vue
      React
    后端组
      Java
      Go
      Node
    运维组
  产品部
    产品经理
    UI 设计
  市场部
    内容运营
    商务`
  }
  renderTree()
}

function clearAll(): void {
  inputText.value = ''
  errorMsg.value = ''
  rootNode.value = null
}

// 切换方向/类型时自动重排
watch([direction, inputType], () => {
  if (rootNode.value) {
    nextTick(() => layout())
  }
})
</script>

<style scoped>
.tree-diagram-drawer {
  max-width: 1000px;
  margin: 0 auto;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.input-section {
  margin-bottom: 20px;
}

.code-input :deep(textarea) {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
}

.svg-section {
  margin-top: 8px;
}

.svg-wrapper {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 16px;
  background: #fff;
  overflow: auto;
}

.svg-wrapper svg {
  display: block;
  margin: 0 auto;
}

.node-rect {
  cursor: pointer;
  transition: fill 0.2s, stroke 0.2s;
}

.node-rect:hover {
  fill: #d6e4ff;
  stroke-width: 2;
}

.node-text {
  font-size: 13px;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  user-select: none;
  pointer-events: none;
}

.collapse-mark {
  font-size: 11px;
  font-weight: bold;
  user-select: none;
  pointer-events: none;
}

/* 深色模式 */
.dark .pane-label {
  color: #888;
}

.dark .svg-wrapper {
  background: #181828;
  border-color: #2a2a4a;
}

.dark .node-rect:hover {
  fill: #3a3a5a;
}
</style>
