/**
 * 模板選擇器組件
 * 
 * 用於選擇要應用的專案模板，包括：
 * - 模板列表顯示
 * - 模板分類篩選
 * - 選擇狀態管理
 */

'use client';

import { useState } from 'react';
import type { ReactElement } from 'react';

import type { Template } from '@/app/test-projects/types';

interface TemplateSelectorProps {
  templates: Template[];
  selectedTemplateId?: string;
  onSelectTemplate: (templateId: string) => void;
  className?: string;
}

export default function TemplateSelector({
  templates,
  selectedTemplateId,
  onSelectTemplate,
  className,
}: TemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // 獲取所有分類
  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))];

  // 篩選模板
  const filteredTemplates = templates.filter(template => 
    selectedCategory === 'all' || template.category === selectedCategory
  );

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
    <div className={`space-y-4 ${className || ''}`}>
      {/* 分類篩選 */}
      <div className='flex flex-wrap gap-2'>
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1 text-sm rounded-full transition-colors duration-200 ${
              selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {category === 'all' ? '全部' : category}
          </button>
        ))}
      </div>

      {/* 模板列表 */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {filteredTemplates.map(template => (
          <div
            key={template.id}
            className={`p-4 border rounded-lg cursor-pointer transition-colors duration-200 ${
              selectedTemplateId === template.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            onClick={() => onSelectTemplate(template.id)}
          >
            <div className='flex justify-between items-start mb-2'>
              <h4 className='font-medium text-gray-900 dark:text-gray-100'>
                {template.name}
              </h4>
              <span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'>
                {template.category}
              </span>
            </div>
            
            <p className='text-sm text-gray-600 dark:text-gray-400 mb-3'>
              {template.description}
            </p>
            
            <div className='flex items-center justify-between text-xs text-gray-500 dark:text-gray-400'>
              <span>子工作包: {template.subWorkpackages?.length || 0}</span>
              <span>建立於: {formatDate(template.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className='text-center py-8 text-gray-500 dark:text-gray-400'>
          沒有找到符合條件的模板
        </div>
      )}
    </div>
  );
} 