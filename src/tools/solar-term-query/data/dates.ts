import { SOLAR_TERMS } from './solar-terms'

interface SolarTermDate {
  name: string
  date: string
}

function calculateSolarTermDate(year: number, termIndex: number): string {
  const baseDate = new Date(Date.UTC(2000, 0, 6, 21, 0, 0))
  const baseTermIndex = 22

  const tropicalYear = 365.2422

  let termDiff = termIndex - baseTermIndex
  if (termDiff < 0) termDiff += 24

  const yearDiff = year - 2000
  const totalDays = yearDiff * tropicalYear + (termDiff / 24) * tropicalYear

  const targetDate = new Date(baseDate.getTime() + totalDays * 24 * 60 * 60 * 1000)

  const y = targetDate.getUTCFullYear()
  const m = String(targetDate.getUTCMonth() + 1).padStart(2, '0')
  const d = String(targetDate.getUTCDate()).padStart(2, '0')

  return `${y}-${m}-${d}`
}

export function getSolarTermDates(year: number): SolarTermDate[] {
  return SOLAR_TERMS.map((term, index) => ({
    name: term.name,
    date: calculateSolarTermDate(year, index),
  }))
}

export function getNearestSolarTerm(date: Date): { prev: SolarTermDate; next: SolarTermDate; current?: SolarTermDate } {
  const year = date.getFullYear()
  const dates = getSolarTermDates(year)
  const dateStr = date.toISOString().split('T')[0]

  let prevIndex = -1
  let nextIndex = -1

  for (let i = 0; i < dates.length; i++) {
    if (dates[i].date <= dateStr) {
      prevIndex = i
    }
    if (dates[i].date >= dateStr && nextIndex === -1) {
      nextIndex = i
    }
  }

  if (prevIndex === -1) {
    const prevYearDates = getSolarTermDates(year - 1)
    prevIndex = prevYearDates.length - 1
    return {
      prev: prevYearDates[prevIndex],
      next: dates[nextIndex],
    }
  }

  if (nextIndex === -1) {
    const nextYearDates = getSolarTermDates(year + 1)
    nextIndex = 0
    return {
      prev: dates[prevIndex],
      next: nextYearDates[nextIndex],
    }
  }

  if (dates[prevIndex].date === dateStr) {
    return {
      prev: dates[prevIndex],
      next: dates[(prevIndex + 1) % 24],
      current: dates[prevIndex],
    }
  }

  return {
    prev: dates[prevIndex],
    next: dates[nextIndex],
  }
}

export function getDaysToNextSolarTerm(date: Date): number {
  const { next } = getNearestSolarTerm(date)
  const nextDate = new Date(next.date)
  const today = new Date(date.toISOString().split('T')[0])

  const diffTime = nextDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}
