/**
 * 日誌歷史組件
 * 
 * 顯示專案日誌的歷史記錄，包括：
 * - 日誌條目列表
 * - 時間軸顯示
 * - 篩選和搜尋
 * - 分類統計
 */

'use client';

import { useState, useMemo } from 'react';

import { projectStyles } from '@/modules/projects/styles';
import type { BaseWithId } from '@/modules/projects/types/project';

// 日誌條目介面
interface JournalEntry extends BaseWithId {
  title: string;
  content?: string;
  date: string | Date | { toDate: () => Date };
  author?: string;
  category?: string;
  priority?: number;
  tags?: string[];
}

type SortOption = 'date' | 'title' | 'priority' | 'category';
type SortDirection = 'asc' | 'desc';

interface JournalHistoryProps {
  journals: JournalEntry[];
  projectId: string;
  onViewDetails?: (journalEntryId: string) => void;
  onEdit?: (journalEntry: JournalEntry) => void;
  onDelete?: (journalEntryId: string) => void;
}

export default function JournalHistory({
  journals,
  projectId: _projectId,
  onViewDetails,
  onEdit,
  onDelete,
}: JournalHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [sortOrder, setSortOrder] = useState<SortDirection>('desc');

  // 統計資訊
  const stats = useMemo(() => {
    const total = journals.length;
    const categories = journals.reduce((acc, entry) => {
      acc[entry.category || '未分類'] = (acc[entry.category || '未分類'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return { total, categories };
  }, [journals]);

  // 篩選和排序日誌
  const filteredAndSortedJournals = useMemo(() => {
    const filtered = journals.filter(journal => {
      const matchesSearch = journal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (journal.content && journal.content.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = categoryFilter === 'all' || journal.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });

    // 排序
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'date':
          aValue = a.date instanceof Date ? a.date.getTime() : 
                   typeof a.date === 'string' ? new Date(a.date).getTime() :
                   a.date?.toDate?.()?.getTime() || 0;
          bValue = b.date instanceof Date ? b.date.getTime() : 
                   typeof b.date === 'string' ? new Date(b.date).getTime() :
                   b.date?.toDate?.()?.getTime() || 0;
          break;
        case 'title':
          aValue = a.title;
          bValue = b.title;
          break;
        case 'priority':
          aValue = a.priority || 0;
          bValue = b.priority || 0;
          break;
        case 'category':
          aValue = a.category || '';
          bValue = b.category || '';
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
  }, [journals, searchTerm, categoryFilter, sortBy, sortOrder]);

  // 獲取所有分類
  const categories = useMemo(() => {
    const uniqueCategories = new Set(journals.map(entry => entry.category).filter(Boolean));
    return Array.from(uniqueCategories).sort();
  }, [journals]);

  const formatDate = (date: string | Date | { toDate: () => Date }) => {
    if (typeof date === 'string') {
      return new Date(date).toLocaleDateString('zh-TW');
    }
    if (typeof date === 'object' && 'toDate' in date) {
      return date.toDate().toLocaleDateString('zh-TW');
    }
    if (date instanceof Date) {
      return date.toLocaleDateString('zh-TW');
    }
    return '';
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'issue':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'milestone':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'decision':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'meeting':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getCategoryText = (category?: string) => {
    switch (category) {
      case 'progress':
        return '進度更新';
      case 'issue':
        return '問題記錄';
      case 'milestone':
        return '里程碑';
      case 'decision':
        return '決策記錄';
      case 'meeting':
        return '會議記錄';
      default:
        return '一般記錄';
    }
  };

  const getPriorityColor = (priority?: number) => {
    if (!priority) return 'text-gray-400';
    if (priority >= 8) return 'text-red-600 dark:text-red-400';
    if (priority >= 5) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const _handleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(option);
      setSortOrder('asc');
    }
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
            總日誌數
          </div>
        </div>
        {Object.entries(stats.categories).slice(0, 3).map(([category, count]) => (
          <div key={category} className={`${projectStyles.card.stats} ${projectStyles.card.statsColors.green}`}>
            <div className='text-2xl font-bold text-green-600 dark:text-green-400'>
              {count}
            </div>
            <div className='text-sm text-gray-600 dark:text-gray-400'>
              {getCategoryText(category)}
            </div>
          </div>
        ))}
      </div>

      {/* 控制列 */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div className='flex items-center space-x-4'>
          <input
            type='text'
            placeholder='搜尋日誌...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={projectStyles.form.search}
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={projectStyles.form.select}
          >
            <option value='all'>所有分類</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {getCategoryText(category)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 日誌列表 */}
      <div className='space-y-4'>
        {filteredAndSortedJournals.length === 0 ? (
          <div className='text-center py-8 text-gray-500 dark:text-gray-400'>
            {searchTerm || categoryFilter !== 'all' ? '沒有符合條件的日誌' : '尚無日誌記錄'}
          </div>
        ) : (
          filteredAndSortedJournals.map((entry) => (
            <div key={entry.id} className={`${projectStyles.card.base} hover:shadow-md transition-shadow duration-200`}>
              <div className='flex justify-between items-start'>
                <div className='flex-1'>
                  <div className='flex items-center gap-2 mb-1'>
                    <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                      {entry.title}
                    </h3>
                    {entry.priority && (
                      <span className={`text-xs font-medium ${getPriorityColor(entry.priority)}`}>
                        P{entry.priority}
                      </span>
                    )}
                  </div>
                  
                  <div className='flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-2'>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(entry.category)}`}>
                      {getCategoryText(entry.category)}
                    </span>
                    <span>{formatDate(entry.date)}</span>
                    {entry.author && (
                      <span>作者: {entry.author}</span>
                    )}
                  </div>

                  {/* 內容預覽 */}
                  {entry.content && (
                    <p className='text-sm text-gray-600 dark:text-gray-400 line-clamp-2'>
                      {entry.content}
                    </p>
                  )}

                  {/* 標籤 */}
                  {entry.tags && entry.tags.length > 0 && (
                    <div className='flex flex-wrap gap-2 mt-3'>
                      {entry.tags.map((tag: string, index: number) => (
                        <span
                          key={index}
                          className='px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full'
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className='flex items-center space-x-2'>
                  {onViewDetails && (
                    <button
                      onClick={() => onViewDetails(entry.id)}
                      className={projectStyles.button.small}
                      title='查看詳情'
                    >
                      詳情
                    </button>
                  )}
                  {onEdit && (
                    <button
                      onClick={() => onEdit(entry)}
                      className={projectStyles.button.edit}
                      title='編輯'
                    >
                      <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                      </svg>
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(entry.id)}
                      className='p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200'
                      title='刪除'
                    >
                      <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
