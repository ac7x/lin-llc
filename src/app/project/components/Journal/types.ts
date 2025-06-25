/**
 * 日誌條目介面
 */
export interface JournalEntry {
  id?: string;           // 條目 ID
  projectId: string;     // 專案 ID
  title: string;         // 日誌標題
  content: string;       // 日誌內容
  photos: string[];      // 照片 URL 陣列
  createdAt: string;     // 建立時間
  createdBy: string;     // 建立者 UID
  updatedAt?: string;    // 更新時間
}

/**
 * 新增日誌表單資料
 */
export interface JournalFormData {
  title: string;         // 標題
  content: string;       // 內容
  photos: File[];        // 待上傳照片檔案
}

/**
 * 專案日誌組件屬性
 */
export interface ProjectJournalProps {
  projectId: string;     // 專案 ID
  disabled?: boolean;    // 是否禁用編輯
  maxPhotos?: number;    // 最大照片數量，預設 5 張
} 