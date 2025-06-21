/**
 * 專案管理相關型別定義
 * 包含工作包、任務、日報、區域等資料結構
 * 用於管理專案生命週期中的各項活動和資源
 */

import { DateField, BaseWithDates } from '../../../types/common';

// ===== 專案狀態與生命週期管理 =====

/**
 * 專案狀態枚舉 - 專業化狀態管理
 */
export type ProjectStatus = 
  | 'planning'      // 規劃中
  | 'approved'      // 已核准
  | 'in-progress'   // 執行中
  | 'on-hold'       // 暫停中
  | 'completed'     // 已完成
  | 'cancelled'     // 已取消
  | 'archived';     // 已封存

/**
 * 工作包狀態枚舉 - 標準化狀態管理
 */
export type WorkpackageStatus = 
  | 'draft'         // 草稿
  | 'planned'       // 已規劃
  | 'ready'         // 準備就緒
  | 'in-progress'   // 執行中
  | 'review'        // 審查中
  | 'completed'     // 已完成
  | 'on-hold'       // 暫停中
  | 'cancelled';    // 已取消

/**
 * 子工作包狀態枚舉
 */
export type SubWorkpackageStatus = 
  | 'draft'         // 草稿
  | 'assigned'      // 已分配
  | 'in-progress'   // 執行中
  | 'review'        // 審查中
  | 'completed'     // 已完成
  | 'on-hold'       // 暫停中
  | 'cancelled';    // 已取消

/**
 * 專案優先級枚舉
 */
export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * 專案類型枚舉
 */
export type ProjectType = 
  | 'system'       // 系統工程
  | 'maintenance'  // 維護工程
  | 'transport';   // 搬運工程

/**
 * 專案風險等級
 */
export type ProjectRiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * 專案健康度等級
 */
export type ProjectHealthLevel = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

/**
 * 專案階段枚舉
 */
export type ProjectPhase = 
  | 'initiation'    // 啟動階段
  | 'planning'      // 規劃階段
  | 'execution'     // 執行階段
  | 'monitoring'    // 監控階段
  | 'closure';      // 收尾階段

// ===== Workpackage/Project 型別合併區 =====

export type PhotoType = 'progress' | 'issue' | 'material' | 'safety' | 'other'; // 照片類型

export interface Task extends BaseWithDates {
  id: string; // 任務唯一識別碼
  name: string; // 任務名稱
  description?: string; // 任務描述（可選）
  status?: 'pending' | 'in-progress' | 'completed'; // 任務狀態（可選）
  dueDate?: DateField; // 任務截止日期（可選）
  assignedTo?: string | null; // 任務分配對象（可選）
  completed: boolean; // 任務是否完成
  priority?: 'low' | 'medium' | 'high'; // 任務優先級
  estimatedHours?: number; // 預估工時
  actualHours?: number; // 實際工時
}

export interface ProgressHistoryRecord {
  date: DateField;
  doneCount: number;
  percent: number;
  notes?: string; // 進度備註
  updatedBy: string; // 更新者
}

/**
 * 專案里程碑
 */
export interface ProjectMilestone extends BaseWithDates {
  id: string;
  name: string;
  description?: string;
  targetDate: DateField;
  actualDate?: DateField;
  status: 'pending' | 'completed' | 'overdue';
  type: 'start' | 'intermediate' | 'end';
  dependencies?: string[]; // 依賴的其他里程碑ID
  completionCriteria?: string; // 完成標準
  responsiblePerson?: string; // 負責人
  budget?: number; // 預算
  actualCost?: number; // 實際成本
}

/**
 * 專案風險記錄
 */
export interface ProjectRisk extends BaseWithDates {
  id: string;
  title: string;
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  riskLevel: ProjectRiskLevel;
  mitigationPlan?: string;
  contingencyPlan?: string;
  status: 'identified' | 'monitoring' | 'mitigated' | 'closed';
  assignedTo?: string;
  dueDate?: DateField;
  cost?: number; // 風險成本
  probabilityPercentage?: number; // 發生機率百分比
  impactScore?: number; // 影響分數 1-10
}

/**
 * 專案變更記錄
 */
export interface ProjectChange extends BaseWithDates {
  id: string;
  title: string;
  description: string;
  type: 'scope' | 'schedule' | 'cost' | 'quality' | 'risk';
  impact: 'low' | 'medium' | 'high';
  status: 'proposed' | 'approved' | 'rejected' | 'implemented';
  requestedBy: string;
  approvedBy?: string;
  approvedDate?: DateField;
  implementationDate?: DateField;
  costImpact?: number; // 成本影響
  scheduleImpact?: number; // 時程影響（天數）
  scopeImpact?: string; // 範圍影響描述
}

/**
 * 專案品質指標
 */
