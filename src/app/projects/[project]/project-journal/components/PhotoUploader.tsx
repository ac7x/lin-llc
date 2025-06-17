import { useState, useCallback } from 'react';
import Image from 'next/image';
import { usePhotoUpload } from '../hooks/usePhotoUpload';

interface PhotoUploaderProps {
  onUploadComplete: (url: string) => void;
  onUploadError: (error: Error) => void;
  maxFileSize?: number;
  acceptedFileTypes?: string[];
  storagePath?: string;
  className?: string;
}

export default function PhotoUploader({
  onUploadComplete,
  onUploadError,
  maxFileSize,
  acceptedFileTypes,
  storagePath,
  className = '',
}: PhotoUploaderProps) {
  const {
    isUploading,
    uploadProgress,
    previewUrl,
    handleFile,
  } = usePhotoUpload({
    maxFileSize,
    acceptedFileTypes,
    storagePath,
    onUploadComplete,
    onUploadError,
  });

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      void handleFile(file);
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleFile(file);
    }
  }, [handleFile]);

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-4 text-center ${
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      } ${className}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept={acceptedFileTypes?.join(',')}
        onChange={handleFileInput}
        className="hidden"
        id="photo-upload"
        disabled={isUploading}
      />
      
      {previewUrl ? (
        <div className="relative w-full aspect-video mb-4">
          <Image
            src={previewUrl}
            alt="預覽圖片"
            fill
            className="object-contain rounded-lg"
          />
        </div>
      ) : (
        <div className="py-8">
          <p className="text-gray-600">
            拖放圖片至此處或
            <label
              htmlFor="photo-upload"
              className="text-blue-500 cursor-pointer hover:text-blue-600 ml-1"
            >
              點擊上傳
            </label>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            支援的格式：{acceptedFileTypes?.map(type => type.split('/')[1]).join(', ')}
            <br />
            最大檔案大小：{(maxFileSize || 5 * 1024 * 1024) / 1024 / 1024}MB
          </p>
        </div>
      )}

      {isUploading && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            上傳進度：{Math.round(uploadProgress)}%
          </p>
        </div>
      )}
    </div>
  );
}
