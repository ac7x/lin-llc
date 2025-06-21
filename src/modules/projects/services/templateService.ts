/**
 * 模板服務層
 * 提供模板相關的 CRUD 操作和業務邏輯
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
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import type { Template, SubWorkpackageTemplateItem } from '../types/project';

const COLLECTION_NAME = 'templates';

/**
 * 模板服務類別
 */
export class TemplateService {
  /**
   * 取得所有模板
   */
  static async getAllTemplates(): Promise<Template[]> {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      })) as Template[];
    } catch (error) {
      console.error('取得模板列表失敗:', error);
      throw new Error('取得模板列表失敗');
    }
  }

  /**
   * 根據 ID 取得模板
   */
  static async getTemplateById(id: string): Promise<Template | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate?.() || new Date(),
          updatedAt: docSnap.data().updatedAt?.toDate?.() || new Date(),
        } as Template;
      }
      
      return null;
    } catch (error) {
      console.error('取得模板失敗:', error);
      throw new Error('取得模板失敗');
    }
  }

  /**
   * 建立新模板
   */
  static async createTemplate(templateData: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...templateData,
        createdAt: now,
        updatedAt: now,
      });
      
      return docRef.id;
    } catch (error) {
      console.error('建立模板失敗:', error);
      throw new Error('建立模板失敗');
    }
  }

  /**
   * 更新模板
   */
  static async updateTemplate(id: string, templateData: Partial<Template>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...templateData,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('更新模板失敗:', error);
      throw new Error('更新模板失敗');
    }
  }

  /**
   * 刪除模板
   */
  static async deleteTemplate(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('刪除模板失敗:', error);
      throw new Error('刪除模板失敗');
    }
  }

  /**
   * 根據類別取得模板
   */
  static async getTemplatesByCategory(category: string): Promise<Template[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('category', '==', category)
      );
      
      const querySnapshot = await getDocs(q);
      const templates = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      })) as Template[];
      
      // 在客戶端排序
      return templates.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date();
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date();
        return dateB.getTime() - dateA.getTime(); // 降序排列
      });
    } catch (error) {
      console.error('根據類別取得模板失敗:', error);
      throw new Error('根據類別取得模板失敗');
    }
  }

  /**
   * 搜尋模板
   */
  static async searchTemplates(searchTerm: string): Promise<Template[]> {
    try {
      const allTemplates = await this.getAllTemplates();
      
      return allTemplates.filter(template => 
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      console.error('搜尋模板失敗:', error);
      throw new Error('搜尋模板失敗');
    }
  }

  /**
   * 將模板轉換為子工作包
   */
  static convertTemplateToSubWorkpackages(
    template: Template,
    options: {
      workpackageId?: string;
      estimatedStartDate?: Date;
      estimatedEndDate?: Date;
      assignedTo?: string | null;
    } = {}
  ): SubWorkpackageTemplateItem[] {
    return template.subWorkpackages.map((item, index) => ({
      ...item,
      id: `${template.id}_${index}`,
      workpackageId: options.workpackageId,
      estimatedStartDate: options.estimatedStartDate,
      estimatedEndDate: options.estimatedEndDate,
      assignedTo: options.assignedTo,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }
} 