/**
 * 甘特圖組件
 * 
 * 使用 vis-timeline 顯示專案時程的甘特圖
 */

'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { Timeline, DataSet } from 'vis-timeline/standalone';
import 'vis-timeline/dist/vis-timeline-graph2d.css';

import { projectStyles } from '@/app/modules/projects/styles';
import type { ScheduleItem, ScheduleDependency } from '../../services/scheduleService';
import { 
  getScheduleItemStatus, 
  getScheduleItemPriority,
  getScheduleItemStatusColor,
  getScheduleItemPriorityColor,
  formatScheduleItemDuration,
  formatScheduleItemRemainingTime
} from '../../utils/scheduleUtils';

interface GanttChartProps {
  scheduleItems: ScheduleItem[];
  dependencies: ScheduleDependency[];
  onItemClick?: (item: ScheduleItem) => void;
  onItemUpdate?: (itemId: string, start: Date, end: Date) => void;
  height?: string;
  showProgress?: boolean;
  showDependencies?: boolean;
}

interface TimelineItem {
  id: string;
  content: string;
  start: Date;
  end: Date;
  group?: string;
  className?: string;
  title?: string;
  progress?: number;
  type?: string;
  priority?: string;
  status?: string;
}

interface TimelineGroup {
  id: string;
  content: string;
  className?: string;
}

