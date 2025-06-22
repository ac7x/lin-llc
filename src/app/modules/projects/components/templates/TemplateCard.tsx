/**
 * 模板卡片組件
 * 顯示模板的基本資訊
 */

'use client';

import { useState, type ReactElement } from 'react';
import { projectStyles } from '../../styles';
import type { Template } from '@/app/modules/projects/types';

interface TemplateCardProps {
  template: Template;
  onSelect?: (template: Template) => void;
  onEdit?: (template: Template) => void;
  onDelete?: (templateId: string) => void;
  selected?: boolean;
}

export default function TemplateCard({
  template,
  onSelect,
  onEdit,
  onDelete,
  selected,
}: TemplateCardProps): ReactElement {
  const [isHovered, setIsHovered] = useState(false);

  const formatDate = (date: Date | string | { toDate: () => Date } | null) => {
    if (!date) return '未知';
    
    if (date instanceof Date) {
      return date.toLocaleDateString();
    }
    
    if (typeof date === 'object' && 'toDate' in date) {
      return date.toDate().toLocaleDateString();
    }
    
    return new Date(date).toLocaleDateString();
  };

  return (
    <div
      className={`border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-all duration-200 ${
        isHovered ? 'shadow-lg border-blue-300 dark:border-blue-600' : 'hover:shadow-md'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className='flex justify-between items-start mb-4'>
        <div className='flex-1'>
          <h4 className='font-medium text-gray-900 dark:text-gray-100 mb-2'>
            {template.name}
          </h4>
          <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'>
            {template.category}
          </span>
        </div>
      </div>

      <p className='text-sm text-gray-600 dark:text-gray-400 mb-4'>
        {template.description || '此模板沒有描述'}
      </p>

      <div className='flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4'>
        <span>子工作包: {template.subWorkPackages?.length || 0}</span>
        <span>建立者: {template.createdBy}</span>
      </div>

      <div className='text-xs text-gray-500 dark:text-gray-400 mb-4'>
        建立於: {formatDate(template.createdAt)}
      </div>

      <div className='flex space-x-2'>
        <button
          onClick={() => onSelect?.(template)}
          className='flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200'
        >
          應用
        </button>
        
        <button
          onClick={() => onEdit?.(template)}
          className='px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors duration-200'
        >
          編輯
        </button>
        
        <button
          onClick={() => onDelete?.(template.id)}
          className='px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-colors duration-200'
        >
          刪除
        </button>
      </div>
    </div>
  );
} 