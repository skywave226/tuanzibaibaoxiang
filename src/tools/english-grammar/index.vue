<template>
  <div class="english-grammar">
    <n-input
      v-model:value="searchQuery"
      placeholder="搜索语法点，如：时态、从句、介词..."
      clearable
      class="search-input"
    />

    <n-collapse v-if="filteredGroups.length > 0" display-directive="show" :default-expanded-names="['tenses']">
      <n-collapse-item
        v-for="group in filteredGroups"
        :key="group.key"
        :name="group.key"
        :title="group.title"
      >
        <n-list hoverable clickable>
          <n-list-item v-for="item in group.items" :key="item.title">
            <n-thing :title="item.title" :description="item.desc" />
            <n-code v-if="item.example" :code="item.example" language="plain" class="example-code" />
          </n-list-item>
        </n-list>
      </n-collapse-item>
    </n-collapse>

    <n-empty v-else description="未找到相关语法点" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NCollapse, NCollapseItem, NInput, NList, NListItem, NThing, NCode, NEmpty } from 'naive-ui'

interface GrammarItem {
  title: string
  desc: string
  example?: string
}

interface GrammarGroup {
  key: string
  title: string
  items: GrammarItem[]
}

const searchQuery = ref('')

const groups: GrammarGroup[] = [
  {
    key: 'tenses',
    title: '英语时态',
    items: [
      { title: '一般现在时', desc: '表示经常性、习惯性的动作或客观事实。', example: 'I play football every day.\nThe sun rises in the east.' },
      { title: '一般过去时', desc: '表示过去发生的动作或状态。', example: 'She visited Paris last year.\nI was a student ten years ago.' },
      { title: '一般将来时', desc: '表示将来要发生的动作或状态。', example: 'I will call you tomorrow.\nWe are going to have a meeting.' },
      { title: '现在进行时', desc: '表示此刻或现阶段正在进行的动作。', example: 'He is reading a book now.\nThey are working on a new project this month.' },
      { title: '过去进行时', desc: '表示过去某一时刻正在进行的动作。', example: 'I was watching TV at 8 o\'clock last night.' },
      { title: '现在完成时', desc: '表示过去发生并对现在有影响的动作。', example: 'I have lost my key.\nShe has lived here for ten years.' },
      { title: '过去完成时', desc: '表示过去某一时间之前已经完成的动作。', example: 'By the time I arrived, the train had left.' },
    ],
  },
  {
    key: 'sentences',
    title: '基本句型',
    items: [
      { title: '主语 + 谓语', desc: 'S + V，主语执行动作。', example: 'The baby cried.' },
      { title: '主语 + 系动词 + 表语', desc: 'S + V + P，说明主语的状态或特征。', example: 'She is happy.\nThe flower smells sweet.' },
      { title: '主语 + 谓语 + 宾语', desc: 'S + V + O，动作作用于宾语。', example: 'I love music.\nHe bought a new car.' },
      { title: '主语 + 谓语 + 间接宾语 + 直接宾语', desc: 'S + V + IO + DO，表示给予。', example: 'She gave me a gift.\nHe told us a story.' },
      { title: '主语 + 谓语 + 宾语 + 宾补', desc: 'S + V + O + C，补充说明宾语。', example: 'We elected him monitor.\nI found the book interesting.' },
    ],
  },
  {
    key: 'clauses',
    title: '从句',
    items: [
      { title: '名词性从句', desc: '在句中充当主语、宾语、表语或同位语。', example: 'What he said is true.\nI believe that he will come.' },
      { title: '定语从句', desc: '修饰名词或代词，常用 that, which, who 引导。', example: 'The man who is talking is my teacher.\nThis is the book that I bought yesterday.' },
      { title: '状语从句', desc: '在句中作状语，表示时间、原因、条件等。', example: 'If it rains, we will stay at home.\nI was reading when he came in.' },
    ],
  },
  {
    key: 'parts',
    title: '词性',
    items: [
      { title: '名词 (Noun)', desc: '表示人、事物、地点或抽象概念。', example: 'book, teacher, love, Beijing' },
      { title: '动词 (Verb)', desc: '表示动作或状态。', example: 'run, eat, be, have' },
      { title: '形容词 (Adjective)', desc: '修饰名词，表示性质或特征。', example: 'beautiful, tall, happy' },
      { title: '副词 (Adverb)', desc: '修饰动词、形容词或其他副词。', example: 'quickly, very, always' },
      { title: '介词 (Preposition)', desc: '表示名词与其他词之间的关系。', example: 'in, on, at, under, between' },
      { title: '代词 (Pronoun)', desc: '代替名词或名词短语。', example: 'I, you, he, she, it, they' },
      { title: '连词 (Conjunction)', desc: '连接词、短语或句子。', example: 'and, but, because, if' },
    ],
  },
  {
    key: 'voice',
    title: '语态',
    items: [
      { title: '主动语态', desc: '主语是动作的执行者。', example: 'Tom wrote a letter.' },
      { title: '被动语态', desc: '主语是动作的承受者，结构为 be + 过去分词。', example: 'A letter was written by Tom.\nThe window has been broken.' },
    ],
  },
]

const filteredGroups = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return groups
  return groups
    .map(g => ({
      ...g,
      items: g.items.filter(
        i =>
          i.title.toLowerCase().includes(q) ||
          i.desc.toLowerCase().includes(q) ||
          (i.example && i.example.toLowerCase().includes(q))
      ),
    }))
    .filter(g => g.items.length > 0)
})
</script>

<style scoped>
.english-grammar {
  max-width: 900px;
  margin: 0 auto;
}

.search-input {
  margin-bottom: 16px;
}

.example-code {
  margin-top: 8px;
  background: #f5f7fa;
  border-radius: 4px;
}

.dark .example-code {
  background: rgba(255, 255, 255, 0.05);
}
</style>
