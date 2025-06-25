'use client';

import { useState, useEffect, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL, listAll, deleteObject, getMetadata } from 'firebase/storage';
import { storage } from '@/lib/firebase-init';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trash2, Upload, File, Download } from 'lucide-react';
import { StorageFile, UploadProgress, ProjectStorageProps } from './types';

/**
 * 專案雲空間組件 - 管理專案檔案的上傳、下載和刪除
 */
export default function ProjectStorage({ 
  projectId, 
  disabled = false, 
  maxFileSize = 10 * 1024 * 1024 // 預設 10MB
}: ProjectStorageProps) {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const folderPath = `projects/${projectId}/files`;

  // 載入檔案列表
  const loadFiles = async (): Promise<void> => {
    try {
      setLoading(true);
      const folderRef = ref(storage, folderPath);
      const result = await listAll(folderRef);
      
      const filePromises = result.items.map(async (itemRef) => {
        const [url, metadata] = await Promise.all([
          getDownloadURL(itemRef),
          getMetadata(itemRef)
        ]);
        
        return {
          name: itemRef.name,
          url,
          size: metadata.size,
          uploadedAt: metadata.timeCreated,
          type: metadata.contentType || 'unknown'
        } as StorageFile;
      });

      const fileList = await Promise.all(filePromises);
      setFiles(fileList.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()));
    } catch (error) {
      console.error('載入檔案列表失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 處理檔案上傳
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    Array.from(selectedFiles).forEach((file) => {
      if (file.size > maxFileSize) {
        alert(`檔案 ${file.name} 超過大小限制 (${Math.round(maxFileSize / 1024 / 1024)}MB)`);
        return;
      }

      const fileName = `${Date.now()}_${file.name}`;
      const fileRef = ref(storage, `${folderPath}/${fileName}`);
      const uploadTask = uploadBytesResumable(fileRef, file);

      // 初始化上傳進度
      setUploads(prev => [...prev, {
        fileName,
        progress: 0,
        status: 'uploading'
      }]);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploads(prev => prev.map(upload => 
            upload.fileName === fileName 
              ? { ...upload, progress: Math.round(progress) }
              : upload
          ));
        },
        (error) => {
          console.error('上傳失敗:', error);
          setUploads(prev => prev.map(upload => 
            upload.fileName === fileName 
              ? { ...upload, status: 'error', error: error.message }
              : upload
          ));
        },
        () => {
          setUploads(prev => prev.map(upload => 
            upload.fileName === fileName 
              ? { ...upload, status: 'completed', progress: 100 }
              : upload
          ));
          
          // 上傳完成後重新載入檔案列表
          setTimeout(() => {
            loadFiles();
            setUploads(prev => prev.filter(upload => upload.fileName !== fileName));
          }, 1000);
        }
      );
    });

    // 清空 input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 刪除檔案
  const handleDeleteFile = async (fileName: string): Promise<void> => {
    try {
      const fileRef = ref(storage, `${folderPath}/${fileName}`);
      await deleteObject(fileRef);
      await loadFiles(); // 重新載入檔案列表
    } catch (error) {
      console.error('刪除檔案失敗:', error);
      alert('刪除檔案失敗');
    }
  };

  // 格式化檔案大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化日期
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('zh-TW');
  };

  useEffect(() => {
    loadFiles();
  }, [projectId]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <File className="h-5 w-5" />
          專案雲空間
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 上傳區域 */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileUpload}
            disabled={disabled}
            className="hidden"
            id="file-upload"
          />
          <label 
            htmlFor="file-upload" 
            className={`cursor-pointer ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600">
              點擊選擇檔案或拖放檔案到此處
            </p>
            <p className="text-xs text-gray-400 mt-1">
              最大檔案大小: {Math.round(maxFileSize / 1024 / 1024)}MB
            </p>
          </label>
        </div>

        {/* 上傳進度 */}
        {uploads.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">上傳進度</h4>
            {uploads.map((upload) => (
              <div key={upload.fileName} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="truncate">{upload.fileName}</span>
                  <span>{upload.progress}%</span>
                </div>
                <Progress value={upload.progress} className="h-2" />
                {upload.status === 'error' && upload.error && (
                  <p className="text-xs text-red-500">{upload.error}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 檔案列表 */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">檔案列表</h4>
          {loading ? (
            <p className="text-sm text-gray-500">載入中...</p>
          ) : files.length === 0 ? (
            <p className="text-sm text-gray-500">尚無檔案</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {files.map((file) => (
                <div key={file.name} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)} • {formatDate(file.uploadedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(file.url, '_blank')}
                      title="下載檔案"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFile(file.name)}
                      disabled={disabled}
                      title="刪除檔案"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 