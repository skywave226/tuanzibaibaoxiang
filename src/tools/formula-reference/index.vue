<template>
  <div class="tool-container formula-reference">
    <!-- 搜索框 -->
    <div class="search-bar">
      <n-input
        v-model:value="keyword"
        placeholder="搜索公式名称、内容或说明…"
        clearable
      >
        <template #prefix>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </template>
      </n-input>
    </div>

    <!-- 分类选择 -->
    <div class="category-bar">
      <n-select
        v-model:value="activeCategory"
        :options="categoryOptions"
        style="width: 200px"
      />
      <span class="count-tip">共 {{ filteredFormulas.length }} 条公式</span>
    </div>

    <!-- 公式列表 -->
    <div v-if="filteredFormulas.length === 0" class="empty-tip">
      未找到匹配的公式
    </div>

    <div v-else class="formula-list">
      <div v-for="(item, idx) in filteredFormulas" :key="idx" class="formula-item">
        <div class="formula-head" @click="toggleExpand(idx)">
          <span class="formula-name">{{ item.name }}</span>
          <span class="formula-cat-tag">{{ item.category }}</span>
          <span class="expand-icon" :class="{ open: expanded.has(idx) }">▾</span>
        </div>
        <div class="formula-expr">{{ item.formula }}</div>
        <transition name="expand">
          <div v-if="expanded.has(idx)" class="formula-detail">
            <div v-if="item.description" class="detail-row">
              <span class="detail-label">说明：</span>{{ item.description }}
            </div>
            <div v-if="item.variables && item.variables.length" class="detail-row">
              <div class="detail-label">变量：</div>
              <ul class="var-list">
                <li v-for="(v, i) in item.variables" :key="i">
                  <code>{{ v.symbol }}</code> — {{ v.meaning }}
                </li>
              </ul>
            </div>
            <div v-if="item.example" class="detail-row">
              <span class="detail-label">示例：</span>{{ item.example }}
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NInput, NSelect } from 'naive-ui'

interface Variable {
  symbol: string
  meaning: string
}

interface Formula {
  name: string
  category: string
  formula: string
  description?: string
  variables?: Variable[]
  example?: string
}

const keyword = ref('')
const activeCategory = ref('全部')
const expanded = ref<Set<number>>(new Set())

