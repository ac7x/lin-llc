/**
 * 問題優先級
 */
export type IssuePriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * 問題狀態
 */
export type IssueStatus = 'open' | 'in-progress' | 'resolved' | 'closed';

/**
 * 問題類型
 */
export type IssueType = 'bug' | 'feature' | 'task' | 'improvement';

/**
 * 問題項目介面
 */
export interface Issue {
  id?: string;           // 問題 ID
  projectId: string;     // 專案 ID
  title: string;         // 問題標題
  description: string;   // 問題描述
  type: IssueType;       // 問題類型
  priority: IssuePriority; // 優先級
  status: IssueStatus;   // 狀態
  assignee?: string;     // 指派人員 UID
  reporter: string;      // 回報者 UID
  createdAt: string;     // 建立時間
  updatedAt?: string;    // 更新時間
  resolvedAt?: string;   // 解決時間
}

/**
 * 問題表單資料
 */
export interface IssueFormData {
  title: string;         // 標題
  description: string;   // 描述
  type: IssueType;       // 類型
  priority: IssuePriority; // 優先級
  assignee?: string;     // 指派人員
}

/**
 * 專案問題追蹤組件屬性
 */
export interface ProjectIssuesProps {
  projectId: string;     // 專案 ID
  disabled?: boolean;    // 是否禁用編輯
} 