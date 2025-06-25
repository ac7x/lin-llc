import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';
import { useGoogleAuth } from '@/hooks/use-google-auth';
import { NotificationService } from '../utils/notification-service';
import { updateAllProgress } from '../utils/progress-calculator';
import { Project } from '../types';

/**
 * 任務管理 Hook
 * 提供任務指派、提交、審核等功能
 */
export function useTaskManagement() {
  const { user } = useGoogleAuth();
  const [loading, setLoading] = useState(false);

  /**
   * 指派任務
   * @param project 專案物件
   * @param taskPath 任務路徑
   * @param submitters 提交者列表
   * @param reviewers 審核者列表
   * @param onUpdate 更新回調
   */
  const assignTask = async (
    project: Project,
    taskPath: { packageIndex: number; subpackageIndex: number; taskIndex: number },
    submitters: string[],
    reviewers: string[],
    onUpdate: (updatedProject: Project) => void
  ): Promise<boolean> => {
    setLoading(true);
    try {
      const { packageIndex, subpackageIndex, taskIndex } = taskPath;
      const updatedProject = { ...project };
      const task = updatedProject.packages[packageIndex].subpackages[subpackageIndex].taskpackages[taskIndex];
      
      // 更新任務指派
      task.submitters = submitters;
      task.reviewers = reviewers;
      task.status = 'in-progress';

      // 更新 Firestore
      await updateDoc(doc(db, 'projects', project.id), updatedProject);

      // 發送通知給提交者
      for (const uid of submitters) {
        await NotificationService.sendTaskAssignmentNotification(
          uid,
          task.name,
          project.name,
          'submitter',
          {
            projectId: project.id,
            packageIndex,
            subpackageIndex,
            taskIndex,
          }
        );
      }

      // 發送通知給審核者
      for (const uid of reviewers) {
        await NotificationService.sendTaskAssignmentNotification(
          uid,
          task.name,
          project.name,
          'reviewer',
          {
            projectId: project.id,
            packageIndex,
            subpackageIndex,
            taskIndex,
          }
        );
      }

      onUpdate(updatedProject);
      return true;
    } catch (error) {
      console.error('指派任務失敗:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 提交任務進度
   * @param project 專案物件
   * @param taskPath 任務路徑
   * @param completed 完成數量
   * @param total 總數量
   * @param onUpdate 更新回調
   */
  const submitTaskProgress = async (
    project: Project,
    taskPath: { packageIndex: number; subpackageIndex: number; taskIndex: number },
    completed: number,
    total: number,
    onUpdate: (updatedProject: Project) => void
  ): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    try {
      const { packageIndex, subpackageIndex, taskIndex } = taskPath;
      const updatedProject = { ...project };
      const task = updatedProject.packages[packageIndex].subpackages[subpackageIndex].taskpackages[taskIndex];
      
      // 更新任務進度
      task.completed = completed;
      task.total = total;
      task.progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      // 如果任務完成，自動提交審核
      if (task.progress === 100) {
        task.status = 'submitted';
        task.submittedAt = new Date().toISOString();
        task.submittedBy = user.uid;

        // 發送審核通知給審核者
        if (task.reviewers && task.reviewers.length > 0) {
          await NotificationService.sendTaskSubmissionNotification(
            task.reviewers,
            task.name,
            project.name,
            user.displayName || user.email || '未知用戶',
            {
              projectId: project.id,
              packageIndex,
              subpackageIndex,
              taskIndex,
            }
          );
        }
      }

      // 重新計算所有層級進度
      updateAllProgress(updatedProject);

      // 更新 Firestore
      await updateDoc(doc(db, 'projects', project.id), updatedProject);

      onUpdate(updatedProject);
      return true;
    } catch (error) {
      console.error('提交任務進度失敗:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 審核任務
   * @param project 專案物件
   * @param taskPath 任務路徑
   * @param approved 是否核准
   * @param onUpdate 更新回調
   * @param comment 審核意見
   */
  const reviewTask = async (
    project: Project,
    taskPath: { packageIndex: number; subpackageIndex: number; taskIndex: number },
    approved: boolean,
    onUpdate: (updatedProject: Project) => void,
    comment?: string
  ): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    try {
      const { packageIndex, subpackageIndex, taskIndex } = taskPath;
      const updatedProject = { ...project };
      const task = updatedProject.packages[packageIndex].subpackages[subpackageIndex].taskpackages[taskIndex];
      
      // 更新任務審核狀態
      task.status = approved ? 'approved' : 'rejected';
      task.approvedAt = new Date().toISOString();
      task.approvedBy = user.uid;

      // 如果審核通過，檢查是否需要向上層提交
      if (approved) {
        await checkAndSubmitParentLevel(updatedProject, user.uid, packageIndex, subpackageIndex);
      }

      // 發送審核結果通知給提交者
      if (task.submitters && task.submitters.length > 0) {
        await NotificationService.sendReviewResultNotification(
          task.submitters,
          task.name,
          project.name,
          approved,
          user.displayName || user.email || '未知審核者',
          {
            projectId: project.id,
            packageIndex,
            subpackageIndex,
            taskIndex,
          }
        );
      }

      // 更新 Firestore
      await updateDoc(doc(db, 'projects', project.id), updatedProject);

      onUpdate(updatedProject);
      return true;
    } catch (error) {
      console.error('審核任務失敗:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 檢查並提交上層級（子工作包、工作包、專案）
   * @param project 專案物件
   * @param approvedBy 核准者 UID
   * @param packageIndex 工作包索引
   * @param subpackageIndex 子工作包索引
   */
  const checkAndSubmitParentLevel = async (
    project: Project,
    approvedBy: string,
    packageIndex: number,
    subpackageIndex: number
  ) => {
    // 檢查子工作包是否所有任務都已核准
    const subpackage = project.packages[packageIndex].subpackages[subpackageIndex];
    const allTasksApproved = subpackage.taskpackages.every(task => task.status === 'approved');

    if (allTasksApproved && subpackage.reviewers && subpackage.reviewers.length > 0) {
      subpackage.status = 'submitted';
      subpackage.submittedAt = new Date().toISOString();
      subpackage.submittedBy = approvedBy;

      // 發送子工作包審核通知
      await NotificationService.sendTaskSubmissionNotification(
        subpackage.reviewers,
        subpackage.name,
        project.name,
        '系統自動提交',
        {
          projectId: project.id,
          packageIndex,
          subpackageIndex,
          taskIndex: -1, // 表示整個子工作包
        }
      );

      // 檢查工作包層級
      await checkAndSubmitPackageLevel(project, packageIndex, approvedBy);
    }
  };

  /**
   * 檢查並提交工作包層級
   */
  const checkAndSubmitPackageLevel = async (
    project: Project,
    packageIndex: number,
    approvedBy: string
  ) => {
    const pkg = project.packages[packageIndex];
    const allSubpackagesApproved = pkg.subpackages.every(sub => sub.status === 'approved');

    if (allSubpackagesApproved && pkg.reviewers && pkg.reviewers.length > 0) {
      pkg.status = 'submitted';
      pkg.submittedAt = new Date().toISOString();
      pkg.submittedBy = approvedBy;

      // 發送工作包審核通知
      await NotificationService.sendTaskSubmissionNotification(
        pkg.reviewers,
        pkg.name,
        project.name,
        '系統自動提交',
        {
          projectId: project.id,
          packageIndex,
          subpackageIndex: -1, // 表示整個工作包
          taskIndex: -1,
        }
      );

      // 檢查專案層級
      await checkAndSubmitProjectLevel(project, approvedBy);
    }
  };

  /**
   * 檢查並提交專案層級
   */
  const checkAndSubmitProjectLevel = async (
    project: Project,
    approvedBy: string
  ) => {
    const allPackagesApproved = project.packages.every(pkg => pkg.status === 'approved');

    if (allPackagesApproved && project.reviewers && project.reviewers.length > 0) {
      // 專案完成，發送通知給專案審核者
      await NotificationService.sendTaskSubmissionNotification(
        project.reviewers,
        project.name,
        '專案管理系統',
        '系統自動提交',
        {
          projectId: project.id,
          packageIndex: -1, // 表示整個專案
          subpackageIndex: -1,
          taskIndex: -1,
        }
      );
    }
  };

  return {
    loading,
    assignTask,
    submitTaskProgress,
    reviewTask,
  };
} 