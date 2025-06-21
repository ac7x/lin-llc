/**
 * 問題列表組件
 * 
 * 提供專案問題的列表顯示和管理功能，包括：
 * - 問題列表顯示
 * - 篩選和搜尋
 * - 新增/編輯/刪除操作
 * - 狀態管理
 * - 統計資訊
 */

'use client';

import type { Timestamp } from 'firebase/firestore';
import { useState, useMemo } from 'react';

import { projectStyles } from '@/modules/test-projects/styles';
import type { IssueRecord } from '@/modules/test-projects/types/project';

interface IssueListProps {
  issues: IssueRecord[];
  projectId: string;
  onEdit: (issue: IssueRecord) => void;
  onDelete: (issueId: string) => Promise<void>;
  onAdd: () => void;
  onStatusChange: (issueId: string, status: 'open' | 'in-progress' | 'resolved') => Promise<void>;
  isLoading?: boolean;
  availableUsers?: Array<{ uid: string; displayName: string; email: string }>;
}

// 輔助函數：格式化日期
const formatDate = (dateField: Timestamp | Date | string | null | undefined): string => {
  if (!dateField) return '-';
  
  let date: Date;
  
  if (typeof dateField === 'string') {
    date = new Date(dateField);
  } else if (dateField instanceof Date) {
    date = dateField;
  } else if (typeof dateField === 'object' && 'toDate' in dateField) {
    date = dateField.toDate();
  } else {
    return '-';
  }
  
  return date.toLocaleDateString('zh-TW');
};

// 問題類型標籤
const getIssueTypeLabel = (type: string) => {
  const typeMap: Record<string, string> = {
    quality: '品質問題',
    safety: '安全問題',
    progress: '進度問題',
    other: '其他問題',
  };
  return typeMap[type] || type;
};

