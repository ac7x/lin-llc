/**
 * 問題追蹤服務層
 * 提供問題相關的 CRUD 操作和業務邏輯
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
import type { IssueRecord } from '../types';

const COLLECTION_NAME = 'issues';

/**
 * 問題追蹤服務類別
 */
export class IssueService {
  /**
   * 取得專案的所有問題
   */
  static async getIssuesByProject(projectId: string): Promise<IssueRecord[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('projectId', '==', projectId)
      );
      
      const querySnapshot = await getDocs(q);
      const issues = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      })) as IssueRecord[];
      
      // 在客戶端排序
      return issues.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date();
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date();
        return dateB.getTime() - dateA.getTime(); // 降序排列
      });
    } catch (error) {
      console.error('取得問題列表失敗:', error);
      throw new Error('取得問題列表失敗');
    }
  }

  /**
   * 根據 ID 取得問題
   */
  static async getIssueById(id: string): Promise<IssueRecord | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate?.() || new Date(),
          updatedAt: docSnap.data().updatedAt?.toDate?.() || new Date(),
        } as IssueRecord;
      }
      
      return null;
    } catch (error) {
      console.error('取得問題失敗:', error);
      throw new Error('取得問題失敗');
    }
  }

  /**
   * 建立新問題
   */
  static async createIssue(issueData: Omit<IssueRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...issueData,
        createdAt: now,
        updatedAt: now,
      });
      
      return docRef.id;
    } catch (error) {
      console.error('建立問題失敗:', error);
      throw new Error('建立問題失敗');
    }
  }

  /**
   * 更新問題
   */
  static async updateIssue(id: string, issueData: Partial<IssueRecord>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...issueData,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('更新問題失敗:', error);
      throw new Error('更新問題失敗');
    }
  }

  /**
   * 刪除問題
   */
  static async deleteIssue(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('刪除問題失敗:', error);
      throw new Error('刪除問題失敗');
    }
  }

  /**
   * 解決問題
   */
  static async resolveIssue(id: string, resolution: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        status: 'resolved',
        resolved: true,
        resolution,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('解決問題失敗:', error);
      throw new Error('解決問題失敗');
    }
  }

  /**
   * 根據狀態取得問題
   */
  static async getIssuesByStatus(status: string): Promise<IssueRecord[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('status', '==', status)
      );
      
      const querySnapshot = await getDocs(q);
      const issues = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      })) as IssueRecord[];
      
      // 在客戶端排序
      return issues.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date();
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date();
        return dateB.getTime() - dateA.getTime(); // 降序排列
      });
    } catch (error) {
      console.error('根據狀態取得問題失敗:', error);
      throw new Error('根據狀態取得問題失敗');
    }
  }

  /**
   * 根據嚴重程度取得問題
   */
  static async getIssuesBySeverity(severity: string): Promise<IssueRecord[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('severity', '==', severity)
      );
      
      const querySnapshot = await getDocs(q);
      const issues = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      })) as IssueRecord[];
      
      // 在客戶端排序
      return issues.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date();
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date();
        return dateB.getTime() - dateA.getTime(); // 降序排列
      });
    } catch (error) {
      console.error('根據嚴重程度取得問題失敗:', error);
      throw new Error('根據嚴重程度取得問題失敗');
    }
  }
} 