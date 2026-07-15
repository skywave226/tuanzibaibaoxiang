<template>
  <div class="grammar-reference">
    <!-- 搜索框 -->
    <div class="search-bar">
      <n-input
        v-model:value="keyword"
        placeholder="搜索语法点、规则或例句…"
        clearable
      >
        <template #prefix>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </template>
      </n-input>
    </div>

    <!-- 分类标签页 -->
    <n-tabs v-model:value="activeTab" type="line" animated>
      <n-tab-pane
        v-for="cat in categories"
        :key="cat.name"
        :name="cat.name"
        :tab="`${cat.name} (${cat.items.length})`"
      >
        <div v-if="filteredItems(cat).length === 0" class="empty-tip">
          未找到匹配的语法点
        </div>
        <div v-else class="grammar-list">
          <div v-for="(item, idx) in filteredItems(cat)" :key="idx" class="grammar-item">
            <div class="grammar-head">
              <span class="grammar-name">{{ item.name }}</span>
              <span v-if="item.structure" class="grammar-structure">{{ item.structure }}</span>
            </div>
            <div class="grammar-rule">{{ item.rule }}</div>
            <div class="grammar-examples">
              <div v-for="(ex, i) in item.examples" :key="i" class="example-row">
                <span class="ex-icon">例</span>
                <span class="ex-text">{{ ex }}</span>
              </div>
            </div>
          </div>
        </div>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NInput, NTabs, NTabPane } from 'naive-ui'

interface GrammarPoint {
  name: string
  structure: string
  rule: string
  examples: string[]
}

interface Category {
  name: string
  items: GrammarPoint[]
}

const keyword = ref('')
const activeTab = ref('时态')

