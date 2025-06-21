/**
 * 工作包表單組件
 * 
 * 提供新增和編輯工作包的功能，包括：
 * - 工作包基本資訊
 * - 預估時間和預算
 * - 風險等級設定
 * - 負責人分配
 */

'use client';

import { useState, useEffect } from 'react';

import type { Workpackage } from '@/modules/projects/types/project';
import { projectStyles } from '@/modules/projects/styles';

interface WorkpackageFormProps {
  workpackage?: Workpackage;
  projectId: string;
  onSubmit: (data: Partial<Workpackage>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function WorkpackageForm({
  workpackage,
  projectId,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: WorkpackageFormProps) {
  const [formData, setFormData] = useState({
    name: workpackage?.name || '',
    description: workpackage?.description || '',
    status: workpackage?.status || 'draft',
    priority: workpackage?.priority || 'medium',
    riskLevel: workpackage?.riskLevel || 'low',
    assignedTo: workpackage?.assignedTo || '',
    estimatedHours: workpackage?.estimatedHours || 0,
    budget: workpackage?.budget || 0,
    category: workpackage?.category || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (workpackage) {
      setFormData({
        name: workpackage.name || '',
        description: workpackage.description || '',
        status: workpackage.status || 'draft',
        priority: workpackage.priority || 'medium',
        riskLevel: workpackage.riskLevel || 'low',
        assignedTo: workpackage.assignedTo || '',
        estimatedHours: workpackage.estimatedHours || 0,
        budget: workpackage.budget || 0,
        category: workpackage.category || '',
      });
    }
  }, [workpackage]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '工作包名稱為必填項目';
    }

    if (formData.estimatedHours < 0) {
      newErrors.estimatedHours = '預估工時不能為負數';
    }

    if (formData.budget < 0) {
      newErrors.budget = '預算不能為負數';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData: Partial<Workpackage> = {
      ...formData,
      subWorkpackages: workpackage?.subWorkpackages || [],
    };

    onSubmit(submitData);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // 清除對應的錯誤訊息
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  return (
    <div className={projectStyles.card.base}>
      <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6'>
        {workpackage ? '編輯工作包' : '新增工作包'}
      </h2>

      <form onSubmit={handleSubmit} className={projectStyles.form.container}>
        <div className={projectStyles.form.group}>
          {/* 工作包名稱 */}
          <div>
            <label className={projectStyles.form.label}>
              工作包名稱 <span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`${projectStyles.form.input} ${errors.name ? 'border-red-500' : ''}`}
              placeholder='請輸入工作包名稱'
            />
            {errors.name && (
              <p className='text-red-500 text-sm mt-1'>{errors.name}</p>
            )}
          </div>

          {/* 工作包描述 */}
          <div>
            <label className={projectStyles.form.label}>
              描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={projectStyles.form.textarea}
              placeholder='請輸入工作包描述'
              rows={3}
            />
          </div>
        </div>

        <div className={projectStyles.form.group}>
          {/* 狀態 */}
          <div>
            <label className={projectStyles.form.label}>
              狀態
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className={projectStyles.form.select}
            >
              <option value='draft'>草稿</option>
              <option value='planned'>已規劃</option>
              <option value='ready'>準備就緒</option>
              <option value='in-progress'>執行中</option>
              <option value='review'>審查中</option>
              <option value='completed'>已完成</option>
              <option value='on-hold'>暫停中</option>
              <option value='cancelled'>已取消</option>
            </select>
          </div>

          {/* 優先級 */}
          <div>
            <label className={projectStyles.form.label}>
              優先級
            </label>
            <select
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value)}
              className={projectStyles.form.select}
            >
              <option value='low'>低</option>
              <option value='medium'>中</option>
              <option value='high'>高</option>
            </select>
          </div>

          {/* 風險等級 */}
          <div>
            <label className={projectStyles.form.label}>
              風險等級
            </label>
            <select
              value={formData.riskLevel}
              onChange={(e) => handleInputChange('riskLevel', e.target.value)}
              className={projectStyles.form.select}
            >
              <option value='low'>低風險</option>
              <option value='medium'>中風險</option>
              <option value='high'>高風險</option>
            </select>
          </div>
        </div>

        <div className={projectStyles.form.group}>
          {/* 負責人 */}
          <div>
            <label className={projectStyles.form.label}>
              負責人
            </label>
            <input
              type='text'
              value={formData.assignedTo}
              onChange={(e) => handleInputChange('assignedTo', e.target.value)}
              className={projectStyles.form.input}
              placeholder='請輸入負責人'
            />
          </div>

          {/* 類別 */}
          <div>
            <label className={projectStyles.form.label}>
              類別
            </label>
            <input
              type='text'
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className={projectStyles.form.input}
              placeholder='請輸入工作包類別'
            />
          </div>
        </div>

        <div className={projectStyles.form.group}>
          {/* 預估工時 */}
          <div>
            <label className={projectStyles.form.label}>
              預估工時 (小時)
            </label>
            <input
              type='number'
              value={formData.estimatedHours}
              onChange={(e) => handleInputChange('estimatedHours', Number(e.target.value))}
              className={`${projectStyles.form.input} ${errors.estimatedHours ? 'border-red-500' : ''}`}
              placeholder='0'
              min='0'
            />
            {errors.estimatedHours && (
              <p className='text-red-500 text-sm mt-1'>{errors.estimatedHours}</p>
            )}
          </div>

          {/* 預算 */}
          <div>
            <label className={projectStyles.form.label}>
              預算 (元)
            </label>
            <input
              type='number'
              value={formData.budget}
              onChange={(e) => handleInputChange('budget', Number(e.target.value))}
              className={`${projectStyles.form.input} ${errors.budget ? 'border-red-500' : ''}`}
              placeholder='0'
              min='0'
            />
            {errors.budget && (
              <p className='text-red-500 text-sm mt-1'>{errors.budget}</p>
            )}
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
              workpackage ? '更新工作包' : '新增工作包'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
