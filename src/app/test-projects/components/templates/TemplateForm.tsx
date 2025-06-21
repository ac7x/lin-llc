/**
 * 模板表單組件
 * 
 * 用於創建和編輯專案模板，包括：
 * - 模板基本資訊
 * - 子工作包配置
 * - 分類設定
 */

'use client';

import { useState, useEffect } from 'react';

import { projectStyles } from '@/modules/test-projects/styles';
import type { Template } from '@/modules/test-projects/types/project';

interface TemplateFormProps {
  template?: Template | null;
  onSubmit: (templateData: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface SubWorkpackageItem {
  id: string;
  name: string;
  description: string;
  estimatedQuantity: number;
  unit: string;
}

export default function TemplateForm({
  template,
  onSubmit,
  onCancel,
  isLoading = false,
}: TemplateFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
  });

  const [subWorkpackages, setSubWorkpackages] = useState<SubWorkpackageItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 初始化表單資料
  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description,
        category: template.category,
      });
      setSubWorkpackages(
        template.subWorkpackages?.map((item, index) => ({
          id: `temp-${index}`,
          name: item.name,
          description: item.description || '',
          estimatedQuantity: item.estimatedQuantity || 0,
          unit: item.unit || '個',
        })) || []
      );
    }
  }, [template]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '模板名稱為必填項目';
    }

    if (!formData.category.trim()) {
      newErrors.category = '請選擇模板分類';
    }

    if (subWorkpackages.length === 0) {
      newErrors.subWorkpackages = '至少需要一個子工作包項目';
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
      const templateData: Omit<Template, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        subWorkpackages: subWorkpackages.map(item => ({
          id: `temp-${Date.now()}-${Math.random()}`,
          name: item.name,
          description: item.description,
          estimatedQuantity: item.estimatedQuantity,
          unit: item.unit,
          createdBy: 'current-user',
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
        createdBy: 'current-user', // 應該從認證上下文獲取
      };

      await onSubmit(templateData);
    } catch (error) {
      // 錯誤處理已由上層組件處理
    } finally {
      setIsSubmitting(false);
    }
  };

  const addSubWorkpackage = () => {
    const newItem: SubWorkpackageItem = {
      id: `temp-${Date.now()}`,
      name: '',
      description: '',
      estimatedQuantity: 0,
      unit: '個',
    };
    setSubWorkpackages([...subWorkpackages, newItem]);
  };

  const removeSubWorkpackage = (id: string) => {
    setSubWorkpackages(subWorkpackages.filter(item => item.id !== id));
  };

  const updateSubWorkpackage = (id: string, field: keyof SubWorkpackageItem, value: string | number) => {
    setSubWorkpackages(subWorkpackages.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const categories = [
    '道路工程',
    '橋樑工程',
    '建築工程',
    '機電工程',
    '土木工程',
    '其他',
  ];

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto'>
        <div className='p-6'>
          <div className='flex justify-between items-center mb-6'>
            <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100'>
              {template ? '編輯模板' : '新增模板'}
            </h2>
            <button
              onClick={onCancel}
              className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            >
              <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* 基本資訊 */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <label htmlFor='name' className={projectStyles.form.label}>
                  模板名稱 *
                </label>
                <input
                  id='name'
                  type='text'
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`${projectStyles.form.input} ${errors.name ? 'border-red-500' : ''}`}
                  placeholder='輸入模板名稱'
                />
                {errors.name && (
                  <p className='text-red-500 text-sm mt-1'>{errors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor='category' className={projectStyles.form.label}>
                  分類 *
                </label>
                <select
                  id='category'
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={`${projectStyles.form.select} ${errors.category ? 'border-red-500' : ''}`}
                >
                  <option value=''>選擇分類</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className='text-red-500 text-sm mt-1'>{errors.category}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor='description' className={projectStyles.form.label}>
                描述
              </label>
              <textarea
                id='description'
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={projectStyles.form.textarea}
                placeholder='輸入模板描述'
                rows={3}
              />
            </div>

            {/* 子工作包列表 */}
            <div>
              <div className='flex justify-between items-center mb-4'>
                <label className={projectStyles.form.label}>
                  子工作包項目 *
                </label>
                <button
                  type='button'
                  onClick={addSubWorkpackage}
                  className='px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800'
                >
                  新增項目
                </button>
              </div>

              {errors.subWorkpackages && (
                <p className='text-red-500 text-sm mb-2'>{errors.subWorkpackages}</p>
              )}

              <div className='space-y-4'>
                {subWorkpackages.map((item, index) => (
                  <div
                    key={item.id}
                    className='border border-gray-200 dark:border-gray-700 rounded-lg p-4'
                  >
                    <div className='flex justify-between items-start mb-3'>
                      <h4 className='font-medium text-gray-900 dark:text-gray-100'>
                        項目 {index + 1}
                      </h4>
                      <button
                        type='button'
                        onClick={() => removeSubWorkpackage(item.id)}
                        className='text-red-500 hover:text-red-700'
                      >
                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                        </svg>
                      </button>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div>
                        <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                          名稱
                        </label>
                        <input
                          type='text'
                          value={item.name}
                          onChange={(e) => updateSubWorkpackage(item.id, 'name', e.target.value)}
                          className={projectStyles.form.input}
                          placeholder='輸入項目名稱'
                        />
                      </div>

                      <div>
                        <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                          單位
                        </label>
                        <input
                          type='text'
                          value={item.unit}
                          onChange={(e) => updateSubWorkpackage(item.id, 'unit', e.target.value)}
                          className={projectStyles.form.input}
                          placeholder='個、公尺、公斤等'
                        />
                      </div>

                      <div>
                        <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                          預估數量
                        </label>
                        <input
                          type='number'
                          value={item.estimatedQuantity}
                          onChange={(e) => updateSubWorkpackage(item.id, 'estimatedQuantity', parseFloat(e.target.value) || 0)}
                          className={projectStyles.form.input}
                          placeholder='0'
                        />
                      </div>

                      <div className='md:col-span-2'>
                        <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                          描述
                        </label>
                        <textarea
                          value={item.description}
                          onChange={(e) => updateSubWorkpackage(item.id, 'description', e.target.value)}
                          className={projectStyles.form.textarea}
                          placeholder='輸入項目描述'
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {subWorkpackages.length === 0 && (
                <div className='text-center py-8 text-gray-500 dark:text-gray-400'>
                  尚未添加任何子工作包項目
                </div>
              )}
            </div>

            {/* 按鈕 */}
            <div className='flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700'>
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
                {isLoading ? '儲存中...' : (template ? '更新模板' : '建立模板')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 