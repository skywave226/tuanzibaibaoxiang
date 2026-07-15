<template>
  <div class="game-config-gen">
    <div class="action-bar">
      <n-select
        v-model:value="currentTemplate"
        :options="templateOptions"
        size="small"
        placeholder="选择模板"
        class="template-select"
        @update:value="loadTemplate"
      />
      <n-button size="small" @click="loadJsonModal = true">导入 JSON</n-button>
      <n-button size="small" @click="addRow">添加行</n-button>
      <n-button size="small" type="primary" @click="generateOutput">生成配置</n-button>
      <n-button size="small" @click="copyOutput">复制结果</n-button>
      <n-button size="small" @click="downloadOutput">下载文件</n-button>
    </div>

    <div class="section">
      <div class="section-header">
        <span class="section-title">配置根名</span>
      </div>
      <div class="config-row">
        <span class="config-label">根节点名</span>
        <n-input v-model:value="rootName" size="small" placeholder="如 character / weapon / level" class="root-input" />
        <span class="config-label">导出格式</span>
        <n-select v-model:value="format" :options="formatOptions" size="small" class="format-select" />
      </div>
    </div>

    <!-- 表格编辑 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title">配置项编辑</span>
      </div>
      <div class="table-wrap">
        <table class="config-table">
          <thead>
            <tr>
              <th class="col-key">键名 (Key)</th>
              <th class="col-value">值 (Value)</th>
              <th class="col-type">类型</th>
              <th class="col-desc">说明</th>
              <th class="col-action">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in rows" :key="idx">
              <td>
                <n-input v-model:value="row.key" size="small" placeholder="如 name" class="cell-input" />
              </td>
              <td>
                <n-input v-model:value="row.value" size="small" placeholder="如 战士" class="cell-input" />
              </td>
              <td>
                <n-select v-model:value="row.type" :options="typeOptions" size="small" class="type-select" />
              </td>
              <td>
                <n-input v-model:value="row.desc" size="small" placeholder="说明（可选）" class="cell-input" />
              </td>
              <td>
                <div class="row-actions">
                  <n-button size="tiny" quaternary @click="moveRow(idx, -1)" :disabled="idx === 0">↑</n-button>
                  <n-button size="tiny" quaternary @click="moveRow(idx, 1)" :disabled="idx === rows.length - 1">↓</n-button>
                  <n-button size="tiny" quaternary type="error" @click="removeRow(idx)">删除</n-button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 输出预览 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title">配置输出</span>
      </div>
      <n-input
        v-model:value="output"
        type="textarea"
        :rows="14"
        readonly
        class="output-box"
      />
    </div>

    <!-- 导入 JSON 模态框 -->
    <n-modal v-model:show="loadJsonModal" preset="dialog" title="导入 JSON 编辑">
      <n-input
        v-model:value="importJson"
        type="textarea"
        :rows="10"
        placeholder='粘贴 JSON，如 {"name":"战士","hp":100}'
        class="import-box"
      />
      <template #action>
        <n-button @click="loadJsonModal = false">取消</n-button>
        <n-button type="primary" @click="importJsonData">导入</n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NInput, NSelect, NModal, useMessage } from 'naive-ui'

const message = useMessage()

type RowType = 'string' | 'number' | 'boolean' | 'array' | 'object'
interface ConfigRow {
  key: string
  value: string
  type: RowType
  desc: string
}

const rootName = ref('character')
const format = ref<'json' | 'csv' | 'ini'>('json')
const formatOptions = [
  { label: 'JSON', value: 'json' },
  { label: 'CSV', value: 'csv' },
  { label: 'INI', value: 'ini' },
]

const typeOptions = [
  { label: '字符串', value: 'string' },
  { label: '数字', value: 'number' },
  { label: '布尔', value: 'boolean' },
  { label: '数组', value: 'array' },
  { label: '对象', value: 'object' },
]

const rows = ref<ConfigRow[]>([])

const currentTemplate = ref<string>('rpg')
const templateOptions = [
  { label: 'RPG 角色模板', value: 'rpg' },
  { label: 'FPS 武器模板', value: 'fps' },
  { label: '关卡配置模板', value: 'level' },
  { label: '空白', value: 'blank' },
]

