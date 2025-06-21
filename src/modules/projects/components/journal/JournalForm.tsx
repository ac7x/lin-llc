/**
 * 日誌表單組件
 * 
 * 提供新增和編輯日誌條目的功能，包括：
 * - 日誌標題和內容
 * - 分類和優先級
 * - 標籤管理
 * - 附件上傳
 * - 後續行動
 */

'use client';

import { useState, useEffect } from 'react';

import type { BaseWithId } from '@/modules/projects/types/project';
import { projectStyles } from '@/modules/projects/styles';

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

interface JournalFormProps {
  journalEntry?: JournalEntry;
  projectId: string;
  onSubmit: (data: Partial<JournalEntry>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function JournalForm({
  journalEntry,
  projectId,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: JournalFormProps) {
  const [formData, setFormData] = useState({
    title: journalEntry?.title || '',
    content: journalEntry?.content || '',
    category: journalEntry?.category || 'general',
    priority: journalEntry?.priority || 5,
    tags: journalEntry?.tags || [],
    newTag: '',
    followUpActions: journalEntry?.followUpActions || [],
    newAction: '',
    newActionAssignee: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (journalEntry) {
      setFormData({
        title: journalEntry.title || '',
        content: journalEntry.content || '',
        category: journalEntry.category || 'general',
        priority: journalEntry.priority || 5,
        tags: journalEntry.tags || [],
        newTag: '',
        followUpActions: journalEntry.followUpActions || [],
        newAction: '',
        newActionAssignee: '',
      });
    }
  }, [journalEntry]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = '日誌標題為必填項目';
    }

    if (formData.priority < 1 || formData.priority > 10) {
      newErrors.priority = '優先級必須在 1-10 之間';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData: Partial<JournalEntry> = {
      title: formData.title,
      content: formData.content,
      category: formData.category,
      priority: formData.priority,
      tags: formData.tags,
      followUpActions: formData.followUpActions,
      date: new Date(),
      attachments: journalEntry?.attachments || [],
      relatedWorkpackages: journalEntry?.relatedWorkpackages || [],
    };

    onSubmit(submitData);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const addTag = () => {
    if (formData.newTag.trim() && !formData.tags.includes(formData.newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, formData.newTag.trim()],
        newTag: '',
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const addFollowUpAction = () => {
    if (formData.newAction.trim()) {
      setFormData(prev => ({
        ...prev,
        followUpActions: [
          ...prev.followUpActions,
          {
            description: formData.newAction.trim(),
            completed: false,
            assignedTo: formData.newActionAssignee.trim() || undefined,
          },
        ],
        newAction: '',
        newActionAssignee: '',
      }));
    }
  };

  const removeFollowUpAction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      followUpActions: prev.followUpActions.filter((_, i) => i !== index),
    }));
  };

  const toggleFollowUpAction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      followUpActions: prev.followUpActions.map((action, i) =>
        i === index ? { ...action, completed: !action.completed } : action
      ),
    }));
  };

  return (
    <div className={projectStyles.card.base}>
      <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6'>
        {journalEntry ? '編輯日誌' : '新增日誌'}
      </h2>

      <form onSubmit={handleSubmit} className={projectStyles.form.container}>
        <div className={projectStyles.form.group}>
          {/* 標題 */}
          <div>
            <label className={projectStyles.form.label}>
              標題 <span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`${projectStyles.form.input} ${errors.title ? 'border-red-500' : ''}`}
              placeholder='請輸入日誌標題'
            />
            {errors.title && (
              <p className='text-red-500 text-sm mt-1'>{errors.title}</p>
            )}
          </div>

          {/* 內容 */}
          <div>
            <label className={projectStyles.form.label}>
              內容
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              className={projectStyles.form.textarea}
              placeholder='請輸入日誌內容'
              rows={6}
            />
          </div>
        </div>

        <div className={projectStyles.form.group}>
          {/* 分類 */}
          <div>
            <label className={projectStyles.form.label}>
              分類
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className={projectStyles.form.select}
            >
              <option value='general'>一般記錄</option>
              <option value='progress'>進度更新</option>
              <option value='issue'>問題記錄</option>
              <option value='milestone'>里程碑</option>
              <option value='decision'>決策記錄</option>
              <option value='meeting'>會議記錄</option>
            </select>
          </div>

          {/* 優先級 */}
          <div>
            <label className={projectStyles.form.label}>
              優先級 (1-10)
            </label>
            <input
              type='number'
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', Number(e.target.value))}
              className={`${projectStyles.form.input} ${errors.priority ? 'border-red-500' : ''}`}
              placeholder='5'
              min='1'
              max='10'
            />
            {errors.priority && (
              <p className='text-red-500 text-sm mt-1'>{errors.priority}</p>
            )}
          </div>
        </div>

        {/* 標籤管理 */}
        <div className={projectStyles.form.group}>
          <div>
            <label className={projectStyles.form.label}>
              標籤
            </label>
            <div className='flex gap-2'>
              <input
                type='text'
                value={formData.newTag}
                onChange={(e) => setFormData(prev => ({ ...prev, newTag: e.target.value }))}
                className={projectStyles.form.input}
                placeholder='新增標籤'
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <button
                type='button'
                onClick={addTag}
                className={projectStyles.button.outline}
              >
                新增
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className='flex flex-wrap gap-2 mt-2'>
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className='px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs rounded-full flex items-center gap-1'
                  >
                    {tag}
                    <button
                      type='button'
                      onClick={() => removeTag(tag)}
                      className='text-blue-600 hover:text-blue-800'
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 後續行動 */}
        <div className={projectStyles.form.group}>
          <div>
            <label className={projectStyles.form.label}>
              後續行動
            </label>
            <div className='space-y-2'>
              <div className='flex gap-2'>
                <input
                  type='text'
                  value={formData.newAction}
                  onChange={(e) => setFormData(prev => ({ ...prev, newAction: e.target.value }))}
                  className={projectStyles.form.input}
                  placeholder='新增後續行動'
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFollowUpAction())}
                />
                <input
                  type='text'
                  value={formData.newActionAssignee}
                  onChange={(e) => setFormData(prev => ({ ...prev, newActionAssignee: e.target.value }))}
                  className={projectStyles.form.input}
                  placeholder='負責人'
                />
                <button
                  type='button'
                  onClick={addFollowUpAction}
                  className={projectStyles.button.outline}
                >
                  新增
                </button>
              </div>
              {formData.followUpActions.length > 0 && (
                <div className='space-y-2 mt-2'>
                  {formData.followUpActions.map((action, index) => (
                    <div key={index} className='flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded'>
                      <input
                        type='checkbox'
                        checked={action.completed}
                        onChange={() => toggleFollowUpAction(index)}
                        className='mr-2'
                      />
                      <span className={`flex-1 ${action.completed ? 'line-through text-gray-400' : ''}`}>
                        {action.description}
                      </span>
                      {action.assignedTo && (
                        <span className='text-sm text-gray-500'>→ {action.assignedTo}</span>
                      )}
                      <button
                        type='button'
                        onClick={() => removeFollowUpAction(index)}
                        className='text-red-500 hover:text-red-700'
                      >
                        刪除
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 操作按鈕 */}
        <div className='flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700'>
          <button
            type='button'
            onClick={onCancel}
            disabled={isSubmitting}
            className={`${projectStyles.button.outline} disabled:opacity-50`}
          >
            取消
          </button>
          <button
            type='submit'
            disabled={isSubmitting}
            className={`${projectStyles.button.primary} disabled:opacity-50 flex items-center`}
          >
            {isSubmitting ? (
              <>
                <div className={`${projectStyles.loading.spinnerSmall} mr-2`}></div>
                儲存中...
              </>
            ) : (
              journalEntry ? '更新日誌' : '新增日誌'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
