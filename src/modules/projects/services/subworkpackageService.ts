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
  serverTimestamp 
} from 'firebase/firestore';

import { db } from '@/lib/firebase-client';
import type { SubWorkpackage, TemplateToSubWorkpackageOptions } from '@/modules/projects/types/project';

// 子工作包集合名稱
const SUBWORKPACKAGE_COLLECTION = 'subworkpackages';

/**
 * 新增子工作包
 */
export const createSubWorkpackage = async (
  workpackageId: string,
  subWorkpackageData: Omit<SubWorkpackage, 'id' | 'createdAt' | 'updatedAt'>
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
  updateData: Partial<Omit<SubWorkpackage, 'id' | 'createdAt' | 'updatedAt'>>
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
export const getSubWorkpackagesByWorkpackageId = async (workpackageId: string): Promise<SubWorkpackage[]> => {
  try {
    const q = query(
      collection(db, SUBWORKPACKAGE_COLLECTION),
      where('workpackageId', '==', workpackageId),
      orderBy('createdAt', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const subWorkpackages: SubWorkpackage[] = [];

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
      } as SubWorkpackage);
    });

    return subWorkpackages;
  } catch (error) {
    console.error('查詢子工作包時發生錯誤:', error);
    throw new Error('查詢子工作包失敗');
  }
};

/**
 * 根據專案 ID 查詢所有子工作包
 */
export const getSubWorkpackagesByProjectId = async (projectId: string): Promise<SubWorkpackage[]> => {
  try {
    const q = query(
      collection(db, SUBWORKPACKAGE_COLLECTION),
      where('projectId', '==', projectId),
      orderBy('createdAt', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const subWorkpackages: SubWorkpackage[] = [];

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
      } as SubWorkpackage);
    });

    return subWorkpackages;
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
    
    const updateData: any = {
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
    const createdIds: string[] = [];

    for (const item of templateItems) {
      const subWorkpackageData: Omit<SubWorkpackage, 'id' | 'createdAt' | 'updatedAt'> = {
        name: item.name,
        description: item.description || '',
        estimatedQuantity: item.estimatedQuantity || 0,
        unit: item.unit || '個',
        status: 'draft',
        progress: 0,
        estimatedStartDate: options.estimatedStartDate || null,
        estimatedEndDate: options.estimatedEndDate || null,
        assignedTo: options.assignedTo || null,
      };

      const id = await createSubWorkpackage(workpackageId, subWorkpackageData);
      createdIds.push(id);
    }

    return createdIds;
  } catch (error) {
    console.error('從模板創建子工作包時發生錯誤:', error);
    throw new Error('從模板創建子工作包失敗');
  }
};

/**
 * 批量更新子工作包狀態
 */
export const batchUpdateSubWorkpackageStatus = async (
  subWorkpackageIds: string[],
  status: SubWorkpackage['status']
): Promise<void> => {
  try {
    const updatePromises = subWorkpackageIds.map(id => 
      updateSubWorkpackage(id, { status })
    );

    await Promise.all(updatePromises);
  } catch (error) {
    console.error('批量更新子工作包狀態時發生錯誤:', error);
    throw new Error('批量更新子工作包狀態失敗');
  }
};

/**
 * 獲取子工作包統計資訊
 */
export const getSubWorkpackageStats = async (workpackageId: string) => {
  try {
    const subWorkpackages = await getSubWorkpackagesByWorkpackageId(workpackageId);
    
    const stats = {
      total: subWorkpackages.length,
      completed: subWorkpackages.filter(wp => wp.status === 'completed').length,
      inProgress: subWorkpackages.filter(wp => wp.status === 'in-progress').length,
      draft: subWorkpackages.filter(wp => wp.status === 'draft').length,
      averageProgress: subWorkpackages.length > 0 
        ? subWorkpackages.reduce((sum, wp) => sum + (wp.progress || 0), 0) / subWorkpackages.length 
        : 0,
    };

    return stats;
  } catch (error) {
    console.error('獲取子工作包統計資訊時發生錯誤:', error);
    throw new Error('獲取子工作包統計資訊失敗');
  }
};
