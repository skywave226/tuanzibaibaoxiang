<template>
  <div class="pinyin-converter">
    <n-card size="small" class="input-card">
      <div class="mode-bar">
        <span class="mode-label">输出模式：</span>
        <n-radio-group v-model:value="mode" name="pinyin-mode">
          <n-radio-button value="tone">带声调 (pīnyīn)</n-radio-button>
          <n-radio-button value="normal">无声调 (pinyin)</n-radio-button>
          <n-radio-button value="initial">首字母 (py)</n-radio-button>
        </n-radio-group>
      </div>

      <div class="text-area-wrap">
        <label class="area-label">输入中文</label>
        <n-input
          v-model:value="inputText"
          type="textarea"
          :autosize="{ minRows: 4, maxRows: 10 }"
          placeholder="在此输入中文文本，将自动转换为拼音…"
        />
      </div>

      <div class="text-area-wrap">
        <label class="area-label">拼音结果</label>
        <div class="output-box" v-if="outputText">{{ outputText }}</div>
        <div class="output-box placeholder" v-else>转换结果将显示在此</div>
      </div>

      <div class="actions">
        <n-button @click="copyResult" :disabled="!outputText">复制结果</n-button>
        <n-button @click="clearAll" :disabled="!inputText">清空</n-button>
        <n-button text @click="loadExample">示例</n-button>
      </div>
    </n-card>

    <!-- 多音字提示 -->
    <n-card v-if="polyphones.length > 0" size="small" title="多音字提示" class="poly-card">
      <div class="poly-list">
        <div v-for="p in polyphones" :key="p.char" class="poly-item">
          <span class="poly-char">{{ p.char }}</span>
          <div class="poly-readings">
            <n-tag
              v-for="(r, i) in p.readings"
              :key="r"
              size="small"
              :type="i === 0 ? 'success' : 'default'"
            >
              {{ r }}
            </n-tag>
          </div>
        </div>
      </div>
      <div class="poly-tip">提示：默认取第一读音，多音字以绿色标记。</div>
    </n-card>

    <!-- 统计 -->
    <div class="stats-bar" v-if="inputText">
      <span>汉字数：{{ stats.hanzi }}</span>
      <span>非汉字字符：{{ stats.others }}</span>
      <span>未识别：{{ stats.unknown }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NCard, NInput, NRadioGroup, NRadioButton, NButton, NTag, useMessage } from 'naive-ui'

type Mode = 'tone' | 'normal' | 'initial'

const mode = ref<Mode>('tone')
const message = useMessage()

