/**
 * 材料表單組件
 * 
 * 提供專案材料的新增和編輯功能，包括：
 * - 材料名稱和描述
 * - 數量和單位
 * - 供應商資訊
 * - 備註說明
 */

'use client';

import { useState } from 'react';

import { projectStyles } from '@/modules/test-projects/styles';
import type { MaterialEntry } from '@/modules/test-projects/types/project';

interface MaterialFormProps {
  material?: MaterialEntry;
  projectId: string;
  onSubmit: (material: Omit<MaterialEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const COMMON_UNITS = [
  '個',
  '件',
  '套',
  '組',
  '公尺',
  '公分',
  '公斤',
  '公噸',
  '公升',
  '平方公尺',
  '立方公尺',
  '包',
  '箱',
  '捲',
  '片',
  '塊',
  '條',
  '根',
  '支',
  '台',
  '輛',
  '其他',
] as const;

export default function MaterialForm({
  material,
  projectId: _projectId,
  onSubmit,
  onCancel,
  isLoading = false,
}: MaterialFormProps) {
  const [formData, setFormData] = useState({
    materialId: material?.materialId || '',
    name: material?.name || '',
    quantity: material?.quantity || 0,
    unit: material?.unit || '個',
    supplier: material?.supplier || '',
    notes: material?.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '材料名稱為必填項目';
    }

    if (formData.quantity <= 0) {
      newErrors.quantity = '數量必須大於 0';
    }

    if (!formData.unit) {
      newErrors.unit = '請選擇單位';
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
        materialId: formData.materialId || formData.name, // 如果沒有 materialId，使用名稱作為 ID
        name: formData.name.trim(),
        quantity: formData.quantity,
        unit: formData.unit,
        supplier: formData.supplier.trim(),
        notes: formData.notes.trim(),
      });
    } catch (error) {
      // 錯誤處理已由上層組件處理
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
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
          {material ? '編輯材料' : '新增材料'}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className='p-6 space-y-6'>
        {/* 基本資訊 */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/* 材料名稱 */}
          <div>
            <label htmlFor='name' className={projectStyles.form.label}>
              材料名稱 *
            </label>
            <input
              id='name'
              type='text'
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`${projectStyles.form.input} ${errors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
              placeholder='輸入材料名稱'
              disabled={isLoading}
            />
            {errors.name && (
              <p className='text-sm text-red-600 dark:text-red-400 mt-1'>{errors.name}</p>
            )}
          </div>

          {/* 材料 ID */}
          <div>
            <label htmlFor='materialId' className={projectStyles.form.label}>
              材料編號
            </label>
            <input
              id='materialId'
              type='text'
              value={formData.materialId}
              onChange={(e) => handleInputChange('materialId', e.target.value)}
              className={projectStyles.form.input}
              placeholder='輸入材料編號（可選）'
              disabled={isLoading}
            />
          </div>

          {/* 數量 */}
          <div>
            <label htmlFor='quantity' className={projectStyles.form.label}>
              數量 *
            </label>
            <input
              id='quantity'
              type='number'
              min='0'
              step='0.01'
              value={formData.quantity}
              onChange={(e) => handleInputChange('quantity', parseFloat(e.target.value) || 0)}
              className={`${projectStyles.form.input} ${errors.quantity ? 'border-red-500 focus:ring-red-500' : ''}`}
              placeholder='0'
              disabled={isLoading}
            />
            {errors.quantity && (
              <p className='text-sm text-red-600 dark:text-red-400 mt-1'>{errors.quantity}</p>
            )}
          </div>

          {/* 單位 */}
          <div>
            <label htmlFor='unit' className={projectStyles.form.label}>
              單位 *
            </label>
            <select
              id='unit'
              value={formData.unit}
              onChange={(e) => handleInputChange('unit', e.target.value)}
              className={`${projectStyles.form.select} ${errors.unit ? 'border-red-500 focus:ring-red-500' : ''}`}
              disabled={isLoading}
            >
              {COMMON_UNITS.map(unit => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
            {errors.unit && (
              <p className='text-sm text-red-600 dark:text-red-400 mt-1'>{errors.unit}</p>
            )}
          </div>

          {/* 供應商 */}
          <div>
            <label htmlFor='supplier' className={projectStyles.form.label}>
              供應商
            </label>
            <input
              id='supplier'
              type='text'
              value={formData.supplier}
              onChange={(e) => handleInputChange('supplier', e.target.value)}
              className={projectStyles.form.input}
              placeholder='輸入供應商名稱'
              disabled={isLoading}
            />
          </div>
        </div>

        {/* 備註 */}
        <div>
          <label htmlFor='notes' className={projectStyles.form.label}>
            備註
          </label>
          <textarea
            id='notes'
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            className={projectStyles.form.textarea}
            placeholder='輸入材料相關備註或說明'
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
            {isLoading ? '處理中...' : (material ? '更新材料' : '新增材料')}
          </button>
        </div>
      </form>
    </div>
  );
}
