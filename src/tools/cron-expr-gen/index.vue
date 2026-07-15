<template>
  <div class="cron-expr-gen">
    <n-alert type="info" class="mb-4">
      可视化生成 5 段式 Cron 表达式（分 时 日 月 周），支持下次执行时间预览。本工具侧重完整的字段可视化编辑与执行时间计算。
    </n-alert>

    <!-- 表达式预览 -->
    <div class="card mb-4">
      <div class="pane-label mb-2">Cron 表达式</div>
      <div class="expression-box">
        <div class="expression-segments">
          <div class="seg" v-for="(seg, i) in segments" :key="i" :class="{ active: activeTab === seg.field }" @click="activeTab = seg.field">
            <div class="seg-value">{{ seg.value }}</div>
            <div class="seg-label">{{ seg.label }}</div>
          </div>
        </div>
        <div class="expression-full">{{ expression }}</div>
      </div>
      <div class="expression-actions mt-2">
        <n-button size="small" @click="copyExpr">复制表达式</n-button>
        <n-button size="small" @click="copyDesc">复制说明</n-button>
      </div>
      <n-alert :type="validExpr ? 'success' : 'warning'" class="mt-3" :show-icon="false">
        {{ description }}
      </n-alert>
    </div>

    <!-- 字段配置 -->
    <div class="card mb-4">
      <n-tabs v-model:value="activeTab" type="line" animated>
        <n-tab-pane name="minute" tab="分钟">
          <FieldEditor v-model:value="fields.minute" :min="0" :max="59" field-label="分钟" @update:value="updateNextRuns" />
        </n-tab-pane>
        <n-tab-pane name="hour" tab="小时">
          <FieldEditor v-model:value="fields.hour" :min="0" :max="23" field-label="小时" @update:value="updateNextRuns" />
        </n-tab-pane>
        <n-tab-pane name="day" tab="日">
          <FieldEditor v-model:value="fields.day" :min="1" :max="31" field-label="日（月份中的天）" @update:value="updateNextRuns" />
        </n-tab-pane>
        <n-tab-pane name="month" tab="月">
          <FieldEditor v-model:value="fields.month" :min="1" :max="12" field-label="月" @update:value="updateNextRuns" />
        </n-tab-pane>
        <n-tab-pane name="week" tab="周">
          <FieldEditor v-model:value="fields.week" :min="0" :max="6" field-label="周（0=周日，6=周六）" @update:value="updateNextRuns" />
        </n-tab-pane>
      </n-tabs>
    </div>

    <!-- 下次执行时间 -->
    <div class="card mb-4">
      <div class="section-header mb-3">
        <span class="pane-label">下次执行时间预览（未来 5 次）</span>
        <n-button size="small" @click="calculateNextRuns">刷新</n-button>
      </div>
      <n-alert v-if="!validExpr" type="warning" class="mb-3" :show-icon="false">
        表达式不合法，无法计算下次执行时间
      </n-alert>
      <n-empty v-else-if="nextRuns.length === 0" description="未找到未来执行时间" />
      <div v-else class="next-runs">
        <div v-for="(run, i) in nextRuns" :key="i" class="run-item">
          <n-tag :type="i === 0 ? 'success' : 'default'" :bordered="false" size="small">
            {{ i === 0 ? '最近' : `+${i + 1}` }}
          </n-tag>
          <span class="run-time">{{ run }}</span>
        </div>
      </div>
    </div>

    <!-- 常用模板 -->
    <div class="card">
      <div class="pane-label mb-3">常用示例模板</div>
      <div class="templates">
        <div
          v-for="tpl in templates"
          :key="tpl.expr"
          class="template-item"
          @click="applyTemplate(tpl)"
        >
          <div class="template-name">{{ tpl.name }}</div>
          <div class="template-expr">{{ tpl.expr }}</div>
          <div class="template-desc">{{ tpl.desc }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, defineComponent, h } from 'vue'
import {
  NAlert, NButton, NTabs, NTabPane, NTag, NEmpty, NCheckbox,
  NRadioGroup, NRadio, NInputNumber, useMessage,
} from 'naive-ui'

const message = useMessage()

