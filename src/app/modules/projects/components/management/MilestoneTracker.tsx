/**
 * 里程碑追蹤器組件
 * 
 * 提供專案里程碑的管理和追蹤功能，包括：
 * - 里程碑列表顯示
 * - 里程碑進度追蹤
 * - 里程碑狀態管理
 * - 里程碑統計分析
 */

'use client';

import { useState, useMemo, type ReactElement } from 'react';

import { projectStyles } from '@/app/modules/projects/styles';
import type { ProjectMilestone } from '@/app/modules/projects/types';

interface MilestoneTrackerProps {
  milestones: ProjectMilestone[];
  onAddMilestone?: () => void;
  onEditMilestone?: (milestone: ProjectMilestone) => void;
  onDeleteMilestone?: (milestoneId: string) => void;
  onUpdateMilestoneStatus?: (milestoneId: string, status: string) => void;
}

type SortOption = 'targetDate' | 'status' | 'type' | 'name';
type SortDirection = 'asc' | 'desc';

export default function MilestoneTracker({
  milestones,
  onAddMilestone,
  onEditMilestone,
  onDeleteMilestone,
  onUpdateMilestoneStatus,
}: MilestoneTrackerProps): ReactElement {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('targetDate');
  const [sortOrder, setSortDirection] = useState<SortDirection>('asc');

  // 統計資訊
  const stats = useMemo(() => {
    const total = milestones.length;
    const pending = milestones.filter(milestone => milestone.status === 'pending').length;
    const completed = milestones.filter(milestone => milestone.status === 'completed').length;
    const overdue = milestones.filter(milestone => milestone.status === 'overdue').length;
    
    return { total, pending, completed, overdue };
  }, [milestones]);

  // 篩選和排序里程碑
  const filteredAndSortedMilestones = useMemo(() => {
    const filtered = milestones.filter(milestone => {
      const matchesSearch = milestone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (milestone.description && milestone.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || milestone.status === statusFilter;
      const matchesType = typeFilter === 'all' || milestone.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });

    // 排序
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'targetDate':
          aValue = a.targetDate instanceof Date ? a.targetDate.getTime() : 
                   typeof a.targetDate === 'string' ? new Date(a.targetDate).getTime() :
                   a.targetDate?.toDate?.()?.getTime() || 0;
          bValue = b.targetDate instanceof Date ? b.targetDate.getTime() : 
                   typeof b.targetDate === 'string' ? new Date(b.targetDate).getTime() :
                   b.targetDate?.toDate?.()?.getTime() || 0;
          break;
        case 'status':
          const statusOrder = { pending: 1, completed: 2, overdue: 3 };
          aValue = statusOrder[a.status as keyof typeof statusOrder] || 0;
          bValue = statusOrder[b.status as keyof typeof statusOrder] || 0;
          break;
        case 'type':
          const typeOrder = { start: 1, intermediate: 2, end: 3 };
          aValue = typeOrder[a.type as keyof typeof typeOrder] || 0;
          bValue = typeOrder[b.type as keyof typeof typeOrder] || 0;
          break;
        case 'name':
          aValue = a.name;
          bValue = b.name;
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
  }, [milestones, searchTerm, statusFilter, typeFilter, sortBy, sortOrder]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'start':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'intermediate':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'end':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'start': return '開始';
      case 'intermediate': return '中間';
      case 'end': return '結束';
      default: return type;
    }
  };

  const formatDate = (date: string | Date | { toDate: () => Date } | null) => {
    if (!date) return '-';
    
    if (date instanceof Date) {
      return date.toLocaleDateString('zh-TW');
    }
    
    if (typeof date === 'object' && 'toDate' in date) {
      return date.toDate().toLocaleDateString('zh-TW');
    }
    
    return new Date(date).toLocaleDateString('zh-TW');
  };

  const isOverdue = (targetDate: string | Date | { toDate: () => Date } | null) => {
    if (!targetDate) return false;
    
    let date: Date;
    if (targetDate instanceof Date) {
      date = targetDate;
    } else if (typeof targetDate === 'object' && 'toDate' in targetDate) {
      date = targetDate.toDate();
    } else {
      date = new Date(targetDate);
    }
    
    return date < new Date();
  };

  const handleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(option);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (option: SortOption) => {
    if (sortBy !== option) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  return (
    <div className='space-y-6'>
      {/* 統計卡片 */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <div className={`${projectStyles.card.stats} ${projectStyles.card.statsColors.blue}`}>
          <div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
            {stats.total}
          </div>
          <div className='text-sm text-gray-600 dark:text-gray-400'>
            總里程碑
          </div>
        </div>
        <div className={`${projectStyles.card.stats} ${projectStyles.card.statsColors.yellow}`}>
          <div className='text-2xl font-bold text-yellow-600 dark:text-yellow-400'>
            {stats.pending}
          </div>
          <div className='text-sm text-gray-600 dark:text-gray-400'>
            待完成
          </div>
        </div>
        <div className={`${projectStyles.card.stats} ${projectStyles.card.statsColors.green}`}>
          <div className='text-2xl font-bold text-green-600 dark:text-green-400'>
            {stats.completed}
          </div>
          <div className='text-sm text-gray-600 dark:text-gray-400'>
            已完成
          </div>
        </div>
        <div className={`${projectStyles.card.stats} ${projectStyles.card.statsColors.red}`}>
          <div className='text-2xl font-bold text-red-600 dark:text-red-400'>
            {stats.overdue}
          </div>
          <div className='text-sm text-gray-600 dark:text-gray-400'>
            已逾期
          </div>
        </div>
      </div>

      {/* 控制列 */}
      <div className='flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4'>
        <div className='flex flex-wrap items-center gap-4'>
          <input
            type='text'
            placeholder='搜尋里程碑...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={projectStyles.form.search}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={projectStyles.form.select}
          >
            <option value='all'>所有狀態</option>
            <option value='pending'>待完成</option>
            <option value='completed'>已完成</option>
            <option value='overdue'>已逾期</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={projectStyles.form.select}
          >
            <option value='all'>所有類型</option>
            <option value='start'>開始</option>
            <option value='intermediate'>中間</option>
            <option value='end'>結束</option>
          </select>
        </div>
        
        {onAddMilestone && (
          <button
            onClick={onAddMilestone}
            className={projectStyles.button.primary}
          >
            新增里程碑
          </button>
        )}
      </div>

      {/* 里程碑列表 */}
      <div className={projectStyles.card.base}>
        <div className='overflow-x-auto'>
          <table className={projectStyles.table.table}>
            <thead className={projectStyles.table.thead}>
              <tr>
                <th className={projectStyles.table.th}>
                  <button
                    onClick={() => handleSort('name')}
                    className='flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-300'
                  >
                    <span>里程碑名稱</span>
                    {getSortIcon('name')}
                  </button>
                </th>
                <th className={projectStyles.table.th}>描述</th>
                <th className={projectStyles.table.th}>
                  <button
                    onClick={() => handleSort('type')}
                    className='flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-300'
                  >
                    <span>類型</span>
                    {getSortIcon('type')}
                  </button>
                </th>
                <th className={projectStyles.table.th}>
                  <button
                    onClick={() => handleSort('targetDate')}
                    className='flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-300'
                  >
                    <span>目標日期</span>
                    {getSortIcon('targetDate')}
                  </button>
                </th>
                <th className={projectStyles.table.th}>實際日期</th>
                <th className={projectStyles.table.th}>
                  <button
                    onClick={() => handleSort('status')}
                    className='flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-300'
                  >
                    <span>狀態</span>
                    {getSortIcon('status')}
                  </button>
                </th>
                <th className={projectStyles.table.th}>負責人</th>
                <th className={projectStyles.table.th}>操作</th>
              </tr>
            </thead>
            <tbody className={projectStyles.table.tbody}>
              {filteredAndSortedMilestones.length === 0 ? (
                <tr>
                  <td colSpan={8} className='px-6 py-8 text-center text-gray-500 dark:text-gray-400'>
                    {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                      ? '沒有符合條件的里程碑' 
                      : '尚無里程碑記錄'}
                  </td>
                </tr>
              ) : (
                filteredAndSortedMilestones.map((milestone) => (
                  <tr key={milestone.id} className={projectStyles.table.rowHover}>
                    <td className={projectStyles.table.td}>
                      <div className='max-w-xs truncate' title={milestone.name}>
                        {milestone.name}
                      </div>
                    </td>
                    <td className={projectStyles.table.td}>
                      <div className='max-w-xs truncate' title={milestone.description}>
                        {milestone.description || '-'}
                      </div>
                    </td>
                    <td className={projectStyles.table.td}>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(milestone.type)}`}>
                        {getTypeText(milestone.type)}
                      </span>
                    </td>
                    <td className={projectStyles.table.td}>
                      <div className='flex items-center space-x-2'>
                        <span className='text-sm text-gray-900 dark:text-gray-100'>
                          {formatDate(milestone.targetDate)}
                        </span>
                        {isOverdue(milestone.targetDate) && milestone.status !== 'completed' && (
                          <span className='text-xs text-red-600 dark:text-red-400'>⚠️</span>
                        )}
                      </div>
                    </td>
                    <td className={projectStyles.table.td}>
                      <span className='text-sm text-gray-900 dark:text-gray-100'>
                        {milestone.actualDate ? formatDate(milestone.actualDate) : '-'}
                      </span>
                    </td>
                    <td className={projectStyles.table.td}>
                      <select
                        value={milestone.status}
                        onChange={(e) => onUpdateMilestoneStatus?.(milestone.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-full font-medium border-0 ${getStatusColor(milestone.status)}`}
                      >
                        <option value='pending'>待完成</option>
                        <option value='completed'>已完成</option>
                        <option value='overdue'>已逾期</option>
                      </select>
                    </td>
                    <td className={projectStyles.table.td}>
                      <span className='text-sm text-gray-900 dark:text-gray-100'>
                        {milestone.responsiblePerson || '-'}
                      </span>
                    </td>
                    <td className={projectStyles.table.td}>
                      <div className='flex items-center space-x-2'>
                        {onEditMilestone && (
                          <button
                            onClick={() => onEditMilestone(milestone)}
                            className={projectStyles.button.edit}
                            title='編輯'
                          >
                            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                            </svg>
                          </button>
                        )}
                        {onDeleteMilestone && (
                          <button
                            onClick={() => onDeleteMilestone(milestone.id)}
                            className='p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200'
                            title='刪除'
                          >
                            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
