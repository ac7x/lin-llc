/**
 * 時程服務層
 * 提供專案時程相關的數據處理和業務邏輯
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  updateDoc,
  addDoc,
  deleteDoc,
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import type { Project, WorkPackage, SubWorkPackage, ProjectMilestone } from '../types';

/**
 * 時程項目類型
 */
export interface ScheduleItem {
  id: string;
  title: string;
  start: Date;
  end: Date;
  progress: number;
  type: 'milestone' | 'workPackage' | 'subWorkPackage';
  parentId?: string;
  data: ProjectMilestone | WorkPackage | SubWorkPackage;
}

/**
 * 時程依賴關係類型
 */
export interface ScheduleDependency {
  id: string;
  from: string;
  to: string;
  type: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish';
}

/**
 * 時程統計類型
 */
export interface ScheduleStats {
  totalItems: number;
  completedItems: number;
  inProgressItems: number;
  overdueItems: number;
  totalDuration: number;
  averageProgress: number;
  criticalPath: string[];
}

/**
 * 日期轉換工具函數
 */
const convertToDate = (dateValue: string | Date | Timestamp | null): Date | null => {
  if (!dateValue) return null;
  
  if (dateValue instanceof Date) {
    return dateValue;
  }
  
  if (typeof dateValue === 'object' && 'toDate' in dateValue) {
    return dateValue.toDate();
  }
  
  if (typeof dateValue === 'string') {
    return new Date(dateValue);
  }
  
  return null;
};

/**
 * 時程服務類別
 */
export class ScheduleService {
  /**
   * 取得專案的時程項目
   */
  static async getProjectSchedule(projectId: string): Promise<ScheduleItem[]> {
    try {
      // 取得專案資料
      const projectDoc = await getDoc(doc(db, 'projects', projectId));
      if (!projectDoc.exists()) {
        throw new Error('專案不存在');
      }

      const project = projectDoc.data() as Project;
      const scheduleItems: ScheduleItem[] = [];

      // 添加里程碑
      if (project.milestones) {
        project.milestones.forEach(milestone => {
          const targetDate = convertToDate(milestone.targetDate);
          if (targetDate) {
            scheduleItems.push({
              id: `milestone-${milestone.id}`,
              title: milestone.name,
              start: targetDate,
              end: targetDate,
              progress: (milestone as any).completed ? 100 : 0,
              type: 'milestone',
              data: milestone,
            });
          }
        });
      }

      // 取得工作包資料
      const workPackagesQuery = query(
        collection(db, 'projects', projectId, 'workPackages'),
        orderBy('createdAt', 'desc')
      );
      const workPackagesSnapshot = await getDocs(workPackagesQuery);
      
      workPackagesSnapshot.forEach(doc => {
        const workPackage = doc.data() as WorkPackage;
        
        const startDate = convertToDate(workPackage.estimatedStartDate || null);
        const endDate = convertToDate(workPackage.estimatedEndDate || null);
        
        if (startDate && endDate) {
          scheduleItems.push({
            id: `workPackage-${workPackage.id}`,
            title: workPackage.name,
            start: startDate,
            end: endDate,
            progress: workPackage.progress || 0,
            type: 'workPackage',
            data: workPackage,
          });
        }

        // 添加子工作包
        if (workPackage.subPackages) {
          workPackage.subPackages.forEach(subWorkPackage => {
            const subStartDate = convertToDate(subWorkPackage.estimatedStartDate || null);
            const subEndDate = convertToDate(subWorkPackage.estimatedEndDate || null);
            
            if (subStartDate && subEndDate) {
              scheduleItems.push({
                id: `subWorkPackage-${subWorkPackage.id}`,
                title: subWorkPackage.name,
                start: subStartDate,
                end: subEndDate,
                progress: subWorkPackage.progress || 0,
                type: 'subWorkPackage',
                parentId: workPackage.id,
                data: subWorkPackage,
              });
            }
          });
        }
      });

      // 按開始日期排序
      return scheduleItems.sort((a, b) => a.start.getTime() - b.start.getTime());
    } catch (error) {
      console.error('取得專案時程失敗:', error);
      throw new Error('取得專案時程失敗');
    }
  }

  /**
   * 取得專案的時程依賴關係
   */
  static async getProjectDependencies(projectId: string): Promise<ScheduleDependency[]> {
    try {
      const dependenciesQuery = query(
        collection(db, 'projects', projectId, 'dependencies'),
        orderBy('createdAt', 'desc')
      );
      const dependenciesSnapshot = await getDocs(dependenciesQuery);
      
      return dependenciesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ScheduleDependency[];
    } catch (error) {
      console.error('取得時程依賴關係失敗:', error);
      throw new Error('取得時程依賴關係失敗');
    }
  }

  /**
   * 新增時程依賴關係
   */
  static async addDependency(
    projectId: string, 
    dependency: Omit<ScheduleDependency, 'id'>
  ): Promise<string> {
    try {
      const docRef = await addDoc(
        collection(db, 'projects', projectId, 'dependencies'),
        {
          ...dependency,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        }
      );
      return docRef.id;
    } catch (error) {
      console.error('新增時程依賴關係失敗:', error);
      throw new Error('新增時程依賴關係失敗');
    }
  }

