/**
 * 專案預算管理 Hook
 * 
 * 提供專案預算的狀態管理和操作功能
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  createProjectBudget,
  updateProjectBudget,
  getProjectBudget,
  createBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
  getBudgetItems,
  recordCost,
  updateCostRecord,
  deleteCostRecord,
  getCostRecords,
  createBudgetAlert,
  updateBudgetAlert,
  getBudgetAlerts,
  getBudgetStats,
  checkAndCreateAlerts,
} from '@/app/modules/projects/services/budgetService';
import type {
  ProjectBudget,
  BudgetItem,
  CostRecord,
  BudgetAlert,
  BudgetStats,
  BudgetCategory,
  PriorityLevel,
} from '@/app/modules/projects/types';
import { convertToDate } from '@/app/modules/projects/types';
import { logError, safeAsync } from '@/utils/errorUtils';

interface UseProjectBudgetOptions {
  projectId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const useProjectBudget = (options: UseProjectBudgetOptions) => {
  const { projectId, autoRefresh = true, refreshInterval = 30000 } = options;
  const { user } = useAuth();

  // 狀態管理
  const [budget, setBudget] = useState<ProjectBudget | null>(null);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [costRecords, setCostRecords] = useState<CostRecord[]>([]);
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [stats, setStats] = useState<BudgetStats | null>(null);
  
  // 載入狀態
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 載入預算資料
  const loadBudget = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    await safeAsync(async () => {
      const [budgetData, itemsData, costsData, alertsData, statsData] = await Promise.all([
        getProjectBudget(projectId),
        getBudgetItems(projectId),
        getCostRecords(projectId),
        getBudgetAlerts(projectId),
        getBudgetStats(projectId),
      ]);

      setBudget(budgetData);
      setBudgetItems(itemsData);
      setCostRecords(costsData);
      setAlerts(alertsData);
      setStats(statsData);
    }, (error) => {
      setError(error instanceof Error ? error.message : '載入預算資料失敗');
      logError(error, { operation: 'load_budget', projectId });
    });

    setLoading(false);
  }, [projectId]);

  // 創建預算
  const createBudget = useCallback(async (budgetData: Omit<ProjectBudget, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!projectId || !user) return;

    setSubmitting(true);
    try {
      await createProjectBudget(projectId, budgetData);
      await loadBudget();
    } catch (err) {
      logError(err as Error, { operation: 'create_budget', projectId });
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [projectId, user, loadBudget]);

  // 更新預算
  const updateBudget = useCallback(async (updateData: Partial<ProjectBudget>) => {
    if (!budget) return;

    setSubmitting(true);
    try {
      await updateProjectBudget(budget.id, updateData);
      await loadBudget();
    } catch (err) {
      logError(err as Error, { operation: 'update_budget', projectId });
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [budget, projectId, loadBudget]);

  // 創建預算項目
  const createItem = useCallback(async (itemData: Omit<BudgetItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!budget) return;

    setSubmitting(true);
    try {
      await createBudgetItem(budget.id, itemData);
      await loadBudget();
    } catch (err) {
      logError(err as Error, { operation: 'create_budget_item', projectId });
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [budget, projectId, loadBudget]);

  // 更新預算項目
  const updateItem = useCallback(async (itemId: string, updateData: Partial<BudgetItem>) => {
    setSubmitting(true);
    try {
      await updateBudgetItem(itemId, updateData);
      await loadBudget();
    } catch (err) {
      logError(err as Error, { operation: 'update_budget_item', projectId });
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [projectId, loadBudget]);

  // 刪除預算項目
  const deleteItem = useCallback(async (itemId: string) => {
    setSubmitting(true);
    try {
      await deleteBudgetItem(itemId);
      await loadBudget();
    } catch (err) {
      logError(err as Error, { operation: 'delete_budget_item', projectId });
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [projectId, loadBudget]);

  // 記錄成本
  const recordCostItem = useCallback(async (costData: Omit<CostRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!projectId || !user) return;

    setSubmitting(true);
    try {
      await recordCost(projectId, {
        ...costData,
        recordedBy: user.uid,
      });
      await loadBudget();
      await checkAndCreateAlerts(projectId);
    } catch (err) {
      logError(err as Error, { operation: 'record_cost', projectId });
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [projectId, user, loadBudget]);

  // 更新成本記錄
  const updateCostItem = useCallback(async (costId: string, updateData: Partial<CostRecord>) => {
    setSubmitting(true);
    try {
      await updateCostRecord(costId, updateData);
      await loadBudget();
    } catch (err) {
      logError(err as Error, { operation: 'update_cost', projectId });
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [projectId, loadBudget]);

  // 刪除成本記錄
  const deleteCostItem = useCallback(async (costId: string) => {
    setSubmitting(true);
    try {
      await deleteCostRecord(costId);
      await loadBudget();
    } catch (err) {
      logError(err as Error, { operation: 'delete_cost', projectId });
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [projectId, loadBudget]);

  // 創建警報
  const createAlert = useCallback(async (alertData: Omit<BudgetAlert, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!projectId) return;

    setSubmitting(true);
    try {
      await createBudgetAlert(projectId, alertData);
      await loadBudget();
    } catch (err) {
      logError(err as Error, { operation: 'create_alert', projectId });
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [projectId, loadBudget]);

  // 更新警報狀態
  const updateAlert = useCallback(async (alertId: string, updateData: Partial<BudgetAlert>) => {
    setSubmitting(true);
    try {
      await updateBudgetAlert(alertId, updateData);
      await loadBudget();
    } catch (err) {
      logError(err as Error, { operation: 'update_alert', projectId });
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [projectId, loadBudget]);

  // 重新整理資料
  const refresh = useCallback(async () => {
    await loadBudget();
  }, [loadBudget]);

  // 檢查警報
  const checkAlerts = useCallback(async () => {
    if (!projectId) return;

    try {
      await checkAndCreateAlerts(projectId);
      await loadBudget();
    } catch (err) {
      logError(err as Error, { operation: 'check_alerts', projectId });
    }
  }, [projectId, loadBudget]);

  // 計算分類統計
  const getCategoryStats = useCallback(() => {
    if (!stats) return {};

    return stats.categoryStats;
  }, [stats]);

  // 獲取高優先級警報
  const getHighPriorityAlerts = useCallback(() => {
    return alerts.filter(alert => 
      alert.status === 'active' && 
      (alert.severity === 'high' || alert.severity === 'critical')
    );
  }, [alerts]);

  // 獲取成本趨勢
  const getCostTrend = useCallback(() => {
    if (!costRecords.length) return [];

    const sortedRecords = [...costRecords].sort((a, b) => {
      const dateA = convertToDate(a.date);
      const dateB = convertToDate(b.date);
      const timeA = dateA ? dateA.getTime() : 0;
      const timeB = dateB ? dateB.getTime() : 0;
      return timeA - timeB;
    });

    const trend = [];
    let cumulativeCost = 0;

    for (const record of sortedRecords) {
      cumulativeCost += record.amount;
      trend.push({
        date: record.date,
        cost: record.amount,
        cumulativeCost,
      });
    }

    return trend;
  }, [costRecords]);

  // 初始載入
  useEffect(() => {
    loadBudget();
  }, [loadBudget]);

  // 自動重新整理
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadBudget();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadBudget]);

  return {
    // 資料
    budget,
    budgetItems,
    costRecords,
    alerts,
    stats,
    
    // 狀態
    loading,
    submitting,
    error,
    
    // 操作
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
    
    // 計算結果
    getCategoryStats,
    getHighPriorityAlerts,
    getCostTrend,
  };
};