export interface ProjectQualityMetrics {
  overallQualityScore: number; // 整體品質評分 1-10
  inspectionPassRate: number; // 檢驗通過率
  defectRate: number; // 缺陷率
  customerSatisfaction?: number; // 客戶滿意度 1-10
  reworkPercentage: number; // 重工百分比
  complianceScore: number; // 法規遵循分數 1-10
  qualityAuditScore: number; // 品質稽核分數 1-10
}

/**
 * 專案安全指標
 */
export interface ProjectSafetyMetrics {
  totalIncidents: number; // 總事故次數
  lostTimeInjuries: number; // 工時損失傷害
  safetyAuditScore: number; // 安全稽核分數 1-10
  trainingCompletionRate: number; // 訓練完成率
  safetyComplianceRate: number; // 安全遵循率
  nearMissCount: number; // 差點事故次數
  safetyObservationCount: number; // 安全觀察次數
}

/**
 * 專案財務指標
 */
export interface ProjectFinancialMetrics {
  budgetVariance: number; // 預算差異
  costPerformanceIndex: number; // 成本績效指數
  schedulePerformanceIndex: number; // 時程績效指數
  earnedValue: number; // 實獲值
  plannedValue: number; // 計劃值
  actualCost: number; // 實際成本
  budgetAtCompletion: number; // 完工預算
  estimateAtCompletion: number; // 完工估算
  varianceAtCompletion: number; // 完工差異
}

export interface SubWorkpackage extends BaseWithDates {
  id: string;
  name: string;
  description?: string;
  actualStartDate?: DateField;
  actualEndDate?: DateField;
  plannedStartDate?: DateField;
  plannedEndDate?: DateField;
  status?: SubWorkpackageStatus;
  progress?: number;
  assignedTo?: string | null;
  priority?: number;
  estimatedQuantity?: number;
  actualQuantity?: number;
  unit?: string;
  budget?: number;
  estimatedStartDate?: DateField;
  estimatedEndDate?: DateField;
  progressHistory?: ProgressHistoryRecord[];
  tasks?: Task[];
  // 新增專業化欄位
  qualityScore?: number; // 品質評分 1-10
  safetyIncidents?: number; // 安全事故次數
  reworkCount?: number; // 重工次數
  completionNotes?: string; // 完工備註
  // 新增進階欄位
  estimatedHours?: number; // 預估工時
  actualHours?: number; // 實際工時
  costVariance?: number; // 成本差異
  scheduleVariance?: number; // 時程差異
  riskLevel?: 'low' | 'medium' | 'high'; // 風險等級
  dependencies?: string[]; // 依賴的其他子工作包ID
}

export interface Workpackage extends BaseWithDates {
  id: string;
  name: string;
  description?: string;
  actualStartDate?: DateField;
  actualEndDate?: DateField;
  plannedStartDate?: DateField;
  plannedEndDate?: DateField;
  estimatedStartDate?: DateField;
  estimatedEndDate?: DateField;
  status?: WorkpackageStatus;
  progress?: number;
  assignedTo?: string | null;
  budget?: number;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  subWorkpackages: SubWorkpackage[];
  // 新增專業化欄位
  qualityMetrics?: {
    inspectionPassRate: number; // 檢驗通過率
    defectRate: number; // 缺陷率
    reworkPercentage: number; // 重工百分比
  };
  safetyMetrics?: {
    incidentCount: number; // 事故次數
    safetyAuditScore: number; // 安全稽核分數
    trainingHours: number; // 訓練時數
  };
  // 新增進階欄位
  estimatedHours?: number; // 預估工時
  actualHours?: number; // 實際工時
  costVariance?: number; // 成本差異
  scheduleVariance?: number; // 時程差異
  riskLevel?: 'low' | 'medium' | 'high'; // 風險等級
  dependencies?: string[]; // 依賴的其他工作包ID
  phase?: ProjectPhase; // 所屬階段
}

export interface DailyReport extends BaseWithDates {
  id: string;
  date: DateField;
  weather: string;
  temperature: number;
  rainfall: number;
  workforceCount: number;
  materials: MaterialEntry[];
  activities: ActivityLog[];
  issues?: IssueRecord[] | string;
  photos: PhotoRecord[];
  createdBy: string;
  description?: string; // 新增，對應 UI 的工作描述
  projectProgress?: number; // 新增，記錄當日專案總進度
}

export interface ActivityLog extends BaseWithDates {
  id: string;
  workpackageId: string;
  description: string;
  startTime: DateField;
  endTime: DateField;
  workforce: number;
  progress: number;
  notes: string;
}

export interface MaterialEntry extends BaseWithDates {
  materialId: string;
  name: string;
  quantity: number;
  unit: string;
  supplier: string;
  notes: string;
}

export interface IssueRecord extends BaseWithDates {
  id: string;
  type: 'quality' | 'safety' | 'progress' | 'other';
  description: string;
  severity: 'low' | 'medium' | 'high';
  status: 'open' | 'in-progress' | 'resolved';
  assignedTo: string | null;
  dueDate: DateField;
  resolution?: string;
  resolved?: boolean; // 允許 resolved 屬性，與現有程式一致
}

