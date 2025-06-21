/**
 * 工作包卡片組件
 * 
 * 顯示工作包的基本資訊，包括：
 * - 工作包名稱和描述
 * - 進度條和百分比
 * - 狀態標籤
 * - 子工作包數量
 * - 操作按鈕
 */

'use client';

import { useState } from 'react';

import { projectStyles } from '@/modules/projects/styles';
import type { Workpackage } from '@/modules/projects/types/project';

interface WorkpackageCardProps {
  workpackage: Workpackage;
  projectId: string;
  onEdit?: (workpackage: Workpackage) => void;
  onDelete?: (workpackageId: string) => void;
  onViewDetails?: (workpackageId: string) => void;
}

export default function WorkpackageCard({
  workpackage,
  onEdit,
  onDelete,
  projectId: _projectId,
}: WorkpackageCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 計算工作包進度
  const calculateWorkpackageProgress = (wp: Workpackage): number => {
    if (!wp.subWorkpackages || wp.subWorkpackages.length === 0) return 0;
    
    let totalEstimated = 0;
    let totalActual = 0;

    for (const sub of wp.subWorkpackages) {
      const estimated = typeof sub.estimatedQuantity === 'number' ? sub.estimatedQuantity : 0;
      if (estimated > 0) {
        const actual = typeof sub.actualQuantity === 'number' ? sub.actualQuantity : 0;
        totalEstimated += estimated;
        totalActual += actual;
      }
    }

    if (totalEstimated === 0) return 0;
    return Math.round((totalActual / totalEstimated) * 100);
  };
  
  const progress = calculateWorkpackageProgress(workpackage);
  const subWorkpackageCount = workpackage.subWorkpackages?.length || 0;
  const completedSubWorkpackages = workpackage.subWorkpackages?.filter(
    sub => sub.status === 'completed'
  ).length || 0;

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
      case 'ready':
        return '準備就緒';
      case 'review':
        return '審查中';
      default:
        return '草稿';
    }
  };

  return (
    <div className={`${projectStyles.card.base} hover:shadow-md transition-shadow duration-200`}>
      <div className='flex justify-between items-start mb-4'>
        <div className='flex-1'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1'>
            {workpackage.name}
          </h3>
          {workpackage.description && (
            <p className='text-sm text-gray-600 dark:text-gray-400 mb-2'>
              {workpackage.description}
            </p>
          )}
          <div className='flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400'>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(workpackage.status)}`}>
              {getStatusText(workpackage.status)}
            </span>
            <span>子工作包: {completedSubWorkpackages}/{subWorkpackageCount}</span>
            {workpackage.assignedTo && (
              <span>負責人: {workpackage.assignedTo}</span>
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
                {workpackage.estimatedHours || 0} 小時
              </span>
            </div>
            <div>
              <span className='text-gray-500 dark:text-gray-400'>實際工時:</span>
              <span className='ml-2 text-gray-900 dark:text-gray-100'>
                {workpackage.actualHours || 0} 小時
              </span>
            </div>
            <div>
              <span className='text-gray-500 dark:text-gray-400'>預算:</span>
              <span className='ml-2 text-gray-900 dark:text-gray-100'>
                ${workpackage.budget?.toLocaleString() || 0}
              </span>
            </div>
            <div>
              <span className='text-gray-500 dark:text-gray-400'>風險等級:</span>
              <span className='ml-2 text-gray-900 dark:text-gray-100'>
                {workpackage.riskLevel || '低'}
              </span>
            </div>
          </div>

          {/* 子工作包預覽 */}
          {subWorkpackageCount > 0 && (
            <div className='mt-4'>
              <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                子工作包 ({subWorkpackageCount})
              </h4>
              <div className='space-y-2 max-h-32 overflow-y-auto'>
                {workpackage.subWorkpackages?.slice(0, 3).map((sub) => (
                  <div key={sub.id} className='flex justify-between items-center text-xs'>
                    <span className='text-gray-600 dark:text-gray-400 truncate'>{sub.name}</span>
                    <span className={`px-1 py-0.5 rounded text-xs ${getStatusColor(sub.status)}`}>
                      {getStatusText(sub.status)}
                    </span>
                  </div>
                ))}
                {subWorkpackageCount > 3 && (
                  <div className='text-xs text-gray-500 dark:text-gray-400 text-center'>
                    還有 {subWorkpackageCount - 3} 個子工作包
                  </div>
                )}
              </div>
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
              onEdit?.(workpackage);
            }}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            編輯
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(workpackage.id);
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