// 嚴重程度標籤
const getSeverityLabel = (severity: string) => {
  const severityMap: Record<string, { label: string; color: string }> = {
    low: { label: '低', color: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-400' },
    medium: { label: '中', color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-400' },
    high: { label: '高', color: 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-400' },
  };
  return severityMap[severity] || { label: severity, color: 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-400' };
};

// 狀態標籤
const getStatusLabel = (status: string) => {
  const statusMap: Record<string, { label: string; color: string }> = {
    open: { label: '待處理', color: 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-400' },
    'in-progress': { label: '處理中', color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-400' },
    resolved: { label: '已解決', color: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-400' },
  };
  return statusMap[status] || { label: status, color: 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-400' };
};

export default function IssueList({
  issues,
  projectId: _projectId,
  onEdit,
  onDelete,
  onAdd,
  onStatusChange,
  isLoading = false,
  availableUsers = [],
}: IssueListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'severity' | 'status' | 'dueDate'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 統計資訊
  const stats = useMemo(() => {
    const total = issues.length;
    const open = issues.filter(issue => issue.status === 'open').length;
    const inProgress = issues.filter(issue => issue.status === 'in-progress').length;
    const resolved = issues.filter(issue => issue.status === 'resolved').length;
    const highSeverity = issues.filter(issue => issue.severity === 'high').length;
    
    return { total, open, inProgress, resolved, highSeverity };
  }, [issues]);

  // 篩選和排序問題
  const filteredAndSortedIssues = useMemo(() => {
    const filtered = issues.filter(issue => {
      const matchesSearch = issue.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || issue.type === typeFilter;
      const matchesSeverity = severityFilter === 'all' || issue.severity === severityFilter;
      const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
      return matchesSearch && matchesType && matchesSeverity && matchesStatus;
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
        case 'dueDate':
          aValue = a.dueDate instanceof Date ? a.dueDate.getTime() : 
                   typeof a.dueDate === 'string' ? new Date(a.dueDate).getTime() :
                   a.dueDate?.toDate?.()?.getTime() || 0;
          bValue = b.dueDate instanceof Date ? b.dueDate.getTime() : 
                   typeof b.dueDate === 'string' ? new Date(b.dueDate).getTime() :
                   b.dueDate?.toDate?.()?.getTime() || 0;
          break;
        case 'severity':
          const severityOrder = { high: 3, medium: 2, low: 1 };
          aValue = severityOrder[a.severity as keyof typeof severityOrder] || 0;
          bValue = severityOrder[b.severity as keyof typeof severityOrder] || 0;
          break;
        case 'status':
          const statusOrder = { open: 1, 'in-progress': 2, resolved: 3 };
          aValue = statusOrder[a.status as keyof typeof statusOrder] || 0;
          bValue = statusOrder[b.status as keyof typeof statusOrder] || 0;
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
  }, [issues, searchTerm, typeFilter, severityFilter, statusFilter, sortBy, sortOrder]);

  // 獲取所有類型和嚴重程度
  const issueTypes = useMemo(() => {
    const uniqueTypes = new Set(issues.map(issue => issue.type));
    return Array.from(uniqueTypes).sort();
  }, [issues]);

  const severityLevels = useMemo(() => {
    const uniqueSeverities = new Set(issues.map(issue => issue.severity));
    return Array.from(uniqueSeverities).sort();
  }, [issues]);

  const statuses = useMemo(() => {
    const uniqueStatuses = new Set(issues.map(issue => issue.status));
    return Array.from(uniqueStatuses).sort();
  }, [issues]);

  const handleSort = (field: 'createdAt' | 'severity' | 'status' | 'dueDate') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleDelete = async (issueId: string) => {
    if (confirm('確定要刪除此問題嗎？此操作無法復原。')) {
      try {
        await onDelete(issueId);
      } catch (error) {
        // 錯誤處理已由上層組件處理
      }
    }
  };

  const handleStatusChange = async (issueId: string, newStatus: 'open' | 'in-progress' | 'resolved') => {
    try {
      await onStatusChange(issueId, newStatus);
    } catch (error) {
      // 錯誤處理已由上層組件處理
    }
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
            總問題數
          </div>
        </div>
        <div className={`${projectStyles.card.stats} ${projectStyles.card.statsColors.red}`}>
          <div className='text-2xl font-bold text-red-600 dark:text-red-400'>
            {stats.open}
          </div>
          <div className='text-sm text-gray-600 dark:text-gray-400'>
            待處理
          </div>
        </div>
        <div className={`${projectStyles.card.stats} ${projectStyles.card.statsColors.yellow}`}>
          <div className='text-2xl font-bold text-yellow-600 dark:text-yellow-400'>
            {stats.inProgress}
          </div>
          <div className='text-sm text-gray-600 dark:text-gray-400'>
            處理中
          </div>
        </div>
        <div className={`${projectStyles.card.stats} ${projectStyles.card.statsColors.green}`}>
          <div className='text-2xl font-bold text-green-600 dark:text-green-400'>
            {stats.resolved}
          </div>
          <div className='text-sm text-gray-600 dark:text-gray-400'>
            已解決
          </div>
        </div>
        <div className={`${projectStyles.card.stats} ${projectStyles.card.statsColors.orange}`}>
          <div className='text-2xl font-bold text-orange-600 dark:text-orange-400'>
            {stats.highSeverity}
          </div>
          <div className='text-sm text-gray-600 dark:text-gray-400'>
            高嚴重性
          </div>
        </div>
      </div>

      {/* 控制列 */}
      <div className='flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4'>
        <div className='flex flex-wrap items-center gap-4'>
          <input
            type='text'
            placeholder='搜尋問題...'
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
            {issueTypes.map(type => (
              <option key={type} value={type}>
                {getIssueTypeLabel(type)}
              </option>
            ))}
          </select>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className={projectStyles.form.select}
          >
            <option value='all'>所有嚴重程度</option>
            {severityLevels.map(severity => (
              <option key={severity} value={severity}>
                {getSeverityLabel(severity).label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={projectStyles.form.select}
          >
            <option value='all'>所有狀態</option>
            {statuses.map(status => (
              <option key={status} value={status}>
                {getStatusLabel(status).label}
              </option>
            ))}
          </select>
        </div>
        
        <button
          onClick={onAdd}
          className={projectStyles.button.primary}
          disabled={isLoading}
        >
          新增問題
        </button>
      </div>

      {/* 問題列表 */}
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
                    {sortBy === 'createdAt' && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className={projectStyles.table.th}>類型</th>
                <th className={projectStyles.table.th}>描述</th>
                <th className={projectStyles.table.th}>
                  <button
                    onClick={() => handleSort('severity')}
                    className='flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-300'
                  >
                    <span>嚴重程度</span>
                    {sortBy === 'severity' && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className={projectStyles.table.th}>
                  <button
                    onClick={() => handleSort('status')}
                    className='flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-300'
                  >
                    <span>狀態</span>
                    {sortBy === 'status' && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className={projectStyles.table.th}>負責人</th>
                <th className={projectStyles.table.th}>
                  <button
                    onClick={() => handleSort('dueDate')}
                    className='flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-300'
                  >
                    <span>截止日期</span>
                    {sortBy === 'dueDate' && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className={projectStyles.table.th}>操作</th>
              </tr>
            </thead>
            <tbody className={projectStyles.table.tbody}>
              {filteredAndSortedIssues.length === 0 ? (
                <tr>
                  <td colSpan={8} className='px-6 py-8 text-center text-gray-500 dark:text-gray-400'>
                    {searchTerm || typeFilter !== 'all' || severityFilter !== 'all' || statusFilter !== 'all' 
                      ? '沒有符合條件的問題' 
                      : '尚無問題記錄'}
                  </td>
                </tr>
              ) : (
                filteredAndSortedIssues.map((issue) => {
                  const severityInfo = getSeverityLabel(issue.severity);
                  const statusInfo = getStatusLabel(issue.status);
                  const assignedUser = availableUsers.find(user => user.uid === issue.assignedTo);
                  
                  return (
                    <tr key={issue.id} className={projectStyles.table.rowHover}>
                      <td className={projectStyles.table.td}>
                        {formatDate(issue.createdAt)}
                      </td>
                      <td className={projectStyles.table.td}>
                        <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'>
                          {getIssueTypeLabel(issue.type)}
                        </span>
                      </td>
                      <td className={projectStyles.table.td}>
                        <div className='max-w-xs truncate' title={issue.description}>
                          {issue.description}
                        </div>
                      </td>
                      <td className={projectStyles.table.td}>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${severityInfo.color}`}>
                          {severityInfo.label}
                        </span>
                      </td>
                      <td className={projectStyles.table.td}>
                        <select
                          value={issue.status}
                          onChange={(e) => handleStatusChange(issue.id, e.target.value as 'open' | 'in-progress' | 'resolved')}
                          className={`text-xs px-2 py-1 rounded-full font-medium border-0 ${statusInfo.color}`}
                          disabled={isLoading}
                        >
                          <option value='open'>待處理</option>
                          <option value='in-progress'>處理中</option>
                          <option value='resolved'>已解決</option>
                        </select>
                      </td>
                      <td className={projectStyles.table.td}>
                        {assignedUser ? (
                          <span className='text-sm text-gray-900 dark:text-gray-100'>
                            {assignedUser.displayName}
                          </span>
                        ) : (
                          <span className='text-sm text-gray-500 dark:text-gray-400'>
                            未分配
                          </span>
                        )}
                      </td>
                      <td className={projectStyles.table.td}>
                        {issue.dueDate ? formatDate(issue.dueDate) : '-'}
                      </td>
                      <td className={projectStyles.table.td}>
                        <div className='flex items-center space-x-2'>
                          <button
                            onClick={() => onEdit(issue)}
                            className={projectStyles.button.edit}
                            title='編輯'
                          >
                            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(issue.id)}
                            className='p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200'
                            title='刪除'
                          >
                            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