export interface PhotoRecord extends BaseWithDates {
  id: string;
  url: string;
  type: PhotoType;
  description: string;
  workpackageId?: string;
  zoneId?: string;
  reportId?: string;
  createdBy: string;
}

export interface Zone extends BaseWithDates {
  zoneId: string;
  zoneName: string;
  desc?: string;
  order?: number;
}

export interface Expense extends BaseWithDates {
  id: string;
  description: string;
  amount: number;
  date: DateField;
  category: string;
  createdBy: string;
  updatedBy: string;
}

export interface Project extends BaseWithDates {
  projectId?: string; // 專案唯一識別碼（可選）
  projectName: string; // 專案名稱
  contractId?: string; // 合約 ID（可選）
  status: ProjectStatus; // 專案狀態 - 使用標準化狀態
  progress?: number; // 專案進度
  manager?: string; // 專案經理（可選）
  inspector?: string; // 專案檢查員（可選）
  safety?: string; // 專案安全負責人（可選）
  area?: string; // 專案區域（可選）
  address?: string; // 專案地址（可選）
  startDate?: DateField; // 專案開始日期（可選）
  estimatedEndDate?: DateField; // 預計結束日期（可選）
  owner?: string; // 專案擁有者（可選）
  zones?: Zone[]; // 專案區域清單（可選）
  supervisor?: string; // 專案監督人（可選）
  safetyOfficer?: string; // 專案安全官（可選）
  costController?: string; // 專案成本控制員（可選）
  region?: string; // 專案地區（可選）
  workpackages: Workpackage[]; // 專案的工作包清單
  decomposition?: object; // 專案分解結構（可選）
  reports?: DailyReport[]; // 專案的日報清單（可選）
  photos?: PhotoRecord[]; // 專案的照片清單（可選）
  materials?: MaterialEntry[]; // 專案的材料清單（可選）
  issues?: IssueRecord[]; // 專案的問題清單（可選）
  expenses?: Expense[]; // 專案的費用清單（可選）
  roles?: string[]; // 專案的角色權限清單（可選）
  archivedAt?: DateField | null; // 封存日期
  // 新增專業化欄位
  projectType?: ProjectType; // 專案類型
  priority?: ProjectPriority; // 專案優先級
  riskLevel?: ProjectRiskLevel; // 風險等級
  milestones?: ProjectMilestone[]; // 專案里程碑
  risks?: ProjectRisk[]; // 專案風險
  changes?: ProjectChange[]; // 專案變更
  qualityMetrics?: ProjectQualityMetrics; // 專案品質指標
  safetyMetrics?: ProjectSafetyMetrics; // 專案安全指標
  financialMetrics?: ProjectFinancialMetrics; // 專案財務指標
  // 新增進階欄位
  phase?: ProjectPhase; // 專案階段
  healthLevel?: ProjectHealthLevel; // 專案健康度等級
  estimatedBudget?: number; // 預估預算
  actualBudget?: number; // 實際預算
  estimatedDuration?: number; // 預估工期（天）
  actualDuration?: number; // 實際工期（天）
  stakeholders?: string[]; // 利害關係人
  objectives?: string[]; // 專案目標
  successCriteria?: string[]; // 成功標準
  constraints?: string[]; // 專案限制
  assumptions?: string[]; // 專案假設
  lessonsLearned?: string[]; // 經驗教訓
  nextReviewDate?: DateField; // 下次審查日期
  lastReviewDate?: DateField; // 上次審查日期
  reviewFrequency?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly'; // 審查頻率
  // 新增品質分數追蹤欄位
  qualityScore?: number; // 即時品質分數 (0-10)，初始值為 10
  lastQualityAdjustment?: DateField; // 上次品質分數調整時間
}

// ===== Template 型別區 =====

export interface SubWorkpackageTemplateItem extends BaseWithDates {
  id: string;
  name: string;
  description?: string;
  estimatedQuantity?: number;
  unit?: string;
  tasks?: {
    name: string;
    description?: string;
  }[];
  createdBy: string;
}

export interface Template extends BaseWithDates {
  id: string;
  name: string;
  description: string;
  category: string;
  subWorkpackages: SubWorkpackageTemplateItem[];
  createdBy: string;
}

/**
 * 將範本轉換為子工作包時的選項
 * - workpackageId: 指定要套用的工作包 ID（可選）
 * - estimatedStartDate: 預計開始日期（可選，ISO 字串）
 * - estimatedEndDate: 預計結束日期（可選，ISO 字串）
 * - assignedTo: 負責人（可選）
 */
export type TemplateToSubWorkpackageOptions = {
  workpackageId?: string;
  estimatedStartDate?: DateField;
  estimatedEndDate?: DateField;
  assignedTo?: string | null;
};

export interface ProjectDocument extends Project {
  id: string;
  idx: number;
  createdAt: string; // 已經格式化
}
