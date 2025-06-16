/**
 * Firebase 相關常數定義
 * 包含集合名稱、配置等常數
 */

// Collection 名稱常數
export const COLLECTIONS = {
    NOTIFICATIONS: 'notifications',
    USERS: 'users',
    PROJECTS: 'projects',
    WORKPACKAGES: 'workpackages',
    TASKS: 'tasks',
    REPORTS: 'reports',
    EXPENSES: 'expenses',
    MATERIALS: 'materials',
    ZONES: 'zones',
    TEMPLATES: 'templates',
    SETTINGS: 'settings',
  } as const;
  
  // 集合名稱型別
  export type CollectionKey = keyof typeof COLLECTIONS;