// 字段配置类型
type FieldMode = 'every' | 'step' | 'specific' | 'range' | 'none'
interface FieldValue {
  mode: FieldMode
  step: number
  start: number
  end: number
  specific: number[]
}

// 创建默认字段值
function defaultField(mode: FieldMode = 'every', start = 0): FieldValue {
  return { mode, step: 1, start, end: start, specific: [] }
}

const fields = ref({
  minute: defaultField('every', 0),
  hour: defaultField('every', 0),
  day: defaultField('every', 1),
  month: defaultField('every', 1),
  week: defaultField('none', 0),
})

const activeTab = ref('minute')

// ============ 子组件：单个字段配置 ============
const FieldEditor = defineComponent({
  name: 'FieldEditor',
  props: {
    value: { type: Object as () => FieldValue, required: true },
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    fieldLabel: { type: String, required: true },
  },
  emits: ['update:value'],
  setup(props, { emit }) {
    function update(patch: Partial<FieldValue>) {
      emit('update:value', { ...props.value, ...patch })
    }
    return () => {
      // 生成可选值列表
      const options: number[] = []
      for (let i = props.min; i <= props.max; i++) options.push(i)

      const detailNode = (() => {
        if (props.value.mode === 'step') {
          return h('div', { class: 'detail-row' }, [
            h('span', { class: 'detail-label' }, '从'),
            h(NInputNumber, {
              value: props.value.start,
              min: props.min,
              max: props.max,
              size: 'small',
              style: 'width: 110px',
              'onUpdate:value': (v: number | null) => update({ start: v ?? props.min }),
            }),
            h('span', { class: 'detail-label' }, '开始，每'),
            h(NInputNumber, {
              value: props.value.step,
              min: 1,
              max: props.max - props.min + 1,
              size: 'small',
              style: 'width: 110px',
              'onUpdate:value': (v: number | null) => update({ step: v ?? 1 }),
            }),
            h('span', { class: 'detail-label' }, `${props.fieldLabel}执行一次`),
          ])
        }
        if (props.value.mode === 'range') {
          return h('div', { class: 'detail-row' }, [
            h('span', { class: 'detail-label' }, '从'),
            h(NInputNumber, {
              value: props.value.start,
              min: props.min,
              max: props.max,
              size: 'small',
              style: 'width: 110px',
              'onUpdate:value': (v: number | null) => update({ start: v ?? props.min }),
            }),
            h('span', { class: 'detail-label' }, '到'),
            h(NInputNumber, {
              value: props.value.end,
              min: props.min,
              max: props.max,
              size: 'small',
              style: 'width: 110px',
              'onUpdate:value': (v: number | null) => update({ end: v ?? props.max }),
            }),
            h('span', { class: 'detail-label' }, '范围内执行'),
          ])
        }
        if (props.value.mode === 'specific') {
          return h('div', { class: 'specific-grid' },
            options.map(n => h(NCheckbox, {
              checked: props.value.specific.includes(n),
              'onUpdate:checked': (checked: boolean) => {
                const set = new Set(props.value.specific)
                if (checked) set.add(n)
                else set.delete(n)
                update({ specific: Array.from(set).sort((a, b) => a - b) })
              },
            }, () => String(n))),
          )
        }
        return null
      })()

      return h('div', { class: 'field-config' }, [
        h(NRadioGroup, {
          value: props.value.mode,
          'onUpdate:value': (v: string) => update({ mode: v as FieldMode }),
        }, () => [
          h(NRadio, { value: 'every' }, () => '每单位（*）'),
          h(NRadio, { value: 'step' }, () => '间隔执行'),
          h(NRadio, { value: 'range' }, () => '区间范围'),
          h(NRadio, { value: 'specific' }, () => '指定值'),
          h(NRadio, { value: 'none' }, () => '不限制（*）'),
        ]),
        h('div', { class: 'mode-detail' }, [detailNode]),
      ])
    }
  },
})

// ============ 表达式生成 ============
function fieldToExpr(field: FieldValue): string {
  switch (field.mode) {
    case 'every':
    case 'none':
      return '*'
    case 'step':
      return `${field.start}/${field.step}`
    case 'range':
      return `${field.start}-${field.end}`
    case 'specific':
      return field.specific.length > 0 ? field.specific.join(',') : '*'
    default:
      return '*'
  }
}

