import type { RoleKey } from './roles';

export const PAGE_PERMISSIONS = [
  // 基本權限
  {
    id: 'dashboard',
    name: '儀表板',
    description: '查看儀表板',
    path: '/dashboard',
  },
  {
    id: 'profile',
    name: '個人資料',
    description: '管理個人資料',
    path: '/account',
  },
  // 行事曆功能
  {
    id: 'calendar',
    name: '行事曆',
    description: '查看和管理行事曆',
    path: '/planning/calendar',
  },
  // AI 功能
  {
    id: 'gemini',
    name: 'AI 助手',
    description: '使用 Gemini AI 進行對話和檔案分析',
    path: '/gemini',
  },
  // 封存功能
  {
    id: 'archive',
    name: '封存功能',
    description: '封存功能開關',
    path: '/finance/archive',
  },
  {
    id: 'archive-orders',
    name: '封存訂單',
    description: '查看和管理封存訂單',
    path: '/finance/archive/orders',
  },
  {
    id: 'archive-quotes',
    name: '封存估價單',
    description: '查看和管理封存估價單',
    path: '/finance/archive/quotes',
  },
  {
    id: 'archive-contracts',
    name: '封存合約',
    description: '查看和管理封存合約',
    path: '/finance/archive/contracts',
  },
  {
    id: 'archive-projects',
    name: '封存專案',
    description: '查看和管理封存專案',
    path: '/finance/archive/projects',
  },
  {
    id: 'projects',
    name: '專案管理',
    description: '管理專案相關功能',
    path: '/projects',
  },
  {
    id: 'schedule',
    name: '排程管理',
    description: '管理排程相關功能',
    path: '/planning/schedule',
  },
  {
    id: 'orders',
    name: '訂單管理',
    description: '管理訂單相關功能',
    path: '/orders',
  },
  {
    id: 'quotes',
    name: '報價管理',
    description: '管理報價相關功能',
    path: '/quotes',
  },
  {
    id: 'contracts',
    name: '合約管理',
    description: '管理合約相關功能',
    path: '/contracts',
  },
  {
    id: 'notifications',
    name: '通知管理',
    description: '管理通知相關功能',
    path: '/account/notifications',
  },
  {
    id: 'send-notification',
    name: '發送通知',
    description: '發送系統通知',
    path: '/management/send-notification',
  },
  {
    id: 'management',
    name: '系統管理',
    description: '管理系統設置和權限',
    path: '/management',
  },
  {
    id: 'settings',
    name: '系統設定',
    description: '管理角色和權限設定',
    path: '/settings',
  },
] as const;

// 簡化的預設角色權限
export const DEFAULT_ROLE_PERMISSIONS: Record<RoleKey, readonly string[]> = {
  owner: [
    'dashboard',
    'profile',
    'archive',
    'archive-orders',
    'archive-quotes',
    'archive-contracts',
    'archive-projects',
    'projects',
    'schedule',
    'orders',
    'quotes',
    'contracts',
    'notifications',
    'send-notification',
    'management',
    'settings',
    'calendar',
    'gemini',
  ],
  guest: ['dashboard', 'profile'],
} as const;

// 權限分類
export const PERMISSION_CATEGORIES = {
  basic: ['dashboard', 'profile'],
  planning: ['calendar', 'schedule'],
  projects: ['projects'],
  finance: ['orders', 'quotes', 'contracts'],
  archive: ['archive', 'archive-orders', 'archive-quotes', 'archive-contracts', 'archive-projects'],
  system: ['management', 'settings', 'send-notification'],
  ai: ['gemini'],
  notifications: ['notifications'],
} as const;
