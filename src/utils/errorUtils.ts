/**
 * 錯誤處理工具
 * 
 * 提供統一的錯誤處理、錯誤創建、錯誤分類和日誌記錄功能
 */

import type { AppError, ValidationError, ValidationResult } from '@/types/coding-standards';

// 錯誤代碼枚舉
export enum ErrorCode {
  // 通用錯誤
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // Firebase 相關錯誤
  FIREBASE_AUTH_ERROR = 'FIREBASE_AUTH_ERROR',
  FIREBASE_FIRESTORE_ERROR = 'FIREBASE_FIRESTORE_ERROR',
  FIREBASE_STORAGE_ERROR = 'FIREBASE_STORAGE_ERROR',
  FIREBASE_MESSAGING_ERROR = 'FIREBASE_MESSAGING_ERROR',
  
  // 權限相關錯誤
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  
  // 資料相關錯誤
  DATA_NOT_FOUND = 'DATA_NOT_FOUND',
  DATA_CONFLICT = 'DATA_CONFLICT',
  DATA_INVALID = 'DATA_INVALID',
  
  // 業務邏輯錯誤
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INVALID_OPERATION = 'INVALID_OPERATION',
  RESOURCE_EXHAUSTED = 'RESOURCE_EXHAUSTED',
}

// 錯誤嚴重程度
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// 擴展的錯誤介面
export interface ExtendedAppError extends AppError {
  severity: ErrorSeverity;
  timestamp: Date;
  context?: Record<string, unknown>;
  originalError?: Error;
}

// Firebase 錯誤介面
export interface FirebaseError extends Error {
  code?: string;
  message: string;
}

/**
 * 創建應用錯誤
 */
export const createError = (
  code: ErrorCode,
  message: string,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  details?: Record<string, unknown>,
  originalError?: Error
): ExtendedAppError => ({
  code,
  message,
  severity,
  details,
  stack: new Error().stack,
  timestamp: new Date(),
  context: details,
  originalError,
});

/**
 * 創建驗證錯誤
 */
export const createValidationError = (
  field: string,
  message: string,
  value?: unknown
): ValidationError => ({
  field,
  message,
  value,
});

/**
 * 創建驗證結果
 */
export const createValidationResult = (
  isValid: boolean,
  errors: ValidationError[] = []
): ValidationResult => ({
  isValid,
  errors,
});

/**
 * 檢查是否為 Firebase 錯誤
 */
export const isFirebaseError = (error: unknown): error is FirebaseError => {
  return (
    error instanceof Error &&
    typeof (error as FirebaseError).code === 'string' &&
    'message' in error
  );
};

/**
 * 檢查是否為網路錯誤
 */
export const isNetworkError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  
  const networkErrorMessages = [
    'network error',
    'fetch failed',
    'connection refused',
    'timeout',
    'cors',
    'net::err_',
  ];
  
  return networkErrorMessages.some(msg => 
    error.message.toLowerCase().includes(msg)
  );
};

/**
 * 檢查是否為權限錯誤
 */
export const isPermissionError = (error: unknown): boolean => {
  if (isFirebaseError(error)) {
    const permissionCodes = [
      'permission-denied',
      'unauthenticated',
      'unavailable',
    ];
    return permissionCodes.includes(error.code || '');
  }
  
  if (error instanceof Error) {
    const permissionMessages = [
      'permission denied',
      'unauthorized',
      'forbidden',
      'access denied',
    ];
    return permissionMessages.some(msg => 
      error.message.toLowerCase().includes(msg)
    );
  }
  
  return false;
};

/**
 * 將錯誤轉換為用戶友好的訊息
 */
export const getErrorMessage = (error: unknown): string => {
  if (isFirebaseError(error)) {
    return getFirebaseErrorMessage(error);
  }
  
  if (isNetworkError(error)) {
    return '網路連線發生問題，請檢查您的網路連線後重試。';
  }
  
  if (isPermissionError(error)) {
    return '您沒有權限執行此操作，請聯絡管理員。';
  }
  
  if (error instanceof Error) {
    return error.message || '發生未知錯誤，請稍後重試。';
  }
  
  return '發生未知錯誤，請稍後重試。';
};

/**
 * 獲取 Firebase 錯誤的用戶友好訊息
 */
