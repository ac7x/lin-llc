/**
 * 文件版本管理組件
 * 
 * 提供文件版本歷史查看和版本上傳功能，包括：
 * - 版本歷史列表
 * - 版本比較
 * - 新版本上傳
 * - 版本回滾
 */

'use client';

import { useState, useEffect } from 'react';
import { projectStyles } from '@/app/test-projects/styles';
import type { DocumentVersion, ProjectDocumentFile } from '@/app/test-projects/types';
import { formatDateDisplay } from '@/app/test-projects/types';

interface DocumentVersioningProps {
  document: ProjectDocumentFile;
  versions: DocumentVersion[];
  onUploadNewVersion: (file: File, changeLog: string) => Promise<void>;
  onVersionSelect?: (version: DocumentVersion) => void;
  selectedVersion?: DocumentVersion;
}

export default function DocumentVersioning({
  document,
  versions,
  onUploadNewVersion,
  onVersionSelect,
  selectedVersion,
}: DocumentVersioningProps) {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [changeLog, setChangeLog] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
    }
  };

  const handleUploadNewVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadFile || !changeLog.trim()) {
      return;
    }

    setUploading(true);
    try {
      await onUploadNewVersion(uploadFile, changeLog);
      setShowUploadForm(false);
      setUploadFile(null);
      setChangeLog('');
    } catch (error) {
      console.error('上傳新版本失敗:', error);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string): string => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📈';
    if (type.includes('zip') || type.includes('archive')) return '📦';
    if (type.includes('video')) return '🎥';
    if (type.includes('audio')) return '🎵';
    return '📁';
  };

  return (
    <div className="space-y-6">
      {/* 當前版本資訊 */}
      <div className={projectStyles.card.base}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          當前版本 (v{document.version})
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">文件名稱</p>
            <p className="font-medium">{document.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">文件大小</p>
            <p className="font-medium">{formatFileSize(document.size)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">上傳時間</p>
            <p className="font-medium">{formatDateDisplay(document.uploadedAt)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">上傳者</p>
            <p className="font-medium">{document.uploadedBy}</p>
          </div>
        </div>

        <div className="mt-4">
          <a
            href={document.url}
            target="_blank"
            rel="noopener noreferrer"
            className={projectStyles.button.primary}
          >
            下載當前版本
          </a>
        </div>
      </div>

      {/* 版本歷史 */}
      <div className={projectStyles.card.base}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            版本歷史
          </h3>
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className={projectStyles.button.secondary}
          >
            {showUploadForm ? '取消上傳' : '上傳新版本'}
          </button>
        </div>

        {/* 上傳新版本表單 */}
        {showUploadForm && (
          <div className="mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
            <form onSubmit={handleUploadNewVersion} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  選擇文件
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className={projectStyles.form.input}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  版本說明
                </label>
                <textarea
                  value={changeLog}
                  onChange={(e) => setChangeLog(e.target.value)}
                  className={projectStyles.form.textarea}
                  placeholder="請描述此版本的變更內容..."
                  rows={3}
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={uploading || !uploadFile || !changeLog.trim()}
                  className={projectStyles.button.primary}
                >
                  {uploading ? '上傳中...' : '上傳新版本'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadForm(false);
                    setUploadFile(null);
                    setChangeLog('');
                  }}
                  className={projectStyles.button.secondary}
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 版本列表 */}
        <div className="space-y-3">
          {versions.map((version) => (
            <div
              key={version.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedVersion?.id === version.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => onVersionSelect?.(version)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getFileIcon(document.type)}</span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">v{version.version}</span>
                      {version.version === document.version && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                          當前版本
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDateDisplay(version.uploadedAt)} • {version.uploadedBy}
                    </p>
                    {version.changeLog && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                        {version.changeLog}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <a
                    href={version.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={projectStyles.button.small}
                    onClick={(e) => e.stopPropagation()}
                  >
                    下載
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {versions.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            尚無版本歷史記錄
          </div>
        )}
      </div>
    </div>
  );
}
