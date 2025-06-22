/**
 * 專案預算管理頁面
 * 
 * 提供完整的專案預算管理功能，包括：
 * - 預算概覽和統計
 * - 成本警報管理
 * - 預算項目管理
 * - 成本記錄管理
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { LoadingSpinner, DataLoader, PageContainer, PageHeader } from '@/app/test-projects/components/common';
import { BudgetTracker, CostAlert } from '@/app/test-projects/components/budget';
import { useProjectBudget } from '@/app/test-projects/hooks/useProjectBudget';
import type { Project } from '@/app/test-projects/types';
import { logError, safeAsync, retry } from '@/utils/errorUtils';
import { projectStyles } from '@/app/test-projects/styles';

interface ProjectWithId extends Project {
  id: string;
}

export default function ProjectBudgetPage() {
  const params = useParams();
  const projectId = params.project as string;
  const [project, setProject] = useState<ProjectWithId | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 使用預算管理 Hook
  const {
    budget,
    budgetItems,
    costRecords,
    alerts,
    stats,
    loading: budgetLoading,
    submitting,
    error: budgetError,
    createBudget,
    updateBudget,
    createItem,
    updateItem,
    deleteItem,
    recordCostItem,
    updateCostItem,
    deleteCostItem,
    createAlert,
    updateAlert,
    refresh,
    checkAlerts,
    getCategoryStats,
    getHighPriorityAlerts,
    getCostTrend,
  } = useProjectBudget({
    projectId,
    autoRefresh: true,
    refreshInterval: 30000,
  });

  // 載入專案資料
  const loadProject = async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    await safeAsync(async () => {
      const projectDoc = await retry(() => getDoc(doc(db, 'projects', projectId)), 3, 1000);
      
      if (!projectDoc.exists()) {
        throw new Error('專案不存在');
      }

      const projectData = projectDoc.data() as Project;
      setProject({
        ...projectData,
        id: projectDoc.id,
      });
    }, (error) => {
      setError(error instanceof Error ? error.message : '載入專案失敗');
      logError(error, { operation: 'fetch_project', projectId });
    });

    setLoading(false);
  };

  useEffect(() => {
    loadProject();
  }, [projectId]);

  // 處理警報確認
  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await updateAlert(alertId, {
        status: 'acknowledged',
        acknowledgedBy: 'current_user', // TODO: 使用實際用戶 ID
        acknowledgedDate: new Date(),
      });
    } catch (err) {
      logError(err as Error, { operation: 'acknowledge_alert', projectId });
    }
  };

  // 處理警報解決
  const handleResolveAlert = async (alertId: string) => {
    try {
      await updateAlert(alertId, {
        status: 'resolved',
        resolvedBy: 'current_user', // TODO: 使用實際用戶 ID
        resolvedDate: new Date(),
      });
    } catch (err) {
      logError(err as Error, { operation: 'resolve_alert', projectId });
    }
  };

  // 處理重新整理
  const handleRefresh = async () => {
    await refresh();
    await checkAlerts();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            載入失敗
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {error || '專案不存在'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <PageContainer>
      <PageHeader 
        title={`${project.projectName} - 預算管理`}
        subtitle="管理專案預算、成本追蹤和財務警報"
      >
        <div className="flex space-x-2">
          <button
            onClick={handleRefresh}
            disabled={submitting || budgetLoading}
            className={projectStyles.button.secondary}
          >
            {budgetLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                載入中...
              </span>
            ) : (
              <span className="flex items-center">
                <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                重新整理
              </span>
            )}
          </button>
          {!budget && (
            <button
              onClick={() => {
                // TODO: 實作創建預算功能
                console.log('創建預算');
              }}
              className={projectStyles.button.primary}
            >
              創建預算
            </button>
          )}
        </div>
      </PageHeader>

      {/* 錯誤顯示 */}
      {budgetError && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/50 text-red-800 dark:text-red-200 p-4 rounded-lg">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium">載入預算資料時發生錯誤</h3>
              <p className="text-sm mt-1">{budgetError}</p>
            </div>
          </div>
        </div>
      )}

      {/* 主要內容區域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 預算追蹤器 */}
        <div>
          <BudgetTracker
            budget={budget}
            stats={stats}
            onRefresh={handleRefresh}
            loading={budgetLoading}
          />
        </div>

        {/* 成本警報 */}
        <div>
          <CostAlert
            alerts={alerts}
            stats={stats}
            onAcknowledgeAlert={handleAcknowledgeAlert}
            onResolveAlert={handleResolveAlert}
          />
        </div>
      </div>

      {/* 預算統計資訊 */}
      {stats && (
        <div className="mt-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              預算統計詳情
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 總預算 */}
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  NT$ {stats.totalBudget.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">總預算</div>
              </div>

              {/* 已分配 */}
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  NT$ {stats.totalAllocated.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">已分配</div>
              </div>

              {/* 已支出 */}
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  NT$ {stats.totalSpent.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">已支出</div>
              </div>

              {/* 剩餘預算 */}
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  NT$ {stats.remainingBudget.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">剩餘預算</div>
              </div>
            </div>

            {/* 使用率和分配率 */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">預算使用率</span>
                  <span className={`text-sm font-medium ${
                    stats.budgetUtilization > 90 ? 'text-red-600 dark:text-red-400' :
                    stats.budgetUtilization > 75 ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-green-600 dark:text-green-400'
                  }`}>
                    {stats.budgetUtilization.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      stats.budgetUtilization > 90 ? 'bg-red-500' :
                      stats.budgetUtilization > 75 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(stats.budgetUtilization, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">預算分配率</span>
                  <span className={`text-sm font-medium ${
                    stats.allocationRate > 100 ? 'text-red-600 dark:text-red-400' :
                    stats.allocationRate > 90 ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-green-600 dark:text-green-400'
                  }`}>
                    {stats.allocationRate.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      stats.allocationRate > 100 ? 'bg-red-500' :
                      stats.allocationRate > 90 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(stats.allocationRate, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 功能開發提示 */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex">
          <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">功能開發中</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              預算項目管理、成本記錄管理等功能正在開發中，敬請期待。
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
