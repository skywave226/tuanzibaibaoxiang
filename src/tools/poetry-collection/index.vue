<template>
  <div class="poetry-collection">
    <!-- 筛选与搜索 -->
    <div class="filter-bar">
      <n-input
        v-model:value="keyword"
        placeholder="搜索标题、作者或诗句…"
        clearable
        class="search-input"
      >
        <template #prefix>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </template>
      </n-input>
      <n-select
        v-model:value="dynastyFilter"
        :options="dynastyOptions"
        placeholder="朝代"
        clearable
        class="filter-select"
      />
      <n-select
        v-model:value="authorFilter"
        :options="authorOptions"
        placeholder="作者"
        clearable
        filterable
        class="filter-select"
      />
      <n-select
        v-model:value="typeFilter"
        :options="typeOptions"
        placeholder="类型"
        clearable
        class="filter-select"
      />
      <n-button type="primary" @click="pickRandom">随机一首</n-button>
      <n-button @click="showFavOnly = !showFavOnly" :type="showFavOnly ? 'warning' : 'default'">
        {{ showFavOnly ? '看收藏' : '看收藏' }} ({{ favCount }})
      </n-button>
    </div>

    <!-- 诗词列表 -->
    <div v-if="filteredPoems.length === 0" class="empty-tip">
      暂无符合条件的诗词
    </div>

    <div v-else class="poem-list">
      <div v-for="poem in filteredPoems" :key="poem.title + poem.author" class="poem-card">
        <div class="poem-header">
          <div class="poem-title">{{ poem.title }}</div>
          <div class="poem-meta">
            <span class="poem-dynasty">【{{ poem.dynasty }}】</span>
            <span class="poem-author">{{ poem.author }}</span>
            <span class="poem-type-tag">{{ poem.type }}</span>
          </div>
          <span
            class="fav-btn"
            :class="{ active: isFav(poem) }"
            @click="toggleFav(poem)"
            :title="isFav(poem) ? '取消收藏' : '收藏'"
          >
            <svg v-if="isFav(poem)" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </span>
        </div>
        <div class="poem-content">
          <p v-for="(line, i) in poem.content" :key="i">{{ line }}</p>
        </div>
        <n-collapse class="poem-collapse">
          <n-collapse-item title="译文" name="trans">
            <p class="poem-translation">{{ poem.translation }}</p>
          </n-collapse-item>
          <n-collapse-item title="赏析" name="appr">
            <p class="poem-appreciation">{{ poem.appreciation }}</p>
          </n-collapse-item>
        </n-collapse>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { NInput, NSelect, NButton, NCollapse, NCollapseItem } from 'naive-ui'

interface Poem {
  title: string
  author: string
  dynasty: string
  type: string
  content: string[]
  translation: string
  appreciation: string
}

