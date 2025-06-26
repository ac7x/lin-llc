'use client';

import React, { useState } from 'react';
import { Calendar, Views } from 'react-big-calendar';
import { dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// 設定 date-fns 本地化
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { 'zh-TW': zhTW }
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: any;
}

interface ProjectCalendarProps {
  projectId: string;
}

export default function ProjectCalendar({ projectId }: ProjectCalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: '1',
      title: '專案啟動會議',
      start: new Date(2024, 0, 15, 9, 0),
      end: new Date(2024, 0, 15, 10, 0),
    },
    {
      id: '2',
      title: '需求分析階段',
      start: new Date(2024, 0, 16, 9, 0),
      end: new Date(2024, 0, 20, 18, 0),
    },
    {
      id: '3',
      title: '設計評審',
      start: new Date(2024, 0, 22, 14, 0),
      end: new Date(2024, 0, 22, 16, 0),
    }
  ]);

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    const title = window.prompt('請輸入事件標題：');
    if (title) {
      const newEvent: CalendarEvent = {
        id: Date.now().toString(),
        title,
        start,
        end,
      };
      setEvents(prev => [...prev, newEvent]);
    }
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    if (window.confirm(`刪除事件："${event.title}"？`)) {
      setEvents(prev => prev.filter(e => e.id !== event.id));
    }
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    return {
      style: {
        backgroundColor: '#3174ad',
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>專案行事曆</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: '600px' }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            selectable
            eventPropGetter={eventStyleGetter}
            views={[Views.MONTH, Views.WEEK, Views.DAY]}
            defaultView={Views.MONTH}
            step={30}
            showMultiDayTimes
            messages={{
              next: '下一個',
              previous: '上一個',
              today: '今天',
              month: '月',
              week: '週',
              day: '日',
              agenda: '議程',
              date: '日期',
              time: '時間',
              event: '事件',
              allDay: '全天',
              noEventsInRange: '此範圍內沒有事件'
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
} 