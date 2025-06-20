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
import type { Workpackage } from '@/types/project';

interface WorkpackageListProps {
  workpackages: Workpackage[];
  projectId: string;
}

const getWorkpackageProgress = (wp: Workpackage): number => {
  if (!wp.subWorkpackages || wp.subWorkpackages.length === 0) return 0;
  let done = 0;
  let total = 0;
  for (const sw of wp.subWorkpackages) {
    if (typeof sw.estimatedQuantity === 'number' && sw.estimatedQuantity > 0) {
      done += typeof sw.actualQuantity === 'number' ? sw.actualQuantity : 0;
      total += sw.estimatedQuantity;
    }
  }
  if (total === 0) return 0;
  return Math.round((done / total) * 100);
};

const SortableWorkpackage = ({ wp, projectId }: { wp: Workpackage; projectId: string }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: wp.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center hover:shadow-md transition-shadow duration-200'
    >
      <div className='flex-1 cursor-grab' {...attributes} {...listeners}>
        <div className='font-medium text-gray-900 dark:text-gray-100'>{wp.name}</div>
        <div className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
          <span className='inline-flex items-center'>
            <span className='w-2 h-2 rounded-full bg-blue-500 mr-2'></span>
            進度: {getWorkpackageProgress(wp)}%
          </span>
          <span className='mx-2'>•</span>
          <span className='inline-flex items-center'>
            <span className='w-2 h-2 rounded-full bg-green-500 mr-2'></span>
            狀態: {wp.status || ''}
          </span>
        </div>
      </div>
      <a
        href={`/projects/${projectId}/workpackages/${wp.id}`}
        className='ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors duration-200 flex items-center'
      >
        檢視
        <svg className='w-4 h-4 ml-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
        </svg>
      </a>
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

    if (over && active.id !== over.id) {
      const oldIndex = workpackages.findIndex(wp => wp.id === active.id);
      const newIndex = workpackages.findIndex(wp => wp.id === over.id);

      const updatedWorkpackages = arrayMove(workpackages, oldIndex, newIndex);

      try {
        await updateDoc(doc(db, 'projects', projectId), {
          workpackages: updatedWorkpackages,
        });
      } catch (_error) {
        alert('更新順序時出錯，請重試。');
      }
    }
  };

  if (!workpackages || workpackages.length === 0) {
    return <div className='text-center py-8 text-gray-500 dark:text-gray-400'>尚未建立工作包</div>;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={workpackages.map(wp => wp.id)} strategy={verticalListSortingStrategy}>
        <div className='space-y-3'>
          {workpackages.map(wp => (
            <SortableWorkpackage key={wp.id} wp={wp} projectId={projectId} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
