/**
 * 時程表單組件
 * 
 * 用於新增和編輯時程項目
 */

'use client';

import { useState, useEffect } from 'react';
import { projectStyles } from '@/app/modules/projects/styles';
import type { ScheduleItem } from '../../services/scheduleService';

interface ScheduleFormProps {
  scheduleItem?: ScheduleItem;
  onSubmit: (data: Omit<ScheduleItem, 'id' | 'data'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface FormData {
  title: string;
  start: string;
  end: string;
  progress: number;
  type: 'milestone' | 'workPackage' | 'subWorkPackage';
  description: string;
}

export default function ScheduleForm({
  scheduleItem,
  onSubmit,
  onCancel,
  isLoading = false,
}: ScheduleFormProps) {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    start: '',
    end: '',
    progress: 0,
    type: 'workPackage',
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 初始化表單數據
  useEffect(() => {
    if (scheduleItem) {
      setFormData({
        title: scheduleItem.title,
        start: scheduleItem.start.toISOString().split('T')[0],
        end: scheduleItem.end.toISOString().split('T')[0],
        progress: scheduleItem.progress,
        type: scheduleItem.type,
        description: (scheduleItem.data as any)?.description || '',
      });
    }
  }, [scheduleItem]);

  // 驗證表單
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = '請輸入項目名稱';
    }

    if (!formData.start) {
      newErrors.start = '請選擇開始日期';
    }

    if (!formData.end) {
      newErrors.end = '請選擇結束日期';
    }

    if (formData.start && formData.end && new Date(formData.start) > new Date(formData.end)) {
      newErrors.end = '結束日期不能早於開始日期';
    }

    if (formData.progress < 0 || formData.progress > 100) {
      newErrors.progress = '進度必須在 0-100 之間';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 處理表單提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        title: formData.title.trim(),
        start: new Date(formData.start),
        end: new Date(formData.end),
        progress: formData.progress,
        type: formData.type,
        parentId: scheduleItem?.parentId,
      });
    } catch (error) {
      console.error('提交時程項目失敗:', error);
    }
  };

  // 處理輸入變更
  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // 清除對應的錯誤
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  return (
    <div className="schedule-form-container">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          {scheduleItem ? '編輯時程項目' : '新增時程項目'}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          設定時程項目的基本資訊和時間安排
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 項目名稱 */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            項目名稱 *
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className={`${projectStyles.form.input} ${errors.title ? 'border-red-500' : ''}`}
            placeholder="輸入項目名稱"
            disabled={isLoading}
          />
          {errors.title && (
            <p className="text-sm text-red-600 mt-1">{errors.title}</p>
          )}
        </div>

        {/* 項目類型 */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            項目類型 *
          </label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) => handleInputChange('type', e.target.value as any)}
            className={projectStyles.form.select}
            disabled={isLoading}
          >
            <option value="milestone">里程碑</option>
            <option value="workPackage">工作包</option>
            <option value="subWorkPackage">子工作包</option>
          </select>
        </div>

        {/* 開始日期 */}
        <div>
          <label htmlFor="start" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            開始日期 *
          </label>
          <input
            type="date"
            id="start"
            value={formData.start}
            onChange={(e) => handleInputChange('start', e.target.value)}
            className={`${projectStyles.form.input} ${errors.start ? 'border-red-500' : ''}`}
            disabled={isLoading}
          />
          {errors.start && (
            <p className="text-sm text-red-600 mt-1">{errors.start}</p>
          )}
        </div>

        {/* 結束日期 */}
        <div>
          <label htmlFor="end" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            結束日期 *
          </label>
          <input
            type="date"
            id="end"
            value={formData.end}
            onChange={(e) => handleInputChange('end', e.target.value)}
            className={`${projectStyles.form.input} ${errors.end ? 'border-red-500' : ''}`}
            disabled={isLoading}
          />
          {errors.end && (
            <p className="text-sm text-red-600 mt-1">{errors.end}</p>
          )}
        </div>

        {/* 進度 */}
        <div>
          <label htmlFor="progress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            進度 (%)
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="range"
              id="progress"
              min="0"
              max="100"
              value={formData.progress}
              onChange={(e) => handleInputChange('progress', parseInt(e.target.value))}
              className="flex-1"
              disabled={isLoading}
            />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 min-w-[3rem]">
              {formData.progress}%
            </span>
          </div>
          {errors.progress && (
            <p className="text-sm text-red-600 mt-1">{errors.progress}</p>
          )}
        </div>

        {/* 描述 */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            描述
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className={projectStyles.form.input}
            rows={3}
            placeholder="輸入項目描述（可選）"
            disabled={isLoading}
          />
        </div>

        {/* 按鈕組 */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className={projectStyles.button.outline}
            disabled={isLoading}
          >
            取消
          </button>
          <button
            type="submit"
            className={projectStyles.button.primary}
            disabled={isLoading}
          >
            {isLoading ? '儲存中...' : scheduleItem ? '更新' : '新增'}
          </button>
        </div>
      </form>

      <style jsx>{`
        .schedule-form-container {
          max-width: 500px;
        }
        
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 3px;
          background: #e5e7eb;
          outline: none;
        }
        
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}
