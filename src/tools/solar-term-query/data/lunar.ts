// 简化的农历转换算法
// 基于 1900-2100 年的农历数据表

// 农历数据表（1900-2100）
// 每个元素是一个 16 位整数，编码了该年的农历信息
// 位 0-3: 春节的公历月份
// 位 4-8: 春节的公历日期
// 位 9-12: 闰月月份（0 表示无闰月）
// 位 13-24: 12 个月的大小月（1=大月 30 天，0=小月 29 天）
// 位 15: 闰月大小（1=30 天，0=29 天）

const LUNAR_INFO: number[] = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x05ac0, 0x0ab60, 0x096d5, 0x092e0,
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0,
  0x092e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a4d0, 0x0d150, 0x0f252,
  0x0d520,
]

const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '']
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const SHENG_XIAO = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']
const LUNAR_MONTH_NAMES = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊']
const LUNAR_DAY_NAMES = [
  '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十',
]

function lYearDays(y: number): number {
  let sum = 348
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    sum += (LUNAR_INFO[y - 1900] & i) ? 1 : 0
  }
  return sum + leapDays(y)
}

function leapMonth(y: number): number {
  return LUNAR_INFO[y - 1900] & 0xf
}

function leapDays(y: number): number {
  if (leapMonth(y)) {
    return (LUNAR_INFO[y - 1900] & 0x10000) ? 30 : 29
  }
  return 0
}

function monthDays(y: number, m: number): number {
  return (LUNAR_INFO[y - 1900] & (0x10000 >> m)) ? 30 : 29
}

export interface LunarDate {
  year: number
  month: number
  day: number
  isLeap: boolean
  yearGanZhi: string
  yearShengXiao: string
  monthName: string
  dayName: string
  toString: () => string
}

export function solarToLunar(year: number, month: number, day: number): LunarDate {
  // 基准日期：1900年1月31日（农历1900年正月初一）
  const baseDate = new Date(1900, 0, 31)
  const targetDate = new Date(year, month - 1, day)

  let offset = Math.floor((targetDate.getTime() - baseDate.getTime()) / 86400000)

  let lunarYear = 1900
  let daysInYear = lYearDays(lunarYear)

  while (lunarYear < 2100 && offset >= daysInYear) {
    offset -= daysInYear
    lunarYear++
    daysInYear = lYearDays(lunarYear)
  }

  const leap = leapMonth(lunarYear)
  let lunarMonth = 1
  let daysInMonth = monthDays(lunarYear, lunarMonth)
  let isLeap = false

  while (lunarMonth < 13 && offset >= daysInMonth) {
    offset -= daysInMonth
    if (leap > 0 && lunarMonth === leap && !isLeap) {
      isLeap = true
      daysInMonth = leapDays(lunarYear)
    } else {
      isLeap = false
      lunarMonth++
      daysInMonth = monthDays(lunarYear, lunarMonth)
    }
  }

  const lunarDay = offset + 1

  const yearGanZhi = TIAN_GAN[(lunarYear - 4) % 10] + DI_ZHI[(lunarYear - 4) % 12]
  const yearShengXiao = SHENG_XIAO[(lunarYear - 4) % 12]

  return {
    year: lunarYear,
    month: lunarMonth,
    day: lunarDay,
    isLeap,
    yearGanZhi,
    yearShengXiao,
    monthName: (isLeap ? '闰' : '') + LUNAR_MONTH_NAMES[lunarMonth - 1] + '月',
    dayName: LUNAR_DAY_NAMES[lunarDay - 1],
    toString: () => `${yearGanZhi}年 ${isLeap ? '闰' : ''}${LUNAR_MONTH_NAMES[lunarMonth - 1]}月${LUNAR_DAY_NAMES[lunarDay - 1]}`,
  }
}
