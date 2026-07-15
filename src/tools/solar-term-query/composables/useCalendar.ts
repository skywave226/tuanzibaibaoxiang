import { ref, computed } from 'vue'
import { getSolarTermDates } from '../data/dates'
import { solarToLunar } from '../data/lunar'

export interface CalendarDay {
  date: Date
  day: number
  lunarDay: string
  isToday: boolean
  isCurrentMonth: boolean
  solarTerm?: string
}

export function useCalendar() {
  const currentYear = ref(new Date().getFullYear())
  const currentMonth = ref(new Date().getMonth() + 1)

  // 获取某年某月的日历数据
  const calendarDays = computed(() => {
    const year = currentYear.value
    const month = currentMonth.value

    // 获取该月第一天是星期几
    const firstDay = new Date(year, month - 1, 1)
    const firstDayOfWeek = firstDay.getDay() // 0 = 周日

    // 获取该月有多少天
    const daysInMonth = new Date(year, month, 0).getDate()

    // 获取全年节气
    const solarTermDates = getSolarTermDates(year)
    const termMap = new Map(solarTermDates.map(t => [t.date, t.name]))

    // 今天的日期字符串
    const todayStr = new Date().toISOString().split('T')[0]

    // 生成日历格子（6 行 × 7 列 = 42 格）
    const days: CalendarDay[] = []

    // 填充上个月的日期
    const prevMonthDays = new Date(year, month - 1, 0).getDate()
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthDays - i
      const date = new Date(year, month - 2, day)
      const dateStr = date.toISOString().split('T')[0]
      const lunar = solarToLunar(date.getFullYear(), date.getMonth() + 1, date.getDate())

      days.push({
        date,
        day,
        lunarDay: lunar.dayName,
        isToday: dateStr === todayStr,
        isCurrentMonth: false,
        solarTerm: termMap.get(dateStr),
      })
    }

    // 填充当月的日期
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day)
      const dateStr = date.toISOString().split('T')[0]
      const lunar = solarToLunar(year, month, day)

      days.push({
        date,
        day,
        lunarDay: lunar.dayName,
        isToday: dateStr === todayStr,
        isCurrentMonth: true,
        solarTerm: termMap.get(dateStr),
      })
    }

    // 填充下个月的日期
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month, day)
      const dateStr = date.toISOString().split('T')[0]
      const lunar = solarToLunar(date.getFullYear(), date.getMonth() + 1, date.getDate())

      days.push({
        date,
        day,
        lunarDay: lunar.dayName,
        isToday: dateStr === todayStr,
        isCurrentMonth: false,
        solarTerm: termMap.get(dateStr),
      })
    }

    // 转换为二维数组（6 行）
    const weeks: CalendarDay[][] = []
    for (let i = 0; i < 6; i++) {
      weeks.push(days.slice(i * 7, (i + 1) * 7))
    }

    return weeks
  })

  // 月份名称
  const monthName = computed(() => `${currentYear.value}年${currentMonth.value}月`)

  // 上一个月
  function prevMonth() {
    if (currentMonth.value === 1) {
      currentMonth.value = 12
      currentYear.value--
    } else {
      currentMonth.value--
    }
  }

  // 下一个月
  function nextMonth() {
    if (currentMonth.value === 12) {
      currentMonth.value = 1
      currentYear.value++
    } else {
      currentMonth.value++
    }
  }

  // 回到今年今月
  function goToCurrentMonth() {
    const now = new Date()
    currentYear.value = now.getFullYear()
    currentMonth.value = now.getMonth() + 1
  }

  return {
    currentYear,
    currentMonth,
    calendarDays,
    monthName,
    prevMonth,
    nextMonth,
    goToCurrentMonth,
  }
}
