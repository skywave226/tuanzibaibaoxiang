<template>
  <div class="jwt-decoder">
    <n-input v-model:value="token" type="textarea" placeholder="请输入 JWT Token..." :rows="4" />
    <div class="sections" v-if="decoded">
      <div class="section">
        <div class="section-title">Header (头部)</div>
        <pre>{{ decoded.header }}</pre>
      </div>
      <div class="section">
        <div class="section-title">Payload (负载)</div>
        <pre>{{ decoded.payload }}</pre>
      </div>
      <div class="section">
        <div class="section-title">Signature (签名)</div>
        <pre>{{ decoded.signature }}</pre>
      </div>
      <div class="section" v-if="decoded.expired">
        <n-alert type="warning">Token 已过期</n-alert>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { NInput, NAlert } from 'naive-ui'
const token = ref('')
const decoded = computed(() => {
  if (!token.value.trim()) return null
  const parts = token.value.split('.')
  if (parts.length !== 3) return null
  try {
    const header = JSON.parse(atob(parts[0]))
    const payload = JSON.parse(atob(parts[1]))
    const signature = parts[2]
    const expired = payload.exp && payload.exp * 1000 < Date.now()
    return {
      header: JSON.stringify(header, null, 2),
      payload: JSON.stringify(payload, null, 2),
      signature,
      expired
    }
  } catch { return null }
})
</script>
<style scoped>
.jwt-decoder { max-width: 1000px; margin: 0 auto; }
.sections { display: grid; gap: 16px; margin-top: 20px; }
.section { background: #f5f5f5; padding: 16px; border-radius: 8px; }
.section-title { font-weight: bold; margin-bottom: 8px; color: #333; }
pre { background: #fff; padding: 12px; border-radius: 4px; overflow-x: auto; font-size: 13px; }
</style>