const poemData: Poem[] = [
  {
    title: '静夜思',
    author: '李白',
    dynasty: '唐',
    type: '思乡',
    content: ['床前明月光，', '疑是地上霜。', '举头望明月，', '低头思故乡。'],
    translation: '明亮的月光洒在床前，让人怀疑是地上结了霜。抬头望着天上明月，低头思念远方的故乡。',
    appreciation: '此诗以平淡朴素的语言抒发了浓烈的乡愁。月色引发联想，由"疑"到"望"再到"思"，层层递进，情景交融，被誉为千古思乡名篇。',
  },
  {
    title: '春晓',
    author: '孟浩然',
    dynasty: '唐',
    type: '写景',
    content: ['春眠不觉晓，', '处处闻啼鸟。', '夜来风雨声，', '花落知多少。'],
    translation: '春日酣眠不知不觉天已亮，到处都能听见鸟儿啼叫。昨夜听到风声雨声，不知落了多少花瓣。',
    appreciation: '诗人用自然流转的笔触描绘春日清晨景象，由听觉入手，喜春惜春之情隐含其中，意境清新淡雅。',
  },
  {
    title: '登鹳雀楼',
    author: '王之涣',
    dynasty: '唐',
    type: '写景',
    content: ['白日依山尽，', '黄河入海流。', '欲穷千里目，', '更上一层楼。'],
    translation: '夕阳依傍着西山慢慢落下，黄河滚滚向东流入大海。想要看到千里之外的景物，就要再登上一层楼。',
    appreciation: '前两句写景壮阔雄浑，后两句即景生理，蕴含"站得高才能看得远"的哲理，气魄宏大，境界开阔。',
  },
  {
    title: '望庐山瀑布',
    author: '李白',
    dynasty: '唐',
    type: '写景',
    content: ['日照香炉生紫烟，', '遥看瀑布挂前川。', '飞流直下三千尺，', '疑是银河落九天。'],
    translation: '阳光照射下的香炉峰升起紫色云烟，远远望去瀑布像白绢挂在山前。飞奔而下的水流足有三千尺，让人怀疑是银河从九天落下。',
    appreciation: '诗人以奇特的想象和夸张的比喻描写庐山瀑布的壮观。"飞流直下"气势磅礴，"银河落九天"想象瑰丽，尽显浪漫主义风格。',
  },
  {
    title: '绝句',
    author: '杜甫',
    dynasty: '唐',
    type: '写景',
    content: ['两个黄鹂鸣翠柳，', '一行白鹭上青天。', '窗含西岭千秋雪，', '门泊东吴万里船。'],
    translation: '两只黄鹂在翠绿的柳枝间鸣叫，一行白鹭飞上蓝天。窗户里映出西岭千年不化的积雪，门前停泊着远航东吴的船。',
    appreciation: '全诗四句四景，色彩鲜明，动静结合。黄、翠、白、青四色相映成趣，展现出一幅清新明丽的春日图景。',
  },
  {
    title: '春夜喜雨',
    author: '杜甫',
    dynasty: '唐',
    type: '写景',
    content: ['好雨知时节，', '当春乃发生。', '随风潜入夜，', '润物细无声。'],
    translation: '好雨懂得时节，正当春天万物萌发时降临。它随春风在夜里悄悄落下，无声地滋润着万物。',
    appreciation: '诗人以拟人手法写春雨，"知时节""潜""润"等字写出春雨的善解人意，表达了对春雨滋润万物的喜悦之情。',
  },
  {
    title: '望岳',
    author: '杜甫',
    dynasty: '唐',
    type: '写景',
    content: ['岱宗夫如何？', '齐鲁青未了。', '造化钟神秀，', '阴阳割昏晓。'],
    translation: '泰山究竟怎样？横亘齐鲁大地一片青翠。大自然将神奇秀美汇聚于此，山南山北判若晨昏。',
    appreciation: '此为杜甫青年时所作，"会当凌绝顶，一览众山小"表达了诗人不畏困难、勇攀高峰的壮志豪情。',
  },
  {
    title: '江雪',
    author: '柳宗元',
    dynasty: '唐',
    type: '写景',
    content: ['千山鸟飞绝，', '万径人踪灭。', '孤舟蓑笠翁，', '独钓寒江雪。'],
    translation: '群山中不见飞鸟的影子，条条小路也不见行人踪迹。只有一只孤舟上披蓑戴笠的老翁，独自在风雪中垂钓。',
    appreciation: '诗人以广袤寂静的雪景衬托孤舟独钓的老翁，营造出清冷孤寂的意境，寄托了作者孤高不屈的情怀。',
  },
  {
    title: '寻隐者不遇',
    author: '贾岛',
    dynasty: '唐',
    type: '抒情',
    content: ['松下问童子，', '言师采药去。', '只在此山中，', '云深不知处。'],
    translation: '在松树下询问童子，他说师傅采药去了。师傅就在这座山中，但云雾弥漫，不知他在何处。',
    appreciation: '全诗以问答形式写成，简洁含蓄。"云深不知处"既写山中实景，又暗喻隐者的高洁与超然，余味悠长。',
  },
  {
    title: '枫桥夜泊',
    author: '张继',
    dynasty: '唐',
    type: '思乡',
    content: ['月落乌啼霜满天，', '江枫渔火对愁眠。', '姑苏城外寒山寺，', '夜半钟声到客船。'],
    translation: '月亮落下乌鸦啼叫满天寒霜，江边枫树伴着渔火映照着愁眠的旅人。姑苏城外寒山寺的钟声，在半夜传到了客船之上。',
    appreciation: '诗人通过月落、乌啼、霜天、渔火等意象营造出凄清孤寂的意境，寒山寺的钟声更添游子的愁思，情景交融。',
  },
  {
    title: '游子吟',
    author: '孟郊',
    dynasty: '唐',
    type: '亲情',
    content: ['慈母手中线，', '游子身上衣。', '临行密密缝，', '意恐迟迟归。'],
    translation: '慈爱的母亲手中的针线，为远行的儿子缝制衣衫。临行前密密地缝缀，只怕儿子迟迟不能归来。',
    appreciation: '诗人以缝衣这一生活细节表现母爱的深沉细腻，语言质朴却情感真挚，是歌颂母爱的千古名篇。',
  },
  {
    title: '赋得古原草送别',
    author: '白居易',
    dynasty: '唐',
    type: '送别',
    content: ['离离原上草，', '一岁一枯荣。', '野火烧不尽，', '春风吹又生。'],
    translation: '原野上茂盛的青草，一年一度枯萎又繁荣。野火无法将它烧尽，春风一吹它又重新生长。',
    appreciation: '诗人借咏草寄托顽强的生命力。"野火烧不尽，春风吹又生"已成为歌颂坚韧不拔精神的千古名句。',
  },
  {
    title: '忆江南',
    author: '白居易',
    dynasty: '唐',
    type: '写景',
    content: ['江南好，', '风景旧曾谙。', '日出江花红胜火，', '春来江水绿如蓝。'],
    translation: '江南真好，那里的风景我从前就很熟悉。日出时江边的鲜花比火还要红，春天到来江水绿得像蓝草。',
    appreciation: '词人以鲜明的色彩对比描绘江南春景，"红胜火""绿如蓝"色彩明艳，饱含对江南的深切怀念。',
  },
  {
    title: '悯农',
    author: '李绅',
    dynasty: '唐',
    type: '讽喻',
    content: ['锄禾日当午，', '汗滴禾下土。', '谁知盘中餐，', '粒粒皆辛苦。'],
    translation: '正午烈日下农民在锄禾，汗水滴落在禾苗下的泥土里。有谁知道盘中的饭菜，每一粒都饱含着辛苦。',
    appreciation: '诗人以朴素的语言描绘农民劳作的艰辛，劝诫人们珍惜粮食，体现了对劳动人民的深切同情。',
  },
  {
    title: '清明',
    author: '杜牧',
    dynasty: '唐',
    type: '抒情',
    content: ['清明时节雨纷纷，', '路上行人欲断魂。', '借问酒家何处有？', '牧童遥指杏花村。'],
    translation: '清明时节细雨纷纷飘落，路上行人心情忧伤如断魂。借问哪里有酒家？牧童遥遥指向杏花村。',
    appreciation: '全诗情景交融，"雨纷纷"烘托愁绪，结尾以"杏花村"给人以希望与慰藉，余韵悠长。',
  },
  {
    title: '山行',
    author: '杜牧',
    dynasty: '唐',
    type: '写景',
    content: ['远上寒山石径斜，', '白云生处有人家。', '停车坐爱枫林晚，', '霜叶红于二月花。'],
    translation: '顺着弯曲的石径远上寒山，白云深处有人家居住。停下车是因为喜爱傍晚的枫林，经霜的枫叶比二月的花还要红。',
    appreciation: '"霜叶红于二月花"是千古名句，诗人以红叶比春花，展现秋天的热烈与生机，一反悲秋常调。',
  },
  {
    title: '江南春',
    author: '杜牧',
    dynasty: '唐',
    type: '写景',
    content: ['千里莺啼绿映红，', '水村山郭酒旗风。', '南朝四百八十寺，', '多少楼台烟雨中。'],
    translation: '千里江南莺啼燕语，绿树映衬着红花，水乡村庄山城酒旗迎风。南朝遗留下来的四百八十座寺院，多少楼台掩映在蒙蒙烟雨中。',
    appreciation: '前两句写江南明媚春光，后两句凭吊历史，"多少楼台烟雨中"既写景又含历史沧桑之感。',
  },
  {
    title: '泊秦淮',
    author: '杜牧',
    dynasty: '唐',
    type: '讽喻',
    content: ['烟笼寒水月笼沙，', '夜泊秦淮近酒家。', '商女不知亡国恨，', '隔江犹唱后庭花。'],
    translation: '烟雾笼罩着寒水月光笼罩着沙岸，夜里停船在秦淮河畔靠近酒家。歌女不懂亡国之恨，隔着江还在唱《玉树后庭花》。',
    appreciation: '诗人借商女唱亡国之音，讽刺晚唐统治者的荒淫，借古讽今，寄托对国事的深切忧虑。',
  },
  {
    title: '乐游原',
    author: '李商隐',
    dynasty: '唐',
    type: '抒情',
    content: ['向晚意不适，', '驱车登古原。', '夕阳无限好，', '只是近黄昏。'],
    translation: '傍晚时分心情不畅，驾车登上古老的乐游原。夕阳的景色无限美好，只可惜已接近黄昏。',
    appreciation: '"夕阳无限好，只是近黄昏"既是写景也是抒情，蕴含着对美好事物短暂的惋惜，意境深远。',
  },
  {
    title: '夜雨寄北',
    author: '李商隐',
    dynasty: '唐',
    type: '思乡',
    content: ['君问归期未有期，', '巴山夜雨涨秋池。', '何当共剪西窗烛，', '却话巴山夜雨时。'],
    translation: '你问我何时归来，归期尚未确定。巴山的夜雨涨满了秋天的池塘。何时能与你一同剪烛西窗，再谈起今夜巴山夜雨的情景。',
    appreciation: '诗人以时空交错的手法，将眼前的离别与未来的团聚对照，情感缠绵深沉，构思巧妙。',
  },
  {
    title: '送杜少府之任蜀州',
    author: '王勃',
    dynasty: '唐',
    type: '送别',
    content: ['城阙辅三秦，', '风烟望五津。', '与君离别意，', '同是宦游人。'],
    translation: '长安城阙护卫着三秦大地，透过风烟遥望五津。与你离别的心意，我们同样是漂泊在外做官的人。',
    appreciation: '"海内存知己，天涯若比邻"一扫送别诗的悲伤之气，表现了诗人豁达开朗的胸襟，是送别诗的千古名篇。',
  },
  {
    title: '回乡偶书',
    author: '贺知章',
    dynasty: '唐',
    type: '思乡',
    content: ['少小离家老大回，', '乡音无改鬓毛衰。', '儿童相见不相识，', '笑问客从何处来。'],
    translation: '年少离开家乡年老才归来，乡音没有改变但鬓发已稀疏。儿童见到我互不相识，笑着问这位客人从哪里来。',
    appreciation: '诗人以回乡的切身感受写时光易逝、人事变迁，"笑问客从何处来"以孩童的天真反衬诗人的感慨，含蓄隽永。',
  },
  {
    title: '咏柳',
    author: '贺知章',
    dynasty: '唐',
    type: '咏物',
    content: ['碧玉妆成一树高，', '万条垂下绿丝绦。', '不知细叶谁裁出，', '二月春风似剪刀。'],
    translation: '高高的柳树像用碧玉装扮而成，万千柳条像绿色的丝带垂下。不知这细细的柳叶是谁裁出的，二月的春风就像一把剪刀。',
    appreciation: '诗人以新颖的比喻将春风拟人化，"二月春风似剪刀"想象奇特，生动形象地写出了春日柳树的柔美。',
  },
  {
    title: '凉州词',
    author: '王之涣',
    dynasty: '唐',
    type: '边塞',
    content: ['黄河远上白云间，', '一片孤城万仞山。', '羌笛何须怨杨柳，', '春风不度玉门关。'],
    translation: '黄河奔腾直上白云之间，一座孤城矗立在万仞高山之中。羌笛何必抱怨杨柳不绿，春风是吹不到玉门关的。',
    appreciation: '诗中苍凉辽阔的边塞景象与戍边将士的乡愁融为一体，"春风不度玉门关"暗含对朝廷不关怀边关的怨情。',
  },
  {
    title: '出塞',
    author: '王昌龄',
    dynasty: '唐',
    type: '边塞',
    content: ['秦时明月汉时关，', '万里长征人未还。', '但使龙城飞将在，', '不教胡马度阴山。'],
    translation: '秦汉时的明月照耀着秦汉时的关塞，万里长征的将士至今未还。只要有龙城飞将军李广在，就不会让胡人的战马越过阴山。',
    appreciation: '首句"秦时明月汉时关"以互文手法将历史与现实交织，气象雄浑，表达了对良将的渴求与对和平的向往。',
  },
  {
    title: '芙蓉楼送辛渐',
    author: '王昌龄',
    dynasty: '唐',
    type: '送别',
    content: ['寒雨连江夜入吴，', '平明送客楚山孤。', '洛阳亲友如相问，', '一片冰心在玉壶。'],
    translation: '寒雨连夜洒满吴地江天，清晨送别友人只见楚山孤影。洛阳的亲友如果问起我，就说我像玉壶中的冰一样晶莹纯洁。',
    appreciation: '"一片冰心在玉壶"以冰玉喻品格高洁，既是对友人的告白，也是诗人自勉，成为咏怀名句。',
  },
  {
    title: '鹿柴',
    author: '王维',
    dynasty: '唐',
    type: '写景',
    content: ['空山不见人，', '但闻人语响。', '返景入深林，', '复照青苔上。'],
    translation: '空旷的山中看不见人影，只听到有人说话的声音。夕阳的余晖射入深林，又照在青苔之上。',
    appreciation: '诗人以"以动衬静"的手法写山中幽静，"返景入深林"以光影变化展现自然之美，禅意盎然。',
  },
  {
    title: '九月九日忆山东兄弟',
    author: '王维',
    dynasty: '唐',
    type: '思乡',
    content: ['独在异乡为异客，', '每逢佳节倍思亲。', '遥知兄弟登高处，', '遍插茱萸少一人。'],
    translation: '独自一人在异乡做客，每逢佳节更加思念亲人。遥想兄弟们登高的地方，插遍茱萸只少了我一个人。',
    appreciation: '"每逢佳节倍思亲"道出了游子的共同心声，成为千古传诵的名句。结尾从对方落笔，更显情真意切。',
  },
  {
    title: '相思',
    author: '王维',
    dynasty: '唐',
    type: '咏物',
    content: ['红豆生南国，', '春来发几枝。', '愿君多采撷，', '此物最相思。'],
    translation: '红豆生长在南方的土地上，春天到来发了多少新枝？希望你多采一些，这东西最能寄托相思之情。',
    appreciation: '诗人借咏红豆寄托相思之情，语浅情深，"此物最相思"双关巧妙，含蓄隽永。',
  },
  {
    title: '鸟鸣涧',
    author: '王维',
    dynasty: '唐',
    type: '写景',
    content: ['人闲桂花落，', '夜静春山空。', '月出惊山鸟，', '时鸣春涧中。'],
    translation: '人心闲静桂花轻轻飘落，春夜里山林一片空寂。月亮升起惊动了山鸟，不时在春涧中鸣叫。',
    appreciation: '诗人以花落、月出、鸟鸣等动景衬托春山的幽静，"以动衬静"手法精妙，意境空灵。',
  },
  {
    title: '赠汪伦',
    author: '李白',
    dynasty: '唐',
    type: '送别',
    content: ['李白乘舟将欲行，', '忽闻岸上踏歌声。', '桃花潭水深千尺，', '不及汪伦送我情。'],
    translation: '我李白乘船将要启程，忽然听到岸上传来踏歌之声。桃花潭的水纵有千尺之深，也比不上汪伦送我的情谊深。',
    appreciation: '诗人以潭水之深比喻友情之深，化无形为有形，"不及汪伦送我情"真挚自然，是送别诗中的佳作。',
  },
  {
    title: '黄鹤楼送孟浩然之广陵',
    author: '李白',
    dynasty: '唐',
    type: '送别',
    content: ['故人西辞黄鹤楼，', '烟花三月下扬州。', '孤帆远影碧空尽，', '唯见长江天际流。'],
    translation: '老朋友在黄鹤楼与我辞别，在柳絮如烟的阳春三月东下扬州。孤帆的远影消失在碧空尽头，只见长江向天际奔流。',
    appreciation: '"孤帆远影碧空尽"以景结情，将离愁别绪融入浩渺江景之中，含蓄深远，余味无穷。',
  },
  {
    title: '早发白帝城',
    author: '李白',
    dynasty: '唐',
    type: '抒情',
    content: ['朝辞白帝彩云间，', '千里江陵一日还。', '两岸猿声啼不住，', '轻舟已过万重山。'],
    translation: '清晨告别彩云缭绕的白帝城，千里之外的江陵一天即可返回。两岸猿声还在耳畔回响，轻快的小船已穿过万重山峦。',
    appreciation: '全诗节奏轻快，"轻舟已过万重山"既写船行之快，也隐喻诗人遇赦后轻松愉快的心情。',
  },
  {
    title: '望天门山',
    author: '李白',
    dynasty: '唐',
    type: '写景',
    content: ['天门中断楚江开，', '碧水东流至此回。', '两岸青山相对出，', '孤帆一片日边来。'],
    translation: '天门山被长江从中断开，碧绿的江水东流至此回旋。两岸的青山相对而出，一片孤帆从太阳边驶来。',
    appreciation: '诗人以开阔的视野描绘天门山的壮丽，"两岸青山相对出"将静景动化，气魄宏大。',
  },
  {
    title: '独坐敬亭山',
    author: '李白',
    dynasty: '唐',
    type: '抒情',
    content: ['众鸟高飞尽，', '孤云独去闲。', '相看两不厌，', '只有敬亭山。'],
    translation: '群鸟高飞消失在远方，一片孤云悠闲地飘去。彼此相看不厌倦的，只有我和这座敬亭山。',
    appreciation: '诗人以众鸟孤云衬托自己的孤独，"相看两不厌"将山拟人化，寄托了诗人孤高脱俗的情怀。',
  },
  {
    title: '春望',
    author: '杜甫',
    dynasty: '唐',
    type: '爱国',
    content: ['国破山河在，', '城春草木深。', '感时花溅泪，', '恨别鸟惊心。'],
    translation: '国都残破而山河依旧，长安城中春天草木丛生。感伤时局见花也流泪，痛恨离别闻鸟鸣心惊。',
    appreciation: '诗人以乐景写哀情，"感时花溅泪，恨别鸟惊心"将花鸟拟人，寄托对国破家亡的深切悲痛，沉郁顿挫。',
  },
  {
    title: '闻官军收河南河北',
    author: '杜甫',
    dynasty: '唐',
    type: '爱国',
    content: ['剑外忽传收蓟北，', '初闻涕泪满衣裳。', '却看妻子愁何在，', '漫卷诗书喜欲狂。'],
    translation: '剑南忽然传来收复蓟北的消息，刚听到时泪水沾满了衣裳。回头看妻子愁云哪去了，胡乱卷起诗书喜得快要发狂。',
    appreciation: '此为杜甫"生平第一快诗"，全诗一气流注，将忽闻胜利的狂喜之情写得淋漓尽致，"喜欲狂"三字点睛。',
  },
  {
    title: '登高',
    author: '杜甫',
    dynasty: '唐',
    type: '抒情',
    content: ['风急天高猿啸哀，', '渚清沙白鸟飞回。', '无边落木萧萧下，', '不尽长江滚滚来。'],
    translation: '秋风劲急天高远猿啸凄哀，水清沙白鸟儿盘旋飞回。无边无际的落叶萧萧而下，奔流不息的长江滚滚而来。',
    appreciation: '"无边落木萧萧下，不尽长江滚滚来"对仗工整，气象宏大，将个人迟暮之悲与宇宙永恒之感融为一体。',
  },
  {
    title: '水调歌头·明月几时有',
    author: '苏轼',
    dynasty: '宋',
    type: '思乡',
    content: ['明月几时有？', '把酒问青天。', '不知天上宫阙，', '今夕是何年。'],
    translation: '明月何时才有？我端起酒杯询问青天。不知天上的宫殿，今夜是哪一年。',
    appreciation: '"但愿人长久，千里共婵娟"是千古名句，词人在中秋之夜借月抒怀，将离愁化为美好的祝愿，旷达洒脱。',
  },
  {
    title: '念奴娇·赤壁怀古',
    author: '苏轼',
    dynasty: '宋',
    type: '怀古',
    content: ['大江东去，', '浪淘尽，', '千古风流人物。', '故垒西边，人道是，三国周郎赤壁。'],
    translation: '大江滚滚向东流去，浪花淘尽了千古以来的风流人物。古垒西边，人们说是三国周瑜大破曹军的赤壁。',
    appreciation: '此词气势磅礴，将壮丽山河与历史人物交融，"大江东去"开篇即雄浑，是豪放词的代表作。',
  },
  {
    title: '题西林壁',
    author: '苏轼',
    dynasty: '宋',
    type: '哲理',
    content: ['横看成岭侧成峰，', '远近高低各不同。', '不识庐山真面目，', '只缘身在此山中。'],
    translation: '从正面看是连绵的山岭，从侧面看是陡峭的山峰，远近高低各不相同。看不清庐山的真正面目，只因为自己就身处在这山中。',
    appreciation: '"不识庐山真面目，只缘身在此山中"蕴含"当局者迷，旁观者清"的哲理，是宋诗理趣的典范。',
  },
  {
    title: '饮湖上初晴后雨',
    author: '苏轼',
    dynasty: '宋',
    type: '写景',
    content: ['水光潋滟晴方好，', '山色空蒙雨亦奇。', '欲把西湖比西子，', '淡妆浓抹总相宜。'],
    translation: '晴天时西湖水波荡漾十分美好，雨天时山色朦胧也很奇妙。如果把西湖比作美人西施，淡妆浓抹都是那样相宜。',
    appreciation: '"欲把西湖比西子"以拟人手法将西湖之美与西施之美相提并论，从此西湖又称"西子湖"。',
  },
  {
    title: '泊船瓜洲',
    author: '王安石',
    dynasty: '宋',
    type: '思乡',
    content: ['京口瓜洲一水间，', '钟山只隔数重山。', '春风又绿江南岸，', '明月何时照我还。'],
    translation: '京口和瓜洲只隔着一条长江，钟山也只隔着几重山峦。春风又吹绿了江南的两岸，明月什么时候照着我回到故乡。',
    appreciation: '"春风又绿江南岸"中"绿"字炼字精妙，化静为动，将春风赋予生机，是千古传诵的名句。',
  },
  {
    title: '元日',
    author: '王安石',
    dynasty: '宋',
    type: '写景',
    content: ['爆竹声中一岁除，', '春风送暖入屠苏。', '千门万户曈曈日，', '总把新桃换旧符。'],
    translation: '在爆竹声中旧的一年过去了，春风送来暖意饮下屠苏酒。千家万户沐浴在初升的朝阳中，都把新的桃符换下旧的。',
    appreciation: '诗中描绘了春节除旧迎新的热闹景象，"总把新桃换旧符"暗含诗人推行新法的政治抱负。',
  },
  {
    title: '梅花',
    author: '王安石',
    dynasty: '宋',
    type: '咏物',
    content: ['墙角数枝梅，', '凌寒独自开。', '遥知不是雪，', '为有暗香来。'],
    translation: '墙角有几枝梅花，冒着严寒独自开放。远远望去知道那不是雪，因为有淡淡的清香飘来。',
    appreciation: '诗人以梅咏志，"凌寒独自开"写梅的傲骨，"暗香来"写梅的品格，是咏梅名篇。',
  },
  {
    title: '夏日绝句',
    author: '李清照',
    dynasty: '宋',
    type: '爱国',
    content: ['生当作人杰，', '死亦为鬼雄。', '至今思项羽，', '不肯过江东。'],
    translation: '活着应当做人中的豪杰，死了也要做鬼中的英雄。至今人们还思念项羽，因为他不肯苟且偷生退回江东。',
    appreciation: '诗人借古讽今，以项羽宁死不屈的悲壮反衬南宋朝廷的偏安苟活，慷慨雄健，掷地有声。',
  },
]

