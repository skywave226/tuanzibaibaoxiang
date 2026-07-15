// 24 节气相关诗词
export interface SolarTermPoem {
  title: string
  author: string
  dynasty: string
  content: string
}

export const SOLAR_TERM_POEMS: Record<string, SolarTermPoem> = {
  '立春': {
    title: '立春',
    author: '杜甫',
    dynasty: '唐',
    content: '春日春盘细生菜，忽忆两京梅发时。\n盘出高门行白玉，菜传纤手送青丝。',
  },
  '雨水': {
    title: '春夜喜雨',
    author: '杜甫',
    dynasty: '唐',
    content: '好雨知时节，当春乃发生。\n随风潜入夜，润物细无声。',
  },
  '惊蛰': {
    title: '观田家',
    author: '韦应物',
    dynasty: '唐',
    content: '微雨众卉新，一雷惊蛰始。\n田家几日闲，耕种从此起。',
  },
  '春分': {
    title: '春分',
    author: '徐铉',
    dynasty: '宋',
    content: '仲春初四日，春色正中分。\n绿野徘徊月，晴天断续云。',
  },
  '清明': {
    title: '清明',
    author: '杜牧',
    dynasty: '唐',
    content: '清明时节雨纷纷，路上行人欲断魂。\n借问酒家何处有？牧童遥指杏花村。',
  },
  '谷雨': {
    title: '谷雨',
    author: '朱',
    dynasty: '宋',
    content: '天点纷林际，虚檐写梦中。\n明朝知谷雨，无策禁花风。',
  },
  '立夏': {
    title: '立夏',
    author: '陆游',
    dynasty: '宋',
    content: '赤帜插城扉，东君整驾归。\n泥新巢燕闹，花尽蜜蜂稀。',
  },
  '小满': {
    title: '小满',
    author: '欧阳修',
    dynasty: '宋',
    content: '夜莺啼绿柳，皓月醒长空。\n最爱垄头麦，迎风笑落红。',
  },
  '芒种': {
    title: '芒种后积雨骤冷',
    author: '范成大',
    dynasty: '宋',
    content: '梅霖倾泻九河翻，百渎交流海面宽。\n良苦吴农田下湿，年年披膊插秧盘。',
  },
  '夏至': {
    title: '夏至',
    author: '白居易',
    dynasty: '唐',
    content: '绿筠尚含粉，圆荷始散芳。\n于焉洒烦抱，可以对华觞。',
  },
  '小暑': {
    title: '小暑六月节',
    author: '元稹',
    dynasty: '唐',
    content: '忽温风至，因循小暑来。\n竹喧先觉雨，山暗已闻雷。',
  },
  '大暑': {
    title: '大暑',
    author: '曾几',
    dynasty: '宋',
    content: '赤日几时过，清风无处寻。\n经书聊枕籍，瓜李漫浮沉。',
  },
  '立秋': {
    title: '立秋',
    author: '刘翰',
    dynasty: '宋',
    content: '乳鸦啼散玉屏空，一枕新凉一扇风。\n睡起秋声无觅处，满阶梧桐月明中。',
  },
  '处暑': {
    title: '处暑',
    author: '苏泂',
    dynasty: '宋',
    content: '处暑无三日，新凉直万金。\n白头更世事，青草印禅心。',
  },
  '白露': {
    title: '白露',
    author: '杜甫',
    dynasty: '唐',
    content: '白露团甘子，清晨散马蹄。\n圃开连石树，船渡入江溪。',
  },
  '秋分': {
    title: '秋分',
    author: '郑孝胥',
    dynasty: '清',
    content: '暑退秋澄气转凉，日光夜色两均长。\n银棉金稻千重秀，丹桂小菊万径香。',
  },
  '寒露': {
    title: '寒露',
    author: '戴察',
    dynasty: '唐',
    content: '萧疏桐叶上，月白露初团。\n滴沥清光满，荧煌素彩寒。',
  },
  '霜降': {
    title: '霜降',
    author: '白居易',
    dynasty: '唐',
    content: '霜降碧天静，秋事促西风。\n寒声隐地初听，中夜入梧桐。',
  },
  '立冬': {
    title: '立冬',
    author: '李白',
    dynasty: '唐',
    content: '冻笔新诗懒写，寒炉美酒时温。\n醉看墨花月白，恍疑雪满前村。',
  },
  '小雪': {
    title: '小雪',
    author: '戴叔伦',
    dynasty: '唐',
    content: '花雪随风不厌看，更多还肯失林峦。\n愁人正在书窗下，一片飞来一片寒。',
  },
  '大雪': {
    title: '大雪',
    author: '陆游',
    dynasty: '宋',
    content: '大雪江南见未曾，今年方始是严凝。\n巧穿帘罅如相觅，重压林梢欲不胜。',
  },
  '冬至': {
    title: '冬至',
    author: '杜甫',
    dynasty: '唐',
    content: '天时人事日相催，冬至阳生春又来。\n刺绣五纹添弱线，吹葭六琯动浮灰。',
  },
  '小寒': {
    title: '小寒',
    author: '元稹',
    dynasty: '唐',
    content: '小寒连大吕，欢鹊垒新巢。\n拾食寻河曲，衔紫绕树梢。',
  },
  '大寒': {
    title: '大寒',
    author: '陆游',
    dynasty: '宋',
    content: '大寒雪未消，闭户不能出。\n可怜切云冠，局此容膝室。',
  },
}

export function getPoem(termName: string): SolarTermPoem | undefined {
  return SOLAR_TERM_POEMS[termName]
}
