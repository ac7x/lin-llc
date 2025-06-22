/**
 * 專案錯誤處理 Hook
 * 
 * 提供統一的錯誤處理邏輯，包括：
 * - 錯誤分類與處理
 * - 用戶友好的錯誤訊息
 * - 錯誤日誌記錄
 * - 重試機制
 */

import { useState, useCallback } from 'react';
import { logError, getErrorMessage } from '@/utils/errorUtils';

export interface ProjectError {
  code: string;
  message: string;
  details?: string;
  timestamp: Date;
  operation: string;
  context?: Record<string, unknown>;
}

export interface ErrorHandlerOptions {
  showAlert?: boolean;
  logToConsole?: boolean;
  retryCount?: number;
  retryDelay?: number;
}

export function useProjectErrorHandler(options: ErrorHandlerOptions = {}) {
  const [errors, setErrors] = useState<ProjectError[]>([]);
  const [isHandling, setIsHandling] = useState(false);

  const {
    showAlert = true,
    logToConsole = true,
    retryCount = 3,
    retryDelay = 1000,
  } = options;

  const handleError = useCallback((
    error: unknown,
    operation: string,
    context?: Record<string, unknown>
  ) => {
    const projectError: ProjectError = {
      code: error instanceof Error ? error.name : 'UnknownError',
      message: getErrorMessage(error),
      details: error instanceof Error ? error.stack : undefined,
      timestamp: new Date(),
      operation,
      context,
    };

    // 添加到錯誤列表
    setErrors(prev => [...prev, projectError]);

    // 記錄錯誤
    if (logToConsole) {
      logError(error, { operation, ...context });
    }

    // 顯示用戶友好的錯誤訊息
    if (showAlert) {
      const userMessage = getErrorMessage(error);
      alert(`操作失敗: ${userMessage}`);
    }

    return projectError;
  }, [showAlert, logToConsole]);

  const handleAsyncError = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    operation: string,
    context?: Record<string, unknown>
  ): Promise<T | null> => {
    setIsHandling(true);
    
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error, operation, context);
      return null;
    } finally {
      setIsHandling(false);
    }
  }, [handleError]);

  const handleWithRetry = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    operation: string,
    context?: Record<string, unknown>
  ): Promise<T | null> => {
    setIsHandling(true);
    
    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        const result = await asyncFn();
        return result;
      } catch (error) {
        if (attempt === retryCount) {
          handleError(error, operation, { ...context, attempt });
          return null;
        }
        
        // 等待後重試
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
    
    setIsHandling(false);
    return null;
  }, [handleError, retryCount, retryDelay]);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const removeError = useCallback((errorIndex: number) => {
    setErrors(prev => prev.filter((_, index) => index !== errorIndex));
  }, []);

  const getLatestError = useCallback(() => {
    return errors[errors.length - 1] || null;
  }, [errors]);

  const hasErrors = useCallback(() => {
    return errors.length > 0;
  }, [errors]);

  return {
    errors,
    isHandling,
    handleError,
    handleAsyncError,
    handleWithRetry,
    clearErrors,
    removeError,
    getLatestError,
    hasErrors,
  };
}