export const getFirebaseErrorMessage = (error: FirebaseError): string => {
  const errorMessages: Record<string, string> = {
    // 認證錯誤
    'auth/user-not-found': '找不到該用戶帳號。',
    'auth/wrong-password': '密碼錯誤，請重新輸入。',
    'auth/email-already-in-use': '此電子郵件已被使用。',
    'auth/weak-password': '密碼強度不足，請使用更強的密碼。',
    'auth/invalid-email': '電子郵件格式不正確。',
    'auth/user-disabled': '此帳號已被停用。',
    'auth/too-many-requests': '請求次數過多，請稍後再試。',
    'auth/operation-not-allowed': '此操作不被允許。',
    'auth/invalid-credential': '認證資訊無效。',
    
    // Firestore 錯誤
    'permission-denied': '您沒有權限存取此資料。',
    'unauthenticated': '請先登入後再執行此操作。',
    'not-found': '找不到要求的資料。',
    'already-exists': '資料已存在。',
    'resource-exhausted': '系統資源不足，請稍後再試。',
    'failed-precondition': '操作前提條件不滿足。',
    'aborted': '操作被中止。',
    'out-of-range': '操作超出有效範圍。',
    'unimplemented': '此功能尚未實作。',
    'internal': '系統內部錯誤，請稍後再試。',
    'unavailable': '服務暫時無法使用，請稍後再試。',
    'data-loss': '資料遺失。',
    
    // 儲存錯誤
    'storage/object-not-found': '找不到指定的檔案。',
    'storage/bucket-not-found': '找不到指定的儲存桶。',
    'storage/project-not-found': '找不到指定的專案。',
    'storage/quota-exceeded': '儲存空間已滿。',
    'storage/unauthenticated': '請先登入後再上傳檔案。',
    'storage/unauthorized': '您沒有權限上傳檔案。',
    'storage/retry-limit-exceeded': '重試次數已達上限。',
    'storage/invalid-checksum': '檔案完整性檢查失敗。',
    'storage/canceled': '上傳已取消。',
    'storage/invalid-event-name': '無效的事件名稱。',
    'storage/invalid-url': '無效的檔案網址。',
    'storage/invalid-argument': '無效的參數。',
    'storage/no-default-bucket': '未設定預設儲存桶。',
    'storage/cannot-slice-blob': '無法分割檔案。',
    'storage/server-file-wrong-size': '伺服器檔案大小不正確。',
  };
  
  const code = error.code || '';
  return errorMessages[code] || error.message || '發生未知錯誤，請稍後重試。';
};

/**
 * 安全地執行異步函數並處理錯誤
 */
export const safeAsync = async <T>(
  asyncFn: () => Promise<T>,
  errorHandler?: (error: unknown) => void
): Promise<T | null> => {
  try {
    return await asyncFn();
  } catch (error) {
    if (errorHandler) {
      errorHandler(error);
    } else {
      console.error('安全異步執行發生錯誤:', error);
    }
    return null;
  }
};

/**
 * 重試機制
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // 指數退避
      const waitTime = delay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError;
};

/**
 * 錯誤日誌記錄
 */
export const logError = (
  error: unknown,
  context?: Record<string, unknown>
): void => {
  const errorInfo = {
    message: getErrorMessage(error),
    stack: error instanceof Error ? error.stack : undefined,
    context,
    timestamp: new Date().toISOString(),
  };
  
  // 在開發環境中輸出詳細錯誤資訊
  if (process.env.NODE_ENV === 'development') {
    console.error('錯誤詳情:', errorInfo);
    if (error instanceof Error) {
      console.error('原始錯誤:', error);
    }
  } else {
    // 在生產環境中只記錄基本資訊
    console.error('應用錯誤:', errorInfo.message);
  }
};

/**
 * 批量驗證
 */
export const validateMultiple = (
  validations: ValidationResult[]
): ValidationResult => {
  const allErrors: ValidationError[] = [];
  
  validations.forEach(validation => {
    if (!validation.isValid) {
      allErrors.push(...validation.errors);
    }
  });
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
};

/**
 * 錯誤分類
 */
export const categorizeError = (error: unknown): ErrorCode => {
  if (isFirebaseError(error)) {
    const code = (error as FirebaseError).code;
    if (code?.startsWith('auth/')) {
      return ErrorCode.FIREBASE_AUTH_ERROR;
    }
    if (code?.startsWith('storage/')) {
      return ErrorCode.FIREBASE_STORAGE_ERROR;
    }
    return ErrorCode.FIREBASE_FIRESTORE_ERROR;
  }
  
  if (isNetworkError(error)) {
    return ErrorCode.NETWORK_ERROR;
  }
  
  if (isPermissionError(error)) {
    return ErrorCode.PERMISSION_DENIED;
  }
  
  return ErrorCode.UNKNOWN_ERROR;
};

/**
 * 錯誤嚴重程度評估
 */
export const assessErrorSeverity = (error: unknown): ErrorSeverity => {
  if (isPermissionError(error)) {
    return ErrorSeverity.LOW;
  }
  
  if (isNetworkError(error)) {
    return ErrorSeverity.MEDIUM;
  }
  
  if (isFirebaseError(error)) {
    const code = (error as FirebaseError).code;
    if (code === 'permission-denied' || code === 'unauthenticated') {
      return ErrorSeverity.LOW;
    }
    if (code === 'resource-exhausted' || code === 'unavailable') {
      return ErrorSeverity.HIGH;
    }
  }
  
  return ErrorSeverity.MEDIUM;
};
