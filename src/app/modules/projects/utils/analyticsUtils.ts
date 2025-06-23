/**
 * 專案分析工具函數
 * 
 * 提供專案分析相關的工具函數：
 * - 數據格式化
 * - 圖表配置
 * - 統計計算
 * - 視覺化輔助
 */

import type { 
  AnalyticsData, 
  MonthlyTrend, 
  StatusDistribution, 
  TypeDistribution,
  PerformanceMetrics 
} from '../hooks/useProjectAnalytics';

// 圖表顏色配置
export const CHART_COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981',
  tertiary: '#F59E0B',
  danger: '#EF4444',
  warning: '#F97316',
  success: '#22C55E',
  info: '#06B6D4',
  gray: '#6B7280',
  
  // 漸層色系
  blue: ['#DBEAFE', '#93C5FD', '#3B82F6', '#1D4ED8'],
  green: ['#D1FAE5', '#6EE7B7', '#10B981', '#047857'],
  orange: ['#FED7AA', '#FDBA74', '#F59E0B', '#D97706'],
  red: ['#FEE2E2', '#FCA5A5', '#EF4444', '#DC2626'],
  purple: ['#EDE9FE', '#C4B5FD', '#8B5CF6', '#7C3AED'],
  
  // 狀態顏色
  status: {
    planning: '#6B7280',
    approved: '#3B82F6',
    'in-progress': '#F59E0B',
    completed: '#10B981',
    cancelled: '#EF4444',
    'on-hold': '#8B5CF6',
    archived: '#6B7280',
  } as const,
  
  // 優先級顏色
  priority: {
    low: '#10B981',
    medium: '#F59E0B',
    high: '#F97316',
    critical: '#EF4444',
  } as const,
} as const;

/**
 * 格式化數字為千分位顯示
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('zh-TW').format(num);
}

/**
 * 格式化貨幣
 */
export function formatCurrency(amount: number, currency: string = 'TWD'): string {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * 格式化百分比
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * 格式化日期
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('zh-TW');
}

/**
 * 格式化日期時間
 */
export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString('zh-TW');
}

/**
 * 計算時間差
 */
export function getTimeDifference(date: Date | string): string {
  const now = new Date();
  const target = new Date(date);
  const diff = now.getTime() - target.getTime();
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return `${days} 天前`;
  } else if (hours > 0) {
    return `${hours} 小時前`;
  } else if (minutes > 0) {
    return `${minutes} 分鐘前`;
  } else {
    return '剛剛';
  }
}

/**
 * 格式化狀態顯示
 */
export function formatStatus(status: string): string {
  const statusNames: Record<string, string> = {
    planning: '規劃中',
    approved: '已核准',
    'in-progress': '進行中',
    completed: '已完成',
    cancelled: '已取消',
    'on-hold': '暫停',
    archived: '已封存',
  };
  
  return statusNames[status] || status;
}

/**
 * 格式化專案類型
 */
export function formatProjectType(type: string): string {
  const typeNames: Record<string, string> = {
    system: '系統專案',
    maintenance: '維護專案',
    transport: '運輸專案',
    construction: '建設專案',
    development: '開發專案',
  };
  
  return typeNames[type] || type;
}

/**
 * 取得狀態顏色
 */
export function getStatusColor(status: string): string {
  return CHART_COLORS.status[status as keyof typeof CHART_COLORS.status] || CHART_COLORS.gray;
}

/**
 * 取得優先級顏色
 */
export function getPriorityColor(priority: string): string {
  return CHART_COLORS.priority[priority as keyof typeof CHART_COLORS.priority] || CHART_COLORS.gray;
}

/**
 * 計算進度等級
 */
export function getProgressLevel(progress: number): {
  level: 'excellent' | 'good' | 'fair' | 'poor';
  label: string;
  color: string;
} {
  if (progress >= 90) {
    return { level: 'excellent', label: '優秀', color: CHART_COLORS.success };
  } else if (progress >= 70) {
    return { level: 'good', label: '良好', color: CHART_COLORS.info };
  } else if (progress >= 50) {
    return { level: 'fair', label: '一般', color: CHART_COLORS.warning };
  } else {
    return { level: 'poor', label: '需改善', color: CHART_COLORS.danger };
  }
}

/**
 * 計算品質等級
 */
export function getQualityLevel(quality: number): {
  level: 'excellent' | 'good' | 'fair' | 'poor';
  label: string;
  color: string;
} {
  if (quality >= 85) {
    return { level: 'excellent', label: '優秀', color: CHART_COLORS.success };
  } else if (quality >= 70) {
    return { level: 'good', label: '良好', color: CHART_COLORS.info };
  } else if (quality >= 50) {
    return { level: 'fair', label: '一般', color: CHART_COLORS.warning };
  } else {
    return { level: 'poor', label: '需改善', color: CHART_COLORS.danger };
  }
}

/**
 * 計算績效等級
 */
export function getPerformanceLevel(performance: number): {
  level: 'excellent' | 'good' | 'fair' | 'poor';
  label: string;
  color: string;
} {
  if (performance >= 80) {
    return { level: 'excellent', label: '優秀', color: CHART_COLORS.success };
  } else if (performance >= 60) {
    return { level: 'good', label: '良好', color: CHART_COLORS.info };
  } else if (performance >= 40) {
    return { level: 'fair', label: '一般', color: CHART_COLORS.warning };
  } else {
    return { level: 'poor', label: '需改善', color: CHART_COLORS.danger };
  }
}

/**
 * 生成圓餅圖數據
 */
export function generatePieChartData(data: StatusDistribution[] | TypeDistribution[]) {
  return data.map((item, index) => ({
    name: 'status' in item ? formatStatus(item.status) : formatProjectType(item.type),
    value: item.count,
    color: CHART_COLORS.blue[index % CHART_COLORS.blue.length],
  }));
}