const expression = computed(() => {
  return [
    fieldToExpr(fields.value.minute),
    fieldToExpr(fields.value.hour),
    fieldToExpr(fields.value.day),
    fieldToExpr(fields.value.month),
    fieldToExpr(fields.value.week),
  ].join(' ')
})

// 表达式段落数据
const segments = computed(() => [
  { field: 'minute', value: fieldToExpr(fields.value.minute), label: '分钟' },
  { field: 'hour', value: fieldToExpr(fields.value.hour), label: '小时' },
  { field: 'day', value: fieldToExpr(fields.value.day), label: '日' },
  { field: 'month', value: fieldToExpr(fields.value.month), label: '月' },
  { field: 'week', value: fieldToExpr(fields.value.week), label: '周' },
])

// ============ 表达式校验 ============
function parseField(expr: string, min: number, max: number): number[] | null {
  if (expr === '*' || expr === '?') {
    const arr: number[] = []
    for (let i = min; i <= max; i++) arr.push(i)
    return arr
  }
  const result = new Set<number>()
  for (const part of expr.split(',')) {
    const stepParts = part.split('/')
    const step = stepParts.length === 2 ? parseInt(stepParts[1], 10) : 1
    if (isNaN(step) || step < 1) return null
    const base = stepParts[0]
    let start = min
    let end = max
    if (base !== '*') {
      if (base.includes('-')) {
        const [s, e] = base.split('-')
        start = parseInt(s, 10)
        end = parseInt(e, 10)
        if (isNaN(start) || isNaN(end)) return null
      } else {
        start = parseInt(base, 10)
        if (isNaN(start)) return null
        end = start
      }
    }
    if (start < min || end > max || start > end) return null
    for (let i = start; i <= end; i += step) result.add(i)
  }
  return Array.from(result).sort((a, b) => a - b)
}

const validExpr = computed(() => {
  const parts = expression.value.split(' ')
  if (parts.length !== 5) return false
  const m = parseField(parts[0], 0, 59)
  const h = parseField(parts[1], 0, 23)
  const d = parseField(parts[2], 1, 31)
  const mon = parseField(parts[3], 1, 12)
  const w = parseField(parts[4], 0, 6)
  return !!(m && h && d && mon && w)
})

// ============ 表达式描述 ============
function describeField(field: FieldValue, label: string): string {
  switch (field.mode) {
    case 'every':
    case 'none':
      return `每${label}`
    case 'step':
      return `从${field.start}开始每${field.step}${label}`
    case 'range':
      return `${field.start}到${field.end}${label}`
    case 'specific':
      if (field.specific.length === 0) return `每${label}`
      return `指定${label}：${field.specific.join('、')}`
    default:
      return `每${label}`
  }
}

const description = computed(() => {
  if (!validExpr.value) return '表达式不合法，请检查配置'
  const notices: string[] = []
  const dayEvery = fields.value.day.mode === 'every' || fields.value.day.mode === 'none'
  const weekEvery = fields.value.week.mode === 'every' || fields.value.week.mode === 'none'
  if (!dayEvery && !weekEvery) {
    notices.push('注意：日和周同时指定时，二者取并集')
  }
  const minDesc = describeField(fields.value.minute, '分钟')
  const hourDesc = describeField(fields.value.hour, '小时')
  const dayDesc = describeField(fields.value.day, '日')
  const monDesc = describeField(fields.value.month, '月')
  const weekDesc = weekEvery ? '每周' : describeField(fields.value.week, '周')
  const noticeStr = notices.length ? `（${notices.join('；')}）` : ''
  return `每${monDesc}的${dayDesc} ${weekDesc} 的 ${hourDesc} 的 ${minDesc} 执行。${noticeStr}`
})

// ============ 下次执行时间计算 ============
const nextRuns = ref<string[]>([])

