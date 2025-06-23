'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject, 
  listAll,
  getMetadata,
  StorageReference,
  storage
} from '@/lib/firebase-client';
import { logError, getErrorMessage } from '@/utils/errorUtils';

interface StorageFile {
  name: string;
  url: string;
  size: number;
  type: string;
  lastModified: Date;
  ref: StorageReference;
}

export default function ProjectStoragePage() {
  const params = useParams();
  const projectId = params.project as string;
  const { user } = useAuth();
  
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // 載入專案檔案列表
  const loadFiles = useCallback(async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      const storageRef = ref(storage, `projects/${projectId}/storage`);
      const result = await listAll(storageRef);
      
      const filePromises = result.items.map(async (itemRef: StorageReference) => {
        try {
          const url = await getDownloadURL(itemRef);
          const metadata = await getMetadata(itemRef);
          
          return {
            name: itemRef.name,
            url,
            size: metadata.size || 0,
            type: metadata.contentType || 'application/octet-stream',
            lastModified: new Date(metadata.timeCreated || Date.now()),
            ref: itemRef,
          };
        } catch (err) {
          console.error(`無法載入檔案 ${itemRef.name}:`, err);
          return null;
        }
      });

      const fileResults = await Promise.all(filePromises);
      const validFiles = fileResults.filter((file): file is StorageFile => file !== null);
      
      // 按修改時間排序，最新的在前
      validFiles.sort((a: StorageFile, b: StorageFile) => b.lastModified.getTime() - a.lastModified.getTime());
      
      setFiles(validFiles);
    } catch (err) {
      setError(getErrorMessage(err));
      logError(err, { operation: 'load_project_files', projectId });
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // 檔案上傳處理
  const handleFileUpload = async (file: File) => {
    if (!projectId || !user) {
      setError('專案 ID 或用戶資訊缺失');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);

      const fileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `projects/${projectId}/storage/${fileName}`);
      
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          setError(getErrorMessage(error));
          logError(error, { operation: 'upload_file', projectId, fileName });
        },
        async () => {
          setUploadProgress(100);
          setSelectedFile(null);
          // 重新載入檔案列表
          await loadFiles();
        }
      );
    } catch (err) {
      setError(getErrorMessage(err));
      logError(err, { operation: 'upload_file', projectId });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // 檔案刪除處理
  const handleFileDelete = async (file: StorageFile) => {
    if (!confirm(`確定要刪除檔案 "${file.name}" 嗎？`)) {
      return;
    }

    try {
      await deleteObject(file.ref);
      setFiles(files.filter(f => f.name !== file.name));
    } catch (err) {
      setError(getErrorMessage(err));
      logError(err, { operation: 'delete_file', projectId, fileName: file.name });
    }
  };

  // 檔案下載處理
  const handleFileDownload = async (file: StorageFile) => {
    try {
      const response = await fetch(file.url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setError(getErrorMessage(err));
      logError(err, { operation: 'download_file', projectId, fileName: file.name });
    }
  };

  // 檔案選擇處理
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // 格式化檔案大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // 獲取檔案圖示
  const getFileIcon = (type: string): string => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('audio/')) return '🎵';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📈';
    if (type.includes('zip') || type.includes('rar')) return '📦';
    return '📁';
  };

  // 初始載入
  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="flex justify-center items-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          專案儲存空間
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          上傳、管理和下載專案相關檔案
        </p>
      </div>

      {/* 上傳區域 */}
      <div className="mb-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          上傳檔案
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <input
              type="file"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                dark:file:bg-gray-700 dark:file:text-gray-300
                dark:hover:file:bg-gray-600"
              disabled={uploading}
            />
            
            {selectedFile && (
              <button
                onClick={() => handleFileUpload(selectedFile)}
                disabled={uploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                  disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? '上傳中...' : '上傳'}
              </button>
            )}
          </div>

          {uploading && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}

          {selectedFile && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              已選擇: {selectedFile.name} ({formatFileSize(selectedFile.size)})
            </div>
          )}
        </div>
      </div>

      {/* 錯誤訊息 */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* 檔案列表 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            檔案列表 ({files.length})
          </h2>
        </div>

        {files.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-2">📁</div>
            <p>目前沒有任何檔案</p>
            <p className="text-sm">上傳您的第一個檔案開始使用</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {files.map((file) => (
              <div key={file.name} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <span className="text-2xl">{getFileIcon(file.type)}</span>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {file.name}
                        </h3>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span>{formatFileSize(file.size)}</span>
                        <span>{file.type}</span>
                        <span>{file.lastModified.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {/* 圖片預覽 */}
                    {file.type.startsWith('image/') && (
                      <button
                        onClick={() => window.open(file.url, '_blank')}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="預覽圖片"
                      >
                        👁️
                      </button>
                    )}
                    
                    {/* 下載按鈕 */}
                    <button
                      onClick={() => handleFileDownload(file)}
                      className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                      title="下載檔案"
                    >
                      ⬇️
                    </button>
                    
                    {/* 刪除按鈕 */}
                    <button
                      onClick={() => handleFileDelete(file)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="刪除檔案"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}