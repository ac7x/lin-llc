/**
 * 子工作包卡片組件
 * 
 * 顯示子工作包的基本資訊，包括：
 * - 子工作包名稱和描述
 * - 進度條和百分比
 * - 狀態標籤
 * - 數量資訊
 * - 操作按鈕
 */

'use client';

import { useState } from 'react';

import { projectStyles } from '@/app/modules/projects/styles';
import type { SubWorkPackage, PriorityLevel } from '@/app/modules/projects/types';

interface SubWorkpackageCardProps {
  subWorkpackage: SubWorkPackage;
  workpackageId: string;
  onEdit?: (subWorkpackage: SubWorkPackage) => void;
  onDelete?: (subWorkpackageId: string) => void;
  onViewDetails?: (subWorkpackageId: string) => void;
}

export default function SubWorkpackageCard({
  subWorkpackage,
  onEdit,
  onDelete,
  workpackageId: _workpackageId,
}: SubWorkpackageCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 計算子工作包進度
  const calculateSubWorkpackageProgress = (sub: SubWorkPackage): number => {
    const estimated = typeof sub.estimatedQuantity === 'number' ? sub.estimatedQuantity : 0;
    if (estimated === 0) return 0;
    
    const actual = typeof sub.actualQuantity === 'number' ? sub.actualQuantity : 0;
    return Math.round((actual / estimated) * 100);
  };
  
  const progress = calculateSubWorkpackageProgress(subWorkpackage);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'on-hold':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'assigned':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'review':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'in-progress':
        return '執行中';
      case 'on-hold':
        return '暫停中';
      case 'cancelled':
        return '已取消';
      case 'assigned':
        return '已分配';
      case 'review':
        return '審查中';
      default:
        return '草稿';
    }
  };

  const getPriorityColor = (priority?: PriorityLevel) => {
    if (!priority) return 'text-gray-400';
    switch (priority) {
      case 'critical':
        return 'text-red-600 dark:text-red-400';
      case 'high':
        return 'text-orange-600 dark:text-orange-400';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'low':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className={`${projectStyles.card.base} hover:shadow-md transition-shadow duration-200`}>
      <div className='flex justify-between items-start mb-4'>
        <div className='flex-1'>
          <div className='flex items-center gap-2 mb-1'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
              {subWorkpackage.name}
            </h3>
            {subWorkpackage.priority && (
              <span className={`text-xs font-medium ${getPriorityColor(subWorkpackage.priority)}`}>
                {subWorkpackage.priority === 'critical' && '緊急'}
                {subWorkpackage.priority === 'high' && '高'}
                {subWorkpackage.priority === 'medium' && '中'}
                {subWorkpackage.priority === 'low' && '低'}
              </span>
            )}
          </div>
          {subWorkpackage.description && (
            <p className='text-sm text-gray-600 dark:text-gray-400 mb-2'>
              {subWorkpackage.description}
            </p>
          )}
          <div className='flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400'>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(subWorkpackage.status)}`}>
              {getStatusText(subWorkpackage.status)}
            </span>
            {subWorkpackage.estimatedQuantity && (
              <span>
                數量: {subWorkpackage.actualQuantity || 0}/{subWorkpackage.estimatedQuantity}
                {subWorkpackage.unit && ` ${subWorkpackage.unit}`}
              </span>
            )}
            {subWorkpackage.assignedTo && (
              <span>負責人: {subWorkpackage.assignedTo}</span>
            )}
          </div>
        </div>
        
        <div className='flex items-center space-x-2'>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`${projectStyles.button.small} text-gray-500 hover:text-gray-700`}
            title={isExpanded ? '收起' : '展開'}
          >
            <svg
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
            </svg>
          </button>
        </div>
      </div>

      {/* 進度條 */}
      <div className='mb-4'>
        <div className='flex justify-between items-center mb-2'>
          <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>進度</span>
          <span className='text-sm text-gray-600 dark:text-gray-400'>{progress}%</span>
        </div>
        <div className={projectStyles.progress.container}>
          <div
            className={`${projectStyles.progress.bar} bg-blue-500`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 展開內容 */}
      {isExpanded && (
        <div className='border-t border-gray-200 dark:border-gray-700 pt-4 mt-4'>
          <div className='grid grid-cols-2 gap-4 text-sm'>
            <div>
              <span className='text-gray-500 dark:text-gray-400'>預估工時:</span>
              <span className='ml-2 text-gray-900 dark:text-gray-100'>
                {subWorkpackage.estimatedHours || 0} 小時
              </span>
            </div>
            <div>
              <span className='text-gray-500 dark:text-gray-400'>實際工時:</span>
              <span className='ml-2 text-gray-900 dark:text-gray-100'>
                {subWorkpackage.actualHours || 0} 小時
              </span>
            </div>
            <div>
              <span className='text-gray-500 dark:text-gray-400'>預算:</span>
              <span className='ml-2 text-gray-900 dark:text-gray-100'>
                ${subWorkpackage.budget?.toLocaleString() || 0}
              </span>
            </div>
            <div>
              <span className='text-gray-500 dark:text-gray-400'>風險等級:</span>
              <span className='ml-2 text-gray-900 dark:text-gray-100'>
                {subWorkpackage.riskLevel || '低'}
              </span>
            </div>
            {subWorkpackage.plannedStartDate && (
              <div>
                <span className='text-gray-500 dark:text-gray-400'>計劃開始:</span>
                <span className='ml-2 text-gray-900 dark:text-gray-100'>
                  {subWorkpackage.plannedStartDate.toString()}
                </span>
              </div>
            )}
            {subWorkpackage.plannedEndDate && (
              <div>
                <span className='text-gray-500 dark:text-gray-400'>計劃結束:</span>
                <span className='ml-2 text-gray-900 dark:text-gray-100'>
                  {subWorkpackage.plannedEndDate.toString()}
                </span>
              </div>
            )}
          </div>

          {/* 任務預覽 */}
          {subWorkpackage.tasks && subWorkpackage.tasks.length > 0 && (
            <div className='mt-4'>
              <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                任務 ({subWorkpackage.tasks.length})
              </h4>
              <div className='space-y-2 max-h-32 overflow-y-auto'>
                {subWorkpackage.tasks.slice(0, 3).map((task) => (
                  <div key={task.id} className='flex justify-between items-center text-xs'>
                    <span className='text-gray-600 dark:text-gray-400 truncate'>{task.name}</span>
                    <span className={`px-1 py-0.5 rounded text-xs ${
                      task.completed 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                    }`}>
                      {task.completed ? '已完成' : '進行中'}
                    </span>
                  </div>
                ))}
                {subWorkpackage.tasks.length > 3 && (
                  <div className='text-xs text-gray-500 dark:text-gray-400 text-center'>
                    還有 {subWorkpackage.tasks.length - 3} 個任務
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 完工備註 */}
          {subWorkpackage.completionNotes && (
            <div className='mt-4'>
              <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                完工備註
              </h4>
              <p className='text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded'>
                {subWorkpackage.completionNotes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 操作按鈕 */}
      <div className='flex justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700'>
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(subWorkpackage);
            }}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            編輯
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(subWorkpackage.id);
            }}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            刪除
          </button>
        </div>
      </div>
    </div>
  );
}
