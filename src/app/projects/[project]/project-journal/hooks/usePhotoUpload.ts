import { useState, useCallback, useRef } from 'react';
import { UploadTask } from 'firebase/storage';
import { uploadFileWithProgress, getFileDownloadURL } from '@/lib/firebase-storage';

interface UsePhotoUploadOptions {
  maxFileSize?: number;
  acceptedFileTypes?: string[];
  storagePath?: string;
  onUploadComplete?: (url: string) => void;
  onUploadError?: (error: Error) => void;
}

interface UsePhotoUploadReturn {
  isUploading: boolean;
  uploadProgress: number;
  previewUrl: string | null;
  uploadTask: UploadTask | null;
  handleFile: (file: File) => Promise<void>;
  validateFile: (file: File) => string | null;
  resetUpload: () => void;
}

const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DEFAULT_STORAGE_PATH = 'uploads/images';

export function usePhotoUpload({
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  acceptedFileTypes = DEFAULT_ACCEPTED_TYPES,
  storagePath = DEFAULT_STORAGE_PATH,
  onUploadComplete,
  onUploadError,
}: UsePhotoUploadOptions = {}): UsePhotoUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const uploadTaskRef = useRef<UploadTask | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!acceptedFileTypes.includes(file.type)) {
      return '不支援的檔案類型';
    }
    if (file.size > maxFileSize) {
      return `檔案大小超過限制 (${maxFileSize / 1024 / 1024}MB)`;
    }
    return null;
  }, [acceptedFileTypes, maxFileSize]);

  const resetUpload = useCallback(() => {
    setIsUploading(false);
    setUploadProgress(0);
    setPreviewUrl(null);
    uploadTaskRef.current = null;
  }, []);

  const handleFile = useCallback(async (file: File) => {
    const error = validateFile(file);
    if (error) {
      onUploadError?.(new Error(error));
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // 建立預覽 URL
      const previewUrl = URL.createObjectURL(file);
      setPreviewUrl(previewUrl);

      // 生成唯一的檔案名稱
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const fullPath = `${storagePath}/${fileName}`;

      // 上傳檔案
      uploadTaskRef.current = uploadFileWithProgress(
        fullPath,
        file,
        {
          contentType: file.type,
          customMetadata: {
            originalName: file.name,
          },
        },
        (progress) => {
          setUploadProgress(progress);
        }
      );

      // 等待上傳完成
      await uploadTaskRef.current;
      const downloadUrl = await getFileDownloadURL(fullPath);
      onUploadComplete?.(downloadUrl);
    } catch (error) {
      onUploadError?.(error instanceof Error ? error : new Error('上傳失敗'));
      resetUpload();
    }
  }, [onUploadComplete, onUploadError, storagePath, validateFile, resetUpload]);

  return {
    isUploading,
    uploadProgress,
    previewUrl,
    uploadTask: uploadTaskRef.current,
    handleFile,
    validateFile,
    resetUpload,
  };
}