function calculateNextRuns(): void {
  if (!validExpr.value) {
    nextRuns.value = []
    return
  }
  const parts = expression.value.split(' ')
  const minutes = parseField(parts[0], 0, 59)!
  const hours = parseField(parts[1], 0, 23)!
  const days = parseField(parts[2], 1, 31)!
  const months = parseField(parts[3], 1, 12)!
  const weeks = parseField(parts[4], 0, 6)!

  const result: Date[] = []
  const start = new Date()
  start.setSeconds(0, 0)
  start.setMinutes(start.getMinutes() + 1)

  const limit = new Date(start.getTime() + 365 * 24 * 60 * 60 * 1000)
  let current = new Date(start)
  let count = 0
  const maxIter = 500000

  while (result.length < 5 && current < limit && count < maxIter) {
    count++
    const m = current.getMonth() + 1
    const d = current.getDate()
    const h = current.getHours()
    const min = current.getMinutes()
    const w = current.getDay()

    if (
      months.includes(m) &&
      days.includes(d) &&
      hours.includes(h) &&
      minutes.includes(min) &&
      weeks.includes(w)
    ) {
      result.push(new Date(current))
      current = new Date(current.getTime() + 60 * 1000)
    } else {
      current = new Date(current.getTime() + 60 * 1000)
    }
  }

  nextRuns.value = result.map(d => formatDateTime(d))
}

function formatDateTime(d: Date): string {
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const da = String(d.getDate()).padStart(2, '0')
  const ho = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  const wd = '日一二三四五六'[d.getDay()]
  return `${y}-${mo}-${da} ${ho}:${mi} 周${wd}`
}

function updateNextRuns(): void {
  setTimeout(calculateNextRuns, 0)
}

// 监听表达式变化自动计算
watch(expression, () => {
  calculateNextRuns()
}, { immediate: true })

// ============ 常用模板 ============
interface CronTemplate {
  name: string
  expr: string
  desc: string
  fields: {
    minute: FieldValue
    hour: FieldValue
    day: FieldValue
    month: FieldValue
    week: FieldValue
  }
}

const templates: CronTemplate[] = [
  {
    name: '每分钟',
    expr: '* * * * *',
    desc: '每分钟执行一次',
    fields: {
      minute: defaultField('every'),
      hour: defaultField('every'),
      day: defaultField('every', 1),
      month: defaultField('every', 1),
      week: defaultField('none'),
    },
  },
  {
    name: '每小时整点',
    expr: '0 * * * *',
    desc: '每小时 00 分执行',
    fields: {
      minute: { mode: 'specific', step: 1, start: 0, end: 0, specific: [0] },
      hour: defaultField('every'),
      day: defaultField('every', 1),
      month: defaultField('every', 1),
      week: defaultField('none'),
    },
  },
  {
    name: '每天凌晨',
    expr: '0 0 * * *',
    desc: '每天 00:00 执行',
    fields: {
      minute: { mode: 'specific', step: 1, start: 0, end: 0, specific: [0] },
      hour: { mode: 'specific', step: 1, start: 0, end: 0, specific: [0] },
      day: defaultField('every', 1),
      month: defaultField('every', 1),
      week: defaultField('none'),
    },
  },
  {
    name: '工作日早 9 点',
    expr: '0 9 * * 1-5',
    desc: '周一至周五 09:00 执行',
    fields: {
      minute: { mode: 'specific', step: 1, start: 0, end: 0, specific: [0] },
      hour: { mode: 'specific', step: 1, start: 9, end: 9, specific: [9] },
      day: defaultField('every', 1),
      month: defaultField('every', 1),
      week: { mode: 'range', step: 1, start: 1, end: 5, specific: [] },
    },
  },
  {
    name: '每 5 分钟',
    expr: '*/5 * * * *',
    desc: '每 5 分钟执行一次',
    fields: {
      minute: { mode: 'step', step: 5, start: 0, end: 0, specific: [] },
      hour: defaultField('every'),
      day: defaultField('every', 1),
      month: defaultField('every', 1),
      week: defaultField('none'),
    },
  },
  {
    name: '每月 1 号',
    expr: '0 0 1 * *',
    desc: '每月 1 日 00:00 执行',
    fields: {
      minute: { mode: 'specific', step: 1, start: 0, end: 0, specific: [0] },
      hour: { mode: 'specific', step: 1, start: 0, end: 0, specific: [0] },
      day: { mode: 'specific', step: 1, start: 1, end: 1, specific: [1] },
      month: defaultField('every', 1),
      week: defaultField('none'),
    },
  },
  {
    name: '每周日凌晨',
    expr: '0 0 * * 0',
    desc: '每周日 00:00 执行',
    fields: {
      minute: { mode: 'specific', step: 1, start: 0, end: 0, specific: [0] },
      hour: { mode: 'specific', step: 1, start: 0, end: 0, specific: [0] },
      day: defaultField('every', 1),
      month: defaultField('every', 1),
      week: { mode: 'specific', step: 1, start: 0, end: 0, specific: [0] },
    },
  },
  {
    name: '每天 8 点和 20 点',
    expr: '0 8,20 * * *',
    desc: '每天 08:00 和 20:00 执行',
    fields: {
      minute: { mode: 'specific', step: 1, start: 0, end: 0, specific: [0] },
      hour: { mode: 'specific', step: 1, start: 8, end: 8, specific: [8, 20] },
      day: defaultField('every', 1),
      month: defaultField('every', 1),
      week: defaultField('none'),
    },
  },
]

