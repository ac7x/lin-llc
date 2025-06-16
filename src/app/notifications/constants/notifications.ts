export const NOTIFICATION_TYPES = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  SUCCESS: 'success',
} as const;

export const NOTIFICATION_CATEGORIES = {
  PROJECT: 'project',
  SCHEDULE: 'schedule',
  SYSTEM: 'system',
  WORK: 'work',
  EMERGENCY: 'emergency',
} as const;

export const NOTIFICATION_SETTINGS = {
  TYPES: {
    PROJECT_UPDATES: 'projectUpdates',
    SCHEDULE_CHANGES: 'scheduleChanges',
    SYSTEM_ALERTS: 'systemAlerts',
    WORK_PROGRESS: 'workProgress',
    EMERGENCY_ALERTS: 'emergencyAlerts',
  },
} as const;

export const NOTIFICATION_TEST_PRESETS = {
  success: {
    title: '專案完成',
    message: '專案 A 已成功完成所有階段，請檢視最終報告。',
    type: 'success' as const,
    category: 'project' as const,
  },
  warning: {
    title: '排程變更',
    message: '由於天氣因素，明日工程將延後進行，請注意調整排程。',
    type: 'warning' as const,
    category: 'schedule' as const,
  },
  error: {
    title: '系統錯誤',
    message: '檔案上傳失敗，請檢查網路連線後重試。',
    type: 'error' as const,
    category: 'system' as const,
  },
  info: {
    title: '工作提醒',
    message: '今日有 3 項待辦事項需要處理，請及時完成。',
    type: 'info' as const,
    category: 'work' as const,
  },
} as const;

export const NOTIFICATION_CATEGORY_TEXT = {
  project: '專案',
  schedule: '排程',
  system: '系統',
  work: '工作',
  emergency: '緊急',
} as const;
