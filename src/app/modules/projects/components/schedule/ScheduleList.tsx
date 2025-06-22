/**
 * 時程列表組件
 * 
 * 顯示時程項目的列表視圖
 */

'use client';

import { useState, useMemo } from 'react';
import { projectStyles } from '@/app/modules/projects/styles';
import type { ScheduleItem } from '../../services/scheduleService';
import { 
  getScheduleItemStatus, 
  getScheduleItemPriority,
  getScheduleItemStatusColor,
  getScheduleItemPriorityColor,
  formatScheduleItemDuration,
  formatScheduleItemRemainingTime,
  getDaysUntilDeadline
} from '../../utils/scheduleUtils';

interface ScheduleListProps {
  scheduleItems: ScheduleItem[];
  onItemClick?: (item: ScheduleItem) => void;
  onItemEdit?: (item: ScheduleItem) => void;
  onItemDelete?: (itemId: string) => void;
  onProgressUpdate?: (itemId: string, progress: number) => void;
  showFilters?: boolean;
  showActions?: boolean;
}

export default function ScheduleList({
  scheduleItems,
  onItemClick,
  onItemEdit,
  onItemDelete,
  onProgressUpdate,
  showFilters = true,
  showActions = true,
}: ScheduleListProps) {
  const [filterType, setFilterType] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'start' | 'end' | 'progress' | 'priority'>('start');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // 篩選和排序後的項目
  const filteredAndSortedItems = useMemo(() => {
    let filtered = scheduleItems;

    // 按類型篩選
    if (filterType.length > 0) {
      filtered = filtered.filter(item => filterType.includes(item.type));
    }

    // 按狀態篩選
    if (filterStatus.length > 0) {
      filtered = filtered.filter(item => {
        const status = getScheduleItemStatus(item);
        return filterStatus.includes(status);
      });
    }

    // 排序
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'start':
          aValue = a.start.getTime();
          bValue = b.start.getTime();
          break;
        case 'end':
          aValue = a.end.getTime();
          bValue = b.end.getTime();
          break;
        case 'progress':
          aValue = a.progress;
          bValue = b.progress;
          break;
        case 'priority':
          aValue = getScheduleItemPriority(a);
          bValue = getScheduleItemPriority(b);
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [scheduleItems, filterType, filterStatus, sortBy, sortOrder]);

  // 取得狀態標籤
  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      'completed': '已完成',
      'in-progress': '進行中',
      'overdue': '逾期',
      'not-started': '未開始',
    };
    return labels[status] || status;
  };

  // 取得類型標籤
  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'milestone': '里程碑',
      'workPackage': '工作包',
      'subWorkPackage': '子工作包',
    };
    return labels[type] || type;
  };

  // 取得優先級標籤
  const getPriorityLabel = (priority: string): string => {
    const labels: Record<string, string> = {
      'critical': '緊急',
      'high': '高',
      'medium': '中',
      'low': '低',
    };
    return labels[priority] || priority;
  };

  return (
    <div className="schedule-list-container">
      {/* 篩選和排序控制 */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 類型篩選 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                類型篩選
              </label>
              <div className="space-y-2">
                {['milestone', 'workPackage', 'subWorkPackage'].map(type => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filterType.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilterType(prev => [...prev, type]);
                        } else {
                          setFilterType(prev => prev.filter(t => t !== type));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">{getTypeLabel(type)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 狀態篩選 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                狀態篩選
              </label>
              <div className="space-y-2">
                {['not-started', 'in-progress', 'completed', 'overdue'].map(status => (
                  <label key={status} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filterStatus.includes(status)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilterStatus(prev => [...prev, status]);
                        } else {
                          setFilterStatus(prev => prev.filter(s => s !== status));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">{getStatusLabel(status)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 排序控制 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                排序
              </label>
              <div className="space-y-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className={projectStyles.form.select}
                >
                  <option value="start">開始日期</option>
                  <option value="end">結束日期</option>
                  <option value="progress">進度</option>
                  <option value="priority">優先級</option>
                </select>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className={projectStyles.form.select}
                >
                  <option value="asc">升序</option>
                  <option value="desc">降序</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 項目列表 */}
      <div className="space-y-3">
        {filteredAndSortedItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            沒有找到符合條件的時程項目
          </div>
        ) : (
          filteredAndSortedItems.map(item => {
            const status = getScheduleItemStatus(item);
            const priority = getScheduleItemPriority(item);
            const statusColor = getScheduleItemStatusColor(status);
            const priorityColor = getScheduleItemPriorityColor(priority);
            const daysUntilDeadline = getDaysUntilDeadline(item);
            const isOverdue = daysUntilDeadline < 0;

            return (
              <div
                key={item.id}
                className={`schedule-item-card p-4 border rounded-lg transition-all hover:shadow-md ${
                  isOverdue ? 'border-red-200 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  {/* 左側：項目資訊 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 
                        className="text-lg font-medium text-gray-900 dark:text-gray-100 truncate cursor-pointer hover:text-blue-600"
                        onClick={() => onItemClick?.(item)}
                      >
                        {item.title}
                      </h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        statusColor === 'green' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : statusColor === 'red'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : statusColor === 'blue'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {getStatusLabel(status)}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        priorityColor === 'red' 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : priorityColor === 'orange'
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                          : priorityColor === 'yellow'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {getPriorityLabel(priority)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div>
                        <span className="font-medium">類型:</span>
                        <span className="ml-2">{getTypeLabel(item.type)}</span>
                      </div>
                      <div>
                        <span className="font-medium">開始:</span>
                        <span className="ml-2">{item.start.toLocaleDateString('zh-TW')}</span>
                      </div>
                      <div>
                        <span className="font-medium">結束:</span>
                        <span className="ml-2">{item.end.toLocaleDateString('zh-TW')}</span>
                      </div>
                      <div>
                        <span className="font-medium">持續時間:</span>
                        <span className="ml-2">{formatScheduleItemDuration(
                          Math.ceil((item.end.getTime() - item.start.getTime()) / (1000 * 3600 * 24))
                        )}</span>
                      </div>
                    </div>

                    {/* 進度條 */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          進度
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {item.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            item.progress >= 100 
                              ? 'bg-green-500' 
                              : item.progress >= 50 
                              ? 'bg-blue-500' 
                              : 'bg-yellow-500'
                          }`}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* 剩餘時間 */}
                    <div className="mt-2">
                      <span className={`text-sm ${
                        isOverdue 
                          ? 'text-red-600 dark:text-red-400 font-medium' 
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {formatScheduleItemRemainingTime(daysUntilDeadline)}
                      </span>
                    </div>
                  </div>

                  {/* 右側：操作按鈕 */}
                  {showActions && (
                    <div className="flex flex-col space-y-2 ml-4">
                      <button
                        onClick={() => onItemClick?.(item)}
                        className={projectStyles.button.small}
                        title="查看詳情"
                      >
                        詳情
                      </button>
                      <button
                        onClick={() => onItemEdit?.(item)}
                        className={projectStyles.button.outline}
                        title="編輯項目"
                      >
                        編輯
                      </button>
                      {onItemDelete && (
                        <button
                          onClick={() => onItemDelete(item.id)}
                          className={`${projectStyles.button.small} text-red-600 hover:text-red-700`}
                          title="刪除項目"
                        >
                          刪除
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 統計資訊 */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {filteredAndSortedItems.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">總項目</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {filteredAndSortedItems.filter(item => getScheduleItemStatus(item) === 'completed').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">已完成</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {filteredAndSortedItems.filter(item => getScheduleItemStatus(item) === 'in-progress').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">進行中</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {filteredAndSortedItems.filter(item => getScheduleItemStatus(item) === 'overdue').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">逾期</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .schedule-list-container {
          width: 100%;
        }
        
        .schedule-item-card {
          transition: all 0.2s ease;
        }
        
        .schedule-item-card:hover {
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}