function applyTemplate(tpl: CronTemplate): void {
  fields.value = {
    minute: { ...tpl.fields.minute },
    hour: { ...tpl.fields.hour },
    day: { ...tpl.fields.day },
    month: { ...tpl.fields.month },
    week: { ...tpl.fields.week },
  }
  message.success(`已应用模板：${tpl.name}`)
}

// ============ 复制 ============
async function copyExpr(): Promise<void> {
  try {
    await navigator.clipboard.writeText(expression.value)
    message.success('表达式已复制')
  } catch {
    message.error('复制失败')
  }
}

async function copyDesc(): Promise<void> {
  try {
    await navigator.clipboard.writeText(description.value)
    message.success('说明已复制')
  } catch {
    message.error('复制失败')
  }
}
</script>

<style scoped>
.cron-expr-gen {
  max-width: 1000px;
  margin: 0 auto;
}

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.expression-box {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
}

.dark .expression-box {
  background: #2a2a3e;
}

.expression-segments {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.seg {
  flex: 1;
  text-align: center;
  background: #fff;
  border-radius: 6px;
  padding: 8px 4px;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s;
}

.dark .seg {
  background: #1f2937;
  border-color: #374151;
}

.seg:hover,
.seg.active {
  border-color: #2563eb;
}

.seg-value {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.seg.active .seg-value {
  color: #2563eb;
}

.dark .seg-value {
  color: #e0e0e0;
}

.dark .seg.active .seg-value {
  color: #60a5fa;
}

.seg-label {
  font-size: 12px;
  color: #888;
  margin-top: 4px;
}

.expression-full {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  color: #16a34a;
  padding: 8px;
}

.dark .expression-full {
  color: #4ade80;
}

.expression-actions {
  display: flex;
  gap: 8px;
}

.field-config {
  padding: 12px 0;
}

.mode-detail {
  margin-top: 16px;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.detail-label {
  font-size: 13px;
  color: #555;
}

.dark .detail-label {
  color: #bbb;
}

.specific-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(56px, 1fr));
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
  padding: 8px;
  background: #f9fafb;
  border-radius: 6px;
}

.dark .specific-grid {
  background: #1f2937;
}

.next-runs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.run-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 6px;
}

.dark .run-item {
  background: #1f2937;
}

.run-time {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 14px;
  color: #333;
}

.dark .run-time {
  color: #e0e0e0;
}

.templates {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.template-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;
}

.dark .template-item {
  border-color: #374151;
  background: #1f2937;
}

.template-item:hover {
  border-color: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.template-name {
  font-weight: 600;
  color: #2563eb;
  margin-bottom: 4px;
}

.dark .template-name {
  color: #60a5fa;
}

.template-expr {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  color: #16a34a;
  margin-bottom: 4px;
}

.dark .template-expr {
  color: #4ade80;
}

.template-desc {
  font-size: 12px;
  color: #666;
}

.dark .template-desc {
  color: #aaa;
}
</style>
