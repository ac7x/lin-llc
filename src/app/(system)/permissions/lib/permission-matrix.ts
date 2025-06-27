/**
 * 權限矩陣配置
 * 結構化的權限管理系統配置
 */

// 權限動作定義
export const PERMISSION_ACTIONS = {
  READ: 'read',
  WRITE: 'write', 
  DELETE: 'delete',
  CREATE: 'create',
  ADMIN: 'admin',
  ASSIGN: 'assign',
} as const;

// 權限類別定義
export const PERMISSION_CATEGORIES = {
  SYSTEM: 'system',
  SETTINGS: 'settings', 
  USER: 'user',
  FINANCE: 'finance',
  PROJECT: 'project',
  NAVIGATION: 'navigation',
  DASHBOARD: 'dashboard',
  NOTIFICATION: 'notification',
} as const;

// 角色層級定義
export const ROLE_LEVELS = {
  OWNER: 0,
  ADMIN: 1,
  MANAGER: 2,
  USER: 3,
  GUEST: 99,
} as const;

// 權限結構定義
export interface PermissionStructure {
  category: string;
  actions: string[];
  description: string;
  resources?: string[];
}

// 結構化權限配置
export const PERMISSION_MATRIX: Record<string, PermissionStructure> = {
  [PERMISSION_CATEGORIES.SYSTEM]: {
    category: PERMISSION_CATEGORIES.SYSTEM,
    actions: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.WRITE, PERMISSION_ACTIONS.ADMIN],
    description: '系統管理權限',
  },
  
  [PERMISSION_CATEGORIES.SETTINGS]: {
    category: PERMISSION_CATEGORIES.SETTINGS,
    actions: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.WRITE, PERMISSION_ACTIONS.ADMIN],
    description: '系統設定權限',
  },
  
  [PERMISSION_CATEGORIES.USER]: {
    category: PERMISSION_CATEGORIES.USER,
    actions: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.WRITE, PERMISSION_ACTIONS.DELETE, PERMISSION_ACTIONS.ADMIN],
    description: '用戶管理權限',
  },
  
  [PERMISSION_CATEGORIES.FINANCE]: {
    category: PERMISSION_CATEGORIES.FINANCE,
    actions: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.WRITE, PERMISSION_ACTIONS.DELETE, PERMISSION_ACTIONS.ADMIN],
    description: '財務管理權限',
  },
  
  [PERMISSION_CATEGORIES.PROJECT]: {
    category: PERMISSION_CATEGORIES.PROJECT,
    actions: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.WRITE, PERMISSION_ACTIONS.DELETE, PERMISSION_ACTIONS.CREATE, PERMISSION_ACTIONS.ADMIN, PERMISSION_ACTIONS.ASSIGN],
    description: '專案管理權限',
    resources: ['project', 'package', 'subpackage', 'task', 'member', 'settings'],
  },
  
  [PERMISSION_CATEGORIES.NAVIGATION]: {
    category: PERMISSION_CATEGORIES.NAVIGATION,
    actions: ['home', 'project', 'task', 'account', 'settings'],
    description: '導航權限控制',
  },
  
  [PERMISSION_CATEGORIES.DASHBOARD]: {
    category: PERMISSION_CATEGORIES.DASHBOARD,
    actions: [PERMISSION_ACTIONS.READ],
    description: '儀表板權限',
  },
  
  [PERMISSION_CATEGORIES.NOTIFICATION]: {
    category: PERMISSION_CATEGORIES.NOTIFICATION,
    actions: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.WRITE],
    description: '通知權限',
  },
};

