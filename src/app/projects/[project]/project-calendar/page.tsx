/**
 * 行事曆頁面
 *
 * 提供排程的日曆視圖，功能包含：
 * - 工作包排程顯示
 * - 進度追蹤
 * - 日期範圍管理
 * - 全螢幕模式
 * - 事件詳細資訊
 */

'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useDocument } from 'react-firebase-hooks/firestore';
import { useAuth } from '@/hooks/useAuth';
import { Calendar } from 'react-big-calendar';
import { format, subDays } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import '@/styles/react-big-calendar.css';
import { Workpackage, SubWorkpackage } from '@/types/project';
import { getProgressInfo, ProgressColorScale } from '@/utils/colorUtils';
import { db, doc } from '@/lib/firebase-client';
import {
  localizer,
  createCalendarEvent,
  eventStyleGetter,
  messages,
  formats,
} from '@/utils/calendarUtils';
import { CalendarEvent } from '@/types/calendar';

export default function ProjectCalendarPage() {
  const { loading: authLoading } = useAuth();
  const params = useParams();
  const projectId = params?.project as string;
  const [projectDoc, loading, error] = useDocument(doc(db, 'projects', projectId));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [view, setView] = useState<'month' | 'week' | 'day' | 'agenda'>('month');
  const calendarContainerRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); // 新增搜尋狀態

  const project = useMemo(() => (projectDoc?.exists() ? projectDoc.data() : null), [projectDoc]);

  useEffect(() => {
    if (!project?.workpackages) return;

    const calendarEvents: CalendarEvent[] = [];
    project.workpackages.forEach((wp: Workpackage) => {
      if (wp.subWorkpackages?.length) {
        wp.subWorkpackages.forEach((sub: SubWorkpackage) => {
          const event = createCalendarEvent(sub, sub.name, {
            workpackageId: wp.id,
            workpackageName: wp.name,
            quantity: sub.actualQuantity,
          });
          if (event) {
            calendarEvents.push(event);
          }
        });
      }
    });
    setEvents(calendarEvents);
  }, [project]);

  // 搜尋過濾
  const filteredEvents = events.filter(event => {
    const s = searchTerm.trim().toLowerCase();
    const searchKeywords = s ? s.split(/\s+|,|;/).filter(Boolean) : [];
    if (searchKeywords.length === 0) return true;
    const fields = [
      event.title,
      event.workpackageName,
      typeof event.progress === 'number' ? `${event.progress}` : '',
      event.quantity !== undefined ? `${event.quantity}` : '',
    ];
    return searchKeywords.some(kw => fields.some(f => f?.toLowerCase().includes(kw)));
  });

  // 自定義事件渲染
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const progressInfo = event.progress !== undefined ? getProgressInfo(event.progress) : null;

    return (
      <div className='p-1'>
        {/* 項目/進度/數量/日期全部合併成一行 */}
        <div className='text-xs' style={{ color: event.actualStartDate ? '#333' : 'white' }}>
          {event.title}
          {progressInfo && (
            <span className='font-medium'>
              {` | ${progressInfo.description} (${event.progress}%)`}
            </span>
          )}
          {event.quantity !== undefined && ` | 數量: ${event.quantity}`}
          {` | 計劃: ${format(event.start, 'MM/dd')}`}
          {event.hasEndDate ? `-${format(subDays(event.end, 1), 'MM/dd')}` : ''}
          {event.actualStartDate && (
            <>
              {` | 實際: ${format(event.actualStartDate, 'MM/dd')}`}
              {event.actualEndDate ? `-${format(event.actualEndDate, 'MM/dd')}` : ' (進行中)'}
            </>
          )}
        </div>
      </div>
    );
  };

  // 點擊事件處理
  const handleSelectEvent = (event: CalendarEvent) => {
    const endDate = subDays(event.end, 1);
    const progressInfo = event.progress !== undefined ? getProgressInfo(event.progress) : null;

    alert(`
            工作項目: ${event.title}
            所屬工作包: ${event.workpackageName}
            計劃時間: ${format(event.start, 'yyyy-MM-dd', { locale: zhTW })}${event.hasEndDate ? ` 至 ${format(endDate, 'yyyy-MM-dd', { locale: zhTW })}` : ''}
            ${event.actualStartDate ? `實際開始: ${format(event.actualStartDate, 'yyyy-MM-dd', { locale: zhTW })}` : '尚未開始'}
            ${event.actualEndDate ? `實際結束: ${format(event.actualEndDate, 'yyyy-MM-dd', { locale: zhTW })}` : '進行中'}
            ${progressInfo ? `進度階段: ${progressInfo.description} (${event.progress}%)` : ''}
            ${event.quantity !== undefined ? `數量: ${event.quantity}` : ''}
        `);
  };

  // 全螢幕切換
  const handleFullscreen = () => {
    if (!fullscreen) {
      if (calendarContainerRef.current) {
        const elem = calendarContainerRef.current as HTMLElement & {
          webkitRequestFullscreen?: () => Promise<void>;
        };
        if (elem.requestFullscreen) {
          elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          elem.webkitRequestFullscreen();
        }
        setFullscreen(true);
      }
    } else {
      const doc = document as Document & {
        webkitExitFullscreen?: () => Promise<void>;
      };
      if (doc.exitFullscreen) {
        doc.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      }
      setFullscreen(false);
    }
  };

  // 監聽全螢幕狀態變化
  useEffect(() => {
    const onFullscreenChange = () => {
      const doc = document as Document & {
        webkitFullscreenElement?: Element | null;
      };
      if (!document.fullscreenElement && !doc.webkitFullscreenElement) {
        setFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
    };
  }, []);

  if (authLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
      </div>
    );
  }
  if (loading) return <div className='p-4'>載入中...</div>;
  if (error) return <div className='p-4 text-red-500'>錯誤: {error.message}</div>;
  if (!project) return <div className='p-4'>找不到專案</div>;

  return (
    <main className='max-w-4xl mx-auto'>
      <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
        <div className='flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4'>
          <div>
            <h1 className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent'>
              行事曆
            </h1>
            <p className='text-gray-600 dark:text-gray-400 mt-2'>查看專案工作包和子工作包的排程</p>
          </div>
          <div className='flex items-center gap-2'>
            <select
              value={view}
              onChange={e => setView(e.target.value as 'month' | 'week' | 'day' | 'agenda')}
              className='border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600'
            >
              <option value='month'>月檢視</option>
              <option value='week'>週檢視</option>
              <option value='day'>日檢視</option>
              <option value='agenda'>列表檢視</option>
            </select>
            <div className='relative'>
              <input
                type='text'
                placeholder='搜尋子工作包/工作包/進度/數量...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='w-40 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
              />
              <span className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400'>🔍</span>
            </div>
            <button
              type='button'
              onClick={handleFullscreen}
              className='p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-100 border border-gray-300 dark:border-gray-600 transition-colors duration-200'
              title={fullscreen ? '離開全螢幕' : '全螢幕檢視'}
            >
              {fullscreen ? (
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 15H7a2 2 0 01-2-2v-2m0 0V7a2 2 0 012-2h2m-2 6h.01M15 9h2a2 2 0 012 2v2m0 0v4a2 2 0 01-2 2h-2m2-6h-.01'
                  />
                </svg>
              ) : (
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4 8V6a2 2 0 012-2h2M20 8V6a2 2 0 00-2-2h-2M4 16v2a2 2 0 002 2h2M20 16v2a2 2 0 01-2 2h-2'
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className='mb-4 flex justify-between items-center'>
          <div className='text-sm text-gray-500 dark:text-gray-400'>
            顯示 {filteredEvents.length} / {events.length} 個子工作包排程
          </div>
        </div>

        <div
          ref={calendarContainerRef}
          className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6 transition-all ${fullscreen ? 'fixed inset-0 z-50 w-screen h-screen max-w-none max-h-none p-2' : ''}`}
          style={{ height: fullscreen ? '100vh' : '700px' }}
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
            components={{
              event: EventComponent,
            }}
            onSelectEvent={handleSelectEvent}
            formats={formats}
            messages={messages}
          />
        </div>

        {/* 圖例說明 */}
        <div className='bg-gray-50 dark:bg-gray-700 rounded-lg p-4'>
          <h2 className='text-lg font-medium mb-4 text-gray-900 dark:text-gray-100'>
            進度階段圖例
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {/* 進度階段 */}
            {ProgressColorScale.map((scale, i) => {
              const progressInfo = getProgressInfo(scale.min);
              return (
                <div
                  key={i}
                  className='flex items-center space-x-3 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm'
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

          <div className='mt-6 pt-4 border-t border-gray-200 dark:border-gray-600'>
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
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
