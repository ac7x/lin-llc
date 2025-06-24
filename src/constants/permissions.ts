import type { RoleKey } from './roles';

// 所有可用權限定義
export const ALL_PERMISSIONS = [
  // 基本權限
  { id: 'dashboard', name: '儀表板', description: '查看儀表板' },
  { id: 'profile', name: '個人資料', description: '管理個人資料' },
  
  // 行事曆功能
  { id: 'calendar', name: '行事曆', description: '查看和管理行事曆' },
  
  // AI 功能
  { id: 'gemini', name: 'AI 助手', description: '使用 Gemini AI 進行對話和檔案分析' },
  
  // 專案管理
  { id: 'projects', name: '專案管理', description: '管理專案相關功能' },
  { id: 'projects-create', name: '建立專案', description: '建立新專案' },
  { id: 'projects-edit', name: '編輯專案', description: '編輯專案資訊' },
  { id: 'projects-delete', name: '刪除專案', description: '刪除專案' },
  
  // 排程管理
  { id: 'schedule', name: '排程管理', description: '管理排程相關功能' },
  
  // 財務管理
  { id: 'orders', name: '訂單管理', description: '管理訂單相關功能' },
  { id: 'quotes', name: '報價管理', description: '管理報價相關功能' },
  { id: 'contracts', name: '合約管理', description: '管理合約相關功能' },
  
  // 封存功能
  { id: 'archive', name: '封存功能', description: '封存功能開關' },
  { id: 'archive-orders', name: '封存訂單', description: '查看和管理封存訂單' },
  { id: 'archive-quotes', name: '封存估價單', description: '查看和管理封存估價單' },
  { id: 'archive-contracts', name: '封存合約', description: '查看和管理封存合約' },
  { id: 'archive-projects', name: '封存專案', description: '查看和管理封存專案' },
  
  // 系統管理
  { id: 'notifications', name: '通知管理', description: '管理通知相關功能' },
  { id: 'send-notification', name: '發送通知', description: '發送系統通知' },
  { id: 'management', name: '系統管理', description: '管理系統設置和權限' },
  { id: 'settings', name: '系統設定', description: '管理角色和權限設定' },
] as const;

// 權限ID類型
export type PermissionId = typeof ALL_PERMISSIONS[number]['id'];

// 簡化的角色權限定義
export const ROLE_PERMISSIONS: Record<RoleKey, PermissionId[]> = {
  owner: [
    'dashboard',
    'profile',
    'calendar',
    'gemini',
    'projects',
    'projects-create',
    'projects-edit',
    'projects-delete',
    'schedule',
    'orders',
    'quotes',
    'contracts',
    'archive',
    'archive-orders',
    'archive-quotes',
    'archive-contracts',
    'archive-projects',
    'notifications',
    'send-notification',
    'management',
    'settings',
  ],
  guest: [
    'dashboard',
    'profile',
  ],
} as const;

// 權限分類（用於UI顯示）
export const PERMISSION_CATEGORIES = {
  basic: ['dashboard', 'profile'],
  planning: ['calendar', 'schedule'],
  projects: ['projects', 'projects-create', 'projects-edit', 'projects-delete'],
  finance: ['orders', 'quotes', 'contracts'],
  archive: ['archive', 'archive-orders', 'archive-quotes', 'archive-contracts', 'archive-projects'],
  system: ['management', 'settings', 'send-notification'],
  ai: ['gemini'],
  notifications: ['notifications'],
} as const;

// 取得權限名稱
export const getPermissionName = (permissionId: string): string => {
  const permission = ALL_PERMISSIONS.find(p => p.id === permissionId);
  return permission?.name || permissionId;
};

// 取得權限描述
export const getPermissionDescription = (permissionId: string): string => {
  const permission = ALL_PERMISSIONS.find(p => p.id === permissionId);
  return permission?.description || '';
};
