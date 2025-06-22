import { Timestamp } from 'firebase/firestore';

// ============================================================================
// 基礎型別定義
// ============================================================================

export type DateField = Timestamp | Date | string | null;

export interface BaseWithDates {
  createdAt: DateField;
  updatedAt: DateField;
}

export interface BaseWithId extends BaseWithDates {
  id: string;
}

// ============================================================================
// 統一優先級和嚴重程度型別
// ============================================================================

export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';
export type SeverityLevel = 'low' | 'medium' | 'high';

// ============================================================================
// 統一狀態型別
// ============================================================================

export type BudgetStatus = 'draft' | 'approved' | 'active' | 'closed';
export type ItemStatus = 'active' | 'on_hold' | 'completed';

// ============================================================================
// 列舉型別定義
// ============================================================================

export type ProjectStatus =
  | 'planning'      // 規劃中
  | 'approved'      // 已核准
  | 'in-progress'   // 執行中
  | 'on-hold'       // 暫停中
  | 'completed'     // 已完成
  | 'cancelled'     // 已取消
  | 'archived';     // 已封存

export type WorkPackageStatus =
  | 'draft'         // 草稿
  | 'planned'       // 已規劃
  | 'ready'         // 準備就緒
  | 'in-progress'   // 執行中
  | 'review'        // 審查中
  | 'completed'     // 已完成
  | 'on-hold'       // 暫停中
  | 'cancelled';    // 已取消

export type SubWorkPackageStatus =
  | 'draft'         // 草稿
  | 'assigned'      // 已分配
  | 'in-progress'   // 執行中
  | 'review'        // 審查中
  | 'completed'     // 已完成
  | 'on-hold'       // 暫停中
  | 'cancelled';    // 已取消

export type ProjectType =
  | 'system'       // 系統工程
  | 'maintenance'  // 維護工程
  | 'transport';   // 搬運工程

export type ProjectHealthLevel = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

export type ProjectPhase =
  | 'initiation'    // 啟動階段
  | 'planning'      // 規劃階段
  | 'execution'     // 執行階段
  | 'monitoring'    // 監控階段
  | 'closure';      // 收尾階段

export type PhotoType = 'progress' | 'issue' | 'material' | 'safety' | 'other';

export type TaskStatus = 'pending' | 'in-progress' | 'completed';

export type IssueType = 'quality' | 'safety' | 'progress' | 'other';

export type IssueStatus = 'open' | 'in-progress' | 'resolved';

export type RiskStatus = 'identified' | 'monitoring' | 'mitigated' | 'closed';

export type ChangeType = 'scope' | 'schedule' | 'cost' | 'quality' | 'risk';

export type ChangeStatus = 'proposed' | 'approved' | 'rejected' | 'implemented';

export type MilestoneStatus = 'pending' | 'completed' | 'overdue';

export type MilestoneType = 'start' | 'intermediate' | 'end';

export type ReviewFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly';

// ============================================================================
// 工具函式
// ============================================================================

// 安全轉成 Date 物件
export const convertToDate = (input: DateField): Date | null => {
  if (!input) return null;
  if (input instanceof Date) return input;
  if (typeof input === 'string') return new Date(input);
  if ('toDate' in input) return input.toDate?.() ?? null;
  return null;
};

// 格式化日期顯示 (YYYY-MM-DD)
export const formatDateDisplay = (input: DateField, fallback = '--'): string => {
  const date = convertToDate(input);
  if (!date) return fallback;
  return date.toISOString().split('T')[0];
};

// ============================================================================
// 時間結構與計算
// ============================================================================

export interface TimeRange {
  start: DateField | null;
  end: DateField | null;
}

export interface CalculatedTimeRange extends TimeRange {
  elapsedDays: number;
  remainingDays: number;
}

