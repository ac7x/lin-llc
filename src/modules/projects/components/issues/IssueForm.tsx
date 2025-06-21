/**
 * 問題表單組件
 * 
 * 提供專案問題的新增和編輯功能，包括：
 * - 問題類型選擇
 * - 嚴重程度設定
 * - 描述輸入
 * - 負責人分配
 * - 截止日期設定
 */

'use client';

import { useState } from 'react';
import type { Timestamp } from 'firebase/firestore';

import type { IssueRecord } from '@/modules/projects/types/project';
import { projectStyles } from '@/modules/projects/styles';

interface IssueFormProps {
  issue?: IssueRecord;
  projectId: string;
  onSubmit: (issue: Omit<IssueRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  availableUsers?: Array<{ uid: string; displayName: string; email: string }>;
}

const ISSUE_TYPES = [
  { value: 'quality', label: '品質問題' },
  { value: 'safety', label: '安全問題' },
  { value: 'progress', label: '進度問題' },
  { value: 'other', label: '其他問題' },
] as const;

const SEVERITY_LEVELS = [
  { value: 'low', label: '低', color: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-400' },
  { value: 'medium', label: '中', color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-400' },
  { value: 'high', label: '高', color: 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-400' },
] as const;

// 輔助函數：將 DateField 轉換為日期字串
const formatDateField = (dateField: Timestamp | Date | string | null | undefined): string => {
  if (!dateField) return '';
  
  if (typeof dateField === 'string') {
    return dateField.split('T')[0];
  }
  
  if (dateField instanceof Date) {
    return dateField.toISOString().split('T')[0];
  }
  
  // Firebase Timestamp
  if (typeof dateField === 'object' && 'toDate' in dateField) {
    return dateField.toDate().toISOString().split('T')[0];
  }
  
  return '';
};

export default function IssueForm({
  issue,
  projectId,
  onSubmit,
  onCancel,
  isLoading = false,
  availableUsers = [],
}: IssueFormProps) {
  const [formData, setFormData] = useState({
    type: issue?.type || 'other',
    description: issue?.description || '',
    severity: issue?.severity || 'medium',
    assignedTo: issue?.assignedTo || '',
    dueDate: formatDateField(issue?.dueDate),
    resolution: issue?.resolution || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim()) {
      newErrors.description = '問題描述為必填項目';
    }

    if (!formData.type) {
      newErrors.type = '請選擇問題類型';
    }

    if (!formData.severity) {
      newErrors.severity = '請選擇嚴重程度';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        type: formData.type,
        description: formData.description.trim(),
        severity: formData.severity,
        status: issue?.status || 'open',
        assignedTo: formData.assignedTo || null,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
        resolution: formData.resolution.trim(),
        resolved: !!formData.resolution.trim(),
      });
    } catch (error) {
      console.error('提交問題表單時發生錯誤:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 清除對應欄位的錯誤
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className={projectStyles.card.base}>
      <div className='px-6 py-4 border-b border-gray-200 dark:border-gray-700'>
        <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100'>
          {issue ? '編輯問題' : '新增問題'}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className='p-6 space-y-6'>
        {/* 基本資訊 */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/* 問題類型 */}
          <div>
            <label htmlFor='type' className={projectStyles.form.label}>
              問題類型 *
            </label>
            <select
              id='type'
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className={`${projectStyles.form.select} ${errors.type ? 'border-red-500 focus:ring-red-500' : ''}`}
              disabled={isLoading}
            >
              {ISSUE_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.type && (
              <p className='text-sm text-red-600 dark:text-red-400 mt-1'>{errors.type}</p>
            )}
          </div>

          {/* 嚴重程度 */}
          <div>
            <label htmlFor='severity' className={projectStyles.form.label}>
              嚴重程度 *
            </label>
            <select
              id='severity'
              value={formData.severity}
              onChange={(e) => handleInputChange('severity', e.target.value)}
              className={`${projectStyles.form.select} ${errors.severity ? 'border-red-500 focus:ring-red-500' : ''}`}
              disabled={isLoading}
            >
              {SEVERITY_LEVELS.map(level => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
            {errors.severity && (
              <p className='text-sm text-red-600 dark:text-red-400 mt-1'>{errors.severity}</p>
            )}
          </div>

          {/* 負責人 */}
          <div>
            <label htmlFor='assignedTo' className={projectStyles.form.label}>
              負責人
            </label>
            <select
              id='assignedTo'
              value={formData.assignedTo}
              onChange={(e) => handleInputChange('assignedTo', e.target.value)}
              className={projectStyles.form.select}
              disabled={isLoading}
            >
              <option value=''>未分配</option>
              {availableUsers.map(user => (
                <option key={user.uid} value={user.uid}>
                  {user.displayName} ({user.email})
                </option>
              ))}
            </select>
          </div>

          {/* 截止日期 */}
          <div>
            <label htmlFor='dueDate' className={projectStyles.form.label}>
              截止日期
            </label>
            <input
              id='dueDate'
              type='date'
              value={formData.dueDate}
              onChange={(e) => handleInputChange('dueDate', e.target.value)}
              className={projectStyles.form.input}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* 問題描述 */}
        <div>
          <label htmlFor='description' className={projectStyles.form.label}>
            問題描述 *
          </label>
          <textarea
            id='description'
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className={`${projectStyles.form.textarea} ${errors.description ? 'border-red-500 focus:ring-red-500' : ''}`}
            placeholder='詳細描述問題的內容、影響範圍和相關資訊'
            rows={4}
            disabled={isLoading}
          />
          {errors.description && (
            <p className='text-sm text-red-600 dark:text-red-400 mt-1'>{errors.description}</p>
          )}
        </div>

        {/* 解決方案 */}
        <div>
          <label htmlFor='resolution' className={projectStyles.form.label}>
            解決方案
          </label>
          <textarea
            id='resolution'
            value={formData.resolution}
            onChange={(e) => handleInputChange('resolution', e.target.value)}
            className={projectStyles.form.textarea}
            placeholder='描述問題的解決方案或處理方式'
            rows={3}
            disabled={isLoading}
          />
        </div>

        {/* 按鈕 */}
        <div className='flex justify-end space-x-3 pt-4'>
          <button
            type='button'
            onClick={onCancel}
            className={projectStyles.button.outline}
            disabled={isLoading}
          >
            取消
          </button>
          <button
            type='submit'
            className={projectStyles.button.primary}
            disabled={isLoading}
          >
            {isLoading ? '處理中...' : (issue ? '更新問題' : '新增問題')}
          </button>
        </div>
      </form>
    </div>
  );
}