  /**
   * 刪除時程依賴關係
   */
  static async deleteDependency(projectId: string, dependencyId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'projects', projectId, 'dependencies', dependencyId));
    } catch (error) {
      console.error('刪除時程依賴關係失敗:', error);
      throw new Error('刪除時程依賴關係失敗');
    }
  }

  /**
   * 更新時程項目進度
   */
  static async updateScheduleItemProgress(
    projectId: string,
    itemId: string,
    progress: number
  ): Promise<void> {
    try {
      const [type, id] = itemId.split('-');
      
      if (type === 'milestone') {
        // 更新里程碑
        const projectRef = doc(db, 'projects', projectId);
        const projectDoc = await getDoc(projectRef);
        if (projectDoc.exists()) {
          const project = projectDoc.data() as Project;
          const milestones = project.milestones?.map(milestone => 
            milestone.id === id 
              ? { ...milestone, completed: progress >= 100 }
              : milestone
          ) || [];
          
          await updateDoc(projectRef, { milestones });
        }
      } else if (type === 'workPackage') {
        // 更新工作包
        await updateDoc(
          doc(db, 'projects', projectId, 'workPackages', id),
          { progress, updatedAt: Timestamp.now() }
        );
      } else if (type === 'subWorkPackage') {
        // 更新子工作包
        const workPackageQuery = query(
          collection(db, 'projects', projectId, 'workPackages'),
          where('subPackages', 'array-contains', { id })
        );
        const workPackageSnapshot = await getDocs(workPackageQuery);
        
        if (!workPackageSnapshot.empty) {
          const workPackageDoc = workPackageSnapshot.docs[0];
          const workPackage = workPackageDoc.data() as WorkPackage;
          const subPackages = workPackage.subPackages?.map(subPackage =>
            subPackage.id === id 
              ? { ...subPackage, progress, updatedAt: Timestamp.now() }
              : subPackage
          ) || [];
          
          await updateDoc(workPackageDoc.ref, { subPackages });
        }
      }
    } catch (error) {
      console.error('更新時程項目進度失敗:', error);
      throw new Error('更新時程項目進度失敗');
    }
  }

  /**
   * 取得時程統計資料
   */
  static async getScheduleStats(projectId: string): Promise<ScheduleStats> {
    try {
      const scheduleItems = await this.getProjectSchedule(projectId);
      const today = new Date();
      
      const completedItems = scheduleItems.filter(item => item.progress >= 100);
      const inProgressItems = scheduleItems.filter(item => item.progress > 0 && item.progress < 100);
      const overdueItems = scheduleItems.filter(item => 
        item.end < today && item.progress < 100
      );
      
      const totalDuration = scheduleItems.reduce((total, item) => {
        const duration = item.end.getTime() - item.start.getTime();
        return total + duration;
      }, 0);
      
      const averageProgress = scheduleItems.length > 0 
        ? scheduleItems.reduce((sum, item) => sum + item.progress, 0) / scheduleItems.length
        : 0;
      
      // 簡單的關鍵路徑計算（可以進一步優化）
      const criticalPath = this.calculateCriticalPath(scheduleItems);
      
      return {
        totalItems: scheduleItems.length,
        completedItems: completedItems.length,
        inProgressItems: inProgressItems.length,
        overdueItems: overdueItems.length,
        totalDuration,
        averageProgress,
        criticalPath,
      };
    } catch (error) {
      console.error('取得時程統計資料失敗:', error);
      throw new Error('取得時程統計資料失敗');
    }
  }

  /**
   * 計算關鍵路徑
   */
  private static calculateCriticalPath(scheduleItems: ScheduleItem[]): string[] {
    // 簡單的關鍵路徑計算
    // 這裡可以實作更複雜的關鍵路徑算法
    const sortedItems = scheduleItems
      .filter(item => item.type !== 'milestone')
      .sort((a, b) => {
        const aDuration = a.end.getTime() - a.start.getTime();
        const bDuration = b.end.getTime() - b.start.getTime();
        return bDuration - aDuration;
      });
    
    return sortedItems.slice(0, 5).map(item => item.id);
  }

  /**
   * 取得即將到期的項目
   */
  static async getUpcomingDeadlines(projectId: string, days: number = 7): Promise<ScheduleItem[]> {
    try {
      const scheduleItems = await this.getProjectSchedule(projectId);
      const today = new Date();
      const deadline = new Date(today);
      deadline.setDate(today.getDate() + days);
      
      return scheduleItems.filter(item => 
        item.end >= today && 
        item.end <= deadline && 
        item.progress < 100
      );
    } catch (error) {
      console.error('取得即將到期項目失敗:', error);
      throw new Error('取得即將到期項目失敗');
    }
  }

  /**
   * 取得逾期的項目
   */
  static async getOverdueItems(projectId: string): Promise<ScheduleItem[]> {
    try {
      const scheduleItems = await this.getProjectSchedule(projectId);
      const today = new Date();
      
      return scheduleItems.filter(item => 
        item.end < today && item.progress < 100
      );
    } catch (error) {
      console.error('取得逾期項目失敗:', error);
      throw new Error('取得逾期項目失敗');
    }
  }
}
