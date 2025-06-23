/**
 * 時程工具函數
 * 
 * 提供時程相關的計算和處理功能
 */

import type { ScheduleItem, ScheduleDependency } from '../services/scheduleService';

/**
 * 時程項目狀態類型
 */
export type ScheduleItemStatus = 'not-started' | 'in-progress' | 'completed' | 'overdue';

/**
 * 時程項目優先級類型
 */
export type ScheduleItemPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * 取得時程項目狀態
 */
export function getScheduleItemStatus(item: ScheduleItem): ScheduleItemStatus {
  const today = new Date();
  
  if (item.progress >= 100) {
    return 'completed';
  }
  
  if (item.end < today && item.progress < 100) {
    return 'overdue';
  }
  
  if (item.progress > 0) {
    return 'in-progress';
  }
  
  return 'not-started';
}

/**
 * 取得時程項目優先級
 */
export function getScheduleItemPriority(item: ScheduleItem): ScheduleItemPriority {
  const status = getScheduleItemStatus(item);
  const daysUntilDeadline = getDaysUntilDeadline(item);
  
  if (status === 'overdue') {
    return 'critical';
  }
  
  if (daysUntilDeadline <= 3) {
    return 'high';
  }
  
  if (daysUntilDeadline <= 7) {
    return 'medium';
  }
  
  return 'low';
}

/**
 * 計算距離截止日期的天數
 */
