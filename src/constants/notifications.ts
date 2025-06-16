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
