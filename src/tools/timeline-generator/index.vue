<template>
  <div class="timeline-generator">
    <!-- 顶部操作栏 -->
    <div class="action-bar">
      <n-button type="primary" @click="loadExample">加载示例</n-button>
      <n-button @click="addEvent" ghost>+ 添加事件</n-button>
      <n-button @click="clearAll">清空</n-button>
      <n-button @click="exportSvg" :disabled="sortedEvents.length === 0">导出 SVG</n-button>
    </div>

    <!-- 事件输入区 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title">时间事件列表（{{ events.length }}）</span>
        <n-radio-group v-model:value="orientation" size="small">
          <n-radio-button value="horizontal">横向</n-radio-button>
          <n-radio-button value="vertical">纵向</n-radio-button>
        </n-radio-group>
      </div>

      <div v-if="events.length === 0" class="empty-tip">
        暂无事件，点击"添加事件"开始
      </div>

      <div v-for="event in events" :key="event.id" class="event-card">
        <n-input
          v-model:value="event.date"
          placeholder="日期（如 2024-01-01 或 2024年1月）"
          class="event-date"
        />
        <n-input
          v-model:value="event.title"
          placeholder="事件标题"
          class="event-title"
        />
        <n-input
          v-model:value="event.description"
          placeholder="事件描述（可选）"
          class="event-desc"
        />
        <n-button size="small" type="error" ghost @click="removeEvent(event.id)">删除</n-button>
      </div>
    </div>

    <!-- 时间轴预览 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title">时间轴预览</span>
      </div>
      <div ref="svgWrapRef" class="svg-wrap">
        <svg
          v-if="sortedEvents.length > 0"
          :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
          :width="svgWidth"
          :height="svgHeight"
          xmlns="http://www.w3.org/2000/svg"
          class="timeline-svg"
        >
          <!-- 横向时间轴 -->
          <template v-if="orientation === 'horizontal'">
            <line
              :x1="padding" :y1="axisY"
              :x2="svgWidth - padding" :y2="axisY"
              :stroke="axisColor" stroke-width="2"
            />
            <g v-for="(event, i) in sortedEvents" :key="event.id">
              <!-- 节点圆点 -->
              <circle
                :cx="getNodeX(i)"
                :cy="axisY"
                r="6"
                :fill="i % 2 === 0 ? primaryColor : secondaryColor"
              />
              <!-- 交替上下排布 -->
              <line
                :x1="getNodeX(i)" :y1="axisY"
                :x2="getNodeX(i)" :y2="i % 2 === 0 ? axisY - 30 : axisY + 30"
                :stroke="axisColor" stroke-width="1"
              />
              <!-- 日期文本 -->
              <text
                :x="getNodeX(i)"
                :y="i % 2 === 0 ? axisY - 40 : axisY + 50"
                text-anchor="middle"
                :fill="textColor"
                font-size="12"
                font-weight="600"
              >{{ event.date }}</text>
              <!-- 标题文本 -->
              <text
                :x="getNodeX(i)"
                :y="i % 2 === 0 ? axisY - 58 : axisY + 68"
                text-anchor="middle"
                :fill="titleColor"
                font-size="13"
                font-weight="700"
              >{{ truncate(event.title, 14) }}</text>
              <!-- 描述文本 -->
              <text
                v-if="event.description"
                :x="getNodeX(i)"
                :y="i % 2 === 0 ? axisY - 76 : axisY + 86"
                text-anchor="middle"
                :fill="descColor"
                font-size="11"
              >{{ truncate(event.description, 18) }}</text>
            </g>
          </template>

          <!-- 纵向时间轴 -->
          <template v-else>
            <line
              :x1="axisX" :y1="padding"
              :x2="axisX" :y2="svgHeight - padding"
              :stroke="axisColor" stroke-width="2"
            />
            <g v-for="(event, i) in sortedEvents" :key="event.id">
              <circle
                :cx="axisX"
                :cy="getNodeY(i)"
                r="6"
                :fill="i % 2 === 0 ? primaryColor : secondaryColor"
              />
              <line
                :x1="axisX" :y1="getNodeY(i)"
                :x2="axisX + (i % 2 === 0 ? 30 : -30)" :y2="getNodeY(i)"
                :stroke="axisColor" stroke-width="1"
              />
              <!-- 日期 -->
              <text
                :x="axisX + (i % 2 === 0 ? 40 : -40)"
                :y="getNodeY(i) - 6"
                :text-anchor="i % 2 === 0 ? 'start' : 'end'"
                :fill="textColor"
                font-size="12"
                font-weight="600"
              >{{ event.date }}</text>
              <!-- 标题 -->
              <text
                :x="axisX + (i % 2 === 0 ? 40 : -40)"
                :y="getNodeY(i) + 10"
                :text-anchor="i % 2 === 0 ? 'start' : 'end'"
                :fill="titleColor"
                font-size="13"
                font-weight="700"
              >{{ truncate(event.title, 18) }}</text>
              <!-- 描述 -->
              <text
                v-if="event.description"
                :x="axisX + (i % 2 === 0 ? 40 : -40)"
                :y="getNodeY(i) + 26"
                :text-anchor="i % 2 === 0 ? 'start' : 'end'"
                :fill="descColor"
                font-size="11"
              >{{ truncate(event.description, 22) }}</text>
            </g>
          </template>
        </svg>
        <div v-else class="empty-tip">无数据，请添加事件</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NButton, NInput, NRadioGroup, NRadioButton, useMessage } from 'naive-ui'