const categories: Category[] = [
  {
    name: '时态',
    items: [
      {
        name: '一般现在时',
        structure: '主语 + 动词原形 / 第三人称单数 (V-s/es)',
        rule: '表示经常发生的动作或存在的状态、客观真理、习惯等。第三人称单数作主语时动词加 -s/-es。',
        examples: [
          'He goes to school every day. (他每天去上学。)',
          'The sun rises in the east. (太阳从东方升起。)',
          'Water boils at 100°C. (水在100℃沸腾。)',
        ],
      },
      {
        name: '一般过去时',
        structure: '主语 + 动词过去式 (V-ed)',
        rule: '表示在过去某个时间发生的动作或存在的状态。规则动词加 -ed，不规则动词需单独记忆。',
        examples: [
          'I visited my grandmother last weekend. (上周末我去看望了奶奶。)',
          'She bought a new car yesterday. (她昨天买了一辆新车。)',
          'They did not come to the party. (他们没来参加聚会。)',
        ],
      },
      {
        name: '一般将来时',
        structure: '主语 + will/shall + 动词原形 / be going to + V',
        rule: '表示将来某个时间将要发生的动作或状态。will 表意愿或预测；be going to 表计划或迹象。',
        examples: [
          'I will help you with your homework. (我会帮你做作业。)',
          'Look at the clouds! It is going to rain. (看那些云！要下雨了。)',
          'They will arrive next Monday. (他们下周一到达。)',
        ],
      },
      {
        name: '过去将来时',
        structure: '主语 + would + 动词原形 / was/were going to + V',
        rule: '站在过去某时刻看将要发生的动作，常用于宾语从句中。',
        examples: [
          'He said he would come the next day. (他说他第二天会来。)',
          'I thought it was going to rain. (我以为要下雨了。)',
          'She told me she would buy a book. (她告诉我她会买本书。)',
        ],
      },
      {
        name: '现在进行时',
        structure: '主语 + am/is/are + V-ing',
        rule: '表示说话时正在进行的动作，或现阶段正在进行的事。',
        examples: [
          'They are playing football now. (他们正在踢足球。)',
          'I am reading a novel these days. (这些天我在读一本小说。)',
          'She is cooking in the kitchen. (她正在厨房做饭。)',
        ],
      },
      {
        name: '过去进行时',
        structure: '主语 + was/were + V-ing',
        rule: '表示过去某时刻或某段时间正在进行的动作，常与 when/while 连用。',
        examples: [
          'I was watching TV when he called me. (他打电话时我正在看电视。)',
          'They were having dinner at 7 pm yesterday. (昨天晚上七点他们正在吃晚饭。)',
          'While she was reading, it started to rain. (她读书时开始下雨了。)',
        ],
      },
      {
        name: '将来进行时',
        structure: '主语 + will be + V-ing',
        rule: '表示将来某一时刻正在进行的动作。',
        examples: [
          'This time tomorrow I will be flying to Paris. (明天这时候我正飞往巴黎。)',
          'At 9 am she will be giving a speech. (上午九点她将正在演讲。)',
          'They will be working all afternoon. (他们整个下午都将工作。)',
        ],
      },
      {
        name: '现在完成时',
        structure: '主语 + have/has + V-ed(过去分词)',
        rule: '表示过去发生并对现在有影响的动作，或从过去持续到现在的动作。常与 already, yet, just, ever, never 连用。',
        examples: [
          'I have finished my homework. (我已经完成作业了。)',
          'She has lived here for ten years. (她在这里住了十年了。)',
          'Have you ever been to Japan? (你去过日本吗？)',
        ],
      },
      {
        name: '过去完成时',
        structure: '主语 + had + V-ed',
        rule: '表示在过去某时间或某动作之前已完成的动作，即"过去的过去"。',
        examples: [
          'When I arrived, the train had left. (我到时火车已经开了。)',
          'He had learned English before he came here. (来这里之前他已经学过英语。)',
          'She said she had finished the work. (她说她已经完成了工作。)',
        ],
      },
      {
        name: '将来完成时',
        structure: '主语 + will have + V-ed',
        rule: '表示在将来某一时间前已完成的动作。',
        examples: [
          'By next month I will have graduated. (到下个月我就毕业了。)',
          'They will have built the bridge by 2026. (到2026年他们将建好这座桥。)',
          'She will have finished cooking by 6 pm. (她六点前将做完饭。)',
        ],
      },
      {
        name: '现在完成进行时',
        structure: '主语 + have/has been + V-ing',
        rule: '表示从过去某时开始一直持续到现在的动作，强调动作的持续性。',
        examples: [
          'I have been learning English for five years. (我学英语已经五年了。)',
          'She has been waiting for two hours. (她已经等了两个小时。)',
          'They have been working all morning. (他们整个上午都在工作。)',
        ],
      },
      {
        name: '过去完成进行时',
        structure: '主语 + had been + V-ing',
        rule: '表示在过去某时间之前一直持续的动作。',
        examples: [
          'He had been studying for hours before he took a rest. (他学习了好几个小时才休息。)',
          'They had been talking when I entered. (我进去时他们一直在交谈。)',
          'She had been working hard before she fell ill. (她生病前一直努力工作。)',
        ],
      },
    ],
  },
  {
    name: '句型',
    items: [
      {
        name: '陈述句',
        structure: '主语 + 谓语 + 宾语等',
        rule: '陈述一个事实或表明一种看法，肯定或否定均可。',
        examples: [
          'The boy is reading a book. (男孩正在读书。)',
          'She does not like coffee. (她不喜欢咖啡。)',
          'We are going to the park. (我们要去公园。)',
        ],
      },
      {
        name: '一般疑问句',
        structure: '助动词/Be动词/情态动词 + 主语 + ...?',
        rule: '用 yes 或 no 回答的疑问句，句首为 be、助动词或情态动词。',
        examples: [
          'Are you a student? — Yes, I am. (你是学生吗？— 是的。)',
          'Does he play the piano? — No, he does not. (他弹钢琴吗？— 不。)',
          'Can you swim? — Yes, I can. (你会游泳吗？— 会。)',
        ],
      },
      {
        name: '特殊疑问句',
        structure: '疑问词(What/When/Where/Why/How等) + 一般疑问句?',
        rule: '对句中某一部分提问，不能用 yes/no 回答，须用具体信息作答。',
        examples: [
          'What are you doing now? (你现在在做什么？)',
          'Where does she live? (她住在哪里？)',
          'Why did he leave so early? (他为什么这么早离开？)',
        ],
      },
      {
        name: '选择疑问句',
        structure: '一般疑问句 + or + 选择项?',
        rule: '提出两种或多种情况供对方选择，不能用 yes/no 回答。',
        examples: [
          'Do you like tea or coffee? (你喜欢茶还是咖啡？)',
          'Is he a teacher or a doctor? (他是老师还是医生？)',
          'Shall we go by bus or by train? (我们坐公交还是火车？)',
        ],
      },
      {
        name: '祈使句',
        structure: '动词原形 / Do not + 动词原形',
        rule: '表示请求、命令、劝告、禁止等，主语 you 通常省略。',
        examples: [
          'Open the door, please. (请开门。)',
          'Do not touch the paint. (不要碰油漆。)',
          'Be quiet! (安静！)',
        ],
      },
      {
        name: '感叹句',
        structure: 'What (a/an) + 名词! / How + 形容词/副词!',
        rule: '表达强烈感情。what 修饰名词，how 修饰形容词或副词。',
        examples: [
          'What a beautiful day! (多美的一天啊！)',
          'How clever the girl is! (这女孩多聪明啊！)',
          'What delicious food it is! (这食物真好吃！)',
        ],
      },
    ],
  },
  {
    name: '从句',
    items: [
      {
        name: '宾语从句',
        structure: '主句 + that/whether/疑问词 + 陈述语序从句',
        rule: '在复合句中作宾语的从句。引导词 that 在口语中常省略；whether/if 用于一般疑问句转换；疑问词用于特殊疑问句转换。从句须用陈述语序。',
        examples: [
          'I think (that) he is right. (我认为他是对的。)',
          'She asked if I had eaten. (她问我是否吃过了。)',
          'Do you know where he lives? (你知道他住哪儿吗？)',
        ],
      },
      {
        name: '定语从句',
        structure: '先行词 + 关系词(that/which/who/whose/when/where) + 从句',
        rule: '修饰名词或代词的从句。关系代词 that/which 修饰物，who/whom 修饰人，whose 表所属。限制性定语从句不可省，非限制性用逗号隔开。',
        examples: [
          'The book that I bought is interesting. (我买的书很有趣。)',
          'The man who is talking is my teacher. (正在说话的男士是我老师。)',
          'This is the house where Lu Xun once lived. (这是鲁迅曾经住过的房子。)',
        ],
      },
      {
        name: '状语从句',
        structure: '连接词 + 从句, 主句 / 主句 + 连接词 + 从句',
        rule: '在复合句中作状语，修饰动词、形容词或副词。分为时间、地点、原因、目的、结果、条件、让步、方式、比较等种类。',
        examples: [
          'When it rains, I stay at home. (下雨时我待在家。)', // 时间
          'Because he was ill, he did not go to school. (因为生病他没上学。)', // 原因
          'If you study hard, you will succeed. (如果你努力学习，就会成功。)', // 条件
        ],
      },
      {
        name: '主语从句',
        structure: 'That/Whether/疑问词 + 从句 + 谓语',
        rule: '在复合句中作主语。that 引导的主语从句常以 it 作形式主语后置。',
        examples: [
          'That he came late is true. (他来晚了是真的。)',
          'It is known that the earth is round. (众所周知地球是圆的。)',
          'Whether we will go depends on the weather. (我们去不去取决于天气。)',
        ],
      },
      {
        name: '表语从句',
        structure: '主语 + be动词 + that/whether/疑问词 + 从句',
        rule: '在系动词后作表语的从句，说明主语的内容或状态。',
        examples: [
          'The truth is that he lied. (事实是他撒谎了。)',
          'The question is whether we can finish it. (问题是我们能否完成。)',
          'This is what I want to say. (这就是我想说的。)',
        ],
      },
    ],
  },
  {
    name: '虚拟语气',
    items: [
      {
        name: 'if 条件句（与现在事实相反）',
        structure: 'If + 主语 + V-ed(过去式, be 用 were), 主语 + would/could/should + V',
        rule: '表示与现在事实相反的假设，从句用过去式，主句用 would/could/should + 动词原形。',
        examples: [
          'If I were you, I would accept the offer. (如果我是你，我会接受这个提议。)',
          'If he had time, he would help us. (如果他有时间，他会帮我们。)',
          'If she knew the answer, she would tell us. (如果她知道答案，她会告诉我们。)',
        ],
      },
      {
        name: 'if 条件句（与过去事实相反）',
        structure: 'If + 主语 + had + V-ed, 主语 + would/could/should have + V-ed',
        rule: '表示与过去事实相反的假设，从句用过去完成时，主句用 would have + 过去分词。',
        examples: [
          'If I had known, I would have gone. (要是我知道，我就去了。)',
          'If she had studied harder, she would have passed. (她要是更努力，就及格了。)',
          'If it had not rained, we would have played outside. (要不下雨，我们就在外面玩了。)',
        ],
      },
      {
        name: 'if 条件句（与将来事实相反）',
        structure: 'If + 主语 + were to/should + V, 主语 + would/could + V',
        rule: '表示将来不太可能发生的情况，从句用 were to 或 should + 动词原形。',
        examples: [
          'If it were to rain tomorrow, we would cancel the trip. (如果明天下雨，我们会取消旅行。)',
          'If he should come, tell him to wait. (万一他来了，让他等一下。)',
          'If the sun were to rise in the west, I would still love you. (即使太阳从西边升起，我仍爱你。)',
        ],
      },
      {
        name: 'wish 引导的愿望',
        structure: '主语 + wish + (that) + 从句',
        rule: '表示无法实现的愿望。与现在相反用过去式；与过去相反用 had + V-ed；与将来相反用 would/could + V。',
        examples: [
          'I wish I were taller. (我希望我更高些。)',
          'She wishes she had studied medicine. (她希望当初学的是医学。)',
          'I wish it would stop raining. (我希望雨能停下来。)',
        ],
      },
      {
        name: 'suggest/demand 等后的宾语从句',
        structure: '主语 + suggest/demand/insist/require + (that) + 主语 + (should) + V',
        rule: '表示建议、要求、命令等动词后的宾语从句用 (should) + 动词原形，should 可省略。',
        examples: [
          'The doctor suggested that he (should) rest. (医生建议他休息。)',
          'I demand that he (should) apologize. (我要求他道歉。)',
          'She insisted that the meeting (should) be cancelled. (她坚持会议应取消。)',
        ],
      },
    ],
  },
  {
    name: '非谓语动词',
    items: [
      {
        name: '动词不定式',
        structure: 'to + 动词原形',
        rule: '可在句中作主语、宾语、表语、定语、状语。常表示目的、将来或具体的一次动作。',
        examples: [
          'To learn English well is important. (学好英语很重要。) — 主语',
          'I want to buy a new phone. (我想买部新手机。) — 宾语',
          'He came to help me. (他来帮我。) — 目的状语',
        ],
      },
      {
        name: '动名词',
        structure: '动词 + -ing',
        rule: '具有名词性质，可作主语、宾语、表语、定语。常表示习惯性或一般性的动作。',
        examples: [
          'Swimming is good for your health. (游泳对健康有益。) — 主语',
          'I enjoy reading novels. (我喜欢读小说。) — 宾语',
          'My hobby is collecting stamps. (我的爱好是集邮。) — 表语',
        ],
      },
      {
        name: '现在分词',
        structure: '动词 + -ing',
        rule: '具有形容词和副词性质，可作定语、表语、状语、补语。表示主动或进行。',
        examples: [
          'The crying baby is hungry. (哭闹的婴儿饿了。) — 定语',
          'I saw him crossing the street. (我看见他在过马路。) — 补语',
          'Walking along the river, I met an old friend. (沿河散步时我遇到了老朋友。) — 状语',
        ],
      },
      {
        name: '过去分词',
        structure: '动词 + -ed (规则) / 不规则变化',
        rule: '具有形容词和副词性质，可作定语、表语、状语、补语。表示被动或完成。',
        examples: [
          'The broken window has been repaired. (打破的窗户已修好。) — 定语',
          'I had my hair cut yesterday. (我昨天理发了。) — 补语',
          'Moved by the story, she burst into tears. (被故事感动，她哭了。) — 状语',
        ],
      },
      {
        name: '独立主格结构',
        structure: '名词/代词 + 分词/形容词/副词/不定式',
        rule: '由名词或代词作逻辑主语，后接非谓语动词等，与主句主语不同，作状语表伴随、原因、时间等。',
        examples: [
          'Weather permitting, we will go outing. (天气允许的话，我们就去郊游。)',
          'The work done, we went home. (工作做完后，我们回家了。)',
          'He lay on the grass, his eyes looking at the sky. (他躺在草地上，眼睛望着天空。)',
        ],
      },
    ],
  },
]

