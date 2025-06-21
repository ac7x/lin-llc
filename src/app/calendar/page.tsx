/**
 * 全域行事曆頁面
 *
 * 提供所有專案和工作的行事曆視圖，功能包含：
 * - 跨排程顯示
 * - 工作包進度追蹤
 * - 日期範圍管理
 * - 全螢幕模式
 * - 事件詳細資訊
 */

'use client';

import { format, subDays } from 'date-fns';
import { collection, getDocs } from 'firebase/firestore';
import { useState, useEffect, useRef } from 'react';
import { Calendar } from 'react-big-calendar';
import '@/styles/react-big-calendar.css';

import { db } from '@/lib/firebase-client';
import { CalendarEvent } from '@/types/calendar';
import { Workpackage, SubWorkpackage } from '@/types/project';
import {
  localizer,
  createCalendarEvent,
  eventStyleGetter,
  messages,
  formats,
} from '@/utils/calendarUtils';
import { getProgressInfo, ProgressColorScale } from '@/utils/colorUtils';
import { getErrorMessage, logError, safeAsync, retry } from '@/utils/errorUtils';

export default function ProjectCalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [view, setView] = useState<'month' | 'week' | 'day' | 'agenda'>('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const calendarContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAllWorkpackages = async () => {
      setLoading(true);
      await safeAsync(async () => {
        const projectsSnapshot = await retry(() => getDocs(collection(db, 'projects')), 3, 1000);
        const calendarEvents: CalendarEvent[] = [];

        for (const docSnap of projectsSnapshot.docs) {
          const project = docSnap.data();
          if (project.workpackages) {
            for (const wp of project.workpackages as Workpackage[]) {
              const wpEvent = createCalendarEvent(wp, `${project.projectName} - ${wp.name}`, {
                projectName: project.projectName,
                workpackageId: wp.id,
              });
              if (wpEvent) calendarEvents.push(wpEvent);

              if (wp.subWorkpackages) {
                for (const sub of wp.subWorkpackages as SubWorkpackage[]) {
                  const subEvent = createCalendarEvent(
                    sub,
                    `${project.projectName} - ${wp.name} - ${sub.name}`,
                    {
                      projectName: project.projectName,
                      workpackageId: wp.id,
                    }
                  );
                  if (subEvent) calendarEvents.push(subEvent);
                }
              }
            }
          }
        }

        setEvents(calendarEvents);
        setError(null);
      }, (error) => {
        setError(getErrorMessage(error));
        logError(error, { operation: 'fetch_all_workpackages' });
      });
      setLoading(false);
    };
    fetchAllWorkpackages();
  }, []);

  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const isDelayed = event.actualEndDate && event.end && event.actualEndDate > event.end;
    const progressInfo = event.progress !== undefined ? getProgressInfo(event.progress) : null;

    return (
      <div className='p-1'>
        <div className='text-xs' style={{ color: event.actualStartDate ? '#333' : 'white' }}>
          {event.title}
          {progressInfo && (
            <span className='font-medium'>
              {` | ${progressInfo.description} (${event.progress}%)`}
            </span>
          )}
          {` | 計劃: ${format(event.start, 'MM/dd')}`}
          {event.hasEndDate ? `-${format(subDays(event.end, 1), 'MM/dd')}` : ' (結束日期未設置)'}
          {event.actualStartDate && (
            <>
              {` | 實際: ${format(event.actualStartDate, 'MM/dd')}`}
              {event.actualEndDate ? `-${format(event.actualEndDate, 'MM/dd')}` : ' (進行中)'}
            </>
          )}
          {isDelayed && <span className='ml-1 text-yellow-500'>⚠️ 延遲</span>}
        </div>
      </div>
    );
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    const plannedDateRange = event.hasEndDate
      ? `計劃：${format(event.start, 'yyyy-MM-dd')} 至 ${format(subDays(event.end, 1), 'yyyy-MM-dd')}`
      : `計劃：${format(event.start, 'yyyy-MM-dd')} (結束日期未設置)`;
    const actualDateRange =
      event.actualStartDate || event.actualEndDate
        ? `\n實際：${event.actualStartDate ? format(event.actualStartDate, 'yyyy-MM-dd') : '尚未開始'} 至 ${event.actualEndDate ? format(event.actualEndDate, 'yyyy-MM-dd') : '進行中'}`
        : '';

    const progressInfo = event.progress !== undefined ? getProgressInfo(event.progress) : null;
    const progressText = progressInfo
      ? `進度階段: ${progressInfo.description} (${event.progress}%)`
      : event.progress !== undefined
        ? `進度: ${event.progress}%`
        : '進度未提供';

    alert(`工作包: ${event.title}
所屬專案: ${event.projectName}
${plannedDateRange}${actualDateRange}
${progressText}`);
  };

  const handleFullscreen = () => {
    if (!calendarContainerRef.current) return;
    if (!isFullscreen) {
      if (calendarContainerRef.current.requestFullscreen) {
        calendarContainerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const filteredEvents = events.filter(event => {
    const s = searchTerm.trim().toLowerCase();
    const searchKeywords = s ? s.split(/\s+|,|;/).filter(Boolean) : [];
    if (searchKeywords.length === 0) return true;
    const fields = [
      event.title,
      event.projectName,
      typeof event.progress === 'number' ? `${event.progress}` : '',
    ];
    const matchSearch =
      searchKeywords.length > 0 &&
      searchKeywords.some(kw => fields.some(f => f?.toLowerCase().includes(kw)));
    return matchSearch;
  });

  if (loading)
    return (
      <main className='max-w-4xl mx-auto'>
        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
          <div className='flex items-center justify-center py-8'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
          </div>
        </div>
      </main>
    );

  if (error)
    return (
      <main className='max-w-4xl mx-auto'>
        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
          <div className='text-red-500 text-center py-4'>錯誤: {error}</div>
        </div>
      </main>
    );

  return (
    <main className='max-w-4xl mx-auto'>
      <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
        <div className='flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4'>
          <h1 className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent'>
            行事曆
          </h1>
          <div className='flex items-center gap-2'>
            <select
              value={view}
              onChange={e => setView(e.target.value as 'month' | 'week' | 'day' | 'agenda')}
              className='block rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
            >
              <option value='month'>月檢視</option>
              <option value='week'>週檢視</option>
              <option value='day'>日檢視</option>
              <option value='agenda'>列表檢視</option>
            </select>
            <div className='relative'>
              <input
                type='text'
                placeholder='搜尋事件/專案/進度...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='block w-40 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
              />
              <span className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400'>🔍</span>
            </div>
            <button
              type='button'
              onClick={handleFullscreen}
              className='px-3 py-2 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-200'
              title={isFullscreen ? '離開全螢幕' : '全螢幕'}
            >
              {isFullscreen ? (
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-5 w-5'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              ) : (
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-5 w-5'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4 8V4h4M20 8V4h-4M4 16v4h4m12-4v4h-4'
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className='text-sm text-gray-500 dark:text-gray-400 mb-4'>
          顯示 {filteredEvents.length} / {events.length} 個工作包排程
        </div>

        <div
          ref={calendarContainerRef}
          className={`bg-white dark:bg-gray-900 rounded-lg shadow p-4 mb-6${isFullscreen ? ' fixed inset-0 z-50 !rounded-none !mb-0 !p-0 !max-w-none !h-screen' : ''}`}
          style={{ height: isFullscreen ? '100vh' : '700px' }}
        >
          <Calendar
            localizer={localizer}
            events={filteredEvents}
            startAccessor='start'
            endAccessor='end'
            style={{ height: '100%' }}
            views={['month', 'week', 'day', 'agenda']}
            view={view}
            onView={newView => setView(newView as 'month' | 'week' | 'day' | 'agenda')}
            eventPropGetter={eventStyleGetter}
            components={{ event: EventComponent }}
            onSelectEvent={handleSelectEvent}
            formats={formats}
            messages={messages}
          />
        </div>

        <div className='bg-white dark:bg-gray-900 rounded-lg shadow p-4'>
          <h2 className='text-lg font-medium mb-4 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent'>
            進度階段圖例
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6'>
            {/* 進度階段 */}
            {ProgressColorScale.map((scale, i) => {
              const progressInfo = getProgressInfo(scale.min);
              return (
                <div
                  key={i}
                  className='flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm'
                >
                  <div
                    className='w-6 h-4 rounded-md shadow-sm'
                    style={{ backgroundColor: scale.color }}
                  ></div>
                  <div className='flex-1'>
                    <div className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                      {progressInfo.description}
                    </div>
                    <div className='text-xs text-gray-500 dark:text-gray-400'>
                      {scale.min}% - {scale.max}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className='pt-4 border-t border-gray-200 dark:border-gray-600'>
            <h3 className='text-md font-medium mb-3 text-gray-900 dark:text-gray-100'>
              時間狀態說明
            </h3>
            <div className='flex flex-wrap gap-4 items-center'>
              <span className='flex items-center'>
                <div className='w-10 h-2.5 bg-blue-500 mr-2 rounded'></div>
                <span className='text-sm text-gray-700 dark:text-gray-300'>計劃時間</span>
              </span>
              <span className='flex items-center'>
                <div className='w-10 h-2.5 border-l-4 border-blue-500 bg-blue-100 mr-2 rounded'></div>
                <span className='text-sm text-gray-700 dark:text-gray-300'>實際時間</span>
              </span>
              <span className='flex items-center'>
                <div className='w-10 h-2.5 border-2 border-dashed border-red-400 bg-blue-500 mr-2 rounded'></div>
                <span className='text-sm text-gray-700 dark:text-gray-300'>結束日期未設置</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