export default function GanttChart({
  scheduleItems,
  dependencies,
  onItemClick,
  onItemUpdate,
  height = '600px',
  showProgress = true,
  showDependencies = true,
}: GanttChartProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineInstanceRef = useRef<Timeline | null>(null);
  const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null);

  // 準備時間軸數據
  const timelineData = useMemo(() => {
    const items: TimelineItem[] = scheduleItems.map(item => {
      const status = getScheduleItemStatus(item);
      const priority = getScheduleItemPriority(item);
      const statusColor = getScheduleItemStatusColor(status);
      const priorityColor = getScheduleItemPriorityColor(priority);
      
      return {
        id: item.id,
        content: `
          <div class="timeline-item-content">
            <div class="timeline-item-title">${item.title}</div>
            ${showProgress ? `<div class="timeline-item-progress">進度: ${item.progress}%</div>` : ''}
            <div class="timeline-item-duration">${formatScheduleItemDuration(
              Math.ceil((item.end.getTime() - item.start.getTime()) / (1000 * 3600 * 24))
            )}</div>
          </div>
        `,
        start: item.start,
        end: item.end,
        group: item.type,
        className: `timeline-item timeline-item-${statusColor} timeline-item-${priorityColor}`,
        title: `${item.title}\n狀態: ${status}\n優先級: ${priority}\n${formatScheduleItemRemainingTime(
          Math.ceil((item.end.getTime() - new Date().getTime()) / (1000 * 3600 * 24))
        )}`,
        progress: item.progress,
        type: item.type,
        priority,
        status,
      };
    });

    return new DataSet(items);
  }, [scheduleItems, showProgress]);

  // 準備分組數據
  const timelineGroups = useMemo(() => {
    const groups: TimelineGroup[] = [
      { id: 'milestone', content: '里程碑', className: 'timeline-group-milestone' },
      { id: 'workPackage', content: '工作包', className: 'timeline-group-workpackage' },
      { id: 'subWorkPackage', content: '子工作包', className: 'timeline-group-subworkpackage' },
    ];

    return new DataSet(groups);
  }, []);

  // 準備依賴關係數據
  const timelineEdges = useMemo(() => {
    if (!showDependencies) return new DataSet([]);

    const edges = dependencies.map(dep => ({
      id: dep.id,
      from: dep.from,
      to: dep.to,
      arrows: 'to',
      color: { color: '#666', opacity: 0.6 },
      width: 2,
      title: `依賴類型: ${dep.type}`,
    }));

    return new DataSet(edges);
  }, [dependencies, showDependencies]);

  // 初始化時間軸
  useEffect(() => {
    if (!timelineRef.current) return;

    const options = {
      stack: false,
      verticalScroll: true,
      horizontalScroll: true,
      zoomKey: 'ctrlKey' as const,
      orientation: 'top',
      height,
      showMajorLabels: true,
      showMinorLabels: true,
      showCurrentTime: true,
      showWeekScale: true,
      showDayScale: true,
      showMonthScale: true,
      showYearScale: true,
      locale: 'zh',
      template: (item: TimelineItem) => {
        return `
          <div class="timeline-item-custom">
            <div class="timeline-item-header">
              <span class="timeline-item-type">${getTypeLabel(item.type || '')}</span>
              <span class="timeline-item-priority priority-${item.priority}">${getPriorityLabel(item.priority || '')}</span>
            </div>
            <div class="timeline-item-body">
              <div class="timeline-item-title">${item.content}</div>
              ${showProgress && item.progress !== undefined ? `
                <div class="timeline-item-progress-bar">
                  <div class="timeline-item-progress-fill" style="width: ${item.progress}%"></div>
                </div>
              ` : ''}
            </div>
          </div>
        `;
      },
      onMove: (item: any, callback: any) => {
        if (onItemUpdate) {
          onItemUpdate(item.id, item.start, item.end);
        }
        callback(item);
      },
      onSelect: (properties: any) => {
        if (properties.items.length > 0) {
          const itemId = properties.items[0];
          const item = scheduleItems.find(i => i.id === itemId);
          if (item) {
            setSelectedItem(item);
            onItemClick?.(item);
          }
        } else {
          setSelectedItem(null);
        }
      },
    };

    // 創建時間軸實例
    const timeline = new Timeline(
      timelineRef.current,
      timelineData,
      timelineGroups,
      options
    );

    timelineInstanceRef.current = timeline;

    // 添加依賴關係
    if (showDependencies && timelineEdges.length > 0) {
      timeline.setItems(timelineData);
      timeline.setGroups(timelineGroups);
    }

    return () => {
      if (timelineInstanceRef.current) {
        timelineInstanceRef.current.destroy();
        timelineInstanceRef.current = null;
      }
    };
  }, [timelineData, timelineGroups, timelineEdges, height, showProgress, showDependencies, onItemClick, onItemUpdate]);

  // 更新時間軸數據
  useEffect(() => {
    if (timelineInstanceRef.current) {
      timelineInstanceRef.current.setItems(timelineData);
    }
  }, [timelineData]);

  // 更新分組數據
  useEffect(() => {
    if (timelineInstanceRef.current) {
      timelineInstanceRef.current.setGroups(timelineGroups);
    }
  }, [timelineGroups]);

  // 更新依賴關係
  useEffect(() => {
    if (timelineInstanceRef.current && showDependencies) {
      // 注意：vis-timeline 的 Network 組件需要單獨處理依賴關係
      // 這裡只是更新項目數據
      timelineInstanceRef.current.setItems(timelineData);
    }
  }, [timelineEdges, showDependencies, timelineData]);

  // 時間軸控制方法
  const zoomIn = () => {
    if (timelineInstanceRef.current) {
      timelineInstanceRef.current.zoomIn(0.5);
    }
  };

  const zoomOut = () => {
    if (timelineInstanceRef.current) {
      timelineInstanceRef.current.zoomOut(0.5);
    }
  };

  const moveToToday = () => {
    if (timelineInstanceRef.current) {
      timelineInstanceRef.current.moveTo(new Date());
    }
  };

  const fitAllItems = () => {
    if (timelineInstanceRef.current) {
      timelineInstanceRef.current.fit();
    }
  };

  return (
    <div className="gantt-chart-container">
      {/* 控制列 */}
      <div className="gantt-chart-controls mb-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={zoomIn}
            className={projectStyles.button.small}
            title="放大"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </button>
          <button
            onClick={zoomOut}
            className={projectStyles.button.small}
            title="縮小"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </button>
          <button
            onClick={moveToToday}
            className={projectStyles.button.outline}
          >
            今天
          </button>
          <button
            onClick={fitAllItems}
            className={projectStyles.button.outline}
          >
            適應所有項目
          </button>
        </div>
      </div>

      {/* 時間軸容器 */}
      <div 
        ref={timelineRef} 
        className="gantt-chart-timeline"
        style={{ height }}
      />

      {/* 選中項目詳情 */}
      {selectedItem && (
        <div className="gantt-chart-details mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
            項目詳情
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">名稱:</span>
              <span className="ml-2 font-medium">{selectedItem.title}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">類型:</span>
              <span className="ml-2 font-medium">{getTypeLabel(selectedItem.type)}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">進度:</span>
              <span className="ml-2 font-medium">{selectedItem.progress}%</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">狀態:</span>
              <span className="ml-2 font-medium">{getStatusLabel(getScheduleItemStatus(selectedItem))}</span>
            </div>
          </div>
        </div>
      )}

      {/* 自定義樣式 */}
      <style jsx>{`
        .gantt-chart-container {
          width: 100%;
        }
        
        .gantt-chart-timeline {
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          overflow: hidden;
        }
        
        .timeline-item-custom {
          padding: 4px 8px;
          border-radius: 4px;
          background: white;
          border: 1px solid #d1d5db;
          font-size: 12px;
          line-height: 1.2;
        }
        
        .timeline-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2px;
        }
        
        .timeline-item-type {
          font-size: 10px;
          color: #6b7280;
          text-transform: uppercase;
        }
        
        .timeline-item-priority {
          font-size: 10px;
          padding: 1px 4px;
          border-radius: 2px;
          color: white;
        }
        
        .priority-critical { background-color: #ef4444; }
        .priority-high { background-color: #f97316; }
        .priority-medium { background-color: #eab308; }
        .priority-low { background-color: #22c55e; }
        
        .timeline-item-body {
          margin-top: 2px;
        }
        
        .timeline-item-title {
          font-weight: 500;
          margin-bottom: 2px;
        }
        
        .timeline-item-progress-bar {
          width: 100%;
          height: 4px;
          background-color: #e5e7eb;
          border-radius: 2px;
          overflow: hidden;
        }
        
        .timeline-item-progress-fill {
          height: 100%;
          background-color: #3b82f6;
          transition: width 0.3s ease;
        }
        
        .timeline-group-milestone {
          background-color: #fef3c7;
          border-color: #f59e0b;
        }
        
        .timeline-group-workpackage {
          background-color: #dbeafe;
          border-color: #3b82f6;
        }
        
        .timeline-group-subworkpackage {
          background-color: #f3e8ff;
          border-color: #8b5cf6;
        }
      `}</style>
    </div>
  );
}

/**
 * 取得類型標籤
 */
function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'milestone': '里程碑',
    'workPackage': '工作包',
    'subWorkPackage': '子工作包',
  };
  
  return labels[type] || type;
}

/**
 * 取得優先級標籤
 */
function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    'critical': '緊急',
    'high': '高',
    'medium': '中',
    'low': '低',
  };
  
  return labels[priority] || priority;
}

/**
 * 取得狀態標籤
 */
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'completed': '已完成',
    'in-progress': '進行中',
    'overdue': '逾期',
    'not-started': '未開始',
  };
  
  return labels[status] || status;
}
