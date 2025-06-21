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
  FieldValue
} from 'firebase/firestore';

import { db } from '@/lib/firebase-client';
import type { SubWorkPackage, TemplateToSubWorkpackageOptions } from '@/app/test-projects/types/project';

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
      where('workpackageId', '==', workpackageId),
      orderBy('createdAt', 'asc')
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

    return subWorkpackages;
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
    const q = query(
      collection(db, SUBWORKPACKAGE_COLLECTION),
      where('projectId', '==', projectId),
      orderBy('createdAt', 'asc')
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
