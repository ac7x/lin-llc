/**
 * 費用表單組件
 * 
 * 提供專案費用的新增和編輯功能，包括：
 * - 費用類型選擇
 * - 金額輸入
 * - 日期選擇
 * - 描述輸入
 * - 附件上傳
 */

'use client';

import type { Timestamp } from 'firebase/firestore';
import { useState } from 'react';

import { projectStyles } from '@/app/modules/test-projects/styles';
import type { Expense } from '@/app/modules/test-projects/types';

interface ExpenseFormProps {
  expense?: Expense;
  projectId: string;
  onSubmit: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const EXPENSE_CATEGORIES = [
  '材料費',
  '人工費',
  '設備費',
  '運輸費',
  '管理費',
  '其他',
] as const;

const PAYMENT_METHODS = [
  '現金',
  '銀行轉帳',
  '信用卡',
  '支票',
  '其他',
] as const;

// 輔助函數：將 DateField 轉換為日期字串
const formatDateField = (dateField: Timestamp | Date | string | null | undefined): string => {
  if (!dateField) return new Date().toISOString().split('T')[0];
  
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
  
  return new Date().toISOString().split('T')[0];
};

export default function ExpenseForm({
  expense,
  projectId: _projectId,
  onSubmit,
  onCancel,
  isLoading = false,
}: ExpenseFormProps) {
  const [formData, setFormData] = useState({
    description: expense?.description || '',
    amount: expense?.amount || 0,
    category: expense?.category || '其他',
    date: formatDateField(expense?.date),
    paymentMethod: '現金',
    receiptNumber: '',
    vendor: '',
    isReimbursable: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim()) {
      newErrors.description = '費用描述為必填項目';
    }

    if (formData.amount <= 0) {
      newErrors.amount = '金額必須大於 0';
    }

    if (!formData.category) {
      newErrors.category = '請選擇費用類別';
    }

    if (!formData.date) {
      newErrors.date = '請選擇費用日期';
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
        description: formData.description.trim(),
        amount: formData.amount,
        category: formData.category,
        date: new Date(formData.date),
        createdBy: '', // 將由服務層設定
        updatedBy: '', // 將由服務層設定
      });
    } catch (error) {
      // 錯誤處理已由上層組件處理
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
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
          {expense ? '編輯費用' : '新增費用'}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className='p-6 space-y-6'>
        {/* 基本資訊 */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/* 費用描述 */}
          <div>
            <label htmlFor='description' className={projectStyles.form.label}>
              費用描述 *
            </label>
            <input
              id='description'
              type='text'
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`${projectStyles.form.input} ${errors.description ? 'border-red-500 focus:ring-red-500' : ''}`}
              placeholder='輸入費用描述'
              disabled={isLoading}
            />
            {errors.description && (
              <p className='text-sm text-red-600 dark:text-red-400 mt-1'>{errors.description}</p>
            )}
          </div>

          {/* 金額 */}
          <div>
            <label htmlFor='amount' className={projectStyles.form.label}>
              金額 (NT$) *
            </label>
            <input
              id='amount'
              type='number'
              min='0'
              step='0.01'
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
              className={`${projectStyles.form.input} ${errors.amount ? 'border-red-500 focus:ring-red-500' : ''}`}
              placeholder='0.00'
              disabled={isLoading}
            />
            {errors.amount && (
              <p className='text-sm text-red-600 dark:text-red-400 mt-1'>{errors.amount}</p>
            )}
          </div>

          {/* 費用類別 */}
          <div>
            <label htmlFor='category' className={projectStyles.form.label}>
              費用類別 *
            </label>
            <select
              id='category'
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className={`${projectStyles.form.select} ${errors.category ? 'border-red-500 focus:ring-red-500' : ''}`}
              disabled={isLoading}
            >
              {EXPENSE_CATEGORIES.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className='text-sm text-red-600 dark:text-red-400 mt-1'>{errors.category}</p>
            )}
          </div>

          {/* 費用日期 */}
          <div>
            <label htmlFor='date' className={projectStyles.form.label}>
              費用日期 *
            </label>
            <input
              id='date'
              type='date'
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className={`${projectStyles.form.input} ${errors.date ? 'border-red-500 focus:ring-red-500' : ''}`}
              disabled={isLoading}
            />
            {errors.date && (
              <p className='text-sm text-red-600 dark:text-red-400 mt-1'>{errors.date}</p>
            )}
          </div>

          {/* 付款方式 */}
          <div>
            <label htmlFor='paymentMethod' className={projectStyles.form.label}>
              付款方式
            </label>
            <select
              id='paymentMethod'
              value={formData.paymentMethod}
              onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
              className={projectStyles.form.select}
              disabled={isLoading}
            >
              {PAYMENT_METHODS.map(method => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>

          {/* 供應商 */}
          <div>
            <label htmlFor='vendor' className={projectStyles.form.label}>
              供應商
            </label>
            <input
              id='vendor'
              type='text'
              value={formData.vendor}
              onChange={(e) => handleInputChange('vendor', e.target.value)}
              className={projectStyles.form.input}
              placeholder='輸入供應商名稱'
              disabled={isLoading}
            />
          </div>

          {/* 收據號碼 */}
          <div>
            <label htmlFor='receiptNumber' className={projectStyles.form.label}>
              收據號碼
            </label>
            <input
              id='receiptNumber'
              type='text'
              value={formData.receiptNumber}
              onChange={(e) => handleInputChange('receiptNumber', e.target.value)}
              className={projectStyles.form.input}
              placeholder='輸入收據號碼'
              disabled={isLoading}
            />
          </div>
        </div>

        {/* 可報銷選項 */}
        <div className='flex items-center'>
          <input
            id='isReimbursable'
            type='checkbox'
            checked={formData.isReimbursable}
            onChange={(e) => handleInputChange('isReimbursable', e.target.checked)}
            className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
            disabled={isLoading}
          />
          <label htmlFor='isReimbursable' className='ml-2 block text-sm text-gray-900 dark:text-gray-100'>
            此費用可報銷
          </label>
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
            {isLoading ? '處理中...' : (expense ? '更新費用' : '新增費用')}
          </button>
        </div>
      </form>
    </div>
  );
}
