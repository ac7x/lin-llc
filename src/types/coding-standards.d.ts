/**
 * 編碼標準類型定義
 *
 * 定義專案中常用的類型約定和標準
 */

// 基礎響應類型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 分頁類型
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

// 表單相關類型
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'date' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

// 狀態類型
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// 通用 ID 類型
export type EntityId = string;

// 時間戳類型
export interface Timestamped {
  createdAt: Date;
  updatedAt: Date;
}

// 軟刪除類型
export interface SoftDeletable extends Timestamped {
  deletedAt?: Date;
  isDeleted?: boolean;
}

// 權限相關類型
export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
}

// 審計日誌類型
export interface AuditLog extends Timestamped {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

// 文件上傳類型
export interface FileUpload {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: Date;
  uploadedBy: string;
}

// 通知類型
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: Date;
  userId: string;
  actionUrl?: string;
}

// 搜索和過濾類型
export interface SearchFilters {
  query?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  status?: string[];
  category?: string[];
  tags?: string[];
}

// 導出類型
export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  includeHeaders?: boolean;
  dateFormat?: string;
  timezone?: string;
}

// 緩存類型
export interface CacheConfig {
  key: string;
  ttl: number; // 秒
  tags?: string[];
}

// 錯誤類型
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}

// 驗證錯誤類型
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

// 表單驗證結果類型
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// 通用事件處理器類型
export type EventHandler<T = Event> = (event: T) => void;

// 異步函數類型
export type AsyncFunction<TArgs extends unknown[] = unknown[], TReturn = unknown> = (
  ...args: TArgs
) => Promise<TReturn>;

// 條件渲染類型
export type ConditionalRender<T> = T | null | undefined;

// 可選屬性類型
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// 必需屬性類型
export type Required<T, K extends keyof T> = T & Required<Pick<T, K>>;

// 深度可選類型
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// 深度必需類型
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};
