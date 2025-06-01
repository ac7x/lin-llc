// 工作包進度計算工具函數

import { Workpackage, SubWorkpackage, ActivityLog } from '@/types/workpackage';

/**
 * 計算工作包的整體進度
 * @param workpackage 工作包數據
 * @param activityLogs 所有活動日誌
 * @returns 整體進度百分比 (0-100)
 */
export function calculateWorkpackageProgress(
  workpackage: Workpackage, 
  activityLogs: ActivityLog[] = []
): number {
  // 如果沒有子工作包，直接返回自身進度
  if (!workpackage.subWorkpackages || workpackage.subWorkpackages.length === 0) {
    return workpackage.progress || 0;
  }

  // 有子工作包的情況，計算子工作包進度的平均值
  const subpackagesWithProgress = workpackage.subWorkpackages.map(subpackage => {
    return calculateSubWorkpackageProgress(subpackage, activityLogs, workpackage.id);
  });

  // 避免除以零的情況
  if (subpackagesWithProgress.length === 0) {
    return workpackage.progress || 0;
  }

  // 計算平均進度
  const totalProgress = subpackagesWithProgress.reduce((sum, current) => sum + current, 0);
  return Math.round(totalProgress / subpackagesWithProgress.length);
}

/**
 * 計算子工作包的進度
 * @param subWorkpackage 子工作包數據
 * @param activityLogs 活動日誌
 * @param parentId 父工作包ID
 * @returns 進度百分比 (0-100)
 */
export function calculateSubWorkpackageProgress(
  subWorkpackage: SubWorkpackage,
  activityLogs: ActivityLog[] = [],
  parentId: string
): number {
  // 如果已有明確定義的進度，直接使用
  if (typeof subWorkpackage.progress === 'number') {
    return subWorkpackage.progress;
  }

  // 從活動日誌中尋找相關紀錄
  const relatedLogs = activityLogs.filter(log => 
    log.workpackageId === `${parentId}:${subWorkpackage.id}`
  );

  // 如果有相關記錄，根據活動記錄計算進度
  if (relatedLogs.length > 0) {
    const avgProgress = relatedLogs.reduce((sum, log) => sum + log.progress, 0) / relatedLogs.length;
    return Math.round(avgProgress);
  }

  // 如果有子任務，根據完成的任務比例計算進度
  if (subWorkpackage.tasks && subWorkpackage.tasks.length > 0) {
    const completedTasks = subWorkpackage.tasks.filter(task => task.completed).length;
    return Math.round((completedTasks / subWorkpackage.tasks.length) * 100);
  }

  // 如果以上條件都不符合，返回默認進度0
  return 0;
}

/**
 * 根據報告的活動記錄更新工作包進度
 * @param workpackages 工作包列表
 * @param activityLogs 活動日誌列表
 * @returns 更新後的工作包列表
 */
export function updateWorkpackagesProgress(
  workpackages: Workpackage[],
  activityLogs: ActivityLog[]
): Workpackage[] {
  if (!workpackages || workpackages.length === 0) {
    return [];
  }

  return workpackages.map(wp => {
    // 深拷貝工作包，避免直接修改原對象
    const updatedWp = { ...wp };
    
    // 更新子工作包進度
    if (updatedWp.subWorkpackages && updatedWp.subWorkpackages.length > 0) {
      updatedWp.subWorkpackages = updatedWp.subWorkpackages.map(subWp => {
        const subWpProgress = calculateSubWorkpackageProgress(subWp, activityLogs, updatedWp.id);
        return { ...subWp, progress: subWpProgress };
      });
    }
    
    // 更新工作包整體進度
    updatedWp.progress = calculateWorkpackageProgress(updatedWp, activityLogs);
    
    return updatedWp;
  });
}
