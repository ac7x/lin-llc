/**
 * 專案時程管理頁面
 * 
 * 提供完整的專案時程管理功能，包括甘特圖、時程列表、依賴關係圖等
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

import { useAuth } from '@/hooks/useAuth';
import { useProjectSchedule } from '@/app/modules/projects/hooks/useProjectSchedule';
import { ScheduleService } from '@/app/modules/projects/services/scheduleService';

import {
  PageContainer,
  PageHeader,
  LoadingSpinner,
  DataLoader,
} from '@/app/modules/projects/components/common';

import {
  GanttChart,
  MilestoneMarker,
  ScheduleForm,
  ScheduleList,
  TaskDependencyGraph,
} from '@/app/modules/projects/components/schedule';

import { projectStyles } from '@/app/modules/projects/styles';
import type { ScheduleItem, ScheduleDependency } from '@/app/modules/projects/services/scheduleService';

type ViewMode = 'gantt' | 'list' | 'dependency' | 'form';

export default function ProjectSchedulePage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const projectId = params.project as string;

  const [viewMode, setViewMode] = useState<ViewMode>('gantt');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null);

  // 使用時程 Hook
  const {
    scheduleItems,
    dependencies,
    stats,
    isLoading,
    error,
    filteredItems,
    upcomingDeadlines,
    overdueItems,
    criticalPathItems,
    refreshSchedule,
    updateItemProgress,
    addDependency,
    deleteDependency,
  } = useProjectSchedule({
    projectId,
    autoRefresh: true,
    refreshInterval: 30000,
  });

  // 處理新增時程項目
  const handleAddScheduleItem = async (data: Omit<ScheduleItem, 'id' | 'data'>) => {
    try {
      // 這裡需要實作新增時程項目的邏輯
      console.log('新增時程項目:', data);
      await refreshSchedule();
      setShowForm(false);
    } catch (error) {
      console.error('新增時程項目失敗:', error);
    }
  };

  // 處理編輯時程項目
  const handleEditScheduleItem = async (data: Omit<ScheduleItem, 'id' | 'data'>) => {
    if (!editingItem) return;

    try {
      // 這裡需要實作編輯時程項目的邏輯
      console.log('編輯時程項目:', editingItem.id, data);
      await refreshSchedule();
      setShowForm(false);
      setEditingItem(null);
    } catch (error) {
      console.error('編輯時程項目失敗:', error);
    }
  };

  // 處理刪除時程項目
  const handleDeleteScheduleItem = async (itemId: string) => {
    try {
      // 這裡需要實作刪除時程項目的邏輯
      console.log('刪除時程項目:', itemId);
      await refreshSchedule();
    } catch (error) {
      console.error('刪除時程項目失敗:', error);
    }
  };

  // 處理時程項目點擊
  const handleItemClick = (item: ScheduleItem) => {
    setSelectedItem(item);
  };

  // 處理時程項目編輯
  const handleItemEdit = (item: ScheduleItem) => {
    setEditingItem(item);
    setShowForm(true);
  };

  // 處理新增按鈕點擊
  const handleAddClick = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  // 處理表單取消
  const handleFormCancel = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  // 處理表單提交
  const handleFormSubmit = async (data: Omit<ScheduleItem, 'id' | 'data'>) => {
    if (editingItem) {
      await handleEditScheduleItem(data);
    } else {
      await handleAddScheduleItem(data);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            需要登入
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            請先登入以查看專案時程
          </p>
        </div>
      </div>
    );
  }

  return (
    <PageContainer>
      <PageHeader 
        title="專案時程管理" 
        subtitle="管理專案時程、里程碑和任務依賴關係"
      >
        <div className="flex space-x-2">
          <button
            onClick={handleAddClick}
            className={projectStyles.button.primary}
          >
            新增時程項目
          </button>
          <button
            onClick={refreshSchedule}
            disabled={isLoading}
            className={projectStyles.button.outline}
          >
            {isLoading ? '載入中...' : '重新載入'}
          </button>
        </div>
      </PageHeader>

      {/* 錯誤顯示 */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* 統計卡片 */}
      {stats && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white dark:bg-gray-800 border rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {stats.totalItems}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">總項目</div>
          </div>
          <div className="p-4 bg-white dark:bg-gray-800 border rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-green-600">
              {stats.completedItems}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">已完成</div>
          </div>
          <div className="p-4 bg-white dark:bg-gray-800 border rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-blue-600">
              {stats.inProgressItems}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">進行中</div>
          </div>
          <div className="p-4 bg-white dark:bg-gray-800 border rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-red-600">
              {stats.overdueItems}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">逾期</div>
          </div>
        </div>
      )}

      {/* 視圖模式切換 */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('gantt')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'gantt'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            甘特圖
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            列表視圖
          </button>
          <button
            onClick={() => setViewMode('dependency')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'dependency'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            依賴關係圖
          </button>
        </div>
      </div>

      {/* 主要內容區域 */}
      <DataLoader
        loading={isLoading}
        error={error ? new Error(error) : null}
        data={scheduleItems}
      >
        {(data) => (
          <div className="space-y-6">
            {/* 甘特圖視圖 */}
            {viewMode === 'gantt' && (
              <div className="bg-white dark:bg-gray-800 border rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  甘特圖
                </h3>
                <GanttChart
                  scheduleItems={data}
                  dependencies={dependencies}
                  onItemClick={handleItemClick}
                  onItemUpdate={async (itemId, start, end) => {
                    // 這裡可以實作更新時程項目的邏輯
                    console.log('更新時程項目:', itemId, start, end);
                  }}
                  height="600px"
                  showProgress={true}
                  showDependencies={true}
                />
              </div>
            )}

            {/* 列表視圖 */}
            {viewMode === 'list' && (
              <div className="bg-white dark:bg-gray-800 border rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  時程列表
                </h3>
                <ScheduleList
                  scheduleItems={data}
                  onItemClick={handleItemClick}
                  onItemEdit={handleItemEdit}
                  onItemDelete={handleDeleteScheduleItem}
                  onProgressUpdate={updateItemProgress}
                  showFilters={true}
                  showActions={true}
                />
              </div>
            )}

            {/* 依賴關係圖視圖 */}
            {viewMode === 'dependency' && (
              <div className="bg-white dark:bg-gray-800 border rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  任務依賴關係圖
                </h3>
                <TaskDependencyGraph
                  scheduleItems={data}
                  dependencies={dependencies}
                  onNodeClick={handleItemClick}
                  onEdgeClick={(dependency) => {
                    console.log('點擊依賴關係:', dependency);
                  }}
                  height="600px"
                  showLabels={true}
                  showProgress={true}
                />
              </div>
            )}
          </div>
        )}
      </DataLoader>

      {/* 即將到期的項目 */}
      {upcomingDeadlines.length > 0 && (
        <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
            即將到期的項目 ({upcomingDeadlines.length})
          </h4>
          <div className="space-y-2">
            {upcomingDeadlines.slice(0, 3).map(item => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-yellow-700 dark:text-yellow-300">{item.title}</span>
                <span className="text-yellow-600 dark:text-yellow-400">
                  {item.end.toLocaleDateString('zh-TW')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 逾期的項目 */}
      {overdueItems.length > 0 && (
        <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
            逾期的項目 ({overdueItems.length})
          </h4>
          <div className="space-y-2">
            {overdueItems.slice(0, 3).map(item => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-red-700 dark:text-red-300">{item.title}</span>
                <span className="text-red-600 dark:text-red-400">
                  逾期 {Math.abs(Math.ceil((item.end.getTime() - new Date().getTime()) / (1000 * 3600 * 24)))} 天
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 時程表單模態框 */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <ScheduleForm
              scheduleItem={editingItem || undefined}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              isLoading={isLoading}
            />
          </div>
        </div>
      )}

      {/* 選中項目詳情 */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                項目詳情
              </h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">{selectedItem.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">類型: {selectedItem.type}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">開始日期:</span>
                  <span className="ml-2 font-medium">
                    {selectedItem.start.toLocaleDateString('zh-TW')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">結束日期:</span>
                  <span className="ml-2 font-medium">
                    {selectedItem.end.toLocaleDateString('zh-TW')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">進度:</span>
                  <span className="ml-2 font-medium">{selectedItem.progress}%</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">持續時間:</span>
                  <span className="ml-2 font-medium">
                    {Math.ceil((selectedItem.end.getTime() - selectedItem.start.getTime()) / (1000 * 3600 * 24))} 天
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    handleItemEdit(selectedItem);
                    setSelectedItem(null);
                  }}
                  className={projectStyles.button.outline}
                >
                  編輯
                </button>
                <button
                  onClick={() => {
                    handleDeleteScheduleItem(selectedItem.id);
                    setSelectedItem(null);
                  }}
                  className={`${projectStyles.button.outline} text-red-600 hover:text-red-700`}
                >
                  刪除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
