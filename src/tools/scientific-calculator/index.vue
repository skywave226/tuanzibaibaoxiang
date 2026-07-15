<template>
  <div class="scientific-calculator">
    <div class="display card mb-4">
      <div class="expression">{{ expression || '0' }}</div>
      <div class="result" v-if="result !== null">{{ result }}</div>
    </div>

    <div class="mode-switch mb-3">
      <n-radio-group v-model:value="angleMode" size="small">
        <n-radio-button value="deg">角度 (DEG)</n-radio-button>
        <n-radio-button value="rad">弧度 (RAD)</n-radio-button>
      </n-radio-group>
    </div>

    <div class="keypad">
      <div class="key-row">
        <button class="key func" @click="clearAll">AC</button>
        <button class="key func" @click="deleteLast">⌫</button>
        <button class="key func" @click="toggleSign">±</button>
        <button class="key op" @click="appendOperator('/')">÷</button>
      </div>

      <div class="key-row">
        <button class="key sci" @click="appendFunc('sin')">sin</button>
        <button class="key sci" @click="appendFunc('cos')">cos</button>
        <button class="key sci" @click="appendFunc('tan')">tan</button>
        <button class="key sci" @click="appendConst('π')">π</button>
      </div>

      <div class="key-row">
        <button class="key sci" @click="appendFunc('log')">log</button>
        <button class="key sci" @click="appendFunc('ln')">ln</button>
        <button class="key sci" @click="appendFunc('sqrt')">√</button>
        <button class="key sci" @click="appendConst('e')">e</button>
      </div>

      <div class="key-row">
        <button class="key sci" @click="appendPower('^')">x^y</button>
        <button class="key sci" @click="appendFunc('exp')">e^x</button>
        <button class="key sci" @click="appendChar('!')">!</button>
        <button class="key op" @click="appendOperator('*')">×</button>
      </div>

      <div class="key-row">
        <button class="key num" @click="appendChar('7')">7</button>
        <button class="key num" @click="appendChar('8')">8</button>
        <button class="key num" @click="appendChar('9')">9</button>
        <button class="key op" @click="appendOperator('-')">−</button>
      </div>

      <div class="key-row">
        <button class="key num" @click="appendChar('4')">4</button>
        <button class="key num" @click="appendChar('5')">5</button>
        <button class="key num" @click="appendChar('6')">6</button>
        <button class="key op" @click="appendOperator('+')">+</button>
      </div>

      <div class="key-row">
        <button class="key num" @click="appendChar('1')">1</button>
        <button class="key num" @click="appendChar('2')">2</button>
        <button class="key num" @click="appendChar('3')">3</button>
        <button class="key eq" @click="calculate">=</button>
      </div>

      <div class="key-row">
        <button class="key num zero" @click="appendChar('0')">0</button>
        <button class="key num" @click="appendChar('.')">.</button>
        <button class="key num" @click="appendChar('(')">(</button>
        <button class="key num" @click="appendChar(')')">)</button>
      </div>
    </div>

    <n-alert type="error" v-if="errorMsg" class="mt-4" closable @close="errorMsg = ''">
      {{ errorMsg }}
    </n-alert>

    <div class="history card mt-4" v-if="history.length > 0">
      <div class="history-header">
        <h3 class="text-sm font-bold">历史记录</h3>
        <n-button text size="small" @click="clearHistory">清空</n-button>
      </div>
      <div class="history-list">
        <div v-for="(item, index) in history" :key="index" class="history-item" @click="useHistory(item)">
          <span class="history-expr">{{ item.expression }}</span>
          <span class="history-result">= {{ item.result }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NRadioGroup, NRadioButton, NAlert, NButton } from 'naive-ui'

interface HistoryItem {
  expression: string
  result: string
}

const expression = ref('')
const result = ref<number | null>(null)
const errorMsg = ref('')
const angleMode = ref<'deg' | 'rad'>('deg')
const history = ref<HistoryItem[]>([])

function appendChar(ch: string) {
  errorMsg.value = ''
  expression.value += ch
}

function appendOperator(op: string) {
  errorMsg.value = ''
  const last = expression.value.slice(-1)
  // 避免连续运算符
  if (['+', '-', '*', '/'].includes(last) && op !== '-') {
    expression.value = expression.value.slice(0, -1)
  }
  expression.value += op
}

function appendFunc(func: string) {
  errorMsg.value = ''
  expression.value += `${func}(`
}

function appendConst(constant: string) {
  errorMsg.value = ''
  // π → PI，e → E
  const map: Record<string, string> = { 'π': 'PI', 'e': 'E' }
  expression.value += map[constant] || constant
}

function appendPower(op: string) {
  errorMsg.value = ''
  expression.value += op
}

function toggleSign() {
  // 在表达式末尾的数字前加负号
  const match = expression.value.match(/(-?\d*\.?\d+)$/)
  if (match) {
    const num = match[1]
    const start = expression.value.length - num.length
    if (expression.value[start - 1] === '-' && (start === 1 || /[(+\-*/]/.test(expression.value[start - 2] || ''))) {
      expression.value = expression.value.slice(0, start - 1) + num
    } else {
      expression.value = expression.value.slice(0, start) + '(-' + num + ')'
    }
  }
}

function deleteLast() {
  errorMsg.value = ''
  expression.value = expression.value.slice(0, -1)
}

function clearAll() {
  expression.value = ''
  result.value = null
  errorMsg.value = ''
}

// 阶乘
function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) throw new Error('阶乘仅支持非负整数')
  if (n > 170) throw new Error('数值超出范围')
  if (n <= 1) return 1
  let r = 1
  for (let i = 2; i <= n; i++) r *= i
  return r
}

