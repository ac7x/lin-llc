/**
 * 成本警報組件
 * 
 * 顯示預算警報、成本異常和重要提醒
 */

import React, { type ReactElement } from 'react';
import { formatDateDisplay } from '@/app/modules/projects/types';
import type { BudgetAlert, BudgetStats } from '@/app/modules/projects/types';

interface CostAlertProps {
  alerts: BudgetAlert[];
  stats: BudgetStats | null;
  onAcknowledgeAlert: (alertId: string) => void;
  onResolveAlert: (alertId: string) => void;
}

export const CostAlert = ({
  alerts,
  stats,
  onAcknowledgeAlert,
  onResolveAlert,
}: CostAlertProps): ReactElement => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'high':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'medium':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'low':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getAlertTypeText = (type: string) => {
    switch (type) {
      case 'over_budget': return '超出預算';
      case 'over_allocation': return '超出分配';
      case 'cost_variance': return '成本偏差';
      case 'schedule_variance': return '時程偏差';
      default: return '其他';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '活動中';
      case 'acknowledged': return '已確認';
      case 'resolved': return '已解決';
      default: return '未知';
    }
  };

  const activeAlerts = alerts.filter(alert => alert.status === 'active');
  const acknowledgedAlerts = alerts.filter(alert => alert.status === 'acknowledged');
  const resolvedAlerts = alerts.filter(alert => alert.status === 'resolved');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          成本警報
        </h3>
        <div className="flex space-x-2">
          {activeAlerts.length > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
              {activeAlerts.length} 個活動警報
            </span>
          )}
        </div>
      </div>

      {/* 預算狀態概覽 */}
      {stats && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">預算狀態概覽</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">預算使用率: </span>
              <span className={`font-medium ${stats.budgetUtilization > 90 ? 'text-red-600 dark:text-red-400' : stats.budgetUtilization > 75 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
                {stats.budgetUtilization.toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">預算分配率: </span>
              <span className={`font-medium ${stats.allocationRate > 100 ? 'text-red-600 dark:text-red-400' : stats.allocationRate > 90 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
                {stats.allocationRate.toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">剩餘預算: </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                NT$ {stats.remainingBudget.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">可用預算: </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                NT$ {stats.availableBudget.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 活動警報 */}
      {activeAlerts.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            活動警報 ({activeAlerts.length})
          </h4>
          <div className="space-y-3">
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getSeverityIcon(alert.severity)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium">
                          {getAlertTypeText(alert.type)}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                          {alert.severity === 'critical' && '嚴重'}
                          {alert.severity === 'high' && '高'}
                          {alert.severity === 'medium' && '中'}
                          {alert.severity === 'low' && '低'}
                        </span>
                      </div>
                      <p className="text-sm mb-2">{alert.message}</p>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        建立時間: {formatDateDisplay(alert.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onAcknowledgeAlert(alert.id)}
                      className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      確認
                    </button>
                    <button
                      onClick={() => onResolveAlert(alert.id)}
                      className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      解決
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 已確認警報 */}
      {acknowledgedAlerts.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            已確認警報 ({acknowledgedAlerts.length})
          </h4>
          <div className="space-y-2">
            {acknowledgedAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        {getAlertTypeText(alert.type)}
                      </span>
                      <span className="text-xs text-blue-600 dark:text-blue-400">
                        已確認
                      </span>
                    </div>
                    <p className="text-sm text-blue-800 dark:text-blue-200">{alert.message}</p>
                  </div>
                  <button
                    onClick={() => onResolveAlert(alert.id)}
                    className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    解決
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 已解決警報 */}
      {resolvedAlerts.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            已解決警報 ({resolvedAlerts.length})
          </h4>
          <div className="space-y-2">
            {resolvedAlerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {getAlertTypeText(alert.type)}
                      </span>
                      <span className="text-xs text-green-600 dark:text-green-400">
                        已解決
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{alert.message}</p>
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      解決時間: {alert.resolvedDate ? formatDateDisplay(alert.resolvedDate) : '--'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {resolvedAlerts.length > 5 && (
            <div className="text-center mt-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                還有 {resolvedAlerts.length - 5} 個已解決警報
              </span>
            </div>
          )}
        </div>
      )}

      {/* 無警報狀態 */}
      {alerts.length === 0 && (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>目前沒有任何警報</p>
          <p className="text-sm">預算執行狀況良好</p>
        </div>
      )}
    </div>
  );
};