const keyword = ref('')
const dynastyFilter = ref<string | null>(null)
const authorFilter = ref<string | null>(null)
const typeFilter = ref<string | null>(null)
const showFavOnly = ref(false)
const favorites = ref<string[]>([])

const FAV_KEY = 'poetry-favorites'

onMounted(() => {
  try {
    const stored = localStorage.getItem(FAV_KEY)
    if (stored) favorites.value = JSON.parse(stored)
  } catch { /* ignore */ }
})

function saveFavs() {
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify(favorites.value))
  } catch { /* ignore */ }
}

const dynastyOptions = computed(() => {
  const set = new Set(poemData.map(p => p.dynasty))
  return Array.from(set).map(d => ({ label: d, value: d }))
})

const authorOptions = computed(() => {
  const set = new Set(poemData.map(p => p.author))
  return Array.from(set).map(a => ({ label: a, value: a }))
})

const typeOptions = computed(() => {
  const set = new Set(poemData.map(p => p.type))
  return Array.from(set).map(t => ({ label: t, value: t }))
})

const filteredPoems = computed(() => {
  let list = poemData
  const q = keyword.value.trim().toLowerCase()
  if (q) {
    list = list.filter(p =>
      p.title.includes(q) ||
      p.author.includes(q) ||
      p.content.some(line => line.includes(q)) ||
      p.translation.includes(q)
    )
  }
  if (dynastyFilter.value) list = list.filter(p => p.dynasty === dynastyFilter.value)
  if (authorFilter.value) list = list.filter(p => p.author === authorFilter.value)
  if (typeFilter.value) list = list.filter(p => p.type === typeFilter.value)
  if (showFavOnly.value) list = list.filter(p => isFav(p))
  return list
})

