/**
 * 預算追蹤器組件
 * 
 * 顯示專案預算的概覽、統計資訊和趨勢分析
 */

import React from 'react';
import { formatDateDisplay } from '@/app/test-projects/types';
import type { BudgetStats, ProjectBudget } from '@/app/test-projects/types';

interface BudgetTrackerProps {
  budget: ProjectBudget | null;
  stats: BudgetStats | null;
  onRefresh: () => void;
  loading?: boolean;
}

export const BudgetTracker: React.FC<BudgetTrackerProps> = ({
  budget,
  stats,
  onRefresh,
  loading = false,
}) => {
  if (!budget || !stats) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <p>尚未設定預算</p>
        </div>
      </div>
    );
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    if (percentage >= 50) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'approved': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'closed': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* 標題和操作 */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            預算概覽
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {budget.name} - {budget.currency}
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          重新整理
        </button>
      </div>

      {/* 預算狀態 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">預算狀態</span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(budget.status)}`}>
            {budget.status === 'active' && '執行中'}
            {budget.status === 'draft' && '草稿'}
            {budget.status === 'approved' && '已核准'}
            {budget.status === 'closed' && '已結案'}
          </span>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p>期間: {formatDateDisplay(budget.startDate)} - {formatDateDisplay(budget.endDate)}</p>
          {budget.approvedBy && (
            <p>核准人: {budget.approvedBy}</p>
          )}
        </div>
      </div>

      {/* 預算統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* 總預算 */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">總預算</p>
              <p className="text-2xl font-semibold text-blue-900 dark:text-blue-100">
                NT$ {stats.totalBudget.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* 已分配 */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">已分配</p>
              <p className="text-2xl font-semibold text-yellow-900 dark:text-yellow-100">
                NT$ {stats.totalAllocated.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* 已支出 */}
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">已支出</p>
              <p className="text-2xl font-semibold text-red-900 dark:text-red-100">
                NT$ {stats.totalSpent.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* 剩餘預算 */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600 dark:text-green-400">剩餘預算</p>
              <p className="text-2xl font-semibold text-green-900 dark:text-green-100">
                NT$ {stats.remainingBudget.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 進度條 */}
      <div className="space-y-4">
        {/* 預算使用率 */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">預算使用率</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {stats.budgetUtilization.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getProgressColor(stats.budgetUtilization)}`}
              style={{ width: `${Math.min(stats.budgetUtilization, 100)}%` }}
            />
          </div>
        </div>

        {/* 預算分配率 */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">預算分配率</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {stats.allocationRate.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getProgressColor(stats.allocationRate)}`}
              style={{ width: `${Math.min(stats.allocationRate, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 分類統計 */}
      {Object.keys(stats.categoryStats).length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">分類統計</h4>
          <div className="space-y-2">
            {Object.entries(stats.categoryStats).map(([category, data]) => (
              <div key={category} className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400 capitalize">
                  {category === 'labor' && '人工費用'}
                  {category === 'material' && '材料費用'}
                  {category === 'equipment' && '設備費用'}
                  {category === 'subcontract' && '分包費用'}
                  {category === 'overhead' && '間接費用'}
                  {category === 'contingency' && '預備費用'}
                  {category === 'other' && '其他費用'}
                </span>
                <div className="flex space-x-4">
                  <span className="text-gray-900 dark:text-gray-100">
                    分配: NT$ {data.allocated.toLocaleString()}
                  </span>
                  <span className="text-gray-900 dark:text-gray-100">
                    支出: NT$ {data.spent.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
