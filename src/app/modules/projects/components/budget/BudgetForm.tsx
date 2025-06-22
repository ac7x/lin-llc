/**
 * 預算創建表單組件
 * 
 * 提供專案預算的創建和編輯功能
 */

'use client';

import { useState, useEffect, type ReactElement } from 'react';
import { projectStyles } from '@/app/modules/projects/styles';
import type { ProjectBudget, BudgetCategory } from '@/app/modules/projects/types';
import { convertToDate } from '@/app/modules/projects/types';

interface BudgetFormProps {
  projectId: string;
  projectName: string;
  workPackagesTotalBudget?: number;
  budget?: ProjectBudget;
  onSubmit: (budgetData: Omit<ProjectBudget, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const BUDGET_CATEGORIES: Array<{ value: BudgetCategory; label: string }> = [
  { value: 'labor', label: '人工費用' },
  { value: 'material', label: '材料費用' },
  { value: 'equipment', label: '設備費用' },
  { value: 'subcontract', label: '分包費用' },
  { value: 'overhead', label: '間接費用' },
  { value: 'contingency', label: '預備費用' },
  { value: 'other', label: '其他費用' },
];

const BUDGET_STATUS_OPTIONS = [
  { value: 'draft', label: '草稿' },
  { value: 'approved', label: '已核准' },
  { value: 'active', label: '執行中' },
  { value: 'closed', label: '已結案' },
];

export default function BudgetForm({
  projectId,
  projectName,
  workPackagesTotalBudget = 0,
  budget,
  onSubmit,
  onCancel,
  isLoading = false,
}: BudgetFormProps): ReactElement {
  const [formData, setFormData] = useState({
    name: budget?.name || `${projectName} - 專案預算`,
    description: budget?.description || '',
    totalBudget: budget?.totalBudget || workPackagesTotalBudget,
    startDate: budget?.startDate ? convertToDate(budget.startDate)?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    endDate: budget?.endDate ? convertToDate(budget.endDate)?.toISOString().split('T')[0] || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    currency: budget?.currency || 'TWD',
    status: budget?.status || 'active',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 驗證表單
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '預算名稱不能為空';
    }

    if (formData.totalBudget <= 0) {
      newErrors.totalBudget = '總預算必須大於 0';
    }

    if (!formData.startDate) {
      newErrors.startDate = '開始日期不能為空';
    }

    if (!formData.endDate) {
      newErrors.endDate = '結束日期不能為空';
    }

    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = '結束日期必須晚於開始日期';
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
        projectId,
        name: formData.name.trim(),
        description: formData.description.trim(),
        totalBudget: formData.totalBudget,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        currency: formData.currency,
        status: formData.status as any,
        createdBy: 'current_user', // TODO: 使用實際用戶 ID
      });
    } catch (error) {
      console.error('提交預算表單失敗:', error);
    }
  };

  // 處理輸入變更
  const handleInputChange = (field: string, value: string | number) => {
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {budget ? '編輯預算' : '創建預算'}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {budget ? '修改專案預算設定' : '為專案設定預算和財務目標'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本資訊 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              預算名稱 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`${projectStyles.form.input} ${errors.name ? 'border-red-500' : ''}`}
              placeholder="輸入預算名稱"
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              總預算 (NT$) *
            </label>
            <input
              type="number"
              value={formData.totalBudget}
              onChange={(e) => handleInputChange('totalBudget', parseFloat(e.target.value) || 0)}
              className={`${projectStyles.form.input} ${errors.totalBudget ? 'border-red-500' : ''}`}
              placeholder="0"
              min="0"
              step="1000"
            />
            {errors.totalBudget && (
              <p className="text-sm text-red-600 mt-1">{errors.totalBudget}</p>
            )}
            {workPackagesTotalBudget > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                工作包總預算: NT$ {workPackagesTotalBudget.toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* 描述 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            預算描述
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className={projectStyles.form.textarea}
            placeholder="輸入預算描述..."
            rows={3}
          />
        </div>

        {/* 時間範圍 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              開始日期 *
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              className={`${projectStyles.form.input} ${errors.startDate ? 'border-red-500' : ''}`}
            />
            {errors.startDate && (
              <p className="text-sm text-red-600 mt-1">{errors.startDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              結束日期 *
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
              className={`${projectStyles.form.input} ${errors.endDate ? 'border-red-500' : ''}`}
            />
            {errors.endDate && (
              <p className="text-sm text-red-600 mt-1">{errors.endDate}</p>
            )}
          </div>
        </div>

        {/* 其他設定 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              貨幣
            </label>
            <select
              value={formData.currency}
              onChange={(e) => handleInputChange('currency', e.target.value)}
              className={projectStyles.form.select}
            >
              <option value="TWD">新台幣 (TWD)</option>
              <option value="USD">美元 (USD)</option>
              <option value="EUR">歐元 (EUR)</option>
              <option value="JPY">日圓 (JPY)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              預算狀態
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className={projectStyles.form.select}
            >
              {BUDGET_STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 工作包預算提示 */}
        {workPackagesTotalBudget > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">工作包預算資訊</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  專案工作包總預算為 NT$ {workPackagesTotalBudget.toLocaleString()}。
                  {formData.totalBudget !== workPackagesTotalBudget && (
                    <span className="block mt-1">
                      建議將總預算設定為工作包預算總和，以確保預算一致性。
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 操作按鈕 */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
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
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                處理中...
              </span>
            ) : (
              budget ? '更新預算' : '創建預算'
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 