<template>
  <div class="tool-container history-timeline">
    <!-- 顶部控制栏 -->
    <div class="top-bar">
      <n-select
        v-model:value="region"
        :options="regionOptions"
        style="width: 160px"
      />
      <n-input
        v-model:value="keyword"
        placeholder="搜索事件、人物或详情…"
        clearable
        style="width: 280px"
      />
      <span class="count-tip">共 {{ filteredItems.length }} 条记录</span>
    </div>

    <!-- 横向时间轴 -->
    <div v-if="filteredItems.length === 0" class="empty-tip">
      未找到匹配的历史记录
    </div>

    <div v-else class="timeline-wrap">
      <div class="timeline-scroll">
        <div class="timeline-track" :style="{ width: trackWidth + 'px' }">
          <!-- 主轴线 -->
          <div class="axis-line"></div>
          <!-- 事件节点 -->
          <div
            v-for="(item, idx) in filteredItems"
            :key="idx"
            class="event-node"
            :class="[item.region, { up: idx % 2 === 0 }]"
            :style="{ left: nodeLeft(item.year) + 'px' }"
            @click="openDetail(item)"
          >
            <div class="node-dot" :class="item.region"></div>
            <div class="node-card">
              <div class="node-year">{{ item.yearLabel }}</div>
              <div class="node-title">{{ item.title }}</div>
              <div class="node-tag" :class="item.region">{{ regionLabel(item.region) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 时间刻度 -->
    <div v-if="filteredItems.length > 0" class="scale-bar">
      <span
        v-for="t in scaleMarks"
        :key="t.year"
        class="scale-mark"
        :style="{ left: nodeLeft(t.year) + 'px' }"
      >
        {{ t.label }}
      </span>
    </div>

    <!-- 详情弹窗 -->
    <n-modal v-model:show="showDetail" preset="card" :title="detail?.title || ''" style="max-width: 540px">
      <template v-if="detail">
        <div class="detail-meta">
          <span class="meta-tag year">{{ detail.yearLabel }}</span>
          <span class="meta-tag" :class="detail.region">{{ regionLabel(detail.region) }}</span>
          <span v-if="detail.period" class="meta-tag period">{{ detail.period }}</span>
        </div>
        <p class="detail-text">{{ detail.detail }}</p>
        <div v-if="detail.figures && detail.figures.length" class="detail-figures">
          <span class="figures-label">相关人物：</span>
          <span v-for="f in detail.figures" :key="f" class="figure-chip">{{ f }}</span>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NInput, NSelect, NModal } from 'naive-ui'

interface HistoryItem {
  year: number
  yearLabel: string
  title: string
  detail: string
  region: 'china' | 'world'
  period: string
  figures?: string[]
}

const items: HistoryItem[] = [
  // ===== 中国朝代与重大事件 =====
  { year: -2070, yearLabel: '约前2070', title: '夏朝建立', region: 'china', period: '夏商周', detail: '中国史书记载的第一个世袭制朝代，由禹之子启建立，标志着"家天下"取代禅让制。', figures: ['禹', '启'] },
  { year: -1600, yearLabel: '约前1600', title: '商朝建立', region: 'china', period: '夏商周', detail: '汤灭夏后建立商朝，是中国第一个有直接同时期文字记载的朝代（甲骨文）。', figures: ['商汤'] },
  { year: -1046, yearLabel: '前1046', title: '周朝建立', region: 'china', period: '夏商周', detail: '武王伐纣，灭商建周，定都镐京，史称西周；实行分封制与宗法制。', figures: ['周武王', '周公旦'] },
  { year: -841, yearLabel: '前841', title: '共和元年', region: 'china', period: '夏商周', detail: '国人暴动后周公、召公共同行政，是中国历史有确切纪年的开始。' },
  { year: -770, yearLabel: '前770', title: '东周·春秋', region: 'china', period: '春秋战国', detail: '平王东迁洛邑，周王室衰微，诸侯争霸，春秋时期开始。', figures: ['齐桓公', '晋文公'] },
  { year: -551, yearLabel: '前551', title: '孔子诞生', region: 'china', period: '春秋战国', detail: '儒家学派创始人孔子诞生，提出"仁"与"礼"的思想。', figures: ['孔子'] },
  { year: -475, yearLabel: '前475', title: '战国开始', region: 'china', period: '春秋战国', detail: '三家分晋后进入战国，七雄并立，百家争鸣。', figures: ['孟子', '庄子', '韩非子'] },
  { year: -221, yearLabel: '前221', title: '秦统一六国', region: 'china', period: '秦汉', detail: '秦始皇嬴政统一六国，建立中国第一个统一的多民族中央集权国家，推行郡县制、书同文、车同轨。', figures: ['秦始皇', '李斯'] },
  { year: -206, yearLabel: '前206', title: '汉朝建立', region: 'china', period: '秦汉', detail: '刘邦击败项羽，建立西汉，定都长安；汉武帝时国力鼎盛，独尊儒术。', figures: ['汉高祖', '汉武帝', '司马迁'] },
  { year: -138, yearLabel: '前138', title: '张骞出使西域', region: 'china', period: '秦汉', detail: '张骞奉汉武帝之命出使西域，开辟丝绸之路。', figures: ['张骞'] },
  { year: 25, yearLabel: '25年', title: '东汉建立', region: 'china', period: '秦汉', detail: '光武帝刘秀重建汉朝，定都洛阳，史称东汉。', figures: ['汉光武帝'] },
  { year: 105, yearLabel: '105年', title: '蔡伦改进造纸术', region: 'china', period: '秦汉', detail: '蔡伦改进造纸工艺，使用树皮、麻头等为原料，推动人类文明传播。', figures: ['蔡伦'] },
  { year: 220, yearLabel: '220年', title: '三国鼎立', region: 'china', period: '魏晋南北朝', detail: '曹丕代汉，进入魏蜀吴三国时期（220—280）。', figures: ['曹操', '刘备', '孙权', '诸葛亮'] },
  { year: 266, yearLabel: '266年', title: '西晋建立', region: 'china', period: '魏晋南北朝', detail: '司马炎代魏建晋，280年统一全国，不久陷入八王之乱与五胡乱华。', figures: ['司马炎'] },
  { year: 317, yearLabel: '317年', title: '东晋建立', region: 'china', period: '魏晋南北朝', detail: '司马睿南渡建康建立东晋，北方进入五胡十六国混战。', figures: ['王羲之', '顾恺之'] },
  { year: 420, yearLabel: '420年', title: '南北朝开始', region: 'china', period: '魏晋南北朝', detail: '刘裕代晋，南朝宋齐梁陈相继；北方北魏统一后分裂。', figures: ['北魏孝文帝'] },
  { year: 581, yearLabel: '581年', title: '隋朝建立', region: 'china', period: '隋唐五代', detail: '杨坚代北周建隋，589年统一全国，开创科举、营建大兴城与大运河。', figures: ['隋文帝', '隋炀帝'] },
  { year: 618, yearLabel: '618年', title: '唐朝建立', region: 'china', period: '隋唐五代', detail: '李渊建唐，定都长安；贞观之治、开元盛世，文化极盛，诗风鼎盛。', figures: ['唐太宗', '唐玄宗', '李白', '杜甫'] },
  { year: 690, yearLabel: '690年', title: '武则天称帝', region: 'china', period: '隋唐五代', detail: '武则天改国号为周，成为中国历史上唯一的女皇帝。', figures: ['武则天'] },
  { year: 960, yearLabel: '960年', title: '北宋建立', region: 'china', period: '宋元', detail: '赵匡胤陈桥兵变建立宋朝，结束五代十国分裂；重文抑武，经济文化繁荣。', figures: ['宋太祖', '王安石', '苏轼'] },
  { year: 1206, yearLabel: '1206年', title: '成吉思汗建蒙古', region: 'china', period: '宋元', detail: '铁木真统一蒙古各部，被尊为成吉思汗，建立大蒙古国。', figures: ['成吉思汗'] },
  { year: 1271, yearLabel: '1271年', title: '元朝建立', region: 'china', period: '宋元', detail: '忽必烈定国号为元，1279年灭南宋统一全国，版图空前辽阔。', figures: ['忽必烈'] },
  { year: 1368, yearLabel: '1368年', title: '明朝建立', region: 'china', period: '明清', detail: '朱元璋推翻元朝，定都南京（后迁北京）；郑和下西洋，修建紫禁城。', figures: ['明太祖', '明成祖', '郑和'] },
  { year: 1405, yearLabel: '1405年', title: '郑和下西洋', region: 'china', period: '明清', detail: '郑和率船队七下西洋，最远到达东非，是中国古代航海史上的壮举。', figures: ['郑和'] },
  { year: 1644, yearLabel: '1644年', title: '清朝建立', region: 'china', period: '明清', detail: '清军入关，逐步统一全国；康乾盛世后国势渐衰。', figures: ['康熙帝', '乾隆帝'] },
  { year: 1840, yearLabel: '1840年', title: '鸦片战争', region: 'china', period: '近代', detail: '第一次鸦片战争爆发，中国开始沦为半殖民地半封建社会，近代史开端。', figures: ['林则徐'] },
  { year: 1851, yearLabel: '1851年', title: '太平天国运动', region: 'china', period: '近代', detail: '洪秀全在广西金田起义，建立太平天国，持续14年。', figures: ['洪秀全'] },
  { year: 1894, yearLabel: '1894年', title: '甲午中日战争', region: 'china', period: '近代', detail: '中日甲午战争爆发，次年签订《马关条约》，台湾割让。', figures: ['李鸿章', '邓世昌'] },
  { year: 1911, yearLabel: '1911年', title: '辛亥革命', region: 'china', period: '近代', detail: '武昌起义爆发，次年清帝退位，结束两千多年帝制，建立中华民国。', figures: ['孙中山', '黄兴'] },
  { year: 1919, yearLabel: '1919年', title: '五四运动', region: 'china', period: '现代', detail: '巴黎和会外交失败引发五四爱国运动，新文化运动推向高潮。' },
  { year: 1949, yearLabel: '1949年', title: '中华人民共和国成立', region: 'china', period: '现代', detail: '10月1日，中华人民共和国宣告成立，开启中国历史新纪元。', figures: ['毛泽东'] },

  // ===== 世界历史 =====
  { year: -3500, yearLabel: '约前3500', title: '苏美尔文明', region: 'world', period: '上古', detail: '两河流域出现城邦，发明楔形文字，为已知最早文明之一。' },
  { year: -3100, yearLabel: '约前3100', title: '上下埃及统一', region: 'world', period: '上古', detail: '纳尔迈统一上下埃及，开启古埃及法老时代，象形文字与金字塔文明兴起。', figures: ['纳尔迈'] },
  { year: -1750, yearLabel: '约前1750', title: '汉谟拉比法典', region: 'world', period: '上古', detail: '古巴比伦国王汉谟拉比颁布现存最早的成文法典，刻于石柱上。', figures: ['汉谟拉比'] },
  { year: -776, yearLabel: '前776', title: '首届古代奥运会', region: 'world', period: '上古', detail: '古希腊在奥林匹亚举办首届古代奥林匹克运动会。' },
  { year: -509, yearLabel: '前509', title: '罗马共和国建立', region: 'world', period: '上古', detail: '罗马人推翻王政，建立共和国，实行元老院与执政官制度。' },
  { year: -480, yearLabel: '前480', title: '温泉关战役', region: 'world', period: '上古', detail: '希波战争中的著名战役，斯巴达三百勇士壮烈牺牲。', figures: ['列奥尼达'] },
  { year: -27, yearLabel: '前27年', title: '罗马帝国建立', region: 'world', period: '上古', detail: '屋大维获"奥古斯都"称号，罗马由共和国转为帝国，进入和平时期。', figures: ['屋大维'] },
  { year: 313, yearLabel: '313年', title: '米兰敕令', region: 'world', period: '中古', detail: '罗马帝国承认基督教合法地位，基督教迅速传播。', figures: ['君士坦丁大帝'] },
  { year: 476, yearLabel: '476年', title: '西罗马灭亡', region: 'world', period: '中古', detail: '日耳曼人废除西罗马皇帝，欧洲进入中世纪，西欧封建制形成。' },
  { year: 632, yearLabel: '632年', title: '伊斯兰教兴起', region: 'world', period: '中古', detail: '穆罕默德逝世，伊斯兰教传播于阿拉伯半岛，建立哈里发国家。', figures: ['穆罕默德'] },
  { year: 800, yearLabel: '800年', title: '查理曼加冕', region: 'world', period: '中古', detail: '查理大帝被教皇加冕为罗马人皇帝，奠定欧洲政教格局。', figures: ['查理大帝'] },
  { year: 1066, yearLabel: '1066年', title: '诺曼征服', region: 'world', period: '中古', detail: '诺曼底公爵威廉征服英格兰，深刻影响英国历史与语言。', figures: ['威廉一世'] },
  { year: 1096, yearLabel: '1096年', title: '第一次十字军东征', region: 'world', period: '中古', detail: '教皇乌尔班二世发起，欧洲基督徒进攻圣地耶路撒冷，持续近两百年。' },
  { year: 1215, yearLabel: '1215年', title: '英国《大宪章》', region: 'world', period: '中古', detail: '英王约翰被迫签署《大宪章》，限制王权，成为宪政之始。', figures: ['约翰王'] },
  { year: 1271, yearLabel: '1271年', title: '马可·波罗东游', region: 'world', period: '中古', detail: '威尼斯人马可·波罗沿丝绸之路到达元朝，其游记激发欧洲对东方的向往。', figures: ['马可·波罗'] },
  { year: 1453, yearLabel: '1453年', title: '君士坦丁堡陷落', region: 'world', period: '近代', detail: '奥斯曼帝国攻陷东罗马首都，拜占庭帝国灭亡，促进地理大发现。' },
  { year: 1492, yearLabel: '1492年', title: '哥伦布发现美洲', region: 'world', period: '近代', detail: '哥伦布率船队到达加勒比海，开启欧洲对美洲的殖民与全球航海新时代。', figures: ['哥伦布'] },
  { year: 1517, yearLabel: '1517年', title: '宗教改革', region: 'world', period: '近代', detail: '马丁·路德发表《九十五条论纲》，引发欧洲宗教改革。', figures: ['马丁·路德'] },
  { year: 1543, yearLabel: '1543年', title: '哥白尼日心说', region: 'world', period: '近代', detail: '哥白尼出版《天体运行论》，提出日心说，引发科学革命。', figures: ['哥白尼'] },
  { year: 1687, yearLabel: '1687年', title: '牛顿《原理》', region: 'world', period: '近代', detail: '牛顿发表《自然哲学的数学原理》，奠定经典力学基础。', figures: ['牛顿'] },
  { year: 1769, yearLabel: '1769年', title: '瓦特改良蒸汽机', region: 'world', period: '近代', detail: '瓦特改良蒸汽机，工业革命在英国蓬勃兴起，社会生产力剧增。', figures: ['瓦特'] },
  { year: 1776, yearLabel: '1776年', title: '美国《独立宣言》', region: 'world', period: '近代', detail: '北美十三州宣告独立，美国建国，启蒙思想在美洲实践。', figures: ['华盛顿', '杰斐逊'] },
  { year: 1789, yearLabel: '1789年', title: '法国大革命', region: 'world', period: '近代', detail: '巴黎民众攻占巴士底狱，推翻封建专制，发表《人权宣言》。', figures: ['罗伯斯庇尔'] },
  { year: 1861, yearLabel: '1861年', title: '美国南北战争', region: 'world', period: '近代', detail: '南方蓄奴州与北方开战，1865年北方胜利，废除奴隶制。', figures: ['林肯'] },
  { year: 1871, yearLabel: '1871年', title: '德意志统一', region: 'world', period: '近代', detail: '普鲁士击败法国，威廉一世在凡尔赛加冕为德意志皇帝，德国统一。', figures: ['俾斯麦'] },
  { year: 1879, yearLabel: '1879年', title: '爱迪生发明电灯', region: 'world', period: '近代', detail: '爱迪生发明实用白炽灯泡，改变人类照明方式。', figures: ['爱迪生'] },
  { year: 1903, yearLabel: '1903年', title: '莱特兄弟首飞', region: 'world', period: '现代', detail: '莱特兄弟驾驶"飞行者一号"完成人类首次有动力飞行。', figures: ['莱特兄弟'] },
  { year: 1914, yearLabel: '1914年', title: '第一次世界大战', region: 'world', period: '现代', detail: '萨拉热窝事件引爆一战，1918年同盟国战败，战后建立凡尔赛体系。' },
  { year: 1939, yearLabel: '1939年', title: '第二次世界大战', region: 'world', period: '现代', detail: '德国入侵波兰，二战爆发；1945年轴心国投降，联合国随后成立。' },
  { year: 1945, yearLabel: '1945年', title: '原子弹与二战结束', region: 'world', period: '现代', detail: '美国在日本广岛、长崎投下原子弹，日本投降，二战结束。' },
  { year: 1957, yearLabel: '1957年', title: '人造卫星上天', region: 'world', period: '现代', detail: '苏联发射人类第一颗人造卫星"斯普特尼克1号"，太空时代开启。' },
  { year: 1969, yearLabel: '1969年', title: '人类登月', region: 'world', period: '现代', detail: '美国阿波罗11号宇航员阿姆斯特朗成为首位踏上月球的人类。', figures: ['阿姆斯特朗'] },
  { year: 1989, yearLabel: '1989年', title: '柏林墙倒塌', region: 'world', period: '现代', detail: '柏林墙倒塌，东欧剧变，冷战格局开始瓦解。' },
  { year: 1991, yearLabel: '1991年', title: '苏联解体', region: 'world', period: '现代', detail: '苏联解体，冷战结束，世界格局走向多极化。' },
]

const regionOptions = [
  { label: '全部', value: 'all' },
  { label: '中国', value: 'china' },
  { label: '世界', value: 'world' },
]

const region = ref<'all' | 'china' | 'world'>('all')
const keyword = ref('')
const showDetail = ref(false)
const detail = ref<HistoryItem | null>(null)

// 时间轴范围
const yearRange = computed(() => {
  const list = filteredItems.value
  if (list.length === 0) return { min: -2200, max: 2050 }
  const years = list.map(i => i.year)
  return { min: Math.min(...years) - 50, max: Math.max(...years) + 50 }
})

const NODE_GAP = 8 // 每年像素
const trackWidth = computed(() => {
  const { min, max } = yearRange.value
  return Math.max(1000, (max - min) * NODE_GAP + 200)
})

function nodeLeft(year: number): number {
  return (year - yearRange.value.min) * NODE_GAP + 100
}

function regionLabel(r: string): string {
  return r === 'china' ? '中国' : '世界'
}

const filteredItems = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return [...items]
    .filter(it => {
      if (region.value !== 'all' && it.region !== region.value) return false
      if (kw) {
        const hay = (
          it.title + it.detail + it.yearLabel + it.period +
          (it.figures ? it.figures.join('') : '')
        ).toLowerCase()
        if (!hay.includes(kw)) return false
      }
      return true
    })
    .sort((a, b) => a.year - b.year)
})

