/**
 * 系統架構統一導出
 * 三層架構：認證層 + 權限層 + 資料層
 */

// === 認證層 (Auth Layer) ===
export { AuthProvider, useAuth } from './auth/context/auth-context';
export { useGoogleAuth } from './auth/hooks/use-google-auth';
export { useAuthRedirect } from './auth/hooks/use-auth-redirect';

// === 權限層 (Permissions Layer) ===
// 上下文和 Hooks
export { PermissionProvider, usePermissionContext } from './permissions/context/permission-context';
export { usePermission } from './permissions/hooks/use-permission';
export { usePermissionOptimized } from './permissions/hooks/use-permission-optimized';

// 組件
export { 
  PermissionGuard, 
  RoleGuard, 
  DataScopeGuard,
  ProjectPermissionGuard,
  ProjectActionGuard 
} from './permissions/components/permission-guard';
export { PermissionMatrixAnalyzer } from './permissions/components/permission-matrix-analyzer';

// 服務和工具
export { permissionService } from './permissions/lib/permission-service';
export { 
  PermissionMatrixGenerator,
  PERMISSION_ACTIONS,
  PERMISSION_CATEGORIES,
  ROLE_LEVELS,
  ROLE_PERMISSION_MAPPING
} from './permissions/lib/permission-matrix';
export { isOwner, getDefaultRoleId, envConfig, validateEnvConfig } from './permissions/lib/env-config';
export { initializePermissions, checkInitialization, DEFAULT_PERMISSIONS, DEFAULT_ROLES } from './permissions/lib/permission-init';

// 類型
export type {
  User,
  Permission,
  Role,
  UserRole,
  UserProfile,
  PermissionCheck,
  EnvironmentConfig,
  PermissionMatrix,
  DataScope
} from './permissions/types';

// === 資料層 (Data Layer) ===
export { 
  auth, 
  db, 
  storage, 
  analytics,
  appCheck,
  initializeClientServices,
  getAppCheck,
  getAppCheckSync,
  isFirebaseInitialized,
  getFirebaseConfig,
  isEmulatorEnvironment
} from './data/lib/firebase-init';

// === 系統架構統一導出 ===
// 提供清晰的三層架構導出，避免循環依賴問題 