const loadJsonModal = ref(false)
const importJson = ref('')
const output = ref('')

function loadTemplate(key: string): void {
  if (key === 'rpg') {
    rootName.value = 'character'
    rows.value = [
      { key: 'name', value: '战士', type: 'string', desc: '角色名称' },
      { key: 'class', value: 'warrior', type: 'string', desc: '职业' },
      { key: 'level', value: '1', type: 'number', desc: '等级' },
      { key: 'hp', value: '100', type: 'number', desc: '生命值' },
      { key: 'mp', value: '50', type: 'number', desc: '魔法值' },
      { key: 'attack', value: '15', type: 'number', desc: '攻击力' },
      { key: 'defense', value: '10', type: 'number', desc: '防御力' },
      { key: 'speed', value: '5', type: 'number', desc: '速度' },
      { key: 'skills', value: '["冲锋", "旋风斩", "嘲讽"]', type: 'array', desc: '技能列表' },
      { key: 'isPlayable', value: 'true', type: 'boolean', desc: '是否可操控' },
    ]
  } else if (key === 'fps') {
    rootName.value = 'weapon'
    rows.value = [
      { key: 'name', value: 'AK-47', type: 'string', desc: '武器名称' },
      { key: 'type', value: 'rifle', type: 'string', desc: '武器类型' },
      { key: 'damage', value: '36', type: 'number', desc: '伤害值' },
      { key: 'fireRate', value: '600', type: 'number', desc: '射速 (RPM)' },
      { key: 'magazineSize', value: '30', type: 'number', desc: '弹匣容量' },
      { key: 'reloadTime', value: '2.5', type: 'number', desc: '换弹时间 (秒)' },
      { key: 'range', value: '300', type: 'number', desc: '射程' },
      { key: 'recoil', value: '0.8', type: 'number', desc: '后坐力' },
      { key: 'attachments', value: '["瞄准镜", "握把", "弹鼓"]', type: 'array', desc: '配件' },
      { key: 'isAutomatic', value: 'true', type: 'boolean', desc: '是否全自动' },
    ]
  } else if (key === 'level') {
    rootName.value = 'level'
    rows.value = [
      { key: 'id', value: '1', type: 'number', desc: '关卡 ID' },
      { key: 'name', value: '新手村', type: 'string', desc: '关卡名称' },
      { key: 'difficulty', value: 'easy', type: 'string', desc: '难度' },
      { key: 'minLevel', value: '1', type: 'number', desc: '最低等级' },
      { key: 'timeLimit', value: '300', type: 'number', desc: '时间限制 (秒)' },
      { key: 'enemies', value: '["史莱姆", "哥布林"]', type: 'array', desc: '敌人列表' },
      { key: 'rewards', value: '{"exp":100,"gold":50}', type: 'object', desc: '奖励' },
      { key: 'isBoss', value: 'false', type: 'boolean', desc: '是否 Boss 关' },
    ]
  } else {
    rows.value = []
  }
  generateOutput()
}

function addRow(): void {
  rows.value.push({ key: '', value: '', type: 'string', desc: '' })
}

function removeRow(idx: number): void {
  rows.value.splice(idx, 1)
}

function moveRow(idx: number, dir: number): void {
  const target = idx + dir
  if (target < 0 || target >= rows.value.length) return
  const tmp = rows.value[idx]
  rows.value[idx] = rows.value[target]
  rows.value[target] = tmp
}

function parseValue(value: string, type: RowType): any {
  const v = value.trim()
  if (type === 'number') {
    const n = Number(v)
    return isNaN(n) ? 0 : n
  }
  if (type === 'boolean') {
    return v === 'true' || v === '1'
  }
  if (type === 'array' || type === 'object') {
    try {
      return JSON.parse(v)
    } catch {
      return type === 'array' ? [] : {}
    }
  }
  return v
}

function buildObject(): Record<string, any> {
  const obj: Record<string, any> = {}
  for (const row of rows.value) {
    if (!row.key.trim()) continue
    obj[row.key] = parseValue(row.value, row.type)
  }
  return obj
}

