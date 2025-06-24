// 用戶相關型別
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  metadata: {
    creationTime: string;
    lastSignInTime: string;
  };
}

// 權限管理相關型別
export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  category: 'finance' | 'project' | 'settings' | 'user' | 'system' | 'navigation';
}

export interface Role {
  id: string;
  name: string;
  description: string;
  level: number; // 0: 擁有者, 99: 訪客
  permissions: string[]; // Permission IDs
  isCustom: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface UserRole {
  uid: string;
  roleId: string;
  assignedBy: string;
  assignedAt: string;
  expiresAt?: string; // 可選的過期時間
  isActive: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  alias?: string; // 別名
  photoURL?: string;
  roleId: string;
  department?: string;
  position?: string;
  phone?: string;
  lineId?: string; // Line ID
  skills?: string[]; // 技能標籤陣列
  points?: number; // 積分
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
  loginCount: number;
  lastActivityAt?: string; // 最後活動時間
  isOnline?: boolean; // 是否在線
}

// 權限檢查結果
export interface PermissionCheck {
  hasPermission: boolean;
  role: Role | null;
  userProfile: UserProfile | null;
}

// 環境變數型別
export interface EnvironmentConfig {
  OWNER_UID: string;
  DEFAULT_ROLE_ID: string;
  GUEST_ROLE_ID: string;
  ONLINE_TIMEOUT_MINUTES: number;
}

// 權限矩陣型別
export interface PermissionMatrix {
  [roleId: string]: {
    [permissionId: string]: boolean;
  };
}

// 資料範圍控制型別
export interface DataScope {
  uid: string;
  scope: 'all' | 'department' | 'own' | 'none';
  departments?: string[];
  projects?: string[];
}
