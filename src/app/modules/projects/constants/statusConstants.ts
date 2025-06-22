import type { 
  ProjectStatus, 
  PriorityLevel, 
  ProjectHealthLevel, 
  ProjectPhase 
} from '../types';

// ============================================================================
// 狀態標籤
// ============================================================================

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: '規劃中',
  approved: '已核准',
  'in-progress': '執行中',
  'on-hold': '暫停中',
  completed: '已完成',
  cancelled: '已取消',
  archived: '已封存',
};

export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '緊急',
};

export const RISK_LEVEL_LABELS: Record<PriorityLevel, string> = {
  low: '低風險',
  medium: '中風險',
  high: '高風險',
  critical: '極高風險',
};

export const HEALTH_LEVEL_LABELS: Record<ProjectHealthLevel, string> = {
  excellent: '優秀',
  good: '良好',
  fair: '一般',
  poor: '不佳',
  critical: '危急',
};

export const PHASE_LABELS: Record<ProjectPhase, string> = {
  initiation: '啟動',
  planning: '規劃',
  execution: '執行',
  monitoring: '監控',
  closure: '收尾',
};

// ============================================================================
// 狀態顏色
// ============================================================================

export const STATUS_COLORS: Record<ProjectStatus, string> = {
  planning: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  'in-progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  'on-hold': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
};

export const PRIORITY_COLORS: Record<PriorityLevel, string> = {
  low: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
};

export const RISK_LEVEL_COLORS: Record<PriorityLevel, string> = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
};

export const HEALTH_LEVEL_COLORS: Record<ProjectHealthLevel, string> = {
  excellent: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  good: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  fair: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  poor: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
};

// ============================================================================
// 狀態圖示
// ============================================================================

export const STATUS_ICONS: Record<ProjectStatus, string> = {
  planning: '📋',
  approved: '✅',
  'in-progress': '🚀',
  'on-hold': '⏸️',
  completed: '🎉',
  cancelled: '❌',
  archived: '📦',
};

export const PRIORITY_ICONS: Record<PriorityLevel, string> = {
  low: '🔽',
  medium: '➡️',
  high: '🔼',
  critical: '🚨',
};

export const RISK_LEVEL_ICONS: Record<PriorityLevel, string> = {
  low: '🟢',
  medium: '🟡',
  high: '🟠',
  critical: '🔴',
};

export const HEALTH_LEVEL_ICONS: Record<ProjectHealthLevel, string> = {
  excellent: '🟢',
  good: '🔵',
  fair: '🟡',
  poor: '🟠',
  critical: '🔴',
}; 