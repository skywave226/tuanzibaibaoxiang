<template>
  <div class="gradient-generator">
    <n-space vertical>
      <n-radio-group v-model:value="type">
        <n-radio-button value="linear">线性渐变</n-radio-button>
        <n-radio-button value="radial">径向渐变</n-radio-button>
      </n-radio-group>
      
      <div v-if="type === 'linear'" class="controls">
        <n-input-number v-model:value="angle" :min="0" :max="360" :step="1">
          <template #prefix>角度</template>
        </n-input-number>
      </div>
      
      <div class="colors">
        <div v-for="(stop, index) in stops" :key="index" class="color-stop">
          <input type="color" v-model="stop.color" />
          <n-input-number v-model:value="stop.position" :min="0" :max="100" :step="1" size="small">
            <template #suffix>%</template>
          </n-input-number>
          <n-button v-if="stops.length > 2" text type="error" @click="removeStop(index)">删除</n-button>
        </div>
        <n-button @click="addStop" size="small">添加颜色</n-button>
      </div>
      
      <div class="preview" :style="{ background: gradient }"></div>
      
      <n-input :value="gradient" readonly>
        <template #prefix>CSS</template>
        <template #suffix><n-button text @click="copy(gradient)">复制</n-button></template>
      </n-input>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NSpace, NRadioGroup, NRadioButton, NInputNumber, NInput, NButton } from 'naive-ui'

interface ColorStop {
  color: string
  position: number
}

const type = ref('linear')
const angle = ref(90)
const stops = ref<ColorStop[]>([
  { color: '#1890ff', position: 0 },
  { color: '#52c41a', position: 100 }
])

const gradient = computed(() => {
  const stopsStr = stops.value
    .sort((a, b) => a.position - b.position)
    .map(s => `${s.color} ${s.position}%`)
    .join(', ')
  
  if (type.value === 'linear') {
    return `linear-gradient(${angle.value}deg, ${stopsStr})`
  } else {
    return `radial-gradient(circle, ${stopsStr})`
  }
})

function addStop() {
  const lastStop = stops.value[stops.value.length - 1]
  stops.value.push({
    color: '#faad14',
    position: Math.min(lastStop.position + 20, 100)
  })
}

function removeStop(index: number) {
  stops.value.splice(index, 1)
}

function copy(text: string) {
  navigator.clipboard.writeText(text)
}
</script>

<style scoped>
.gradient-generator { max-width: 800px; margin: 0 auto; }
.controls { margin: 16px 0; }
.colors { display: flex; flex-direction: column; gap: 12px; margin: 16px 0; }
.color-stop { display: flex; gap: 8px; align-items: center; }
.color-stop input[type="color"] { width: 60px; height: 40px; border: none; cursor: pointer; }
.preview { width: 100%; height: 200px; border-radius: 8px; border: 1px solid #e0e0e0; margin: 20px 0; }
</style>