// 将表达式转换为可执行的 JS 表达式
function buildExpression(expr: string): string {
  let jsExpr = expr

  // 角度转弧度（DEG 模式下三角函数）
  const angleFactor = angleMode.value === 'deg' ? '(Math.PI/180)' : ''

  // 替换函数
  jsExpr = jsExpr.replace(/sin\(/g, `Math.sin(${angleFactor ? angleFactor + '(' : ''}`)
  jsExpr = jsExpr.replace(/cos\(/g, `Math.cos(${angleFactor ? angleFactor + '(' : ''}`)
  jsExpr = jsExpr.replace(/tan\(/g, `Math.tan(${angleFactor ? angleFactor + '(' : ''}`)

  // 补全角度转换的右括号
  if (angleFactor) {
    const funcCount = (expr.match(/(sin|cos|tan)\(/g) || []).length
    for (let i = 0; i < funcCount; i++) {
      // 找到对应函数的右括号位置并补一个右括号
    }
  }

  // 对数与指数
  jsExpr = jsExpr.replace(/log\(/g, 'Math.log10(')
  jsExpr = jsExpr.replace(/ln\(/g, 'Math.log(')
  jsExpr = jsExpr.replace(/sqrt\(/g, 'Math.sqrt(')
  jsExpr = jsExpr.replace(/exp\(/g, 'Math.exp(')

  // 常量
  jsExpr = jsExpr.replace(/\bPI\b/g, 'Math.PI')
  jsExpr = jsExpr.replace(/\bE\b/g, 'Math.E')

  // 幂运算 ^ → **
  jsExpr = jsExpr.replace(/\^/g, '**')

  // 阶乘 n! → _fact(n)
  jsExpr = jsExpr.replace(/(\d+(?:\.\d+)?)!/g, '_fact($1)')
  jsExpr = jsExpr.replace(/\)!/g, (_match, offset, str) => {
    // 处理 )! 的情况：找到对应的左括号
    let count = 1
    let i = offset - 1
    while (i >= 0 && count > 0) {
      if (str[i] === ')') count++
      if (str[i] === '(') count--
      if (count === 0) break
      i--
    }
    return '_fact(' + str.slice(i, offset + 1) + ')'
  })

  return jsExpr
}

function calculate() {
  if (!expression.value.trim()) return
  errorMsg.value = ''

  try {
    const jsExpr = buildExpression(expression.value)
    // eslint-disable-next-line no-new-func
    const fn = new Function('_fact', 'Math', `return ${jsExpr}`)
    const value = fn(factorial, Math)

    if (typeof value !== 'number' || !isFinite(value)) {
      throw new Error('计算结果无效')
    }

    // 保留合适的小数位
    const formatted = Math.abs(value) < 1e-10
      ? value.toExponential(6)
      : Math.round(value * 1e10) / 1e10

    result.value = formatted as number

    // 添加到历史记录
    history.value.unshift({
      expression: expression.value,
      result: String(formatted),
    })
    if (history.value.length > 20) history.value.pop()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    errorMsg.value = '计算错误：' + msg
    result.value = null
  }
}

function useHistory(item: HistoryItem) {
  expression.value = item.expression
  result.value = Number(item.result)
}

function clearHistory() {
  history.value = []
}
</script>

<style scoped>
.scientific-calculator {
  max-width: 480px;
  margin: 0 auto;
}

.display {
  text-align: right;
  padding: 16px 20px;
}

.expression {
  font-size: 18px;
  color: #555;
  min-height: 28px;
  word-break: break-all;
  font-family: 'Fira Code', 'Consolas', monospace;
}

.dark .expression {
  color: #aaa;
}

.result {
  font-size: 32px;
  font-weight: 700;
  color: #36ad6a;
  margin-top: 4px;
  word-break: break-all;
  font-family: 'Fira Code', 'Consolas', monospace;
}

.dark .result {
  color: #63e2b7;
}

.keypad {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.key-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.key {
  height: 56px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  background: white;
  color: #333;
}

.key:hover {
  background: #f5f5f5;
  transform: translateY(-1px);
}

.key:active {
  transform: translateY(0);
}

.dark .key {
  background: #1e2a4a;
  border-color: #2a2a4a;
  color: #e0e0e0;
}

.dark .key:hover {
  background: #2a3a5a;
}

.key.num {
  font-size: 20px;
}

.key.func {
  background: #f0f9eb;
  color: #36ad6a;
}

.dark .key.func {
  background: #1a3a2a;
  color: #63e2b7;
}

.key.op {
  background: #ecf5ff;
  color: #409eff;
  font-size: 22px;
}

.dark .key.op {
  background: #1a2a4a;
  color: #66b1ff;
}

.key.sci {
  font-size: 14px;
  background: #fdf6ec;
  color: #e6a23c;
}

.dark .key.sci {
  background: #3a2a1a;
  color: #f0c78a;
}

.key.eq {
  background: #36ad6a;
  color: white;
  font-size: 24px;
}

.key.eq:hover {
  background: #2d9a5a;
}

.dark .key.eq {
  background: #63e2b7;
  color: #16213e;
}

.dark .key.eq:hover {
  background: #4ad6a3;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.history-list {
  max-height: 200px;
  overflow-y: auto;
}

.history-item {
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
}

.history-item:hover {
  background: #f5f5f5;
}

.dark .history-item:hover {
  background: #1e2a4a;
}

.history-expr {
  color: #888;
}

.history-result {
  color: #36ad6a;
  font-weight: 600;
}
</style>
