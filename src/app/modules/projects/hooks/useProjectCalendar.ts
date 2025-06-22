/**
 * 專案日曆 Hook
 * 
 * 提供專案日曆相關的狀態管理和數據處理
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { CalendarService, type CalendarEventData } from '../services/calendarService';
import type { Project, WorkPackage, ProjectMilestone } from '../types';

interface UseProjectCalendarOptions {
  projectId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseProjectCalendarReturn {
  // 數據狀態
  events: CalendarEventData[];
  isLoading: boolean;
  error: string | null;
  
  // 篩選狀態
  selectedDate: Date;
  viewMode: 'month' | 'week' | 'day';
  eventTypeFilter: string[];
  
  // 統計數據
  todayEvents: CalendarEventData[];
  upcomingEvents: CalendarEventData[];
  overdueEvents: CalendarEventData[];
  
  // 操作方法
  refreshEvents: () => Promise<void>;
  setSelectedDate: (date: Date) => void;
  setViewMode: (mode: 'month' | 'week' | 'day') => void;
  setEventTypeFilter: (types: string[]) => void;
  getEventsByDateRange: (startDate: Date, endDate: Date) => CalendarEventData[];
  getEventsByDate: (date: Date) => CalendarEventData[];
}

export function useProjectCalendar({
  projectId,
  autoRefresh = true,
  refreshInterval = 30000, // 30秒
}: UseProjectCalendarOptions): UseProjectCalendarReturn {
  const [events, setEvents] = useState<CalendarEventData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [eventTypeFilter, setEventTypeFilter] = useState<string[]>([]);

  // 初始化載入
  useEffect(() => {
    const loadData = async () => {
      if (!projectId) return;

      try {
        setIsLoading(true);
        setError(null);
        const eventsData = await CalendarService.getProjectCalendarEvents(projectId);
        setEvents(eventsData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '載入日曆事件失敗';
        setError(errorMessage);
        console.error('載入日曆事件失敗:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [projectId]);

  // 自動刷新
  useEffect(() => {
    if (!autoRefresh || !projectId) return;

    const interval = setInterval(async () => {
      try {
        const eventsData = await CalendarService.getProjectCalendarEvents(projectId);
        setEvents(eventsData);
      } catch (err) {
        console.error('自動刷新日曆事件失敗:', err);
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, projectId]);

  // 計算今日事件
  const todayEvents = useMemo(() => {
    const today = new Date();
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.getFullYear() === today.getFullYear() &&
             eventDate.getMonth() === today.getMonth() &&
             eventDate.getDate() === today.getDate();
    });
  }, [events]);

  // 計算即將到來的事件（未來7天）
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= today && eventDate <= nextWeek;
    });
  }, [events]);

  // 計算逾期事件
  const overdueEvents = useMemo(() => {
    const today = new Date();
    return events.filter(event => {
      const eventDate = new Date(event.end);
      return eventDate < today && 
             (event.type === 'workPackage-end' || event.type === 'subWorkPackage-end' || event.type === 'milestone');
    });
  }, [events]);

  // 根據日期範圍篩選事件
  const getEventsByDateRange = useCallback((startDate: Date, endDate: Date): CalendarEventData[] => {
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= startDate && eventDate <= endDate;
    });
  }, [events]);

  // 根據特定日期篩選事件
  const getEventsByDate = useCallback((date: Date): CalendarEventData[] => {
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.getFullYear() === date.getFullYear() &&
             eventDate.getMonth() === date.getMonth() &&
             eventDate.getDate() === date.getDate();
    });
  }, [events]);

  // 篩選後的事件
  const filteredEvents = useMemo(() => {
    if (eventTypeFilter.length === 0) {
      return events;
    }
    
    return events.filter(event => eventTypeFilter.includes(event.type));
  }, [events, eventTypeFilter]);

  // 手動刷新事件
  const refreshEvents = useCallback(async () => {
    if (!projectId) return;

    try {
      setIsLoading(true);
      setError(null);
      const eventsData = await CalendarService.getProjectCalendarEvents(projectId);
      setEvents(eventsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '載入日曆事件失敗';
      setError(errorMessage);
      console.error('載入日曆事件失敗:', err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  return {
    // 數據狀態
    events: filteredEvents,
    isLoading,
    error,
    
    // 篩選狀態
    selectedDate,
    viewMode,
    eventTypeFilter,
    
    // 統計數據
    todayEvents,
    upcomingEvents,
    overdueEvents,
    
    // 操作方法
    refreshEvents,
    setSelectedDate,
    setViewMode,
    setEventTypeFilter,
    getEventsByDateRange,
    getEventsByDate,
  };
}

/**
 * 簡化的日曆 Hook，用於基本日曆功能
 */
export function useSimpleProjectCalendar(projectId: string) {
  const [events, setEvents] = useState<CalendarEventData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    if (!projectId) return;

    try {
      setIsLoading(true);
      setError(null);
      const eventsData = await CalendarService.getProjectCalendarEvents(projectId);
      setEvents(eventsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '載入日曆事件失敗';
      setError(errorMessage);
      console.error('載入日曆事件失敗:', err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  return {
    events,
    isLoading,
    error,
    refresh: loadEvents,
  };
}
