/**
 * 日誌服務層
 * 提供日誌相關的 CRUD 操作和業務邏輯
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import type { DailyReport } from '../types';

const COLLECTION_NAME = 'dailyReports';

/**
 * 日誌服務類別
 */
export class JournalService {
  /**
   * 取得專案的所有日誌
   */
  static async getDailyReportsByProject(projectId: string): Promise<DailyReport[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('projectId', '==', projectId)
      );
      
      const querySnapshot = await getDocs(q);
      const reports = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      })) as DailyReport[];

      // 在記憶體中按日期排序
      return reports.sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : 
                     a.date && typeof a.date === 'object' && 'toDate' in a.date ? 
                     a.date.toDate() : new Date(0);
        const dateB = b.date instanceof Date ? b.date : 
                     b.date && typeof b.date === 'object' && 'toDate' in b.date ? 
                     b.date.toDate() : new Date(0);
        return dateB.getTime() - dateA.getTime(); // 降序排列
      });
    } catch (error) {
      console.error('取得日誌列表失敗:', error);
      throw new Error('取得日誌列表失敗');
    }
  }

  /**
   * 根據 ID 取得日誌
   */
  static async getDailyReportById(id: string): Promise<DailyReport | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate?.() || new Date(),
          updatedAt: docSnap.data().updatedAt?.toDate?.() || new Date(),
        } as DailyReport;
      }
      
      return null;
    } catch (error) {
      console.error('取得日誌失敗:', error);
      throw new Error('取得日誌失敗');
    }
  }

  /**
   * 建立新日誌
   */
  static async createDailyReport(reportData: Omit<DailyReport, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...reportData,
        createdAt: now,
        updatedAt: now,
      });
      
      return docRef.id;
    } catch (error) {
      console.error('建立日誌失敗:', error);
      throw new Error('建立日誌失敗');
    }
  }

  /**
   * 更新日誌
   */
  static async updateDailyReport(id: string, reportData: Partial<DailyReport>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...reportData,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('更新日誌失敗:', error);
      throw new Error('更新日誌失敗');
    }
  }

  /**
   * 刪除日誌
   */
  static async deleteDailyReport(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('刪除日誌失敗:', error);
      throw new Error('刪除日誌失敗');
    }
  }

  /**
   * 根據日期範圍取得日誌
   */
  static async getDailyReportsByDateRange(
    projectId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<DailyReport[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('projectId', '==', projectId),
        where('date', '>=', startDate),
        where('date', '<=', endDate)
      );
      
      const querySnapshot = await getDocs(q);
      const reports = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      })) as DailyReport[];

      // 在記憶體中按日期排序
      return reports.sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : 
                     a.date && typeof a.date === 'object' && 'toDate' in a.date ? 
                     a.date.toDate() : new Date(0);
        const dateB = b.date instanceof Date ? b.date : 
                     b.date && typeof b.date === 'object' && 'toDate' in b.date ? 
                     b.date.toDate() : new Date(0);
        return dateB.getTime() - dateA.getTime(); // 降序排列
      });
    } catch (error) {
      console.error('根據日期範圍取得日誌失敗:', error);
      throw new Error('根據日期範圍取得日誌失敗');
    }
  }
} 