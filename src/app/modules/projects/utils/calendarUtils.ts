/**
 * 日曆工具函數
 * 
 * 提供日曆相關的日期處理和計算功能
 */

import type { CalendarEventData } from '../services/calendarService';

/**
 * 日期範圍類型
 */
export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * 月份資訊類型
 */
export interface MonthInfo {
  year: number;
  month: number;
  firstDay: Date;
  lastDay: Date;
  daysInMonth: number;
  firstDayOfWeek: number;
  lastDayOfWeek: number;
}

/**
 * 週資訊類型
 */
export interface WeekInfo {
  year: number;
  week: number;
  startDate: Date;
  endDate: Date;
  days: Date[];
}

/**
 * 將日期轉換為標準格式
 */
export function formatDate(date: Date, format: 'short' | 'long' | 'iso' = 'short'): string {
  switch (format) {
    case 'short':
      return date.toLocaleDateString('zh-TW');
    case 'long':
      return date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      });
    case 'iso':
      return date.toISOString().split('T')[0];
    default:
      return date.toLocaleDateString('zh-TW');
  }
}

/**
 * 將時間轉換為標準格式
 */
export function formatTime(date: Date, includeSeconds = false): string {
  return date.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
  });
}

/**
 * 將日期時間轉換為標準格式
 */
export function formatDateTime(date: Date, format: 'short' | 'long' = 'short'): string {
  const dateStr = formatDate(date, format);
  const timeStr = formatTime(date);
  return `${dateStr} ${timeStr}`;
}

/**
 * 檢查兩個日期是否為同一天
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

/**
 * 檢查兩個日期是否為同一週
 */
export function isSameWeek(date1: Date, date2: Date): boolean {
  const week1 = getWeekInfo(date1);
  const week2 = getWeekInfo(date2);
  return week1.year === week2.year && week1.week === week2.week;
}

/**
 * 檢查兩個日期是否為同一月
 */
export function isSameMonth(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth();
}

/**
 * 檢查兩個日期是否為同一年
 */
export function isSameYear(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear();
}

/**
 * 取得月份資訊
 */
export function getMonthInfo(date: Date): MonthInfo {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const firstDayOfWeek = firstDay.getDay();
  const lastDayOfWeek = lastDay.getDay();

  return {
    year,
    month,
    firstDay,
    lastDay,
    daysInMonth,
    firstDayOfWeek,
    lastDayOfWeek,
  };
}

/**
 * 取得週資訊
 */
export function getWeekInfo(date: Date): WeekInfo {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);

  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const daysInWeek: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    daysInWeek.push(day);
  }

  return {
    year,
    week,
    startDate: startOfWeek,
    endDate: endOfWeek,
    days: daysInWeek,
  };
}

/**
 * 取得月份的所有日期
 */
export function getMonthDays(date: Date): Array<{ date: Date; isCurrentMonth: boolean }> {
  const monthInfo = getMonthInfo(date);
  const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];

  // 添加上個月的日期
  for (let i = monthInfo.firstDayOfWeek - 1; i >= 0; i--) {
    const day = new Date(monthInfo.firstDay);
    day.setDate(day.getDate() - i - 1);
    days.push({ date: day, isCurrentMonth: false });
  }

  // 添加當前月份的日期
  for (let i = 1; i <= monthInfo.daysInMonth; i++) {
    const day = new Date(monthInfo.year, monthInfo.month, i);
    days.push({ date: day, isCurrentMonth: true });
  }

  // 添加下個月的日期
  for (let i = 1; i <= 6 - monthInfo.lastDayOfWeek; i++) {
    const day = new Date(monthInfo.lastDay);
    day.setDate(day.getDate() + i);
    days.push({ date: day, isCurrentMonth: false });
  }

  return days;
}

/**
 * 取得週的所有日期
 */
export function getWeekDays(date: Date): Date[] {
  const weekInfo = getWeekInfo(date);
  return weekInfo.days;
}

/**
 * 計算兩個日期之間的天數
 */
