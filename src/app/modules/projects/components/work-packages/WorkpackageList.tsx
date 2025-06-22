/**
 * 工作包列表組件
 *
 * 顯示專案的工作包列表，支援拖曳排序功能
 */

'use client';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { doc, updateDoc, db } from '@/lib/firebase-client';
import type { WorkPackage } from '@/app/modules/projects/types';
import { cn, buttonStyles, cardStyles } from '@/utils/classNameUtils';
import { getErrorMessage, logError, safeAsync, retry } from '@/utils/errorUtils';
import { STATUS_LABELS, STATUS_COLORS } from '@/app/modules/projects/constants/statusConstants';

interface WorkPackageListProps {
  workPackages: WorkPackage[];
  projectId: string;
}

const getWorkPackageProgress = (wp: WorkPackage): number => {
  if (!wp.subPackages || wp.subPackages.length === 0) {
    return wp.progress || 0;
  }

  const totalProgress = wp.subPackages.reduce((sum: number, subWp: any) => {
    return sum + (subWp.progress || 0);
  }, 0);

  return wp.subPackages.length > 0 ? Math.round(totalProgress / wp.subPackages.length) : 0;
};

const getStatusDisplay = (status: string): string => {
  return STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status || '未知';
};

const getStatusColor = (status: string): string => {
  return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800';
};

const SortableWorkPackageItem = ({ 
  workPackage, 
  projectId 
}: { 
  workPackage: WorkPackage; 
  projectId: string; 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: workPackage.id || '' });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const progress = getWorkPackageProgress(workPackage);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-white border border-gray-200 rounded-lg p-4 mb-3 cursor-move',
        isDragging && 'opacity-50 shadow-lg'
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {workPackage.name}
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            {workPackage.description}
          </p>
          
          <div className="flex items-center space-x-4 mb-3">
            <span className={cn(
              'px-2 py-1 text-xs font-medium rounded-full',
              getStatusColor(workPackage.status || '')
            )}>
              {getStatusDisplay(workPackage.status || '')}
            </span>
            <span className="text-sm text-gray-600">
              進度: {progress}%
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            className={cn(buttonStyles.secondary, 'text-sm')}
            onClick={(e) => {
              e.stopPropagation();
              // 處理編輯工作包
            }}
          >
            編輯
          </button>
          <button
            className={cn(buttonStyles.secondary, 'text-sm')}
            onClick={(e) => {
              e.stopPropagation();
              // 處理查看詳情
            }}
          >
            詳情
          </button>
        </div>
      </div>

      {/* 子工作包列表 */}
      {workPackage.subPackages && workPackage.subPackages.length > 0 && (
        <div className="mt-4 pl-4 border-l-2 border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">子工作包</h4>
          <div className="space-y-2">
            {workPackage.subPackages.map((subWp) => (
              <div key={subWp.id} className="bg-gray-50 rounded p-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-900">{subWp.name}</span>
                  <span className="text-xs text-gray-600">
                    {subWp.progress || 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function WorkPackageList({ workPackages, projectId }: WorkPackageListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = workPackages.findIndex(wp => wp.id === active.id);
      const newIndex = workPackages.findIndex(wp => wp.id === over?.id);

      const newWorkPackages = arrayMove(workPackages, oldIndex, newIndex);

      try {
        const projectRef = doc(db, 'projects', projectId);
        await retry(() => updateDoc(projectRef, {
          workPackages: newWorkPackages,
          updatedAt: new Date(),
        }), 3, 1000);
      } catch (error) {
        // 錯誤處理已由上層組件處理
      }
    }
  };

  if (workPackages.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">尚無工作包</p>
        <button className={cn(buttonStyles.primary, 'mt-4')}>
          新增工作包
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          工作包列表 ({workPackages.length})
        </h3>
        <button className={buttonStyles.primary}>
          新增工作包
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={workPackages.map(wp => wp.id)}
          strategy={verticalListSortingStrategy}
        >
          {workPackages.map((workPackage) => (
            <SortableWorkPackageItem
              key={workPackage.id || ''}
              workPackage={workPackage}
              projectId={projectId}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
} 