/**
 * Firebase Storage 模組
 * 提供檔案上傳、下載和管理功能
 */

import { storage } from './firebase-client';
import { FIREBASE_EMULATOR } from './firebase-config';
import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  uploadString,
  getDownloadURL,
  getMetadata,
  updateMetadata,
  deleteObject,
  list,
  listAll,
  connectStorageEmulator,
  getStorage,
  type StorageReference,
  type UploadMetadata,
  type SettableMetadata,
  type ListResult,
  type UploadTask,
  type UploadTaskSnapshot,
  type StorageError
} from 'firebase/storage';

// 如果啟用了 Firebase Emulator，連接到模擬器
if (FIREBASE_EMULATOR.ENABLED) {
  console.log('[FirebaseStorage] 連接到 Storage Emulator');
  connectStorageEmulator(storage, 'localhost', 9199);
}

/**
 * 建立儲存空間參考
 * @param path - 檔案路徑
 */
export function createStorageRef(path: string): StorageReference {
  console.log('[FirebaseStorage] 建立儲存參考:', path);
  return ref(storage, path);
}

/**
 * 上傳檔案（一次性上傳）
 * @param path - 儲存路徑
 * @param file - 要上傳的檔案
 * @param metadata - 檔案的元資料
 */
export async function uploadFile(
  path: string,
  file: Blob | Uint8Array | ArrayBuffer,
  metadata?: UploadMetadata
): Promise<string> {
  console.log('[FirebaseStorage] 開始上傳檔案:', {
    path,
    fileSize: file instanceof Blob ? file.size : 'unknown',
    metadata
  });

  try {
    const storageRef = createStorageRef(path);
    await uploadBytes(storageRef, file, metadata);
    console.log('[FirebaseStorage] 檔案上傳成功:', path);
    
    const downloadURL = await getDownloadURL(storageRef);
    console.log('[FirebaseStorage] 取得下載網址:', path);
    return downloadURL;
  } catch (error) {
    console.error('[FirebaseStorage] 上傳檔案失敗:', {
      path,
      error,
      errorMessage: error instanceof Error ? error.message : '未知錯誤'
    });
    throw error;
  }
}

/**
 * 使用可恢復的上傳方式上傳檔案
 * @param path - 儲存路徑
 * @param file - 要上傳的檔案
 * @param metadata - 檔案的元資料
 * @param onProgress - 進度回調函數
 */
export function uploadFileWithProgress(
  path: string,
  file: Blob | Uint8Array | ArrayBuffer,
  metadata?: UploadMetadata,
  onProgress?: (progress: number, snapshot: UploadTaskSnapshot) => void
): UploadTask {
  console.log('[FirebaseStorage] 開始可恢復上傳:', {
    path,
    fileSize: file instanceof Blob ? file.size : 'unknown',
    metadata
  });

  try {
    const storageRef = createStorageRef(path);
    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    if (onProgress) {
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('[FirebaseStorage] 上傳進度:', {
            path,
            progress,
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            state: snapshot.state
          });
          onProgress(progress, snapshot);
        },
        (error: StorageError) => {
          console.error('[FirebaseStorage] 上傳錯誤:', {
            path,
            error,
            errorCode: error.code,
            errorMessage: error.message
          });
          throw error;
        }
      );
    }

    return uploadTask;
  } catch (error) {
    console.error('[FirebaseStorage] 建立上傳任務失敗:', {
      path,
      error,
      errorMessage: error instanceof Error ? error.message : '未知錯誤'
    });
    throw error;
  }
}

/**
 * 上傳文字內容
 * @param path - 儲存路徑
 * @param content - 要上傳的文字內容
 * @param format - 文字格式（raw, base64, base64url, data_url)
 */
export async function uploadTextContent(
  path: string,
  content: string,
  format: 'raw' | 'base64' | 'base64url' | 'data_url' = 'raw'
): Promise<string> {
  console.log('[FirebaseStorage] 開始上傳文字內容:', {
    path,
    format,
    contentLength: content.length
  });

  try {
    const storageRef = createStorageRef(path);
    await uploadString(storageRef, content, format);
    console.log('[FirebaseStorage] 文字內容上傳成功:', path);
    
    const downloadURL = await getDownloadURL(storageRef);
    console.log('[FirebaseStorage] 取得下載網址:', path);
    return downloadURL;
  } catch (error) {
    console.error('[FirebaseStorage] 上傳文字內容失敗:', {
      path,
      error,
      errorMessage: error instanceof Error ? error.message : '未知錯誤'
    });
    throw error;
  }
}

