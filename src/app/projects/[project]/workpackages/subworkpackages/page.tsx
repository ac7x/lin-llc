/**
 * 子工作包排序頁面
 *
 * 提供子工作包的管理和排序功能，包含：
 * - 子工作包拖曳排序
 * - 子工作包編輯
 * - 進度追蹤
 * - 數量管理
 * - 即時更新
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
import { useParams } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { useDocument } from 'react-firebase-hooks/firestore';

import { Workpackage, SubWorkpackage } from '@/app/projects/types/project';
import { db, doc, updateDoc, Timestamp } from '@/lib/firebase-client';
import { formatLocalDate, formatDateForInput } from '@/utils/dateUtils';
import { logError, safeAsync, retry } from '@/utils/errorUtils';

interface EnhancedSubWorkpackage extends SubWorkpackage {
  workpackageId: string;
  workpackageName: string;
  estimatedQuantity?: number;
  actualQuantity?: number;
}

function SortableSubWorkpackage({
  subWp,
  index,
  onEdit,
}: {
  subWp: EnhancedSubWorkpackage;
  index: number;
  onEdit: (subWp: EnhancedSubWorkpackage) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: subWp.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className='bg-white dark:bg-gray-700 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200'
    >
      <div className='flex items-start gap-3'>
        {/* 拖曳區域 */}
        <div
          {...attributes}
          {...listeners}
          className='cursor-grab p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200'
          title='拖曳排序'
        >
          <svg
            className='w-5 h-5 text-gray-400'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M4 8h16M4 16h16'
            />
          </svg>
        </div>

        {/* 內容區域 */}
        <div className='flex-1'>
          <div className='flex justify-between items-start'>
            <div>
              <div className='font-medium text-gray-900 dark:text-gray-100'>{subWp.name}</div>
              {subWp.description && (
                <div className='text-sm text-gray-600 dark:text-gray-300 mt-1'>
                  {subWp.description}
                </div>
              )}
            </div>
          </div>
          <div className='mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
            <div>
              <span className='text-gray-500 dark:text-gray-400'>優先級：</span>
              <span className='text-gray-900 dark:text-gray-100'>{index + 1}</span>
            </div>
            <div>
              <span className='text-gray-500 dark:text-gray-400'>所屬：</span>
              <span className='text-gray-900 dark:text-gray-100'>{subWp.workpackageName}</span>
            </div>
            <div>
              <span className='text-gray-500 dark:text-gray-400'>進度：</span>
              <span className='text-gray-900 dark:text-gray-100'>{subWp.progress ?? 0}%</span>
            </div>
            <div>
              <span className='text-gray-500 dark:text-gray-400'>預估數量：</span>
              <span className='text-gray-900 dark:text-gray-100'>
                {subWp.estimatedQuantity ?? '-'}
              </span>
            </div>
            <div>
              <span className='text-gray-500 dark:text-gray-400'>實際完成：</span>
              <span className='text-gray-900 dark:text-gray-100'>
                {subWp.actualQuantity ?? '-'}
              </span>
            </div>
            {/* 可點擊的日期區域 */}
            <div
              className='cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 p-1 rounded transition-colors duration-200'
              onClick={() => onEdit(subWp)}
              title='點擊編輯日期'
            >
              <span className='text-gray-500 dark:text-gray-400'>開始日期：</span>
              <span className='text-gray-900 dark:text-gray-100'>
                {formatLocalDate(subWp.plannedStartDate) || '-'}
              </span>
            </div>
            <div
              className='cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 p-1 rounded transition-colors duration-200'
              onClick={() => onEdit(subWp)}
              title='點擊編輯日期'
            >
              <span className='text-gray-500 dark:text-gray-400'>完成日期：</span>
              <span className='text-gray-900 dark:text-gray-100'>
                {formatLocalDate(subWp.plannedEndDate) || '-'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SubWorkpackageSortingPage() {
  const params = useParams();
  const projectId = params?.project as string;
  const [projectDoc, loading] = useDocument(doc(db, 'projects', projectId));
  const [saving, setSaving] = useState(false);
  const [workpackages, setWorkpackages] = useState<Workpackage[]>([]);
  const [allSubWorkpackages, setAllSubWorkpackages] = useState<EnhancedSubWorkpackage[]>([]);
  const [editingSubWp, setEditingSubWp] = useState<EnhancedSubWorkpackage | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<{
    plannedStartDate: string;
    plannedEndDate: string;
  }>({
    plannedStartDate: '',
    plannedEndDate: '',
  });

  const project = useMemo(() => {
    if (!projectDoc?.exists()) return null;
    return projectDoc.data();
  }, [projectDoc]);

  useEffect(() => {
    if (project?.workpackages) {
      setWorkpackages(project.workpackages);
      const allSubs: EnhancedSubWorkpackage[] = [];
      project.workpackages.forEach((wp: Workpackage) => {
        if (wp.subWorkpackages && wp.subWorkpackages.length > 0) {
          wp.subWorkpackages.forEach((sub: SubWorkpackage) => {
            allSubs.push({
              ...sub,
              workpackageId: wp.id,
              workpackageName: wp.name,
            });
          });
        }
      });
      setAllSubWorkpackages(allSubs);
    }
  }, [project]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = allSubWorkpackages.findIndex(item => item.id === active.id);
      const newIndex = allSubWorkpackages.findIndex(item => item.id === over.id);
      const newAllSubWorkpackages = arrayMove(allSubWorkpackages, oldIndex, newIndex);
      setAllSubWorkpackages(newAllSubWorkpackages);
      const updatedWorkpackages = [...workpackages];
      const subWpByWorkpackageId: Record<string, SubWorkpackage[]> = {};
      newAllSubWorkpackages.forEach((subWp, globalIndex) => {
        if (!subWpByWorkpackageId[subWp.workpackageId]) {
          subWpByWorkpackageId[subWp.workpackageId] = [];
        }
        const { workpackageId, ...originalSubWp } = subWp;
        subWpByWorkpackageId[workpackageId].push({
          ...originalSubWp,
          priority: globalIndex,
        });
      });
      updatedWorkpackages.forEach(wp => {
        if (subWpByWorkpackageId[wp.id]) {
          wp.subWorkpackages = subWpByWorkpackageId[wp.id];
        }
      });
      setWorkpackages(updatedWorkpackages);
      saveToFirestore(updatedWorkpackages);
    }
  };

  const saveToFirestore = async (updatedWorkpackages: Workpackage[]) => {
    setSaving(true);
    await safeAsync(async () => {
      await retry(() => updateDoc(doc(db, 'projects', projectId), {
        workpackages: updatedWorkpackages,
      }), 3, 1000);
    }, (error) => {
      alert('更新排序時出錯，請重試。');
      logError(error, { operation: 'update_sorting', projectId });
    });
    setSaving(false);
  };

  const startEditSubWorkpackage = (subWp: EnhancedSubWorkpackage) => {
    setEditingSubWp(subWp);
    setFormData({
      plannedStartDate: formatDateForInput(subWp.plannedStartDate),
      plannedEndDate: formatDateForInput(subWp.plannedEndDate),
    });
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setEditingSubWp(null);
    setIsEditing(false);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubWp) return;
    // 只組裝有值的日期欄位
    const updateFields: Partial<SubWorkpackage> = {};
    if (formData.plannedStartDate && formData.plannedStartDate.trim()) {
      updateFields.plannedStartDate = Timestamp.fromDate(new Date(formData.plannedStartDate));
    }
    if (formData.plannedEndDate && formData.plannedEndDate.trim()) {
      updateFields.plannedEndDate = Timestamp.fromDate(new Date(formData.plannedEndDate));
    }
    const workpackageId = editingSubWp.workpackageId;
    setSaving(true);
    await safeAsync(async () => {
      const newWorkpackages = workpackages.map(wp => {
        if (wp.id === workpackageId) {
          return {
            ...wp,
            subWorkpackages: wp.subWorkpackages.map(sub =>
              sub.id === editingSubWp.id
                ? {
                    ...sub,
                    ...updateFields,
                  }
                : sub
            ),
          };
        }
        return wp;
      });
      setWorkpackages(newWorkpackages);
      const newAllSubWorkpackages = allSubWorkpackages.map(subWp =>
        subWp.id === editingSubWp.id
          ? {
              ...subWp,
              ...updateFields,
            }
          : subWp
      );
      setAllSubWorkpackages(newAllSubWorkpackages);
      await retry(() => updateDoc(doc(db, 'projects', projectId), {
        workpackages: newWorkpackages,
      }), 3, 1000);
      setIsEditing(false);
      setEditingSubWp(null);
    }, (error) => {
      alert('更新子工作包時出錯，請重試。');
      logError(error, { operation: 'update_sub_workpackage', subWpId: editingSubWp.id, workpackageId, projectId });
    });
    setSaving(false);
  };

  if (loading) return <div className='p-4'>載入中...</div>;
  if (!project) return <div className='p-4'>找不到專案</div>;

  return (
    <main className='max-w-4xl mx-auto'>
      <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
        <div className='flex justify-between items-center mb-6'>
          <div>
            <h1 className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent'>
              子工作包排序
            </h1>
            <p className='text-gray-600 dark:text-gray-400 mt-2'>
              拖曳子工作包來調整全域優先級。位置越靠上，優先級越高。
            </p>
          </div>
        </div>

        {allSubWorkpackages.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={allSubWorkpackages.map(subWp => subWp.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className='space-y-4'>
                {allSubWorkpackages.map((subWp, index) => (
                  <SortableSubWorkpackage
                    key={subWp.id}
                    subWp={subWp}
                    index={index}
                    onEdit={startEditSubWorkpackage}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className='text-center py-12 bg-gray-50 dark:bg-gray-700 rounded-lg'>
            <svg
              className='w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
              />
            </svg>
            <p className='text-gray-500 dark:text-gray-400'>目前沒有子工作包</p>
          </div>
        )}

        {saving && (
          <div className='fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center'>
            <svg
              className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
              fill='none'
              viewBox='0 0 24 24'
            >
              <circle
                className='opacity-25'
                cx='12'
                cy='12'
                r='10'
                stroke='currentColor'
                strokeWidth='4'
              ></circle>
              <path
                className='opacity-75'
                fill='currentColor'
                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
              ></path>
            </svg>
            儲存中...
          </div>
        )}

        {isEditing && editingSubWp && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
            <div className='bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md'>
              <div className='flex justify-between items-center mb-6'>
                <h2 className='text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent'>
                  編輯子工作包
                </h2>
                <button
                  onClick={cancelEdit}
                  className='text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                >
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M6 18L18 6M6 6l12 12'
                    />
                  </svg>
                </button>
              </div>
              <p className='text-sm text-gray-600 dark:text-gray-400 mb-6'>{editingSubWp.name}</p>
              <form onSubmit={submitEdit} className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                    預計開始日期
                  </label>
                  <input
                    type='date'
                    name='plannedStartDate'
                    value={formData.plannedStartDate}
                    onChange={handleFormChange}
                    className='w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200
                                                   [&::-webkit-calendar-picker-indicator]:invert-0
                                                   dark:[&::-webkit-calendar-picker-indicator]:invert'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                    預計結束日期
                  </label>
                  <input
                    type='date'
                    name='plannedEndDate'
                    value={formData.plannedEndDate}
                    onChange={handleFormChange}
                    className='w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200
                                                   [&::-webkit-calendar-picker-indicator]:invert-0
                                                   dark:[&::-webkit-calendar-picker-indicator]:invert'
                  />
                </div>
                <div className='flex justify-end space-x-3 pt-4'>
                  <button
                    type='button'
                    onClick={cancelEdit}
                    className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200'
                  >
                    取消
                  </button>
                  <button
                    type='submit'
                    className='px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
                    disabled={saving}
                  >
                    {saving ? (
                      <span className='flex items-center'>
                        <svg
                          className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
                          fill='none'
                          viewBox='0 0 24 24'
                        >
                          <circle
                            className='opacity-25'
                            cx='12'
                            cy='12'
                            r='10'
                            stroke='currentColor'
                            strokeWidth='4'
                          ></circle>
                          <path
                            className='opacity-75'
                            fill='currentColor'
                            d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                          ></path>
                        </svg>
                        儲存中...
                      </span>
                    ) : (
                      '確認儲存'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