export const calculateTimeMetrics = (range: TimeRange): CalculatedTimeRange => {
  const now = new Date();
  const start = convertToDate(range.start);
  const end = convertToDate(range.end);

  const elapsedDays = start
    ? Math.max(0, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const remainingDays = end
    ? Math.max(0, Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return { start, end, elapsedDays, remainingDays };
};

// ============================================================================
// 任務與進度相關型別
// ============================================================================

export interface Task extends BaseWithId {
  name: string;
  description?: string;
  status?: TaskStatus;
  dueDate?: DateField;
  assignedTo?: string | null;
  completed: boolean;
  priority?: SeverityLevel;
  estimatedHours?: number;
  actualHours?: number;
}

export interface ProgressHistoryRecord {
  date: DateField;
  doneCount: number;
  percent: number;
  notes?: string;
  updatedBy: string;
}

// ============================================================================
// 里程碑型別
// ============================================================================

export interface ProjectMilestone extends BaseWithId {
  name: string;
  description?: string;
  targetDate: DateField;
  actualDate?: DateField;
  status: MilestoneStatus;
  type: MilestoneType;
  dependencies?: string[];
  completionCriteria?: string;
  responsiblePerson?: string;
  budget?: number;
  actualCost?: number;
}

// ============================================================================
// 風險管理型別
// ============================================================================

export interface ProjectRisk extends BaseWithId {
  title: string;
  description: string;
  probability: SeverityLevel;
  impact: SeverityLevel;
  riskLevel: PriorityLevel;
  mitigationPlan?: string;
  contingencyPlan?: string;
  status: RiskStatus;
  assignedTo?: string;
  dueDate?: DateField;
  cost?: number;
  probabilityPercentage?: number;
  impactScore?: number;
}

// ============================================================================
// 變更管理型別
// ============================================================================

export interface ProjectChange extends BaseWithId {
  title: string;
  description: string;
  type: ChangeType;
  impact: SeverityLevel;
  status: ChangeStatus;
  requestedBy: string;
  approvedBy?: string;
  approvedDate?: DateField;
  implementationDate?: DateField;
  costImpact?: number;
  scheduleImpact?: number;
  scopeImpact?: string;
}

// ============================================================================
// 指標型別
// ============================================================================

export interface ProjectQualityMetrics {
  overallQualityScore: number;
  inspectionPassRate: number;
  defectRate: number;
  customerSatisfaction?: number;
  reworkPercentage: number;
  qualityAuditScore: number;
}

export interface ProjectSafetyMetrics {
  totalIncidents: number;
  lostTimeInjuries: number;
  safetyAuditScore: number;
  trainingCompletionRate: number;
  safetyComplianceRate: number;
  nearMissCount: number;
  safetyObservationCount: number;
}

export interface ProjectFinancialMetrics {
  budgetVariance: number;
  costPerformanceIndex: number;
  schedulePerformanceIndex: number;
  earnedValue: number;
  plannedValue: number;
  actualCost: number;
  budgetAtCompletion: number;
  estimateAtCompletion: number;
  varianceAtCompletion: number;
}

// ============================================================================
// 子工作包（增強版）
// ============================================================================

export interface SubWorkPackage extends BaseWithId {
  name: string;
  description?: string;
  quantity: number;
  unitWeight: number;
  completedUnits: number;
  progress: number;
  workers: string[];
  actualStartDate?: DateField;
  actualEndDate?: DateField;
  plannedStartDate?: DateField;
  plannedEndDate?: DateField;
  status?: SubWorkPackageStatus;
  assignedTo?: string | null;
  priority?: PriorityLevel;
  estimatedQuantity?: number;
  actualQuantity?: number;
  unit?: string;
  budget?: number;
  estimatedStartDate?: DateField;
  estimatedEndDate?: DateField;
  progressHistory?: ProgressHistoryRecord[];
  tasks?: Task[];
  qualityScore?: number;
  safetyIncidents?: number;
  reworkCount?: number;
  completionNotes?: string;
  estimatedHours?: number;
  actualHours?: number;
  costVariance?: number;
  scheduleVariance?: number;
  riskLevel?: PriorityLevel;
  dependencies?: string[];
}

export const calculateSubWorkPackageProgress = (sub: SubWorkPackage): number => {
  if (!sub.tasks || sub.tasks.length === 0) {
    return sub.progress || 0;
  }
  
  const completedTasks = sub.tasks.filter(task => task.completed).length;
  return Math.round((completedTasks / sub.tasks.length) * 100);
};

// ============================================================================
// 工作包（增強版）
// ============================================================================

export interface WorkPackage extends BaseWithId {
  name: string;
  description?: string;
  budget: number;
  quantity: number;
  subPackages: SubWorkPackage[];
  actualStartDate?: DateField;
  actualEndDate?: DateField;
  plannedStartDate?: DateField;
  plannedEndDate?: DateField;
  estimatedStartDate?: DateField;
  estimatedEndDate?: DateField;
  status?: WorkPackageStatus;
  progress?: number;
  assignedTo?: string | null;
  category?: string;
  priority?: PriorityLevel;
  qualityMetrics?: {
    inspectionPassRate: number;
    defectRate: number;
    reworkPercentage: number;
  };
  safetyMetrics?: {
    incidentCount: number;
    safetyAuditScore: number;
    trainingHours: number;
  };
  estimatedHours?: number;
  actualHours?: number;
  costVariance?: number;
  scheduleVariance?: number;
  riskLevel?: PriorityLevel;
  dependencies?: string[];
  phase?: ProjectPhase;
}

export const calculateWorkPackageProgress = (wp: WorkPackage): number => {
  if (!wp.subPackages || wp.subPackages.length === 0) {
    return wp.progress || 0;
  }
  
  const totalProgress = wp.subPackages.reduce((sum, sub) => {
    return sum + calculateSubWorkPackageProgress(sub);
  }, 0);
  
  return Math.round(totalProgress / wp.subPackages.length);
};

// ============================================================================
// 日誌與報告型別
// ============================================================================

export interface ActivityLog extends BaseWithId {
  workPackageId: string;
  description: string;
  startTime: DateField;
  endTime: DateField;
  workforce: number;
  progress: number;
  notes: string;
}

export interface MaterialEntry extends BaseWithId {
  materialId: string;
  name: string;
  quantity: number;
  unit: string;
  supplier: string;
  notes: string;
}

export interface IssueRecord extends BaseWithId {
  projectId: string;
  type: IssueType;
  description: string;
  severity: SeverityLevel;
  status: IssueStatus;
  assignedTo: string | null;
  dueDate: DateField;
  resolution?: string;
  resolved?: boolean;
}

export interface PhotoRecord extends BaseWithId {
  url: string;
  type: PhotoType;
  description: string;
  workPackageId?: string;
  zoneId?: string;
  reportId?: string;
  createdBy: string;
}

export interface DailyReport extends BaseWithId {
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
  description?: string;
  projectProgress?: number;
}

// 保留原有的專案日誌型別（向後相容）
export interface ProjectLog {
  id: string;
  timestamp: DateField;
  photoUrls: string[];
  workUpdates: Array<{
    subPackageId: string;
    completedUnits: number;
  }>;
}

// 保留原有的專案問題型別（向後相容）
export interface ProjectIssue {
  id: string;
  description: string;
  createdAt: DateField;
}

// ============================================================================
// 區域與費用型別
// ============================================================================

export interface Zone extends BaseWithId {
  zoneId: string;
  zoneName: string;
  desc?: string;
  order?: number;
}

export interface Expense extends BaseWithId {
  description: string;
  amount: number;
  date: DateField;
  category: string;
  createdBy: string;
  updatedBy: string;
}

// ============================================================================
// 模板型別
// ============================================================================

export interface SubWorkPackageTemplateItem extends BaseWithId {
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

export interface Template extends BaseWithId {
  name: string;
  description: string;
  category: string;
  subWorkPackages: SubWorkPackageTemplateItem[];
  createdBy: string;
}

export type TemplateToSubWorkPackageOptions = {
  workPackageId?: string;
  estimatedStartDate?: DateField;
  estimatedEndDate?: DateField;
  assignedTo?: string | null;
};

// ============================================================================
// 專案主體（增強版）
// ============================================================================

export interface Project extends BaseWithDates {
  // 基本資訊
  id: string;
  projectId?: string;
  serialNumber: string;
  projectName: string;
  name: string;
  contractId?: string;
  status: ProjectStatus | string[];
  progress?: number;
 
  // 人員配置
  manager?: string;
  inspector?: string;
  safety?: string;
  supervisor?: string;
  safetyOfficer?: string;
  costController?: string;
  managers: string[];
  supervisors: string[];
  safetyOfficers: string[];
 
  // 地點資訊
  area?: string;
  address: string;
  region: string;
 
  // 時間資訊
  startDate?: DateField;
  estimatedEndDate?: DateField;
  estimated: CalculatedTimeRange;
  planned: CalculatedTimeRange;
  actual: CalculatedTimeRange;
  required: CalculatedTimeRange;
 
  // 其他基本資訊
  owner: string;
  zones?: Zone[];
 
  // 核心資料
  workPackages: WorkPackage[];
  decomposition?: object;
 
  // 報告與記錄
  reports?: DailyReport[];
  photos?: PhotoRecord[];
  materials?: MaterialEntry[];
  issues: ProjectIssue[] | IssueRecord[];
  logs: ProjectLog[];
  expenses?: Expense[];
 
  // 權限與封存
  roles?: string[];
  archivedAt?: DateField | null;
 
  // 專案分類
  projectType?: ProjectType | string[];
  type: string[];
  priority?: PriorityLevel;
  riskLevel?: PriorityLevel | string;
  risk: string;
  phase?: ProjectPhase;
  healthLevel?: ProjectHealthLevel;
 
  // 管理項目
  milestones?: ProjectMilestone[];
  risks?: ProjectRisk[];
  changes?: ProjectChange[];
 
  // 指標
  qualityMetrics?: ProjectQualityMetrics;
  safetyMetrics?: ProjectSafetyMetrics;
  financialMetrics?: ProjectFinancialMetrics;
  quality: string;
 
  // 預算與時程
  estimatedBudget?: number;
  actualBudget?: number;
  estimatedDuration?: number;
  actualDuration?: number;
 
  // 專案管理
  stakeholders?: string[];
  objectives?: string[];
  successCriteria?: string[];
  constraints?: string[];
  assumptions?: string[];
  lessonsLearned?: string[];
 
  // 審查
  nextReviewDate?: DateField;
  lastReviewDate?: DateField;
  reviewFrequency?: ReviewFrequency;
 
  // 品質追蹤
  qualityScore?: number;
  lastQualityAdjustment?: DateField;
}

export const calculateProjectProgress = (project: Project): number => {
  if (!project.workPackages || project.workPackages.length === 0) {
    return project.progress || 0;
  }
  
  const totalProgress = project.workPackages.reduce((sum, wp) => {
    return sum + calculateWorkPackageProgress(wp);
  }, 0);
  
  return Math.round(totalProgress / project.workPackages.length);
};

// ============================================================================
// 擴展型別（用於特定用途）
// ============================================================================

export interface ProjectDocument extends Project {
  idx: number;
  createdAt: string;
}

// ============================================================================
// 篩選與排序型別
// ============================================================================

export interface ProjectFilters {
  searchTerm: string;
  status?: ProjectStatus;
  projectType?: ProjectType;
  priority?: PriorityLevel;
  riskLevel?: PriorityLevel;
  healthLevel?: ProjectHealthLevel;
  phase?: ProjectPhase;
  manager?: string;
  region?: string;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  progressRange?: {
    min: number;
    max: number;
  };
  budgetRange?: {
    min: number;
    max: number;
  };
  qualityRange?: {
    min: number;
    max: number;
  };
}

export type ProjectSortOption =
  | 'name-asc'
  | 'name-desc'
  | 'createdAt-asc'
  | 'createdAt-desc'
  | 'status-asc'
  | 'status-desc'
  | 'progress-asc'
  | 'progress-desc'
  | 'priority-asc'
  | 'priority-desc'
  | 'riskLevel-asc'
  | 'riskLevel-desc'
  | 'healthLevel-asc'
  | 'healthLevel-desc'
  | 'qualityScore-asc'
  | 'qualityScore-desc'
  | 'budget-asc'
  | 'budget-desc'
  | 'startDate-asc'
  | 'startDate-desc';

// ============================================================================
// 統計型別
// ============================================================================

export interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  onHoldProjects: number;
  overdueProjects: number;
  totalQualityIssues: number;
  averageQualityScore: number;
}

// ============================================================================
// 品質分數型別
// ============================================================================

export interface QualityScoreInfo {
  currentScore: number;
  baseScore: number;
  qualityOrProgressIssuesCount: number;
  totalIssuesCount: number;
}

// ============================================================================
// 使用者型別（用於專案成員）
// ============================================================================

export interface ProjectMember {
  uid: string;
  displayName: string;
  email: string;
  roles: string[];
  currentRole?: string;
  assignedProjects?: string[];
}

// ============================================================================
// 文件管理型別
// ============================================================================

export type DocumentCategory = 
  | 'blueprint'      // 藍圖
  | 'contract'       // 合約
  | 'specification'  // 規格書
  | 'report'         // 報告
  | 'photo'          // 照片
  | 'video'          // 影片
  | 'drawing'        // 圖紙
  | 'manual'         // 手冊
  | 'certificate'    // 證書
  | 'permit'         // 許可證
  | 'invoice'        // 發票
  | 'receipt'        // 收據
  | 'other';         // 其他

export interface DocumentVersion extends BaseWithId {
  documentId: string;
  version: number;
  url: string;
  uploadedAt: DateField;
  uploadedBy: string;
  changeLog: string;
}

export interface ProjectDocumentFile extends BaseWithId {
  name: string;
  originalName: string;
  size: number;
  type: string;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: DateField;
  uploadedBy: string;
  version: number;
  category: DocumentCategory;
  tags: string[];
  description?: string;
  projectId: string;
  workPackageId?: string;
  isPublic: boolean;
  metadata?: Record<string, unknown>;
}

export interface DocumentStats {
  totalDocuments: number;
  totalSize: number;
  byCategory: Record<DocumentCategory, number>;
  byType: Record<string, number>;
  recentUploads: ProjectDocumentFile[];
}

// ============================================================================
// 預算管理型別
// ============================================================================

export type BudgetCategory = 
  | 'labor'         // 人工費用
  | 'material'      // 材料費用
  | 'equipment'     // 設備費用
  | 'subcontract'   // 分包費用
  | 'overhead'      // 間接費用
  | 'contingency'   // 預備費用
  | 'other';        // 其他費用

export type CostStatus = 'planned' | 'committed' | 'invoiced' | 'paid';

export type AlertType = 'over_budget' | 'over_allocation' | 'cost_variance' | 'schedule_variance';

export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface ProjectBudget extends BaseWithId {
  projectId: string;
  name: string;
  description?: string;
  totalBudget: number;
  startDate: DateField;
  endDate: DateField;
  currency: string;
  exchangeRate?: number;
  createdBy: string;
  approvedBy?: string;
  approvedDate?: DateField;
  status: BudgetStatus;
  notes?: string;
}

export interface BudgetItem extends BaseWithId {
  budgetId: string;
  name: string;
  description?: string;
  category: BudgetCategory;
  allocatedAmount: number;
  spentAmount: number;
  committedAmount: number;
  unit?: string;
  quantity?: number;
  unitPrice?: number;
  workPackageId?: string;
  assignedTo?: string;
  priority: PriorityLevel;
  status: ItemStatus;
  notes?: string;
}

export interface CostRecord extends BaseWithId {
  projectId: string;
  budgetItemId?: string;
  workPackageId?: string;
  description: string;
  amount: number;
  date: DateField;
  category: BudgetCategory;
  status: CostStatus;
  invoiceNumber?: string;
  supplier?: string;
  recordedBy: string;
  approvedBy?: string;
  approvedDate?: DateField;
  receiptUrl?: string;
  notes?: string;
}

export interface BudgetAlert extends BaseWithId {
  projectId: string;
  type: AlertType;
  severity: PriorityLevel;
  message: string;
  status: AlertStatus;
  acknowledgedBy?: string;
  acknowledgedDate?: DateField;
  resolvedBy?: string;
  resolvedDate?: DateField;
  notes?: string;
}

export interface BudgetStats {
  totalBudget: number;
  totalAllocated: number;
  totalSpent: number;
  totalCommitted: number;
  remainingBudget: number;
  availableBudget: number;
  budgetUtilization: number;
  allocationRate: number;
  categoryStats: Record<BudgetCategory, {
    allocated: number;
    spent: number;
    committed: number;
  }>;
  recentCosts: CostRecord[];
  alerts: BudgetAlert[];
}

// ============================================================================
// Firestore 資料轉換器
// ============================================================================

interface FirestoreTimeRange {
  start?: unknown;
  end?: unknown;
  elapsedDays?: number;
  remainingDays?: number;
}

interface FirestoreProject {
  startDate?: unknown;
  estimatedEndDate?: unknown;
  estimated?: FirestoreTimeRange;
  planned?: FirestoreTimeRange;
  actual?: FirestoreTimeRange;
  required?: FirestoreTimeRange;
  archivedAt?: unknown;
  nextReviewDate?: unknown;
  lastReviewDate?: unknown;
  lastQualityAdjustment?: unknown;
  [key: string]: unknown;
}

export const mapProjectFromFirestore = (raw: FirestoreProject): Project => {
  const mapTimeRange = (range: FirestoreTimeRange): CalculatedTimeRange => {
    return {
      start: convertToDate(range?.start as DateField),
      end: convertToDate(range?.end as DateField),
      elapsedDays: range?.elapsedDays || 0,
      remainingDays: range?.remainingDays || 0,
    };
  };

  const convertDateField = (d: unknown): DateField => {
    if (d instanceof Timestamp) return d.toDate();
    return d as DateField ?? null;
  };

  return {
    ...raw,
    startDate: convertDateField(raw.startDate),
    estimatedEndDate: convertDateField(raw.estimatedEndDate),
    estimated: mapTimeRange(raw.estimated || {}),
    planned: mapTimeRange(raw.planned || {}),
    actual: mapTimeRange(raw.actual || {}),
    required: mapTimeRange(raw.required || {}),
    archivedAt: convertDateField(raw.archivedAt),
    nextReviewDate: convertDateField(raw.nextReviewDate),
    lastReviewDate: convertDateField(raw.lastReviewDate),
    lastQualityAdjustment: convertDateField(raw.lastQualityAdjustment),
  } as Project;
};
