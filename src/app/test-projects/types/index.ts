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

export type WorkpackageStatus =
  | 'draft'         // 草稿
  | 'planned'       // 已規劃
  | 'ready'         // 準備就緒
  | 'in-progress'   // 執行中
  | 'review'        // 審查中
  | 'completed'     // 已完成
  | 'on-hold'       // 暫停中
  | 'cancelled';    // 已取消

export type SubWorkpackageStatus =
  | 'draft'         // 草稿
  | 'assigned'      // 已分配
  | 'in-progress'   // 執行中
  | 'review'        // 審查中
  | 'completed'     // 已完成
  | 'on-hold'       // 暫停中
  | 'cancelled';    // 已取消

export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical';

export type ProjectType =
  | 'system'       // 系統工程
  | 'maintenance'  // 維護工程
  | 'transport';   // 搬運工程

export type ProjectRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type ProjectHealthLevel = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

export type ProjectPhase =
  | 'initiation'    // 啟動階段
  | 'planning'      // 規劃階段
  | 'execution'     // 執行階段
  | 'monitoring'    // 監控階段
  | 'closure';      // 收尾階段

export type PhotoType = 'progress' | 'issue' | 'material' | 'safety' | 'other';

export type TaskStatus = 'pending' | 'in-progress' | 'completed';

export type TaskPriority = 'low' | 'medium' | 'high';

export type IssueType = 'quality' | 'safety' | 'progress' | 'other';

export type IssueSeverity = 'low' | 'medium' | 'high';

export type IssueStatus = 'open' | 'in-progress' | 'resolved';

export type RiskProbability = 'low' | 'medium' | 'high';

export type RiskImpact = 'low' | 'medium' | 'high';

export type RiskStatus = 'identified' | 'monitoring' | 'mitigated' | 'closed';

export type ChangeType = 'scope' | 'schedule' | 'cost' | 'quality' | 'risk';

export type ChangeImpact = 'low' | 'medium' | 'high';

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
  priority?: TaskPriority;
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
  probability: RiskProbability;
  impact: RiskImpact;
  riskLevel: ProjectRiskLevel;
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
  impact: ChangeImpact;
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
  complianceScore: number;
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
  status?: SubWorkpackageStatus;
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
  qualityScore?: number;
  safetyIncidents?: number;
  reworkCount?: number;
  completionNotes?: string;
  estimatedHours?: number;
  actualHours?: number;
  costVariance?: number;
  scheduleVariance?: number;
  riskLevel?: 'low' | 'medium' | 'high';
  dependencies?: string[];
}

export const calculateSubWorkpackageProgress = (sub: SubWorkPackage): number => {
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
  status?: WorkpackageStatus;
  progress?: number;
  assignedTo?: string | null;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
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
  riskLevel?: 'low' | 'medium' | 'high';
  dependencies?: string[];
  phase?: ProjectPhase;
}

export const calculateWorkpackageProgress = (wp: WorkPackage): number => {
  if (!wp.subPackages || wp.subPackages.length === 0) {
    return wp.progress || 0;
  }
  
  const totalProgress = wp.subPackages.reduce((sum, sub) => {
    return sum + calculateSubWorkpackageProgress(sub);
  }, 0);
  
  return Math.round(totalProgress / wp.subPackages.length);
};

// ============================================================================
// 日誌與報告型別
// ============================================================================

export interface ActivityLog extends BaseWithId {
  workpackageId: string;
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
  type: IssueType;
  description: string;
  severity: IssueSeverity;
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
  workpackageId?: string;
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

export interface SubWorkpackageTemplateItem extends BaseWithId {
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
  subWorkpackages: SubWorkpackageTemplateItem[];
  createdBy: string;
}

export type TemplateToSubWorkpackageOptions = {
  workpackageId?: string;
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
  priority?: ProjectPriority;
  riskLevel?: ProjectRiskLevel | string;
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
    return sum + calculateWorkpackageProgress(wp);
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
  priority?: ProjectPriority;
  riskLevel?: ProjectRiskLevel;
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
// Firestore 資料轉換器
// ============================================================================

export const mapProjectFromFirestore = (raw: any): Project => {
  const mapTimeRange = (range: any): CalculatedTimeRange => {
    return {
      start: convertToDate(range?.start),
      end: convertToDate(range?.end),
      elapsedDays: range?.elapsedDays || 0,
      remainingDays: range?.remainingDays || 0,
    };
  };

  const convertDateField = (d: any): DateField => (d instanceof Timestamp ? d.toDate() : d ?? null);

  return {
    ...raw,
    startDate: convertDateField(raw.startDate),
    estimatedEndDate: convertDateField(raw.estimatedEndDate),
    estimated: mapTimeRange(raw.estimated),
    planned: mapTimeRange(raw.planned),
    actual: mapTimeRange(raw.actual),
    required: mapTimeRange(raw.required),
    archivedAt: convertDateField(raw.archivedAt),
    nextReviewDate: convertDateField(raw.nextReviewDate),
    lastReviewDate: convertDateField(raw.lastReviewDate),
    lastQualityAdjustment: convertDateField(raw.lastQualityAdjustment),
  };
};
