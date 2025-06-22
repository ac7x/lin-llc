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

import { CalendarView } from '@/app/modules/test-projects/components/calendar';
import { PageContainer, PageHeader } from '@/app/modules/test-projects/components/common';
import { ProjectService } from '@/app/modules/test-projects/services/projectService';
import { WorkpackageService } from '@/app/modules/test-projects/services/workpackageService';
import { projectStyles } from '@/app/modules/test-projects/styles';
import type { Project, ProjectMilestone, WorkPackage } from '@/app/modules/test-projects/types';

export default function ProjectCalendarPage() {
  const params = useParams();
  const projectId = params.project as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [workpackages, setWorkpackages] = useState<WorkPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  // 載入專案和工作包資料
  useEffect(() => {
    const loadProjectData = async () => {
      try {
        setIsLoading(true);
        
        // 並行載入專案和工作包資料
        const [projectData, workpackagesData] = await Promise.all([
          ProjectService.getProjectById(projectId),
          WorkpackageService.getWorkpackagesByProject(projectId)
        ]);

        setProject(projectData);
        setWorkpackages(workpackagesData);
      } catch (error) {
        console.error('載入專案資料失敗:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      loadProjectData();
    }
  }, [projectId]);

  // 準備日曆事件資料
  const calendarEvents = workpackages.flatMap(workpackage => {
    const events = [];

    // 工作包開始日期
    if (workpackage.estimatedStartDate) {
      events.push({
        id: `${workpackage.id}-start`,
        title: `${workpackage.name} - 開始`,
        start: workpackage.estimatedStartDate,
        end: workpackage.estimatedStartDate,
        color: 'blue',
        type: 'start',
        workpackageId: workpackage.id,
      });
    }

    // 工作包結束日期
    if (workpackage.estimatedEndDate) {
      events.push({
        id: `${workpackage.id}-end`,
        title: `${workpackage.name} - 結束`,
        start: workpackage.estimatedEndDate,
        end: workpackage.estimatedEndDate,
        color: 'red',
        type: 'end',
        workpackageId: workpackage.id,
      });
    }

    // 子工作包事件
    workpackage.subPackages?.forEach((subWorkpackage: import('@/app/modules/test-projects/types').SubWorkPackage) => {
      if (subWorkpackage.estimatedStartDate) {
        events.push({
          id: `${subWorkpackage.id}-start`,
          title: `${subWorkpackage.name} - 開始`,
          start: subWorkpackage.estimatedStartDate,
          end: subWorkpackage.estimatedStartDate,
          color: 'green',
          type: 'sub-start',
          workpackageId: workpackage.id,
          subWorkpackageId: subWorkpackage.id,
        });
      }

      if (subWorkpackage.estimatedEndDate) {
        events.push({
          id: `${subWorkpackage.id}-end`,
          title: `${subWorkpackage.name} - 結束`,
          start: subWorkpackage.estimatedEndDate,
          end: subWorkpackage.estimatedEndDate,
          color: 'orange',
          type: 'sub-end',
          workpackageId: workpackage.id,
          subWorkpackageId: subWorkpackage.id,
        });
      }
    });

    return events;
  });

  const handleMilestoneClick = (milestone: ProjectMilestone) => {
    // TODO: 實作里程碑點擊處理邏輯
  };

  const handleWorkpackageClick = (workpackage: WorkPackage) => {
    // TODO: 實作工作包點擊處理邏輯
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className='flex items-center justify-center h-64'>
          <div className='text-gray-500 dark:text-gray-400'>載入中...</div>
        </div>
      </PageContainer>
    );
  }

  if (!project) {
    return (
      <PageContainer>
        <div className='text-center py-12'>
          <div className='text-gray-500 dark:text-gray-400'>專案不存在</div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={`${project.projectName} - 日曆`}
        subtitle='查看專案時程和重要事件'
      />

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
                {selectedDate.toLocaleDateString('zh-TW', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
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

        {/* 日曆視圖 */}
        <div className={projectStyles.card.base}>
          <CalendarView
            milestones={[]}
            workpackages={workpackages}
            projectId={projectId}
            onDateClick={(date) => setSelectedDate(date)}
            onMilestoneClick={handleMilestoneClick}
            onWorkpackageClick={handleWorkpackageClick}
          />
        </div>

        {/* 圖例說明 */}
        <div className={projectStyles.card.base}>
          <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-4'>
            圖例說明
          </h3>
          
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
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
          </div>
        </div>

        {/* 統計資訊 */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className={projectStyles.card.base}>
            <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-2'>
              工作包統計
            </h3>
            <div className='space-y-2'>
              <div className='flex justify-between'>
                <span className='text-sm text-gray-600 dark:text-gray-400'>總數</span>
                <span className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                  {workpackages.length}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-sm text-gray-600 dark:text-gray-400'>進行中</span>
                <span className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                  {workpackages.filter(wp => wp.status === 'in-progress').length}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-sm text-gray-600 dark:text-gray-400'>已完成</span>
                <span className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                  {workpackages.filter(wp => wp.status === 'completed').length}
                </span>
              </div>
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
                      return project.startDate.toLocaleDateString();
                    }
                    if (typeof project.startDate === 'object' && project.startDate?.toDate) {
                      return project.startDate.toDate().toLocaleDateString();
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
                      return project.estimatedEndDate.toLocaleDateString();
                    }
                    if (typeof project.estimatedEndDate === 'object' && project.estimatedEndDate?.toDate) {
                      return project.estimatedEndDate.toDate().toLocaleDateString();
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
