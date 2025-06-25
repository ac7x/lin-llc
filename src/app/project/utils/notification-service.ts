import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';
import { Notification } from '../types';

/**
 * 創建通知所需的資料類型
 */
type CreateNotificationData = Omit<Notification, 'id' | 'isRead' | 'createdAt'>;

/**
 * 通知服務 - 處理系統通知的發送和管理
 */
export class NotificationService {
  /**
   * 發送通知
   * @param notification 通知物件
   * @returns 是否成功發送
   */
  static async sendNotification(notification: CreateNotificationData): Promise<boolean> {
    try {
      await addDoc(collection(db, 'notifications'), {
        ...notification,
        createdAt: new Date().toISOString(),
        isRead: false,
      });
      return true;
    } catch (error) {
      console.error('發送通知失敗:', error);
      return false;
    }
  }

  /**
   * 發送任務指派通知
   * @param targetUid 目標用戶 UID
   * @param taskName 任務名稱
   * @param projectName 專案名稱
   * @param role 用戶角色
   * @param data 附加數據
   */
  static async sendTaskAssignmentNotification(
    targetUid: string,
    taskName: string,
    projectName: string,
    role: 'submitter' | 'reviewer',
    data: {
      projectId: string;
      packageIndex: number;
      subpackageIndex: number;
      taskIndex: number;
    }
  ): Promise<boolean> {
    const roleText = role === 'submitter' ? '提交者' : '審核者';
    return this.sendNotification({
      title: `新任務指派`,
      message: `您被指派為專案「${projectName}」中任務「${taskName}」的${roleText}`,
      type: 'task',
      targetUid,
      data: {
        ...data,
        action: 'task_assigned',
      },
    });
  }

  /**
   * 發送任務提交通知
   * @param reviewerUids 審核者 UID 列表
   * @param taskName 任務名稱
   * @param projectName 專案名稱
   * @param submitterName 提交者名稱
   * @param data 附加數據
   */
  static async sendTaskSubmissionNotification(
    reviewerUids: string[],
    taskName: string,
    projectName: string,
    submitterName: string,
    data: {
      projectId: string;
      packageIndex: number;
      subpackageIndex: number;
      taskIndex: number;
    }
  ): Promise<boolean> {
    const promises = reviewerUids.map(uid =>
      this.sendNotification({
        title: `任務待審核`,
        message: `${submitterName} 已提交任務「${taskName}」，等待您的審核`,
        type: 'review',
        targetUid: uid,
        data: {
          ...data,
          action: 'task_submitted',
        },
      })
    );
    
    try {
      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error('發送任務提交通知失敗:', error);
      return false;
    }
  }

  /**
   * 發送審核結果通知
   * @param submitterUids 提交者 UID 列表
   * @param taskName 任務名稱
   * @param projectName 專案名稱
   * @param approved 是否核准
   * @param reviewerName 審核者名稱
   * @param data 附加數據
   */
  static async sendReviewResultNotification(
    submitterUids: string[],
    taskName: string,
    projectName: string,
    approved: boolean,
    reviewerName: string,
    data: {
      projectId: string;
      packageIndex: number;
      subpackageIndex: number;
      taskIndex: number;
    }
  ): Promise<boolean> {
    const status = approved ? '核准' : '駁回';
    const type = approved ? 'success' : 'warning';
    
    const promises = submitterUids.map(uid =>
      this.sendNotification({
        title: `審核結果`,
        message: `${reviewerName} 已${status}您提交的任務「${taskName}」`,
        type,
        targetUid: uid,
        data: {
          ...data,
          action: approved ? 'task_approved' : 'task_rejected',
        },
      })
    );
    
    try {
      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error('發送審核結果通知失敗:', error);
      return false;
    }
  }

  /**
   * 標記通知為已讀
   * @param notificationId 通知 ID
   */
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        isRead: true,
      });
      return true;
    } catch (error) {
      console.error('標記通知已讀失敗:', error);
      return false;
    }
  }
} 