/**
 * 問題追蹤器組件
 * 
 * 提供問題管理和追蹤功能，包括：
 * - 問題列表顯示
 * - 問題狀態管理
 * - 篩選和排序
 * - 問題統計
 */

'use client';

import { useState, useMemo } from 'react';

import { projectStyles } from '@/app/modules/projects/styles';
import type { IssueRecord } from '@/app/modules/projects/types';

interface IssueTrackerProps {
  issues: IssueRecord[];
  projectId: string;
  onAddIssue?: () => void;
  onEditIssue?: (issue: IssueRecord) => void;
  onDeleteIssue?: (issueId: string) => void;
  onUpdateIssueStatus?: (issueId: string, status: string) => void;
}

type SortOption = 'createdAt' | 'severity' | 'status' | 'dueDate' | 'assignedTo';
type SortDirection = 'asc' | 'desc';

export default function IssueTracker({
  issues,
  projectId: _projectId,
  onAddIssue,
  onEditIssue,
  onDeleteIssue,
  onUpdateIssueStatus: _onUpdateIssueStatus,
}: IssueTrackerProps) {
  const [sortBy, setSortBy] = useState<SortOption>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return '待處理';
      case 'in-progress':
        return '處理中';
      case 'resolved':
        return '已解決';
      default:
        return '未知';
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'high':
        return '高';
      case 'medium':
        return '中';
      case 'low':
        return '低';
      default:
        return '未知';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'quality':
        return '品質問題';
      case 'safety':
        return '安全問題';
      case 'progress':
        return '進度問題';
      case 'other':
        return '其他問題';
      default:
        return '未知類型';
    }
  };

  // 篩選和排序問題
  const filteredAndSortedIssues = useMemo(() => {
    const filtered = issues.filter(issue => {
      // 狀態篩選
      if (statusFilter !== 'all' && issue.status !== statusFilter) {
        return false;
      }

      // 嚴重程度篩選
      if (severityFilter !== 'all' && issue.severity !== severityFilter) {
        return false;
      }

      // 搜尋篩選
      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        return (
          issue.description.toLowerCase().includes(lowerSearchTerm) ||
          (issue.assignedTo && issue.assignedTo.toLowerCase().includes(lowerSearchTerm)) ||
          issue.type.toLowerCase().includes(lowerSearchTerm)
        );
      }

      return true;
    });

    // 排序
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
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
        case 'severity':
          aValue = a.severity || '';
          bValue = b.severity || '';
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'dueDate':
          aValue = a.dueDate ? 
            (typeof a.dueDate === 'object' && 'toDate' in a.dueDate
              ? (a.dueDate as { toDate: () => Date }).toDate().toISOString()
              : a.dueDate.toString()
            ) : '';
          bValue = b.dueDate ? 
            (typeof b.dueDate === 'object' && 'toDate' in b.dueDate
              ? (b.dueDate as { toDate: () => Date }).toDate().toISOString()
              : b.dueDate.toString()
            ) : '';
          break;
        case 'assignedTo':
          aValue = a.assignedTo || '';
          bValue = b.assignedTo || '';
          break;
        default:
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
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        const comparison = aValue - bValue;
        return sortDirection === 'asc' ? comparison : -comparison;
      } else {
        return 0;
      }
    });

    return filtered;
  }, [issues, sortBy, sortDirection, statusFilter, severityFilter, searchTerm]);

  // 計算統計資訊
  const stats = useMemo(() => {
    const total = issues.length;
    const open = issues.filter(issue => issue.status === 'open').length;
    const inProgress = issues.filter(issue => issue.status === 'in-progress').length;
    const resolved = issues.filter(issue => issue.status === 'resolved').length;
    const highSeverity = issues.filter(issue => issue.severity === 'high').length;

    return {
      total,
      open,
      inProgress,
      resolved,
      highSeverity,
    };
  }, [issues]);

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

  const formatDate = (date: string | Date | { toDate: () => Date } | null) => {
    if (!date) return '-';
    if (typeof date === 'string') {
      return new Date(date).toLocaleDateString('zh-TW');
    }
    if (typeof date === 'object' && 'toDate' in date) {
      return date.toDate().toLocaleDateString('zh-TW');
    }
    if (date instanceof Date) {
      return date.toLocaleDateString('zh-TW');
    }
    return '-';
  };

  return (
    <div className='space-y-6'>
      {/* 統計資訊 */}
      <div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
        <div className={projectStyles.card.stats}>
          <div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>{stats.total}</div>
          <div className='text-sm text-blue-600 dark:text-blue-400'>總問題數</div>
        </div>
        <div className={projectStyles.card.stats}>
          <div className='text-2xl font-bold text-red-600 dark:text-red-400'>{stats.open}</div>
          <div className='text-sm text-red-600 dark:text-red-400'>待處理</div>
        </div>
        <div className={projectStyles.card.stats}>
          <div className='text-2xl font-bold text-yellow-600 dark:text-yellow-400'>{stats.inProgress}</div>
          <div className='text-sm text-yellow-600 dark:text-yellow-400'>處理中</div>
        </div>
        <div className={projectStyles.card.stats}>
          <div className='text-2xl font-bold text-green-600 dark:text-green-400'>{stats.resolved}</div>
          <div className='text-sm text-green-600 dark:text-green-400'>已解決</div>
        </div>
        <div className={projectStyles.card.stats}>
          <div className='text-2xl font-bold text-red-600 dark:text-red-400'>{stats.highSeverity}</div>
          <div className='text-sm text-red-600 dark:text-red-400'>高嚴重性</div>
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
              placeholder='搜尋問題...'
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
            <option value='open'>待處理</option>
            <option value='in-progress'>處理中</option>
            <option value='resolved'>已解決</option>
          </select>

          {/* 嚴重程度篩選 */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className={projectStyles.form.select}
          >
            <option value='all'>全部嚴重程度</option>
            <option value='high'>高</option>
            <option value='medium'>中</option>
            <option value='low'>低</option>
          </select>
        </div>

        {/* 新增按鈕 */}
        {onAddIssue && (
          <button
            onClick={onAddIssue}
            className={projectStyles.button.primary}
          >
            <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
            </svg>
            新增問題
          </button>
        )}
      </div>

      {/* 排序選項 */}
      <div className='flex flex-wrap gap-2'>
        {[
          { key: 'createdAt', label: '建立時間' },
          { key: 'severity', label: '嚴重程度' },
          { key: 'status', label: '狀態' },
          { key: 'dueDate', label: '到期日' },
          { key: 'assignedTo', label: '負責人' },
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

      {/* 問題列表 */}
      {filteredAndSortedIssues.length === 0 ? (
        <div className={projectStyles.card.base}>
          <div className='text-center py-8'>
            <svg className='w-12 h-12 text-gray-400 mx-auto mb-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
            </svg>
            <p className='text-gray-500 dark:text-gray-400 mb-2'>
              {searchTerm || statusFilter !== 'all' || severityFilter !== 'all' ? '沒有符合條件的問題' : '尚未記錄問題'}
            </p>
            {onAddIssue && (
              <button
                onClick={onAddIssue}
                className={projectStyles.button.outline}
              >
                新增第一個問題
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className={projectStyles.table.container}>
          <table className={projectStyles.table.table}>
            <thead className={projectStyles.table.thead}>
              <tr>
                <th className={projectStyles.table.th}>描述</th>
                <th className={projectStyles.table.th}>類型</th>
                <th className={projectStyles.table.th}>嚴重程度</th>
                <th className={projectStyles.table.th}>狀態</th>
                <th className={projectStyles.table.th}>負責人</th>
                <th className={projectStyles.table.th}>到期日</th>
                <th className={projectStyles.table.th}>操作</th>
              </tr>
            </thead>
            <tbody className={projectStyles.table.tbody}>
              {filteredAndSortedIssues.map((issue) => (
                <tr key={issue.id} className={projectStyles.table.rowHover}>
                  <td className={projectStyles.table.td}>
                    <div className='max-w-xs truncate' title={issue.description}>
                      {issue.description}
                    </div>
                  </td>
                  <td className={projectStyles.table.td}>
                    {getTypeText(issue.type)}
                  </td>
                  <td className={projectStyles.table.td}>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                      {getSeverityText(issue.severity)}
                    </span>
                  </td>
                  <td className={projectStyles.table.td}>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                      {getStatusText(issue.status)}
                    </span>
                  </td>
                  <td className={projectStyles.table.td}>
                    {issue.assignedTo || '-'}
                  </td>
                  <td className={projectStyles.table.td}>
                    {formatDate(issue.dueDate)}
                  </td>
                  <td className={projectStyles.table.td}>
                    <div className='flex items-center space-x-2'>
                      {onEditIssue && (
                        <button
                          onClick={() => onEditIssue(issue)}
                          className={projectStyles.button.edit}
                          title='編輯'
                        >
                          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                          </svg>
                        </button>
                      )}
                      {onDeleteIssue && (
                        <button
                          onClick={() => onDeleteIssue(issue.id)}
                          className='p-2 text-red-600 hover:text-red-800 transition-colors duration-200'
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
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 結果統計 */}
      {filteredAndSortedIssues.length > 0 && (
        <div className='text-sm text-gray-500 dark:text-gray-400 text-center'>
          顯示 {filteredAndSortedIssues.length} 個問題
          {(searchTerm || statusFilter !== 'all' || severityFilter !== 'all') && ` (共 ${issues.length} 個)`}
        </div>
      )}
    </div>
  );
}
