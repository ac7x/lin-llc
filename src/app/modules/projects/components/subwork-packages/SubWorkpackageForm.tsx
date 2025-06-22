/**
 * 子工作包表單組件
 * 
 * 提供新增和編輯子工作包的功能，包括：
 * - 子工作包基本資訊
 * - 數量估算和實際數量
 * - 時間規劃
 * - 預算和風險設定
 */

'use client';

import { useState, useEffect } from 'react';

import { projectStyles } from '@/app/modules/projects/styles';
import type { SubWorkPackage, PriorityLevel } from '@/app/modules/projects/types';

interface SubWorkpackageFormProps {
  subWorkpackage?: SubWorkPackage;
  workpackageId: string;
  onSubmit: (data: Partial<SubWorkPackage>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function SubWorkpackageForm({
  subWorkpackage,
  workpackageId: _workpackageId,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: SubWorkpackageFormProps) {
  const [formData, setFormData] = useState({
    name: subWorkpackage?.name || '',
    description: subWorkpackage?.description || '',
    status: subWorkpackage?.status || 'draft',
    priority: subWorkpackage?.priority || 'medium',
    riskLevel: subWorkpackage?.riskLevel || 'low',
    assignedTo: subWorkpackage?.assignedTo || '',
    unit: subWorkpackage?.unit || '',
    estimatedQuantity: subWorkpackage?.estimatedQuantity || 0,
    actualQuantity: subWorkpackage?.actualQuantity || 0,
    budget: subWorkpackage?.budget || 0,
    estimatedHours: subWorkpackage?.estimatedHours || 0,
    actualHours: subWorkpackage?.actualHours || 0,
    plannedStartDate: subWorkpackage?.plannedStartDate ? 
      (typeof subWorkpackage.plannedStartDate === 'object' && 'toDate' in subWorkpackage.plannedStartDate
        ? (subWorkpackage.plannedStartDate as { toDate: () => Date }).toDate().toISOString().split('T')[0]
        : subWorkpackage.plannedStartDate.toString()
      ) : '',
    plannedEndDate: subWorkpackage?.plannedEndDate ? 
      (typeof subWorkpackage.plannedEndDate === 'object' && 'toDate' in subWorkpackage.plannedEndDate
        ? (subWorkpackage.plannedEndDate as { toDate: () => Date }).toDate().toISOString().split('T')[0]
        : subWorkpackage.plannedEndDate.toString()
      ) : '',
    completionNotes: subWorkpackage?.completionNotes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (subWorkpackage) {
      setFormData({
        name: subWorkpackage.name || '',
        description: subWorkpackage.description || '',
        status: subWorkpackage.status || 'draft',
        priority: subWorkpackage.priority || 'medium',
        riskLevel: subWorkpackage.riskLevel || 'low',
        assignedTo: subWorkpackage.assignedTo || '',
        unit: subWorkpackage.unit || '',
        estimatedQuantity: subWorkpackage.estimatedQuantity || 0,
        actualQuantity: subWorkpackage.actualQuantity || 0,
        budget: subWorkpackage.budget || 0,
        estimatedHours: subWorkpackage.estimatedHours || 0,
        actualHours: subWorkpackage.actualHours || 0,
        plannedStartDate: subWorkpackage.plannedStartDate ? 
          (typeof subWorkpackage.plannedStartDate === 'object' && 'toDate' in subWorkpackage.plannedStartDate
            ? (subWorkpackage.plannedStartDate as { toDate: () => Date }).toDate().toISOString().split('T')[0]
            : subWorkpackage.plannedStartDate.toString()
          ) : '',
        plannedEndDate: subWorkpackage.plannedEndDate ? 
          (typeof subWorkpackage.plannedEndDate === 'object' && 'toDate' in subWorkpackage.plannedEndDate
            ? (subWorkpackage.plannedEndDate as { toDate: () => Date }).toDate().toISOString().split('T')[0]
            : subWorkpackage.plannedEndDate.toString()
          ) : '',
        completionNotes: subWorkpackage.completionNotes || '',
      });
    }
  }, [subWorkpackage]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '子工作包名稱不能為空';
    }

    if (formData.estimatedQuantity < 0) {
      newErrors.estimatedQuantity = '預估數量不能為負數';
    }

    if (formData.actualQuantity < 0) {
      newErrors.actualQuantity = '實際數量不能為負數';
    }

    if (formData.estimatedHours < 0) {
      newErrors.estimatedHours = '預估工時不能為負數';
    }

    if (formData.actualHours < 0) {
      newErrors.actualHours = '實際工時不能為負數';
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

    const submitData: Partial<SubWorkPackage> = {
      ...formData,
      tasks: subWorkpackage?.tasks || [],
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
        {subWorkpackage ? '編輯子工作包' : '新增子工作包'}
      </h2>

      <form onSubmit={handleSubmit} className={projectStyles.form.container}>
        <div className={projectStyles.form.group}>
          {/* 子工作包名稱 */}
          <div>
            <label className={projectStyles.form.label}>
              子工作包名稱 <span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`${projectStyles.form.input} ${errors.name ? 'border-red-500' : ''}`}
              placeholder='請輸入子工作包名稱'
            />
            {errors.name && (
              <p className='text-red-500 text-sm mt-1'>{errors.name}</p>
            )}
          </div>

          {/* 描述 */}
          <div>
            <label className={projectStyles.form.label}>
              描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={projectStyles.form.textarea}
              placeholder='請輸入子工作包描述'
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
              <option value='assigned'>已分配</option>
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
              className={`${projectStyles.form.select} ${errors.priority ? 'border-red-500' : ''}`}
            >
              <option value='low'>低</option>
              <option value='medium'>中</option>
              <option value='high'>高</option>
              <option value='critical'>緊急</option>
            </select>
            {errors.priority && (
              <p className='text-red-500 text-sm mt-1'>{errors.priority}</p>
            )}
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

          {/* 單位 */}
          <div>
            <label className={projectStyles.form.label}>
              單位
            </label>
            <input
              type='text'
              value={formData.unit}
              onChange={(e) => handleInputChange('unit', e.target.value)}
              className={projectStyles.form.input}
              placeholder='如：個、公尺、公斤等'
            />
          </div>
        </div>

        <div className={projectStyles.form.group}>
          {/* 預估數量 */}
          <div>
            <label className={projectStyles.form.label}>
              預估數量
            </label>
            <input
              type='number'
              value={formData.estimatedQuantity}
              onChange={(e) => handleInputChange('estimatedQuantity', Number(e.target.value))}
              className={`${projectStyles.form.input} ${errors.estimatedQuantity ? 'border-red-500' : ''}`}
              placeholder='0'
              min='0'
            />
            {errors.estimatedQuantity && (
              <p className='text-red-500 text-sm mt-1'>{errors.estimatedQuantity}</p>
            )}
          </div>

          {/* 實際數量 */}
          <div>
            <label className={projectStyles.form.label}>
              實際數量
            </label>
            <input
              type='number'
              value={formData.actualQuantity}
              onChange={(e) => handleInputChange('actualQuantity', Number(e.target.value))}
              className={`${projectStyles.form.input} ${errors.actualQuantity ? 'border-red-500' : ''}`}
              placeholder='0'
              min='0'
            />
            {errors.actualQuantity && (
              <p className='text-red-500 text-sm mt-1'>{errors.actualQuantity}</p>
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

          {/* 實際工時 */}
          <div>
            <label className={projectStyles.form.label}>
              實際工時 (小時)
            </label>
            <input
              type='number'
              value={formData.actualHours}
              onChange={(e) => handleInputChange('actualHours', Number(e.target.value))}
              className={`${projectStyles.form.input} ${errors.actualHours ? 'border-red-500' : ''}`}
              placeholder='0'
              min='0'
            />
            {errors.actualHours && (
              <p className='text-red-500 text-sm mt-1'>{errors.actualHours}</p>
            )}
          </div>
        </div>

        <div className={projectStyles.form.group}>
          {/* 計劃開始日期 */}
          <div>
            <label className={projectStyles.form.label}>
              計劃開始日期
            </label>
            <input
              type='date'
              value={formData.plannedStartDate}
              onChange={(e) => handleInputChange('plannedStartDate', e.target.value)}
              className={projectStyles.form.date}
            />
          </div>

          {/* 計劃結束日期 */}
          <div>
            <label className={projectStyles.form.label}>
              計劃結束日期
            </label>
            <input
              type='date'
              value={formData.plannedEndDate}
              onChange={(e) => handleInputChange('plannedEndDate', e.target.value)}
              className={projectStyles.form.date}
            />
          </div>
        </div>

        <div className={projectStyles.form.group}>
          {/* 完工備註 */}
          <div className='col-span-full'>
            <label className={projectStyles.form.label}>
              完工備註
            </label>
            <textarea
              value={formData.completionNotes}
              onChange={(e) => handleInputChange('completionNotes', e.target.value)}
              className={projectStyles.form.textarea}
              placeholder='請輸入完工備註或特殊說明'
              rows={3}
            />
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
              subWorkpackage ? '更新子工作包' : '新增子工作包'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