// 时间刻度
const scaleMarks = computed(() => {
  const { min, max } = yearRange.value
  const marks: Array<{ year: number; label: string }> = []
  // 每隔约 500 年一个刻度
  const step = max - min > 3000 ? 500 : max - min > 1500 ? 200 : 100
  const start = Math.ceil(min / step) * step
  for (let y = start; y <= max; y += step) {
    marks.push({ year: y, label: y < 0 ? `前${-y}` : `${y}` })
  }
  return marks
})

function openDetail(item: HistoryItem): void {
  detail.value = item
  showDetail.value = true
}
</script>

<style scoped>
.history-timeline {
  padding: 16px 0;
}

.top-bar {
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

.timeline-wrap {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
}

.timeline-scroll {
  overflow-x: auto;
  overflow-y: visible;
  padding: 40px 24px 200px;
}

.timeline-track {
  position: relative;
  height: 220px;
}

.axis-line {
  position: absolute;
  left: 0;
  right: 0;
  top: 110px;
  height: 2px;
  background: linear-gradient(90deg, #d9d9d9, #2080f0, #d9d9d9);
  border-radius: 1px;
}

.event-node {
  position: absolute;
  top: 0;
  width: 0;
}

.node-dot {
  position: absolute;
  top: 104px;
  left: -6px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 0 2px currentColor;
  cursor: pointer;
  transition: transform 0.2s;
  z-index: 2;
}

.node-dot.china {
  color: #d48806;
  background: #faad14;
}

.node-dot.world {
  color: #1890ff;
  background: #40a9ff;
}

.event-node:hover .node-dot {
  transform: scale(1.3);
}

.node-card {
  position: absolute;
  width: 140px;
  padding: 8px 10px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.2s;
}

.event-node.up .node-card {
  bottom: 130px;
  left: -70px;
}

.event-node:not(.up) .node-card {
  top: 130px;
  left: -70px;
}

.node-card:hover {
  border-color: #2080f0;
  box-shadow: 0 4px 14px rgba(32, 128, 240, 0.2);
  transform: translateY(-2px);
}

.node-year {
  font-size: 12px;
  font-weight: 600;
  color: #2080f0;
  margin-bottom: 2px;
}

.node-title {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  line-height: 1.4;
  margin-bottom: 4px;
}

.node-tag {
  display: inline-block;
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 3px;
}

.node-tag.china {
  background: #fff7e6;
  color: #d48806;
}

.node-tag.world {
  background: #e6f7ff;
  color: #1890ff;
}

.scale-bar {
  position: relative;
  height: 24px;
  margin: 0 24px;
  border-top: 1px solid #f0f0f0;
}

.scale-mark {
  position: absolute;
  top: 8px;
  transform: translateX(-50%);
  font-size: 11px;
  color: #999;
  white-space: nowrap;
}

.detail-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.meta-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  background: #f0f7ff;
  color: #2080f0;
}

.meta-tag.year {
  background: #f5f5f5;
  color: #555;
}

.meta-tag.china {
  background: #fff7e6;
  color: #d48806;
}

.meta-tag.world {
  background: #e6f7ff;
  color: #1890ff;
}

.meta-tag.period {
  background: #f5f5f5;
  color: #666;
}

.detail-text {
  font-size: 14px;
  line-height: 1.8;
  color: #555;
  margin: 0;
}

.detail-figures {
  margin-top: 12px;
  font-size: 13px;
}

.figures-label {
  color: #999;
}

.figure-chip {
  display: inline-block;
  margin: 0 4px 4px 0;
  padding: 2px 8px;
  border-radius: 4px;
  background: #f5f5f5;
  color: #555;
}

/* 深色模式 */
.dark .count-tip {
  color: #777;
}

.dark .empty-tip {
  color: #777;
  border-color: #2a2a4a;
}

.dark .timeline-wrap {
  background: #181828;
  border-color: #2a2a4a;
}

.dark .axis-line {
  background: linear-gradient(90deg, #2a2a4a, #2080f0, #2a2a4a);
}

.dark .node-dot {
  border-color: #181828;
}

.dark .node-card {
  background: #1f1f33;
  border-color: #2a2a4a;
}

.dark .node-card:hover {
  border-color: #2080f0;
}

.dark .node-year {
  color: #5b9bf5;
}

.dark .node-title {
  color: #e0e0e0;
}

.dark .node-tag.china {
  background: #3a2e1a;
  color: #f0b35a;
}

.dark .node-tag.world {
  background: #1c2a4a;
  color: #5b9bf5;
}

.dark .scale-bar {
  border-color: #2a2a4a;
}

.dark .scale-mark {
  color: #777;
}

.dark .meta-tag {
  background: #1c2a4a;
  color: #5b9bf5;
}

.dark .meta-tag.year {
  background: #2a2a3e;
  color: #bbb;
}

.dark .meta-tag.china {
  background: #3a2e1a;
  color: #f0b35a;
}

.dark .meta-tag.world {
  background: #1c2a4a;
  color: #5b9bf5;
}

.dark .meta-tag.period {
  background: #2a2a3e;
  color: #aaa;
}

.dark .detail-text {
  color: #bbb;
}

.dark .figures-label {
  color: #777;
}

.dark .figure-chip {
  background: #2a2a3e;
  color: #bbb;
}
</style>