// ===== 拼音数据：按读音（带声调）分组，值为该读音下的常用汉字 =====
// 一个汉字可能出现在多个读音组中（多音字）
const pinyinData: Record<string, string> = {
  // a
  'ā': '啊阿呵腌锕',
  'á': '嗄',
  'ǎ': '啊',
  'à': '啊',
  'ai': '哎',
  'āi': '哀挨埃唉哎锿',
  'ái': '挨癌皑崖捱',
  'ǎi': '矮蔼霭哎',
  'ài': '爱碍艾隘暧嗳瑷',
  // an
  'ān': '安氨庵谙鹌鞍桉',
  'ǎn': '俺埯',
  'àn': '岸按案暗黯犴',
  // ang
  'āng': '肮',
  'ǎng': '盎',
  // ao
  'āo': '凹熬',
  'áo': '熬敖嗷遨獒聱鳌翱',
  'ǎo': '袄拗媪',
  'ào': '奥傲澳懊拗岙',
  // ba
  'bā': '八巴吧疤芭笆粑',
  'bá': '拔跋魃',
  'bǎ': '把靶',
  'bà': '爸罢霸坝灞',
  'ba': '吧罢',
  // bai
  'bāi': '掰',
  'bái': '白',
  'bǎi': '百柏摆佰伯',
  'bài': '败拜稗',
  // ban
  'bān': '班般搬斑颁扳瘢',
  'bǎn': '板版钣阪',
  'bàn': '半拌伴办绊扮瓣',
  // bang
  'bāng': '帮邦傍榜梆',
  'bǎng': '绑榜膀',
  'bàng': '棒磅傍蚌',
  // bao
  'bāo': '包苞胞孢剥煲龅',
  'báo': '薄雹',
  'bǎo': '宝保堡饱褓葆鸨',
  'bào': '报抱豹暴爆鲍刨曝',
  // bei
  'bēi': '杯卑背悲碑鹎',
  'běi': '北',
  'bèi': '贝倍备背被辈钡悖狈焙蓓惫',
  'bei': '呗',
  // ben
  'bēn': '奔苯贲锛',
  'běn': '本苯畚',
  'bèn': '笨奔',
  // beng
  'bēng': '崩绷嘣',
  'běng': '绷',
  'bèng': '蹦泵绷',
  // bi
  'bī': '逼',
  'bí': '鼻荸',
  'bǐ': '比彼笔鄙币必',
  'bì': '必毕闭辟碧臂避壁弊毕毙币泌秘陛毙毖蔽弊薜篦裨',
  'bi': '吧',
  // bian
  'biān': '边编鞭鳊砭',
  'biǎn': '扁贬',
  'biàn': '便变遍辩辨辫辨',
  // biao
  'biāo': '标彪膘镖飙骠',
  'biǎo': '表婊裱',
  'biào': '鳔',
  // bie
  'biē': '憋瘪',
  'bié': '别蹩',
  'biě': '瘪',
  'biè': '别',
  // bin
  'bīn': '宾滨彬斌濒缤槟傧',
  'bìn': '摈殡膑髌',
  // bing
  'bīng': '冰兵槟',
  'bǐng': '丙柄饼秉禀炳',
  'bìng': '并病摒',
  // bo
  'bō': '波拨播玻钵剥菠饣',
  'bó': '伯驳博搏薄泊拨勃帛舶脖卜渤礴驳',
  'bǒ': '跛簸',
  'bò': '擘檗薄荷',
  // bu
  'bǔ': '补捕哺',
  'bù': '不布步部埠簿布怖',
  // ca
  'cā': '擦',
  // cai
  'cāi': '猜',
  'cái': '才材财裁栽',
  'cǎi': '采彩踩彩',
  'cài': '菜蔡',
  // can
  'cān': '参餐',
  'cán': '残惭蚕',
  'cǎn': '惨',
  'càn': '灿璨',
  // cang
  'cāng': '仓沧苍舱',
  'cáng': '藏',
  // cao
  'cāo': '操糙',
  'cáo': '曹槽嘈',
  'cǎo': '草',
  // ce
  'cè': '册策厕侧测侧',
  // cen
  'cén': '岑',
  'cēn': '参',
  // ceng
  'cēng': '噌',
  'céng': '曾层',
  'cèng': '蹭',
  // cha
  'chā': '叉插差查喳嚓',
  'chá': '茶查察茬碴搽',
  'chǎ': '叉衩',
  'chà': '岔诧刹差衩',
  // chai
  'chāi': '拆差钗',
  'chái': '柴豺',
  // chan
  'chān': '搀掺',
  'chán': '缠蝉馋禅婵潺蟾',
  'chǎn': '铲产阐',
  'chàn': '颤忏',
  // chang
  'chāng': '昌猖娼菖',
  'cháng': '长场肠常尝偿偿裳',
  'chǎng': '厂场敞',
  'chàng': '畅唱倡怅',
  // chao
  'chāo': '抄钞超怊',
  'cháo': '朝潮巢嘲',
  'chǎo': '吵炒',
  'chào': '耖',
  // che
  'chē': '车',
  'chě': '扯',
  'chè': '彻撤澈',
  // chen
  'chēn': '抻嗔',
  'chén': '沉辰晨陈臣尘忱宸',
  'chěn': '碜',
  'chèn': '称衬趁谶',
  // cheng
  'chēng': '称撑撑铛',
  'chéng': '成城程承乘诚惩橙澄盛丞',
  'chěng': '逞',
  'chèng': '秤',
  // chi
  'chī': '吃痴哧',
  'chí': '迟池弛驰匙踟',
  'chǐ': '齿耻侈',
  'chì': '翅斥赤炽叱',
  // chong
  'chōng': '冲充憧艟',
  'chóng': '虫重崇种',
  'chǒng': '宠',
  'chòng': '冲',
  // chou
  'chōu': '抽',
  'chóu': '愁仇筹酬绸稠仇仇畴踌',
  'chǒu': '丑瞅',
  'chòu': '臭',
  // chu
  'chū': '初出猪',
  'chú': '除厨橱锄雏躇蹰',
  'chǔ': '处楚储础杵',
  'chù': '处畜触搐憷',
  // chuai
  'chuāi': '揣',
  'chuǎi': '揣',
  'chuài': '啜',
  // chuan
  'chuān': '川穿',
  'chuán': '传船椽',
  'chuǎn': '喘',
  'chuàn': '串钏',
  // chuang
  'chuāng': '窗疮创',
  'chuáng': '床',
  'chuǎng': '闯',
  'chuàng': '创',
  // chui
  'chuī': '吹炊',
  'chuí': '垂锤捶陲',
  // chun
  'chūn': '春椿',
  'chún': '纯唇淳醇',
  'chǔn': '蠢',
  // chuo
  'chuō': '戳',
  'chuò': '辍绰龊啜',
  // ci
  'cī': '差',
  'cí': '词瓷慈磁辞词茨雌',
  'cǐ': '此',
  'cì': '次刺赐',
  // cong
  'cōng': '匆葱聪骢',
  'cóng': '从丛淙',
  // cou
  'còu': '凑',
  // cu
  'cū': '粗',
  'cù': '促醋簇蹙蹴',
  // cuan
  'cuān': '蹿',
  'cuán': '攒',
  'cuàn': '篡窜',
  // cui
  'cuī': '催摧崔',
  'cuǐ': '璀',
  'cuì': '脆翠萃淬粹瘁',
  // cun
  'cūn': '村',
  'cún': '存蹲',
  'cǔn': '忖',
  'cùn': '寸',
  // cuo
  'cuō': '搓磋蹉撮',
  'cuó': '痤',
  'cuǒ': '挫措错锉',
  // da
  'dā': '搭耷哒',
  'dá': '答达瘩打鞑',
  'dǎ': '打',
  'dà': '大',
  // dai
  'dāi': '呆',
  'dǎi': '歹逮',
  'dài': '代带戴袋待怠贷逮岱殆',
  // dan
  'dān': '担丹单耽郸',
  'dǎn': '胆',
  'dàn': '旦但弹蛋淡诞氮惮',
  // dang
  'dāng': '当铛',
  'dǎng': '挡党',
  'dàng': '当荡档',
  // dao
  'dāo': '刀叨',
  'dǎo': '导岛倒捣祷蹈',
  'dào': '到道倒盗稻悼',
  // de
  'dé': '得德',
  'de': '的底',
  'děi': '得',
  // deng
  'dēng': '登灯',
  'dèng': '邓凳瞪蹬',
  // di
  'dī': '低堤滴嘀',
  'dí': '敌笛迪狄的涤翟嫡',
  'dǐ': '底抵',
  'dì': '地弟帝第递的蒂缔谛',
  // dia
  'diā': '嗲',
  // dian
  'diān': '颠癫滇',
  'diǎn': '点典碘踮',
  'diàn': '电店店垫殿淀惦奠靛',
  // diao
  'diāo': '雕凋刁貂碉',
  'diǎo': '鸟',
  'diào': '掉吊钓调',
  // die
  'diē': '跌爹',
  'dié': '叠蝶迭谍碟喋垤',
  // ding
  'dīng': '丁叮盯钉',
  'dǐng': '顶鼎',
  'dìng': '定订钉腚',
  // diu
  'diū': '丢',
  // dong
  'dōng': '东冬咚',
  'dǒng': '董懂',
  'dòng': '动洞冻栋栋',
  // dou
  'dōu': '都兜',
  'dòu': '斗豆逗痘抖陡',
  // du
  'dū': '都督嘟',
  'dú': '读毒独督渡犊',
  'dǔ': '赌堵肚睹',
  'dù': '度渡肚杜妒镀',
  // duan
  'duān': '端',
  'duǎn': '短',
  'duàn': '段断缎锻',
  // dui
  'duī': '堆',
  'duì': '对队兑',
  // dun
  'dūn': '吨敦墩蹲',
  'dùn': '顿盾钝遁',
  // duo
  'duō': '多哆掇',
  'duó': '夺度踱铎',
  'duǒ': '朵躲',
  'duò': '堕剁舵跺',
  // e
  'ē': '阿',
  'é': '鹅蛾额俄峨',
  'ě': '恶',
  'è': '恶饿厄扼鳄遏谔',
  'e': '饿',
  // ei
  'ēi': '诶',
  'éi': '诶',
  'ěi': '诶',
  'èi': '诶',
  // en
  'ēn': '恩',
  'èn': '嗯',
  // er
  'ér': '儿而',
  'ěr': '耳尔饵洱',
  'èr': '二贰',
  // fa
  'fā': '发',
  'fá': '乏罚阀伐',
  'fǎ': '法',
  'fà': '发珐',
  // fan
  'fān': '番翻帆幡藩',
  'fán': '凡烦繁樊矾藩',
  'fǎn': '反返',
  'fàn': '犯饭泛范贩梵',
  // fang
  'fāng': '方芳坊',
  'fáng': '房防妨肪',
  'fǎng': '访仿纺',
  'fàng': '放',
  // fei
  'fēi': '飞非啡菲扉绯',
  'féi': '肥',
  'fěi': '匪斐蜚翡',
  'fèi': '废费肺沸菲',
  // fen
  'fēn': '分纷芬吩',
  'fén': '坟焚',
  'fěn': '粉',
  'fèn': '分份奋愤粪',
  // feng
  'fēng': '风丰封峰蜂锋枫疯烽',
  'féng': '逢缝',
  'fěng': '讽',
  'fèng': '奉凤缝俸',
  // fo
  'fó': '佛',
  // fou
  'fǒu': '否缶',
  // fu
  'fū': '夫肤敷孵麸',
  'fú': '夫服福扶符浮俯伏弗芙',
  'fǔ': '府斧腐俯甫抚辅',
  'fù': '父妇复负副富附付腹赋覆傅缚',
  // ga
  'gā': '伽嘎',
  'gá': '嘎',
  'gǎ': '嘎',
  // gai
  'gāi': '该',
  'gǎi': '改',
  'gài': '盖概钙溉丐',
  // gan
  'gān': '干甘杆肝柑竿',
  'gǎn': '杆敢感赶擀',
  'gàn': '干赣',
  // gang
  'gāng': '刚钢岗缸纲罡',
  'gǎng': '岗港',
  'gàng': '杠',
  // gao
  'gāo': '高糕膏羔睾',
  'gǎo': '稿搞镐',
  'gào': '告',
  // ge
  'gē': '哥歌戈搁鸽割疙',
  'gé': '革格阁隔葛骼蛤',
  'gě': '葛盖舸',
  'gè': '个各',
  // gei
  'gěi': '给',
  // gen
  'gēn': '根跟',
  'gén': '哏',
  'gěn': '艮',
  'gèn': '亘',
  // geng
  'gēng': '更耕羹',
  'gěng': '梗埂哽',
  'gèng': '更',
  // gong
  'gōng': '工公功攻宫弓恭躬龚',
  'gǒng': '拱巩',
  'gòng': '共贡供',
  // gou
  'gōu': '沟钩勾',
  'gǒu': '狗苟岣',
  'gòu': '够购构垢',
  // gu
  'gū': '估姑孤辜咕沽蛄',
  'gǔ': '古谷骨鼓股贾',
  'gù': '故固顾雇骨',
  // gua
  'guā': '瓜刮呱',
  'guǎ': '寡',
  'guà': '挂褂',
  // guai
  'guāi': '乖',
  'guǎi': '拐',
  'guài': '怪',
  // guan
  'guān': '关观官棺冠',
  'guǎn': '管馆',
  'guàn': '灌惯冠贯',
  // guang
  'guāng': '光胱',
  'guǎng': '广',
  'guàng': '逛',
  // gui
  'guī': '归龟规闺',
  'guǐ': '鬼轨诡',
  'guì': '贵桂柜跪',
  // gun
  'gǔn': '滚',
  'gùn': '棍',
  // guo
  'guō': '锅郭涡蝈',
  'guó': '国',
  'guǒ': '果裹',
  'guò': '过',
  // ha
  'hā': '哈',
  'hǎ': '哈',
  'hà': '哈',
  // hai
  'hāi': '咳嗨',
  'hái': '孩还骸',
  'hǎi': '海',
  'hài': '害骇',
  // han
  'hān': '鼾酣',
  'hán': '寒韩含涵函晗',
  'hǎn': '罕喊',
  'hàn': '汉旱汗汉憾焊翰',
  // hang
  'hāng': '夯',
  'háng': '行航杭',
  'hàng': '行',
  // hao
  'hāo': '蒿嚆',
  'háo': '豪毫号貉',
  'hǎo': '好',
  'hào': '号好耗浩皓',
  // he
  'hē': '喝诃',
  'hé': '禾和河合盒核何荷贺曷',
  'hè': '贺喝荷鹤赫褐',
  // hei
  'hēi': '黑嘿',
  // hen
  'hén': '痕',
  'hěn': '狠很',
  'hèn': '恨',
  // heng
  'hēng': '哼',
  'héng': '横恒衡蘅',
  'hèng': '横',
  // hong
  'hōng': '轰哄烘',
  'hóng': '红洪宏弘虹鸿',
  'hǒng': '哄',
  'hòng': '哄',
  // hou
  'hōu': '齁',
  'hóu': '猴喉侯',
  'hǒu': '吼',
  'hòu': '后候厚侯',
  // hu
  'hū': '乎呼忽糊惚',
  'hú': '胡湖壶狐弧核斛',
  'hǔ': '虎唬',
  'hù': '户护互糊',
  // hua
  'huā': '花华哗',
  'huá': '华滑猾',
  'huǎ': '化',
  'huà': '话化画划',
  // huai
  'huái': '怀徊淮槐',
  'huài': '坏',
  // huan
  'huān': '欢',
  'huán': '还环',
  'huǎn': '缓',
  'huàn': '换患幻唤焕涣',
  // huang
  'huāng': '荒慌',
  'huáng': '黄皇煌惶凰',
  'huǎng': '谎晃幌',
  'huàng': '晃',
  // hui
  'huī': '灰挥辉恢晖徽',
  'huí': '回',
  'huǐ': '悔毁',
  'huì': '会汇惠慧贿秽晦讳绘',
  // hun
  'hūn': '昏婚荤',
  'hún': '浑魂',
  'hùn': '混浑',
  // huo
  'huō': '豁劐',
  'huó': '活',
  'huǒ': '火伙',
  'huò': '货或获祸惑霍豁',
  // ji
  'jī': '机鸡饥叽讥击积基激迹稽奇',
  'jí': '及级极吉即急疾棘集籍辑嫉藉',
  'jǐ': '己几给脊戟',
  'jì': '计记纪济技季既寄忌际剂',
  // jia
  'jiā': '家加佳嘉夹枷',
  'jiá': '夹荚颊',
  'jiǎ': '假甲钾',
  'jià': '价架驾嫁',
  'jia': '家',
  // jian
  'jiān': '间尖坚艰监兼煎肩渐',
  'jiǎn': '检减剪简柬碱拣',
  'jiàn': '见件间建健剑贱践践鉴键',
  // jiang
  'jiāng': '江将浆姜僵疆',
  'jiǎng': '讲奖桨蒋',
  'jiàng': '将匠酱降强',
  // jiao
  'jiāo': '交教焦胶郊浇骄椒',
  'jiáo': '嚼',
  'jiǎo': '角脚狡绞饺剿缴',
  'jiào': '觉教叫较轿窖',
  // jie
  'jiē': '阶接结街揭皆秸',
  'jié': '节杰洁结捷截劫竭',
  'jiě': '姐解',
  'jiè': '介界借戒届',
  // jin
  'jīn': '金今斤巾筋禁襟',
  'jǐn': '仅紧谨锦',
  'jìn': '进近禁尽劲浸晋',
  // jing
  'jīng': '京惊经精晶睛兢',
  'jǐng': '景颈警井',
  'jìng': '境敬静竞净镜竟',
  // jiong
  'jiōng': '炯迥',
  'jiǒng': '迥',
  // jiu
  'jiū': '究纠揪鸠赳阄',
  'jiǔ': '九久酒玖',
  'jiù': '旧救就舅咎疚厩',
  // ju
  'jū': '居拘驹鞠',
  'jú': '局桔菊橘',
  'jǔ': '举咀矩',
  'jù': '巨句拒具俱距剧聚锯',
  // juan
  'juān': '捐涓鹃',
  'juǎn': '卷',
  'juàn': '倦眷卷',
  // jue
  'jué': '决诀绝觉爵嚼倔崛',
  'juě': '倔',
  // jun
  'jūn': '军均君',
  'jùn': '俊峻骏竣菌',
  // ka
  'kā': '喀咖咔',
  'kǎ': '卡咯',
  // kai
  'kāi': '开揩',
  'kǎi': '楷凯',
  'kài': '慨',
  // kan
  'kān': '看刊勘',
  'kǎn': '砍坎侃',
  'kàn': '看',
  // kang
  'kāng': '康慷糠',
  'kàng': '抗炕亢',
  // kao
  'kāo': '尻',
  'kǎo': '考烤拷',
  'kào': '靠铐',
  // ke
  'kē': '科棵颗磕蝌',
  'ké': '咳壳',
  'kě': '可渴',
  'kè': '客课刻克可',
  // ken
  'kěn': '肯啃恳垦',
  'kèn': '裉',
  // keng
  'kēng': '坑吭铿',
  // kong
  'kōng': '空空',
  'kǒng': '孔恐',
  'kòng': '空控',
  // kou
  'kōu': '抠',
  'kǒu': '口',
  'kòu': '扣寇',
  // ku
  'kū': '哭枯窟',
  'kǔ': '苦',
  'kù': '库裤酷',
  // kua
  'kuā': '夸',
  'kuǎ': '垮侉',
  'kuà': '跨挎',
  // kuai
  'kuài': '快块筷会',
  'kuǎi': '蒯',
  // kuan
  'kuān': '宽',
  'kuǎn': '款',
  // kuang
  'kuāng': '筐匡',
  'kuáng': '狂',
  'kuàng': '况矿框旷',
  // kui
  'kuī': '亏窥盔',
  'kuí': '魁葵奎',
  'kuǐ': '傀跬',
  'kuì': '愧馈溃匮',
  // kun
  'kūn': '坤昆',
  'kǔn': '捆',
  'kùn': '困',
  // kuo
  'kuò': '扩括阔廓',
  // la
  'lā': '拉垃啦',
  'lá': '拉旯',
  'lǎ': '喇',
  'là': '腊蜡辣落',
  // lai
  'lái': '来',
  'lài': '赖癞',
  // lan
  'lán': '兰蓝栏篮澜',
  'lǎn': '懒揽览榄',
  'làn': '烂滥',
  // lang
  'láng': '郎狼廊',
  'lǎng': '朗',
  'làng': '浪',
  // lao
  'lāo': '捞',
  'láo': '劳牢唠崂',
  'lǎo': '老佬',
  'lào': '涝烙落',
  // le
  'le': '了',
  'lè': '乐勒',
  // lei
  'lēi': '勒',
  'léi': '雷蕾累擂',
  'lěi': '垒磊累',
  'lèi': '类泪累肋',
  // leng
  'léng': '棱',
  'lěng': '冷',
  'lèng': '愣',
  // li
  'lī': '哩',
  'lí': '离梨犁璃厘狸',
  'lǐ': '里理李礼',
  'lì': '力立利历厉励丽例',
  // lia
  'liǎ': '俩',
  // lian
  'lián': '连联莲廉怜帘',
  'liǎn': '脸敛',
  'liàn': '练炼链恋',
  // liang
  'liáng': '凉梁粮良',
  'liǎng': '两',
  'liàng': '亮谅量',
  // liao
  'liāo': '撩',
  'liáo': '辽聊疗撩',
  'liǎo': '了',
  'liào': '料撂廖',
  // lie
  'liē': '咧',
  'lié': '裂',
  'liě': '咧',
  'liè': '列烈猎劣裂',
  // lin
  'lín': '林临邻磷淋',
  'lǐn': '凛',
  'lìn': '吝淋',
  // ling
  'líng': '零龄铃伶灵凌陵',
  'lǐng': '领岭',
  'lìng': '另令',
  // liu
  'liū': '溜',
  'liú': '刘留流硫榴琉',
  'liǔ': '柳',
  'liù': '六溜',
  // long
  'lóng': '龙隆笼聋',
  'lǒng': '拢笼',
  'lòng': '弄',
  // lou
  'lōu': '搂',
  'lóu': '楼娄搂',
  'lǒu': '搂篓',
  'lòu': '漏陋露',
  // lu
  'lū': '撸',
  'lú': '卢芦炉庐',
  'lǔ': '鲁虏',
  'lù': '路陆录鹿露绿',
  // luan
  'luán': '峦滦銮',
  'luǎn': '卵',
  'luàn': '乱',
  // lue
  'lüè': '略掠',
  // lun
  'lún': '轮伦仑',
  'lùn': '论',
  // luo
  'luō': '罗捋',
  'luó': '罗螺锣箩',
  'luǒ': '裸',
  'luò': '落洛骆络',
  // lv
  'lǚ': '吕旅履缕',
  'lǜ': '律绿虑率滤',
  // ma
  'mā': '妈摩抹',
  'má': '麻',
  'mǎ': '马玛码',
  'mà': '骂',
  'ma': '吗嘛',
  // mai
  'mái': '埋买',
  'mǎi': '买',
  'mài': '卖麦脉',
  // man
  'mān': '颟',
  'mán': '蛮馒瞒鳗',
  'mǎn': '满',
  'màn': '慢漫蔓',
  // mang
  'máng': '忙茫盲芒',
  'mǎng': '莽蟒',
  // mao
  'māo': '猫',
  'máo': '毛矛茅锚髦',
  'mǎo': '卯',
  'mào': '冒贸帽貌茂',
  // me
  'me': '么麽',
  // mei
  'méi': '没梅煤枚眉霉玫',
  'měi': '每美镁',
  'mèi': '妹媚寐昧',
  // men
  'mēn': '闷',
  'mén': '门',
  'mèn': '闷',
  'men': '们',
  // meng
  'méng': '蒙盟萌蒙',
  'měng': '猛锰蜢',
  'mèng': '梦孟',
  // mi
  'mī': '眯',
  'mí': '迷弥谜糜',
  'mǐ': '米靡',
  'mì': '密蜜秘觅',
  // mian
  'mián': '棉眠绵',
  'miǎn': '免勉娩缅',
  'miàn': '面',
  // miao
  'miāo': '喵',
  'miáo': '苗描',
  'miǎo': '秒渺藐',
  'miào': '妙庙',
  // mie
  'miē': '咩',
  'miè': '灭蔑',
  // min
  'mín': '民',
  'mǐn': '敏抿悯',
  // ming
  'míng': '名明鸣铭冥',
  'mǐng': '酩',
  'mìng': '命',
  // miu
  'miù': '谬',
  // mo
  'mō': '摸',
  'mó': '模磨魔摩膜蘑',
  'mǒ': '抹',
  'mò': '末莫漠没磨默墨陌',
  // mou
  'mōu': '哞',
  'móu': '谋牟眸',
  'mǒu': '某',
  // mu
  'mú': '模',
  'mǔ': '母亩牡姆',
  'mù': '木目幕墓慕牧穆募',
  // na
  'nā': '那南',
  'ná': '拿',
  'nǎ': '哪',
  'nà': '那纳钠',
  'na': '呐',
  // nai
  'nǎi': '乃奶',
  'nài': '耐奈',
  // nan
  'nán': '南男难',
  'nàn': '难',
  // nang
  'nāng': '囊',
  'náng': '囊',
  // nao
  'náo': '挠挠脑',
  'nǎo': '脑恼',
  'nào': '闹',
  // ne
  'ne': '呢',
  'nè': '讷',
  // nei
  'néi': '内',
  // nen
  'nèn': '嫩',
  // neng
  'néng': '能',
  // ni
  'ní': '尼泥妮',
  'nǐ': '你拟',
  'nì': '逆腻溺匿',
  // nian
  'nián': '年粘黏',
  'niǎn': '碾捻',
  'niàn': '念',
  // niang
  'niáng': '娘',
  // niao
  'niǎo': '鸟',
  'niào': '尿',
  // nie
  'niē': '捏',
  'niè': '聂涅孽',
  // nin
  'nín': '您',
  // ning
  'níng': '宁凝拧',
  'nìng': '宁泞',
  // niu
  'niū': '妞',
  'niú': '牛',
  'niǔ': '扭纽',
  'niù': '拗',
  // nong
  'nóng': '农浓脓',
  'nǒng': '弄',
  'nòng': '弄',
  // nou
  'nòu': '耨',
  // nu
  'nú': '奴',
  'nǔ': '努',
  'nù': '怒',
  // nuan
  'nuǎn': '暖',
  // nüe
  'nüè': '虐',
  // nuo
  'nuó': '挪娜',
  'nuò': '诺懦糯',
  // o
  'ó': '哦',
  'ò': '哦',
  'o': '哦',
  // ou
  'ōu': '欧鸥殴',
  'ǒu': '偶藕',
  'òu': '呕怄',
  // pa
  'pā': '趴啪',
  'pá': '爬扒',
  'pà': '怕帕',
  // pai
  'pāi': '拍',
  'pái': '排牌徘',
  'pǎi': '迫',
  'pài': '派湃',
  // pan
  'pān': '攀潘',
  'pán': '盘磐蹒',
  'pàn': '盼叛畔判',
  // pang
  'pāng': '乓膀',
  'páng': '旁庞螃磅',
  'pǎng': '耪',
  'pàng': '胖',
  // pao
  'pāo': '抛泡',
  'páo': '袍刨咆',
  'pǎo': '跑',
  'pào': '炮泡',
  // pei
  'pēi': '呸',
  'péi': '培赔陪裴',
  'pèi': '配佩沛',
  // pen
  'pēn': '喷',
  'pén': '盆',
  // peng
  'pēng': '砰烹',
  'péng': '朋彭棚蓬鹏',
  'pěng': '捧',
  'pèng': '碰',
  // pi
  'pī': '批披劈坯',
  'pí': '皮疲啤脾匹',
  'pǐ': '匹劈痞',
  'pì': '辟僻屁譬',
  // pian
  'piān': '篇偏翩',
  'piàn': '片骗',
  // piao
  'piāo': '飘漂',
  'piáo': '瓢',
  'piǎo': '漂',
  'piào': '票漂',
  // pie
  'piē': '撇',
  'piě': '撇',
  // pin
  'pīn': '拼',
  'pín': '贫频',
  'pǐn': '品',
  'pìn': '聘',
  // ping
  'pīng': '乒',
  'píng': '平评苹萍凭瓶',
  // po
  'pō': '泊泼颇',
  'pó': '婆',
  'pǒ': '叵',
  'pò': '破迫魄',
  // pou
  'pōu': '剖',
  'pòu': '裒',
  // pu
  'pū': '铺扑仆',
  'pú': '葡蒲仆',
  'pǔ': '朴普谱浦',
  'pù': '铺瀑',
  // qi
  'qī': '七妻期欺漆凄',
  'qí': '齐骑奇棋旗祈',
  'qǐ': '起启乞企',
  'qì': '气汽器弃契泣',
  // qia
  'qiā': '掐',
  'qià': '恰洽',
  // qian
  'qiān': '千迁签谦牵',
  'qián': '前钱潜乾',
  'qiǎn': '浅遣',
  'qiàn': '歉欠嵌',
  // qiang
  'qiāng': '枪腔锵',
  'qiáng': '强墙',
  'qiǎng': '抢强',
  'qiàng': '呛',
  // qiao
  'qiāo': '敲锹悄',
  'qiáo': '桥瞧侨乔',
  'qiǎo': '巧悄',
  'qiào': '窍俏峭撬',
  // qie
  'qiē': '切',
  'qié': '茄',
  'qiě': '且',
  'qiè': '切怯窃妾',
  // qin
  'qīn': '亲钦侵',
  'qín': '勤琴芹秦禽',
  'qǐn': '寝',
  'qìn': '沁',
  // qing
  'qīng': '青清轻倾卿',
  'qíng': '情晴',
  'qǐng': '请',
  'qìng': '庆亲',
  // qiong
  'qióng': '穷琼',
  // qiu
  'qiū': '秋丘龟',
  'qiú': '求球囚',
  // qu
  'qū': '区驱屈躯',
  'qú': '渠',
  'qǔ': '曲取娶',
  'qù': '去趣',
  // quan
  'quān': '圈',
  'quán': '全权泉拳',
  'quǎn': '犬',
  'quàn': '劝券',
  // que
  'quē': '缺',
  'qué': '瘸',
  'què': '却确鹊雀',
  // qun
  'qún': '裙群',
  // ran
  'rán': '然燃',
  'rǎn': '染',
  // rang
  'rāng': '嚷',
  'ráng': '瓤',
  'rǎng': '壤嚷攘',
  'ràng': '让',
  // rao
  'ráo': '饶',
  'rǎo': '扰',
  'rào': '绕',
  // re
  'rē': '惹',
  'rè': '热',
  // ren
  'rén': '人仁壬',
  'rěn': '忍',
  'rèn': '任刃认纫韧',
  // reng
  'rēng': '扔',
  'réng': '仍',
  // ri
  'rì': '日',
  // rong
  'róng': '荣容溶蓉融',
  // rou
  'róu': '柔揉肉',
  // ru
  'rú': '如儒蠕',
  'rǔ': '乳辱',
  'rù': '入褥',
  // ruan
  'ruǎn': '软阮',
  // rui
  'ruì': '瑞锐睿',
  // run
  'rùn': '润闰',
  // ruo
  'ruò': '弱若',
  // sa
  'sā': '撒',
  'sá': '洒',
  'sǎ': '撒洒',
  'sà': '卅萨',
  // sai
  'sāi': '塞',
  'sài': '赛',
  // san
  'sān': '三',
  'sǎn': '伞散',
  'sàn': '散',
  // sang
  'sāng': '桑丧',
  'sǎng': '嗓',
  'sàng': '丧',
  // sao
  'sāo': '骚搔',
  'sǎo': '扫嫂',
  'sào': '扫',
  // se
  'sè': '色瑟涩塞',
  // sen
  'sēn': '森',
  // seng
  'sēng': '僧',
  // sha
  'shā': '杀沙纱刹',
  'shá': '啥',
  'shǎ': '傻',
  'shà': '煞厦',
  // shai
  'shāi': '筛',
  'shài': '晒色',
  // shan
  'shān': '山杉衫删珊',
  'shǎn': '闪陕',
  'shàn': '善扇单擅膳',
  // shang
  'shāng': '商伤',
  'shǎng': '赏上',
  'shàng': '上尚',
  'shang': '裳',
  // shao
  'shāo': '烧稍',
  'sháo': '勺芍韶',
  'shǎo': '少',
  'shào': '少绍邵',
  // she
  'shē': '奢赊',
  'shé': '蛇舌折',
  'shě': '舍',
  'shè': '射设社摄',
  // shei
  'shéi': '谁',
  // shen
  'shēn': '身深伸申参',
  'shén': '神什',
  'shěn': '审沈婶',
  'shèn': '甚肾慎渗',
  // sheng
  'shēng': '生声升牲笙',
  'shéng': '绳',
  'shěng': '省',
  'shèng': '胜盛剩圣',
  // shi
  'shī': '师诗狮失施',
  'shí': '十石时实食识',
  'shǐ': '使始史矢',
  'shì': '是事市世势试',
  // shou
  'shōu': '收',
  'shóu': '熟',
  'shǒu': '手首守',
  'shòu': '寿受售兽瘦',
  // shu
  'shū': '书叔输蔬舒',
  'shú': '熟赎',
  'shǔ': '暑鼠数属薯',
  'shù': '树术束述数',
  // shua
  'shuā': '刷',
  'shuǎ': '耍',
  'shuà': '刷',
  // shuai
  'shuāi': '摔衰',
  'shuǎi': '甩',
  'shuài': '率帅',
  // shuan
  'shuān': '栓拴',
  // shuang
  'shuāng': '双霜',
  'shuǎng': '爽',
  // shui
  'shuǐ': '水',
  'shuì': '睡税说',
  // shun
  'shǔn': '吮',
  'shùn': '顺瞬',
  // shuo
  'shuō': '说',
  'shuò': '硕烁朔',
  // si
  'sī': '思丝私司撕',
  'sǐ': '死',
  'sì': '四似寺肆',
  // song
  'sōng': '松',
  'sǒng': '耸',
  'sòng': '送宋诵颂',
  // sou
  'sōu': '搜艘',
  'sǒu': '叟薮',
  'sòu': '嗽',
  // su
  'sū': '苏酥',
  'sú': '俗',
  'sǔ': '塑',
  'sù': '诉素速宿粟',
  // suan
  'suān': '酸',
  'suàn': '算蒜',
  // sui
  'suī': '虽尿',
  'suí': '随',
  'suǐ': '髓',
  'suì': '岁碎穗遂',
  // sun
  'sūn': '孙',
  'sǔn': '损笋',
  // suo
  'suō': '缩梭蓑',
  'suǒ': '所锁索',
  // ta
  'tā': '他它她塌',
  'tǎ': '塔',
  'tà': '踏榻',
  // tai
  'tāi': '胎',
  'tái': '台抬苔',
  'tài': '太态泰',
  // tan
  'tān': '贪摊滩瘫',
  'tán': '谈弹潭谭',
  'tǎn': '坦袒',
  'tàn': '探叹碳',
  // tang
  'tāng': '汤趟',
  'táng': '糖堂塘膛',
  'tǎng': '躺淌',
  'tàng': '烫趟',
  // tao
  'tāo': '掏涛滔',
  'táo': '逃桃陶淘',
  'tǎo': '讨',
  'tào': '套',
  // te
  'tè': '特忒',
  // teng
  'téng': '疼腾藤',
  // ti
  'tī': '梯踢剔',
  'tí': '提题蹄啼',
  'tǐ': '体',
  'tì': '替剃屉涕',
  // tian
  'tiān': '天添',
  'tián': '田甜填',
  'tiǎn': '舔',
  // tiao
  'tiāo': '挑',
  'tiáo': '条调',
  'tiǎo': '挑',
  'tiào': '跳',
  // tie
  'tiē': '贴',
  'tiě': '铁',
  'tiè': '帖',
  // ting
  'tīng': '听厅汀',
  'tíng': '停庭廷',
  'tǐng': '挺艇',
  // tong
  'tōng': '通',
  'tóng': '同童铜桐',
  'tǒng': '统桶筒',
  'tòng': '痛通',
  // tou
  'tōu': '偷',
  'tóu': '头投',
  'tou': '透',
  // tu
  'tū': '突秃',
  'tú': '图涂途徒屠',
  'tǔ': '土吐',
  'tù': '吐兔',
  // tuan
  'tuān': '湍',
  'tuán': '团',
  // tui
  'tuī': '推',
  'tuí': '颓',
  'tuǐ': '腿',
  'tuì': '退蜕',
  // tun
  'tūn': '吞',
  'tùn': '屯臀',
  // tuo
  'tuō': '脱托拖',
  'tuó': '驼驮陀',
  'tuǒ': '妥椭',
  'tuò': '拓唾',
  // wa
  'wā': '挖蛙洼',
  'wá': '娃',
  'wǎ': '瓦',
  'wà': '瓦袜',
  'wa': '哇',
  // wai
  'wāi': '歪',
  'wài': '外',
  // wan
  'wān': '弯湾剜',
  'wán': '完玩顽丸',
  'wǎn': '晚宛婉挽',
  'wàn': '万腕',
  // wang
  'wāng': '汪',
  'wáng': '王亡',
  'wǎng': '往网枉',
  'wàng': '忘望旺',
  // wei
  'wēi': '危威微偎',
  'wéi': '为围违唯维',
  'wěi': '伟尾委伪',
  'wèi': '为卫未位味',
  // wen
  'wēn': '温瘟',
  'wén': '文蚊闻纹',
  'wěn': '稳吻',
  'wèn': '问',
  // weng
  'wēng': '翁嗡',
  'wěng': '蓊',
  'wèng': '瓮',
  // wo
  'wō': '窝蜗涡',
  'wǒ': '我',
  'wò': '卧握沃',
  // wu
  'wū': '乌污屋巫',
  'wú': '无吴梧',
  'wǔ': '五武午舞',
  'wù': '物务误悟',
  // xi
  'xī': '夕西吸希稀',
  'xí': '习席袭',
  'xǐ': '洗喜徙',
  'xì': '系细戏隙',
  // xia
  'xiā': '瞎虾',
  'xiá': '侠峡匣霞',
  'xiǎ': '吓',
  'xià': '下夏吓',
  // xian
  'xiān': '先鲜仙掀',
  'xián': '闲咸贤弦嫌',
  'xiǎn': '险显',
  'xiàn': '线现献县宪',
  // xiang
  'xiāng': '乡香相湘厢',
  'xiáng': '降详祥翔',
  'xiǎng': '想享响饷',
  'xiàng': '向象项像',
  // xiao
  'xiāo': '消削销宵萧',
  'xiáo': '淆',
  'xiǎo': '小晓',
  'xiào': '笑校孝效',
  // xie
  'xiē': '些歇',
  'xié': '协鞋邪斜携',
  'xiě': '血写',
  'xiè': '谢泄卸泻屑',
  // xin
  'xīn': '心新辛薪',
  'xín': '镡',
  'xǐn': '伈',
  'xìn': '信芯',
  // xing
  'xīng': '星腥猩兴',
  'xíng': '行形刑型',
  'xǐng': '醒省',
  'xìng': '兴性姓',
  // xiong
  'xiōng': '兄凶胸匈汹',
  'xióng': '雄熊',
  // xiu
  'xiū': '休修羞',
  'xiú': '庹',
  'xiǔ': '朽',
  'xiù': '秀袖绣嗅锈',
  // xu
  'xū': '虚需须',
  'xú': '徐',
  'xǔ': '许',
  'xù': '序叙续蓄',
  // xuan
  'xuān': '宣轩喧',
  'xuán': '旋玄悬',
  'xuǎn': '选癣',
  'xuàn': '眩炫',
  // xue
  'xuē': '削靴薛',
  'xué': '学穴',
  'xuě': '雪',
  'xuè': '血',
  // xun
  'xūn': '熏勋',
  'xún': '寻巡旬循',
  'xùn': '训迅讯殉',
  // ya
  'yā': '压鸦鸭押',
  'yá': '牙芽崖衙',
  'yǎ': '哑雅',
  'yà': '亚压讶',
  'ya': '呀',
  // yan
  'yān': '烟淹燕腌',
  'yán': '言严研盐延',
  'yǎn': '眼演掩',
  'yàn': '燕厌艳焰',
  // yang
  'yāng': '央秧殃',
  'yáng': '羊阳洋扬',
  'yǎng': '养氧痒仰',
  'yàng': '样恙漾',
  // yao
  'yāo': '腰妖邀',
  'yáo': '摇遥遥瑶',
  'yǎo': '咬舀',
  'yào': '药要耀钥',
  // ye
  'yē': '噎椰',
  'yé': '爷耶',
  'yě': '也野',
  'yè': '夜叶业页液',
  // yi
  'yī': '一衣医依',
  'yí': '仪宜姨移',
  'yǐ': '以已乙倚',
  'yì': '易意义艺亿',
  // yin
  'yīn': '音因阴姻',
  'yín': '银吟淫',
  'yǐn': '引隐饮',
  'yìn': '印',
  // ying
  'yīng': '应英樱鹰',
  'yíng': '营迎盈赢蝇',
  'yǐng': '影颖',
  'yìng': '应硬映',
  // yo
  'yō': '哟唷',
  'yo': '哟',
  // yong
  'yōng': '拥庸佣',
  'yǒng': '永泳勇涌',
  'yòng': '用',
  // you
  'yōu': '忧优悠幽',
  'yóu': '由油邮尤游',
  'yǒu': '有友酉',
  'yòu': '又右幼诱',
  // yu
  'yū': '迂淤',
  'yú': '于鱼余渔愚',
  'yǔ': '雨语与予屿',
  'yù': '玉遇预育欲',
  // yuan
  'yuān': '冤渊鸳',
  'yuán': '元原园圆员缘',
  'yuǎn': '远',
  'yuàn': '愿怨院',
  // yue
  'yuē': '约曰',
  'yué': '哕',
  'yuě': '哕',
  'yuè': '月乐跃岳阅越',
  // yun
  'yūn': '晕',
  'yún': '云匀耘',
  'yǔn': '允陨',
  'yùn': '韵运晕孕',
  // za
  'zā': '匝扎',
  'zá': '杂砸',
  'zǎ': '咋',
  // zai
  'zāi': '灾栽哉',
  'zǎi': '仔宰',
  'zài': '在再载',
  // zan
  'zān': '簪',
  'zǎn': '攒',
  'zàn': '赞暂',
  // zang
  'zāng': '赃脏',
  'zàng': '藏脏葬',
  // zao
  'zāo': '遭糟',
  'záo': '凿',
  'zǎo': '早枣澡',
  'zào': '造噪灶燥',
  // ze
  'zé': '责择泽则',
  'zè': '仄',
  // zei
  'zéi': '贼',
  // zen
  'zěn': '怎',
  // zeng
  'zēng': '增憎曾',
  'zèng': '赠',
  // zha
  'zhā': '查渣扎喳',
  'zhá': '闸炸扎轧',
  'zhǎ': '眨砟',
  'zhà': '炸榨诈蚱',
  // zhai
  'zhāi': '斋摘',
  'zhái': '宅择',
  'zhài': '债寨',
  // zhan
  'zhān': '沾粘瞻毡',
  'zhǎn': '展斩盏',
  'zhàn': '战站占绽',
  // zhang
  'zhāng': '张章彰',
  'zhǎng': '长掌涨',
  'zhàng': '杖丈帐胀障',
  // zhao
  'zhāo': '招朝',
  'zháo': '着朝',
  'zhǎo': '找爪沼',
  'zhào': '照赵兆罩',
  // zhe
  'zhē': '折蜇',
  'zhé': '折哲蛰辙',
  'zhě': '者锗',
  'zhè': '这浙',
  'zhe': '着',
  // zhei
  'zhèi': '这',
  // zhen
  'zhēn': '真针珍侦砧',
  'zhěn': '诊枕诊疹',
  'zhèn': '震振阵镇',
  // zheng
  'zhēng': '争征挣睁筝',
  'zhěng': '整拯',
  'zhèng': '政正证郑',
  // zhi
  'zhī': '之知支枝汁织只',
  'zhí': '直值职植殖',
  'zhǐ': '只指纸趾',
  'zhì': '志制质治智致',
  // zhong
  'zhōng': '中钟忠终衷',
  'zhǒng': '种肿',
  'zhòng': '重种中众',
  // zhou
  'zhōu': '周州洲舟粥',
  'zhóu': '轴',
  'zhǒu': '肘帚',
  'zhòu': '宙咒昼骤',
  // zhu
  'zhū': '朱珠猪株蛛',
  'zhú': '竹烛逐',
  'zhǔ': '主煮嘱',
  'zhù': '住注助柱祝',
  // zhua
  'zhuā': '抓',
  // zhuai
  'zhuǎi': '拽',
  'zhuài': '拽',
  // zhuan
  'zhuān': '专砖',
  'zhuǎn': '转',
  'zhuàn': '转赚',
  // zhuang
  'zhuāng': '庄装桩',
  'zhuǎng': '奘',
  'zhuàng': '壮状撞',
  // zhui
  'zhuī': '追锥',
  'zhuì': '坠缀',
  // zhun
  'zhǔn': '准',
  // zhuo
  'zhuō': '捉拙桌',
  'zhuó': '酌琢啄灼',
  // zi
  'zī': '资姿滋咨吱',
  'zí': '赜',
  'zǐ': '子紫梓',
  'zì': '字自',
  // zong
  'zōng': '宗综棕踪',
  'zǒng': '总',
  'zòng': '纵',
  // zou
  'zōu': '邹走',
  'zǒu': '走',
  'zòu': '奏揍',
  // zu
  'zū': '租',
  'zú': '足族卒',
  'zǔ': '祖组阻',
  // zuan
  'zuān': '钻',
  'zuàn': '钻纂',
  // zui
  'zuǐ': '嘴',
  'zuì': '最罪醉',
  // zun
  'zūn': '尊遵樽',
  'zǔn': '撙',
  // zuo
  'zuō': '作',
  'zuó': '昨琢',
  'zuǒ': '左佐',
  'zuò': '做作坐座',
}