function generateOutput(): void {
  const data = buildObject()
  if (format.value === 'json') {
    const wrapper: Record<string, any> = {}
    wrapper[rootName.value || 'config'] = data
    output.value = JSON.stringify(wrapper, null, 2)
  } else if (format.value === 'csv') {
    const validRows = rows.value.filter(r => r.key.trim())
    const header = validRows.map(r => r.key).join(',')
    const valueLine = validRows.map(r => {
      const v = r.value
      if (v.includes(',') || v.includes('"')) {
        return `"${v.replace(/"/g, '""')}"`
      }
      return v
    }).join(',')
    output.value = `${header}\n${valueLine}`
  } else {
    // INI
    let text = `[${rootName.value || 'config'}]\n`
    for (const row of rows.value) {
      if (!row.key.trim()) continue
      let v = row.value
      if (row.type === 'array' || row.type === 'object') {
        v = v.replace(/"/g, "'")
      }
      text += `${row.key}=${v}\n`
      if (row.desc) text += `; ${row.desc}\n`
    }
    output.value = text
  }
}

function importJsonData(): void {
  try {
    const parsed = JSON.parse(importJson.value)
    const inner = parsed[rootName.value] || parsed
    const obj = typeof inner === 'object' && !Array.isArray(inner) ? inner : parsed
    const newRows: ConfigRow[] = []
    for (const [k, v] of Object.entries(obj)) {
      const r: ConfigRow = { key: k, value: '', type: 'string', desc: '' }
      if (typeof v === 'number') {
        r.type = 'number'
        r.value = String(v)
      } else if (typeof v === 'boolean') {
        r.type = 'boolean'
        r.value = String(v)
      } else if (Array.isArray(v)) {
        r.type = 'array'
        r.value = JSON.stringify(v)
      } else if (v !== null && typeof v === 'object') {
        r.type = 'object'
        r.value = JSON.stringify(v)
      } else {
        r.value = String(v ?? '')
      }
      newRows.push(r)
    }
    rows.value = newRows
    loadJsonModal.value = false
    importJson.value = ''
    generateOutput()
    message.success(`已导入 ${newRows.length} 个配置项`)
  } catch (e) {
    message.error('JSON 格式错误，请检查输入')
  }
}

function copyOutput(): void {
  if (!output.value) {
    message.warning('请先生成配置')
    return
  }
  navigator.clipboard.writeText(output.value).then(() => {
    message.success('已复制到剪贴板')
  }).catch(() => {
    message.error('复制失败')
  })
}

function downloadOutput(): void {
  if (!output.value) {
    message.warning('请先生成配置')
    return
  }
  const ext = format.value === 'json' ? 'json' : format.value === 'csv' ? 'csv' : 'ini'
  const blob = new Blob([output.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${rootName.value || 'config'}.${ext}`
  a.click()
  URL.revokeObjectURL(url)
  message.success(`已下载 ${ext.toUpperCase()} 文件`)
}

// 初始化
loadTemplate('rpg')
</script>

<style scoped>
.game-config-gen {
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

.config-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.config-label {
  color: #666;
  font-size: 13px;
  min-width: 80px;
  flex-shrink: 0;
}

.template-select {
  width: 200px;
}

.root-input {
  width: 200px;
}

.format-select {
  width: 120px;
}

.table-wrap {
  overflow-x: auto;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
}

.config-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
}

.config-table th {
  background: #f5f5f7;
  padding: 8px;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #e8e8e8;
}

.config-table td {
  padding: 6px 8px;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: middle;
}

.col-key { width: 22%; }
.col-value { width: 30%; }
.col-type { width: 16%; }
.col-desc { width: 20%; }
.col-action { width: 12%; }

.cell-input {
  width: 100%;
}

.type-select {
  width: 100%;
}

.row-actions {
  display: flex;
  gap: 2px;
}

.output-box {
  font-family: 'Fira Code', 'Consolas', 'Courier New', monospace;
  font-size: 13px;
}

.import-box {
  font-family: 'Fira Code', 'Consolas', 'Courier New', monospace;
  font-size: 13px;
}

.dark .section-title {
  color: #e0e0e0;
}

.dark .config-label {
  color: #aaa;
}

.dark .config-table th {
  background: #1f1f33;
  color: #e0e0e0;
  border-color: #2a2a4a;
}

.dark .config-table td {
  border-color: #2a2a4a;
}

.dark .table-wrap {
  border-color: #2a2a4a;
}
</style>
