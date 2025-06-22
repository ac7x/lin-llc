/**
 * 子工作包服務
 * 
 * 提供子工作包的 CRUD 操作，包括：
 * - 新增子工作包
 * - 更新子工作包
 * - 刪除子工作包
 * - 查詢子工作包
 * - 進度更新
 */

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp,
  serverTimestamp,
  FieldValue,
  getDoc
} from 'firebase/firestore';

import { db } from '@/lib/firebase-client';
import type { SubWorkPackage, TemplateToSubWorkpackageOptions } from '@/app/modules/projects/types';

// 子工作包集合名稱
const SUBWORKPACKAGE_COLLECTION = 'subworkpackages';

/**
 * 新增子工作包
 */
export const createSubWorkpackage = async (
  workpackageId: string,
  subWorkpackageData: Omit<SubWorkPackage, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, SUBWORKPACKAGE_COLLECTION), {
      ...subWorkpackageData,
      workpackageId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error('新增子工作包時發生錯誤:', error);
    throw new Error('新增子工作包失敗');
  }
};

/**
 * 更新子工作包
 */
export const updateSubWorkpackage = async (
  subWorkpackageId: string,
  updateData: Partial<Omit<SubWorkPackage, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  try {
    const docRef = doc(db, SUBWORKPACKAGE_COLLECTION, subWorkpackageId);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('更新子工作包時發生錯誤:', error);
    throw new Error('更新子工作包失敗');
  }
};

/**
 * 刪除子工作包
 */
export const deleteSubWorkpackage = async (subWorkpackageId: string): Promise<void> => {
  try {
    const docRef = doc(db, SUBWORKPACKAGE_COLLECTION, subWorkpackageId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('刪除子工作包時發生錯誤:', error);
    throw new Error('刪除子工作包失敗');
  }
};

/**
 * 根據工作包 ID 查詢子工作包
 */
export const getSubWorkpackagesByWorkpackageId = async (workpackageId: string): Promise<SubWorkPackage[]> => {
  try {
    const q = query(
      collection(db, SUBWORKPACKAGE_COLLECTION),
      where('workpackageId', '==', workpackageId)
      // 暫時移除 orderBy 以避免索引需求
      // orderBy('createdAt', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const subWorkpackages: SubWorkPackage[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      subWorkpackages.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        actualStartDate: data.actualStartDate?.toDate?.() || data.actualStartDate,
        actualEndDate: data.actualEndDate?.toDate?.() || data.actualEndDate,
        plannedStartDate: data.plannedStartDate?.toDate?.() || data.plannedStartDate,
        plannedEndDate: data.plannedEndDate?.toDate?.() || data.plannedEndDate,
        estimatedStartDate: data.estimatedStartDate?.toDate?.() || data.estimatedStartDate,
        estimatedEndDate: data.estimatedEndDate?.toDate?.() || data.estimatedEndDate,
      } as SubWorkPackage);
    });

    // 在記憶體中按創建時間排序
    return subWorkpackages.sort((a, b) => {
      const getDate = (dateField: any): Date => {
        if (dateField instanceof Date) return dateField;
        if (dateField && typeof dateField === 'string') return new Date(dateField);
        if (dateField && typeof dateField === 'object' && 'toDate' in dateField) {
          return dateField.toDate();
        }
        return new Date(0);
      };
      
      const dateA = getDate(a.createdAt);
      const dateB = getDate(b.createdAt);
      return dateA.getTime() - dateB.getTime();
    });
  } catch (error) {
    console.error('查詢子工作包時發生錯誤:', error);
    throw new Error('查詢子工作包失敗');
  }
};

/**
 * 根據專案 ID 查詢所有子工作包
 */
export const getSubWorkpackagesByProjectId = async (projectId: string): Promise<SubWorkPackage[]> => {
  try {
    // 由於子工作包沒有 projectId 欄位，我們需要先查詢專案的工作包
    // 然後根據工作包 ID 查詢子工作包
    const projectDoc = await getDoc(doc(db, 'projects', projectId));
    
    if (!projectDoc.exists()) {
      throw new Error('專案不存在');
    }

    const projectData = projectDoc.data();
    const workPackages = projectData.workPackages || [];
    
    if (workPackages.length === 0) {
      return [];
    }

    // 收集所有工作包的 ID
    const workpackageIds = workPackages.map((wp: any) => wp.id).filter(Boolean);
    
    if (workpackageIds.length === 0) {
      return [];
    }

    // 查詢所有相關的子工作包
    const subWorkpackages: SubWorkPackage[] = [];
    
    for (const workpackageId of workpackageIds) {
      try {
        const workpackageSubWorkpackages = await getSubWorkpackagesByWorkpackageId(workpackageId);
        subWorkpackages.push(...workpackageSubWorkpackages);
      } catch (error) {
        console.warn(`查詢工作包 ${workpackageId} 的子工作包時發生錯誤:`, error);
        // 繼續查詢其他工作包
      }
    }

    // 按創建時間排序
    return subWorkpackages.sort((a, b) => {
      const getDate = (dateField: any): Date => {
        if (dateField instanceof Date) return dateField;
        if (dateField && typeof dateField === 'string') return new Date(dateField);
        if (dateField && typeof dateField === 'object' && 'toDate' in dateField) {
          return dateField.toDate();
        }
        return new Date(0);
      };
      
      const dateA = getDate(a.createdAt);
      const dateB = getDate(b.createdAt);
      return dateA.getTime() - dateB.getTime();
    });

  } catch (error) {
    console.error('查詢專案子工作包時發生錯誤:', error);
    throw new Error('查詢專案子工作包失敗');
  }
};

