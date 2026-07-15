import { ref, computed } from 'vue'
import { getSolarTermDates, getNearestSolarTerm, getDaysToNextSolarTerm } from '../data/dates'
import { getSolarTermInfo, type SolarTermInfo } from '../data/solar-terms'
import { solarToLunar, type LunarDate } from '../data/lunar'
import { getPoem, type SolarTermPoem } from '../data/poems'

export interface SolarTermWithDate {
  name: string
  date: string
  info: SolarTermInfo
  lunar: LunarDate
  poem?: SolarTermPoem
}

export function useSolarTerm() {
  const currentYear = ref(new Date().getFullYear())
  const selectedTerm = ref<SolarTermWithDate | null>(null)

  const solarTerms = computed(() => {
    const dates = getSolarTermDates(currentYear.value)
    return dates.map(d => {
      const dateObj = new Date(d.date)
      const lunar = solarToLunar(dateObj.getFullYear(), dateObj.getMonth() + 1, dateObj.getDate())
      return {
        name: d.name,
        date: d.date,
        info: getSolarTermInfo(d.name)!,
        lunar,
        poem: getPoem(d.name),
      }
    })
  })

  const todayInfo = computed(() => {
    const today = new Date()
    const nearest = getNearestSolarTerm(today)
    const daysToNext = getDaysToNextSolarTerm(today)
    const lunarToday = solarToLunar(
      today.getFullYear(),
      today.getMonth() + 1,
      today.getDate(),
    )

    return {
      ...nearest,
      daysToNext,
      lunarToday,
    }
  })

  function selectTerm(term: SolarTermWithDate) {
    selectedTerm.value = term
  }

  function clearSelection() {
    selectedTerm.value = null
  }

  function prevYear() {
    if (currentYear.value > 1900) {
      currentYear.value--
      clearSelection()
    }
  }

  function nextYear() {
    if (currentYear.value < 2100) {
      currentYear.value++
      clearSelection()
    }
  }

  function goToCurrentYear() {
    currentYear.value = new Date().getFullYear()
    clearSelection()
  }

  return {
    currentYear,
    solarTerms,
    selectedTerm,
    todayInfo,
    selectTerm,
    clearSelection,
    prevYear,
    nextYear,
    goToCurrentYear,
  }
}