// 构建反向索引：字符 -> 拼音数组（多音字会有多个）
const charToPinyin: Map<string, string[]> = (() => {
  const map = new Map<string, string[]>()
  for (const [pinyin, chars] of Object.entries(pinyinData)) {
    for (const ch of chars) {
      if (!map.has(ch)) map.set(ch, [])
      const arr = map.get(ch)!
      if (!arr.includes(pinyin)) arr.push(pinyin)
    }
  }
  return map
})()

// 汉字判断
function isHanzi(ch: string): boolean {
  const code = ch.charCodeAt(0)
  return code >= 0x4e00 && code <= 0x9fff
}

// 取声母首字母（拼音首字母）
function initialOf(pinyin: string): string {
  // 去除声调后取第一个字符
  const noTone = pinyin.replace(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüñ]/g, m => toneMap[m] || m[0])
  return noTone.charAt(0).toUpperCase()
}

// 去除声调
const toneMap: Record<string, string> = {
  'ā': 'a', 'á': 'a', 'ǎ': 'a', 'à': 'a',
  'ē': 'e', 'é': 'e', 'ě': 'e', 'è': 'e',
  'ī': 'i', 'í': 'i', 'ǐ': 'i', 'ì': 'i',
  'ō': 'o', 'ó': 'o', 'ǒ': 'o', 'ò': 'o',
  'ū': 'u', 'ú': 'u', 'ǔ': 'u', 'ù': 'u',
  'ǖ': 'v', 'ǘ': 'v', 'ǚ': 'v', 'ǜ': 'v', 'ü': 'v',
  'ń': 'n', 'ň': 'n', 'ǹ': 'n',
  'ḿ': 'm',
}

