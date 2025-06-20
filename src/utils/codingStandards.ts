/**
 * 編碼標準工具函數
 * 
 * 提供專案中常用的驗證、格式化和工具函數
 */

import type { ValidationError, ValidationResult, AppError } from '@/types/coding-standards';

/**
 * 驗證電子郵件格式
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 驗證密碼強度
 */
export const validatePassword = (password: string): ValidationResult => {
  const errors: ValidationError[] = [];
  
  if (password.length < 8) {
    errors.push({
      field: 'password',
      message: '密碼長度至少需要 8 個字元',
      value: password,
    });
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push({
      field: 'password',
      message: '密碼需要包含至少一個大寫字母',
      value: password,
    });
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push({
      field: 'password',
      message: '密碼需要包含至少一個小寫字母',
      value: password,
    });
  }
  
  if (!/\d/.test(password)) {
    errors.push({
      field: 'password',
      message: '密碼需要包含至少一個數字',
      value: password,
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * 驗證手機號碼格式（台灣）
 */
export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^09\d{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * 驗證身份證字號（台灣）
 */
export const validateTaiwanId = (id: string): boolean => {
  const idRegex = /^[A-Z][12]\d{8}$/;
  if (!idRegex.test(id)) return false;
  
  const letters = 'ABCDEFGHJKLMNPQRSTUVXYWZIO';
  const letterValues = letters.split('');
  const letterValue = letterValues.indexOf(id.charAt(0).toUpperCase()) + 10;
  
  const digits = id.substring(1).split('').map(Number);
  const sum = Math.floor(letterValue / 10) + (letterValue % 10) * 9 + 
              digits[0] * 8 + digits[1] * 7 + digits[2] * 6 + 
              digits[3] * 5 + digits[4] * 4 + digits[5] * 3 + 
              digits[6] * 2 + digits[7];
  
  return (sum + digits[8]) % 10 === 0;
};

/**
 * 格式化金額（新台幣）
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * 格式化日期
 */
export const formatDate = (date: Date | string, format: 'short' | 'long' | 'time' = 'short'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  switch (format) {
    case 'short':
      return new Intl.DateTimeFormat('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(dateObj);
    case 'long':
      return new Intl.DateTimeFormat('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      }).format(dateObj);
    case 'time':
      return new Intl.DateTimeFormat('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(dateObj);
    default:
      return dateObj.toLocaleDateString('zh-TW');
  }
};

/**
 * 生成唯一 ID
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 防抖函數
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * 節流函數
 */
export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * 深層複製物件
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  if (typeof obj === 'object') {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
};

/**
 * 檢查物件是否為空
 */
export const isEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * 安全地獲取物件屬性值
 */
export const get = (obj: unknown, path: string, defaultValue?: unknown): unknown => {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === null || result === undefined || typeof result !== 'object') {
      return defaultValue;
    }
    result = (result as Record<string, unknown>)[key];
  }
  
  return result === undefined ? defaultValue : result;
};

/**
 * 創建應用錯誤
 */
export const createAppError = (
  code: string,
  message: string,
  details?: Record<string, unknown>
): AppError => ({
  code,
  message,
  details,
  stack: new Error().stack,
});

/**
 * 驗證必填欄位
 */
export const validateRequired = (value: unknown, fieldName: string): ValidationResult => {
  if (isEmpty(value)) {
    return {
      isValid: false,
      errors: [
        {
          field: fieldName,
          message: `${fieldName} 為必填欄位`,
          value,
        },
      ],
    };
  }
  
  return {
    isValid: true,
    errors: [],
  };
};

/**
 * 驗證字串長度
 */
export const validateStringLength = (
  value: string,
  fieldName: string,
  minLength: number,
  maxLength: number
): ValidationResult => {
  const errors: ValidationError[] = [];
  
  if (value.length < minLength) {
    errors.push({
      field: fieldName,
      message: `${fieldName} 長度不能少於 ${minLength} 個字元`,
      value,
    });
  }
  
  if (value.length > maxLength) {
    errors.push({
      field: fieldName,
      message: `${fieldName} 長度不能超過 ${maxLength} 個字元`,
      value,
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * 格式化檔案大小
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * 檢查是否為有效的 URL
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * 生成隨機字串
 */
export const generateRandomString = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}; 