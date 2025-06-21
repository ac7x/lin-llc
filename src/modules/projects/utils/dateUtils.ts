/**
 * 日期工具函數
 * 提供專案日期處理功能，包含 Firebase Timestamp 轉換
 */

import type { Timestamp } from 'firebase/firestore';
import type { DateField } from '../types/project';

/**
 * 將 DateField 轉換為 Date 物件
 */
export function convertToDate(dateField: DateField): Date | null {
  if (!dateField) return null;
  
  if (dateField instanceof Date) {
    return dateField;
  }
  
  if (typeof dateField === 'string') {
    return new Date(dateField);
  }
  
  if (dateField && typeof dateField === 'object' && 'toDate' in dateField) {
    return (dateField as Timestamp).toDate();
  }
  
  return null;
}

/**
 * 格式化專案日期
 */
export function formatProjectDate(dateField: DateField): string {
  const date = convertToDate(dateField);
  if (!date) return '未設定';
  
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * 計算專案持續時間（天數）
 */
export function calculateProjectDuration(startDate: DateField, endDate: DateField): number {
  const start = convertToDate(startDate);
  const end = convertToDate(endDate);
  
  if (!start || !end) return 0;
  
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 檢查專案是否逾期
 */
export function isProjectOverdue(endDate: DateField): boolean {
  const end = convertToDate(endDate);
  if (!end) return false;
  
  const now = new Date();
  return end < now;
}

/**
 * 取得日期範圍內的專案
 */
export function getProjectsInDateRange(
  projects: any[],
  startDate: Date,
  endDate: Date
): any[] {
  return projects.filter(project => {
    const projectStart = convertToDate(project.startDate);
    const projectEnd = convertToDate(project.estimatedEndDate);
    
    if (!projectStart || !projectEnd) return false;
    
    return projectStart >= startDate && projectEnd <= endDate;
  });
} 