export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const getSignInErrorMessage = (errorCode: string): string => {
  const errorMessages: Record<string, string> = {
    'auth/popup-closed-by-user': '登入視窗被關閉，請重試',
    'auth/popup-blocked': '登入視窗被瀏覽器阻擋，請允許彈出視窗',
    'auth/cancelled-popup-request': '登入請求已取消',
    'auth/network-request-failed': '網路連線失敗，請檢查網路連線',
    'auth/too-many-requests': '登入嘗試次數過多，請稍後再試',
    'auth/user-disabled': '此帳號已被停用',
    'auth/invalid-email': '無效的電子郵件地址',
    'auth/user-not-found': '找不到此用戶帳號',
    'auth/wrong-password': '密碼錯誤',
    'auth/weak-password': '密碼強度不足',
    'auth/email-already-in-use': '此電子郵件已被使用',
    'auth/operation-not-allowed': '此操作不被允許',
    'auth/requires-recent-login': '需要重新登入以進行此操作',
    'auth/account-exists-with-different-credential': '此電子郵件已與其他登入方式關聯',
    'auth/invalid-credential': '無效的登入憑證',
    'auth/invalid-verification-code': '無效的驗證碼',
    'auth/invalid-verification-id': '無效的驗證 ID',
    'auth/quota-exceeded': '配額已超出限制',
    'auth/unknown': '發生未知錯誤，請重試',
  };
  
  return errorMessages[errorCode] || '登入失敗，請重試';
};

export const isSignInError = (error: unknown): error is { code: string; message: string } => {
  return typeof error === 'object' && 
         error !== null && 
         'code' in error && 
         'message' in error;
};

export const getSignInProviderName = (providerId: string): string => {
  const providerNames: Record<string, string> = {
    'google.com': 'Google',
    'facebook.com': 'Facebook',
    'twitter.com': 'Twitter',
    'github.com': 'GitHub',
    'microsoft.com': 'Microsoft',
    'apple.com': 'Apple',
  };
  
  return providerNames[providerId] || providerId;
};

export const formatLastLoginTime = (timestamp: string | Date): string => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) {
    return '剛剛';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} 分鐘前`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours} 小時前`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    return `${days} 天前`;
  }
};
