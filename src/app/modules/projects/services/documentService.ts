/**
 * 專案文件服務
 * 
 * 提供專案文件的 CRUD 操作，包括：
 * - 文件上傳和下載
 * - 文件版本管理
 * - 文件分類和標籤
 * - 文件權限控制
 * - 雲端存儲整合
 */

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp,
  FieldValue
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  listAll
} from 'firebase/storage';

import { db, storage } from '@/lib/firebase-client';
import type { ProjectDocumentFile, DocumentVersion, DocumentCategory } from '@/app/modules/projects/types';

// 文件集合名稱
const DOCUMENT_COLLECTION = 'projectDocuments';
const DOCUMENT_VERSIONS_COLLECTION = 'documentVersions';

// 文件類型定義
export interface DocumentFile extends ProjectDocumentFile {}

export interface DocumentUploadData {
  file: File;
  name: string;
  description?: string;
  category: DocumentCategory;
  tags: string[];
  projectId: string;
  workpackageId?: string;
  isPublic?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * 上傳文件到雲端存儲
 */
export const uploadDocumentToStorage = async (
  file: File,
  projectId: string,
  fileName: string
): Promise<{ url: string; thumbnailUrl?: string }> => {
  try {
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const storagePath = `projects/${projectId}/documents/${timestamp}_${fileName}.${fileExtension}`;
    const storageRef = ref(storage, storagePath);

    // 上傳文件
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    // 如果是圖片，生成縮圖
    let thumbnailURL: string | undefined;
    if (file.type.startsWith('image/')) {
      // 這裡可以實作圖片縮圖生成邏輯
      thumbnailURL = downloadURL;
    }

    return {
      url: downloadURL,
      thumbnailUrl: thumbnailURL,
    };
  } catch (error) {
    console.error('上傳文件到雲端存儲時發生錯誤:', error);
    throw new Error('文件上傳失敗');
  }
};

/**
 * 新增文件記錄
 */
export const createDocument = async (documentData: DocumentUploadData): Promise<string> => {
  try {
    // 上傳文件到雲端存儲
    const { url, thumbnailUrl } = await uploadDocumentToStorage(
      documentData.file,
      documentData.projectId,
      documentData.name
    );

    // 創建文件記錄
    const docRef = await addDoc(collection(db, DOCUMENT_COLLECTION), {
      name: documentData.name,
      originalName: documentData.file.name,
      size: documentData.file.size,
      type: documentData.file.type,
      url,
      thumbnailUrl,
      uploadedAt: serverTimestamp(),
      uploadedBy: 'current-user', // 應該從認證上下文獲取
      version: 1,
      category: documentData.category,
      tags: documentData.tags || [],
      description: documentData.description || '',
      projectId: documentData.projectId,
      workpackageId: documentData.workpackageId || null,
      isPublic: documentData.isPublic || false,
      metadata: documentData.metadata || {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 創建版本記錄
    await addDoc(collection(db, DOCUMENT_VERSIONS_COLLECTION), {
      documentId: docRef.id,
      version: 1,
      url,
      uploadedAt: serverTimestamp(),
      uploadedBy: 'current-user',
      changeLog: '初始版本',
    });

    return docRef.id;
  } catch (error) {
    console.error('新增文件時發生錯誤:', error);
    throw new Error('新增文件失敗');
  }
};

/**
 * 更新文件資訊
 */
export const updateDocument = async (
  documentId: string,
  updateData: Partial<DocumentFile>
): Promise<void> => {
  try {
    const docRef = doc(db, DOCUMENT_COLLECTION, documentId);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('更新文件時發生錯誤:', error);
    throw new Error('更新文件失敗');
  }
};

/**
 * 上傳新版本文件
 */
export const uploadDocumentVersion = async (
  documentId: string,
  file: File,
  changeLog: string
): Promise<void> => {
  try {
    // 獲取原文件資訊
    const docRef = doc(db, DOCUMENT_COLLECTION, documentId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('文件不存在');
    }

    const documentData = docSnap.data() as DocumentFile;
    
    // 上傳新版本到雲端存儲
    const { url } = await uploadDocumentToStorage(
      file,
      documentData.projectId,
      `${documentData.name}_v${documentData.version + 1}`
    );

    // 更新文件記錄
    await updateDoc(docRef, {
      url,
      size: file.size,
      type: file.type,
      version: documentData.version + 1,
      updatedAt: serverTimestamp(),
    });

    // 創建新版本記錄
    await addDoc(collection(db, DOCUMENT_VERSIONS_COLLECTION), {
      documentId,
      version: documentData.version + 1,
      url,
      uploadedAt: serverTimestamp(),
      uploadedBy: 'current-user',
      changeLog,
    });
  } catch (error) {
    console.error('上傳文件新版本時發生錯誤:', error);
    throw new Error('上傳文件新版本失敗');
  }
};

/**
 * 刪除文件
 */
export const deleteDocument = async (documentId: string): Promise<void> => {
  try {
    // 獲取文件資訊
    const docRef = doc(db, DOCUMENT_COLLECTION, documentId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('文件不存在');
    }

    const documentData = docSnap.data() as DocumentFile;

    // 刪除雲端存儲中的文件
    const storageRef = ref(storage, documentData.url);
    await deleteObject(storageRef);

    // 刪除所有版本記錄
    const versionsQuery = query(
      collection(db, DOCUMENT_VERSIONS_COLLECTION),
      where('documentId', '==', documentId)
    );
    const versionsSnapshot = await getDocs(versionsQuery);
    
    const deleteVersionPromises = versionsSnapshot.docs.map(doc => 
      deleteDoc(doc.ref)
    );
    await Promise.all(deleteVersionPromises);

    // 刪除文件記錄
    await deleteDoc(docRef);
  } catch (error) {
    console.error('刪除文件時發生錯誤:', error);
    throw new Error('刪除文件失敗');
  }
};

/**
 * 根據專案 ID 查詢文件
 */
export const getDocumentsByProjectId = async (projectId: string): Promise<DocumentFile[]> => {
  try {
    const q = query(
      collection(db, DOCUMENT_COLLECTION),
      where('projectId', '==', projectId)
    );

    const querySnapshot = await getDocs(q);
    const documents: DocumentFile[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      documents.push({
        id: doc.id,
        ...data,
        uploadedAt: data.uploadedAt?.toDate?.() || data.uploadedAt,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      } as DocumentFile);
    });

    // 在記憶體中按上傳時間排序
    return documents.sort((a, b) => {
      const dateA = a.uploadedAt instanceof Date ? a.uploadedAt : 
                   a.uploadedAt && typeof a.uploadedAt === 'object' && 'toDate' in a.uploadedAt ? 
                   a.uploadedAt.toDate() : new Date(0);
      const dateB = b.uploadedAt instanceof Date ? b.uploadedAt : 
                   b.uploadedAt && typeof b.uploadedAt === 'object' && 'toDate' in b.uploadedAt ? 
                   b.uploadedAt.toDate() : new Date(0);
      return dateB.getTime() - dateA.getTime(); // 降序排列
    });
  } catch (error) {
    console.error('查詢專案文件時發生錯誤:', error);
    throw new Error('查詢專案文件失敗');
  }
};

/**
 * 根據工作包 ID 查詢文件
 */
export const getDocumentsByWorkpackageId = async (workpackageId: string): Promise<DocumentFile[]> => {
  try {
    const q = query(
      collection(db, DOCUMENT_COLLECTION),
      where('workpackageId', '==', workpackageId)
    );

    const querySnapshot = await getDocs(q);
    const documents: DocumentFile[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      documents.push({
        id: doc.id,
        ...data,
        uploadedAt: data.uploadedAt?.toDate?.() || data.uploadedAt,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      } as DocumentFile);
    });

    // 在記憶體中按上傳時間排序
    return documents.sort((a, b) => {
      const dateA = a.uploadedAt instanceof Date ? a.uploadedAt : 
                   a.uploadedAt && typeof a.uploadedAt === 'object' && 'toDate' in a.uploadedAt ? 
                   a.uploadedAt.toDate() : new Date(0);
      const dateB = b.uploadedAt instanceof Date ? b.uploadedAt : 
                   b.uploadedAt && typeof b.uploadedAt === 'object' && 'toDate' in b.uploadedAt ? 
                   b.uploadedAt.toDate() : new Date(0);
      return dateB.getTime() - dateA.getTime(); // 降序排列
    });
  } catch (error) {
    console.error('查詢工作包文件時發生錯誤:', error);
    throw new Error('查詢工作包文件失敗');
  }
};

/**
 * 獲取文件版本歷史
 */
export const getDocumentVersions = async (documentId: string): Promise<DocumentVersion[]> => {
  try {
    const q = query(
      collection(db, DOCUMENT_VERSIONS_COLLECTION),
      where('documentId', '==', documentId),
      orderBy('version', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const versions: DocumentVersion[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      versions.push({
        id: doc.id,
        documentId,
        version: data.version,
        url: data.url,
        uploadedAt: data.uploadedAt?.toDate?.() || data.uploadedAt,
        uploadedBy: data.uploadedBy,
        changeLog: data.changeLog,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      } as DocumentVersion);
    });

    return versions;
  } catch (error) {
    console.error('查詢文件版本歷史時發生錯誤:', error);
    throw new Error('查詢文件版本歷史失敗');
  }
};

/**
 * 搜尋文件
 */
export const searchDocuments = async (
  projectId: string,
  searchTerm: string,
  category?: DocumentCategory,
  tags?: string[]
): Promise<DocumentFile[]> => {
  try {
    let q = query(
      collection(db, DOCUMENT_COLLECTION),
      where('projectId', '==', projectId)
    );

    const querySnapshot = await getDocs(q);
    const documents: DocumentFile[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      documents.push({
        id: doc.id,
        ...data,
        uploadedAt: data.uploadedAt?.toDate?.() || data.uploadedAt,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      } as DocumentFile);
    });

    // 在記憶體中進行篩選和搜尋
    const filteredDocuments = documents.filter(doc => {
      // 搜尋詞篩選
      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        const matchesSearch = 
          doc.name.toLowerCase().includes(lowerSearchTerm) ||
          doc.description?.toLowerCase().includes(lowerSearchTerm) ||
          doc.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm));
        
        if (!matchesSearch) return false;
      }

      // 分類篩選
      if (category && doc.category !== category) {
        return false;
      }

      // 標籤篩選
      if (tags && tags.length > 0) {
        const hasMatchingTag = tags.some(tag => doc.tags.includes(tag));
        if (!hasMatchingTag) return false;
      }

      return true;
    });

