export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return '發生未知錯誤';
}

export function logError(error: unknown, context?: Record<string, unknown>): void {
  console.error('錯誤:', error, context ? { context } : '');
}

export async function safeAsync<T>(
  operation: () => Promise<T>,
  onError: (error: unknown) => void
): Promise<T | void> {
  try {
    return await operation();
  } catch (error) {
    onError(error);
  }
} 