/**
 * 專案日曆頁面
 * 
 * 顯示專案的日曆視圖，包括：
 * - 工作包時程
 * - 里程碑
 * - 重要事件
 * - 進度追蹤
 */

'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

import { CalendarView } from '@/app/modules/projects/components/calendar';
import { PageContainer, PageHeader, LoadingSpinner } from '@/app/modules/projects/components/common';
import { ProjectService } from '@/app/modules/projects/services/projectService';
import { CalendarService } from '@/app/modules/projects/services/calendarService';
import { useProjectCalendar } from '@/app/modules/projects/hooks/useProjectCalendar';
import { projectStyles } from '@/app/modules/projects/styles';
import { 
  formatDate, 
  getCalendarStats, 
  getTodayEvents, 
  getUpcomingEvents, 
  getOverdueEvents 
} from '@/app/modules/projects/utils/calendarUtils';
import type { Project, ProjectMilestone, WorkPackage } from '@/app/modules/projects/types';
import { getErrorMessage, logError } from '@/utils/errorUtils';

export default function ProjectCalendarPage() {
  const params = useParams();
  const projectId = params.project as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  // 使用日曆 Hook
  const {
    events,
    isLoading: eventsLoading,
    error: eventsError,
    todayEvents,
    upcomingEvents,
    overdueEvents,
    refreshEvents,
  } = useProjectCalendar({
    projectId,
    autoRefresh: true,
    refreshInterval: 60000, // 1分鐘
  });

  // 載入專案資料
  useEffect(() => {
    const loadProjectData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const projectData = await ProjectService.getProjectById(projectId);
        setProject(projectData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '載入專案資料失敗';
        setError(errorMessage);
        logError(err as Error, { operation: 'load_project_data', projectId });
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      loadProjectData();
    }
  }, [projectId]);

  // 處理里程碑點擊
  const handleMilestoneClick = (milestone: ProjectMilestone) => {
    console.log('里程碑點擊:', milestone);
    // TODO: 實作里程碑詳細資訊顯示
  };

  // 處理工作包點擊
  const handleWorkPackageClick = (workPackage: WorkPackage) => {
    console.log('工作包點擊:', workPackage);
    // TODO: 實作工作包詳細資訊顯示
  };

  // 處理日期點擊
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    console.log('日期點擊:', formatDate(date, 'long'));
  };

  // 計算統計資料
  const stats = getCalendarStats(events);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="large" />
        </div>
      </PageContainer>
    );
  }

  if (!project) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400">專案不存在</div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={`${project.projectName} - 日曆`}
        subtitle='查看專案時程和重要事件'
      >
        <button
          onClick={refreshEvents}
          disabled={eventsLoading}
          className={projectStyles.button.outline}
        >
          {eventsLoading ? '重新載入中...' : '重新載入'}
        </button>
      </PageHeader>

      {/* 錯誤顯示 */}
      {(error || eventsError) && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error || eventsError}</p>
        </div>
      )}

      <div className='space-y-6'>
        {/* 日曆控制項 */}
        <div className={projectStyles.card.base}>
          <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
            {/* 視圖模式選擇 */}
            <div className='flex space-x-2'>
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  viewMode === 'month'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                月視圖
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  viewMode === 'week'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                週視圖
              </button>
              <button
                onClick={() => setViewMode('day')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  viewMode === 'day'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                日視圖
              </button>
            </div>

            {/* 日期導航 */}
            <div className='flex items-center space-x-2'>
              <button
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  if (viewMode === 'month') {
                    newDate.setMonth(newDate.getMonth() - 1);
                  } else if (viewMode === 'week') {
                    newDate.setDate(newDate.getDate() - 7);
                  } else {
                    newDate.setDate(newDate.getDate() - 1);
                  }
                  setSelectedDate(newDate);
                }}
                className='p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              >
                ←
              </button>
              <span className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                {formatDate(selectedDate, 'long')}
              </span>
              <button
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  if (viewMode === 'month') {
                    newDate.setMonth(newDate.getMonth() + 1);
                  } else if (viewMode === 'week') {
                    newDate.setDate(newDate.getDate() + 7);
                  } else {
                    newDate.setDate(newDate.getDate() + 1);
                  }
                  setSelectedDate(newDate);
                }}
                className='p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              >
                →
              </button>
              <button
                onClick={() => setSelectedDate(new Date())}
                className='px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600'
              >
                今天
              </button>
            </div>
          </div>
        </div>

        {/* 快速統計 */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <div className={projectStyles.card.stats}>
            <div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
              {stats.today}
            </div>
            <div className='text-sm text-gray-600 dark:text-gray-400'>
              今日事件
            </div>
          </div>
          <div className={projectStyles.card.stats}>
            <div className='text-2xl font-bold text-green-600 dark:text-green-400'>
              {stats.upcoming}
            </div>
            <div className='text-sm text-gray-600 dark:text-gray-400'>
              即將到來
            </div>
          </div>
          <div className={projectStyles.card.stats}>
            <div className='text-2xl font-bold text-red-600 dark:text-red-400'>
              {stats.overdue}
            </div>
            <div className='text-sm text-gray-600 dark:text-gray-400'>
              逾期事件
            </div>
          </div>
          <div className={projectStyles.card.stats}>
            <div className='text-2xl font-bold text-gray-600 dark:text-gray-400'>
              {stats.total}
            </div>
            <div className='text-sm text-gray-600 dark:text-gray-400'>
              總事件數
            </div>
          </div>
        </div>

        {/* 日曆視圖 */}
        <div className={projectStyles.card.base}>
          <CalendarView
            milestones={project.milestones || []}
            workPackages={[]} // 事件已從 CalendarService 取得
            onDateClick={handleDateClick}
            onMilestoneClick={handleMilestoneClick}
            onWorkPackageClick={handleWorkPackageClick}
          />
        </div>

        {/* 圖例說明 */}
        <div className={projectStyles.card.base}>
          <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-4'>
            圖例說明
          </h3>
          
          <div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
            <div className='flex items-center space-x-2'>
              <div className='w-4 h-4 bg-blue-500 rounded'></div>
              <span className='text-sm text-gray-600 dark:text-gray-400'>里程碑</span>
            </div>
            <div className='flex items-center space-x-2'>
              <div className='w-4 h-4 bg-green-500 rounded'></div>
              <span className='text-sm text-gray-600 dark:text-gray-400'>工作包開始</span>
            </div>
            <div className='flex items-center space-x-2'>
              <div className='w-4 h-4 bg-red-500 rounded'></div>
              <span className='text-sm text-gray-600 dark:text-gray-400'>工作包結束</span>
            </div>
            <div className='flex items-center space-x-2'>
              <div className='w-4 h-4 bg-orange-500 rounded'></div>
              <span className='text-sm text-gray-600 dark:text-gray-400'>子工作包開始</span>
            </div>
            <div className='flex items-center space-x-2'>
              <div className='w-4 h-4 bg-purple-500 rounded'></div>
              <span className='text-sm text-gray-600 dark:text-gray-400'>子工作包結束</span>
            </div>
          </div>
        </div>

        {/* 統計資訊 */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className={projectStyles.card.base}>
            <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-2'>
              事件統計
            </h3>
            <div className='space-y-2'>
              {Object.entries(stats.byType).map(([type, count]) => (
                <div key={type} className='flex justify-between'>
                  <span className='text-sm text-gray-600 dark:text-gray-400'>
                    {getEventTypeLabel(type)}
                  </span>
                  <span className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={projectStyles.card.base}>
            <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-2'>
              專案進度
            </h3>
            <div className='space-y-2'>
              <div className='flex justify-between'>
                <span className='text-sm text-gray-600 dark:text-gray-400'>整體進度</span>
                <span className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                  {project.progress}%
                </span>
              </div>
              <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                <div
                  className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className={projectStyles.card.base}>
            <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-2'>
              時程資訊
            </h3>
            <div className='space-y-2'>
              <div className='flex justify-between'>
                <span className='text-sm text-gray-600 dark:text-gray-400'>開始日期</span>
                <span className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                  {(() => {
                    if (project.startDate instanceof Date) {
                      return formatDate(project.startDate);
                    }
                    if (typeof project.startDate === 'object' && project.startDate?.toDate) {
                      return formatDate(project.startDate.toDate());
                    }
                    return '未設定';
                  })()}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-sm text-gray-600 dark:text-gray-400'>預計結束</span>
                <span className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                  {(() => {
                    if (project.estimatedEndDate instanceof Date) {
                      return formatDate(project.estimatedEndDate);
                    }
                    if (typeof project.estimatedEndDate === 'object' && project.estimatedEndDate?.toDate) {
                      return formatDate(project.estimatedEndDate.toDate());
                    }
                    return '未設定';
                  })()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

/**
 * 取得事件類型標籤
 */
function getEventTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'milestone': '里程碑',
    'workPackage-start': '工作包開始',
    'workPackage-end': '工作包結束',
    'subWorkPackage-start': '子工作包開始',
    'subWorkPackage-end': '子工作包結束',
  };
  
  return labels[type] || type;
}