    // 在記憶體中按上傳時間排序
    return filteredDocuments.sort((a, b) => {
      const dateA = a.uploadedAt instanceof Date ? a.uploadedAt : 
                   a.uploadedAt && typeof a.uploadedAt === 'object' && 'toDate' in a.uploadedAt ? 
                   a.uploadedAt.toDate() : new Date(0);
      const dateB = b.uploadedAt instanceof Date ? b.uploadedAt : 
                   b.uploadedAt && typeof b.uploadedAt === 'object' && 'toDate' in b.uploadedAt ? 
                   b.uploadedAt.toDate() : new Date(0);
      return dateB.getTime() - dateA.getTime(); // 降序排列
    });
  } catch (error) {
    console.error('搜尋文件時發生錯誤:', error);
    throw new Error('搜尋文件失敗');
  }
};

/**
 * 獲取文件統計資訊
 */
export const getDocumentStats = async (projectId: string) => {
  try {
    const documents = await getDocumentsByProjectId(projectId);
    
    const stats = {
      totalDocuments: documents.length,
      totalSize: documents.reduce((sum, doc) => sum + doc.size, 0),
      byCategory: {} as Record<DocumentCategory, number>,
      byType: {} as Record<string, number>,
      recentUploads: documents.slice(0, 5),
    };

    // 按分類統計
    documents.forEach(doc => {
      stats.byCategory[doc.category] = (stats.byCategory[doc.category] || 0) + 1;
    });

    // 按類型統計
    documents.forEach(doc => {
      const fileType = doc.type.split('/')[0];
      stats.byType[fileType] = (stats.byType[fileType] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('獲取文件統計時發生錯誤:', error);
    throw new Error('獲取文件統計失敗');
  }
};