const formulas: Formula[] = [
  // —— 数学 · 代数 ——
  {
    name: '一元二次方程求根公式',
    category: '数学·代数',
    formula: 'x = ( -b ± √(b² - 4ac) ) / (2a)',
    description: '适用于 ax² + bx + c = 0 (a≠0)。判别式 Δ = b² - 4ac 决定根的情况：Δ>0 两不等实根，Δ=0 两相等实根，Δ<0 无实根。',
    variables: [
      { symbol: 'a, b, c', meaning: '二次项、一次项、常数项系数' },
      { symbol: 'Δ = b²-4ac', meaning: '判别式' },
    ],
    example: 'x² - 5x + 6 = 0 → x = 2 或 x = 3',
  },
  {
    name: '韦达定理',
    category: '数学·代数',
    formula: 'x₁ + x₂ = -b/a，x₁ · x₂ = c/a',
    description: '一元二次方程两根之和与两根之积，无需解出根即可了解根的特征。',
    variables: [
      { symbol: 'x₁, x₂', meaning: '方程的两个根' },
    ],
  },
  {
    name: '完全平方公式',
    category: '数学·代数',
    formula: '(a ± b)² = a² ± 2ab + b²',
    description: '展开二项式平方的常用公式。',
    example: '(x+3)² = x² + 6x + 9',
  },
  {
    name: '平方差公式',
    category: '数学·代数',
    formula: 'a² - b² = (a + b)(a - b)',
    description: '两数平方差等于两数和与差的积，常用于因式分解。',
  },
  {
    name: '等差数列通项',
    category: '数学·代数',
    formula: 'aₙ = a₁ + (n - 1) d',
    description: '等差数列第 n 项的通项公式。',
    variables: [
      { symbol: 'a₁', meaning: '首项' },
      { symbol: 'd', meaning: '公差' },
      { symbol: 'n', meaning: '项数' },
    ],
    example: '1, 3, 5, … 第 10 项为 19',
  },
  {
    name: '等差数列求和',
    category: '数学·代数',
    formula: 'Sₙ = n(a₁ + aₙ) / 2 = n·a₁ + n(n-1)d/2',
    description: '等差数列前 n 项之和。',
    variables: [
      { symbol: 'aₙ', meaning: '第 n 项' },
    ],
  },
  {
    name: '等比数列通项',
    category: '数学·代数',
    formula: 'aₙ = a₁ · qⁿ⁻¹',
    description: '等比数列第 n 项的通项公式。',
    variables: [
      { symbol: 'q', meaning: '公比（q≠0）' },
    ],
  },
  {
    name: '等比数列求和',
    category: '数学·代数',
    formula: 'Sₙ = a₁(1 - qⁿ) / (1 - q)  (q≠1)',
    description: '等比数列前 n 项之和；当 q=1 时 Sₙ = n·a₁。',
  },
  {
    name: '对数换底公式',
    category: '数学·代数',
    formula: 'logₐ b = log_c b / log_c a',
    description: '将任意底的对数换为常用底（如 lg 或 ln）。',
    example: 'log₂ 8 = lg 8 / lg 2 = 3',
  },
  {
    name: '二项式定理',
    category: '数学·代数',
    formula: '(a + b)ⁿ = Σ C(n,k) aⁿ⁻ᵏ bᵏ，k=0..n',
    description: '展开二项式 n 次方的通用公式。',
    variables: [
      { symbol: 'C(n,k) = n!/(k!(n-k)!)', meaning: '二项式系数' },
    ],
  },

  // —— 数学 · 几何 ——
  {
    name: '三角形面积',
    category: '数学·几何',
    formula: 'S = ½ · a · h = ½ · a · b · sin C',
    description: '底乘高除二；或两边及其夹角求面积。',
    variables: [
      { symbol: 'a', meaning: '底边长' },
      { symbol: 'h', meaning: '对应高' },
      { symbol: 'C', meaning: '两边夹角' },
    ],
    example: '底 6 高 4 → S = 12',
  },
  {
    name: '海伦公式',
    category: '数学·几何',
    formula: 'S = √( p(p-a)(p-b)(p-c) )，p=(a+b+c)/2',
    description: '已知三边求三角形面积。',
    variables: [
      { symbol: 'p', meaning: '半周长' },
      { symbol: 'a, b, c', meaning: '三边长' },
    ],
  },
  {
    name: '圆面积与周长',
    category: '数学·几何',
    formula: 'S = π r²，C = 2π r',
    description: '圆的面积与周长公式。',
    variables: [
      { symbol: 'r', meaning: '半径' },
      { symbol: 'π', meaning: '圆周率 ≈ 3.14159' },
    ],
    example: 'r=2 → S≈12.566，C≈12.566',
  },
  {
    name: '扇形面积',
    category: '数学·几何',
    formula: 'S = ½ r² θ (弧度制) = nπ r²/360 (度)',
    description: '圆心角对应的扇形面积。',
    variables: [
      { symbol: 'θ', meaning: '圆心角（弧度）' },
      { symbol: 'n', meaning: '圆心角度数' },
    ],
  },
  {
    name: '球体积与表面积',
    category: '数学·几何',
    formula: 'V = 4/3 π r³，S = 4π r²',
    description: '球的体积与表面积。',
    variables: [
      { symbol: 'r', meaning: '球半径' },
    ],
  },
  {
    name: '圆柱体积与侧面积',
    category: '数学·几何',
    formula: 'V = π r² h，S侧 = 2π r h',
    description: '圆柱的体积与侧面积。',
    variables: [
      { symbol: 'r', meaning: '底面半径' },
      { symbol: 'h', meaning: '高' },
    ],
  },
  {
    name: '圆锥体积',
    category: '数学·几何',
    formula: 'V = 1/3 π r² h',
    description: '同底等高圆柱体积的三分之一。',
  },
  {
    name: '勾股定理',
    category: '数学·几何',
    formula: 'a² + b² = c²',
    description: '直角三角形两直角边平方和等于斜边平方。',
    variables: [
      { symbol: 'a, b', meaning: '两直角边' },
      { symbol: 'c', meaning: '斜边' },
    ],
    example: '3² + 4² = 5²',
  },

  // —— 数学 · 三角 ——
  {
    name: '正弦定理',
    category: '数学·三角',
    formula: 'a/sin A = b/sin B = c/sin C = 2R',
    description: '三角形边与对角正弦的关系。',
    variables: [
      { symbol: 'R', meaning: '外接圆半径' },
    ],
  },
  {
    name: '余弦定理',
    category: '数学·三角',
    formula: 'c² = a² + b² - 2ab cos C',
    description: '已知两边及夹角求第三边。',
    variables: [
      { symbol: 'C', meaning: 'a、b 两边夹角' },
    ],
  },
  {
    name: '和角公式',
    category: '数学·三角',
    formula: 'sin(A±B) = sinA cosB ± cosA sinB；cos(A±B) = cosA cosB ∓ sinA sinB',
    description: '两角和差的正弦、余弦公式。',
  },
  {
    name: '二倍角公式',
    category: '数学·三角',
    formula: 'sin 2α = 2 sin α cos α；cos 2α = cos²α - sin²α',
    description: '常用倍角变换。',
  },
  {
    name: '同角基本关系',
    category: '数学·三角',
    formula: 'sin²θ + cos²θ = 1；tan θ = sin θ / cos θ',
    description: '同一角度的正余弦平方和与商关系。',
  },

  // —— 数学 · 微积分 ——
  {
    name: '导数定义',
    category: '数学·微积分',
    formula: "f'(x) = lim(Δx→0) [ f(x+Δx) - f(x) ] / Δx",
    description: '函数在某点的瞬时变化率，几何上为切线斜率。',
  },
  {
    name: '幂函数导数',
    category: '数学·微积分',
    formula: "(xⁿ)' = n·xⁿ⁻¹",
    description: '幂函数的求导法则，n 为任意实数。',
    example: "(x³)' = 3x²",
  },
  {
    name: '导数四则运算',
    category: '数学·微积分',
    formula: "(u±v)' = u'±v'；(uv)' = u'v+uv'；(u/v)' = (u'v-uv')/v²",
    description: '和差积商的求导法则。',
  },
  {
    name: '链式法则',
    category: '数学·微积分',
    formula: "d/dx f(g(x)) = f'(g(x)) · g'(x)",
    description: '复合函数求导法则。',
  },
  {
    name: '基本积分',
    category: '数学·微积分',
    formula: '∫ xⁿ dx = xⁿ⁺¹/(n+1) + C (n≠-1)；∫ 1/x dx = ln|x| + C',
    description: '幂函数不定积分。C 为积分常数。',
  },
  {
    name: '牛顿-莱布尼茨公式',
    category: '数学·微积分',
    formula: '∫ₐᵇ f(x) dx = F(b) - F(a)',
    description: '联系定积分与不定积分，F 为 f 的原函数。',
    variables: [
      { symbol: 'a, b', meaning: '积分下限与上限' },
    ],
  },

  // —— 物理 · 力学 ——
  {
    name: '牛顿第二定律',
    category: '物理·力学',
    formula: 'F = m a',
    description: '力等于质量乘加速度，单位牛顿(N)。',
    variables: [
      { symbol: 'F', meaning: '合外力 (N)' },
      { symbol: 'm', meaning: '质量 (kg)' },
      { symbol: 'a', meaning: '加速度 (m/s²)' },
    ],
    example: 'm=2kg, a=3m/s² → F=6N',
  },
  {
    name: '动能',
    category: '物理·力学',
    formula: 'Eₖ = ½ m v²',
    description: '物体由于运动而具有的能量，单位焦耳(J)。',
    variables: [
      { symbol: 'v', meaning: '速度 (m/s)' },
    ],
  },
  {
    name: '重力势能',
    category: '物理·力学',
    formula: 'Eₚ = m g h',
    description: '物体相对参考面的势能。',
    variables: [
      { symbol: 'g', meaning: '重力加速度 ≈ 9.8 m/s²' },
      { symbol: 'h', meaning: '高度 (m)' },
    ],
  },
  {
    name: '动量',
    category: '物理·力学',
    formula: 'p = m v',
    description: '动量等于质量乘速度，方向与速度相同，单位 kg·m/s。',
  },
  {
    name: '动量守恒',
    category: '物理·力学',
    formula: 'm₁v₁ + m₂v₂ = m₁v₁′ + m₂v₂′',
    description: '系统不受外力（或合外力为零）时总动量守恒。',
  },
  {
    name: '胡克定律',
    category: '物理·力学',
    formula: 'F = k x',
    description: '弹簧弹力与形变量成正比。',
    variables: [
      { symbol: 'k', meaning: '劲度系数 (N/m)' },
      { symbol: 'x', meaning: '形变量 (m)' },
    ],
  },
  {
    name: '万有引力',
    category: '物理·力学',
    formula: 'F = G m₁m₂ / r²',
    description: '两质点间的万有引力。',
    variables: [
      { symbol: 'G', meaning: '引力常数 ≈ 6.674×10⁻¹¹ N·m²/kg²' },
      { symbol: 'r', meaning: '两质点距离' },
    ],
  },
  {
    name: '功',
    category: '物理·力学',
    formula: 'W = F s cosθ',
    description: '力沿位移方向的分量乘位移，单位焦耳(J)。',
    variables: [
      { symbol: 'θ', meaning: '力与位移的夹角' },
    ],
  },

  // —— 物理 · 电磁 ——
  {
    name: '欧姆定律',
    category: '物理·电学',
    formula: 'U = I R',
    description: '电压等于电流乘电阻。',
    variables: [
      { symbol: 'U', meaning: '电压 (V)' },
      { symbol: 'I', meaning: '电流 (A)' },
      { symbol: 'R', meaning: '电阻 (Ω)' },
    ],
    example: 'I=2A, R=3Ω → U=6V',
  },
  {
    name: '电功率',
    category: '物理·电学',
    formula: 'P = U I = I² R = U²/R',
    description: '单位时间内电流做的功，单位瓦特(W)。',
  },
  {
    name: '焦耳定律',
    category: '物理·电学',
    formula: 'Q = I² R t',
    description: '电流通过电阻产生的热量。',
    variables: [
      { symbol: 't', meaning: '通电时间 (s)' },
    ],
  },
  {
    name: '库仑定律',
    category: '物理·电学',
    formula: 'F = k q₁q₂ / r²',
    description: '真空中两个点电荷间的静电力。',
    variables: [
      { symbol: 'k', meaning: '静电力常量 ≈ 9×10⁹ N·m²/C²' },
      { symbol: 'q₁, q₂', meaning: '电荷量 (C)' },
    ],
  },
  {
    name: '法拉第电磁感应',
    category: '物理·电学',
    formula: 'E = -n ΔΦ/Δt',
    description: '感应电动势等于磁通量变化率，负号为楞次定律。',
    variables: [
      { symbol: 'n', meaning: '线圈匝数' },
      { symbol: 'Φ', meaning: '磁通量 (Wb)' },
    ],
  },

  // —— 物理 · 热学 ——
  {
    name: '理想气体状态方程',
    category: '物理·热学',
    formula: 'P V = n R T',
    description: '理想气体的状态关系。',
    variables: [
      { symbol: 'P', meaning: '压强 (Pa)' },
      { symbol: 'V', meaning: '体积 (m³)' },
      { symbol: 'n', meaning: '物质的量 (mol)' },
      { symbol: 'R', meaning: '气体常数 ≈ 8.314 J/(mol·K)' },
      { symbol: 'T', meaning: '热力学温度 (K)' },
    ],
  },
  {
    name: '热力学第一定律',
    category: '物理·热学',
    formula: 'ΔU = Q + W',
    description: '内能变化等于吸热与做功之和（符号约定：吸热 Q>0，外界对系统做功 W>0）。',
    variables: [
      { symbol: 'ΔU', meaning: '内能变化 (J)' },
      { symbol: 'Q', meaning: '热量 (J)' },
      { symbol: 'W', meaning: '做功 (J)' },
    ],
  },
  {
    name: '比热容',
    category: '物理·热学',
    formula: 'Q = c m ΔT',
    description: '物质升温吸收的热量。',
    variables: [
      { symbol: 'c', meaning: '比热容 J/(kg·K)' },
      { symbol: 'ΔT', meaning: '温度变化 (K)' },
    ],
    example: '水 c=4200 J/(kg·K)',
  },
]