export function getDaysBetween(date1: Date, date2: Date): number {
  const timeDiff = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

/**
 * 計算兩個日期之間的工作日數（排除週末）
 */
export function getWorkDaysBetween(date1: Date, date2: Date): number {
  const start = new Date(Math.min(date1.getTime(), date2.getTime()));
  const end = new Date(Math.max(date1.getTime(), date2.getTime()));
  let workDays = 0;

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = 週日, 6 = 週六
      workDays++;
    }
  }

  return workDays;
}

/**
 * 檢查日期是否為工作日
 */
export function isWorkDay(date: Date): boolean {
  const dayOfWeek = date.getDay();
  return dayOfWeek !== 0 && dayOfWeek !== 6;
}

/**
 * 檢查日期是否為週末
 */
export function isWeekend(date: Date): boolean {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
}

/**
 * 取得下一個工作日
 */
export function getNextWorkDay(date: Date): Date {
  const nextDay = new Date(date);
  nextDay.setDate(date.getDate() + 1);
  
  while (!isWorkDay(nextDay)) {
    nextDay.setDate(nextDay.getDate() + 1);
  }
  
  return nextDay;
}

/**
 * 取得上一個工作日
 */
export function getPreviousWorkDay(date: Date): Date {
  const prevDay = new Date(date);
  prevDay.setDate(date.getDate() - 1);
  
  while (!isWorkDay(prevDay)) {
    prevDay.setDate(prevDay.getDate() - 1);
  }
  
  return prevDay;
}

/**
 * 根據日期範圍篩選日曆事件
 */
export function filterEventsByDateRange(
  events: CalendarEventData[],
  startDate: Date,
  endDate: Date
): CalendarEventData[] {
  return events.filter(event => {
    const eventDate = new Date(event.start);
    return eventDate >= startDate && eventDate <= endDate;
  });
}

/**
 * 根據特定日期篩選日曆事件
 */
export function filterEventsByDate(events: CalendarEventData[], date: Date): CalendarEventData[] {
  return events.filter(event => {
    const eventDate = new Date(event.start);
    return isSameDay(eventDate, date);
  });
}

/**
 * 根據事件類型篩選日曆事件
 */
export function filterEventsByType(
  events: CalendarEventData[],
  types: string[]
): CalendarEventData[] {
  if (types.length === 0) {
    return events;
  }
  
  return events.filter(event => types.includes(event.type));
}

/**
 * 取得今日的日曆事件
 */
export function getTodayEvents(events: CalendarEventData[]): CalendarEventData[] {
  const today = new Date();
  return filterEventsByDate(events, today);
}

/**
 * 取得即將到來的日曆事件（未來指定天數）
 */
export function getUpcomingEvents(events: CalendarEventData[], days: number = 7): CalendarEventData[] {
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + days);
  
  return filterEventsByDateRange(events, today, endDate);
}

/**
 * 取得逾期的日曆事件
 */
export function getOverdueEvents(events: CalendarEventData[]): CalendarEventData[] {
  const today = new Date();
  return events.filter(event => {
    const eventDate = new Date(event.end);
    return eventDate < today && 
           (event.type === 'workPackage-end' || event.type === 'subWorkPackage-end' || event.type === 'milestone');
  });
}

/**
 * 計算日曆事件的統計資訊
 */
export function getCalendarStats(events: CalendarEventData[]) {
  const today = new Date();
  const todayEvents = getTodayEvents(events);
  const upcomingEvents = getUpcomingEvents(events, 7);
  const overdueEvents = getOverdueEvents(events);

  const eventTypeCounts = events.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    total: events.length,
    today: todayEvents.length,
    upcoming: upcomingEvents.length,
    overdue: overdueEvents.length,
    byType: eventTypeCounts,
  };
}

/**
 * 取得日期範圍的標籤
 */
export function getDateRangeLabel(startDate: Date, endDate: Date): string {
  if (isSameDay(startDate, endDate)) {
    return formatDate(startDate, 'long');
  }
  
  if (isSameMonth(startDate, endDate)) {
    return `${startDate.getDate()} - ${endDate.getDate()} ${formatDate(startDate, 'short').split('/')[1]}`;
  }
  
  if (isSameYear(startDate, endDate)) {
    return `${formatDate(startDate, 'short')} - ${formatDate(endDate, 'short')}`;
  }
  
  return `${formatDate(startDate, 'short')} - ${formatDate(endDate, 'short')}`;
}
