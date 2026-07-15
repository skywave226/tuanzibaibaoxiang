<template>
  <div class="qrcode-generator">
    <div class="input-section">
      <n-input v-model:value="text" type="textarea" :rows="3" placeholder="输入要生成二维码的文本或链接" />
      <div class="options">
        <n-color-picker v-model:value="fgColor" :swatches="colorSwatches" />
        <n-color-picker v-model:value="bgColor" :swatches="colorSwatches" />
        <n-select v-model:value="size" :options="sizeOptions" style="width: 120px" />
      </div>
      <n-button type="primary" @click="generate" :loading="generating">生成二维码</n-button>
    </div>
    <div v-if="qrcode" class="result">
      <img :src="qrcode" alt="二维码" />
      <n-button @click="download">下载</n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NInput, NButton, NColorPicker, NSelect } from 'naive-ui'

const text = ref('')
const fgColor = ref('#000000')
const bgColor = ref('#ffffff')
const size = ref(300)
const generating = ref(false)
const qrcode = ref('')

const colorSwatches = ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00']
const sizeOptions = [
  { label: '200x200', value: 200 },
  { label: '300x300', value: 300 },
  { label: '400x400', value: 400 },
  { label: '500x500', value: 500 },
]

const generate = async () => {
  if (!text.value) return
  generating.value = true
  try {
    const QRCode = await import('qrcode')
    const dataUrl = await QRCode.toDataURL(text.value, {
      width: size.value,
      color: {
        dark: fgColor.value,
        light: bgColor.value,
      },
    })
    qrcode.value = dataUrl
  } finally {
    generating.value = false
  }
}

const download = () => {
  if (!qrcode.value) return
  const a = document.createElement('a')
  a.href = qrcode.value
  a.download = 'qrcode.png'
  a.click()
}
</script>

<style scoped>
.qrcode-generator {
  max-width: 800px;
  margin: 0 auto;
}
.input-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.options {
  display: flex;
  gap: 15px;
  align-items: center;
}
.options .n-color-picker {
  width: 120px;
}
.result {
  margin-top: 30px;
  text-align: center;
}
.result img {
  max-width: 100%;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-bottom: 15px;
}
</style>