const categoryOptions = computed(() => {
  const set = new Set<string>(['全部'])
  formulas.forEach(f => set.add(f.category))
  return [...set].map(c => ({ label: c, value: c }))
})

const filteredFormulas = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return formulas.filter(f => {
    const matchCat = activeCategory.value === '全部' || f.category === activeCategory.value
    if (!matchCat) return false
    if (!kw) return true
    return (
      f.name.toLowerCase().includes(kw) ||
      f.formula.toLowerCase().includes(kw) ||
      (f.description || '').toLowerCase().includes(kw) ||
      f.category.toLowerCase().includes(kw)
    )
  })
})

function toggleExpand(idx: number): void {
  const next = new Set(expanded.value)
  if (next.has(idx)) next.delete(idx)
  else next.add(idx)
  expanded.value = next
}
</script>

<style scoped>
.formula-reference {
  padding: 16px 0;
}

.search-bar {
  margin-bottom: 12px;
}

.category-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.count-tip {
  font-size: 13px;
  color: #999;
}

.empty-tip {
  padding: 40px;
  text-align: center;
  color: #999;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
}

.formula-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.formula-item {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.formula-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
}

.formula-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  flex: 1;
}

.formula-cat-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  background: #f0f7ff;
  color: #2080f0;
}

.expand-icon {
  font-size: 14px;
  color: #999;
  transition: transform 0.2s;
}

