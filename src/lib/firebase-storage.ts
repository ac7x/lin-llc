import { ref, uploadBytesResumable, getDownloadURL, UploadMetadata, UploadTask } from 'firebase/storage';
import { storage } from './firebase-client';

/**
 * 上傳檔案並監聽進度
 * @param path 儲存路徑，例如 'uploads/image.jpg'
 * @param file 檔案物件
 * @param metadata 檔案的 metadata
 * @param onProgress 進度回呼（百分比）
 * @returns UploadTask 實例
 */
export function uploadFileWithProgress(
  path: string,
  file: File,
  metadata: UploadMetadata,
  onProgress?: (progress: number) => void
): UploadTask {
  try {
    const fileRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(fileRef, file, metadata);

    if (onProgress) {
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(progress);
        },
        (error) => {
          console.error('上傳檔案時發生錯誤:', error);
          throw error;
        }
      );
    }

    return uploadTask;
  } catch (error) {
    console.error('初始化上傳任務時發生錯誤:', error);
    throw error;
  }
}

/**
 * 取得檔案下載網址
 * @param path 儲存路徑，例如 'uploads/image.jpg'
 * @returns 下載 URL
 * @throws {Error} 當取得下載 URL 失敗時拋出錯誤
 */
export async function getFileDownloadURL(path: string): Promise<string> {
  try {
    const fileRef = ref(storage, path);
    return await getDownloadURL(fileRef);
  } catch (error) {
    console.error('取得檔案下載網址時發生錯誤:', error);
    throw error;
  }
}
