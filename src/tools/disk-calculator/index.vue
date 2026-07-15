<template>
  <div class="disk-calculator">
    <!-- 配置区 -->
    <div class="config-section">
      <div class="config-row">
        <n-form-item label="磁盘数量">
          <n-input-number v-model:value="diskCount" :min="1" :max="256" style="width: 100%" />
        </n-form-item>
        <n-form-item label="单盘容量">
          <div style="display: flex; gap: 8px">
            <n-input-number v-model:value="diskSize" :min="1" :step="1" style="flex: 1" />
            <n-select v-model:value="diskUnit" :options="unitOptions" size="small" style="width: 90px" />
          </div>
        </n-form-item>
        <n-form-item label="RAID 级别">
          <n-select v-model:value="raidLevel" :options="raidOptions" style="width: 100%" />
        </n-form-item>
      </div>
    </div>

    <!-- 校验提示 -->
    <n-alert v-if="validationError" type="error" :bordered="false" class="validation-alert">
      {{ validationError }}
    </n-alert>

    <!-- 计算结果 -->
    <div v-if="!validationError" class="result-section">
      <div class="result-grid">
        <n-card class="result-card" :bordered="false">
          <div class="result-label">总原始容量</div>
          <div class="result-value">{{ formatCapacity(totalRaw) }}</div>
          <div class="result-sub">{{ formatCapacity(totalRaw, 'bytes') }}</div>
        </n-card>
        <n-card class="result-card" :bordered="false">
          <div class="result-label">可用容量</div>
          <div class="result-value primary">{{ formatCapacity(usable) }}</div>
          <div class="result-sub">{{ formatCapacity(usable, 'bytes') }}</div>
        </n-card>
        <n-card class="result-card" :bordered="false">
          <div class="result-label">冗余容量</div>
          <div class="result-value warn">{{ formatCapacity(redundant) }}</div>
          <div class="result-sub">{{ formatCapacity(redundant, 'bytes') }}</div>
        </n-card>
        <n-card class="result-card" :bordered="false">
          <div class="result-label">空间利用率</div>
          <div class="result-value">{{ utilization }}%</div>
          <div class="result-sub">可用 / 总容量</div>
        </n-card>
      </div>

      <!-- 容量可视化 -->
      <div class="visual-section">
        <div class="visual-label">容量分布</div>
        <div class="visual-bar">
          <div class="bar-usable" :style="{ width: utilization + '%' }">
            <span v-if="utilization >= 15">可用</span>
          </div>
          <div class="bar-redundant" :style="{ width: (100 - utilization) + '%' }">
            <span v-if="100 - utilization >= 15">冗余</span>
          </div>
        </div>
      </div>
    </div>

    <!-- RAID 特性说明 -->
    <div class="raid-info">
      <n-divider>RAID 特性说明</n-divider>
      <n-descriptions :column="2" label-placement="left" bordered>
        <n-descriptions-item label="RAID 级别">{{ raidInfo.name }}</n-descriptions-item>
        <n-descriptions-item label="最少磁盘数">{{ raidInfo.minDisks }} 块</n-descriptions-item>
        <n-descriptions-item label="容错能力">{{ raidInfo.faultTolerance }}</n-descriptions-item>
        <n-descriptions-item label="空间利用率">{{ raidInfo.efficiency }}</n-descriptions-item>
        <n-descriptions-item label="读写性能" :span="2">{{ raidInfo.performance }}</n-descriptions-item>
        <n-descriptions-item label="适用场景" :span="2">{{ raidInfo.scenario }}</n-descriptions-item>
        <n-descriptions-item label="原理说明" :span="2">{{ raidInfo.description }}</n-descriptions-item>
      </n-descriptions>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  NInputNumber, NSelect, NFormItem, NCard, NAlert,
  NDivider, NDescriptions, NDescriptionsItem,
} from 'naive-ui'

const diskCount = ref(4)
const diskSize = ref(2)
const diskUnit = ref<'TB' | 'GB' | 'MB'>('TB')
const raidLevel = ref<'0' | '1' | '5' | '6' | '10'>('5')

const unitOptions = [
  { label: 'MB', value: 'MB' },
  { label: 'GB', value: 'GB' },
  { label: 'TB', value: 'TB' },
]

const raidOptions = [
  { label: 'RAID 0（条带化）', value: '0' },
  { label: 'RAID 1（镜像）', value: '1' },
  { label: 'RAID 5（奇偶校验）', value: '5' },
  { label: 'RAID 6（双重校验）', value: '6' },
  { label: 'RAID 10（镜像+条带）', value: '10' },
]

// 单位换算到 GB
function toGB(value: number, unit: string): number {
  if (unit === 'TB') return value * 1024
  if (unit === 'GB') return value
  if (unit === 'MB') return value / 1024
  return value
}

// 格式化容量显示
function formatCapacity(gb: number, mode: 'human' | 'bytes' = 'human'): string {
  if (mode === 'bytes') {
    const bytes = gb * 1024 * 1024 * 1024
    if (bytes >= Math.pow(1024, 4)) return (bytes / Math.pow(1024, 4)).toFixed(2) + ' TiB'
    if (bytes >= Math.pow(1024, 3)) return (bytes / Math.pow(1024, 3)).toFixed(2) + ' GiB'
    return (bytes / Math.pow(1024, 2)).toFixed(2) + ' MiB'
  }
  if (gb >= 1024) return (gb / 1024).toFixed(2) + ' TB'
  if (gb < 1) return (gb * 1024).toFixed(2) + ' MB'
  return gb.toFixed(2) + ' GB'
}