function filteredItems(cat: Category): GrammarPoint[] {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return cat.items
  return cat.items.filter(item =>
    item.name.toLowerCase().includes(kw) ||
    item.rule.toLowerCase().includes(kw) ||
    item.structure.toLowerCase().includes(kw) ||
    item.examples.some(e => e.toLowerCase().includes(kw))
  )
}
</script>

<style scoped>
.grammar-reference {
  max-width: 1000px;
  margin: 0 auto;
}

.search-bar {
  margin-bottom: 16px;
}

.empty-tip {
  padding: 40px;
  text-align: center;
  color: #999;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
}

.grammar-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.grammar-item {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 14px 16px;
  background: #fff;
  transition: box-shadow 0.2s;
}

.grammar-item:hover {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
}

.grammar-head {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.grammar-name {
  font-size: 16px;
  font-weight: 700;
  color: #2080f0;
}

.grammar-structure {
  font-size: 13px;
  padding: 2px 10px;
  border-radius: 4px;
  background: #f0f7ff;
  color: #2080f0;
  font-family: 'Fira Code', 'Consolas', monospace;
}

.grammar-rule {
  font-size: 14px;
  color: #555;
  line-height: 1.8;
  margin-bottom: 10px;
}

.grammar-examples {
  background: #fafafa;
  border-left: 3px solid #36ad6a;
  padding: 8px 12px;
  border-radius: 4px;
}

.example-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 3px 0;
  font-size: 13px;
  color: #666;
  line-height: 1.7;
}

.ex-icon {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #36ad6a;
  color: #fff;
  font-size: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
}

.ex-text {
  flex: 1;
}

/* 深色模式 */
.dark .empty-tip {
  color: #777;
  border-color: #2a2a4a;
}

.dark .grammar-item {
  background: #181828;
  border-color: #2a2a4a;
}

.dark .grammar-item:hover {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.dark .grammar-name {
  color: #5b9bf5;
}

.dark .grammar-structure {
  background: #1c2a4a;
  color: #5b9bf5;
}

.dark .grammar-rule {
  color: #bbb;
}

.dark .grammar-examples {
  background: #141422;
  border-left-color: #36ad6a;
}

.dark .example-row {
  color: #aaa;
}

@media (max-width: 600px) {
  .grammar-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
}
</style>