// 角色權限映射
export const ROLE_PERMISSION_MAPPING = {
  owner: {
    level: ROLE_LEVELS.OWNER,
    name: '擁有者',
    description: '系統擁有者，擁有所有權限',
    permissions: 'ALL', // 特殊標記，表示擁有所有權限
  },
  
  admin: {
    level: ROLE_LEVELS.ADMIN,
    name: '管理員',
    description: '系統管理員，擁有大部分權限',
    permissions: [
      // 財務權限
      'finance:read', 'finance:write', 'finance:admin',
      
      // 專案權限 - 完整權限
      'project:read', 'project:write', 'project:delete', 'project:admin',
      'project:package:read', 'project:package:write', 'project:package:delete', 'project:package:create',
      'project:subpackage:read', 'project:subpackage:write', 'project:subpackage:delete', 'project:subpackage:create',
      'project:task:read', 'project:task:write', 'project:task:delete', 'project:task:create', 'project:task:assign',
      'project:member:read', 'project:member:write', 'project:member:add', 'project:member:remove',
      'project:settings:read', 'project:settings:write',
      
      // 用戶權限
      'user:read', 'user:write',
      
      // 設定權限
      'settings:read', 'settings:write',
      
      // 系統權限
      'system:read',
      
      // 導航權限
      'navigation:home', 'navigation:project', 'navigation:task', 'navigation:account', 'navigation:settings',
      
      // 儀表板權限
      'dashboard:read',
      
      // 通知權限
      'notification:read', 'notification:write',
    ],
  },
  
  manager: {
    level: ROLE_LEVELS.MANAGER,
    name: '經理',
    description: '部門經理，擁有部門管理權限',
    permissions: [
      // 財務權限 - 限制
      'finance:read', 'finance:write',
      
      // 專案權限 - 大部分權限
      'project:read', 'project:write',
      'project:package:read', 'project:package:write', 'project:package:create',
      'project:subpackage:read', 'project:subpackage:write', 'project:subpackage:create',
      'project:task:read', 'project:task:write', 'project:task:create', 'project:task:assign',
      'project:member:read', 'project:member:add',
      'project:settings:read',
      
      // 用戶權限 - 限制
      'user:read',
      
      // 設定權限 - 限制
      'settings:read',
      
      // 導航權限
      'navigation:home', 'navigation:project', 'navigation:task', 'navigation:account',
      
      // 儀表板權限
      'dashboard:read',
      
      // 通知權限
      'notification:read',
    ],
  },
  
  user: {
    level: ROLE_LEVELS.USER,
    name: '一般用戶',
    description: '一般用戶，擁有基本操作權限',
    permissions: [
      // 財務權限 - 僅查看
      'finance:read',
      
      // 專案權限 - 基本權限
      'project:read', 'project:write',
      'project:package:read', 'project:package:write', 'project:package:create',
      'project:subpackage:read', 'project:subpackage:write', 'project:subpackage:create',
      'project:task:read', 'project:task:write', 'project:task:create',
      'project:member:read',
      'project:settings:read',
      
      // 導航權限
      'navigation:home', 'navigation:project', 'navigation:task', 'navigation:account',
      
      // 儀表板權限
      'dashboard:read',
      
      // 通知權限
      'notification:read',
    ],
  },
  
  guest: {
    level: ROLE_LEVELS.GUEST,
    name: '訪客',
    description: '訪客用戶，僅有查看權限',
    permissions: [
      // 專案權限 - 僅查看
      'project:read',
      'project:package:read',
      'project:subpackage:read',
      'project:task:read',
      'project:member:read',
      
      // 導航權限 - 限制
      'navigation:home',
    ],
  },
};

// 權限生成工具
export class PermissionMatrixGenerator {
  /**
   * 生成完整權限 ID
   */
  static generatePermissionId(category: string, action: string, resource?: string): string {
    if (resource) {
      return `${category}:${resource}:${action}`;
    }
    return `${category}:${action}`;
  }
  
  /**
   * 解析權限 ID
   */
  static parsePermissionId(permissionId: string): {
    category: string;
    action: string;
    resource?: string;
  } {
    const parts = permissionId.split(':');
    if (parts.length === 3) {
      return {
        category: parts[0],
        resource: parts[1],
        action: parts[2],
      };
    }
    return {
      category: parts[0],
      action: parts[1],
    };
  }
  