function stripTone(pinyin: string): string {
  return pinyin.replace(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüñḿńňǹ]/g, m => toneMap[m] || m)
}

// 转换单个汉字
function convertChar(ch: string, mode: Mode): { out: string; readings: string[] } {
  if (!isHanzi(ch)) {
    return { out: ch, readings: [] }
  }
  const readings = charToPinyin.get(ch)
  if (!readings || readings.length === 0) {
    return { out: ch, readings: [] }
  }
  const primary = readings[0]
  let out = ''
  if (mode === 'tone') {
    out = primary
  } else if (mode === 'normal') {
    out = stripTone(primary)
  } else {
    out = initialOf(primary)
  }
  return { out, readings }
}

interface Polyphone {
  char: string
  readings: string[]
}

const inputText = ref('')

const convertResult = computed(() => {
  const chars = Array.from(inputText.value)
  const outParts: string[] = []
  const polys: Polyphone[] = []
  for (const ch of chars) {
    if (ch === '\n') {
      outParts.push('\n')
      continue
    }
    if (ch.trim() === '') {
      outParts.push(ch)
      continue
    }
    const { out, readings } = convertChar(ch, mode.value)
    outParts.push(out)
    if (readings.length > 1) {
      polys.push({ char: ch, readings })
    }
  }
  return { text: outParts.join(''), polys }
})