const favCount = computed(() => favorites.value.length)

function isFav(poem: Poem) {
  return favorites.value.includes(poem.title)
}

function toggleFav(poem: Poem) {
  const idx = favorites.value.indexOf(poem.title)
  if (idx >= 0) favorites.value.splice(idx, 1)
  else favorites.value.push(poem.title)
  saveFavs()
}

function pickRandom() {
  const list = filteredPoems.value.length > 0 ? filteredPoems.value : poemData
  const poem = list[Math.floor(Math.random() * list.length)]
  keyword.value = poem.title
}
</script>

<style scoped>
.poetry-collection {
  max-width: 900px;
  margin: 0 auto;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 220px;
}

.filter-select {
  width: 140px;
}

.empty-tip {
  text-align: center;
  color: #888;
  padding: 40px 0;
}

.poem-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.poem-card {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 16px;
  background: #fff;
}

.poem-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.poem-title {
  font-size: 18px;
  font-weight: 600;
}

.poem-meta {
  color: #666;
  font-size: 14px;
}

.poem-type-tag {
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.fav-btn {
  margin-left: auto;
  cursor: pointer;
  font-size: 18px;
  color: #bbb;
}

.fav-btn.active {
  color: #f5a623;
}

.poem-content {
  font-size: 16px;
  line-height: 1.8;
  margin-bottom: 12px;
}

.poem-content p {
  margin: 0;
}

.poem-translation,
.poem-appreciation {
  color: #555;
  line-height: 1.6;
  margin: 0;
}

:deep(.n-collapse .n-collapse-item__header) {
  font-weight: 500;
}

.dark .poem-card {
  background: #1a1a2e;
  border-color: #2a2a4a;
}

.dark .poem-meta,
.dark .poem-translation,
.dark .poem-appreciation {
  color: #aaa;
}

.dark .poem-type-tag {
  background: #2a2a4a;
}
</style>