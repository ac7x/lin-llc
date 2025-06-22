/**
 * 專案管理模組
 * 
 * 提供完整的專案管理功能，包括：
 * - 專案 CRUD 操作
 * - 工作包管理
 * - 專案儀表板
 * - 統計分析
 * - 錯誤處理
 */

// ============================================================================
// 組件匯出
// ============================================================================

// 通用組件
export { default as AddressSelector } from './components/common/AddressSelector';
export { default as DataLoader } from './components/common/DataLoader';
export { default as LoadingSpinner } from './components/common/LoadingSpinner';
export { default as PageContainer } from './components/common/PageContainer';
export { default as PageHeader } from './components/common/PageHeader';
export { default as WeatherDisplay } from './components/common/WeatherDisplay';

// 儀表板組件
export { default as ProjectDashboard } from './components/dashboard/ProjectDashboard';
export { default as ProjectsTable } from './components/dashboard/ProjectsTable';
export { default as ProjectStatsComponent } from './components/dashboard/ProjectStats';

// 專案相關組件
export { default as ProjectEditModal } from './components/project/ProjectEditModal';
export { default as ProjectInfoDisplay } from './components/project/ProjectInfoDisplay';
export { default as ProjectInfoPage } from './components/project/ProjectInfoPage';

// 工作包組件
export { default as WorkpackageCard } from './components/work-packages/WorkpackageCard';
export { default as WorkpackageForm } from './components/work-packages/WorkpackageForm';
export { default as WorkpackageList } from './components/work-packages/WorkpackageList';

// 子工作包組件
export { default as SubWorkpackageCard } from './components/subwork-packages/SubWorkpackageCard';
export { default as SubWorkpackageForm } from './components/subwork-packages/SubWorkpackageForm';
export { default as SubWorkpackageList } from './components/subwork-packages/SubWorkpackageList';

// 日誌組件
export { default as JournalCard } from './components/journal/JournalCard';
export { default as JournalForm } from './components/journal/JournalForm';
export { default as JournalHistory } from './components/journal/JournalHistory';

// 問題組件
export { default as IssueForm } from './components/issues/IssueForm';
export { default as IssueList } from './components/issues/IssueList';
export { default as IssueTracker } from './components/management/IssueTracker';

// 費用組件
export { default as ExpenseForm } from './components/expenses/ExpenseForm';
export { default as ExpenseList } from './components/expenses/ExpenseList';

// 材料組件
export { default as MaterialForm } from './components/materials/MaterialForm';
export { default as MaterialList } from './components/materials/MaterialList';

// 模板組件
export { default as TemplateCard } from './components/templates/TemplateCard';
export { default as TemplateForm } from './components/templates/TemplateForm';

// 管理組件
export { default as RiskManager } from './components/management/RiskManager';
export { default as ChangeManager } from './components/management/ChangeManager';
export { default as MilestoneTracker } from './components/management/MilestoneTracker';

// 日曆組件
export { default as CalendarView } from './components/calendar/CalendarView';

// 生成專案組件
export { default as ContractSelector } from './components/generate-from-contract/ContractSelector';
export { default as ProjectSetupForm } from './components/generate-from-contract/ProjectSetupForm';
export { default as TemplateSelector } from './components/generate-from-contract/TemplateSelector';

// ============================================================================
// Hooks 匯出
// ============================================================================

export { useProjectState } from './hooks/useProjectState';
export { useProjectActions } from './hooks/useProjectActions';
export { useProjectForm } from './hooks/useProjectForm';
export { useProjectErrorHandler } from './hooks/useProjectErrorHandler';
export { useFilteredProjects, useProjectStats, useQualityScore } from './hooks/useFilteredProjects';

// ============================================================================
// 服務層匯出
// ============================================================================

export { 
  ProjectService, 
  WorkpackageService, 
  JournalService, 
  IssueService, 
  TemplateService 
} from './services';

// ============================================================================
// 工具函數匯出
// ============================================================================

// 進度計算 - 從 types 檔案導入核心計算函數
export { 
  calculateProjectProgress,
  calculateWorkpackageProgress,
} from './types';

// 進度顯示組件 - 從 progressUtils 導入
export { 
  ProgressBarWithPercent,
  ProjectHealthIndicator
} from './utils/progressUtils';

// 專案工具
export {
  calculateProjectQualityScore,
  calculateSchedulePerformanceIndex,
  calculateCostPerformanceIndex,
  getUpcomingMilestones,
  getOverdueMilestones,
  analyzeProjectStatusTrend,
  calculateProjectPriorityScore
} from './utils/projectUtils';

// 日期工具
export {
  convertToDate,
  formatProjectDate,
  calculateProjectDuration,
  isProjectOverdue,
  getProjectsInDateRange
} from './utils/dateUtils';

// 品質工具
export {
  calculateQualityScore,
  updateQualityScore,
  getQualityTrend
} from './utils/qualityUtils';

// 風險工具
export {
  calculateRiskScore,
  getRiskLevel,
  getRiskTrend
} from './utils/riskUtils';

// ============================================================================
// 常數匯出
// ============================================================================

export {
  PROJECT_STATUS_OPTIONS,
  PROJECT_TYPE_OPTIONS,
  PROJECT_PRIORITY_OPTIONS,
  PROJECT_RISK_LEVEL_OPTIONS,
  PROJECT_HEALTH_LEVEL_OPTIONS,
  PROJECT_PHASE_OPTIONS
} from './constants/projectConstants';

export {
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_ICONS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  RISK_LEVEL_LABELS,
  RISK_LEVEL_COLORS,
  HEALTH_LEVEL_LABELS,
  HEALTH_LEVEL_COLORS,
  PHASE_LABELS
} from './constants/statusConstants';

export {
  PROJECT_VALIDATION_RULES,
  WORKPACKAGE_VALIDATION_RULES,
  JOURNAL_VALIDATION_RULES,
  ISSUE_VALIDATION_RULES,
  VALIDATION_MESSAGES
} from './constants/validationRules';

// ============================================================================
// 型別匯出
// ============================================================================

export type { Project, ProjectDocument, WorkPackage, SubWorkPackage, ProjectMilestone, ProjectRisk, ProjectChange, ProjectQualityMetrics, ProjectSafetyMetrics, ProjectFinancialMetrics, ProjectStats, ProjectMember, ProjectFilters, ProjectSortOption, ProjectStatus, ProjectType, ProjectRiskLevel, ProjectHealthLevel, ProjectPhase, PhotoType, TaskStatus, IssueType, IssueStatus, RiskStatus, ChangeType, ChangeStatus, MilestoneStatus, MilestoneType, ReviewFrequency, Zone, Expense, SubWorkpackageTemplateItem, Template, TemplateToSubWorkpackageOptions, DocumentCategory, DocumentVersion, ProjectDocumentFile, DocumentStats, ProjectBudget, BudgetItem, CostRecord, BudgetAlert, BudgetStats, PriorityLevel, SeverityLevel } from './types';

// ============================================================================
// 樣式匯出
// ============================================================================

export { projectStyles } from './styles';
