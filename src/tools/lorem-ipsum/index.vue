<template>
  <div class="lorem-ipsum">
    <div class="card mb-4">
      <h3 class="text-sm font-bold mb-3">生成设置</h3>

      <div class="config-section">
        <div class="config-item">
          <label>类型</label>
          <n-radio-group v-model:value="type" size="small">
            <n-radio-button value="paragraphs">段落</n-radio-button>
            <n-radio-button value="sentences">句子</n-radio-button>
            <n-radio-button value="words">单词</n-radio-button>
          </n-radio-group>
        </div>

        <div class="config-item">
          <label>数量：{{ count }}</label>
          <n-input-number v-model:value="count" :min="1" :max="100" />
        </div>
      </div>

      <div class="config-section mt-4">
        <div class="config-item">
          <n-checkbox v-model:checked="startWithLorem">
            以 "Lorem ipsum dolor sit amet..." 开头
          </n-checkbox>
        </div>
        <div class="config-item">
          <n-checkbox v-model:checked="useChinese">
            生成中文占位文本（随机诗词片段）
          </n-checkbox>
        </div>
      </div>

      <div class="toolbar mt-4">
        <n-space>
          <n-button type="primary" @click="generate">
            <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2 7h7l-5.5 4 2 7-5.5-4-5.5 4 2-7L3 9h7z"/></svg></span>
            生成
          </n-button>
          <n-button @click="copy" :disabled="!result">复制</n-button>
          <n-button @click="clear">清空</n-button>
        </n-space>
      </div>
    </div>

    <div class="card" v-if="result">
      <div class="pane-label mb-2">生成结果</div>
      <div class="result-text" v-html="formattedResult"></div>
    </div>

    <div class="card mt-4" v-else>
      <n-empty description="配置选项后点击生成按钮" />
    </div>

    <n-alert
      :type="statusType"
      v-if="statusMsg"
      class="mt-4"
      closable
      @close="statusMsg = ''"
    >
      {{ statusMsg }}
    </n-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NButton, NSpace, NInputNumber, NRadioGroup, NRadioButton, NCheckbox, NEmpty, NAlert } from 'naive-ui'
import { useMessage } from 'naive-ui'

const message = useMessage()
const type = ref<'paragraphs' | 'sentences' | 'words'>('paragraphs')
const count = ref(3)
const startWithLorem = ref(true)
const useChinese = ref(false)
const result = ref('')
const statusMsg = ref('')
const statusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

// Latin 词汇库
const latinWords = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
  'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
  'velit', 'esse', 'cillum', 'eu', 'fugiat', 'nulla', 'pariatur', 'excepteur',
  'sint', 'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui',
  'officia', 'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum', 'at', 'vero',
  'eos', 'accusamus', 'iusto', 'odio', 'dignissimos', 'ducimus', 'blanditiis',
  'praesentium', 'voluptatum', 'deleniti', 'atque', 'corrupti', 'quos', 'quas',
  'molestias', 'excepturi', 'sint', 'occaecati', 'cupiditate', 'non', 'provident',
  'similique', 'mollitia', 'animi', 'dolores', 'ratione', 'sequi', 'nesciunt', 'maiores',
  'reprehenderit', 'voluptas', 'aspernatur', 'repellendus', 'necessitatibus',
]

// 经典开头
const classicStart = 'lorem ipsum dolor sit amet, consectetur adipiscing elit'

// 中文占位文本（古典文学片段）
const chineseTexts = [
  '床前明月光，疑是地上霜。举头望明月，低头思故乡。',
  '春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。',
  '白日依山尽，黄河入海流。欲穷千里目，更上一层楼。',
  '红豆生南国，春来发几枝。愿君多采撷，此物最相思。',
  '独在异乡为异客，每逢佳节倍思亲。遥知兄弟登高处，遍插茱萸少一人。',
  '君自故乡来，应知故乡事。来日绮窗前，寒梅著花未。',
  '空山新雨后，天气晚来秋。明月松间照，清泉石上流。',
  '大漠孤烟直，长河落日圆。萧关逢候骑，都护在燕然。',
  '海内存知己，天涯若比邻。无为在歧路，儿女共沾巾。',
  '渭城朝雨浥轻尘，客舍青青柳色新。劝君更尽一杯酒，西出阳关无故人。',
  '千山鸟飞绝，万径人踪灭。孤舟蓑笠翁，独钓寒江雪。',
  '李白乘舟将欲行，忽闻岸上踏歌声。桃花潭水深千尺，不及汪伦送我情。',
  '故人西辞黄鹤楼，烟花三月下扬州。孤帆远影碧空尽，唯见长江天际流。',
  '黄河远上白云间，一片孤城万仞山。羌笛何须怨杨柳，春风不度玉门关。',
  '秦时明月汉时关，万里长征人未还。但使龙城飞将在，不教胡马度阴山。',
  '葡萄美酒夜光杯，欲饮琵琶马上催。醉卧沙场君莫笑，古来征战几人回。',
  '两个黄鹂鸣翠柳，一行白鹭上青天。窗含西岭千秋雪，门泊东吴万里船。',
  '岐王宅里寻常见，崔九堂前几度闻。正是江南好风景，落花时节又逢君。',
  '远上寒山石径斜，白云生处有人家。停车坐爱枫林晚，霜叶红于二月花。',
  '烟笼寒水月笼沙，夜泊秦淮近酒家。商女不知亡国恨，隔江犹唱后庭花。',
]

