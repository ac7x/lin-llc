import { useMemo } from 'react';
import { Project } from '../types';
import { 
  calculateProjectProgress, 
  calculateProjectStatistics,
  ProgressResult 
} from '../utils/progress-calculator';

/**
 * 專案進度管理 Hook
 * 提供各種進度計算和統計功能
 */
export function useProjectProgress(project: Project | null) {
  // 計算專案進度
  const projectProgress = useMemo((): ProgressResult => {
    if (!project) {
      return { completed: 0, total: 0, progress: 0 };
    }
    return calculateProjectProgress(project);
  }, [project]);

  // 計算專案統計資訊
  const projectStatistics = useMemo(() => {
    if (!project) {
      return {
        packageCount: 0,
        subpackageCount: 0,
        taskCount: 0,
        completed: 0,
        total: 0,
        progress: 0,
      };
    }
    return calculateProjectStatistics(project);
  }, [project]);

  // 計算完成率文字描述
  const progressText = useMemo(() => {
    const { completed, total, progress } = projectProgress;
    return `${completed}/${total} (${progress}%)`;
  }, [projectProgress]);

  // 計算詳細進度描述
  const progressDescription = useMemo(() => {
    const { completed, total } = projectProgress;
    return `已完成 ${completed} 個任務，共 ${total} 個任務`;
  }, [projectProgress]);

  // 檢查是否有進度
  const hasProgress = useMemo(() => {
    return projectProgress.total > 0;
  }, [projectProgress]);

  // 檢查是否已完成
  const isCompleted = useMemo(() => {
    return hasProgress && projectProgress.progress === 100;
  }, [hasProgress, projectProgress.progress]);

  // 檢查是否已開始
  const isStarted = useMemo(() => {
    return projectProgress.completed > 0;
  }, [projectProgress.completed]);

  return {
    // 進度資料
    projectProgress,
    projectStatistics,
    
    // 格式化文字
    progressText,
    progressDescription,
    
    // 狀態檢查
    hasProgress,
    isCompleted,
    isStarted,
    
    // 便利方法
    getProgressPercentage: () => projectProgress.progress,
    getCompletedCount: () => projectProgress.completed,
    getTotalCount: () => projectProgress.total,
    getPackageCount: () => projectStatistics.packageCount,
    getSubpackageCount: () => projectStatistics.subpackageCount,
    getTaskCount: () => projectStatistics.taskCount,
  };
} 