/**
 * 生成柱狀圖數據
 */
export function generateBarChartData(trends: MonthlyTrend[]) {
  return trends.map((trend, index) => ({
    month: trend.month,
    projects: trend.projects,
    progress: trend.progress,
    quality: trend.quality,
    color: CHART_COLORS.blue[index % CHART_COLORS.blue.length],
  }));
}

/**
 * 生成線圖數據
 */
export function generateLineChartData(trends: MonthlyTrend[]) {
  return trends.map((trend, index) => ({
    month: trend.month,
    progress: trend.progress,
    quality: trend.quality,
    projects: trend.projects,
  }));
}

/**
 * 計算統計摘要
 */
export function calculateSummaryStats(data: AnalyticsData) {
  return {
    totalValue: formatCurrency(data.totalBudget),
    averageProgress: formatPercentage(data.averageProgress),
    averageQuality: formatPercentage(data.averageQualityScore),
    completionRate: formatPercentage(
      data.totalProjects > 0 ? (data.completedProjects / data.totalProjects) * 100 : 0
    ),
    onTimeRate: formatPercentage(
      data.totalProjects > 0 ? (data.onTimeProjects / data.totalProjects) * 100 : 0
    ),
  };
}

/**
 * 生成績效指標卡片數據
 */
export function generatePerformanceCards(metrics: PerformanceMetrics) {
  return [
    {
      title: '時程績效',
      value: formatPercentage(metrics.schedulePerformanceIndex),
      color: getPerformanceLevel(metrics.schedulePerformanceIndex).color,
      icon: '📅',
    },
    {
      title: '成本績效',
      value: formatPercentage(metrics.costPerformanceIndex),
      color: getPerformanceLevel(metrics.costPerformanceIndex).color,
      icon: '💰',
    },
    {
      title: '品質績效',
      value: formatPercentage(metrics.qualityPerformanceIndex),
      color: getPerformanceLevel(metrics.qualityPerformanceIndex).color,
      icon: '⭐',
    },
    {
      title: '整體績效',
      value: formatPercentage(metrics.overallPerformance),
      color: getPerformanceLevel(metrics.overallPerformance).color,
      icon: '📊',
    },
  ];
}

/**
 * 生成趨勢分析
 */
export function generateTrendAnalysis(trends: MonthlyTrend[]) {
  if (trends.length < 2) return null;

  const recentTrends = trends.slice(-3);
  const progressTrend = recentTrends.map(t => t.progress);
  const qualityTrend = recentTrends.map(t => t.quality);

  const progressChange = progressTrend[progressTrend.length - 1] - progressTrend[0];
  const qualityChange = qualityTrend[qualityTrend.length - 1] - qualityTrend[0];

  return {
    progress: {
      change: progressChange,
      trend: progressChange > 0 ? 'up' : progressChange < 0 ? 'down' : 'stable',
      percentage: Math.abs(progressChange),
    },
    quality: {
      change: qualityChange,
      trend: qualityChange > 0 ? 'up' : qualityChange < 0 ? 'down' : 'stable',
      percentage: Math.abs(qualityChange),
    },
  };
}

/**
 * 生成建議
 */
export function generateRecommendations(data: AnalyticsData) {
  const recommendations: string[] = [];

  // 進度建議
  if (data.averageProgress < 50) {
    recommendations.push('專案平均進度偏低，建議加強進度管理');
  }
  if (data.delayedProjects > data.onTimeProjects) {
    recommendations.push('延遲專案數量較多，建議檢討時程規劃');
  }

  // 品質建議
  if (data.averageQualityScore < 70) {
    recommendations.push('專案平均品質分數偏低，建議加強品質管控');
  }
  if (data.lowQualityProjects > data.highQualityProjects) {
    recommendations.push('低品質專案數量較多，建議檢討品質管理流程');
  }

  // 成本建議
  if (data.budgetUtilization > 90) {
    recommendations.push('預算利用率偏高，建議檢討成本控制');
  }

  // 一般建議
  if (data.totalProjects === 0) {
    recommendations.push('尚無專案資料，建議開始建立專案');
  }

  return recommendations;
}

/**
 * 驗證分析數據
 */
export function validateAnalyticsData(data: AnalyticsData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (data.totalProjects < 0) {
    errors.push('總專案數不能為負數');
  }

  if (data.averageProgress < 0 || data.averageProgress > 100) {
    errors.push('平均進度必須在 0-100 之間');
  }

  if (data.averageQualityScore < 0 || data.averageQualityScore > 100) {
    errors.push('平均品質分數必須在 0-100 之間');
  }

  if (data.totalBudget < 0) {
    errors.push('總預算不能為負數');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 生成報表標題
 */
export function generateReportTitle(type: 'summary' | 'detailed' | 'trend', dateRange?: string): string {
  const baseTitle = '專案分析報表';
  
  switch (type) {
    case 'summary':
      return `${baseTitle} - 摘要`;
    case 'detailed':
      return `${baseTitle} - 詳細分析`;
    case 'trend':
      return `${baseTitle} - 趨勢分析`;
    default:
      return baseTitle;
  }
}

/**
 * 生成報表描述
 */
export function generateReportDescription(data: AnalyticsData, dateRange?: string): string {
  const totalProjects = data.totalProjects;
  const activeProjects = data.activeProjects;
  const completedProjects = data.completedProjects;
  const averageProgress = data.averageProgress;

  return `本報表涵蓋 ${totalProjects} 個專案，其中 ${activeProjects} 個進行中，${completedProjects} 個已完成。整體平均進度為 ${averageProgress}%。${dateRange ? `分析期間：${dateRange}` : ''}`;
}
