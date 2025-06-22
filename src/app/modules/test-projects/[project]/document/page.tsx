/**
 * 專案文件管理頁面
 * 
 * 提供專案的完整文件管理功能，包括：
 * - 文件上傳和下載
 * - 文件分類和標籤管理
 * - 文件搜尋和篩選
 * - 文件版本管理
 * - 藍圖查看器
 * - 雲端存儲整合
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { LoadingSpinner, DataLoader, PageContainer, PageHeader } from '@/app/modules/test-projects/components/common';
import { BlueprintViewer, DocumentVersioning } from '@/app/modules/test-projects/components/document';
import { useProjectDocuments } from '@/app/modules/test-projects/hooks/useProjectDocuments';
import type { Project, ProjectDocumentFile, DocumentCategory, DocumentVersion } from '@/app/modules/test-projects/types';
import { logError, safeAsync, retry } from '@/utils/errorUtils';
import { projectStyles } from '@/app/modules/test-projects/styles';

interface ProjectWithId extends Project {
  id: string;
}

export default function ProjectDocumentPage() {
  const params = useParams();
  const projectId = params.project as string;
  const [project, setProject] = useState<ProjectWithId | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 文件管理狀態
  const [selectedDocument, setSelectedDocument] = useState<ProjectDocumentFile | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | undefined>(undefined);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [showVersioning, setShowVersioning] = useState(false);
  
  // 搜尋和篩選狀態
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | 'all'>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'uploadedAt' | 'size' | 'category'>('uploadedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // 使用文件管理 Hook
  const {
    documents,
    loading: documentsLoading,
    error: documentsError,
    stats,
    uploadDocument,
    updateDocumentInfo,
    deleteDocumentFile,
    uploadNewVersion,
    getVersions,
    searchDocumentsByTerm,
    loadStats,
    getDocumentsByCategory,
    getDocumentsByTag,
  } = useProjectDocuments({ projectId, autoLoad: true });

  // 載入專案資料
  const loadProject = async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    await safeAsync(async () => {
      const projectDoc = await retry(() => getDoc(doc(db, 'projects', projectId)), 3, 1000);
      
      if (!projectDoc.exists()) {
        throw new Error('專案不存在');
      }

      const projectData = projectDoc.data() as Project;
      setProject({
        ...projectData,
        id: projectDoc.id,
      });
    }, (error) => {
      setError(error instanceof Error ? error.message : '載入專案失敗');
      logError(error, { operation: 'fetch_project', projectId });
    });

    setLoading(false);
  };

  useEffect(() => {
    loadProject();
  }, [projectId]);

  useEffect(() => {
    if (project) {
      loadStats();
    }
  }, [project, loadStats]);

  // 處理文件上傳
  const handleFileUpload = async (formData: FormData) => {
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as DocumentCategory;
    const tags = (formData.get('tags') as string).split(',').map(tag => tag.trim()).filter(Boolean);
    const isPublic = formData.get('isPublic') === 'true';

    if (!file || !name || !category) {
      throw new Error('請填寫必要欄位');
    }

    await uploadDocument({
      file,
      name,
      description,
      category,
      tags,
      projectId,
      isPublic,
    });

    setShowUploadForm(false);
  };

  // 處理文件刪除
  const handleDeleteDocument = async (documentId: string) => {
    if (confirm('確定要刪除此文件嗎？此操作無法復原。')) {
      await deleteDocumentFile(documentId);
    }
  };

  // 處理文件預覽
  const handlePreviewDocument = (document: ProjectDocumentFile) => {
    setSelectedDocument(document);
    setShowViewer(true);
  };

  // 處理版本管理
  const handleVersionManagement = async (document: ProjectDocumentFile) => {
    setSelectedDocument(document);
    setShowVersioning(true);
  };

  // 處理新版本上傳
  const handleUploadNewVersion = async (file: File, changeLog: string) => {
    if (!selectedDocument) return;
    
    await uploadNewVersion(selectedDocument.id, file, changeLog);
  };

  // 篩選和排序文件
  const filteredAndSortedDocuments = documents
    .filter(doc => {
      // 搜尋篩選
      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        const matchesSearch = 
          doc.name.toLowerCase().includes(lowerSearchTerm) ||
          doc.description?.toLowerCase().includes(lowerSearchTerm) ||
          doc.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm));
        
        if (!matchesSearch) return false;
      }

      // 分類篩選
      if (selectedCategory !== 'all' && doc.category !== selectedCategory) {
        return false;
      }

      // 標籤篩選
      if (selectedTags.length > 0) {
        const hasMatchingTag = selectedTags.some(tag => doc.tags.includes(tag));
        if (!hasMatchingTag) return false;
      }

      return true;
    })
    .sort((a, b) => {
      let aValue: string | number | Date;
      let bValue: string | number | Date;

      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'size':
          aValue = a.size;
          bValue = b.size;
          break;
        case 'category':
          aValue = a.category;
          bValue = b.category;
          break;
        case 'uploadedAt':
        default:
          const getDate = (dateField: any): Date => {
            if (dateField instanceof Date) return dateField;
            if (dateField && typeof dateField === 'string') return new Date(dateField);
            if (dateField && typeof dateField === 'object' && 'toDate' in dateField) {
              return dateField.toDate();
            }
            return new Date(0);
          };
          aValue = getDate(a.uploadedAt);
          bValue = getDate(b.uploadedAt);
          break;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        const comparison = aValue.getTime() - bValue.getTime();
        return sortDirection === 'asc' ? comparison : -comparison;
      } else {
        const comparison = (aValue as number) - (bValue as number);
        return sortDirection === 'asc' ? comparison : -comparison;
      }
    });

  // 獲取所有可用的標籤
  const allTags = Array.from(new Set(documents.flatMap(doc => doc.tags))).sort();

  // 獲取文件類型圖示
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

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            載入失敗
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {error || '專案不存在'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <PageContainer>
      <PageHeader 
        title={`${project.projectName} - 文件管理`}
        subtitle="管理專案相關文件和藍圖"
      >
        <button
          onClick={() => setShowUploadForm(true)}
          className={projectStyles.button.primary}
        >
          上傳文件
        </button>
      </PageHeader>

      {/* 統計資訊 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className={projectStyles.card.stats}>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.totalDocuments}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">總文件數</div>
          </div>
          <div className={projectStyles.card.stats}>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatFileSize(stats.totalSize)}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">總大小</div>
          </div>
          <div className={projectStyles.card.stats}>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {Object.keys(stats.byCategory).length}
            </div>
            <div className="text-sm text-purple-600 dark:text-purple-400">分類數</div>
          </div>
          <div className={projectStyles.card.stats}>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {allTags.length}
            </div>
            <div className="text-sm text-orange-600 dark:text-orange-400">標籤數</div>
          </div>
        </div>
      )}

      {/* 搜尋和篩選 */}
      <div className={projectStyles.card.base}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 搜尋 */}
          <div>
            <label className={projectStyles.form.label}>搜尋</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜尋文件名稱、描述或標籤..."
              className={projectStyles.form.input}
            />
          </div>

          {/* 分類篩選 */}
          <div>
            <label className={projectStyles.form.label}>分類</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as DocumentCategory | 'all')}
              className={projectStyles.form.input}
            >
              <option value="all">所有分類</option>
              <option value="blueprint">藍圖</option>
              <option value="contract">合約</option>
              <option value="specification">規格書</option>
              <option value="report">報告</option>
              <option value="photo">照片</option>
              <option value="video">影片</option>
              <option value="drawing">圖紙</option>
              <option value="manual">手冊</option>
              <option value="certificate">證書</option>
              <option value="permit">許可證</option>
              <option value="invoice">發票</option>
              <option value="receipt">收據</option>
              <option value="other">其他</option>
            </select>
          </div>

          {/* 標籤篩選 */}
          <div>
            <label className={projectStyles.form.label}>標籤</label>
            <select
              multiple
              value={selectedTags}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, option => option.value);
                setSelectedTags(values);
              }}
              className={projectStyles.form.input}
            >
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>

          {/* 排序 */}
          <div>
            <label className={projectStyles.form.label}>排序</label>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className={projectStyles.form.input}
              >
                <option value="uploadedAt">上傳時間</option>
                <option value="name">文件名稱</option>
                <option value="size">文件大小</option>
                <option value="category">分類</option>
              </select>
              <button
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className={projectStyles.button.small}
              >
                {sortDirection === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 文件列表 */}
      <DataLoader
        loading={documentsLoading}
        error={documentsError ? new Error(documentsError) : null}
        data={filteredAndSortedDocuments}
      >
        {(data) => (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.map((doc) => (
              <div key={doc.id} className={projectStyles.card.base}>
                {/* 文件縮圖 */}
                <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg mb-3 flex items-center justify-center">
                  {doc.thumbnailUrl ? (
                    <img
                      src={doc.thumbnailUrl}
                      alt={doc.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <span className="text-4xl">{getFileIcon(doc.type)}</span>
                  )}
                </div>

                {/* 文件資訊 */}
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {doc.name}
                  </h3>
                  
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <p>{formatFileSize(doc.size)}</p>
                    <p>v{doc.version}</p>
                    <p>{doc.category}</p>
                  </div>

                  {doc.description && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                      {doc.description}
                    </p>
                  )}

                  {doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {doc.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {doc.tags.length > 3 && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded">
                          +{doc.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* 操作按鈕 */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handlePreviewDocument(doc)}
                    className={projectStyles.button.small}
                    title="預覽"
                  >
                    👁️
                  </button>
                  <button
                    onClick={() => handleVersionManagement(doc)}
                    className={projectStyles.button.small}
                    title="版本管理"
                  >
                    📋
                  </button>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={projectStyles.button.small}
                    title="下載"
                  >
                    ⬇️
                  </a>
                  <button
                    onClick={() => handleDeleteDocument(doc.id)}
                    className={projectStyles.button.small}
                    title="刪除"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DataLoader>

      {filteredAndSortedDocuments.length === 0 && !documentsLoading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📁</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            尚無文件
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            開始上傳您的第一個文件
          </p>
          <button
            onClick={() => setShowUploadForm(true)}
            className={projectStyles.button.primary}
          >
            上傳文件
          </button>
        </div>
      )}

      {/* 文件上傳模態框 */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              上傳文件
            </h2>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleFileUpload(formData);
            }} className="space-y-4">
              <div>
                <label className={projectStyles.form.label}>
                  選擇文件 <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  name="file"
                  className={projectStyles.form.input}
                  required
                />
              </div>

              <div>
                <label className={projectStyles.form.label}>
                  文件名稱 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  className={projectStyles.form.input}
                  placeholder="請輸入文件名稱"
                  required
                />
              </div>

              <div>
                <label className={projectStyles.form.label}>描述</label>
                <textarea
                  name="description"
                  className={projectStyles.form.textarea}
                  placeholder="請輸入文件描述"
                  rows={3}
                />
              </div>

              <div>
                <label className={projectStyles.form.label}>
                  分類 <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  className={projectStyles.form.input}
                  required
                >
                  <option value="">請選擇分類</option>
                  <option value="blueprint">藍圖</option>
                  <option value="contract">合約</option>
                  <option value="specification">規格書</option>
                  <option value="report">報告</option>
                  <option value="photo">照片</option>
                  <option value="video">影片</option>
                  <option value="drawing">圖紙</option>
                  <option value="manual">手冊</option>
                  <option value="certificate">證書</option>
                  <option value="permit">許可證</option>
                  <option value="invoice">發票</option>
                  <option value="receipt">收據</option>
                  <option value="other">其他</option>
                </select>
              </div>

              <div>
                <label className={projectStyles.form.label}>標籤</label>
                <input
                  type="text"
                  name="tags"
                  className={projectStyles.form.input}
                  placeholder="用逗號分隔多個標籤"
                />
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isPublic"
                    value="true"
                    className="mr-2"
                  />
                  <span className={projectStyles.form.label}>公開文件</span>
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className={projectStyles.button.primary}
                >
                  上傳
                </button>
                <button
                  type="button"
                  onClick={() => setShowUploadForm(false)}
                  className={projectStyles.button.secondary}
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 藍圖查看器模態框 */}
      {showViewer && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <BlueprintViewer
              document={selectedDocument}
              onClose={() => {
                setShowViewer(false);
                setSelectedDocument(null);
              }}
            />
          </div>
        </div>
      )}

      {/* 版本管理模態框 */}
      {showVersioning && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <DocumentVersioning
              document={selectedDocument}
              versions={[]} // 這裡需要實作版本載入
              onUploadNewVersion={handleUploadNewVersion}
              onVersionSelect={setSelectedVersion}
              selectedVersion={selectedVersion}
            />
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowVersioning(false);
                  setSelectedDocument(null);
                  setSelectedVersion(undefined);
                }}
                className={projectStyles.button.secondary}
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
