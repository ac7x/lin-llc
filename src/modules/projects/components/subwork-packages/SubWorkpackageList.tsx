/**
 * 子工作包列表組件
 * 
 * 顯示工作包下的所有子工作包，包括：
 * - 子工作包卡片列表
 * - 排序和篩選功能
 * - 新增子工作包按鈕
 * - 進度統計
 */

'use client';

import { useState, useMemo } from 'react';

import { projectStyles } from '@/modules/projects/styles';
import type { SubWorkpackage } from '@/modules/projects/types/project';
import SubWorkpackageCard from './SubWorkpackageCard';

interface SubWorkpackageListProps {
  subWorkpackages: SubWorkpackage[];
  workpackageId: string;
  onAddSubWorkpackage?: () => void;
  onEditSubWorkpackage?: (subWorkpackage: SubWorkpackage) => void;
  onDeleteSubWorkpackage?: (subWorkpackageId: string) => void;
  onViewSubWorkpackageDetails?: (subWorkpackageId: string) => void;
}

type SortOption = 'name' | 'status' | 'priority' | 'progress' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export default function SubWorkpackageList({
  subWorkpackages,
  workpackageId,
  onAddSubWorkpackage,
  onEditSubWorkpackage,
  onDeleteSubWorkpackage,
  onViewSubWorkpackageDetails,
}: SubWorkpackageListProps) {
  const [sortBy, setSortBy] = useState<SortOption>('priority');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 計算子工作包進度
  const calculateSubWorkpackageProgress = (sub: SubWorkpackage): number => {
    const estimated = typeof sub.estimatedQuantity === 'number' ? sub.estimatedQuantity : 0;
    if (estimated === 0) return 0;
    
    const actual = typeof sub.actualQuantity === 'number' ? sub.actualQuantity : 0;
    return Math.round((actual / estimated) * 100);
  };

  // 篩選和排序子工作包
  const filteredAndSortedSubWorkpackages = useMemo(() => {
    const filtered = subWorkpackages.filter(sub => {
      // 狀態篩選
      if (statusFilter !== 'all' && sub.status !== statusFilter) {
        return false;
      }

      // 搜尋篩選
      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        return (
          sub.name.toLowerCase().includes(lowerSearchTerm) ||
          (sub.description && sub.description.toLowerCase().includes(lowerSearchTerm)) ||
          (sub.assignedTo && sub.assignedTo.toLowerCase().includes(lowerSearchTerm))
        );
      }

      return true;
    });

    // 排序
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'priority':
          aValue = a.priority || 0;
          bValue = b.priority || 0;
          break;
        case 'progress':
          aValue = calculateSubWorkpackageProgress(a);
          bValue = calculateSubWorkpackageProgress(b);
          break;
        case 'createdAt':
          aValue = a.createdAt ? 
            (typeof a.createdAt === 'object' && 'toDate' in a.createdAt
              ? (a.createdAt as { toDate: () => Date }).toDate().toISOString()
              : a.createdAt.toString()
            ) : '';
          bValue = b.createdAt ? 
            (typeof b.createdAt === 'object' && 'toDate' in b.createdAt
              ? (b.createdAt as { toDate: () => Date }).toDate().toISOString()
              : b.createdAt.toString()
            ) : '';
          break;
        default:
          aValue = a.priority || 0;
          bValue = b.priority || 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      } else {
        const comparison = (aValue as number) - (bValue as number);
        return sortDirection === 'asc' ? comparison : -comparison;
      }
    });

    return filtered;
  }, [subWorkpackages, sortBy, sortDirection, statusFilter, searchTerm]);

  // 計算統計資訊
  const stats = useMemo(() => {
    const total = subWorkpackages.length;
    const completed = subWorkpackages.filter(sub => sub.status === 'completed').length;
    const inProgress = subWorkpackages.filter(sub => sub.status === 'in-progress').length;
    const onHold = subWorkpackages.filter(sub => sub.status === 'on-hold').length;
    const totalProgress = subWorkpackages.reduce((sum, sub) => sum + calculateSubWorkpackageProgress(sub), 0);
    const averageProgress = total > 0 ? Math.round(totalProgress / total) : 0;

    return {
      total,
      completed,
      inProgress,
      onHold,
      averageProgress,
    };
  }, [subWorkpackages]);

  const handleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(option);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (option: SortOption) => {
    if (sortBy !== option) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <div className='space-y-6'>
      {/* 統計資訊 */}
      <div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
        <div className={projectStyles.card.stats}>
          <div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>{stats.total}</div>
          <div className='text-sm text-blue-600 dark:text-blue-400'>總數</div>
        </div>
        <div className={projectStyles.card.stats}>
          <div className='text-2xl font-bold text-green-600 dark:text-green-400'>{stats.completed}</div>
          <div className='text-sm text-green-600 dark:text-green-400'>已完成</div>
        </div>
        <div className={projectStyles.card.stats}>
          <div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>{stats.inProgress}</div>
          <div className='text-sm text-blue-600 dark:text-blue-400'>執行中</div>
        </div>
        <div className={projectStyles.card.stats}>
          <div className='text-2xl font-bold text-yellow-600 dark:text-yellow-400'>{stats.onHold}</div>
          <div className='text-sm text-yellow-600 dark:text-yellow-400'>暫停中</div>
        </div>
        <div className={projectStyles.card.stats}>
          <div className='text-2xl font-bold text-purple-600 dark:text-purple-400'>{stats.averageProgress}%</div>
          <div className='text-sm text-purple-600 dark:text-purple-400'>平均進度</div>
        </div>
      </div>

      {/* 控制列 */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div className='flex flex-col sm:flex-row gap-4'>
          {/* 搜尋 */}
          <div className='relative'>
            <input
              type='text'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder='搜尋子工作包...'
              className={projectStyles.form.search}
            />
            <svg
              className='absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
            </svg>
          </div>

          {/* 狀態篩選 */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={projectStyles.form.select}
          >
            <option value='all'>全部狀態</option>
            <option value='draft'>草稿</option>
            <option value='assigned'>已分配</option>
            <option value='in-progress'>執行中</option>
            <option value='review'>審查中</option>
            <option value='completed'>已完成</option>
            <option value='on-hold'>暫停中</option>
            <option value='cancelled'>已取消</option>
          </select>
        </div>

        {/* 新增按鈕 */}
        {onAddSubWorkpackage && (
          <button
            onClick={onAddSubWorkpackage}
            className={projectStyles.button.primary}
          >
            <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
            </svg>
            新增子工作包
          </button>
        )}
      </div>

      {/* 排序選項 */}
      <div className='flex flex-wrap gap-2'>
        {[
          { key: 'priority', label: '優先級' },
          { key: 'name', label: '名稱' },
          { key: 'status', label: '狀態' },
          { key: 'progress', label: '進度' },
          { key: 'createdAt', label: '建立時間' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleSort(key as SortOption)}
            className={`${projectStyles.button.small} flex items-center gap-1 ${
              sortBy === key ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : ''
            }`}
          >
            {label} {getSortIcon(key as SortOption)}
          </button>
        ))}
      </div>

      {/* 子工作包列表 */}
      {filteredAndSortedSubWorkpackages.length === 0 ? (
        <div className={projectStyles.card.base}>
          <div className='text-center py-8'>
            <svg className='w-12 h-12 text-gray-400 mx-auto mb-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' />
            </svg>
            <p className='text-gray-500 dark:text-gray-400 mb-2'>
              {searchTerm || statusFilter !== 'all' ? '沒有符合條件的子工作包' : '尚未建立子工作包'}
            </p>
            {onAddSubWorkpackage && (
              <button
                onClick={onAddSubWorkpackage}
                className={projectStyles.button.outline}
              >
                新增第一個子工作包
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {filteredAndSortedSubWorkpackages.map((subWorkpackage) => (
            <SubWorkpackageCard
              key={subWorkpackage.id}
              subWorkpackage={subWorkpackage}
              workpackageId={workpackageId}
              onEdit={onEditSubWorkpackage}
              onDelete={onDeleteSubWorkpackage}
              onViewDetails={onViewSubWorkpackageDetails}
            />
          ))}
        </div>
      )}

      {/* 結果統計 */}
      {filteredAndSortedSubWorkpackages.length > 0 && (
        <div className='text-sm text-gray-500 dark:text-gray-400 text-center'>
          顯示 {filteredAndSortedSubWorkpackages.length} 個子工作包
          {(searchTerm || statusFilter !== 'all') && ` (共 ${subWorkpackages.length} 個)`}
        </div>
      )}
    </div>
  );
}
