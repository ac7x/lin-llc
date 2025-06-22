/**
 * 變更管理器組件
 * 
 * 提供專案變更的管理和追蹤功能，包括：
 * - 變更請求列表
 * - 變更評估和審批
 * - 變更實施追蹤
 * - 變更影響分析
 */

'use client';

import { useState, useMemo } from 'react';

import { projectStyles } from '@/app/modules/test-projects/styles';
import type { ProjectChange } from '@/app/modules/test-projects/types';

interface ChangeManagerProps {
  changes: ProjectChange[];
  projectId: string;
  onAddChange?: () => void;
  onEditChange?: (change: ProjectChange) => void;
  onDeleteChange?: (changeId: string) => void;
  onUpdateChangeStatus?: (changeId: string, status: string) => void;
}

type SortOption = 'createdAt' | 'type' | 'impact' | 'status' | 'requestedBy';
type SortDirection = 'asc' | 'desc';

export default function ChangeManager({
  changes,
  projectId: _projectId,
  onAddChange,
  onEditChange,
  onDeleteChange,
  onUpdateChangeStatus: _onUpdateChangeStatus,
}: ChangeManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [impactFilter, setImpactFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('createdAt');
  const [sortOrder, setSortDirection] = useState<SortDirection>('desc');

  // 統計資訊
  const stats = useMemo(() => {
    const total = changes.length;
    const proposed = changes.filter(change => change.status === 'proposed').length;
    const approved = changes.filter(change => change.status === 'approved').length;
    const implemented = changes.filter(change => change.status === 'implemented').length;
    const rejected = changes.filter(change => change.status === 'rejected').length;
    
    return { total, proposed, approved, implemented, rejected };
  }, [changes]);

  // 篩選和排序變更
  const filteredAndSortedChanges = useMemo(() => {
    const filtered = changes.filter(change => {
      const matchesSearch = change.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           change.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || change.type === typeFilter;
      const matchesImpact = impactFilter === 'all' || change.impact === impactFilter;
      const matchesStatus = statusFilter === 'all' || change.status === statusFilter;
      return matchesSearch && matchesType && matchesImpact && matchesStatus;
    });

    // 排序
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'createdAt':
          aValue = a.createdAt instanceof Date ? a.createdAt.getTime() : 
                   typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() :
                   a.createdAt?.toDate?.()?.getTime() || 0;
          bValue = b.createdAt instanceof Date ? b.createdAt.getTime() : 
                   typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() :
                   b.createdAt?.toDate?.()?.getTime() || 0;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'impact':
          const impactOrder = { low: 1, medium: 2, high: 3 };
          aValue = impactOrder[a.impact as keyof typeof impactOrder] || 0;
          bValue = impactOrder[b.impact as keyof typeof impactOrder] || 0;
          break;
        case 'status':
          const statusOrder = { proposed: 1, approved: 2, implemented: 3, rejected: 4 };
          aValue = statusOrder[a.status as keyof typeof statusOrder] || 0;
          bValue = statusOrder[b.status as keyof typeof statusOrder] || 0;
          break;
        case 'requestedBy':
          aValue = a.requestedBy;
          bValue = b.requestedBy;
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
  }, [changes, searchTerm, typeFilter, impactFilter, statusFilter, sortBy, sortOrder]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'scope':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'schedule':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'cost':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'quality':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'risk':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'proposed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'implemented':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'scope':
        return '範圍變更';
      case 'schedule':
        return '時程變更';
      case 'cost':
        return '成本變更';
      case 'quality':
        return '品質變更';
      case 'risk':
        return '風險變更';
      default:
        return type;
    }
  };

  const getImpactText = (impact: string) => {
    switch (impact) {
      case 'low':
        return '低影響';
      case 'medium':
        return '中影響';
      case 'high':
        return '高影響';
      default:
        return impact;
    }
  };

  const _getStatusText = (status: string) => {
    switch (status) {
      case 'proposed':
        return '已提出';
      case 'approved':
        return '已核准';
      case 'implemented':
        return '已實施';
      case 'rejected':
        return '已拒絕';
      default:
        return status;
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

  const handleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(option);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (option: SortOption) => {
    if (sortBy !== option) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  return (
    <div className='space-y-6'>
      {/* 統計卡片 */}
      <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
        <div className={`${projectStyles.card.stats} ${projectStyles.card.statsColors.blue}`}>
          <div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
            {stats.total}
          </div>
          <div className='text-sm text-gray-600 dark:text-gray-400'>
            總變更數
          </div>
        </div>
        <div className={`${projectStyles.card.stats} ${projectStyles.card.statsColors.yellow}`}>
          <div className='text-2xl font-bold text-yellow-600 dark:text-yellow-400'>
            {stats.proposed}
          </div>
          <div className='text-sm text-gray-600 dark:text-gray-400'>
            待審核
          </div>
        </div>
        <div className={`${projectStyles.card.stats} ${projectStyles.card.statsColors.green}`}>
          <div className='text-2xl font-bold text-green-600 dark:text-green-400'>
            {stats.approved}
          </div>
          <div className='text-sm text-gray-600 dark:text-gray-400'>
            已核准
          </div>
        </div>
        <div className={`${projectStyles.card.stats} ${projectStyles.card.statsColors.indigo}`}>
          <div className='text-2xl font-bold text-indigo-600 dark:text-indigo-400'>
            {stats.implemented}
          </div>
          <div className='text-sm text-gray-600 dark:text-gray-400'>
            已實施
          </div>
        </div>
        <div className={`${projectStyles.card.stats} ${projectStyles.card.statsColors.red}`}>
          <div className='text-2xl font-bold text-red-600 dark:text-red-400'>
            {stats.rejected}
          </div>
          <div className='text-sm text-gray-600 dark:text-gray-400'>
            已拒絕
          </div>
        </div>
      </div>

      {/* 控制列 */}
      <div className='flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4'>
        <div className='flex flex-wrap items-center gap-4'>
          <input
            type='text'
            placeholder='搜尋變更...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={projectStyles.form.search}
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={projectStyles.form.select}
          >
            <option value='all'>所有類型</option>
            <option value='scope'>範圍變更</option>
            <option value='schedule'>時程變更</option>
            <option value='cost'>成本變更</option>
            <option value='quality'>品質變更</option>
            <option value='risk'>風險變更</option>
          </select>
          <select
            value={impactFilter}
            onChange={(e) => setImpactFilter(e.target.value)}
            className={projectStyles.form.select}
          >
            <option value='all'>所有影響</option>
            <option value='low'>低影響</option>
            <option value='medium'>中影響</option>
            <option value='high'>高影響</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={projectStyles.form.select}
          >
            <option value='all'>所有狀態</option>
            <option value='proposed'>已提出</option>
            <option value='approved'>已核准</option>
            <option value='implemented'>已實施</option>
            <option value='rejected'>已拒絕</option>
          </select>
        </div>
        
        {onAddChange && (
          <button
            onClick={onAddChange}
            className={projectStyles.button.primary}
          >
            新增變更
          </button>
        )}
      </div>

      {/* 變更列表 */}
      <div className={projectStyles.card.base}>
        <div className='overflow-x-auto'>
          <table className={projectStyles.table.table}>
            <thead className={projectStyles.table.thead}>
              <tr>
                <th className={projectStyles.table.th}>
                  <button
                    onClick={() => handleSort('createdAt')}
                    className='flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-300'
                  >
                    <span>建立日期</span>
                    {getSortIcon('createdAt')}
                  </button>
                </th>
                <th className={projectStyles.table.th}>標題</th>
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
                    onClick={() => handleSort('impact')}
                    className='flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-300'
                  >
                    <span>影響</span>
                    {getSortIcon('impact')}
                  </button>
                </th>
                <th className={projectStyles.table.th}>
                  <button
                    onClick={() => handleSort('status')}
                    className='flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-300'
                  >
                    <span>狀態</span>
                    {getSortIcon('status')}
                  </button>
                </th>
                <th className={projectStyles.table.th}>
                  <button
                    onClick={() => handleSort('requestedBy')}
                    className='flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-300'
                  >
                    <span>申請人</span>
                    {getSortIcon('requestedBy')}
                  </button>
                </th>
                <th className={projectStyles.table.th}>操作</th>
              </tr>
            </thead>
            <tbody className={projectStyles.table.tbody}>
              {filteredAndSortedChanges.length === 0 ? (
                <tr>
                  <td colSpan={7} className='px-6 py-8 text-center text-gray-500 dark:text-gray-400'>
                    {searchTerm || typeFilter !== 'all' || impactFilter !== 'all' || statusFilter !== 'all' 
                      ? '沒有符合條件的變更' 
                      : '尚無變更記錄'}
                  </td>
                </tr>
              ) : (
                filteredAndSortedChanges.map((change) => (
                  <tr key={change.id} className={projectStyles.table.rowHover}>
                    <td className={projectStyles.table.td}>
                      {formatDate(change.createdAt)}
                    </td>
                    <td className={projectStyles.table.td}>
                      <div className='max-w-xs truncate' title={change.title}>
                        {change.title}
                      </div>
                    </td>
                    <td className={projectStyles.table.td}>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(change.type)}`}>
                        {getTypeText(change.type)}
                      </span>
                    </td>
                    <td className={projectStyles.table.td}>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getImpactColor(change.impact)}`}>
                        {getImpactText(change.impact)}
                      </span>
                    </td>
                    <td className={projectStyles.table.td}>
                      <select
                        value={change.status}
                        onChange={(e) => _onUpdateChangeStatus?.(change.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-full font-medium border-0 ${getStatusColor(change.status)}`}
                      >
                        <option value='proposed'>已提出</option>
                        <option value='approved'>已核准</option>
                        <option value='implemented'>已實施</option>
                        <option value='rejected'>已拒絕</option>
                      </select>
                    </td>
                    <td className={projectStyles.table.td}>
                      <span className='text-sm text-gray-900 dark:text-gray-100'>
                        {change.requestedBy}
                      </span>
                    </td>
                    <td className={projectStyles.table.td}>
                      <div className='flex items-center space-x-2'>
                        {onEditChange && (
                          <button
                            onClick={() => onEditChange(change)}
                            className={projectStyles.button.edit}
                            title='編輯'
                          >
                            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                            </svg>
                          </button>
                        )}
                        {onDeleteChange && (
                          <button
                            onClick={() => onDeleteChange(change.id)}
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