/**
 * 獲取檔案下載網址
 * @param path - 檔案路徑
 */
export async function getFileDownloadURL(path: string): Promise<string> {
  console.log('[FirebaseStorage] 取得檔案下載網址:', path);

  try {
    const storageRef = createStorageRef(path);
    const downloadURL = await getDownloadURL(storageRef);
    console.log('[FirebaseStorage] 成功取得下載網址:', path);
    return downloadURL;
  } catch (error) {
    console.error('[FirebaseStorage] 取得下載網址失敗:', {
      path,
      error,
      errorMessage: error instanceof Error ? error.message : '未知錯誤'
    });
    throw error;
  }
}

/**
 * 獲取檔案元資料
 * @param path - 檔案路徑
 */
export async function getFileMetadata(path: string) {
  console.log('[FirebaseStorage] 取得檔案元資料:', path);

  try {
    const storageRef = createStorageRef(path);
    const metadata = await getMetadata(storageRef);
    console.log('[FirebaseStorage] 成功取得元資料:', path);
    return metadata;
  } catch (error) {
    console.error('[FirebaseStorage] 取得元資料失敗:', {
      path,
      error,
      errorMessage: error instanceof Error ? error.message : '未知錯誤'
    });
    throw error;
  }
}

/**
 * 更新檔案元資料
 * @param path - 檔案路徑
 * @param metadata - 新的元資料
 */
export async function updateFileMetadata(
  path: string,
  metadata: SettableMetadata
) {
  console.log('[FirebaseStorage] 更新檔案元資料:', {
    path,
    metadata
  });

  try {
    const storageRef = createStorageRef(path);
    await updateMetadata(storageRef, metadata);
    console.log('[FirebaseStorage] 成功更新元資料:', path);
  } catch (error) {
    console.error('[FirebaseStorage] 更新元資料失敗:', {
      path,
      error,
      errorMessage: error instanceof Error ? error.message : '未知錯誤'
    });
    throw error;
  }
}

/**
 * 刪除檔案
 * @param path - 檔案路徑
 */
export async function deleteFile(path: string): Promise<void> {
  console.log('[FirebaseStorage] 刪除檔案:', path);

  try {
    const storageRef = createStorageRef(path);
    await deleteObject(storageRef);
    console.log('[FirebaseStorage] 成功刪除檔案:', path);
  } catch (error) {
    console.error('[FirebaseStorage] 刪除檔案失敗:', {
      path,
      error,
      errorMessage: error instanceof Error ? error.message : '未知錯誤'
    });
    throw error;
  }
}

/**
 * 列出指定路徑下的所有項目（分頁）
 * @param path - 目錄路徑
 * @param options - 列表選項
 */
export async function listFiles(
  path: string,
  options?: {
    maxResults?: number;
    pageToken?: string;
  }
): Promise<ListResult> {
  console.log('[FirebaseStorage] 列出檔案:', {
    path,
    options
  });

  try {
    const storageRef = createStorageRef(path);
    const result = await list(storageRef, options);
    console.log('[FirebaseStorage] 成功列出檔案:', {
      path,
      itemCount: result.items.length
    });
    return result;
  } catch (error) {
    console.error('[FirebaseStorage] 列出檔案失敗:', {
      path,
      error,
      errorMessage: error instanceof Error ? error.message : '未知錯誤'
    });
    throw error;
  }
}

/**
 * 列出指定路徑下的所有項目（遞迴）
 * @param path - 目錄路徑
 */
export async function listAllFiles(path: string): Promise<ListResult> {
  console.log('[FirebaseStorage] 遞迴列出檔案:', path);

  try {
    const storageRef = createStorageRef(path);
    const result = await listAll(storageRef);
    console.log('[FirebaseStorage] 成功遞迴列出檔案:', {
      path,
      itemCount: result.items.length
    });
    return result;
  } catch (error) {
    console.error('[FirebaseStorage] 遞迴列出檔案失敗:', {
      path,
      error,
      errorMessage: error instanceof Error ? error.message : '未知錯誤'
    });
    throw error;
  }
}

// Re-export 需要的型別
export type {
  StorageReference,
  UploadMetadata,
  SettableMetadata,
  ListResult,
  UploadTask,
  UploadTaskSnapshot,
  StorageError
};

// Re-export 需要的函數
export { getStorage };