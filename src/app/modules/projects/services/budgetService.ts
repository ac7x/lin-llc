/**
 * 專案預算服務
 * 
 * 提供專案預算管理和成本追蹤功能，包括：
 * - 預算設定和調整
 * - 成本記錄和分類
 * - 預算執行分析
 * - 成本警報
 * - 財務報表
 */

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp,
  FieldValue,
  limit
} from 'firebase/firestore';

import { db } from '@/lib/firebase-client';
import type { 
  ProjectBudget, 
  BudgetItem, 
  CostRecord, 
  BudgetCategory,
  BudgetAlert,
  BudgetStats,
  PriorityLevel
} from '@/app/modules/projects/types';

// 預算集合名稱
const BUDGET_COLLECTION = 'projectBudgets';
const BUDGET_ITEMS_COLLECTION = 'budgetItems';
const COST_RECORDS_COLLECTION = 'costRecords';
const BUDGET_ALERTS_COLLECTION = 'budgetAlerts';

/**
 * 創建專案預算
 */
export const createProjectBudget = async (
  projectId: string,
  budgetData: Omit<ProjectBudget, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const budgetRef = collection(db, 'projectBudgets');
    const docRef = await addDoc(budgetRef, {
      ...budgetData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    throw new Error(`創建專案預算失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
};

/**
 * 更新專案預算
 */
export const updateProjectBudget = async (
  budgetId: string,
  updateData: Partial<ProjectBudget>
): Promise<void> => {
  try {
    const budgetRef = doc(db, 'projectBudgets', budgetId);
    await updateDoc(budgetRef, {
      ...updateData,
      updatedAt: new Date(),
    });
  } catch (error) {
    throw new Error(`更新專案預算失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
};

/**
 * 獲取專案預算
 */
export const getProjectBudget = async (projectId: string): Promise<ProjectBudget | null> => {
  try {
    const budgetRef = collection(db, 'projectBudgets');
    const q = query(budgetRef, where('projectId', '==', projectId), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as ProjectBudget;
  } catch (error) {
    throw new Error(`獲取專案預算失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
};

/**
 * 創建預算項目
 */
export const createBudgetItem = async (
  budgetId: string,
  itemData: Omit<BudgetItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, BUDGET_ITEMS_COLLECTION), {
      ...itemData,
      budgetId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error('創建預算項目時發生錯誤:', error);
    throw new Error('創建預算項目失敗');
  }
};

/**
 * 更新預算項目
 */
export const updateBudgetItem = async (
  itemId: string,
  updateData: Partial<BudgetItem>
): Promise<void> => {
  try {
    const docRef = doc(db, BUDGET_ITEMS_COLLECTION, itemId);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('更新預算項目時發生錯誤:', error);
    throw new Error('更新預算項目失敗');
  }
};

/**
 * 刪除預算項目
 */
export const deleteBudgetItem = async (itemId: string): Promise<void> => {
  try {
    const docRef = doc(db, BUDGET_ITEMS_COLLECTION, itemId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('刪除預算項目時發生錯誤:', error);
    throw new Error('刪除預算項目失敗');
  }
};

/**
 * 獲取預算項目列表
 */
export const getBudgetItems = async (budgetId: string): Promise<BudgetItem[]> => {
  try {
    const q = query(
      collection(db, BUDGET_ITEMS_COLLECTION),
      where('budgetId', '==', budgetId)
    );

    const querySnapshot = await getDocs(q);
    const items: BudgetItem[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      items.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      } as BudgetItem);
    });

    // 在記憶體中按創建時間排序
    return items.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : 
                   a.createdAt && typeof a.createdAt === 'object' && 'toDate' in a.createdAt ? 
                   a.createdAt.toDate() : new Date(0);
      const dateB = b.createdAt instanceof Date ? b.createdAt : 
                   b.createdAt && typeof b.createdAt === 'object' && 'toDate' in b.createdAt ? 
                   b.createdAt.toDate() : new Date(0);
      return dateA.getTime() - dateB.getTime(); // 升序排列
    });
  } catch (error) {
    console.error('獲取預算項目時發生錯誤:', error);
    throw new Error('獲取預算項目失敗');
  }
};

/**
 * 記錄成本
 */
export const recordCost = async (
  projectId: string,
  costData: Omit<CostRecord, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, COST_RECORDS_COLLECTION), {
      ...costData,
      projectId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error('記錄成本時發生錯誤:', error);
    throw new Error('記錄成本失敗');
  }
};

/**
 * 更新成本記錄
 */
export const updateCostRecord = async (
  costId: string,
  updateData: Partial<CostRecord>
): Promise<void> => {
  try {
    const docRef = doc(db, COST_RECORDS_COLLECTION, costId);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('更新成本記錄時發生錯誤:', error);
    throw new Error('更新成本記錄失敗');
  }
};

/**
 * 刪除成本記錄
 */
export const deleteCostRecord = async (costId: string): Promise<void> => {
  try {
    const docRef = doc(db, COST_RECORDS_COLLECTION, costId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('刪除成本記錄時發生錯誤:', error);
    throw new Error('刪除成本記錄失敗');
  }
};

/**
 * 獲取成本記錄列表
 */
export const getCostRecords = async (projectId: string): Promise<CostRecord[]> => {
  try {
    const q = query(
      collection(db, COST_RECORDS_COLLECTION),
      where('projectId', '==', projectId)
    );

    const querySnapshot = await getDocs(q);
    const records: CostRecord[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      records.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        date: data.date?.toDate?.() || data.date,
        approvedDate: data.approvedDate?.toDate?.() || data.approvedDate,
      } as CostRecord);
    });

    // 在記憶體中按日期排序
    return records.sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : 
                   a.date && typeof a.date === 'object' && 'toDate' in a.date ? 
                   a.date.toDate() : new Date(0);
      const dateB = b.date instanceof Date ? b.date : 
                   b.date && typeof b.date === 'object' && 'toDate' in b.date ? 
                   b.date.toDate() : new Date(0);
      return dateB.getTime() - dateA.getTime(); // 降序排列
    });
  } catch (error) {
    console.error('獲取成本記錄時發生錯誤:', error);
    throw new Error('獲取成本記錄失敗');
  }
};

/**
 * 創建預算警報
 */
export const createBudgetAlert = async (
  projectId: string,
  alertData: Omit<BudgetAlert, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, BUDGET_ALERTS_COLLECTION), {
      ...alertData,
      projectId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error('創建預算警報時發生錯誤:', error);
    throw new Error('創建預算警報失敗');
  }
};

/**
 * 更新預算警報狀態
 */
export const updateBudgetAlert = async (
  alertId: string,
  updateData: Partial<BudgetAlert>
): Promise<void> => {
  try {
    const docRef = doc(db, BUDGET_ALERTS_COLLECTION, alertId);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('更新預算警報時發生錯誤:', error);
    throw new Error('更新預算警報失敗');
  }
};

/**
 * 獲取預算警報列表
 */
export const getBudgetAlerts = async (projectId: string): Promise<BudgetAlert[]> => {
  try {
    const q = query(
      collection(db, BUDGET_ALERTS_COLLECTION),
      where('projectId', '==', projectId)
    );

    const querySnapshot = await getDocs(q);
    const alerts: BudgetAlert[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      alerts.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        acknowledgedDate: data.acknowledgedDate?.toDate?.() || data.acknowledgedDate,
        resolvedDate: data.resolvedDate?.toDate?.() || data.resolvedDate,
      } as BudgetAlert);
    });

    // 在記憶體中按創建時間排序
    return alerts.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : 
                   a.createdAt && typeof a.createdAt === 'object' && 'toDate' in a.createdAt ? 
                   a.createdAt.toDate() : new Date(0);
      const dateB = b.createdAt instanceof Date ? b.createdAt : 
                   b.createdAt && typeof b.createdAt === 'object' && 'toDate' in b.createdAt ? 
                   b.createdAt.toDate() : new Date(0);
      return dateB.getTime() - dateA.getTime(); // 降序排列
    });
  } catch (error) {
    console.error('獲取預算警報時發生錯誤:', error);
    throw new Error('獲取預算警報失敗');
  }
};

/**
 * 獲取預算統計資訊
 */
export const getBudgetStats = async (projectId: string): Promise<BudgetStats> => {
  try {
    const budget = await getProjectBudget(projectId);
    
    // 如果沒有預算，返回空的統計資訊
    if (!budget) {
      return {
        totalBudget: 0,
        totalAllocated: 0,
        totalSpent: 0,
        totalCommitted: 0,
        remainingBudget: 0,
        availableBudget: 0,
        budgetUtilization: 0,
        allocationRate: 0,
        categoryStats: {} as Record<BudgetCategory, { allocated: number; spent: number; committed: number }>,
        recentCosts: [],
        alerts: [],
      };
    }

    const [budgetItems, costRecords] = await Promise.all([
      getBudgetItems(budget.id),
      getCostRecords(projectId),
    ]);

    const totalBudget = budget.totalBudget || 0;
    const totalAllocated = budgetItems.reduce((sum, item) => sum + item.allocatedAmount, 0);
    const totalSpent = costRecords.reduce((sum, record) => sum + record.amount, 0);
    const totalCommitted = costRecords
      .filter(record => record.status === 'committed')
      .reduce((sum, record) => sum + record.amount, 0);

    const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    const allocationRate = totalBudget > 0 ? (totalAllocated / totalBudget) * 100 : 0;
    const remainingBudget = totalBudget - totalSpent;
    const availableBudget = totalBudget - totalAllocated;

    // 按分類統計
    const categoryStats = budgetItems.reduce((acc, item) => {
      const category = item.category;
      if (!acc[category]) {
        acc[category] = { allocated: 0, spent: 0, committed: 0 };
      }
      acc[category].allocated += item.allocatedAmount;
      return acc;
    }, {} as Record<BudgetCategory, { allocated: number; spent: number; committed: number }>);

    // 計算各分類的實際支出
    costRecords.forEach(record => {
      const category = record.category;
      if (categoryStats[category]) {
        categoryStats[category].spent += record.amount;
        if (record.status === 'committed') {
          categoryStats[category].committed += record.amount;
        }
      }
    });

    // 生成警報
    const alerts: BudgetAlert[] = [];
    if (budgetUtilization > 90) {
      alerts.push({
        id: 'temp-alert-1',
        projectId,
        type: 'over_budget',
        severity: 'high',
        message: `預算使用率已達 ${budgetUtilization.toFixed(1)}%`,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    if (allocationRate > 100) {
      alerts.push({
        id: 'temp-alert-2',
        projectId,
        type: 'over_allocation',
        severity: 'medium',
        message: `預算分配率已達 ${allocationRate.toFixed(1)}%`,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return {
      totalBudget,
      totalAllocated,
      totalSpent,
      totalCommitted,
      remainingBudget,
      availableBudget,
      budgetUtilization,
      allocationRate,
      categoryStats,
      recentCosts: costRecords.slice(0, 10),
      alerts,
    };
  } catch (error) {
    console.error('獲取預算統計時發生錯誤:', error);
    throw new Error('獲取預算統計失敗');
  }
};

/**
 * 檢查並創建預算警報
 */
export const checkAndCreateAlerts = async (projectId: string): Promise<void> => {
  try {
    const stats = await getBudgetStats(projectId);
    const existingAlerts = await getBudgetAlerts(projectId);
    
    // 檢查是否需要創建新的警報
    if (stats.budgetUtilization > 90 && !existingAlerts.some(alert => alert.type === 'over_budget')) {
      await createBudgetAlert(projectId, {
        projectId,
        type: 'over_budget',
        severity: 'high',
        message: `預算使用率已達 ${stats.budgetUtilization.toFixed(1)}%`,
        status: 'active',
      });
    }

    if (stats.allocationRate > 100 && !existingAlerts.some(alert => alert.type === 'over_allocation')) {
      await createBudgetAlert(projectId, {
        projectId,
        type: 'over_allocation',
        severity: 'medium',
        message: `預算分配率已達 ${stats.allocationRate.toFixed(1)}%`,
        status: 'active',
      });
    }
  } catch (error) {
    console.error('檢查預算警報時發生錯誤:', error);
    throw new Error('檢查預算警報失敗');
  }
};
