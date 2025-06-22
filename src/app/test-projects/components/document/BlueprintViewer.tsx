/**
 * 藍圖查看器組件
 * 
 * 提供圖片和 PDF 文件的預覽功能，包括：
 * - 圖片縮放和平移
 * - PDF 頁面瀏覽
 * - 縮圖導航
 * - 全螢幕模式
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { projectStyles } from '@/app/test-projects/styles';
import type { ProjectDocumentFile } from '@/app/test-projects/types';

interface BlueprintViewerProps {
  document: ProjectDocumentFile;
  onClose?: () => void;
}

export default function BlueprintViewer({ document: doc, onClose }: BlueprintViewerProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const isImage = doc.type.startsWith('image/');
  const isPDF = doc.type === 'application/pdf';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const handleImageLoad = () => {
    setLoading(false);
    setError(null);
  };

  const handleImageError = () => {
    setLoading(false);
    setError('圖片載入失敗');
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 5));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.1));
  };

  const resetZoom = () => {
    setScale(1);
    setRotation(0);
  };

  const rotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const downloadFile = () => {
    const link = document.createElement('a');
    link.href = doc.url;
    link.download = doc.name;
    link.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
          <button
            onClick={() => window.open(doc.url, '_blank')}
            className={projectStyles.button.primary}
          >
            在新分頁中開啟
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900' : ''}`}>
      {/* 工具列 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {doc.name}
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {formatFileSize(doc.size)}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* 縮放控制 */}
          <button
            onClick={zoomOut}
            className={projectStyles.button.small}
            title="縮小"
          >
            🔍-
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className={projectStyles.button.small}
            title="放大"
          >
            🔍+
          </button>
          
          {/* 旋轉 */}
          <button
            onClick={rotate}
            className={projectStyles.button.small}
            title="旋轉"
          >
            🔄
          </button>
          
          {/* 重置 */}
          <button
            onClick={resetZoom}
            className={projectStyles.button.small}
            title="重置"
          >
            🏠
          </button>
          
          {/* 全螢幕 */}
          <button
            onClick={toggleFullscreen}
            className={projectStyles.button.small}
            title={isFullscreen ? '退出全螢幕' : '全螢幕'}
          >
            {isFullscreen ? '⛌' : '⛶'}
          </button>
          
          {/* 下載 */}
          <button
            onClick={downloadFile}
            className={projectStyles.button.small}
            title="下載"
          >
            ⬇️
          </button>
          
          {/* 關閉 */}
          {onClose && (
            <button
              onClick={onClose}
              className={projectStyles.button.small}
              title="關閉"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 內容區域 */}
      <div 
        ref={containerRef}
        className={`flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 ${
          isFullscreen ? 'h-full' : 'h-96'
        }`}
      >
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600 dark:text-gray-400">載入中...</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center min-h-full p-4">
          {isImage ? (
            <img
              ref={imageRef}
              src={doc.url}
              alt={doc.name}
              className="max-w-full max-h-full object-contain"
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg)`,
                transition: 'transform 0.2s ease-in-out',
              }}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          ) : isPDF ? (
            <iframe
              src={`${doc.url}#toolbar=0&navpanes=0&scrollbar=0`}
              className="w-full h-full border-0"
              title={doc.name}
              onLoad={handleImageLoad}
            />
          ) : (
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                此文件類型不支援預覽
              </p>
              <button
                onClick={() => window.open(doc.url, '_blank')}
                className={projectStyles.button.primary}
              >
                在新分頁中開啟
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 文件資訊 */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">文件類型：</span>
            <span className="font-medium">{doc.type}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">版本：</span>
            <span className="font-medium">v{doc.version}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">上傳者：</span>
            <span className="font-medium">{doc.uploadedBy}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">分類：</span>
            <span className="font-medium">{doc.category}</span>
          </div>
        </div>
        
        {doc.description && (
          <div className="mt-2">
            <span className="text-gray-600 dark:text-gray-400">描述：</span>
            <span className="text-sm">{doc.description}</span>
          </div>
        )}
        
        {doc.tags.length > 0 && (
          <div className="mt-2">
            <span className="text-gray-600 dark:text-gray-400">標籤：</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {doc.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
