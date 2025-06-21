/**
 * 專案設定表單組件
 * 
 * 用於設定從合約生成的專案資訊，包括：
 * - 專案基本資訊
 * - 人員配置
 * - 地點資訊
 */

'use client';

import { useState, useEffect } from 'react';

import { projectStyles } from '@/modules/test-projects/styles';

interface ProjectSetupFormProps {
  initialData?: {
    projectName: string;
    description: string;
    estimatedBudget: number;
    estimatedDuration: number;
    manager: string;
    inspector: string;
    safety: string;
    supervisor: string;
    safetyOfficer: string;
    costController: string;
    area: string;
    address: string;
    region: string;
  };
  onSubmit: (data: Record<string, string | number>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ProjectSetupForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: ProjectSetupFormProps) {
  const [formData, setFormData] = useState({
    projectName: '',
    description: '',
    estimatedBudget: 0,
    estimatedDuration: 0,
    manager: '',
    inspector: '',
    safety: '',
    supervisor: '',
    safetyOfficer: '',
    costController: '',
    area: '',
    address: '',
    region: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 初始化表單資料
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.projectName.trim()) {
      newErrors.projectName = '專案名稱為必填項目';
    }

    if (formData.estimatedBudget <= 0) {
      newErrors.estimatedBudget = '預算必須大於 0';
    }

    if (formData.estimatedDuration <= 0) {
      newErrors.estimatedDuration = '工期必須大於 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 清除該欄位的錯誤
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* 專案名稱 */}
        <div>
          <label htmlFor='projectName' className={projectStyles.form.label}>
            專案名稱 *
          </label>
          <input
            id='projectName'
            type='text'
            value={formData.projectName}
            onChange={(e) => handleInputChange('projectName', e.target.value)}
            className={`${projectStyles.form.input} ${errors.projectName ? 'border-red-500' : ''}`}
            placeholder='輸入專案名稱'
          />
          {errors.projectName && (
            <p className='text-red-500 text-sm mt-1'>{errors.projectName}</p>
          )}
        </div>

        {/* 描述 */}
        <div>
          <label htmlFor='description' className={projectStyles.form.label}>
            專案描述
          </label>
          <textarea
            id='description'
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className={projectStyles.form.textarea}
            placeholder='輸入專案描述'
            rows={3}
          />
        </div>

        {/* 預算 */}
        <div>
          <label htmlFor='estimatedBudget' className={projectStyles.form.label}>
            預算 (NT$) *
          </label>
          <input
            id='estimatedBudget'
            type='number'
            value={formData.estimatedBudget}
            onChange={(e) => handleInputChange('estimatedBudget', parseFloat(e.target.value) || 0)}
            className={`${projectStyles.form.input} ${errors.estimatedBudget ? 'border-red-500' : ''}`}
            placeholder='0'
          />
          {errors.estimatedBudget && (
            <p className='text-red-500 text-sm mt-1'>{errors.estimatedBudget}</p>
          )}
        </div>

        {/* 工期 */}
        <div>
          <label htmlFor='estimatedDuration' className={projectStyles.form.label}>
            工期 (天) *
          </label>
          <input
            id='estimatedDuration'
            type='number'
            value={formData.estimatedDuration}
            onChange={(e) => handleInputChange('estimatedDuration', parseInt(e.target.value) || 0)}
            className={`${projectStyles.form.input} ${errors.estimatedDuration ? 'border-red-500' : ''}`}
            placeholder='0'
          />
          {errors.estimatedDuration && (
            <p className='text-red-500 text-sm mt-1'>{errors.estimatedDuration}</p>
          )}
        </div>

        {/* 專案經理 */}
        <div>
          <label htmlFor='manager' className={projectStyles.form.label}>
            專案經理
          </label>
          <input
            id='manager'
            type='text'
            value={formData.manager}
            onChange={(e) => handleInputChange('manager', e.target.value)}
            className={projectStyles.form.input}
            placeholder='輸入專案經理姓名'
          />
        </div>

        {/* 監工 */}
        <div>
          <label htmlFor='inspector' className={projectStyles.form.label}>
            監工
          </label>
          <input
            id='inspector'
            type='text'
            value={formData.inspector}
            onChange={(e) => handleInputChange('inspector', e.target.value)}
            className={projectStyles.form.input}
            placeholder='輸入監工姓名'
          />
        </div>

        {/* 安全主管 */}
        <div>
          <label htmlFor='safety' className={projectStyles.form.label}>
            安全主管
          </label>
          <input
            id='safety'
            type='text'
            value={formData.safety}
            onChange={(e) => handleInputChange('safety', e.target.value)}
            className={projectStyles.form.input}
            placeholder='輸入安全主管姓名'
          />
        </div>

        {/* 工地主任 */}
        <div>
          <label htmlFor='supervisor' className={projectStyles.form.label}>
            工地主任
          </label>
          <input
            id='supervisor'
            type='text'
            value={formData.supervisor}
            onChange={(e) => handleInputChange('supervisor', e.target.value)}
            className={projectStyles.form.input}
            placeholder='輸入工地主任姓名'
          />
        </div>

        {/* 安全員 */}
        <div>
          <label htmlFor='safetyOfficer' className={projectStyles.form.label}>
            安全員
          </label>
          <input
            id='safetyOfficer'
            type='text'
            value={formData.safetyOfficer}
            onChange={(e) => handleInputChange('safetyOfficer', e.target.value)}
            className={projectStyles.form.input}
            placeholder='輸入安全員姓名'
          />
        </div>

        {/* 成本控制員 */}
        <div>
          <label htmlFor='costController' className={projectStyles.form.label}>
            成本控制員
          </label>
          <input
            id='costController'
            type='text'
            value={formData.costController}
            onChange={(e) => handleInputChange('costController', e.target.value)}
            className={projectStyles.form.input}
            placeholder='輸入成本控制員姓名'
          />
        </div>

        {/* 地區 */}
        <div>
          <label htmlFor='area' className={projectStyles.form.label}>
            地區
          </label>
          <input
            id='area'
            type='text'
            value={formData.area}
            onChange={(e) => handleInputChange('area', e.target.value)}
            className={projectStyles.form.input}
            placeholder='輸入地區'
          />
        </div>

        {/* 地址 */}
        <div>
          <label htmlFor='address' className={projectStyles.form.label}>
            地址
          </label>
          <input
            id='address'
            type='text'
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            className={projectStyles.form.input}
            placeholder='輸入地址'
          />
        </div>

        {/* 區域 */}
        <div>
          <label htmlFor='region' className={projectStyles.form.label}>
            區域
          </label>
          <input
            id='region'
            type='text'
            value={formData.region}
            onChange={(e) => handleInputChange('region', e.target.value)}
            className={projectStyles.form.input}
            placeholder='輸入區域'
          />
        </div>
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
          {isLoading ? '生成中...' : '生成專案'}
        </button>
      </div>
    </form>
  );
} 