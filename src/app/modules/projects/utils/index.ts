/**
 * 工具函數匯出檔案
 * 統一匯出所有專案相關的工具函數
 */

// 進度相關 - 從 types 檔案導入核心計算函數
export {
  calculateProjectProgress,
  calculateWorkPackageProgress,
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
  calculateWorkPackageQualityScore,
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

// 分析相關
export {
  CHART_COLORS,
  formatNumber,
  formatCurrency,
  formatPercentage,
  formatDate as formatAnalyticsDate,
  formatDateTime as formatAnalyticsDateTime,
  getTimeDifference as getAnalyticsTimeDifference,
  formatStatus,
  formatProjectType,
  getStatusColor,
  getPriorityColor,
  getProgressLevel,
  getQualityLevel,
  getPerformanceLevel,
  generatePieChartData,
  generateBarChartData,
  generateLineChartData,
  calculateSummaryStats,
  generatePerformanceCards,
  generateTrendAnalysis,
  generateRecommendations,
  validateAnalyticsData,
  generateReportTitle,
  generateReportDescription,
} from './analyticsUtils';

// 日曆相關
export {
  formatDate as formatCalendarDate,
  formatTime,
  formatDateTime as formatCalendarDateTime,
  isSameDay,
  isSameWeek,
  isSameMonth,
  isSameYear,
  getMonthInfo,
  getWeekInfo,
  getMonthDays,
  getWeekDays,
  getDaysBetween,
  getWorkDaysBetween,
  isWorkDay,
  isWeekend,
  getNextWorkDay,
  getPreviousWorkDay,
  filterEventsByDateRange,
  filterEventsByDate,
  filterEventsByType,
  getTodayEvents,
  getUpcomingEvents,
  getOverdueEvents,
  getCalendarStats,
  getDateRangeLabel,
} from './calendarUtils';

// Gemini AI 相關
export {
  formatProjectForAI,
  formatWorkPackageForAI,
  formatIssuesForAI,
  formatWorkPackagesForAI,
  generateHealthAnalysisPrompt,
  generateWorkPackageAnalysisPrompt,
  generateRiskAnalysisPrompt,
  generateProgressReportPrompt,
  generateSuggestionsPrompt,
  generateQualityAnalysisPrompt,
  validateAIResponse,
  cleanAIResponse,
  extractJSONFromResponse,
} from './geminiUtils';

// 個人資料相關
export {
  formatUserDisplayName as formatProfileDisplayName,
  validateProfileData,
  getDefaultPreferences,
  getRoleDisplayName,
  formatDate as formatProfileDate,
} from './profileUtils';

// 時程相關
export {
  getScheduleItemStatus,
  getScheduleItemPriority,
  getDaysUntilDeadline,
  getScheduleItemDuration,
  getScheduleItemRemainingTime,
  getScheduleItemProgressPercentage,
  getScheduleItemElapsedTime,
  isCriticalPathItem,
  getScheduleItemFloat,
  getScheduleItemDependencies,
  getScheduleItemSuccessors,
  canScheduleItemStart,
  getScheduleItemEarliestStart,
  getScheduleItemLatestStart,
  getScheduleItemTotalFloat,
  isCriticalPathItemByFloat,
  getScheduleItemCompletionRate,
  getScheduleItemEfficiency,
  getScheduleItemStatusColor,
  getScheduleItemPriorityColor,
  formatScheduleItemDuration,
  formatScheduleItemRemainingTime,
  getScheduleItemRiskLevel,
} from './scheduleUtils';

// 類型匯出
export type { 
  DateRange,
  MonthInfo,
  WeekInfo,
} from './calendarUtils';

export type {
  ScheduleItemStatus,
  ScheduleItemPriority,
} from './scheduleUtils'; 