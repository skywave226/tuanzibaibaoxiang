<template>
  <div class="color-picker">
    <div class="picker-area">
      <input type="color" v-model="color" class="color-input" />
      <div class="preview" :style="{ background: color }"></div>
    </div>
    <n-space vertical class="values">
      <n-input :value="color" readonly placeholder="HEX">
        <template #prefix>HEX</template>
        <template #suffix><n-button text @click="copy(color)">复制</n-button></template>
      </n-input>
      <n-input :value="rgb" readonly placeholder="RGB">
        <template #prefix>RGB</template>
        <template #suffix><n-button text @click="copy(rgb)">复制</n-button></template>
      </n-input>
      <n-input :value="hsl" readonly placeholder="HSL">
        <template #prefix>HSL</template>
        <template #suffix><n-button text @click="copy(hsl)">复制</n-button></template>
      </n-input>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NSpace, NInput, NButton } from 'naive-ui'

const color = ref('#1890ff')

const rgb = computed(() => {
  const hex = color.value.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  return `rgb(${r}, ${g}, ${b})`
})

const hsl = computed(() => {
  const hex = color.value.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16) / 255
  const g = parseInt(hex.slice(2, 4), 16) / 255
  const b = parseInt(hex.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
})

function copy(text: string) {
  navigator.clipboard.writeText(text)
}
</script>

<style scoped>
.color-picker { max-width: 500px; margin: 0 auto; }
.picker-area { display: flex; gap: 16px; margin-bottom: 24px; align-items: center; }
.color-input { width: 100px; height: 100px; border: none; cursor: pointer; }
.preview { width: 100px; height: 100px; border-radius: 8px; border: 1px solid #e0e0e0; }
.values { margin-top: 20px; }
</style>