const outputText = computed(() => convertResult.value.text)
const polyphones = computed(() => convertResult.value.polys)

const stats = computed(() => {
  let hanzi = 0, others = 0, unknown = 0
  for (const ch of Array.from(inputText.value)) {
    if (ch === '\n' || ch.trim() === '') continue
    if (isHanzi(ch)) {
      hanzi++
      if (!charToPinyin.has(ch)) unknown++
    } else {
      others++
    }
  }
  return { hanzi, others, unknown }
})

function copyResult() {
  if (!outputText.value) return
  navigator.clipboard.writeText(outputText.value).then(() => {
    message.success('已复制到剪贴板')
  }).catch(() => {
    message.error('复制失败')
  })
}

function clearAll() {
  inputText.value = ''
}

function loadExample() {
  inputText.value = '中国是一个伟大的国家。\n好好学习，天天向上。\n重庆长江大桥。'
}
</script>

<style scoped>
.pinyin-converter {
  max-width: 1000px;
  margin: 0 auto;
}

.input-card {
  margin-bottom: 16px;
}

.mode-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.mode-label {
  font-size: 14px;
  font-weight: 500;
  color: #555;
}

.dark .mode-label {
  color: #bbb;
}

.text-area-wrap {
  margin-bottom: 16px;
}

.area-label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #555;
}

