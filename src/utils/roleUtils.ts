/**
 * 角色相關工具函數
 * 統一處理角色顯示名稱和權限檢查
 */

import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { ROLE_NAMES, type CustomRole } from '@/constants/roles';
import type { PermissionId } from '@/constants/permissions';

// 快取自訂角色，避免重複查詢
let customRolesCache: CustomRole[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5分鐘

/**
 * 載入自訂角色（帶快取）
 */
export async function loadCustomRoles(): Promise<CustomRole[]> {
  const now = Date.now();
  
  // 檢查快取是否有效
  if (customRolesCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return customRolesCache;
  }
  
  try {
    const rolesSnapshot = await getDocs(collection(db, 'customRoles'));
    const roles: CustomRole[] = [];
    rolesSnapshot.forEach(doc => {
      roles.push({ id: doc.id, ...doc.data() } as CustomRole);
    });
    
    // 更新快取
    customRolesCache = roles;
    cacheTimestamp = now;
    
    return roles;
  } catch (error) {
    console.error('Failed to load custom roles:', error);
    return [];
  }
}

/**
 * 取得角色顯示名稱
 */
export function getRoleDisplayName(roleId: string, customRoles?: CustomRole[]): string {
  // 檢查是否為標準角色
  if (roleId in ROLE_NAMES) {
    return ROLE_NAMES[roleId as keyof typeof ROLE_NAMES];
  }
  
  // 檢查是否為自訂角色
  if (customRoles) {
    const customRole = customRoles.find(r => r.id === roleId);
    return customRole ? customRole.name : roleId;
  }
  
  // 如果沒有提供 customRoles，嘗試使用快取
  if (customRolesCache) {
    const customRole = customRolesCache.find(r => r.id === roleId);
    return customRole ? customRole.name : roleId;
  }
  
  return roleId;
}

/**
 * 檢查是否為自訂角色
 */
export function isCustomRole(roleId: string, customRoles?: CustomRole[]): boolean {
  if (roleId in ROLE_NAMES) {
    return false;
  }
  
  if (customRoles) {
    return customRoles.some(r => r.id === roleId);
  }
  
  if (customRolesCache) {
    return customRolesCache.some(r => r.id === roleId);
  }
  
  return false;
}

/**
 * 取得所有可用角色選項（用於下拉選單）
 */
export function getRoleOptions(customRoles?: CustomRole[]): Array<{ value: string; label: string }> {
  const options = [
    { value: 'owner', label: '擁有者' },
    { value: 'guest', label: '訪客' },
  ];
  
  // 加入自訂角色
  const roles = customRoles || customRolesCache || [];
  roles.forEach(role => {
    options.push({ value: role.id, label: role.name });
  });
  
  return options;
}

/**
 * 清除角色快取（當角色有變更時調用）
 */
export function clearRoleCache(): void {
  customRolesCache = null;
  cacheTimestamp = 0;
} 