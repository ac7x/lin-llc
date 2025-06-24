import { EnvironmentConfig } from '@/types';

/**
 * 環境變數配置
 * 定義系統的擁有者 UID 和預設角色配置
 */
export const envConfig: EnvironmentConfig = {
  // 擁有者 UID - 請將此值設定為實際的擁有者 UID
  OWNER_UID: process.env.NEXT_PUBLIC_OWNER_UID || 'your-owner-uid-here',
  
  // 預設角色 ID
  DEFAULT_ROLE_ID: 'default',
  GUEST_ROLE_ID: 'guest',
};

/**
 * 檢查是否為擁有者
 */
export const isOwner = (uid: string): boolean => {
  return uid === envConfig.OWNER_UID;
};

/**
 * 獲取預設角色 ID
 */
export const getDefaultRoleId = (uid: string): string => {
  return isOwner(uid) ? 'owner' : envConfig.DEFAULT_ROLE_ID;
};

/**
 * 驗證環境配置
 */
export const validateEnvConfig = (): void => {
  if (!envConfig.OWNER_UID || envConfig.OWNER_UID === 'your-owner-uid-here') {
    console.warn('警告: 請設定 NEXT_PUBLIC_OWNER_UID 環境變數');
  }
}; 