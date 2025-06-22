/**
 * 日誌服務層
 * 提供日誌相關的 CRUD 操作和業務邏輯，包括照片上傳和進度更新
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
  Timestamp,
  arrayUnion 
} from 'firebase/firestore';
import { ref, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { db, storage } from '@/lib/firebase-client';
import type { DailyReport, ActivityLog, PhotoRecord, WorkPackage, SubWorkPackage } from '../types';
import { calculateProjectProgress } from '../types';
import { getErrorMessage, logError, safeAsync, retry } from '@/utils/errorUtils';

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
        where('projectId', '==', projectId),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const reports = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      })) as DailyReport[];

      return reports;
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
   * 上傳照片到 Firebase Storage
   */
  static async uploadPhoto(
    file: File, 
    projectId: string, 
    reportId: string, 
    photoType: string,
    description: string
  ): Promise<PhotoRecord> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `projects/${projectId}/photos/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const storageRef = ref(storage, fileName);
      
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          () => {
            // 可以添加進度追蹤
          },
          (error) => {
            logError(error, { operation: 'upload_photo', fileName });
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              const photoRecord: PhotoRecord = {
                id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                url: downloadURL,
                type: photoType as any,
                description,
                reportId,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                createdBy: 'current-user', // TODO: 從 auth 取得實際用戶
              };
              resolve(photoRecord);
            } catch (error) {
              logError(error, { operation: 'get_download_url', fileName });
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      logError(error, { operation: 'upload_photo', projectId, reportId });
      throw new Error('照片上傳失敗');
    }
  }

  /**
   * 建立新日誌（包含照片上傳和進度更新）
   */
  static async createDailyReport(reportData: {
    projectId: string;
    date: Date;
    weather: string;
    temperature: number;
    rainfall: number;
    workforceCount: number;
    description: string;
    issues?: string;
    photoFiles?: Array<{
      file: File;
      type: string;
      description: string;
    }>;
    progressUpdates?: Array<{
      workPackageId: string;
      subWorkPackageId: string;
      actualQuantity: number;
    }>;
    projectData: any; // 專案資料，用於更新進度
  }): Promise<string> {
    try {
      const now = Timestamp.now();
      const reportId = `${reportData.date.getFullYear()}${String(reportData.date.getMonth() + 1).padStart(2, '0')}${String(reportData.date.getDate()).padStart(2, '0')}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 上傳照片
      let photoRecords: PhotoRecord[] = [];
      if (reportData.photoFiles && reportData.photoFiles.length > 0) {
        const uploadPromises = reportData.photoFiles.map(photoFile =>
          this.uploadPhoto(
            photoFile.file,
            reportData.projectId,
            reportId,
            photoFile.type,
            photoFile.description
          )
        );
        photoRecords = await Promise.all(uploadPromises);
      }

      // 處理進度更新
      const activities: ActivityLog[] = [];
      const updatedWorkPackages = JSON.parse(JSON.stringify(reportData.projectData.workPackages || []));

      if (reportData.progressUpdates) {
        for (const update of reportData.progressUpdates) {
          if (update.workPackageId && update.subWorkPackageId && update.actualQuantity > 0) {
            const wp = updatedWorkPackages.find((w: WorkPackage) => w.id === update.workPackageId);
            if (wp) {
              const sw = wp.subPackages.find((s: SubWorkPackage) => s.id === update.subWorkPackageId);
              if (sw) {
                const newActualQuantity = (sw.actualQuantity || 0) + update.actualQuantity;
                const percent = sw.estimatedQuantity
                  ? Math.round((newActualQuantity / sw.estimatedQuantity) * 100)
                  : 0;
                sw.progress = percent;
                sw.actualQuantity = newActualQuantity;

                activities.push({
                  id: `${update.workPackageId}_${update.subWorkPackageId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  workPackageId: update.workPackageId,
                  description: `${wp?.name || ''} / ${sw?.name || ''}`,
                  startTime: now,
                  endTime: now,
                  workforce: reportData.workforceCount || 0,
                  progress: sw.progress,
                  notes: `本日完成 ${update.actualQuantity} ${sw.unit || ''}`,
                  createdAt: now,
                  updatedAt: now,
                });
              }
            }
          }
        }
      }

      // 計算專案進度
      const updatedProjectData = { ...reportData.projectData, workPackages: updatedWorkPackages };
      const projectProgress = calculateProjectProgress(updatedProjectData);

      // 建立日誌記錄
      const dailyReportData = {
        id: reportId,
        projectId: reportData.projectId,
        date: now,
        weather: reportData.weather,
        temperature: reportData.temperature,
        rainfall: reportData.rainfall,
        workforceCount: reportData.workforceCount,
        description: reportData.description,
        issues: reportData.issues || '',
        activities,
        photos: photoRecords,
        projectProgress,
        createdBy: 'current-user', // TODO: 從 auth 取得實際用戶
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), dailyReportData);

      // 更新專案資料（包含新的進度）
      const projectRef = doc(db, 'projects', reportData.projectId);
      await updateDoc(projectRef, {
        workPackages: updatedWorkPackages,
        progress: projectProgress,
        reports: arrayUnion(dailyReportData),
        updatedAt: now,
      });

      return docRef.id;
    } catch (error) {
      console.error('建立日誌失敗:', error);
      throw new Error(`建立日誌失敗: ${getErrorMessage(error)}`);
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
        where('date', '<=', endDate),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const reports = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      })) as DailyReport[];

      return reports;
    } catch (error) {
      console.error('根據日期範圍取得日誌失敗:', error);
      throw new Error('根據日期範圍取得日誌失敗');
    }
  }

  /**
   * 取得專案的最新日誌
   */
  static async getLatestDailyReport(projectId: string): Promise<DailyReport | null> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('projectId', '==', projectId),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return null;
      }

      const latestDoc = querySnapshot.docs[0];
      return {
        id: latestDoc.id,
        ...latestDoc.data(),
        createdAt: latestDoc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: latestDoc.data().updatedAt?.toDate?.() || new Date(),
      } as DailyReport;
    } catch (error) {
      console.error('取得最新日誌失敗:', error);
      throw new Error('取得最新日誌失敗');
    }
  }
} 