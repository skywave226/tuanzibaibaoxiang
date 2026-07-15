<template>
  <div class="idiom-dictionary">
    <!-- 搜索区 -->
    <div class="search-bar">
      <n-input
        v-model:value="keyword"
        placeholder="搜索成语名称或释义…"
        clearable
      >
        <template #prefix>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </template>
      </n-input>
      <n-button type="primary" @click="pickRandom">随机一个</n-button>
    </div>

    <!-- 首字母索引 -->
    <div class="letter-index">
      <span
        v-for="letter in letters"
        :key="letter"
        class="letter-chip"
        :class="{ active: activeLetter === letter }"
        @click="toggleLetter(letter)"
      >
        {{ letter }}
      </span>
    </div>

    <!-- 成语接龙小游戏 -->
    <n-card title="成语接龙" size="small" class="chain-card">
      <template v-if="chainStarted">
        <div class="chain-flow">
          <span
            v-for="(item, idx) in chainList"
            :key="idx"
            class="chain-item"
            :class="{ match: idx > 0 }"
          >
            <span class="chain-text">{{ item.idiom }}</span>
            <span class="chain-py">{{ item.pinyin }}</span>
          </span>
        </div>
        <div class="chain-tip" v-if="chainList.length > 0">
          下一句请以「<b>{{ chainLastChar }}</b>」开头
        </div>
        <div class="chain-input-row">
          <n-input
            v-model:value="chainInput"
            placeholder="输入成语，回车确认"
            @keyup.enter="submitChain"
          />
          <n-button type="primary" @click="submitChain">接上</n-button>
          <n-button @click="resetChain">重新开始</n-button>
        </div>
        <div v-if="chainMsg" class="chain-msg" :class="chainMsgType">
          {{ chainMsg }}
        </div>
      </template>
      <template v-else>
        <div class="chain-start">
          <n-button type="primary" @click="startChain">开始接龙</n-button>
          <span class="chain-hint">系统随机给出一个成语，你接上一个以它末字开头的新成语。</span>
        </div>
      </template>
    </n-card>

    <!-- 数据表格 -->
    <n-data-table
      :columns="columns"
      :data="filteredIdioms"
      :pagination="pagination"
      :bordered="false"
      size="small"
      class="idiom-table"
    />

    <!-- 详情抽屉 -->
    <n-drawer v-model:show="drawerShow" :width="420">
      <n-drawer-content :title="current?.idiom" closable>
        <div v-if="current" class="detail">
          <div class="detail-row">
            <span class="detail-label">拼音</span>
            <span class="detail-value">{{ current.pinyin }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">释义</span>
            <span class="detail-value">{{ current.meaning }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">出处</span>
            <span class="detail-value">{{ current.origin }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">例句</span>
            <span class="detail-value">{{ current.example }}</span>
          </div>
        </div>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { NInput, NButton, NCard, NDataTable, NDrawer, NDrawerContent } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

interface Idiom {
  idiom: string
  pinyin: string
  meaning: string
  origin: string
  example: string
}

const idiomData: Idiom[] = [
  { idiom: '安步当车', pinyin: 'ān bù dàng chē', meaning: '以从容的步行代替乘车。', origin: '《战国策·齐策四》', example: '他喜欢安步当车，每天步行上下班。' },
  { idiom: '按图索骥', pinyin: 'àn tú suǒ jì', meaning: '比喻按照线索去寻找事物。', origin: '《汉书·梅福传》', example: '做学问不能按图索骥，要敢于创新。' },
  { idiom: '跋山涉水', pinyin: 'bá shān shè shuǐ', meaning: '翻山越岭，趟水过河，形容旅途艰辛。', origin: '《诗经·鄘风》', example: '考察队跋山涉水，终于到达目的地。' },
  { idiom: '白手起家', pinyin: 'bái shǒu qǐ jiā', meaning: '形容在没有基础和条件的情况下创立起一番家业。', origin: '《朱子语类》', example: '他白手起家，创办了自己的公司。' },
  { idiom: '百发百中', pinyin: 'bǎi fā bǎi zhòng', meaning: '形容射箭或射击准确无误，每次都命中目标。', origin: '《战国策·西周策》', example: '他的枪法百发百中，令人赞叹。' },
  { idiom: '百闻不如一见', pinyin: 'bǎi wén bù rú yī jiàn', meaning: '听到一百次不如亲眼看到一次，形容亲眼所见更为可靠。', origin: '《汉书·赵充国传》', example: '百闻不如一见，你还是亲自去看看吧。' },
  { idiom: '半途而废', pinyin: 'bàn tú ér fèi', meaning: '半路上就停了下来，比喻做事不能坚持到底。', origin: '《礼记·中庸》', example: '做事要有始有终，不能半途而废。' },
  { idiom: '包罗万象', pinyin: 'bāo luó wàn xiàng', meaning: '形容内容丰富，应有尽有。', origin: '《黄帝内经》', example: '这部百科全书包罗万象，无所不有。' },
  { idiom: '杯弓蛇影', pinyin: 'bēi gōng shé yǐng', meaning: '比喻疑神疑鬼，自相惊扰。', origin: '《晋书·乐广传》', example: '你别杯弓蛇影了，根本没人说你坏话。' },
  { idiom: '杯水车薪', pinyin: 'bēi shuǐ chē xīn', meaning: '比喻力量微小，无济于事。', origin: '《孟子·告子上》', example: '这点钱对他来说简直是杯水车薪。' },
  { idiom: '闭门造车', pinyin: 'bì mén zào chē', meaning: '比喻脱离客观实际，只凭主观办事。', origin: '《朱子语类》', example: '闭门造车是做不好科研工作的。' },
  { idiom: '鞭辟入里', pinyin: 'biān pì rù lǐ', meaning: '形容能透彻地说明问题，深入骨髓。', origin: '《论语注》', example: '他的分析鞭辟入里，令人信服。' },
  { idiom: '标新立异', pinyin: 'biāo xīn lì yì', meaning: '提出新奇的主张，表示与一般不同。', origin: '《世说新语·文学》', example: '设计中他总喜欢标新立异。' },
  { idiom: '别具一格', pinyin: 'bié jù yī gé', meaning: '另有一种独特的风格。', origin: '《与施书》', example: '这幅画别具一格，很有特色。' },
  { idiom: '宾至如归', pinyin: 'bīn zhì rú guī', meaning: '客人到这里就像回到自己家里一样，形容招待周到。', origin: '《左传·襄公三十一年》', example: '这家酒店服务热情，让人宾至如归。' },
  { idiom: '冰天雪地', pinyin: 'bīng tiān xuě dì', meaning: '形容冰雪漫天盖地，极其寒冷。', origin: '《西游记》', example: '北方的冬天冰天雪地，十分寒冷。' },
  { idiom: '并驾齐驱', pinyin: 'bìng jià qí qū', meaning: '比喻彼此的力量或才能不分高下。', origin: '《文心雕龙》', example: '两人在学业上并驾齐驱，难分伯仲。' },
  { idiom: '捕风捉影', pinyin: 'bǔ fēng zhuō yǐng', meaning: '比喻说话做事毫无根据。', origin: '《朱子语类》', example: '这些谣言都是捕风捉影，不可信。' },
  { idiom: '不耻下问', pinyin: 'bù chǐ xià wèn', meaning: '不以向地位比自己低、学识比自己差的人请教为耻。', origin: '《论语·公冶长》', example: '做学问要有不耻下问的精神。' },
  { idiom: '不攻自破', pinyin: 'bù gōng zì pò', meaning: '不用攻击，自己就破灭了，多指谣言或理论站不住脚。', origin: '《晋书·刘元海载记》', example: '这个谎言不攻自破，无须多辩。' },
  { idiom: '不寒而栗', pinyin: 'bù hán ér lì', meaning: '不冷却发抖，形容非常害怕。', origin: '《史记·酷吏列传》', example: '听到这个可怕的消息，他不寒而栗。' },
  { idiom: '不遗余力', pinyin: 'bù yí yú lì', meaning: '把全部力量都使出来，毫无保留。', origin: '《战国策·赵策三》', example: '他不遗余力地帮助灾区人民。' },
  { idiom: '不约而同', pinyin: 'bù yuē ér tóng', meaning: '没有事先商量而彼此见解或行动一致。', origin: '《史记·平津侯主父列传》', example: '大家不约而同地鼓起掌来。' },
  { idiom: '不知所措', pinyin: 'bù zhī suǒ cuò', meaning: '不知道怎么办才好，形容受窘或发急。', origin: '《三国志·吴书》', example: '突如其来的变故让他不知所措。' },
  { idiom: '沧海桑田', pinyin: 'cāng hǎi sāng tián', meaning: '比喻世事变化很大。', origin: '《神仙传·麻姑》', example: '几十年过去，这里已是沧海桑田。' },
  { idiom: '草船借箭', pinyin: 'cǎo chuán jiè jiàn', meaning: '运用智谋，凭借他人之力达到自己的目的。', origin: '《三国演义》', example: '他这一招草船借箭，巧妙地解决了资金难题。' },
  { idiom: '差强人意', pinyin: 'chā qiáng rén yì', meaning: '大体上还能使人满意。', origin: '《后汉书·吴汉传》', example: '这次比赛的结果还算差强人意。' },
  { idiom: '车水马龙', pinyin: 'chē shuǐ mǎ lóng', meaning: '车如流水，马如游龙，形容来往车马很多。', origin: '《后汉书·马后纪》', example: '节日的大街上车水马龙，热闹非凡。' },
  { idiom: '称心如意', pinyin: 'chèn xīn rú yì', meaning: '形容心满意足，事情的发展完全符合心意。', origin: '《宋词·感皇恩》', example: '终于找到了一份称心如意的工作。' },
  { idiom: '城下之盟', pinyin: 'chéng xià zhī méng', meaning: '因兵临城下而被迫签订的屈辱性盟约。', origin: '《左传·桓公十二年》', example: '这是城下之盟，我们不得不签。' },
  { idiom: '乘风破浪', pinyin: 'chéng fēng pò làng', meaning: '比喻志向远大，不怕困难，奋勇前进。', origin: '《宋书·宗悫传》', example: '我们要乘风破浪，勇往直前。' },
  { idiom: '乘虚而入', pinyin: 'chéng xū ér rù', meaning: '趁着空虚或虚弱的时候进入。', origin: '《三国志·魏书》', example: '敌人乘虚而入，占领了城池。' },
  { idiom: '出尔反尔', pinyin: 'chū ěr fǎn ěr', meaning: '原意是你怎样对待别人，别人就怎样对待你，后多指言行前后矛盾。', origin: '《孟子·梁惠王下》', example: '做人要讲诚信，不能出尔反尔。' },
  { idiom: '出类拔萃', pinyin: 'chū lèi bá cuì', meaning: '超出同类之上，多指人的品德才能。', origin: '《孟子·公孙丑上》', example: '他是出类拔萃的人才，前途无量。' },
  { idiom: '出奇制胜', pinyin: 'chū qí zhì shèng', meaning: '用奇兵或奇计战胜敌人，比喻用对方意想不到的方法取胜。', origin: '《孙子兵法》', example: '将军出奇制胜，大破敌军。' },
  { idiom: '触目惊心', pinyin: 'chù mù jīng xīn', meaning: '看到某种严重的情况引起内心的震惊。', origin: '《全相平话》', example: '灾后的景象触目惊心。' },
  { idiom: '唇亡齿寒', pinyin: 'chún wáng chǐ hán', meaning: '比喻双方关系密切，利害相关。', origin: '《左传·僖公五年》', example: '两国唇亡齿寒，理应互相支援。' },
  { idiom: '此地无银', pinyin: 'cǐ dì wú yín', meaning: '比喻想要隐瞒掩饰，结果反而暴露。', origin: '《民间故事》', example: '他这番解释简直是此地无银三百两。' },
  { idiom: '打草惊蛇', pinyin: 'dǎ cǎo jīng shé', meaning: '比喻做法不谨慎，反使对方有所戒备。', origin: '《南唐近事》', example: '我们不要打草惊蛇，以免打乱计划。' },
  { idiom: '大刀阔斧', pinyin: 'dà dāo kuò fǔ', meaning: '比喻办事果断而有魄力。', origin: '《水浒传》', example: '新经理上任后大刀阔斧地进行改革。' },
  { idiom: '大海捞针', pinyin: 'dà hǎi lāo zhēn', meaning: '比喻极难找到。', origin: '《西游记》', example: '在茫茫人海中找他，犹如大海捞针。' },
  { idiom: '大器晚成', pinyin: 'dà qì wǎn chéng', meaning: '指能担当重任的人物要经过长期的锻炼，所以成就较晚。', origin: '《老子》', example: '他年过四十才有所成就，可谓大器晚成。' },
  { idiom: '大显身手', pinyin: 'dà xiǎn shēn shǒu', meaning: '充分显露自己的本领。', origin: '《喻世明言》', example: '运动会上，他大显身手，连夺三金。' },
  { idiom: '呆若木鸡', pinyin: 'dāi ruò mù jī', meaning: '呆得像木头鸡一样，形容因恐惧或惊异而发愣的样子。', origin: '《庄子·达生》', example: '听到这个消息，他呆若木鸡。' },
  { idiom: '胆小如鼠', pinyin: 'dǎn xiǎo rú shǔ', meaning: '胆子小得像老鼠，形容非常胆小。', origin: '《史记·刺客列传》', example: '他胆小如鼠，连黑夜都不敢出门。' },
  { idiom: '倒背如流', pinyin: 'dào bèi rú liú', meaning: '把书倒过来背诵都像流水一样流畅，形容读得滚瓜烂熟。', origin: '《三侠五义》', example: '他把课文背得倒背如流。' },
  { idiom: '得寸进尺', pinyin: 'dé cùn jìn chǐ', meaning: '得到一寸就想进一尺，比喻贪得无厌。', origin: '《战国策·秦策》', example: '你已经占了便宜，就不要得寸进尺了。' },
  { idiom: '滴水穿石', pinyin: 'dī shuǐ chuān shí', meaning: '水不断下滴，可以滴穿石头，比喻只要有恒心，事必能成。', origin: '《鹤林玉露》', example: '学习要有滴水穿石的精神。' },
  { idiom: '东施效颦', pinyin: 'dōng shī xiào pín', meaning: '比喻盲目模仿，效果适得其反。', origin: '《庄子·天运》', example: '她这样打扮，简直是东施效颦。' },
  { idiom: '对牛弹琴', pinyin: 'duì niú tán qín', meaning: '比喻对不懂事理的人讲道理或言事。', origin: '《理惑论》', example: '跟他讲道理简直是对牛弹琴。' },
  { idiom: '顿开茅塞', pinyin: 'dùn kāi máo sè', meaning: '比喻思想忽然开窍，立刻明白了某个道理。', origin: '《三国演义》', example: '老师一席话令我顿开茅塞。' },
  { idiom: '多此一举', pinyin: 'duō cǐ yī jǔ', meaning: '做不必要的、多余的事情。', origin: '《陈州粜米》', example: '这事已经办好了，你再去真是多此一举。' },
  { idiom: '阿谀奉承', pinyin: 'ē yú fèng chéng', meaning: '曲意迎合别人的心意，说好听的话讨好。', origin: '《醉醒石》', example: '他靠阿谀奉承得到上司的赏识。' },
  { idiom: '尔虞我诈', pinyin: 'ěr yú wǒ zhà', meaning: '你骗我，我骗你，彼此互相欺骗。', origin: '《左传·宣公十五年》', example: '商场上的尔虞我诈让人疲惫不堪。' },
  { idiom: '发奋图强', pinyin: 'fā fèn tú qiáng', meaning: '振作精神，以求强盛。', origin: '《人民日报》', example: '青年人应当发奋图强，为国争光。' },
  { idiom: '翻山越岭', pinyin: 'fān shān yuè lǐng', meaning: '翻过很多山头，形容野外工作或旅途辛苦。', origin: '《西游记》', example: '红军翻山越岭，终于到达陕北。' },
  { idiom: '放虎归山', pinyin: 'fàng hǔ guī shān', meaning: '比喻把坏人放走，留下后患。', origin: '《三国演义》', example: '放虎归山，必留后患。' },
  { idiom: '飞蛾扑火', pinyin: 'fēi é pū huǒ', meaning: '比喻自寻死路，自取灭亡。', origin: '《梁书·到溉传》', example: '他这样做无异于飞蛾扑火。' },
  { idiom: '分秒必争', pinyin: 'fēn miǎo bì zhēng', meaning: '形容抓紧时间。', origin: '《晋书·陶侃传》', example: '考试前他要分秒必争地复习。' },
  { idiom: '奋发图强', pinyin: 'fèn fā tú qiáng', meaning: '振作精神，努力自强。', origin: '《总理遗嘱》', example: '我们要奋发图强，振兴中华。' },
  { idiom: '风驰电掣', pinyin: 'fēng chí diàn chè', meaning: '形容像刮风闪电那样迅速。', origin: '《六韬·龙韬》', example: '赛车风驰电掣般地驶过。' },
  { idiom: '风调雨顺', pinyin: 'fēng tiáo yǔ shùn', meaning: '形容风雨适合农时。', origin: '《旧唐书·礼仪志》', example: '今年风调雨顺，庄稼大丰收。' },
  { idiom: '风言风语', pinyin: 'fēng yán fēng yǔ', meaning: '没有根据的话，多指毁谤或挑拨的话。', origin: '《醒世恒言》', example: '别听那些风言风语，要相信事实。' },
  { idiom: '锋芒毕露', pinyin: 'fēng máng bì lù', meaning: '锐气和才华全都显露出来，多指人好表现自己。', origin: '《后汉书·袁绍传》', example: '年轻人不要锋芒毕露，要懂得收敛。' },
  { idiom: '扶摇直上', pinyin: 'fú yáo zhí shàng', meaning: '形容地位、名声等迅速上升。', origin: '《庄子·逍遥游》', example: '他的事业扶摇直上，令人羡慕。' },
  { idiom: '浮光掠影', pinyin: 'fú guāng lüè yǐng', meaning: '比喻观察不细致，印象不深刻。', origin: '《水经注》', example: '这次旅行只是浮光掠影，印象不深。' },
  { idiom: '改过自新', pinyin: 'gǎi guò zì xīn', meaning: '改正错误，重新做人。', origin: '《史记·吴王濞列传》', example: '他决心改过自新，重新开始。' },
  { idiom: '高瞻远瞩', pinyin: 'gāo zhān yuǎn zhǔ', meaning: '站得高，看得远，比喻眼光远大。', origin: '《独乐园记》', example: '领导要高瞻远瞩，才能带领团队前进。' },
  { idiom: '各抒己见', pinyin: 'gè shū jǐ jiàn', meaning: '各自发表自己的意见或见解。', origin: '《教条示龙场诸生》', example: '会上大家各抒己见，讨论热烈。' },
  { idiom: '耿耿于怀', pinyin: 'gěng gěng yú huái', meaning: '事情老放在心里，不能忘怀。', origin: '《诗经·邶风》', example: '这点小事不必耿耿于怀。' },
  { idiom: '功亏一篑', pinyin: 'gōng kuī yī kuì', meaning: '堆九仞高的土山，只差一筐土而不能完成，比喻事情将要成功时失败了。', origin: '《尚书·旅獒》', example: '工程即将完工，不能功亏一篑。' },
  { idiom: '勾心斗角', pinyin: 'gōu xīn dòu jiǎo', meaning: '原指宫室结构精巧，后比喻各用心机，互相排挤。', origin: '《阿房宫赋》', example: '同事之间不应勾心斗角。' },
  { idiom: '孤注一掷', pinyin: 'gū zhù yī zhì', meaning: '把全部力量投下去，只图侥幸得胜。', origin: '《宋史·寇准传》', example: '他孤注一掷，把全部积蓄投进了股市。' },
  { idiom: '固执己见', pinyin: 'gù zhí jǐ jiàn', meaning: '顽固地坚持自己的意见，不肯改变。', origin: '《宋史·陈宓传》', example: '他太固执己见，听不进别人的劝告。' },
  { idiom: '刮目相看', pinyin: 'guā mù xiāng kàn', meaning: '用新的眼光来看待。', origin: '《三国志·吴书》', example: '他进步神速，令人刮目相看。' },
  { idiom: '鬼斧神工', pinyin: 'guǐ fǔ shén gōng', meaning: '形容技艺精巧，像鬼神制作的一样。', origin: '《庄子·达生》', example: '这件雕刻鬼斧神工，巧夺天工。' },
  { idiom: '过河拆桥', pinyin: 'guò hé chāi qiáo', meaning: '比喻达到目的后，就把帮助过自己的人一脚踢开。', origin: '《李逵负荆》', example: '过河拆桥的小人，没人愿意和他合作。' },
  { idiom: '海阔天空', pinyin: 'hǎi kuò tiān kōng', meaning: '形容大自然广阔，也形容想象或说话毫无拘束。', origin: '《诗话》', example: '他们海阔天空地聊了一夜。' },
  { idiom: '邯郸学步', pinyin: 'hán dān xué bù', meaning: '比喻模仿别人不到家，反把自己原有的本领丢了。', origin: '《庄子·秋水》', example: '学习外国经验不能邯郸学步。' },
  { idiom: '含辛茹苦', pinyin: 'hán xīn rú kǔ', meaning: '形容忍受各种辛苦。', origin: '《中和胜相院记》', example: '母亲含辛茹苦地把我们养大。' },
  { idiom: '汗牛充栋', pinyin: 'hàn niú chōng dòng', meaning: '形容藏书非常多。', origin: '《陆文通墓表》', example: '他的藏书汗牛充栋，十分丰富。' },
  { idiom: '好高骛远', pinyin: 'hào gāo wù yuǎn', meaning: '脱离实际地追求目前不可能实现的过高目标。', origin: '《宋史·程颢传》', example: '做事要脚踏实地，不能好高骛远。' },
  { idiom: '鹤立鸡群', pinyin: 'hè lì jī qún', meaning: '比喻人的才能或仪表出众。', origin: '《世说新语·容止》', example: '他在人群中鹤立鸡群，十分显眼。' },
  { idiom: '后来居上', pinyin: 'hòu lái jū shàng', meaning: '后来的超过先前的。', origin: '《史记·汲郑列传》', example: '年轻的选手后来居上，夺得冠军。' },
  { idiom: '虎头蛇尾', pinyin: 'hǔ tóu shé wěi', meaning: '比喻做事有始无终，起初声势很大，后来劲头很小。', origin: '《李逵负荆》', example: '做事要善始善终，不能虎头蛇尾。' },
  { idiom: '画蛇添足', pinyin: 'huà shé tiān zú', meaning: '比喻做了多余的事，反而把事情弄糟。', origin: '《战国策·齐策》', example: '这番解释纯属画蛇添足。' },
  { idiom: '欢天喜地', pinyin: 'huān tiān xǐ dì', meaning: '形容非常高兴。', origin: '《西厢记》', example: '孩子们欢天喜地地迎接新年。' },
  { idiom: '挥金如土', pinyin: 'huī jīn rú tǔ', meaning: '花钱像撒土一样，形容极其浪费。', origin: '《赵礼让肥》', example: '他挥金如土，很快就把家产败光。' },
  { idiom: '浑水摸鱼', pinyin: 'hún shuǐ mō yú', meaning: '比喻趁混乱的时机捞取利益。', origin: '《三国演义》', example: '有人趁乱浑水摸鱼，大发横财。' },
  { idiom: '豁然开朗', pinyin: 'huò rán kāi lǎng', meaning: '形容由狭窄幽暗突然变得宽阔明亮，也比喻突然领悟。', origin: '《桃花源记》', example: '听了老师的讲解，我豁然开朗。' },
  { idiom: '饥寒交迫', pinyin: 'jī hán jiāo pò', meaning: '衣食无着，又饿又冷，形容生活极度贫困。', origin: '《晋书·王长文传》', example: '旧社会百姓饥寒交迫，苦不堪言。' },
  { idiom: '鸡鸣狗盗', pinyin: 'jī míng gǒu dào', meaning: '指微不足道的本领，也指偷偷摸摸的行为。', origin: '《史记·孟尝君列传》', example: '这些鸡鸣狗盗之徒，成不了大事。' },
  { idiom: '急功近利', pinyin: 'jí gōng jìn lì', meaning: '急于求成，贪图眼前的利益。', origin: '《管子》', example: '做事不能急功近利，要放眼长远。' },
  { idiom: '济济一堂', pinyin: 'jǐ jǐ yī táng', meaning: '形容很多人有才能的人聚集在一起。', origin: '《书言故事》', example: '今天到会的专家济济一堂。' },
  { idiom: '家喻户晓', pinyin: 'jiā yù hù xiǎo', meaning: '每家每户都知道。', origin: '《宣和书谱》', example: '这个故事家喻户晓，人人皆知。' },
  { idiom: '假公济私', pinyin: 'jiǎ gōng jì sī', meaning: '假借公家的名义，谋取私人的利益。', origin: '《陈州粜米》', example: '他假公济私，中饱私囊。' },
  { idiom: '坚不可摧', pinyin: 'jiān bù kě cuī', meaning: '非常坚固，摧毁不了。', origin: '《原诗·内篇》', example: '我们的友谊坚不可摧。' },
  { idiom: '见义勇为', pinyin: 'jiàn yì yǒng wéi', meaning: '看到正义的事情就勇敢地去做。', origin: '《宋史·叶秀发传》', example: '他见义勇为，抓获了小偷。' },
  { idiom: '江郎才尽', pinyin: 'jiāng láng cái jìn', meaning: '比喻才思减退。', origin: '《南史·江淹传》', example: '这位作家近年江郎才尽，再无佳作。' },
  { idiom: '截然不同', pinyin: 'jié rán bù tóng', meaning: '事物之间界限分明，完全不一样。', origin: '《理学类编》', example: '这两人的性格截然不同。' },
  { idiom: '借花献佛', pinyin: 'jiè huā xiàn fó', meaning: '比喻借用别人的东西做人情。', origin: '《过去现在因果经》', example: '今天借花献佛，请大家共饮此杯。' },
  { idiom: '津津有味', pinyin: 'jīn jīn yǒu wèi', meaning: '形容有滋味，有趣味。', origin: '《朱子语类》', example: '他津津有味地看起了小说。' },
  { idiom: '锦上添花', pinyin: 'jǐn shàng tiān huā', meaning: '比喻使美好的事物更加美好。', origin: '《黄庭坚诗》', example: '这幅画配上这个框，真是锦上添花。' },
  { idiom: '井底之蛙', pinyin: 'jǐng dǐ zhī wā', meaning: '井底下的青蛙，比喻见识短浅的人。', origin: '《庄子·秋水》', example: '你真是井底之蛙，不知天高地厚。' },
  { idiom: '举一反三', pinyin: 'jǔ yī fǎn sān', meaning: '从一件事情类推而知道其他许多事情。', origin: '《论语·述而》', example: '学习要善于举一反三，触类旁通。' },
  { idiom: '刻舟求剑', pinyin: 'kè zhōu qiú jiàn', meaning: '比喻拘泥固执，不知变通。', origin: '《吕氏春秋·察今》', example: '做事要灵活，刻舟求剑是不行的。' },
  { idiom: '空前绝后', pinyin: 'kōng qián jué hòu', meaning: '从前没有过，今后也不会有，夸张性地形容独一无二。', origin: '《宣和画谱》', example: '这场演出堪称空前绝后。' },
  { idiom: '口若悬河', pinyin: 'kǒu ruò xuán hé', meaning: '讲起话来像瀑布奔流，形容能言善辩。', origin: '《世说新语·赏誉》', example: '他口若悬河，滔滔不绝。' },
  { idiom: '脍炙人口', pinyin: 'kuài zhì rén kǒu', meaning: '比喻好的诗文受到人们的称赞和传颂。', origin: '《唐摭言》', example: '李白的诗脍炙人口，千古流传。' },
  { idiom: '滥竽充数', pinyin: 'làn yú chōng shù', meaning: '比喻没有真才实学的人混在行家里面充数。', origin: '《韩非子·内储说》', example: '他在这群专家中只是滥竽充数。' },
  { idiom: '老马识途', pinyin: 'lǎo mǎ shí tú', meaning: '比喻有经验的人对事情比较熟悉，能起引导作用。', origin: '《韩非子·说林上》', example: '有老马识途般的老人指点，少走弯路。' },
  { idiom: '理直气壮', pinyin: 'lǐ zhí qì zhuàng', meaning: '理由正确充分，说话气势旺盛。', origin: '《古今小说》', example: '他理直气壮地驳斥了对方的谬论。' },
  { idiom: '力不从心', pinyin: 'lì bù cóng xīn', meaning: '心里想做，可是力量或能力达不到。', origin: '《后汉书·西域传》', example: '他想帮忙，无奈力不从心。' },
  { idiom: '励精图治', pinyin: 'lì jīng tú zhì', meaning: '振奋精神，想办法治理好国家。', origin: '《汉书·魏相传》', example: '新君主励精图治，国家日益富强。' },
  { idiom: '柳暗花明', pinyin: 'liǔ àn huā míng', meaning: '形容前途似有转机，给人以希望。', origin: '《游山西村》', example: '经过努力，事情终于柳暗花明。' },
  { idiom: '炉火纯青', pinyin: 'lú huǒ chún qīng', meaning: '比喻学问、技术或办事达到了纯熟的地步。', origin: '《孽海花》', example: '他的书法已达到炉火纯青的境界。' },
  { idiom: '屡见不鲜', pinyin: 'lǚ jiàn bù xiān', meaning: '多次见到就不觉得新奇了。', origin: '《史记·游侠列传》', example: '这种事情如今已屡见不鲜。' },
  { idiom: '买椟还珠', pinyin: 'mǎi dú huán zhū', meaning: '比喻没有眼光，取舍不当。', origin: '《韩非子·外储说》', example: '只重包装不重内容，无异于买椟还珠。' },
  { idiom: '毛遂自荐', pinyin: 'máo suí zì jiàn', meaning: '比喻自告奋勇，自己推荐自己。', origin: '《史记·平原君列传》', example: '他毛遂自荐，担任了项目负责人。' },
  { idiom: '门庭若市', pinyin: 'mén tíng ruò shì', meaning: '门口和庭院里热闹得像市场一样，形容来往人多。', origin: '《战国策·齐策》', example: '这家店生意兴隆，门庭若市。' },
  { idiom: '名副其实', pinyin: 'míng fù qí shí', meaning: '名声或名义和实际相符。', origin: '《后汉书·黄琼传》', example: '他是一位名副其实的科学家。' },
  { idiom: '莫名其妙', pinyin: 'mò míng qí miào', meaning: '说不出其中的奥妙，表示事情奇怪或不合情理。', origin: '《九命奇冤》', example: '他突然发脾气，令人莫名其妙。' },
  { idiom: '弄巧成拙', pinyin: 'nòng qiǎo chéng zhuō', meaning: '本想耍弄聪明，结果做了蠢事。', origin: '《宣和画谱》', example: '他本想讨好，结果弄巧成拙。' },
  { idiom: '破釜沉舟', pinyin: 'pò fǔ chén zhōu', meaning: '比喻下定决心，不顾一切地干到底。', origin: '《史记·项羽本纪》', example: '他破釜沉舟，决心创业。' },
  { idiom: '扑朔迷离', pinyin: 'pū shuò mí lí', meaning: '形容事物错综复杂，难以辨别清楚。', origin: '《木兰诗》', example: '案情扑朔迷离，难以侦破。' },
  { idiom: '骑虎难下', pinyin: 'qí hǔ nán xià', meaning: '比喻事情中途遇到困难，但又不能停止。', origin: '《晋书·温峤传》', example: '现在撤资已是骑虎难下。' },
  { idiom: '杞人忧天', pinyin: 'qǐ rén yōu tiān', meaning: '比喻不必要的或缺乏根据的忧虑。', origin: '《列子·天瑞》', example: '你这是杞人忧天，事情没那么糟。' },
  { idiom: '千钧一发', pinyin: 'qiān jūn yī fà', meaning: '比喻情况万分危急。', origin: '《与孟尚书书》', example: '在这千钧一发之际，他挺身而出。' },
  { idiom: '潜移默化', pinyin: 'qián yí mò huà', meaning: '指人的思想或性格不知不觉受到影响而变化。', origin: '《颜氏家训》', example: '良好的家风对孩子有潜移默化的影响。' },
  { idiom: '强词夺理', pinyin: 'qiǎng cí duó lǐ', meaning: '本来没有理，硬说得似乎有理。', origin: '《三国演义》', example: '他强词夺理，谁也说服不了他。' },
  { idiom: '锲而不舍', pinyin: 'qiè ér bù shě', meaning: '不断地雕刻，比喻有恒心，有毅力。', origin: '《荀子·劝学》', example: '他锲而不舍地钻研，终于取得成果。' },
  { idiom: '青出于蓝', pinyin: 'qīng chū yú lán', meaning: '比喻学生超过老师，或后人胜过前人。', origin: '《荀子·劝学》', example: '徒弟青出于蓝而胜于蓝。' },
  { idiom: '轻而易举', pinyin: 'qīng ér yì jǔ', meaning: '形容事情容易做，不费力气。', origin: '《诗话》', example: '这件事对他来说轻而易举。' },
  { idiom: '求之不得', pinyin: 'qiú zhī bù dé', meaning: '想找都找不到，形容难得。', origin: '《诗经·周南》', example: '这个机会真是求之不得。' },
  { idiom: '入木三分', pinyin: 'rù mù sān fēn', meaning: '形容书法笔力强劲，也比喻分析、议论深刻。', origin: '《书断·王羲之》', example: '他的评论入木三分，十分深刻。' },
  { idiom: '塞翁失马', pinyin: 'sài wēng shī mǎ', meaning: '比喻一时虽然受到损失，也许反而因此能得到好处。', origin: '《淮南子·人间训》', example: '这次失败也许是塞翁失马，焉知非福。' },
  { idiom: '三顾茅庐', pinyin: 'sān gù máo lú', meaning: '比喻诚心诚意地邀请人家。', origin: '《出师表》', example: '老板三顾茅庐，请他出山。' },
  { idiom: '赏心悦目', pinyin: 'shǎng xīn yuè mù', meaning: '看到美好的景物而心情愉快。', origin: '《近事会元》', example: '这里的景色赏心悦目。' },
  { idiom: '舍本逐末', pinyin: 'shě běn zhú mò', meaning: '比喻做事不抓根本，而只注意枝节。', origin: '《吕氏春秋》', example: '学习不能舍本逐末。' },
  { idiom: '深思熟虑', pinyin: 'shēn sī shú lǜ', meaning: '反复深入地考虑。', origin: '《上宰相书》', example: '经过深思熟虑，他决定辞职。' },
  { idiom: '守株待兔', pinyin: 'shǒu zhū dài tù', meaning: '比喻死守狭隘经验，不知变通，或妄想不劳而获。', origin: '《韩非子·五蠹》', example: '守株待兔是等不来好结果的。' },
  { idiom: '水落石出', pinyin: 'shuǐ luò shí chū', meaning: '水落下后石头露出，比喻事情的真相完全显露。', origin: '《醉翁亭记》', example: '真相终会水落石出。' },
  { idiom: '司空见惯', pinyin: 'sī kōng jiàn guàn', meaning: '看惯了就不觉得奇怪。', origin: '《本事诗》', example: '这种现象早已司空见惯。' },
  { idiom: '螳臂当车', pinyin: 'táng bì dāng chē', meaning: '比喻不估计自己的力量，去做办不到的事情。', origin: '《庄子·人间世》', example: '他以螳臂当车之势对抗强敌。' },
  { idiom: '天花乱坠', pinyin: 'tiān huā luàn zhuì', meaning: '比喻说话夸大不切实际。', origin: '《法华经》', example: '他把产品吹得天花乱坠。' },
  { idiom: '同舟共济', pinyin: 'tóng zhōu gòng jì', meaning: '坐一条船共同渡河，比喻团结互助，齐心协力。', origin: '《孙子兵法·九地》', example: '我们要同舟共济，共渡难关。' },
  { idiom: '亡羊补牢', pinyin: 'wáng yáng bǔ láo', meaning: '羊跑了再去修补羊圈，比喻出了问题以后想办法补救。', origin: '《战国策·楚策》', example: '亡羊补牢，为时未晚。' },
  { idiom: '望梅止渴', pinyin: 'wàng méi zhǐ kě', meaning: '比喻用空想安慰自己或他人。', origin: '《世说新语·假谲》', example: '画饼充饥，望梅止渴，都不现实。' },
  { idiom: '卧薪尝胆', pinyin: 'wò xīn cháng dǎn', meaning: '形容人刻苦自励，发愤图强。', origin: '《史记·越王勾践世家》', example: '他卧薪尝胆，誓要报仇雪恨。' },
  { idiom: '无微不至', pinyin: 'wú wēi bù zhì', meaning: '没有一处细微的地方不照顾到，形容关怀备至。', origin: '《魏书·宗女传》', example: '母亲对孩子照顾得无微不至。' },
  { idiom: '洗耳恭听', pinyin: 'xǐ ěr gōng tīng', meaning: '专心地、恭敬地听别人讲话。', origin: '《高士传》', example: '请讲，我洗耳恭听。' },
  { idiom: '循序渐进', pinyin: 'xún xù jiàn jìn', meaning: '按一定的顺序、步骤逐渐进步。', origin: '《朱子全书》', example: '学习要循序渐进，不可急于求成。' },
  { idiom: '掩耳盗铃', pinyin: 'yǎn ěr dào líng', meaning: '捂住耳朵偷铃铛，比喻自己欺骗自己。', origin: '《吕氏春秋·自知》', example: '这种做法无异于掩耳盗铃。' },
  { idiom: '一鸣惊人', pinyin: 'yī míng jīng rén', meaning: '比喻平时没有特殊的表现，一下子做出惊人的事情。', origin: '《史记·滑稽列传》', example: '他一鸣惊人，夺得了冠军。' },
  { idiom: '义无反顾', pinyin: 'yì wú fǎn gù', meaning: '在道义上只有勇往直前，不能犹豫回顾。', origin: '《与吴季札书》', example: '他义无反顾地奔赴灾区。' },
  { idiom: '迎刃而解', pinyin: 'yíng rèn ér jiě', meaning: '比喻主要问题解决了，其他问题就容易解决。', origin: '《晋书·杜预传》', example: '找到关键，问题就迎刃而解了。' },
  { idiom: '有备无患', pinyin: 'yǒu bèi wú huàn', meaning: '事先有准备就可以避免祸患。', origin: '《尚书·说命中》', example: '出门多带件衣服，有备无患。' },
  { idiom: '愚公移山', pinyin: 'yú gōng yí shān', meaning: '比喻有毅力，不怕困难，坚持不懈。', origin: '《列子·汤问》', example: '我们要发扬愚公移山的精神。' },
  { idiom: '与日俱增', pinyin: 'yǔ rì jù zēng', meaning: '随着时间的推移而不断增长。', origin: '《吕氏春秋》', example: '他的名气与日俱增。' },
  { idiom: '缘木求鱼', pinyin: 'yuán mù qiú yú', meaning: '比喻方向或方法不对，不可能达到目的。', origin: '《孟子·梁惠王上》', example: '这样下去，无异于缘木求鱼。' },
  { idiom: '朝三暮四', pinyin: 'zhāo sān mù sì', meaning: '原指玩弄手法欺骗人，后比喻反复无常。', origin: '《庄子·齐物论》', example: '他朝三暮四，没有定性。' },
  { idiom: '斩钉截铁', pinyin: 'zhǎn dīng jié tiě', meaning: '形容说话办事坚决果断，毫不犹豫。', origin: '《朱子语类》', example: '他斩钉截铁地拒绝了。' },
  { idiom: '纸上谈兵', pinyin: 'zhǐ shàng tán bīng', meaning: '在纸面上谈论打仗，比喻空谈理论，不能解决实际问题。', origin: '《史记·廉颇蔺相如列传》', example: '只会纸上谈兵是不行的。' },
  { idiom: '志同道合', pinyin: 'zhì tóng dào hé', meaning: '志向相同，道路一致，形容志趣相同。', origin: '《三国志·陈思王传》', example: '他们志同道合，结为好友。' },
  { idiom: '孜孜不倦', pinyin: 'zī zī bù juàn', meaning: '勤奋努力，不知疲倦。', origin: '《三国志·蜀书》', example: '他孜孜不倦地钻研学问。' },
  { idiom: '自相矛盾', pinyin: 'zì xiāng máo dùn', meaning: '比喻自己说话做事前后抵触。', origin: '《韩非子·难一》', example: '他的话自相矛盾，难以自圆其说。' },
  { idiom: '走马观花', pinyin: 'zǒu mǎ guān huā', meaning: '骑在奔跑的马上看花，比喻粗略地观察。', origin: '《登科后》', example: '这次参观只是走马观花。' },
]

const keyword = ref('')
const activeLetter = ref<string>('')
const drawerShow = ref(false)
const current = ref<Idiom | null>(null)

// 首字母列表（基于拼音首字母）
const letters = ['全部', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'W', 'X', 'Y', 'Z']

function firstLetter(idiom: Idiom): string {
  const py = idiom.pinyin.trim()
  if (!py) return '#'
  return py.charAt(0).toUpperCase()
}

function toggleLetter(letter: string) {
  activeLetter.value = activeLetter.value === letter ? '' : letter
}

const filteredIdioms = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  const letter = activeLetter.value
  return idiomData.filter(item => {
    if (letter && letter !== '全部' && firstLetter(item) !== letter) return false
    if (!kw) return true
    return (
      item.idiom.toLowerCase().includes(kw) ||
      item.meaning.toLowerCase().includes(kw) ||
      item.pinyin.toLowerCase().includes(kw)
    )
  })
})

const columns: DataTableColumns<Idiom> = [
  {
    title: '成语',
    key: 'idiom',
    width: 130,
    render: (row) =>
      h('a', {
        class: 'idiom-link',
        onClick: () => showDetail(row),
      }, row.idiom),
  },
  { title: '拼音', key: 'pinyin', width: 180 },
  { title: '释义', key: 'meaning', ellipsis: { tooltip: true } },
]

function showDetail(row: Idiom) {
  current.value = row
  drawerShow.value = true
}

function pickRandom() {
  const item = idiomData[Math.floor(Math.random() * idiomData.length)]
  showDetail(item)
}

// ===== 成语接龙 =====
const chainStarted = ref(false)
const chainList = ref<Idiom[]>([])
const chainInput = ref('')
const chainMsg = ref('')
const chainMsgType = ref<'ok' | 'err'>('ok')

const chainLastChar = computed(() => {
  if (chainList.value.length === 0) return ''
  const last = chainList.value[chainList.value.length - 1]
  return last.idiom.charAt(last.idiom.length - 1)
})

function startChain() {
  const item = idiomData[Math.floor(Math.random() * idiomData.length)]
  chainList.value = [item]
  chainInput.value = ''
  chainMsg.value = ''
  chainStarted.value = true
}

function resetChain() {
  chainStarted.value = false
  chainList.value = []
  chainInput.value = ''
  chainMsg.value = ''
}

function submitChain() {
  const input = chainInput.value.trim()
  if (!input) return
  const target = chainLastChar.value
  if (input.charAt(0) !== target) {
    chainMsg.value = `首字必须为「${target}」，你输入的是「${input.charAt(0)}」。`
    chainMsgType.value = 'err'
    return
  }
  const found = idiomData.find(it => it.idiom === input)
  if (!found) {
    chainMsg.value = `词库中暂无「${input}」这个成语，换一个试试吧。`
    chainMsgType.value = 'err'
    return
  }
  chainList.value.push(found)
  chainInput.value = ''
  chainMsg.value = `接龙成功！下一句请以「${found.idiom.charAt(found.idiom.length - 1)}」开头。`
  chainMsgType.value = 'ok'
}

const pagination = { pageSize: 10 }
</script>

<style scoped>
.idiom-dictionary {
  max-width: 1000px;
  margin: 0 auto;
}

.search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.letter-index {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 20px;
}

.letter-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border-radius: 16px;
  font-size: 13px;
  cursor: pointer;
  background: #f5f5f5;
  color: #666;
  transition: all 0.2s;
  user-select: none;
}

