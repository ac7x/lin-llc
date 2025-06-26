import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 遞歸清理物件中的 undefined 值
 * Firestore 不允許 undefined 值，此函數會移除所有 undefined 欄位
 * @param obj 要清理的物件
 * @returns 清理後的物件，不包含 undefined 值
 */
export function removeUndefinedValues<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefinedValues(item)) as T;
  }

  if (typeof obj === 'object') {
    const cleaned = {} as T;
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        (cleaned as Record<string, unknown>)[key] = removeUndefinedValues(value);
      }
    }
    return cleaned;
  }

  return obj;
} 