/**
 * 專案相關常數定義
 * 包含專案狀態、類型、優先級等常數
 */

// 照片類型
export const PHOTO_TYPES = {
  PROGRESS: 'progress',
  ISSUE: 'issue',
  MATERIAL: 'material',
  SAFETY: 'safety',
  OTHER: 'other',
} as const;

export type PhotoType = typeof PHOTO_TYPES[keyof typeof PHOTO_TYPES];

// 工作包優先級
export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export type PriorityLevel = typeof PRIORITY_LEVELS[keyof typeof PRIORITY_LEVELS];

// 工作包狀態
export const WORKPACKAGE_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ON_HOLD: 'on_hold',
  CANCELLED: 'cancelled',
} as const;

export type WorkpackageStatus = typeof WORKPACKAGE_STATUS[keyof typeof WORKPACKAGE_STATUS];

// 工作包類別
export const WORKPACKAGE_CATEGORIES = {
  CONSTRUCTION: 'construction',
  RENOVATION: 'renovation',
  MAINTENANCE: 'maintenance',
  REPAIR: 'repair',
  OTHER: 'other',
} as const;

export type WorkpackageCategory = typeof WORKPACKAGE_CATEGORIES[keyof typeof WORKPACKAGE_CATEGORIES];

export const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
} as const;

export const ISSUE_TYPES = {
  QUALITY: 'quality',
  SAFETY: 'safety',
  PROGRESS: 'progress',
  OTHER: 'other',
} as const;

export const ISSUE_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export const ISSUE_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in-progress',
  RESOLVED: 'resolved',
} as const;

export const DOCUMENT_STATUS = {
  DRAFT: 'draft',
  ISSUED: 'issued',
  CANCELLED: 'cancelled',
} as const;

export const DOCUMENT_TYPES = {
  PAYMENT: '請款',
  EXPENSE: '支出',
} as const;
