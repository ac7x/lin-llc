import type { Permission, NavPermission } from '@/types/settings';

export const DEFAULT_PERMISSIONS: Permission[] = [
  // 專案管理權限
  { id: 'project.view', name: '查看專案', description: '允許查看專案列表和詳情', category: '專案管理' },
  { id: 'project.create', name: '建立專案', description: '允許建立新專案', category: '專案管理' },
  { id: 'project.edit', name: '編輯專案', description: '允許編輯專案資訊', category: '專案管理' },
  { id: 'project.delete', name: '刪除專案', description: '允許刪除專案', category: '專案管理' },
  
  // 工作包管理權限
  { id: 'workpackage.view', name: '查看工作包', description: '允許查看工作包列表和詳情', category: '工作包管理' },
  { id: 'workpackage.create', name: '建立工作包', description: '允許建立新工作包', category: '工作包管理' },
  { id: 'workpackage.edit', name: '編輯工作包', description: '允許編輯工作包資訊', category: '工作包管理' },
  { id: 'workpackage.delete', name: '刪除工作包', description: '允許刪除工作包', category: '工作包管理' },
  
  // 財務管理權限
  { id: 'finance.view', name: '查看財務', description: '允許查看財務相關資訊', category: '財務管理' },
  { id: 'finance.create', name: '建立財務記錄', description: '允許建立財務記錄', category: '財務管理' },
  { id: 'finance.edit', name: '編輯財務記錄', description: '允許編輯財務記錄', category: '財務管理' },
  { id: 'finance.delete', name: '刪除財務記錄', description: '允許刪除財務記錄', category: '財務管理' },
  
  // 用戶管理權限
  { id: 'user.view', name: '查看用戶', description: '允許查看用戶列表和詳情', category: '用戶管理' },
  { id: 'user.create', name: '建立用戶', description: '允許建立新用戶', category: '用戶管理' },
  { id: 'user.edit', name: '編輯用戶', description: '允許編輯用戶資訊', category: '用戶管理' },
  { id: 'user.delete', name: '刪除用戶', description: '允許刪除用戶', category: '用戶管理' },
  
  // 系統管理權限
  { id: 'system.view', name: '查看系統設定', description: '允許查看系統設定', category: '系統管理' },
  { id: 'system.edit', name: '編輯系統設定', description: '允許編輯系統設定', category: '系統管理' },

  // 通知管理權限
  { id: 'notification.view', name: '查看通知', description: '允許查看所有系統通知', category: '通知管理' },
  { id: 'notification.create', name: '建立通知', description: '允許建立新的系統通知', category: '通知管理' },
  { id: 'notification.edit', name: '編輯通知', description: '允許編輯現有系統通知', category: '通知管理' },
  { id: 'notification.delete', name: '刪除通知', description: '允許刪除系統通知', category: '通知管理' },
  { id: 'notification.settings', name: '通知設定', description: '允許管理系統通知設定', category: '通知管理' },
  { id: 'notification.broadcast', name: '廣播通知', description: '允許發送廣播通知給所有用戶', category: '通知管理' },
  { id: 'notification.target', name: '定向通知', description: '允許發送通知給特定用戶或群組', category: '通知管理' },
  { id: 'notification.template', name: '通知模板', description: '允許管理通知模板', category: '通知管理' },
  { id: 'notification.emergency', name: '緊急通知', description: '允許發送緊急通知', category: '通知管理' },
  { id: 'notification.schedule', name: '排程通知', description: '允許設定排程通知', category: '通知管理' },
  { id: 'notification.analytics', name: '通知分析', description: '允許查看通知統計和分析', category: '通知管理' },
  { id: 'notification.profile', name: '個人通知設定', description: '允許管理個人通知偏好設定', category: '通知管理' },
  { id: 'notification.send', name: '發送通知', description: '允許訪問發送通知頁面', category: '通知管理' },
  { id: 'notification.archive', name: '通知封存', description: '允許管理通知封存', category: '通知管理' },
  { id: 'notification.retention', name: '通知保留', description: '允許設定通知保留期限', category: '通知管理' },
];