.expand-icon.open {
  transform: rotate(180deg);
}

.formula-expr {
  padding: 0 16px 12px;
  font-family: 'Cambria Math', 'Times New Roman', serif;
  font-size: 18px;
  color: #d03050;
  letter-spacing: 0.5px;
  word-break: break-word;
}

.formula-detail {
  padding: 12px 16px;
  border-top: 1px dashed #e8e8e8;
  background: #fafafa;
}

.detail-row {
  font-size: 14px;
  color: #555;
  line-height: 1.8;
}

.detail-row + .detail-row {
  margin-top: 6px;
}

.detail-label {
  font-weight: 600;
  color: #333;
}

.var-list {
  margin: 4px 0 0;
  padding-left: 20px;
}

.var-list li {
  line-height: 1.8;
}

.var-list code {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 3px;
  background: #eef3ff;
  color: #2080f0;
  font-family: 'Cambria Math', Consolas, monospace;
  font-size: 13px;
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 400px;
  opacity: 1;
}

/* 深色模式 */
.dark .count-tip {
  color: #777;
}

.dark .empty-tip {
  color: #777;
  border-color: #2a2a4a;
}

.dark .formula-item {
  background: #181828;
  border-color: #2a2a4a;
}

.dark .formula-name {
  color: #e0e0e0;
}

.dark .formula-cat-tag {
  background: #1c2a4a;
  color: #5b9bf5;
}

.dark .expand-icon {
  color: #777;
}

.dark .formula-expr {
  color: #ff7a8a;
}

.dark .formula-detail {
  background: #141422;
  border-color: #2a2a4a;
}

.dark .detail-row {
  color: #bbb;
}

.dark .detail-label {
  color: #e0e0e0;
}

.dark .var-list code {
  background: #1c2a4a;
  color: #5b9bf5;
}
</style>
