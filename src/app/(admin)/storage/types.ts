/**
 * 檔案資訊介面
 */
export interface StorageFile {
  name: string;          // 檔案名稱
  url: string;           // 下載網址
  size: number;          // 檔案大小 (bytes)
  uploadedAt: string;    // 上傳時間
  type: string;          // 檔案類型
}

/**
 * 上傳狀態介面
 */
export interface UploadProgress {
  fileName: string;      // 上傳檔案名稱
  progress: number;      // 上傳進度 (0-100)
  status: 'uploading' | 'completed' | 'error'; // 上傳狀態
  error?: string;        // 錯誤訊息
}

/**
 * Storage 組件屬性介面
 */
export interface ProjectStorageProps {
  projectId: string;     // 專案 ID
  disabled?: boolean;    // 是否禁用上傳
  maxFileSize?: number;  // 最大檔案大小 (bytes)，預設 10MB
} 