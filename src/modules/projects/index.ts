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

export * from './components/common';
export * from './components/dashboard';
export * from './components/project';
export * from './components/journal';
export * from './components/work-package';
export * from './components/subwork-package';

export * from './hooks';
export * from './types';
export * from './utils';
export * from './services';
export * from './constants';

// 重新導出頁面組件
export { default as ProjectsListPage } from './pages/list/page';
export { default as ProjectDetailPage } from './pages/[project]/page';
export { default as ProjectCalendarPage } from './pages/[project]/calendar/page';
export { default as ProjectExpensesPage } from './pages/[project]/expenses/page';
export { default as ProjectIssuesPage } from './pages/[project]/issues/page';
export { default as ProjectJournalPage } from './pages/[project]/journal/page';
export { default as ProjectMaterialsPage } from './pages/[project]/materials/page';
export { default as WorkpackageDetailPage } from './pages/[project]/work-packages/[workpackage]/page';
export { default as SubWorkpackagesPage } from './pages/[project]/work-packages/subworkpackages/page';

// 錯誤處理
export { useProjectErrorHandler } from './hooks/useProjectErrorHandler';

// 狀態管理
export { useProjectState } from './hooks/useProjectState';
export { useProjectActions } from './hooks/useProjectActions';
export { useProjectForm } from './hooks/useProjectForm';

// 服務層
export { ProjectService } from './services/projectService';

// 樣式
export { projectStyles } from './styles';

// ============================================================================
// 專案系統模組 - 主要匯出點
// ============================================================================

// ============================================================================
// 型別匯出
// ============================================================================

export type {
  // 基礎型別
  DateField,
  BaseWithDates,
  BaseWithId,
  
  // 列舉型別
  ProjectStatus,
  WorkpackageStatus,
  SubWorkpackageStatus,
  ProjectPriority,
  ProjectType,
  ProjectRiskLevel,
  ProjectHealthLevel,
  ProjectPhase,
  PhotoType,
  TaskStatus,
  TaskPriority,
  IssueType,
  IssueSeverity,
  IssueStatus,
  RiskProbability,
  RiskImpact,
  RiskStatus,
  ChangeType,
  ChangeImpact,
  ChangeStatus,
  MilestoneStatus,
  MilestoneType,
  ReviewFrequency,
  
  // 實體型別
  Task,
  ProgressHistoryRecord,
  ProjectMilestone,
  ProjectRisk,
  ProjectChange,
  ProjectQualityMetrics,
  ProjectSafetyMetrics,
  ProjectFinancialMetrics,
  SubWorkpackage,
  Workpackage,
  ActivityLog,
  MaterialEntry,
  IssueRecord,
  PhotoRecord,
  DailyReport,
  Zone,
  Expense,
  SubWorkpackageTemplateItem,
  Template,
  TemplateToSubWorkpackageOptions,
  Project,
  ProjectDocument,
  
  // 功能型別
  ProjectFilters,
  ProjectSortOption,
  ProjectStats,
  QualityScoreInfo,
  ProjectMember,
} from './types/project';

// ============================================================================
// 組件匯出
// ============================================================================

// 通用組件
export { default as AddressSelector } from './components/common/AddressSelector';
export { default as DataLoader } from './components/common/DataLoader';
export { default as LoadingSpinner } from './components/common/LoadingSpinner';
export { default as PageContainer } from './components/common/PageContainer';
export { default as PageHeader } from './components/common/PageHeader';

// 專案相關組件
export { default as ProjectEditModal } from './components/ProjectEditModal';
export { default as ProjectInfoDisplay } from './components/ProjectInfoDisplay';
export { default as ProjectInfoPage } from './components/ProjectInfoPage';
export { default as WorkpackageList } from './components/WorkpackageList';
export { default as WeatherDisplay } from './components/WeatherDisplay';

// 儀表板組件
export { default as ProjectDashboard } from './components/dashboard/ProjectDashboard';
export { default as ProjectsTable } from './components/dashboard/ProjectsTable';
export { default as ProjectStats } from './components/dashboard/ProjectStats';

// ============================================================================
// Hooks 匯出
// ============================================================================

// 專案狀態管理
export { useProjectState } from './hooks/useProjectState';
export { useProjectActions } from './hooks/useProjectActions';
export { useProjectForm } from './hooks/useProjectForm';
export { useProjectErrorHandler } from './hooks/useProjectErrorHandler';

// 專案資料處理
export { 
  useFilteredProjects, 
  useProjectStats, 
  useQualityScore 
} from './hooks/useFilteredProjects';

// ============================================================================
// 服務層匯出
// ============================================================================

export { ProjectService } from './services/projectService';
export { WorkpackageService } from './services/workpackageService';
export { JournalService } from './services/journalService';
export { IssueService } from './services/issueService';
export { TemplateService } from './services/templateService';

// ============================================================================
// 工具函數匯出
// ============================================================================

// 進度計算
export { 
  calculateProjectProgress,
  calculateWorkpackageProgress,
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
  formatDateForInput,
  formatLocalDate,
  convertFirebaseTimestamp
} from './utils/dateUtils';

// 品質工具
export {
  calculateQualityScore,
  getQualityLevel,
  getQualityColor
} from './utils/qualityUtils';

// 風險工具
export {
  calculateRiskLevel,
  getRiskColor,
  getRiskDescription
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
  WORKPACKAGE_STATUS_OPTIONS,
  SUB_WORKPACKAGE_STATUS_OPTIONS,
  TASK_STATUS_OPTIONS,
  ISSUE_TYPE_OPTIONS,
  ISSUE_SEVERITY_OPTIONS,
  ISSUE_STATUS_OPTIONS
} from './constants/statusConstants';

export {
  PROJECT_VALIDATION_RULES,
  WORKPACKAGE_VALIDATION_RULES,
  TASK_VALIDATION_RULES
} from './constants/validationRules';

// ============================================================================
// 預設匯出（模組整體）
// ============================================================================

const ProjectModule = {
  // 型別
  types: {
    Project,
    Workpackage,
    SubWorkpackage,
    ProjectStatus,
    ProjectType,
    // ... 其他型別
  },
  
  // 組件
  components: {
    ProjectDashboard,
    ProjectsTable,
    ProjectEditModal,
    WorkpackageList,
    JournalForm,
    // ... 其他組件
  },
  
  // Hooks
  hooks: {
    useProjectActions,
    useFilteredProjects,
    useProjectStats,
    useQualityScore,
    // ... 其他 hooks
  },
  
  // 服務
  services: {
    ProjectService,
    WorkpackageService,
    JournalService,
    // ... 其他服務
  },
  
  // 工具
  utils: {
    calculateProjectProgress,
    calculateProjectQualityScore,
    // ... 其他工具
  },
  
  // 樣式
  styles: {
    projectStyles,
  },
  
  // 常數
  constants: {
    PROJECT_STATUS_OPTIONS,
    PROJECT_TYPE_OPTIONS,
    // ... 其他常數
  },
};

export default ProjectModule;
