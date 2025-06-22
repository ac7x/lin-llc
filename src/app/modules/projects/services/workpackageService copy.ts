/**
 * 工作包服務層
 * 提供工作包相關的 CRUD 操作和業務邏輯
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import type { WorkPackage, SubWorkPackage } from '../types';

const COLLECTION_NAME = 'workPackages';

/**
 * 工作包服務類別
 */
export class WorkPackageService {
  /**
   * 取得專案的所有工作包
   */
  static async getWorkPackagesByProject(projectId: string): Promise<WorkPackage[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('projectId', '==', projectId)
      );
      
      const querySnapshot = await getDocs(q);
      const workPackages = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      })) as WorkPackage[];
      
      // 在客戶端排序
      return workPackages.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date();
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date();
        return dateA.getTime() - dateB.getTime();
      });
    } catch (error) {
      console.error('取得工作包列表失敗:', error);
      throw new Error('取得工作包列表失敗');
    }
  }

  /**
   * 根據 ID 取得工作包
   */
  static async getWorkPackageById(id: string): Promise<WorkPackage | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate?.() || new Date(),
          updatedAt: docSnap.data().updatedAt?.toDate?.() || new Date(),
        } as WorkPackage;
      }
      
      return null;
    } catch (error) {
      console.error('取得工作包失敗:', error);
      throw new Error('取得工作包失敗');
    }
  }

  /**
   * 建立新工作包
   */
  static async createWorkPackage(workPackageData: Omit<WorkPackage, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...workPackageData,
        createdAt: now,
        updatedAt: now,
      });
      
      return docRef.id;
    } catch (error) {
      console.error('建立工作包失敗:', error);
      throw new Error('建立工作包失敗');
    }
  }

  /**
   * 更新工作包
   */
  static async updateWorkPackage(id: string, workPackageData: Partial<WorkPackage>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...workPackageData,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('更新工作包失敗:', error);
      throw new Error('更新工作包失敗');
    }
  }

  /**
   * 刪除工作包
   */
  static async deleteWorkPackage(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('刪除工作包失敗:', error);
      throw new Error('刪除工作包失敗');
    }
  }

  /**
   * 更新子工作包進度
   */
  static async updateSubWorkPackageProgress(
    workPackageId: string, 
    subWorkPackageId: string, 
    progress: number
  ): Promise<void> {
    try {
      const workPackage = await this.getWorkPackageById(workPackageId);
      if (!workPackage) {
        throw new Error('工作包不存在');
      }

      const updatedSubWorkPackages = workPackage.subPackages.map(sub => {
        if (sub.id === subWorkPackageId) {
          return {
            ...sub,
            progress,
            updatedAt: new Date(),
          };
        }
        return sub;
      });

      await this.updateWorkPackage(workPackageId, {
        subPackages: updatedSubWorkPackages,
      });
    } catch (error) {
      console.error('更新子工作包進度失敗:', error);
      throw new Error('更新子工作包進度失敗');
    }
  }

  /**
   * 根據狀態取得工作包
   */
  static async getWorkPackagesByStatus(status: string): Promise<WorkPackage[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('status', '==', status)
      );
      
      const querySnapshot = await getDocs(q);
      const workPackages = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      })) as WorkPackage[];
      
      // 在客戶端排序
      return workPackages.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date();
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date();
        return dateB.getTime() - dateA.getTime(); // 降序排列
      });
    } catch (error) {
      console.error('根據狀態取得工作包失敗:', error);
      throw new Error('根據狀態取得工作包失敗');
    }
  }
} 