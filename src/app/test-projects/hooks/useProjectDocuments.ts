/**
 * 專案文件管理 Hook
 * 
 * 提供專案文件的狀態管理和操作功能，包括：
 * - 文件列表管理
 * - 文件上傳和下載
 * - 文件搜尋和篩選
 * - 文件版本管理
 * - 錯誤處理
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  getDocumentsByProjectId, 
  getDocumentsByWorkpackageId,
  createDocument,
  updateDocument,
  deleteDocument,
  uploadDocumentVersion,
  getDocumentVersions,
  searchDocuments,
  getDocumentStats,
  type DocumentFile,
  type DocumentUploadData
} from '@/app/test-projects/services/documentService';
import type { DocumentCategory, DocumentVersion, DocumentStats } from '@/app/test-projects/types';
import { logError } from '@/utils/errorUtils';

interface UseProjectDocumentsOptions {
  projectId?: string;
  workpackageId?: string;
  autoLoad?: boolean;
}

interface UseProjectDocumentsReturn {
  // 狀態
  documents: DocumentFile[];
  loading: boolean;
  error: string | null;
  stats: DocumentStats | null;
  
  // 操作
  loadDocuments: () => Promise<void>;
  uploadDocument: (data: DocumentUploadData) => Promise<string>;
  updateDocumentInfo: (documentId: string, updateData: Partial<DocumentFile>) => Promise<void>;
  deleteDocumentFile: (documentId: string) => Promise<void>;
  uploadNewVersion: (documentId: string, file: File, changeLog: string) => Promise<void>;
  getVersions: (documentId: string) => Promise<DocumentVersion[]>;
  searchDocumentsByTerm: (searchTerm: string, category?: DocumentCategory, tags?: string[]) => Promise<DocumentFile[]>;
  loadStats: () => Promise<void>;
  
  // 工具
  clearError: () => void;
  getDocumentById: (documentId: string) => DocumentFile | undefined;
  getDocumentsByCategory: (category: DocumentCategory) => DocumentFile[];
  getDocumentsByTag: (tag: string) => DocumentFile[];
}

export const useProjectDocuments = (options: UseProjectDocumentsOptions = {}): UseProjectDocumentsReturn => {
  const { projectId, workpackageId, autoLoad = true } = options;
  
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DocumentStats | null>(null);

  // 載入文件列表
  const loadDocuments = useCallback(async () => {
    if (!projectId && !workpackageId) {
      setError('需要提供專案 ID 或工作包 ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let documentsData: DocumentFile[];
      
      if (workpackageId) {
        documentsData = await getDocumentsByWorkpackageId(workpackageId);
      } else {
        documentsData = await getDocumentsByProjectId(projectId!);
      }
      
      setDocuments(documentsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '載入文件失敗';
      setError(errorMessage);
      logError(err as Error, { 
        operation: 'load_documents', 
        projectId, 
        workpackageId 
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, workpackageId]);

  // 上傳文件
  const uploadDocument = useCallback(async (data: DocumentUploadData): Promise<string> => {
    setLoading(true);
    setError(null);

    try {
      const documentId = await createDocument(data);
      await loadDocuments(); // 重新載入文件列表
      return documentId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '上傳文件失敗';
      setError(errorMessage);
      logError(err as Error, { 
        operation: 'upload_document', 
        projectId: data.projectId 
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadDocuments]);

  // 更新文件資訊
  const updateDocumentInfo = useCallback(async (
    documentId: string, 
    updateData: Partial<DocumentFile>
  ): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await updateDocument(documentId, updateData);
      await loadDocuments(); // 重新載入文件列表
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新文件失敗';
      setError(errorMessage);
      logError(err as Error, { 
        operation: 'update_document', 
        documentId 
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadDocuments]);

  // 刪除文件
  const deleteDocumentFile = useCallback(async (documentId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await deleteDocument(documentId);
      await loadDocuments(); // 重新載入文件列表
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '刪除文件失敗';
      setError(errorMessage);
      logError(err as Error, { 
        operation: 'delete_document', 
        documentId 
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadDocuments]);

  // 上傳新版本
  const uploadNewVersion = useCallback(async (
    documentId: string, 
    file: File, 
    changeLog: string
  ): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await uploadDocumentVersion(documentId, file, changeLog);
      await loadDocuments(); // 重新載入文件列表
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '上傳新版本失敗';
      setError(errorMessage);
      logError(err as Error, { 
        operation: 'upload_version', 
        documentId 
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadDocuments]);

  // 獲取版本歷史
  const getVersions = useCallback(async (documentId: string): Promise<DocumentVersion[]> => {
    try {
      return await getDocumentVersions(documentId);
    } catch (err) {
      logError(err as Error, { 
        operation: 'get_versions', 
        documentId 
      });
      throw err;
    }
  }, []);

  // 搜尋文件
  const searchDocumentsByTerm = useCallback(async (
    searchTerm: string, 
    category?: DocumentCategory, 
    tags?: string[]
  ): Promise<DocumentFile[]> => {
    if (!projectId) {
      throw new Error('需要提供專案 ID 進行搜尋');
    }

    try {
      return await searchDocuments(projectId, searchTerm, category, tags);
    } catch (err) {
      logError(err as Error, { 
        operation: 'search_documents', 
        projectId,
        searchTerm 
      });
      throw err;
    }
  }, [projectId]);

  // 載入統計資訊
  const loadStats = useCallback(async () => {
    if (!projectId) {
      setError('需要提供專案 ID 載入統計資訊');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const statsData = await getDocumentStats(projectId);
      setStats(statsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '載入統計資訊失敗';
      setError(errorMessage);
      logError(err as Error, { 
        operation: 'load_stats', 
        projectId 
      });
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // 清除錯誤
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 根據 ID 獲取文件
  const getDocumentById = useCallback((documentId: string): DocumentFile | undefined => {
    return documents.find(doc => doc.id === documentId);
  }, [documents]);

  // 根據分類獲取文件
  const getDocumentsByCategory = useCallback((category: DocumentCategory): DocumentFile[] => {
    return documents.filter(doc => doc.category === category);
  }, [documents]);

  // 根據標籤獲取文件
  const getDocumentsByTag = useCallback((tag: string): DocumentFile[] => {
    return documents.filter(doc => doc.tags.includes(tag));
  }, [documents]);

  // 自動載入
  useEffect(() => {
    if (autoLoad && (projectId || workpackageId)) {
      loadDocuments();
    }
  }, [autoLoad, projectId, workpackageId, loadDocuments]);

  return {
    // 狀態
    documents,
    loading,
    error,
    stats,
    
    // 操作
    loadDocuments,
    uploadDocument,
    updateDocumentInfo,
    deleteDocumentFile,
    uploadNewVersion,
    getVersions,
    searchDocumentsByTerm,
    loadStats,
    
    // 工具
    clearError,
    getDocumentById,
    getDocumentsByCategory,
    getDocumentsByTag,
  };
};
