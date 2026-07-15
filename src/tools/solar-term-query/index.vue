<template>
  <div class="solar-term-query">
    <!-- 视图切换 -->
    <ViewToggle v-model:view="currentView" class="mb-4" />

    <!-- 列表视图 -->
    <template v-if="currentView === 'list'">
      <YearSelector
        :year="currentYear"
        @update:year="currentYear = $event"
        @prev="prevYear"
        @next="nextYear"
        @today="goToCurrentYear"
      />

      <div class="card mb-4" v-if="todayInfo">
        <div class="flex items-center gap-3">
          <span class=" text-2xl text-orange-500"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span>
          <div class="flex-1">
            <div class="text-sm font-medium">今日节气</div>
            <div class="text-xs text-gray-500 mt-1">
              <span v-if="todayInfo.current">
                今天是 <strong>{{ todayInfo.current.name }}</strong>
              </span>
              <span v-else>
                上一个节气：<strong>{{ todayInfo.prev.name }}</strong>（{{ todayInfo.prev.date }}）
              </span>
            </div>
            <div class="text-xs text-amber-600 mt-1">
              农历 {{ todayInfo.lunarToday.monthName }}{{ todayInfo.lunarToday.dayName }}
            </div>
          </div>
          <div class="text-right">
            <div class="text-sm font-medium">距离下一个节气</div>
            <div class="text-lg font-bold text-orange-500">{{ todayInfo.daysToNext }} 天</div>
            <div class="text-xs text-gray-500">{{ todayInfo.next.name }}（{{ todayInfo.next.date }}）</div>
          </div>
        </div>
      </div>

      <TermDetail
        v-if="selectedTerm"
        :term="selectedTerm"
        @close="clearSelection"
        class="mb-4"
      />

      <div class="term-grid">
        <TermCard
          v-for="term in solarTerms"
          :key="term.name"
          :term="term"
          :isToday="isTodayTerm(term.date)"
          @select="selectTerm"
        />
      </div>
    </template>

    <!-- 日历视图 -->
    <template v-else>
      <TermCalendar
        :calendarDays="calendarDays"
        :monthName="monthName"
        @prev="prevMonth"
        @next="nextMonth"
        @today="goToCurrentMonth"
        @dayClick="handleDayClick"
      />

      <TermDetail
        v-if="selectedTerm"
        :term="selectedTerm"
        @close="clearSelection"
        class="mt-4"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSolarTerm } from './composables/useSolarTerm'
import { useCalendar } from './composables/useCalendar'
import { getSolarTermInfo } from './data/solar-terms'
import { solarToLunar } from './data/lunar'
import { getPoem } from './data/poems'
import YearSelector from './components/YearSelector.vue'
import TermCard from './components/TermCard.vue'
import TermDetail from './components/TermDetail.vue'
import TermCalendar from './components/TermCalendar.vue'
import ViewToggle from './components/ViewToggle.vue'
import type { CalendarDay } from './composables/useCalendar'

const currentView = ref<'list' | 'calendar'>('list')

const {
  currentYear,
  solarTerms,
  selectedTerm,
  todayInfo,
  selectTerm,
  clearSelection,
  prevYear,
  nextYear,
  goToCurrentYear,
} = useSolarTerm()

const {
  calendarDays,
  monthName,
  prevMonth,
  nextMonth,
  goToCurrentMonth,
} = useCalendar()

watch(
  () => calendarDays.value,
  (weeks) => {
    const calendarYear = weeks[0]?.[0]?.date.getFullYear()
    if (calendarYear && calendarYear !== currentYear.value) {
      currentYear.value = calendarYear
    }
  },
)

function isTodayTerm(dateStr: string): boolean {
  const today = new Date().toISOString().split('T')[0]
  return dateStr === today
}

function handleDayClick(day: CalendarDay) {
  if (!day.solarTerm) return
  const info = getSolarTermInfo(day.solarTerm)
  if (!info) return
  const dateStr = day.date.toISOString().split('T')[0]
  const lunar = solarToLunar(day.date.getFullYear(), day.date.getMonth() + 1, day.date.getDate())
  selectTerm({
    name: day.solarTerm,
    date: dateStr,
    info,
    lunar,
    poem: getPoem(day.solarTerm),
  })
}
</script>

<style scoped>
.term-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

@media (max-width: 768px) {
  .term-grid {
    grid-template-columns: 1fr;
  }
}
</style>