export function getDaysUntilDeadline(item: ScheduleItem): number {
  const today = new Date();
  const timeDiff = item.end.getTime() - today.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

/**
 * 計算時程項目持續時間（天）
 */
export function getScheduleItemDuration(item: ScheduleItem): number {
  const timeDiff = item.end.getTime() - item.start.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

/**
 * 計算時程項目剩餘時間（天）
 */
export function getScheduleItemRemainingTime(item: ScheduleItem): number {
  const today = new Date();
  const timeDiff = item.end.getTime() - today.getTime();
  return Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
}

/**
 * 計算時程項目進度百分比
 */
export function getScheduleItemProgressPercentage(item: ScheduleItem): number {
  const totalDuration = getScheduleItemDuration(item);
  if (totalDuration === 0) return 0;
  
  const elapsedTime = Math.max(0, getScheduleItemElapsedTime(item));
  return Math.min(100, Math.round((elapsedTime / totalDuration) * 100));
}

/**
 * 計算時程項目已過時間（天）
 */
export function getScheduleItemElapsedTime(item: ScheduleItem): number {
  const today = new Date();
  const timeDiff = today.getTime() - item.start.getTime();
  return Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
}

/**
 * 檢查時程項目是否在關鍵路徑上
 */
export function isCriticalPathItem(
  item: ScheduleItem, 
  criticalPathIds: string[]
): boolean {
  return criticalPathIds.includes(item.id);
}

/**
 * 計算時程項目的浮時（Float）
 */
export function getScheduleItemFloat(
  item: ScheduleItem,
  dependencies: ScheduleDependency[]
): number {
  // 簡單的浮時計算
  // 這裡可以實作更複雜的浮時算法
  const status = getScheduleItemStatus(item);
  const daysUntilDeadline = getDaysUntilDeadline(item);
  
  if (status === 'overdue') {
    return -Math.abs(daysUntilDeadline);
  }
  
  return Math.max(0, daysUntilDeadline);
}

/**
 * 取得時程項目的依賴項目
 */
export function getScheduleItemDependencies(
  item: ScheduleItem,
  dependencies: ScheduleDependency[]
): ScheduleDependency[] {
  return dependencies.filter(dep => dep.to === item.id);
}

/**
 * 取得時程項目的後續項目
 */
export function getScheduleItemSuccessors(
  item: ScheduleItem,
  dependencies: ScheduleDependency[]
): ScheduleDependency[] {
  return dependencies.filter(dep => dep.from === item.id);
}

/**
 * 檢查時程項目是否可以開始
 */
export function canScheduleItemStart(
  item: ScheduleItem,
  dependencies: ScheduleDependency[],
  allItems: ScheduleItem[]
): boolean {
  const itemDependencies = getScheduleItemDependencies(item, dependencies);
  
  for (const dep of itemDependencies) {
    const dependencyItem = allItems.find(i => i.id === dep.from);
    if (!dependencyItem) continue;
    
    if (dep.type === 'finish-to-start' && dependencyItem.progress < 100) {
      return false;
    }
    
    if (dep.type === 'start-to-start' && dependencyItem.progress === 0) {
      return false;
    }
  }
  
  return true;
}

/**
 * 計算時程項目的最早開始時間
 */
export function getScheduleItemEarliestStart(
  item: ScheduleItem,
  dependencies: ScheduleDependency[],
  allItems: ScheduleItem[]
): Date {
  const itemDependencies = getScheduleItemDependencies(item, dependencies);
  
  if (itemDependencies.length === 0) {
    return item.start;
  }
  
  let earliestStart = new Date(0);
  
  for (const dep of itemDependencies) {
    const dependencyItem = allItems.find(i => i.id === dep.from);
    if (!dependencyItem) continue;
    
    let dependencyEnd: Date;
    
    if (dep.type === 'finish-to-start') {
      dependencyEnd = dependencyItem.end;
    } else if (dep.type === 'start-to-start') {
      dependencyEnd = dependencyItem.start;
    } else {
      dependencyEnd = dependencyItem.end;
    }
    
    if (dependencyEnd > earliestStart) {
      earliestStart = dependencyEnd;
    }
  }
  
  return earliestStart;
}

/**
 * 計算時程項目的最晚開始時間
 */
export function getScheduleItemLatestStart(
  item: ScheduleItem,
  dependencies: ScheduleDependency[],
  allItems: ScheduleItem[]
): Date {
  const successors = getScheduleItemSuccessors(item, dependencies);
  
  if (successors.length === 0) {
    return item.end;
  }
  
  let latestStart = new Date(Number.MAX_SAFE_INTEGER);
    
  for (const dep of successors) {
    const successorItem = allItems.find(i => i.id === dep.to);
    if (!successorItem) continue;
    
    let successorStart: Date;
    
    if (dep.type === 'finish-to-start') {
      successorStart = successorItem.start;
    } else if (dep.type === 'start-to-start') {
      successorStart = successorItem.start;
    } else {
      successorStart = successorItem.end;
    }
    
    const itemDuration = getScheduleItemDuration(item);
    const calculatedStart = new Date(successorStart.getTime() - (itemDuration * 24 * 60 * 60 * 1000));
    
    if (calculatedStart < latestStart) {
      latestStart = calculatedStart;
    }
  }
  
  return latestStart;
}

/**
 * 計算時程項目的總浮時
 */
export function getScheduleItemTotalFloat(
  item: ScheduleItem,
  dependencies: ScheduleDependency[],
  allItems: ScheduleItem[]
): number {
  const earliestStart = getScheduleItemEarliestStart(item, dependencies, allItems);
  const latestStart = getScheduleItemLatestStart(item, dependencies, allItems);
  
  const timeDiff = latestStart.getTime() - earliestStart.getTime();
  return Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
}

/**
 * 檢查時程項目是否在關鍵路徑上（基於浮時）
 */
export function isCriticalPathItemByFloat(
  item: ScheduleItem,
  dependencies: ScheduleDependency[],
  allItems: ScheduleItem[]
): boolean {
  const totalFloat = getScheduleItemTotalFloat(item, dependencies, allItems);
  return totalFloat === 0;
}

/**
 * 計算時程項目的完成率
 */
export function getScheduleItemCompletionRate(item: ScheduleItem): number {
  return Math.min(100, Math.max(0, item.progress));
}

/**
 * 計算時程項目的效率指標
 */
export function getScheduleItemEfficiency(item: ScheduleItem): number {
  const plannedProgress = getScheduleItemProgressPercentage(item);
  const actualProgress = item.progress;
  
  if (plannedProgress === 0) return 100;
  
  return Math.round((actualProgress / plannedProgress) * 100);
}

/**
 * 取得時程項目的狀態顏色
 */
export function getScheduleItemStatusColor(status: ScheduleItemStatus): string {
  switch (status) {
    case 'completed':
      return 'green';
    case 'in-progress':
      return 'blue';
    case 'overdue':
      return 'red';
    case 'not-started':
      return 'gray';
    default:
      return 'gray';
  }
}

/**
 * 取得時程項目的優先級顏色
 */
export function getScheduleItemPriorityColor(priority: ScheduleItemPriority): string {
  switch (priority) {
    case 'critical':
      return 'red';
    case 'high':
      return 'orange';
    case 'medium':
      return 'yellow';
    case 'low':
      return 'green';
    default:
      return 'gray';
  }
}

/**
 * 格式化時程項目持續時間
 */
export function formatScheduleItemDuration(days: number): string {
  if (days === 0) return '0天';
  if (days === 1) return '1天';
  return `${days}天`;
}

/**
 * 格式化時程項目剩餘時間
 */
export function formatScheduleItemRemainingTime(days: number): string {
  if (days < 0) return `逾期${Math.abs(days)}天`;
  if (days === 0) return '今天到期';
  if (days === 1) return '明天到期';
  return `剩餘${days}天`;
}

/**
 * 計算時程項目的風險等級
 */
export function getScheduleItemRiskLevel(item: ScheduleItem): 'low' | 'medium' | 'high' {
  const status = getScheduleItemStatus(item);
  const daysUntilDeadline = getDaysUntilDeadline(item);
  const efficiency = getScheduleItemEfficiency(item);
  
  if (status === 'overdue' || efficiency < 50) {
    return 'high';
  }
  
  if (daysUntilDeadline <= 3 || efficiency < 80) {
    return 'medium';
  }
  
  return 'low';
}
