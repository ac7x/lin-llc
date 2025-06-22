/**
 * 日曆視圖組件
 * 
 * 提供專案時間表和里程碑的日曆視圖，包括：
 * - 月曆視圖
 * - 里程碑標記
 * - 工作包時間線
 * - 事件篩選
 */

'use client';

import { useState, useMemo } from 'react';

import { projectStyles } from '@/app/modules/projects/styles';
import type { ProjectMilestone, WorkPackage } from '@/app/modules/projects/types';

interface CalendarViewProps {
  milestones?: ProjectMilestone[];
  workpackages?: WorkPackage[];
  projectId: string;
  onDateClick?: (date: Date) => void;
  onMilestoneClick?: (milestone: ProjectMilestone) => void;
  onWorkpackageClick?: (workpackage: WorkPackage) => void;
}

interface CalendarEvent {
  type: 'milestone' | 'workpackage-start' | 'workpackage-end';
  data: ProjectMilestone | WorkPackage;
  color: string;
}

export default function CalendarView({
  milestones = [],
  workpackages = [],
  projectId: _projectId,
  onDateClick,
  onMilestoneClick,
  onWorkpackageClick,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'month' | 'week'>('month');

  // 獲取當前月份的第一天和最後一天
  const getMonthRange = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return { firstDay, lastDay };
  };

  const monthDays = useMemo(() => {
    // 獲取月份的所有日期
    const getMonthDays = (date: Date) => {
      const { firstDay, lastDay } = getMonthRange(date);
      const year = date.getFullYear();
      const month = date.getMonth();
      const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];
      
      // 添加上個月的日期
      const firstDayOfWeek = firstDay.getDay();
      for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const day = new Date(firstDay);
        day.setDate(day.getDate() - i - 1);
        days.push({ date: day, isCurrentMonth: false });
      }
      
      // 添加當前月份的日期
      for (let i = 1; i <= lastDay.getDate(); i++) {
        const day = new Date(year, month, i);
        days.push({ date: day, isCurrentMonth: true });
      }
      
      // 添加下個月的日期
      const lastDayOfWeek = lastDay.getDay();
      for (let i = 1; i <= 6 - lastDayOfWeek; i++) {
        const day = new Date(lastDay);
        day.setDate(day.getDate() + i);
        days.push({ date: day, isCurrentMonth: false });
      }
      
      return days;
    };

    return getMonthDays(currentDate);
  }, [currentDate]);

  // 檢查日期是否有事件
  const getDateEvents = (date: Date): CalendarEvent[] => {
    const events: CalendarEvent[] = [];
    
    // 檢查里程碑
    milestones.forEach(milestone => {
      const milestoneDate = milestone.targetDate;
      if (milestoneDate && isSameDay(date, milestoneDate)) {
        events.push({
          type: 'milestone',
          data: milestone,
          color: 'bg-blue-500',
        });
      }
    });
    
    // 檢查工作包開始日期
    workpackages.forEach(workpackage => {
      const startDate = workpackage.plannedStartDate;
      if (startDate && isSameDay(date, startDate)) {
        events.push({
          type: 'workpackage-start',
          data: workpackage,
          color: 'bg-green-500',
        });
      }
      
      const endDate = workpackage.plannedEndDate;
      if (endDate && isSameDay(date, endDate)) {
        events.push({
          type: 'workpackage-end',
          data: workpackage,
          color: 'bg-red-500',
        });
      }
    });
    
    return events;
  };

  const isSameDay = (date1: Date, date2: string | Date | { toDate: () => Date }) => {
    const d1 = new Date(date1);
    let d2: Date;
    
    if (typeof date2 === 'string') {
      d2 = new Date(date2);
    } else if (typeof date2 === 'object' && 'toDate' in date2) {
      d2 = date2.toDate();
    } else {
      d2 = date2 as Date;
    }
    
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
    });
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className='space-y-6'>
      {/* 控制列 */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div className='flex items-center space-x-4'>
          <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100'>
            {formatDate(currentDate)}
          </h2>
          <div className='flex items-center space-x-2'>
            <button
              onClick={goToPreviousMonth}
              className={projectStyles.button.small}
            >
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
              </svg>
            </button>
            <button
              onClick={goToToday}
              className={projectStyles.button.outline}
            >
              今天
            </button>
            <button
              onClick={goToNextMonth}
              className={projectStyles.button.small}
            >
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
              </svg>
            </button>
          </div>
        </div>
        
        <div className='flex items-center space-x-2'>
          <select
            value={viewType}
            onChange={(e) => setViewType(e.target.value as 'month' | 'week')}
            className={projectStyles.form.select}
          >
            <option value='month'>月視圖</option>
            <option value='week'>週視圖</option>
          </select>
        </div>
      </div>

      {/* 日曆網格 */}
      <div className={projectStyles.card.base}>
        {/* 星期標題 */}
        <div className='grid grid-cols-7 gap-1 mb-2'>
          {weekDays.map((day) => (
            <div
              key={day}
              className='p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400'
            >
              {day}
            </div>
          ))}
        </div>

        {/* 日期網格 */}
        <div className='grid grid-cols-7 gap-1'>
          {monthDays.map(({ date, isCurrentMonth }, index) => {
            const events = getDateEvents(date);
            const isToday = isSameDay(date, new Date());
            
            return (
              <div
                key={index}
                onClick={() => onDateClick?.(date)}
                className={`
                  min-h-[80px] p-2 border border-gray-200 dark:border-gray-700 cursor-pointer
                  hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200
                  ${!isCurrentMonth ? 'bg-gray-50 dark:bg-gray-800 text-gray-400' : ''}
                  ${isToday ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600' : ''}
                `}
              >
                <div className='text-sm font-medium mb-1'>
                  {date.getDate()}
                </div>
                
                {/* 事件標記 */}
                <div className='space-y-1'>
                  {events.slice(0, 3).map((event, eventIndex) => (
                    <div
                      key={eventIndex}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (event.type === 'milestone') {
                          onMilestoneClick?.(event.data as ProjectMilestone);
                        } else {
                          onWorkpackageClick?.(event.data as WorkPackage);
                        }
                      }}
                      className={`
                        ${event.color} text-white text-xs px-1 py-0.5 rounded truncate cursor-pointer
                        hover:opacity-80 transition-opacity duration-200
                      `}
                      title={
                        event.type === 'milestone' 
                          ? `里程碑: ${(event.data as ProjectMilestone).name}`
                          : `工作包: ${(event.data as WorkPackage).name}`
                      }
                    >
                      {event.type === 'milestone' 
                        ? (event.data as ProjectMilestone).name
                        : (event.data as WorkPackage).name
                      }
                    </div>
                  ))}
                  {events.length > 3 && (
                    <div className='text-xs text-gray-500 dark:text-gray-400'>
                      +{events.length - 3} 更多
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 圖例 */}
      <div className='flex flex-wrap gap-4 text-sm'>
        <div className='flex items-center space-x-2'>
          <div className='w-3 h-3 bg-blue-500 rounded'></div>
          <span className='text-gray-600 dark:text-gray-400'>里程碑</span>
        </div>
        <div className='flex items-center space-x-2'>
          <div className='w-3 h-3 bg-green-500 rounded'></div>
          <span className='text-gray-600 dark:text-gray-400'>工作包開始</span>
        </div>
        <div className='flex items-center space-x-2'>
          <div className='w-3 h-3 bg-red-500 rounded'></div>
          <span className='text-gray-600 dark:text-gray-400'>工作包結束</span>
        </div>
      </div>
    </div>
  );
}