// 校验
const validationError = computed<string>(() => {
  const n = diskCount.value
  const level = raidLevel.value
  if (level === '0' && n < 2) return 'RAID 0 至少需要 2 块磁盘'
  if (level === '1' && n < 2) return 'RAID 1 至少需要 2 块磁盘'
  if (level === '5' && n < 3) return 'RAID 5 至少需要 3 块磁盘'
  if (level === '6' && n < 4) return 'RAID 6 至少需要 4 块磁盘'
  if (level === '10' && n < 4) return 'RAID 10 至少需要 4 块磁盘'
  if (level === '10' && n % 2 !== 0) return 'RAID 10 需要偶数块磁盘'
  return ''
})

// 总原始容量（GB）
const totalRaw = computed(() => {
  return diskCount.value * toGB(diskSize.value, diskUnit.value)
})

// 可用容量（GB）
const usable = computed(() => {
  const n = diskCount.value
  const size = toGB(diskSize.value, diskUnit.value)
  switch (raidLevel.value) {
    case '0': return n * size
    case '1': return size // 镜像，可用 1 块
    case '5': return (n - 1) * size
    case '6': return (n - 2) * size
    case '10': return (n / 2) * size
    default: return 0
  }
})

// 冗余容量（GB）
const redundant = computed(() => {
  return Math.max(0, totalRaw.value - usable.value)
})

// 利用率
const utilization = computed(() => {
  if (totalRaw.value === 0) return 0
  return Math.round((usable.value / totalRaw.value) * 100)
})

// RAID 特性信息
const raidInfo = computed(() => {
  const infoMap: Record<string, {
    name: string
    minDisks: number
    faultTolerance: string
    efficiency: string
    performance: string
    scenario: string
    description: string
  }> = {
    '0': {
      name: 'RAID 0',
      minDisks: 2,
      faultTolerance: '无（任意盘故障即全损）',
      efficiency: '100%（N/N）',
      performance: '读写性能最高，数据分散到所有盘并行读写，但无冗余',
      scenario: '对数据安全无要求、追求极致性能的临时数据/缓存场景',
      description: '数据以条带方式分布写入所有磁盘，无校验无镜像，所有容量均可用',
    },
    '1': {
      name: 'RAID 1',
      minDisks: 2,
      faultTolerance: '可坏 1 块（镜像组内）',
      efficiency: '50%（1/N）',
      performance: '读性能提升，写性能略降，数据完全镜像',
      scenario: '系统盘、关键配置数据等对可靠性要求高的小容量场景',
      description: '两块磁盘互为镜像，写入时同时写入两块盘，读时可从任一盘读取',
    },
    '5': {
      name: 'RAID 5',
      minDisks: 3,
      faultTolerance: '可坏 1 块',
      efficiency: '(N-1)/N，随磁盘数增加而提升',
      performance: '读性能较好，写性能受校验计算影响略低',
      scenario: '文件服务、Web 服务、中等读写负载的通用存储场景',
      description: '数据条带化并分布式存储奇偶校验，1 块校验盘可恢复任意 1 块故障',
    },
    '6': {
      name: 'RAID 6',
      minDisks: 4,
      faultTolerance: '可坏 2 块',
      efficiency: '(N-2)/N',
      performance: '读性能较好，写性能因双重校验较 RAID 5 更低',
      scenario: '大容量存储、归档备份等对可靠性要求极高的场景',
      description: '在 RAID 5 基础上增加双重校验，可容忍同时 2 块磁盘故障',
    },
    '10': {
      name: 'RAID 10',
      minDisks: 4,
      faultTolerance: '每组镜像可坏 1 块',
      efficiency: '50%（N/2/N）',
      performance: '读写性能均优秀，兼顾 RAID 0 性能与 RAID 1 冗余',
      scenario: '数据库、虚拟化平台等高 IO 高可靠性场景',
      description: '先做 RAID 1 镜像再做 RAID 0 条带，每对镜像丢失不超过 1 块即安全',
    },
  }
  return infoMap[raidLevel.value]
})
</script>

<style scoped>
.disk-calculator {
  max-width: 1000px;
  margin: 0 auto;
}

.config-section {
  margin-bottom: 20px;
}

.config-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.config-row .n-form-item {
  flex: 1;
  min-width: 200px;
}

.validation-alert {
  margin-bottom: 20px;
}

.result-section {
  margin-bottom: 24px;
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.result-card {
  text-align: center;
}

.result-label {
  font-size: 13px;
  opacity: 0.7;
  margin-bottom: 8px;
}

.result-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--n-text-color);
}

.result-value.primary {
  color: #18a058;
}

.result-value.warn {
  color: #f0a020;
}

.result-sub {
  font-size: 12px;
  opacity: 0.5;
  margin-top: 4px;
}

.visual-section {
  margin-bottom: 8px;
}

.visual-label {
  font-size: 13px;
  opacity: 0.7;
  margin-bottom: 8px;
}

.visual-bar {
  display: flex;
  height: 32px;
  border-radius: 4px;
  overflow: hidden;
  background: rgba(128, 128, 128, 0.15);
}

.bar-usable {
  background: #18a058;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  transition: width 0.3s;
}

.bar-redundant {
  background: #f0a020;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  transition: width 0.3s;
}

.raid-info {
  margin-top: 24px;
}

@media (max-width: 768px) {
  .result-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.dark .result-card {
  background: rgba(255, 255, 255, 0.04);
}

.dark .bar-usable {
  background: #36ad6a;
}

.dark .bar-redundant {
  background: #f0a020;
}
</style>
