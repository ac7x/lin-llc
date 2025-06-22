/**
 * 里程碑標記組件
 * 
 * 用於在甘特圖中標記重要的里程碑
 */

'use client';

import { useMemo } from 'react';
import { projectStyles } from '@/app/modules/projects/styles';
import type { ScheduleItem } from '../../services/scheduleService';
import { getScheduleItemStatus, getScheduleItemStatusColor } from '../../utils/scheduleUtils';

interface MilestoneMarkerProps {
  milestone: ScheduleItem;
  onMilestoneClick?: (milestone: ScheduleItem) => void;
  showDetails?: boolean;
}

export default function MilestoneMarker({
  milestone,
  onMilestoneClick,
  showDetails = true,
}: MilestoneMarkerProps) {
  const status = getScheduleItemStatus(milestone);
  const statusColor = getScheduleItemStatusColor(status);
  const isCompleted = status === 'completed';
  const isOverdue = status === 'overdue';

  const markerStyle = useMemo(() => {
    const baseStyle = {
      width: '16px',
      height: '16px',
      borderRadius: '50%',
      border: '2px solid',
      cursor: 'pointer',
      position: 'relative' as const,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    };

    if (isCompleted) {
      return {
        ...baseStyle,
        backgroundColor: '#22c55e',
        borderColor: '#16a34a',
        color: 'white',
      };
    }

    if (isOverdue) {
      return {
        ...baseStyle,
        backgroundColor: '#ef4444',
        borderColor: '#dc2626',
        color: 'white',
      };
    }

    return {
      ...baseStyle,
      backgroundColor: '#f59e0b',
      borderColor: '#d97706',
      color: 'white',
    };
  }, [isCompleted, isOverdue]);

  const handleClick = () => {
    onMilestoneClick?.(milestone);
  };

  return (
    <div className="milestone-marker-container">
      <div
        className="milestone-marker"
        style={markerStyle}
        onClick={handleClick}
        title={`里程碑: ${milestone.title}\n狀態: ${status}\n日期: ${milestone.start.toLocaleDateString('zh-TW')}`}
      >
        {isCompleted && (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
        {!isCompleted && (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        )}
      </div>

      {showDetails && (
        <div className="milestone-details mt-2 p-3 bg-white dark:bg-gray-800 border rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
              {milestone.title}
            </h4>
            <span className={`px-2 py-1 text-xs rounded-full ${
              isCompleted 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : isOverdue
                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            }`}>
              {isCompleted ? '已完成' : isOverdue ? '逾期' : '進行中'}
            </span>
          </div>
          
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <div>
              <span>目標日期:</span>
              <span className="ml-2 font-medium">
                {milestone.start.toLocaleDateString('zh-TW')}
              </span>
            </div>
            <div>
              <span>類型:</span>
              <span className="ml-2 font-medium">里程碑</span>
            </div>
            {milestone.data && 'description' in milestone.data && (
              <div>
                <span>描述:</span>
                <span className="ml-2 font-medium">
                  {(milestone.data as any).description || '無描述'}
                </span>
              </div>
            )}
          </div>

          <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleClick}
              className={projectStyles.button.small}
            >
              查看詳情
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .milestone-marker-container {
          display: inline-block;
        }
        
        .milestone-marker {
          transition: all 0.2s ease;
        }
        
        .milestone-marker:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .milestone-details {
          min-width: 200px;
          max-width: 300px;
        }
      `}</style>
    </div>
  );
}
