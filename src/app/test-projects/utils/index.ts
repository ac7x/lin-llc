/**
 * 工具函數匯出檔案
 * 統一匯出所有專案相關的工具函數
 */

// 進度相關 - 從 types 檔案導入核心計算函數
export {
  calculateProjectProgress,
  calculateWorkpackageProgress,
} from '../types';

// 進度相關 - 從 progressUtils 導入顯示組件
export {
  getProgressColor,
  ProjectProgressPercent,
  ProgressBar,
  ProgressBarWithPercent,
  ProjectHealthIndicator,
} from './progressUtils';

// 專案相關
export {
  calculateSchedulePerformanceIndex,
  calculateCostPerformanceIndex,
  calculateProjectRiskLevel,
  getHighRiskItems,
  calculateProjectQualityScore,
  calculateWorkpackageQualityScore,
  getUpcomingMilestones,
  getOverdueMilestones,
  calculateProjectHealthScore,
  analyzeProjectStatusTrend,
  calculateProjectPriorityScore,
} from './projectUtils';

// 品質相關
export {
  calculateQualityScore,
  updateQualityScore,
  getQualityTrend,
} from './qualityUtils';

// 風險相關
export {
  calculateRiskScore,
  getRiskLevel,
  getRiskTrend,
} from './riskUtils';

// 日期相關
export {
  convertToDate,
  formatProjectDate,
  calculateProjectDuration,
  isProjectOverdue,
  getProjectsInDateRange,
} from './dateUtils'; 