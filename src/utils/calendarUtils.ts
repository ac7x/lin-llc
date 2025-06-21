import { format, parse, startOfWeek, getDay, addDays, isValid } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { dateFnsLocalizer } from 'react-big-calendar';

import { CalendarEvent, Schedulable } from '@/types/calendar';
import { getProgressInfo } from '@/utils/colorUtils';
import { parseToDate } from '@/utils/dateUtils';

/**
 * react-big-calendar 的 date-fns localizer
 */
export const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { 'zh-TW': zhTW },
});

/**
 * 建立行事曆事件的輔助函數
 * @param item - 可排程的項目 (如 workpackage)
 * @param title - 事件標題
 * @param extras - 額外資訊，如 projectName
 * @returns - CalendarEvent 物件或 null
 */
export function createCalendarEvent(
  item: Schedulable,
  title: string,
  extras: Partial<CalendarEvent> = {}
): CalendarEvent | null {
  const sDate = item.plannedStartDate ? parseToDate(item.plannedStartDate) : null;
  if (!sDate || !isValid(sDate)) {
    return null;
  }

  const eDate = item.plannedEndDate ? parseToDate(item.plannedEndDate) : null;
  const aStartDate = item.actualStartDate ? parseToDate(item.actualStartDate) : null;
  const aEndDate = item.actualEndDate ? parseToDate(item.actualEndDate) : null;

  let endDate: Date;
  let hasEndDate = false;

  if (eDate && isValid(eDate)) {
    endDate = addDays(eDate, 1);
    hasEndDate = true;
  } else {
    endDate = addDays(sDate, 1);
  }

  return {
    id: item.id,
    title,
    start: sDate,
    end: endDate,
    progress: item.progress,
    actualStartDate: aStartDate && isValid(aStartDate) ? aStartDate : undefined,
    actualEndDate: aEndDate && isValid(aEndDate) ? aEndDate : undefined,
    hasEndDate,
    allDay: true,
    ...extras,
  };
}

/**
 * 提供給 react-big-calendar 的事件樣式 getter
 * @param event - CalendarEvent
 * @returns - 事件的樣式物件
 */
export const eventStyleGetter = (event: CalendarEvent) => {
  const progressInfo = event.progress !== undefined ? getProgressInfo(event.progress) : null;
  const backgroundColor = progressInfo ? progressInfo.color : '#3174ad';

  const style: React.CSSProperties = {
    borderRadius: '4px',
    opacity: 0.9,
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    border: '1px solid transparent',
    color: 'white',
  };

  if (event.actualStartDate) {
    // 來自專案行事曆的樣式：實際開始時使用漸層背景
    style.background = `linear-gradient(to right, ${backgroundColor}66, ${backgroundColor}66)`;
    style.borderLeft = `4px solid ${backgroundColor}`;
    style.backgroundColor = 'transparent';
    style.color = '#333';
  } else {
    style.backgroundColor = backgroundColor;
  }

  if (!event.hasEndDate) {
    // 來自全域行事曆的樣式：無結束日期時使用虛線框
    style.borderColor = '#ff6b6b';
    style.borderStyle = 'dashed';
    style.borderWidth = '2px';
  }

  return { style };
};

/**
 * react-big-calendar 的 i18n 訊息
 */
export const messages = {
  allDay: '全天',
  previous: '上一個',
  next: '下一個',
  today: '今天',
  month: '月',
  week: '週',
  day: '日',
  agenda: '列表',
  date: '日期',
  time: '時間',
  event: '事件',
  noEventsInRange: '此範圍內沒有排程',
};

/**
 * react-big-calendar 的日期格式
 */
export const formats = {
  monthHeaderFormat: (date: Date) => format(date, 'yyyy年M月', { locale: zhTW }),
  weekdayFormat: (date: Date) => `週${  '日一二三四五六'.charAt(getDay(date))}`,
  dayFormat: (date: Date) => `週${  '日一二三四五六'.charAt(getDay(date))}`,
};
