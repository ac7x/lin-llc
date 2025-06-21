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
import type { Workpackage, SubWorkpackage } from '../types/project';

const COLLECTION_NAME = 'workpackages';

/**
 * 工作包服務類別
 */
export class WorkpackageService {
  /**
   * 取得專案的所有工作包
   */
  static async getWorkpackagesByProject(projectId: string): Promise<Workpackage[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('projectId', '==', projectId)
      );
      
      const querySnapshot = await getDocs(q);
      const workpackages = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      })) as Workpackage[];
      
      // 在客戶端排序
      return workpackages.sort((a, b) => {
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
  static async getWorkpackageById(id: string): Promise<Workpackage | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate?.() || new Date(),
          updatedAt: docSnap.data().updatedAt?.toDate?.() || new Date(),
        } as Workpackage;
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
  static async createWorkpackage(workpackageData: Omit<Workpackage, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...workpackageData,
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
  static async updateWorkpackage(id: string, workpackageData: Partial<Workpackage>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...workpackageData,
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
  static async deleteWorkpackage(id: string): Promise<void> {
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
  static async updateSubWorkpackageProgress(
    workpackageId: string, 
    subWorkpackageId: string, 
    progress: number
  ): Promise<void> {
    try {
      const workpackage = await this.getWorkpackageById(workpackageId);
      if (!workpackage) {
        throw new Error('工作包不存在');
      }

      const updatedSubWorkpackages = workpackage.subWorkpackages.map(sub => {
        if (sub.id === subWorkpackageId) {
          return {
            ...sub,
            progress,
            updatedAt: new Date(),
          };
        }
        return sub;
      });

      await this.updateWorkpackage(workpackageId, {
        subWorkpackages: updatedSubWorkpackages,
      });
    } catch (error) {
      console.error('更新子工作包進度失敗:', error);
      throw new Error('更新子工作包進度失敗');
    }
  }

  /**
   * 根據狀態取得工作包
   */
  static async getWorkpackagesByStatus(status: string): Promise<Workpackage[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('status', '==', status)
      );
      
      const querySnapshot = await getDocs(q);
      const workpackages = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      })) as Workpackage[];
      
      // 在客戶端排序
      return workpackages.sort((a, b) => {
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