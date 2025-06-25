/**
 * 預算項目介面
 */
export interface BudgetItem {
  id?: string;           // 項目 ID
  projectId: string;     // 專案 ID
  category: string;      // 預算類別
  description: string;   // 項目描述
  budgetAmount: number;  // 預算金額
  actualAmount: number;  // 實際金額
  createdAt: string;     // 建立時間
  createdBy: string;     // 建立者 UID
  updatedAt?: string;    // 更新時間
}

/**
 * 預算統計資訊
 */
export interface BudgetSummary {
  totalBudget: number;   // 總預算
  totalActual: number;   // 總實際支出
  remaining: number;     // 剩餘預算
  variance: number;      // 預算差異
}

/**
 * 預算表單資料
 */
export interface BudgetFormData {
  category: string;      // 類別
  description: string;   // 描述
  budgetAmount: number;  // 預算金額
  actualAmount: number;  // 實際金額
}

/**
 * 專案預算組件屬性
 */
export interface ProjectBudgetProps {
  projectId: string;     // 專案 ID
  disabled?: boolean;    // 是否禁用編輯
} 