/**
 * 更新子工作包進度
 */
export const updateSubWorkpackageProgress = async (
  subWorkpackageId: string,
  progress: number,
  notes?: string
): Promise<void> => {
  try {
    const docRef = doc(db, SUBWORKPACKAGE_COLLECTION, subWorkpackageId);
    
    const updateData: {
      progress: number;
      updatedAt: FieldValue;
      progressHistory?: unknown[];
    } = {
      progress,
      updatedAt: serverTimestamp(),
    };

    // 如果提供了備註，添加到進度歷史記錄
    if (notes) {
      const progressRecord = {
        date: Timestamp.now(),
        doneCount: progress,
        percent: progress,
        notes,
        updatedBy: 'current-user', // 應該從認證上下文獲取
      };

      // 這裡需要先獲取現有的進度歷史記錄，然後添加新記錄
      // 由於 Firestore 的限制，我們需要先讀取再更新
      const docSnap = await getDocs(query(collection(db, SUBWORKPACKAGE_COLLECTION), where('__name__', '==', subWorkpackageId)));
      if (!docSnap.empty) {
        const currentData = docSnap.docs[0].data();
        const progressHistory = currentData.progressHistory || [];
        progressHistory.push(progressRecord);
        
        updateData.progressHistory = progressHistory;
      }
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('更新子工作包進度時發生錯誤:', error);
    throw new Error('更新子工作包進度失敗');
  }
};

/**
 * 從模板創建子工作包
 */
export const createSubWorkpackagesFromTemplate = async (
  workpackageId: string,
  templateItems: Array<{ name: string; description?: string; estimatedQuantity?: number; unit?: string }>,
  options: TemplateToSubWorkpackageOptions = {}
): Promise<string[]> => {
  try {
    const subWorkpackageIds: string[] = [];

    for (const item of templateItems) {
      const subWorkpackageData: Omit<SubWorkPackage, 'id' | 'createdAt' | 'updatedAt'> = {
        name: item.name,
        description: item.description || '',
        quantity: 0,
        unitWeight: 1,
        completedUnits: 0,
        progress: 0,
        workers: [],
        estimatedQuantity: item.estimatedQuantity || 0,
        unit: item.unit || '個',
        estimatedStartDate: options.estimatedStartDate,
        estimatedEndDate: options.estimatedEndDate,
        assignedTo: options.assignedTo || null,
        status: 'draft',
      };

      const subWorkpackageId = await createSubWorkpackage(workpackageId, subWorkpackageData);
      subWorkpackageIds.push(subWorkpackageId);
    }

    return subWorkpackageIds;
  } catch (error) {
    console.error('從模板創建子工作包時發生錯誤:', error);
    throw new Error('從模板創建子工作包失敗');
  }
};

/**
 * 批次更新子工作包狀態
 */
export const batchUpdateSubWorkpackageStatus = async (
  subWorkpackageIds: string[],
  status: SubWorkPackage['status']
): Promise<void> => {
  try {
    const updatePromises = subWorkpackageIds.map(id =>
      updateSubWorkpackage(id, { status })
    );

    await Promise.all(updatePromises);
  } catch (error) {
    console.error('批次更新子工作包狀態時發生錯誤:', error);
    throw new Error('批次更新子工作包狀態失敗');
  }
};

/**
 * 獲取子工作包統計資訊
 */
export const getSubWorkpackageStats = async (workpackageId: string) => {
  try {
    const subWorkpackages = await getSubWorkpackagesByWorkpackageId(workpackageId);
    
    const total = subWorkpackages.length;
    const completed = subWorkpackages.filter(sub => sub.status === 'completed').length;
    const inProgress = subWorkpackages.filter(sub => sub.status === 'in-progress').length;
    const draft = subWorkpackages.filter(sub => sub.status === 'draft').length;
    
    const totalProgress = subWorkpackages.reduce((sum, sub) => sum + (sub.progress || 0), 0);
    const averageProgress = total > 0 ? totalProgress / total : 0;

    return {
      total,
      completed,
      inProgress,
      draft,
      averageProgress,
    };
  } catch (error) {
    console.error('獲取子工作包統計資訊時發生錯誤:', error);
    throw new Error('獲取子工作包統計資訊失敗');
  }
};
