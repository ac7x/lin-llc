/**
 * 日誌卡片組件
 * 
 * 顯示日誌條目的基本資訊，包括：
 * - 日誌標題和內容
 * - 日期和時間
 * - 作者資訊
 * - 標籤和分類
 * - 附件預覽
 */

'use client';

import { useState } from 'react';

import { projectStyles } from '@/app/test-projects/styles';
import type { BaseWithId } from '@/app/test-projects/types/project';

// 日誌條目介面
interface JournalEntry extends BaseWithId {
  title: string;
  content?: string;
  date: string | Date | { toDate: () => Date };
  author?: string;
  category?: string;
  priority?: number;
  tags?: string[];
  attachments?: Array<{
    name: string;
    url: string;
  }>;
  relatedWorkpackages?: Array<{
    name: string;
    status?: string;
  }>;
  followUpActions?: Array<{
    description: string;
    completed: boolean;
    assignedTo?: string;
  }>;
}

interface JournalCardProps {
  journalEntry: JournalEntry;
  projectId: string;
  onEdit?: (journalEntry: JournalEntry) => void;
  onDelete?: (journalEntryId: string) => void;
  onViewDetails?: (journalEntryId: string) => void;
}

export default function JournalCard({
  journalEntry,
  projectId: _projectId,
  onEdit,
  onDelete,
  onViewDetails,
}: JournalCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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

  const formatTime = (date: string | Date | { toDate: () => Date }) => {
    if (typeof date === 'string') {
      return new Date(date).toLocaleTimeString('zh-TW', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    if (typeof date === 'object' && 'toDate' in date) {
      return date.toDate().toLocaleTimeString('zh-TW', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    if (date instanceof Date) {
      return date.toLocaleTimeString('zh-TW', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
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

  return (
    <div className={`${projectStyles.card.base} hover:shadow-md transition-shadow duration-200`}>
      <div className='flex justify-between items-start mb-4'>
        <div className='flex-1'>
          <div className='flex items-center gap-2 mb-1'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
              {journalEntry.title}
            </h3>
            {journalEntry.priority && (
              <span className={`text-xs font-medium ${getPriorityColor(journalEntry.priority)}`}>
                P{journalEntry.priority}
              </span>
            )}
          </div>
          
          <div className='flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-2'>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(journalEntry.category)}`}>
              {getCategoryText(journalEntry.category)}
            </span>
            <span>{formatDate(journalEntry.date)} {formatTime(journalEntry.date)}</span>
            {journalEntry.author && (
              <span>作者: {journalEntry.author}</span>
            )}
          </div>

          {/* 內容預覽 */}
          {journalEntry.content && (
            <p className='text-sm text-gray-600 dark:text-gray-400 line-clamp-2'>
              {journalEntry.content}
            </p>
          )}
        </div>
        
        <div className='flex items-center space-x-2'>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`${projectStyles.button.small} text-gray-500 hover:text-gray-700`}
            title={isExpanded ? '收起' : '展開'}
          >
            <svg
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
            </svg>
          </button>
        </div>
      </div>

      {/* 展開內容 */}
      {isExpanded && (
        <div className='border-t border-gray-200 dark:border-gray-700 pt-4 mt-4'>
          {/* 完整內容 */}
          {journalEntry.content && (
            <div className='mb-4'>
              <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                詳細內容
              </h4>
              <div className='text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap'>
                {journalEntry.content}
              </div>
            </div>
          )}

          {/* 標籤 */}
          {journalEntry.tags && journalEntry.tags.length > 0 && (
            <div className='mb-4'>
              <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                標籤
              </h4>
              <div className='flex flex-wrap gap-2'>
                {journalEntry.tags.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className='px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full'
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 附件預覽 */}
          {journalEntry.attachments && journalEntry.attachments.length > 0 && (
            <div className='mb-4'>
              <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                附件 ({journalEntry.attachments.length})
              </h4>
              <div className='space-y-2 max-h-32 overflow-y-auto'>
                {journalEntry.attachments.slice(0, 3).map((attachment: { name: string; url: string }, index: number) => (
                  <div key={index} className='flex items-center text-xs'>
                    <svg className='w-4 h-4 text-gray-400 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13' />
                    </svg>
                    <span className='text-gray-600 dark:text-gray-400 truncate'>{attachment.name}</span>
                  </div>
                ))}
                {journalEntry.attachments.length > 3 && (
                  <div className='text-xs text-gray-500 dark:text-gray-400 text-center'>
                    還有 {journalEntry.attachments.length - 3} 個附件
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 相關工作包 */}
          {journalEntry.relatedWorkpackages && journalEntry.relatedWorkpackages.length > 0 && (
            <div className='mb-4'>
              <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                相關工作包
              </h4>
              <div className='space-y-2'>
                {journalEntry.relatedWorkpackages.map((wp: { name: string; status?: string }, index: number) => (
                  <div key={index} className='flex items-center text-xs'>
                    <span className='text-gray-600 dark:text-gray-400'>{wp.name}</span>
                    <span className={`ml-2 px-1 py-0.5 rounded text-xs ${getCategoryColor(wp.status)}`}>
                      {getCategoryText(wp.status)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 後續行動 */}
          {journalEntry.followUpActions && journalEntry.followUpActions.length > 0 && (
            <div className='mb-4'>
              <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                後續行動
              </h4>
              <div className='space-y-2'>
                {journalEntry.followUpActions.map((action: { description: string; completed: boolean; assignedTo?: string }, index: number) => (
                  <div key={index} className='flex items-center text-xs'>
                    <input
                      type='checkbox'
                      checked={action.completed}
                      readOnly
                      className='mr-2'
                    />
                    <span className={`${action.completed ? 'line-through text-gray-400' : 'text-gray-600 dark:text-gray-400'}`}>
                      {action.description}
                    </span>
                    {action.assignedTo && (
                      <span className='ml-2 text-gray-500'>→ {action.assignedTo}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 操作按鈕 */}
      <div className='flex justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700'>
        {onViewDetails && (
          <button
            onClick={() => onViewDetails(journalEntry.id)}
            className={`${projectStyles.button.primary} text-sm`}
          >
            查看詳情
          </button>
        )}
        {onEdit && (
          <button
            onClick={() => onEdit(journalEntry)}
            className={`${projectStyles.button.outline} text-sm`}
          >
            編輯
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(journalEntry.id)}
            className={`${projectStyles.button.danger} text-sm`}
          >
            刪除
          </button>
        )}
      </div>
    </div>
  );
}
