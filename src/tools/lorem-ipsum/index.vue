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
            <n-radio-button value="characters">字符</n-radio-button>
          </n-radio-group>
        </div>

        <div class="config-item">
          <label>数量：{{ count }}</label>
          <n-input-number v-model:value="count" :min="1" :max="1000" />
        </div>

        <div class="config-item">
          <label>语言</label>
          <n-radio-group v-model:value="language" size="small">
            <n-radio-button value="latin">Latin</n-radio-button>
            <n-radio-button value="chinese">中文</n-radio-button>
            <n-radio-button value="english">英文</n-radio-button>
          </n-radio-group>
        </div>
      </div>

      <div class="config-section mt-4">
        <div class="config-item">
          <n-checkbox v-model:checked="startWithLorem" :disabled="language !== 'latin'">
            以 "Lorem ipsum dolor sit amet..." 开头
          </n-checkbox>
        </div>
        <div class="config-item">
          <n-checkbox v-model:checked="wrapHtml">
            输出 HTML（段落用 &lt;p&gt; 包裹）
          </n-checkbox>
        </div>
      </div>

      <div class="toolbar mt-4">
        <n-space>
          <n-button type="primary" @click="generate">
            <template #icon>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2 7h7l-5.5 4 2 7-5.5-4-5.5 4 2-7L3 9h7z"/></svg>
            </template>
            生成
          </n-button>
          <n-button @click="copy" :disabled="!result">复制</n-button>
          <n-button @click="downloadTxt" :disabled="!result">下载 TXT</n-button>
          <n-button @click="downloadHtml" :disabled="!result">下载 HTML</n-button>
          <n-button @click="clear">清空</n-button>
        </n-space>
      </div>
    </div>

    <div class="card" v-if="result">
      <div class="flex justify-between mb-2 flex-wrap gap-2">
        <div class="pane-label">生成结果</div>
        <div class="text-xs text-gray-400">
          {{ wordCount }} 词 / {{ charCount }} 字符
        </div>
      </div>
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
type GenType = 'paragraphs' | 'sentences' | 'words' | 'characters'
type Language = 'latin' | 'chinese' | 'english'

const type = ref<GenType>('paragraphs')
const count = ref(3)
const startWithLorem = ref(true)
const wrapHtml = ref(false)
const language = ref<Language>('latin')
const result = ref('')
const statusMsg = ref('')
const statusType = ref<'info' | 'success' | 'warning' | 'error'>('info')

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
  'molestias', 'excepturi', 'occaecati', 'cupiditate', 'provident',
  'similique', 'mollitia', 'animi', 'dolores', 'ratione', 'sequi', 'nesciunt', 'maiores',
  'reprehenderit', 'voluptas', 'aspernatur', 'repellendus', 'necessitatibus',
]

const classicStart = 'lorem ipsum dolor sit amet, consectetur adipiscing elit'

const englishWords = [
  'the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog', 'and', 'runs',
  'through', 'green', 'fields', 'under', 'bright', 'blue', 'sky', 'while', 'birds',
  'sing', 'softly', 'trees', 'sway', 'gentle', 'breeze', 'sun', 'shines', 'warmly',
  'clouds', 'drift', 'slowly', 'across', 'horizon', 'river', 'flows', 'peacefully',
  'valley', 'flowers', 'bloom', 'vibrant', 'colors', 'children', 'laugh', 'play',
  'together', 'happy', 'afternoon', 'world', 'full', 'wonder', 'discovery', 'every',
  'day', 'brings', 'new', 'adventures', 'opportunities', 'learn', 'grow', 'explore',
]

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

const chineseChars = '的一是在不了有和人这中大为上个国我以要他时来用们生到作地于出就分对成会可主发年动同工也能下过子说产种面而方后多定行学法所民得经十三之进着等部度家电力里如水化高自二理起小物现实加量都两体制机当使点从业本去把性好应开它合还因由其些然前外天政四日那社义事平形相全表间样与关各重新线内数正心反你明看原又么利比或但质气第向道命此变条只没结解问意建月公无系军很情者最立代想已通并提直题党程展五果料象员革位入常文总次品式活设及管特件长求老头基资边流路级少图山统接知较将组见计别她手角期根论运农指几九区强放决西被干做必战先回则任取完举色或和写'

function getRandomWord(): string {
  const list = language.value === 'english' ? englishWords : latinWords
  return list[Math.floor(Math.random() * list.length)]
}