function getRandomWord(): string {
  return latinWords[Math.floor(Math.random() * latinWords.length)]
}

function getRandomChinese(): string {
  return chineseTexts[Math.floor(Math.random() * chineseTexts.length)]
}

function generateSentence(length: number = 8): string {
  if (useChinese.value) {
    return getRandomChinese()
  }
  const words: string[] = []
  for (let i = 0; i < length; i++) {
    words.push(getRandomWord())
  }
  let sentence = words.join(' ')
  // 首字母大写
  sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1)
  return sentence + '.'
}

function generateParagraph(): string {
  if (useChinese.value) {
    // 中文段落：3-5 个诗句片段
    const count = Math.floor(Math.random() * 3) + 3
    const sentences: string[] = []
    for (let i = 0; i < count; i++) {
      sentences.push(getRandomChinese())
    }
    return sentences.join('')
  }

  // 英文段落：5-8 个句子
  const sentenceCount = Math.floor(Math.random() * 4) + 5
  const sentences: string[] = []
  for (let i = 0; i < sentenceCount; i++) {
    const wordCount = Math.floor(Math.random() * 8) + 6
    sentences.push(generateSentence(wordCount))
  }
  return sentences.join(' ')
}

function generate() {
  statusMsg.value = ''
  let output = ''

  if (type.value === 'words') {
    if (useChinese.value) {
      // 中文按字数
      const chars: string[] = []
      for (let i = 0; i < count.value; i++) {
        const poem = getRandomChinese()
        chars.push(poem[Math.floor(Math.random() * poem.length)])
      }
      output = chars.join('')
    } else {
      const words: string[] = []
      for (let i = 0; i < count.value; i++) {
        words.push(getRandomWord())
      }
      output = words.join(' ')
    }
  } else if (type.value === 'sentences') {
    const sentences: string[] = []
    for (let i = 0; i < count.value; i++) {
      sentences.push(generateSentence())
    }
    output = sentences.join(' ')

    // 经典开头
    if (startWithLorem.value && !useChinese.value) {
      output = classicStart + ', ' + output.charAt(0).toUpperCase() + output.slice(1)
    }
  } else {
    // 段落
    const paragraphs: string[] = []
    for (let i = 0; i < count.value; i++) {
      paragraphs.push(generateParagraph())
    }

    // 经典开头（仅作用于第一段）
    if (startWithLorem.value && !useChinese.value) {
      const firstSentence = classicStart + '. '
      const rest = paragraphs[0].split('. ').slice(1).join('. ')
      paragraphs[0] = firstSentence + rest
    }

    output = paragraphs.join('\n\n')
  }

  result.value = output
  statusMsg.value = `已生成 ${count.value} 个${type.value === 'paragraphs' ? '段落' : type.value === 'sentences' ? '句子' : '单词'}`
  statusType.value = 'success'
}

// 格式化输出（段落用 <p> 包裹）
const formattedResult = computed(() => {
  if (!result.value) return ''
  if (type.value !== 'paragraphs') {
    return `<p>${escapeHtml(result.value)}</p>`
  }
  const paragraphs = result.value.split('\n\n').map(p => `<p>${escapeHtml(p)}</p>`)
  return paragraphs.join('')
})

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function copy() {
  navigator.clipboard.writeText(result.value)
  message.success('已复制到剪贴板')
}

function clear() {
  result.value = ''
  statusMsg.value = ''
}
</script>

<style scoped>
.lorem-ipsum {
  max-width: 900px;
  margin: 0 auto;
}

.config-section {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  align-items: center;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-item label {
  font-size: 13px;
  font-weight: 500;
  color: #555;
}

.dark .config-item label {
  color: #aaa;
}

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
}

.result-text {
  line-height: 1.8;
  color: #333;
}

.result-text :deep(p) {
  margin-bottom: 16px;
}

.result-text :deep(p:last-child) {
  margin-bottom: 0;
}

.dark .result-text {
  color: #e0e0e0;
}

.toolbar {
  display: flex;
  gap: 12px;
}
</style>