  /**
   * 生成所有權限列表
   */
  static generateAllPermissions(): Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    action: string;
    resource?: string;
  }> {
    const permissions: Array<{
      id: string;
      name: string;
      description: string;
      category: string;
      action: string;
      resource?: string;
    }> = [];
    
    Object.entries(PERMISSION_MATRIX).forEach(([category, config]) => {
      config.actions.forEach(action => {
        if (config.resources) {
          // 如果有資源，為每個資源生成權限
          config.resources.forEach(resource => {
            const permissionId = this.generatePermissionId(category, action, resource);
            permissions.push({
              id: permissionId,
              name: `${this.getActionName(action)}${this.getResourceName(resource)}`,
              description: `${this.getActionName(action)}${this.getResourceName(resource)}資料`,
              category,
              action,
              resource,
            });
          });
        } else {
          // 直接生成權限
          const permissionId = this.generatePermissionId(category, action);
          permissions.push({
            id: permissionId,
            name: `${this.getActionName(action)}${this.getCategoryName(category)}`,
            description: `${this.getActionName(action)}${this.getCategoryName(category)}`,
            category,
            action,
          });
        }
      });
    });
    
    return permissions;
  }
  
  /**
   * 獲取動作名稱
   */
  private static getActionName(action: string): string {
    const actionNames: Record<string, string> = {
      read: '查看',
      write: '編輯',
      delete: '刪除',
      create: '創建',
      admin: '管理',
      assign: '指派',
      home: '首頁',
      project: '專案',
      task: '任務',
      account: '帳戶',
      settings: '設定',
    };
    return actionNames[action] || action;
  }
  
  /**
   * 獲取資源名稱
   */
  private static getResourceName(resource: string): string {
    const resourceNames: Record<string, string> = {
      project: '專案',
      package: '工作包',
      subpackage: '子工作包',
      task: '任務',
      member: '專案成員',
      settings: '專案設定',
    };
    return resourceNames[resource] || resource;
  }
  
  /**
   * 獲取類別名稱
   */
  private static getCategoryName(category: string): string {
    const categoryNames: Record<string, string> = {
      system: '系統',
      settings: '設定',
      user: '用戶',
      finance: '財務',
      project: '專案',
      navigation: '導航',
      dashboard: '儀表板',
      notification: '通知',
    };
    return categoryNames[category] || category;
  }
  
  /**
   * 檢查角色是否有權限
   */
  static hasRolePermission(roleId: string, permissionId: string): boolean {
    const role = ROLE_PERMISSION_MAPPING[roleId as keyof typeof ROLE_PERMISSION_MAPPING];
    if (!role) return false;
    
    // 擁有者擁有所有權限
    if (role.permissions === 'ALL') return true;
    
    // 檢查權限陣列
    return Array.isArray(role.permissions) && role.permissions.includes(permissionId);
  }
  
  /**
   * 獲取角色的所有權限
   */
  static getRolePermissions(roleId: string): string[] {
    const role = ROLE_PERMISSION_MAPPING[roleId as keyof typeof ROLE_PERMISSION_MAPPING];
    if (!role) return [];
    
    // 擁有者擁有所有權限
    if (role.permissions === 'ALL') {
      return this.generateAllPermissions().map(p => p.id);
    }
    
    return Array.isArray(role.permissions) ? role.permissions : [];
  }
  
  /**
   * 獲取權限矩陣
   */
  static getPermissionMatrix(): Record<string, Record<string, boolean>> {
    const matrix: Record<string, Record<string, boolean>> = {};
    const allPermissions = this.generateAllPermissions();
    
    Object.keys(ROLE_PERMISSION_MAPPING).forEach(roleId => {
      matrix[roleId] = {};
      allPermissions.forEach(permission => {
        matrix[roleId][permission.id] = this.hasRolePermission(roleId, permission.id);
      });
    });
    
    return matrix;
  }
  
  /**
   * 分析權限覆蓋率
   */
  static analyzePermissionCoverage(): {
    totalPermissions: number;
    rolesCoverage: Record<string, {
      permissionCount: number;
      coverage: number;
    }>;
  } {
    const allPermissions = this.generateAllPermissions();
    const totalPermissions = allPermissions.length;
    const rolesCoverage: Record<string, { permissionCount: number; coverage: number }> = {};
    
    Object.keys(ROLE_PERMISSION_MAPPING).forEach(roleId => {
      const rolePermissions = this.getRolePermissions(roleId);
      const permissionCount = rolePermissions.length;
      const coverage = (permissionCount / totalPermissions) * 100;
      
      rolesCoverage[roleId] = {
        permissionCount,
        coverage: Number(coverage.toFixed(2)),
      };
    });
    
    return {
      totalPermissions,
      rolesCoverage,
    };
  }
}

// 導出工具實例
export const permissionMatrixGenerator = new PermissionMatrixGenerator(); 