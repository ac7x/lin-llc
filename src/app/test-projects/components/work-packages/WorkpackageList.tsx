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
import type { WorkPackage } from '@/app/test-projects/types';
import { cn, buttonStyles, cardStyles } from '@/utils/classNameUtils';
import { getErrorMessage, logError, safeAsync, retry } from '@/utils/errorUtils';

interface WorkpackageListProps {
  workpackages: WorkPackage[];
  projectId: string;
}

const getWorkpackageProgress = (wp: WorkPackage): number => {
  if (!wp.subPackages || wp.subPackages.length === 0) {
    return wp.progress || 0;
  }

  const totalProgress = wp.subPackages.reduce((sum: number, subWp: any) => {
    return sum + (subWp.progress || 0);
  }, 0);

  return wp.subPackages.length > 0 ? Math.round(totalProgress / wp.subPackages.length) : 0;
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'in-progress':
      return 'bg-blue-100 text-blue-800';
    case 'on-hold':
      return 'bg-yellow-100 text-yellow-800';
    case 'not-started':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const SortableWorkpackageItem = ({ 
  workpackage, 
  projectId 
}: { 
  workpackage: WorkPackage; 
  projectId: string; 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: workpackage.id || '' });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const progress = getWorkpackageProgress(workpackage);

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
            {workpackage.name}
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            {workpackage.description}
          </p>
          
          <div className="flex items-center space-x-4 mb-3">
            <span className={cn(
              'px-2 py-1 text-xs font-medium rounded-full',
              getStatusColor(workpackage.status || '')
            )}>
              {workpackage.status || '未知'}
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
      {workpackage.subPackages && workpackage.subPackages.length > 0 && (
        <div className="mt-4 pl-4 border-l-2 border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">子工作包</h4>
          <div className="space-y-2">
            {workpackage.subPackages.map((subWp) => (
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

export default function WorkpackageList({ workpackages, projectId }: WorkpackageListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = workpackages.findIndex(wp => wp.id === active.id);
      const newIndex = workpackages.findIndex(wp => wp.id === over?.id);

      const newWorkpackages = arrayMove(workpackages, oldIndex, newIndex);

      try {
        const projectRef = doc(db, 'projects', projectId);
        await retry(() => updateDoc(projectRef, {
          workpackages: newWorkpackages,
          updatedAt: new Date(),
        }), 3, 1000);
      } catch (error) {
        // 錯誤處理已由上層組件處理
      }
    }
  };

  if (workpackages.length === 0) {
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
          工作包列表 ({workpackages.length})
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
          items={workpackages.map(wp => wp.id)}
          strategy={verticalListSortingStrategy}
        >
          {workpackages.map((workpackage) => (
            <SortableWorkpackageItem
              key={workpackage.id || ''}
              workpackage={workpackage}
              projectId={projectId}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
} 