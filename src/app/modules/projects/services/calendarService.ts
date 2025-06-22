/**
 * 日曆服務層
 * 提供專案日曆相關的數據處理和業務邏輯
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import type { Project, WorkPackage, ProjectMilestone, SubWorkPackage } from '../types';

/**
 * 日曆事件類型
 */
export interface CalendarEventData {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
  type: 'milestone' | 'workPackage-start' | 'workPackage-end' | 'subWorkPackage-start' | 'subWorkPackage-end';
  projectId: string;
  workPackageId?: string;
  subWorkPackageId?: string;
  data: ProjectMilestone | WorkPackage | SubWorkPackage;
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
 * 日曆服務類別
 */
export class CalendarService {
  /**
   * 取得專案的日曆事件
   */
  static async getProjectCalendarEvents(projectId: string): Promise<CalendarEventData[]> {
    try {
      // 取得專案資料
      const projectDoc = await getDoc(doc(db, 'projects', projectId));
      if (!projectDoc.exists()) {
        throw new Error('專案不存在');
      }

      const project = projectDoc.data() as Project;
      const events: CalendarEventData[] = [];

      // 添加里程碑事件
      if (project.milestones) {
        project.milestones.forEach(milestone => {
          const targetDate = convertToDate(milestone.targetDate);
          if (targetDate) {
            events.push({
              id: `milestone-${milestone.id}`,
              title: `里程碑: ${milestone.name}`,
              start: targetDate,
              end: targetDate,
              color: 'blue',
              type: 'milestone',
              projectId,
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
        
        // 工作包開始日期
        const startDate = convertToDate(workPackage.estimatedStartDate || null);
        if (startDate) {
          events.push({
            id: `workPackage-${workPackage.id}-start`,
            title: `工作包開始: ${workPackage.name}`,
            start: startDate,
            end: startDate,
            color: 'green',
            type: 'workPackage-start',
            projectId,
            workPackageId: workPackage.id,
            data: workPackage,
          });
        }

        // 工作包結束日期
        const endDate = convertToDate(workPackage.estimatedEndDate || null);
        if (endDate) {
          events.push({
            id: `workPackage-${workPackage.id}-end`,
            title: `工作包結束: ${workPackage.name}`,
            start: endDate,
            end: endDate,
            color: 'red',
            type: 'workPackage-end',
            projectId,
            workPackageId: workPackage.id,
            data: workPackage,
          });
        }

        // 子工作包事件
        if (workPackage.subPackages) {
          workPackage.subPackages.forEach(subWorkPackage => {
            const subStartDate = convertToDate(subWorkPackage.estimatedStartDate || null);
            if (subStartDate) {
              events.push({
                id: `subWorkPackage-${subWorkPackage.id}-start`,
                title: `子工作包開始: ${subWorkPackage.name}`,
                start: subStartDate,
                end: subStartDate,
                color: 'orange',
                type: 'subWorkPackage-start',
                projectId,
                workPackageId: workPackage.id,
                subWorkPackageId: subWorkPackage.id,
                data: subWorkPackage,
              });
            }

            const subEndDate = convertToDate(subWorkPackage.estimatedEndDate || null);
            if (subEndDate) {
              events.push({
                id: `subWorkPackage-${subWorkPackage.id}-end`,
                title: `子工作包結束: ${subWorkPackage.name}`,
                start: subEndDate,
                end: subEndDate,
                color: 'purple',
                type: 'subWorkPackage-end',
                projectId,
                workPackageId: workPackage.id,
                subWorkPackageId: subWorkPackage.id,
                data: subWorkPackage,
              });
            }
          });
        }
      });

      // 按日期排序
      return events.sort((a, b) => a.start.getTime() - b.start.getTime());
    } catch (error) {
      console.error('取得專案日曆事件失敗:', error);
      throw new Error('取得專案日曆事件失敗');
    }
  }

  /**
   * 取得指定日期範圍的日曆事件
   */
  static async getCalendarEventsByDateRange(
    projectId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<CalendarEventData[]> {
    try {
      const allEvents = await this.getProjectCalendarEvents(projectId);
      
      return allEvents.filter(event => 
        event.start >= startDate && event.start <= endDate
      );
    } catch (error) {
      console.error('取得日期範圍日曆事件失敗:', error);
      throw new Error('取得日期範圍日曆事件失敗');
    }
  }

  /**
   * 取得今日的日曆事件
   */
  static async getTodayEvents(projectId: string): Promise<CalendarEventData[]> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      
      return await this.getCalendarEventsByDateRange(projectId, startOfDay, endOfDay);
    } catch (error) {
      console.error('取得今日事件失敗:', error);
      throw new Error('取得今日事件失敗');
    }
  }

  /**
   * 取得本週的日曆事件
   */
  static async getThisWeekEvents(projectId: string): Promise<CalendarEventData[]> {
    try {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      return await this.getCalendarEventsByDateRange(projectId, startOfWeek, endOfWeek);
    } catch (error) {
      console.error('取得本週事件失敗:', error);
      throw new Error('取得本週事件失敗');
    }
  }

  /**
   * 取得本月的日曆事件
   */
  static async getThisMonthEvents(projectId: string): Promise<CalendarEventData[]> {
    try {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
      
      return await this.getCalendarEventsByDateRange(projectId, startOfMonth, endOfMonth);
    } catch (error) {
      console.error('取得本月事件失敗:', error);
      throw new Error('取得本月事件失敗');
    }
  }

  /**
   * 取得即將到來的事件（未來7天）
   */
  static async getUpcomingEvents(projectId: string, days: number = 7): Promise<CalendarEventData[]> {
    try {
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + days);
      endDate.setHours(23, 59, 59, 999);
      
      return await this.getCalendarEventsByDateRange(projectId, today, endDate);
    } catch (error) {
      console.error('取得即將到來事件失敗:', error);
      throw new Error('取得即將到來事件失敗');
    }
  }

  /**
   * 取得逾期的事件
   */
  static async getOverdueEvents(projectId: string): Promise<CalendarEventData[]> {
    try {
      const allEvents = await this.getProjectCalendarEvents(projectId);
      const today = new Date();
      
      return allEvents.filter(event => 
        event.end < today && 
        (event.type === 'workPackage-end' || event.type === 'subWorkPackage-end' || event.type === 'milestone')
      );
    } catch (error) {
      console.error('取得逾期事件失敗:', error);
      throw new Error('取得逾期事件失敗');
    }
  }
}