.letter-chip:hover {
  background: #e8f4ff;
  color: #2080f0;
}

.letter-chip.active {
  background: #2080f0;
  color: #fff;
}

.chain-card {
  margin-bottom: 20px;
}

.chain-start {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.chain-hint {
  font-size: 13px;
  color: #888;
}

.chain-flow {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
  align-items: center;
}

.chain-item {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 14px;
  background: #f0f7ff;
  border-radius: 8px;
  border: 1px solid #d6e8ff;
}

.chain-item.match {
  background: #f6ffed;
  border-color: #b7eb8f;
}

.chain-text {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.chain-py {
  font-size: 11px;
  color: #888;
  margin-top: 2px;
}

.chain-tip {
  margin-bottom: 10px;
  font-size: 13px;
  color: #555;
}

.chain-tip b {
  color: #f56c6c;
  font-size: 16px;
}

.chain-input-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.chain-msg {
  margin-top: 10px;
  font-size: 13px;
  padding: 6px 10px;
  border-radius: 4px;
}

.chain-msg.ok {
  color: #36ad6a;
  background: #f6ffed;
}

.chain-msg.err {
  color: #f56c6c;
  background: #fef0f0;
}

.idiom-table :deep(.idiom-link) {
  color: #2080f0;
  cursor: pointer;
  font-weight: 600;
}

.idiom-table :deep(.idiom-link:hover) {
  text-decoration: underline;
}

.detail {
  padding: 4px 0;
}

.detail-row {
  margin-bottom: 16px;
}

.detail-label {
  display: inline-block;
  min-width: 56px;
  font-weight: 600;
  color: #888;
  font-size: 13px;
  margin-right: 8px;
}

.detail-value {
  color: #333;
  font-size: 14px;
  line-height: 1.8;
}

/* 深色模式 */
.dark .letter-chip {
  background: #2a2a3e;
  color: #aaa;
}

.dark .letter-chip:hover {
  background: #1c2a4a;
  color: #5b9bf5;
}

.dark .letter-chip.active {
  background: #2080f0;
  color: #fff;
}

.dark .chain-item {
  background: #1c2a4a;
  border-color: #2a3a5a;
}

.dark .chain-item.match {
  background: rgba(54, 173, 106, 0.12);
  border-color: rgba(54, 173, 106, 0.4);
}

.dark .chain-text {
  color: #e0e0e0;
}

.dark .chain-py {
  color: #888;
}

.dark .chain-tip {
  color: #bbb;
}

.dark .chain-hint {
  color: #888;
}

.dark .chain-msg.ok {
  background: rgba(54, 173, 106, 0.1);
}

.dark .chain-msg.err {
  background: rgba(245, 108, 108, 0.1);
}

.dark .detail-label {
  color: #888;
}

.dark .detail-value {
  color: #e0e0e0;
}

@media (max-width: 600px) {
  .search-bar {
    flex-direction: column;
  }
  .chain-input-row {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
