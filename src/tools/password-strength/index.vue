<template>
  <div class="password-strength">
    <n-input v-model:value="password" type="password" placeholder="输入密码检测强度" show-password-on="click" />
    <div class="strength-meter" v-if="password">
      <div class="meter" :style="{ width: strength + '%', background: strengthColor }"></div>
    </div>
    <div class="strength-label" v-if="password" :style="{ color: strengthColor }">{{ strengthText }}</div>
    <div class="suggestions" v-if="password && suggestions.length">
      <n-card title="改进建议" size="small">
        <n-list :bordered="false">
          <n-list-item v-for="suggestion in suggestions" :key="suggestion">
            {{ suggestion }}
          </n-list-item>
        </n-list>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { NInput, NCard, NList, NListItem } from 'naive-ui'

const password = ref('')
const strength = ref(0)
const strengthText = ref('')
const strengthColor = ref('')
const suggestions = ref<string[]>([])

const checkStrength = () => {
  if (!password.value) {
    strength.value = 0
    strengthText.value = ''
    strengthColor.value = ''
    suggestions.value = []
    return
  }
  
  let score = 0
  suggestions.value = []
  
  if (password.value.length < 8) {
    suggestions.value.push('密码长度至少 8 个字符')
  } else {
    score += 25
  }
  
  if (/[A-Z]/.test(password.value)) {
    score += 25
  } else {
    suggestions.value.push('添加至少一个大写字母')
  }
  
  if (/[a-z]/.test(password.value)) {
    score += 25
  } else {
    suggestions.value.push('添加至少一个小写字母')
  }
  
  if (/[0-9]/.test(password.value)) {
    score += 25
  } else {
    suggestions.value.push('添加至少一个数字')
  }
  
  if (/[^A-Za-z0-9]/.test(password.value)) {
    score += 20
  } else {
    suggestions.value.push('添加特殊字符（如 !@#$%^&*）可进一步提高强度')
  }
  
  strength.value = Math.min(score, 100)
  
  if (score < 30) {
    strengthText.value = '非常弱'
    strengthColor.value = '#ff4d4f'
  } else if (score < 50) {
    strengthText.value = '弱'
    strengthColor.value = '#fa8c16'
  } else if (score < 70) {
    strengthText.value = '中等'
    strengthColor.value = '#faad14'
  } else if (score < 90) {
    strengthText.value = '强'
    strengthColor.value = '#52c41a'
  } else {
    strengthText.value = '非常强'
    strengthColor.value = '#1890ff'
  }
}

watch(password, checkStrength, { immediate: true })
</script>

<style scoped>
.password-strength {
  max-width: 600px;
  margin: 0 auto;
}

.strength-meter {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  margin: 16px 0 8px;
  overflow: hidden;
}

.meter {
  height: 100%;
  transition: width 0.3s, background 0.3s;
}

.strength-label {
  font-weight: 500;
  margin-bottom: 16px;
}

.suggestions {
  margin-top: 20px;
}
</style>
