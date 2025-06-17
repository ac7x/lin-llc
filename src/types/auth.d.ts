import { type User } from 'firebase/auth';
import { type RoleKey } from '@/constants/roles';

// 基本權限介面
export interface Permission {
  id: string;
  name: string;
  description: string;
  path: string;
}

// 角色權限介面
export interface RolePermission {
  role: RoleKey;
  pagePermissions: Permission[];
  updatedAt: string;
}

// 擴展 Firebase User 型別
export interface AppUser extends User {
  currentRole?: RoleKey;
  rolePermissions?: Record<RoleKey, Record<string, boolean>>;
}

// 權限驗證結果介面
export interface AuthResult {
  isAuthenticated: boolean;
  hasPermission: boolean;
  user: AppUser | null;
  error?: string;
}

// 權限檢查選項介面
export interface PermissionCheckOptions {
  requiredRole?: RoleKey;
  requiredPermissions?: string[];
  checkAll?: boolean;
}

// 權限驗證錯誤型別
export type AuthError = {
  code: string;
  message: string;
  details?: unknown;
};

// 權限驗證狀態型別
export type AuthState = {
  user: AppUser | null;
  loading: boolean;
  error: AuthError | null;
};

// 權限驗證 Hook 回傳值介面
export interface UseAuthReturn {
  user: AppUser | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  checkPermission: (options: PermissionCheckOptions) => Promise<boolean>;
  hasPermission: (permissionId: string) => Promise<boolean>;
  getCurrentRole: () => RoleKey | undefined;
  getRolePermissions: () => Record<RoleKey, Record<string, boolean>> | undefined;
}

// 權限驗證上下文型別
export interface AuthContextType extends UseAuthReturn {
  signOut: () => Promise<void>;
  updateUserRole: (role: RoleKey) => Promise<void>;
  updateUserPermissions: (permissions: Record<RoleKey, boolean>) => Promise<void>;
}
