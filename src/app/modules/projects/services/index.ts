/**
 * 服務匯出檔案
 * 統一匯出所有專案相關的服務
 */

// 核心服務
export { ProjectService } from './projectService';
export { WorkPackageService } from './workpackageService copy';
export { JournalService } from './journalService';
export { IssueService } from './issueService';
export { TemplateService } from './templateService';

// 管理服務
export { AnalyticsService } from './analyticsService';

// 功能服務
export { CalendarService } from './calendarService';
export { ScheduleService } from './scheduleService';
export { GeminiService } from './geminiService';
export { ProfileService } from './profileService';

// 文件服務
export { 
  createDocument,
  updateDocument,
  uploadDocumentVersion,
  deleteDocument,
  getDocumentsByProjectId,
  getDocumentsByWorkPackageId,
  getDocumentVersions,
  searchDocuments,
  getDocumentStats,
  uploadDocumentToStorage
} from './documentService';

// 預算服務
export { 
  createBudgetFromWorkPackages,
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
  checkAndCreateAlerts
} from './budgetService';

// 子工作包服務
export { 
  createSubWorkPackage,
  updateSubWorkPackage,
  deleteSubWorkPackage,
  getSubWorkPackagesByWorkPackageId,
  getSubWorkPackagesByProjectId,
  updateSubWorkPackageProgress,
  createSubWorkPackagesFromTemplate,
  batchUpdateSubWorkPackageStatus,
  getSubWorkPackageStats
} from './subworkpackageService';

// 類型匯出
export type { UserProfile } from './profileService';
export type { CalendarEventData } from './calendarService';
export type { ScheduleItem, ScheduleDependency, ScheduleStats } from './scheduleService';
export type { DocumentFile, DocumentUploadData } from './documentService';
export type { 
  ProjectAnalysisResult,
  WorkPackageAnalysisResult,
  RiskAnalysisResult,
  ProgressReportResult
} from './geminiService'; 