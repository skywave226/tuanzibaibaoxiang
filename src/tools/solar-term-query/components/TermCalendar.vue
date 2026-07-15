<template>
  <div class="term-calendar card">
    <!-- 月份导航 -->
    <div class="calendar-header">
      <div class="flex items-center gap-3">
        <n-button quaternary circle @click="$emit('prev')">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </n-button>
        <span class="text-lg font-bold">{{ monthName }}</span>
        <n-button quaternary circle @click="$emit('next')">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </n-button>
      </div>
      <n-button size="small" @click="$emit('today')">
        <span class=" mr-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span>
        今天
      </n-button>
    </div>

    <!-- 星期标题 -->
    <div class="calendar-weekdays">
      <div v-for="day in weekDays" :key="day" class="weekday" :class="{ 'is-weekend': day === '日' || day === '六' }">
        {{ day }}
      </div>
    </div>

    <!-- 日历网格 -->
    <div class="calendar-grid">
      <div
        v-for="(week, weekIndex) in calendarDays"
        :key="weekIndex"
        class="calendar-week"
      >
        <div
          v-for="(day, dayIndex) in week"
          :key="dayIndex"
          class="calendar-day"
          :class="{
            'is-today': day.isToday,
            'is-other-month': !day.isCurrentMonth,
            'has-term': day.solarTerm,
          }"
          @click="handleDayClick(day)"
        >
          <div class="day-number">{{ day.day }}</div>
          <div class="day-lunar" :class="{ 'is-term': day.solarTerm }">
            {{ day.solarTerm || day.lunarDay }}
          </div>
        </div>
      </div>
    </div>

    <!-- 图例 -->
    <div class="calendar-legend">
      <div class="legend-item">
        <div class="legend-color is-today"></div>
        <span>今日</span>
      </div>
      <div class="legend-item">
        <div class="legend-color has-term"></div>
        <span>节气</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NButton } from 'naive-ui'
import type { CalendarDay } from '../composables/useCalendar'

defineProps<{
  calendarDays: CalendarDay[][]
  monthName: string
}>()

defineEmits<{
  'prev': []
  'next': []
  'today': []
  'dayClick': [day: CalendarDay]
}>()

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

function handleDayClick(day: CalendarDay) {
  if (day.solarTerm) {
    // 只有节气日期才触发点击
    // 通过事件传递给父组件
  }
}
</script>

<style scoped>
.term-calendar {
  padding: 20px;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 8px;
}

.weekday {
  text-align: center;
  font-size: 13px;
  font-weight: 500;
  color: #666;
  padding: 8px 0;
}

.weekday.is-weekend {
  color: #d03050;
}

.calendar-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.calendar-week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.calendar-day {
  aspect-ratio: 1;
  padding: 4px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border: 2px solid transparent;
}

.calendar-day:hover {
  background: #f5f5f5;
}

.dark .calendar-day:hover {
  background: #2a2a4a;
}

.calendar-day.is-today {
  background: #f0f9eb;
  border-color: #36ad6a;
}

.dark .calendar-day.is-today {
  background: #1a3a2a;
  border-color: #63e2b7;
}

.calendar-day.is-other-month {
  opacity: 0.4;
}

.calendar-day.has-term {
  background: linear-gradient(135deg, #fff9e6 0%, #ffffff 100%);
  border-color: #f0a020;
}

.dark .calendar-day.has-term {
  background: linear-gradient(135deg, #3d3520 0%, #1e2a4a 100%);
  border-color: #f0a020;
}

.day-number {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.dark .day-number {
  color: #e0e0e0;
}

.calendar-day.is-other-month .day-number {
  color: #999;
}

.day-lunar {
  font-size: 11px;
  color: #888;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.day-lunar.is-term {
  color: #f0a020;
  font-weight: 600;
}

.calendar-legend {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e8e8e8;
}

.dark .calendar-legend {
  border-top-color: #2a2a4a;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #666;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 2px solid transparent;
}

.legend-color.is-today {
  background: #f0f9eb;
  border-color: #36ad6a;
}

.legend-color.has-term {
  background: linear-gradient(135deg, #fff9e6 0%, #ffffff 100%);
  border-color: #f0a020;
}

@media (max-width: 768px) {
  .calendar-day {
    padding: 2px;
  }

  .day-number {
    font-size: 14px;
  }

  .day-lunar {
    font-size: 10px;
  }
}
</style>