// 事件数据结构
interface TimelineEvent {
  id: string
  date: string
  title: string
  description: string
}

const message = useMessage()
const events = ref<TimelineEvent[]>([])
const orientation = ref<'horizontal' | 'vertical'>('horizontal')
const svgWrapRef = ref<HTMLElement | null>(null)

// 颜色配置
const primaryColor = '#36ad6a'
const secondaryColor = '#2080f0'
const axisColor = '#c0c4cc'
const textColor = '#666'
const titleColor = '#333'
const descColor = '#999'

// SVG 尺寸配置
const padding = 40
const nodeSpacing = 200
const verticalNodeSpacing = 90

// 生成唯一 id
function genId(): string {
  if (crypto.randomUUID) return crypto.randomUUID()
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// 按时间排序后的事件
const sortedEvents = computed(() => {
  return [...events.value].sort((a, b) => {
    return normalizeDate(a.date) - normalizeDate(b.date)
  })
})

// 将日期字符串转换为可比较的数字
function normalizeDate(date: string): number {
  if (!date) return 0
  // 处理 2024-01-01 / 2024/1/1 / 2024年1月 等格式
  const cleaned = date.replace(/[年月]/g, '-').replace(/[日号]/g, '').replace(/[/\\]/g, '-')
  const parts = cleaned.split('-').filter(Boolean).map(p => parseInt(p, 10))
  if (parts.length === 0) return new Date(date).getTime() || 0
  const year = parts[0] || 1970
  const month = parts[1] || 1
  const day = parts[2] || 1
  return new Date(year, month - 1, day).getTime()
}

// SVG 尺寸计算
const svgWidth = computed(() => {
  if (orientation.value === 'horizontal') {
    return Math.max(800, padding * 2 + sortedEvents.value.length * nodeSpacing)
  }
  return 800
})

const svgHeight = computed(() => {
  if (orientation.value === 'horizontal') {
    return 240
  }
  return Math.max(400, padding * 2 + sortedEvents.value.length * verticalNodeSpacing)
})

const axisY = computed(() => svgHeight.value / 2)
const axisX = computed(() => 400)

// 计算节点位置
function getNodeX(index: number): number {
  const totalWidth = sortedEvents.value.length * nodeSpacing
  const startX = (svgWidth.value - totalWidth) / 2 + nodeSpacing / 2
  return startX + index * nodeSpacing
}

function getNodeY(index: number): number {
  return padding + index * verticalNodeSpacing + 20
}

// 截断字符串
function truncate(text: string, maxLen: number): string {
  if (!text) return ''
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen - 1) + '…'
}

// 事件操作
function addEvent(): void {
  events.value.push({
    id: genId(),
    date: '',
    title: '',
    description: '',
  })
}

function removeEvent(id: string): void {
  events.value = events.value.filter(e => e.id !== id)
}

function clearAll(): void {
  events.value = []
}

// 加载示例
function loadExample(): void {
  events.value = [
    { id: genId(), date: '1991-08-06', title: 'Web 诞生', description: 'Tim Berners-Lee 发布首个网页' },
    { id: genId(), date: '2004-02-04', title: 'Facebook 上线', description: '社交网络时代开启' },
    { id: genId(), date: '2007-01-09', title: 'iPhone 发布', description: '智能手机革命开始' },
    { id: genId(), date: '2014-09-19', title: 'Swift 发布', description: '苹果推出新编程语言' },
    { id: genId(), date: '2022-11-30', title: 'ChatGPT 发布', description: '生成式 AI 元年' },
  ]
  message.success('示例已加载')
}

// 导出 SVG 文件
function exportSvg(): void {
  if (sortedEvents.value.length === 0) {
    message.warning('暂无可导出的内容')
    return
  }
  const svgEl = svgWrapRef.value?.querySelector('svg')
  if (!svgEl) {
    message.warning('无法获取 SVG 内容')
    return
  }
  const serializer = new XMLSerializer()
  let source = serializer.serializeToString(svgEl)
  // 添加 XML 声明
  if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
    source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"')
  }
  const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `timeline-${Date.now()}.svg`
  a.click()
  URL.revokeObjectURL(url)
  message.success('SVG 已导出')
}
</script>

<style scoped>
.timeline-generator {
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

.empty-tip {
  padding: 24px;
  text-align: center;
  color: #999;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
}

.event-card {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.event-card .event-date {
  width: 200px;
  flex-shrink: 0;
}

.event-card .event-title {
  flex: 1;
  min-width: 160px;
}

.event-card .event-desc {
  flex: 2;
  min-width: 200px;
}

.svg-wrap {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  background: #fff;
  padding: 16px;
  overflow: auto;
}

.timeline-svg {
  display: block;
  margin: 0 auto;
}

/* 深色模式 */
.dark .section-title {
  color: #e0e0e0;
}

.dark .empty-tip {
  color: #777;
  border-color: #2a2a4a;
}

.dark .svg-wrap {
  background: #181828;
  border-color: #2a2a4a;
}
</style>
