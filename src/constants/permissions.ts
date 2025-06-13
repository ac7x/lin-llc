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
  { id: 'notification.view', name: '查看通知', description: '允許查看系統通知', category: '通知管理' },
  { id: 'notification.create', name: '建立通知', description: '允許建立新的系統通知', category: '通知管理' },
  { id: 'notification.edit', name: '編輯通知', description: '允許編輯系統通知', category: '通知管理' },
  { id: 'notification.delete', name: '刪除通知', description: '允許刪除系統通知', category: '通知管理' },
  { id: 'notification.settings', name: '通知設定', description: '允許管理通知設定和偏好', category: '通知管理' },
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
  const basePermissions = ['project.view', 'workpackage.view'];
  const notificationBasePermissions = ['notification.view'];
  
  switch (role) {
    case 'owner':
      return DEFAULT_PERMISSIONS.map(p => p.id);
    case 'admin':
      return [
        ...DEFAULT_PERMISSIONS
          .filter(p => !p.id.includes('system.'))
          .map(p => p.id),
        'notification.settings'
      ];
    case 'finance':
      return [
        ...basePermissions, 
        'finance.view', 
        'finance.create', 
        'finance.edit',
        ...notificationBasePermissions
      ];
    case 'foreman':
      return [
        ...basePermissions, 
        'workpackage.create', 
        'workpackage.edit',
        ...notificationBasePermissions,
        'notification.create'
      ];
    case 'coord':
      return [
        ...basePermissions, 
        'workpackage.create', 
        'workpackage.edit',
        ...notificationBasePermissions,
        'notification.create'
      ];
    case 'safety':
      return [
        ...basePermissions, 
        'workpackage.view',
        ...notificationBasePermissions,
        'notification.create'
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