function getRandomChinese(): string {
  return chineseTexts[Math.floor(Math.random() * chineseTexts.length)]
}

function generateSentence(length: number = 8): string {
  if (language.value === 'chinese') {
    return getRandomChinese()
  }
  const words: string[] = []
  for (let i = 0; i < length; i++) {
    words.push(getRandomWord())
  }
  let sentence = words.join(' ')
  sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1)
  return sentence + '.'
}

function generateParagraph(): string {
  if (language.value === 'chinese') {
    const count = Math.floor(Math.random() * 3) + 3
    const sentences: string[] = []
    for (let i = 0; i < count; i++) {
      sentences.push(getRandomChinese())
    }
    return sentences.join('')
  }

  const sentenceCount = Math.floor(Math.random() * 4) + 5
  const sentences: string[] = []
  for (let i = 0; i < sentenceCount; i++) {
    const wordCount = Math.floor(Math.random() * 8) + 6
    sentences.push(generateSentence(wordCount))
  }
  return sentences.join(' ')
}

function generateCharacters(): string {
  if (language.value === 'chinese') {
    let chars = ''
    while (chars.length < count.value) {
      chars += chineseChars[Math.floor(Math.random() * chineseChars.length)]
    }
    return chars.slice(0, count.value)
  }
  let text = ''
  while (text.length < count.value) {
    text += getRandomWord() + ' '
  }
  return text.slice(0, count.value)
}

function generate() {
  statusMsg.value = ''
  let output = ''

  if (type.value === 'words') {
    const words: string[] = []
    for (let i = 0; i < count.value; i++) {
      words.push(language.value === 'chinese' ? chineseChars[Math.floor(Math.random() * chineseChars.length)] : getRandomWord())
    }
    output = words.join(language.value === 'chinese' ? '' : ' ')
  } else if (type.value === 'characters') {
    output = generateCharacters()
  } else if (type.value === 'sentences') {
    const sentences: string[] = []
    for (let i = 0; i < count.value; i++) {
      sentences.push(generateSentence())
    }
    output = sentences.join(language.value === 'chinese' ? '' : ' ')

    if (startWithLorem.value && language.value === 'latin') {
      output = classicStart + ', ' + output.charAt(0).toUpperCase() + output.slice(1)
    }
  } else {
    const paragraphs: string[] = []
    for (let i = 0; i < count.value; i++) {
      paragraphs.push(generateParagraph())
    }

    if (startWithLorem.value && language.value === 'latin') {
      const firstSentence = classicStart + '. '
      const rest = paragraphs[0].split('. ').slice(1).join('. ')
      paragraphs[0] = firstSentence + rest
    }

    output = paragraphs.join('\n\n')
  }

  result.value = output
  statusMsg.value = `已生成 ${count.value} 个${type.value === 'paragraphs' ? '段落' : type.value === 'sentences' ? '句子' : type.value === 'words' ? '单词' : '字符'}`
  statusType.value = 'success'
}

const wordCount = computed(() => {
  if (!result.value) return 0
  if (language.value === 'chinese') {
    return result.value.replace(/[^\u4e00-\u9fa5]/g, '').length
  }
  return result.value.trim().split(/\s+/).length
})

const charCount = computed(() => result.value.length)

const formattedResult = computed(() => {
  if (!result.value) return ''
  if (wrapHtml.value) {
    const paragraphs = result.value.split('\n\n').map(p => `<p>${escapeHtml(p)}</p>`)
    return paragraphs.join('')
  }
  return `<p style="white-space: pre-wrap;">${escapeHtml(result.value)}</p>`
})

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function copy() {
  navigator.clipboard.writeText(result.value)
  message.success('已复制到剪贴板')
}

function downloadTxt() {
  const blob = new Blob([result.value], { type: 'text/plain' })
  downloadBlob(blob, 'lorem-ipsum.txt')
}

function downloadHtml() {
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Lorem Ipsum</title>
<style>body { max-width: 800px; margin: 40px auto; line-height: 1.8; font-family: sans-serif; }</style>
</head>
<body>
${formattedResult.value}
</body>
</html>`
  const blob = new Blob([html], { type: 'text/html' })
  downloadBlob(blob, 'lorem-ipsum.html')
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
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
  align-items: flex-start;
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
  flex-wrap: wrap;
}
</style>
