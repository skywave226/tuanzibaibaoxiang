<template>
  <div class="shadow-generator">
    <n-space vertical>
      <div class="controls">
        <n-space vertical>
          <div class="control-item">
            <span>X 轴偏移</span>
            <n-slider v-model:value="offsetX" :min="-50" :max="50" />
            <n-input-number v-model:value="offsetX" size="small" style="width: 100px" />
          </div>
          <div class="control-item">
            <span>Y 轴偏移</span>
            <n-slider v-model:value="offsetY" :min="-50" :max="50" />
            <n-input-number v-model:value="offsetY" size="small" style="width: 100px" />
          </div>
          <div class="control-item">
            <span>模糊半径</span>
            <n-slider v-model:value="blur" :min="0" :max="100" />
            <n-input-number v-model:value="blur" size="small" style="width: 100px" />
          </div>
          <div class="control-item">
            <span>扩展半径</span>
            <n-slider v-model:value="spread" :min="-50" :max="50" />
            <n-input-number v-model:value="spread" size="small" style="width: 100px" />
          </div>
          <div class="control-item">
            <span>颜色</span>
            <input type="color" v-model="color" />
          </div>
          <div class="control-item">
            <span>透明度</span>
            <n-slider v-model:value="opacity" :min="0" :max="1" :step="0.01" />
          </div>
          <n-checkbox v-model:checked="inset">内阴影</n-checkbox>
        </n-space>
      </div>
      
      <div class="preview" :style="{ boxShadow: shadow }"></div>
      
      <n-input :value="shadow" readonly>
        <template #prefix>CSS</template>
        <template #suffix><n-button text @click="copy(shadow)">复制</n-button></template>
      </n-input>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NSpace, NSlider, NInputNumber, NInput, NButton, NCheckbox } from 'naive-ui'

const offsetX = ref(5)
const offsetY = ref(5)
const blur = ref(10)
const spread = ref(0)
const color = ref('#000000')
const opacity = ref(0.3)
const inset = ref(false)

const shadow = computed(() => {
  const hex = color.value.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  const rgba = `rgba(${r}, ${g}, ${b}, ${opacity.value})`
  const insetStr = inset.value ? 'inset ' : ''
  return `${insetStr}${offsetX.value}px ${offsetY.value}px ${blur.value}px ${spread.value}px ${rgba}`
})

function copy(text: string) {
  navigator.clipboard.writeText(text)
}
</script>

<style scoped>
.shadow-generator { max-width: 800px; margin: 0 auto; }
.controls { margin-bottom: 20px; }
.control-item { display: flex; gap: 12px; align-items: center; margin-bottom: 12px; }
.control-item span { min-width: 80px; }
.control-item input[type="color"] { width: 60px; height: 40px; border: none; cursor: pointer; }
.preview {
  width: 200px;
  height: 200px;
  background: white;
  border-radius: 8px;
  margin: 20px auto;
}
</style>
