export interface SolarTermInfo {
  name: string
  englishName: string
  description: string
  custom: string
  health: string
}

export const SOLAR_TERMS: SolarTermInfo[] = [
  {
    name: '立春',
    englishName: 'Beginning of Spring',
    description: '春季的开始，万物复苏，阳气上升。',
    custom: '迎春、咬春（吃春饼、萝卜）、打春牛',
    health: '宜养肝，多食绿色蔬菜，适当运动，保持心情舒畅。',
  },
  {
    name: '雨水',
    englishName: 'Rain Water',
    description: '降雨开始，雨量渐增，春风化雨。',
    custom: '回娘家、拉保保、撞拜寄',
    health: '宜健脾祛湿，少酸多甘，注意保暖防春寒。',
  },
  {
    name: '惊蛰',
    englishName: 'Awakening of Insects',
    description: '春雷乍动，惊醒蛰伏的昆虫，万物生机盎然。',
    custom: '祭白虎、打小人、吃梨',
    health: '宜养肝护脾，饮食清淡，早睡早起，适当锻炼。',
  },
  {
    name: '春分',
    englishName: 'Spring Equinox',
    description: '昼夜平分，阴阳平衡，春暖花开。',
    custom: '竖蛋、吃春菜、送春牛',
    health: '宜调和阴阳，多食时令蔬菜，保持情绪稳定。',
  },
  {
    name: '清明',
    englishName: 'Pure Brightness',
    description: '天清气朗，万物洁净，扫墓祭祖的时节。',
    custom: '扫墓、踏青、插柳、放风筝、吃青团',
    health: '宜养肝明目，多食时令野菜，注意防风防过敏。',
  },
  {
    name: '谷雨',
    englishName: 'Grain Rain',
    description: '雨生百谷，降水增多，利于谷物生长。',
    custom: '祭仓颉、喝谷雨茶、吃香椿',
    health: '宜健脾祛湿，多食健脾食物，注意关节保暖。',
  },
  {
    name: '立夏',
    englishName: 'Beginning of Summer',
    description: '夏季开始，万物繁茂，气温明显升高。',
    custom: '迎夏、称人、吃立夏蛋、斗蛋',
    health: '宜养心，饮食清淡，多吃瓜果，避免贪凉。',
  },
  {
    name: '小满',
    englishName: 'Grain Buds',
    description: '麦类等夏熟作物籽粒开始饱满，但未成熟。',
    custom: '祭车神、食苦菜、抢水',
    health: '宜清热利湿，多吃苦味食物，注意皮肤护理。',
  },
  {
    name: '芒种',
    englishName: 'Grain in Ear',
    description: '有芒的麦子快收，有芒的稻子可种，农事繁忙。',
    custom: '送花神、安苗、打泥巴仗',
    health: '宜清暑益气，多食清淡，注意防暑降温。',
  },
  {
    name: '夏至',
    englishName: 'Summer Solstice',
    description: '北半球白昼最长，阳气最盛，阴气始生。',
    custom: '祭地、吃面、称体重',
    health: '宜养心防暑，饮食清淡，午间小憩，避免暴晒。',
  },
  {
    name: '小暑',
    englishName: 'Minor Heat',
    description: '天气开始炎热，但还未到最热。',
    custom: '食新、晒伏、吃藕',
    health: '宜清热解暑，多食瓜果，注意补水，避免剧烈运动。',
  },
  {
    name: '大暑',
    englishName: 'Major Heat',
    description: '一年中最热的时期，高温酷热。',
    custom: '饮伏茶、晒伏姜、烧伏香',
    health: '宜清热祛湿，饮食卫生，防止中暑，减少外出。',
  },
  {
    name: '立秋',
    englishName: 'Beginning of Autumn',
    description: '秋季开始，暑去凉来，万物开始收敛。',
    custom: '贴秋膘、啃秋、晒秋',
    health: '宜养肺润燥，多食酸味，逐渐增加衣物。',
  },
  {
    name: '处暑',
    englishName: 'End of Heat',
    description: '暑气至此而止，天气逐渐转凉。',
    custom: '放河灯、开渔节、吃鸭子',
    health: '宜滋阴润肺，多食百合、银耳，注意早晚保暖。',
  },
  {
    name: '白露',
    englishName: 'White Dew',
    description: '天气转凉，清晨露水凝结，呈白色。',
    custom: '收清露、饮白露茶、吃龙眼',
    health: '宜养肺防燥，多食润燥食物，注意腹部保暖。',
  },
  {
    name: '秋分',
    englishName: 'Autumn Equinox',
    description: '昼夜再次平分，秋意渐浓，丰收季节。',
    custom: '祭月、吃秋菜、送秋牛',
    health: '宜养阴润燥，多食芝麻、蜂蜜，保持情绪平和。',
  },
  {
    name: '寒露',
    englishName: 'Cold Dew',
    description: '露水更凉，即将凝结成霜，气候由凉转寒。',
    custom: '登高、赏菊、饮菊花酒',
    health: '宜养胃润肺，多食温热食物，注意足部保暖。',
  },
  {
    name: '霜降',
    englishName: 'Frost Descent',
    description: '开始降霜，天气渐冷，初霜出现。',
    custom: '赏菊、吃柿子、进补',
    health: '宜平补润燥，多食山药、栗子，注意关节保暖。',
  },
  {
    name: '立冬',
    englishName: 'Beginning of Winter',
    description: '冬季开始，万物收藏，气候逐渐寒冷。',
    custom: '补冬、吃饺子、酿黄酒',
    health: '宜养肾防寒，多食温热食物，早睡晚起，适当进补。',
  },
  {
    name: '小雪',
    englishName: 'Minor Snow',
    description: '开始降雪，但雪量不大，气温下降。',
    custom: '腌腊肉、吃糍粑、晒鱼干',
    health: '宜温补养肾，多食黑色食物，注意头部保暖。',
  },
  {
    name: '大雪',
    englishName: 'Major Snow',
    description: '降雪量增大，天气更冷，积雪可能不化。',
    custom: '腌肉、进补、观赏封河',
    health: '宜温阳散寒，多食羊肉、核桃，注意全身保暖。',
  },
  {
    name: '冬至',
    englishName: 'Winter Solstice',
    description: '北半球白昼最短，阴气最盛，阳气始生。',
    custom: '祭祖、吃饺子/汤圆、数九',
    health: '宜养肾固精，多食温补食物，早睡晚起，减少运动。',
  },
  {
    name: '小寒',
    englishName: 'Minor Cold',
    description: '天气寒冷，但还未到最冷的时候。',
    custom: '吃腊八粥、准备年货',
    health: '宜温补防寒，多食温热食物，注意心脑血管健康。',
  },
  {
    name: '大寒',
    englishName: 'Major Cold',
    description: '一年中最冷的时期，严寒刺骨。',
    custom: '尾牙祭、除旧布新、准备过年',
    health: '宜温阳御寒，多食温热滋补，减少户外活动，预防感冒。',
  },
]

// 节气名称列表
export const SOLAR_TERM_NAMES = SOLAR_TERMS.map(t => t.name)

// 获取节气信息
export function getSolarTermInfo(name: string): SolarTermInfo | undefined {
  return SOLAR_TERMS.find(t => t.name === name)
}