.dark .area-label {
  color: #bbb;
}

.output-box {
  padding: 12px;
  min-height: 80px;
  border: 1px solid #e0e0e6;
  border-radius: 4px;
  background: #fafafa;
  font-size: 15px;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
  color: #2080f0;
  font-family: 'Fira Code', 'Consolas', monospace;
}

.output-box.placeholder {
  color: #c0c4cc;
  font-style: italic;
  font-family: inherit;
}

.dark .output-box {
  background: rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.09);
  color: #66d4ff;
}

.dark .output-box.placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.poly-card {
  margin-bottom: 16px;
}

.poly-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 10px;
}

.poly-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: #f5f7fa;
  border-radius: 6px;
}

.dark .poly-item {
  background: rgba(255, 255, 255, 0.04);
}

.poly-char {
  font-size: 22px;
  font-weight: 700;
  color: #333;
}

.dark .poly-char {
  color: #e0e0e0;
}

.poly-readings {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.poly-tip {
  margin-top: 10px;
  font-size: 12px;
  color: #888;
}

.stats-bar {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  padding: 10px 16px;
  background: #f5f7fa;
  border-radius: 6px;
  font-size: 13px;
  color: #666;
}

.dark .stats-bar {
  background: rgba(255, 255, 255, 0.04);
  color: #bbb;
}

@media (max-width: 600px) {
  .mode-bar {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
