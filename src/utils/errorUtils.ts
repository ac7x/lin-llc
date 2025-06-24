// src/utils/errorUtils.ts
/**
 * 將未知錯誤轉換為可讀的錯誤訊息。
 * @param error 捕獲的錯誤（型別為 unknown）
 * @returns 錯誤訊息字串
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * 處理 Firestore 操作中的錯誤，並返回標準化錯誤訊息。
 * @param error 捕獲的 Firestore 錯誤
 * @returns 包含錯誤訊息的物件
 */
export function handleFirestoreError(error: unknown): { message: string } {
  const message = getErrorMessage(error);
  console.error('Firestore 錯誤:', message);
  return { message };
}

/**
 * 記錄錯誤到控制台，並可選地附加操作上下文。
 * @param error 捕獲的錯誤（型別為 unknown）
 * @param context 可選的上下文資訊（例如操作名稱）
 */
export function logError(error: unknown, context?: { operation?: string }): void {
  const message = getErrorMessage(error);
  const operation = context?.operation ? `[${context.operation}] ` : '';
  console.error(`${operation}錯誤:`, message);
}