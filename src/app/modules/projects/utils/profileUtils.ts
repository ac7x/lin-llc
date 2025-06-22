import type { UserProfile } from '../services/profileService';

export const formatUserDisplayName = (profile: UserProfile): string => {
  if (profile.displayName) {
    return profile.displayName;
  }
  return profile.email.split('@')[0];
};

export const validateProfileData = (data: Partial<UserProfile>): string[] => {
  const errors: string[] = [];
  
  if (data.displayName && data.displayName.trim().length < 2) {
    errors.push('顯示名稱至少需要 2 個字元');
  }
  
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('請輸入有效的電子郵件地址');
  }
  
  if (data.phoneNumber && !/^[\d\s\-\+\(\)]+$/.test(data.phoneNumber)) {
    errors.push('請輸入有效的電話號碼');
  }
  
  if (data.bio && data.bio.length > 500) {
    errors.push('個人簡介不能超過 500 個字元');
  }
  
  return errors;
};

export const getDefaultPreferences = (): UserProfile['preferences'] => {
  return {
    notifications: true,
    emailUpdates: true,
    darkMode: false,
  };
};

export const getRoleDisplayName = (role: string): string => {
  const roleNames: Record<string, string> = {
    owner: '擁有者',
    admin: '管理員',
    finance: '財務',
    user: '一般用戶',
    helper: '助手',
    temporary: '臨時用戶',
    coord: '協調員',
    safety: '安全員',
    foreman: '工頭',
    vendor: '供應商',
    guest: '訪客',
  };
  
  return roleNames[role] || '一般用戶';
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};