export const DEFAULT_NAV_PERMISSIONS: NavPermission[] = [
  { 
    id: 'profile', 
    name: '個人檔案', 
    description: '允許訪問個人檔案頁面', 
    defaultRoles: ['user'] 
  },
  { 
    id: 'dashboard', 
    name: '儀表板', 
    description: '允許訪問儀表板頁面', 
    defaultRoles: ['owner'] 
  },
  { 
    id: 'projects', 
    name: '專案', 
    description: '允許訪問專案管理頁面', 
    defaultRoles: ['admin', 'owner', 'foreman', 'coord'] 
  },
  { 
    id: 'schedule', 
    name: '行程', 
    description: '允許訪問行程管理頁面', 
    defaultRoles: ['admin', 'owner', 'foreman', 'coord'] 
  },
  { 
    id: 'calendar', 
    name: '日曆', 
    description: '允許訪問日曆頁面', 
    defaultRoles: ['admin', 'owner', 'foreman', 'coord'] 
  },
  { 
    id: 'quotes', 
    name: '估價單', 
    description: '允許訪問估價單頁面', 
    defaultRoles: ['owner', 'finance'] 
  },
  { 
    id: 'contracts', 
    name: '合約', 
    description: '允許訪問合約頁面', 
    defaultRoles: ['owner', 'finance'] 
  },
  { 
    id: 'orders', 
    name: '訂單', 
    description: '允許訪問訂單頁面', 
    defaultRoles: ['owner', 'finance'] 
  },
  { 
    id: 'expenses', 
    name: '支出', 
    description: '允許訪問支出頁面', 
    defaultRoles: ['owner', 'finance'] 
  },
  { 
    id: 'gemini', 
    name: 'Gemini', 
    description: '允許訪問Gemini頁面', 
    defaultRoles: ['user'] 
  },
  { 
    id: 'notifications', 
    name: '通知', 
    description: '允許訪問通知頁面', 
    defaultRoles: ['user'] 
  },
  { 
    id: 'send-notification', 
    name: '發送通知', 
    description: '允許訪問發送通知頁面', 
    defaultRoles: ['owner', 'admin'] 
  },
  { 
    id: 'users', 
    name: '用戶管理', 
    description: '允許訪問用戶管理頁面', 
    defaultRoles: ['owner'] 
  },
  { 
    id: 'settings', 
    name: '設定', 
    description: '允許訪問設定頁面', 
    defaultRoles: ['owner'] 
  },
  { 
    id: 'archive', 
    name: '封存', 
    description: '允許訪問封存頁面', 
    defaultRoles: ['owner'] 
  },
];

export function getDefaultPermissionsForRole(role: string): string[] {
  const basePermissions = ['project.view', 'workpackage.view', 'dashboard.view'];
  const notificationBasePermissions = [
    'notification.view',
    'notification.settings',
    'notification.profile'
  ];
  
  switch (role) {
    case 'owner':
      return DEFAULT_PERMISSIONS.map(p => p.id);
    case 'admin':
      return [
        ...DEFAULT_PERMISSIONS
          .filter(p => !p.id.includes('system.'))
          .map(p => p.id),
        'notification.settings',
        'notification.broadcast',
        'notification.target',
        'notification.template',
        'notification.emergency',
        'notification.schedule',
        'notification.analytics',
        'notification.send',
        'notification.archive',
        'notification.retention'
      ];
    case 'finance':
      return [
        ...basePermissions, 
        'finance.view', 
        'finance.create', 
        'finance.edit',
        'dashboard.analytics',
        'dashboard.export',
        ...notificationBasePermissions,
        'notification.target',
        'notification.schedule',
        'notification.send'
      ];
    case 'foreman':
      return [
        ...basePermissions, 
        'workpackage.create', 
        'workpackage.edit',
        'dashboard.analytics',
        ...notificationBasePermissions,
        'notification.create',
        'notification.target',
        'notification.emergency',
        'notification.send'
      ];
    case 'coord':
      return [
        ...basePermissions, 
        'workpackage.create', 
        'workpackage.edit',
        'dashboard.analytics',
        ...notificationBasePermissions,
        'notification.create',
        'notification.target',
        'notification.schedule',
        'notification.send'
      ];
    case 'safety':
      return [
        ...basePermissions, 
        'workpackage.view',
        'dashboard.analytics',
        ...notificationBasePermissions,
        'notification.create',
        'notification.emergency',
        'notification.send'
      ];
    case 'vendor':
      return [
        ...basePermissions, 
        'workpackage.view',
        ...notificationBasePermissions
      ];
    case 'helper':
      return [
        ...basePermissions,
        ...notificationBasePermissions
      ];
    case 'temporary':
      return [
        ...basePermissions,
        ...notificationBasePermissions
      ];
    case 'user':
      return [
        ...basePermissions,
        ...notificationBasePermissions
      ];
    default:
      return [...basePermissions, ...notificationBasePermissions];
  }
} 