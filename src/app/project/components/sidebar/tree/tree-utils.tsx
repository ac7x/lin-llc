'use client';
import React from 'react';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from 'lucide-react';
import { Project, Package, SubPackage, TaskPackage } from '../../../types';

// 從 tree-styles.ts 導入所有樣式函數和類型
export {
  TREE_STYLES,
  TREE_CLASSES,
  RESPONSIVE_STYLES,
  TREE_COLORS,
  getItemContainerClasses,
  getItemTextClasses,
  getItemTextWrapperClasses,
  getItemCountClasses,
  getIconClasses,
  getToggleButtonClasses,
  getToggleIconClasses,
  getActionButtonClasses,
  getProgressTextClasses,
  getSubmenuContainerClasses,
  getCollapsibleGroupClasses,
  getTooltipTriggerClasses,
  getInputContainerClasses,
  getInputWrapperClasses,
  getAddButtonWrapperClasses,
  getSpacerClasses,
  getVirtualizedItemStyle,
  getTreeContainerClasses,
  getListContainerClasses,
  getItemInfo,
  getBorderColor,
  getIndentStyle,
  calculateIndentStyle,
  type ItemInfo,
  type StatusInfo,
} from './tree-styles';

/**
 * 用戶權限接口
 */
export interface UserPermissions {
  canAssign: boolean;
  canReview: boolean;
  canEdit: boolean;
  canSubmit: boolean;
}

/**
 * 獲取子項目數量
 */
export function getChildCount(project: Project): number {
  return project.packages?.length || 0;
}

/**
 * 獲取任務狀態信息
 */
export function getStatusInfo(task: TaskPackage): import('./tree-styles').StatusInfo | null {
  if (!task.status) return null;

  const statusMap = {
    'draft': {
      text: '草稿',
      color: 'bg-gray-100 text-gray-800',
      icon: ClockIcon,
    },
    'in-progress': {
      text: '進行中',
      color: 'bg-blue-100 text-blue-800',
      icon: ClockIcon,
    },
    'submitted': {
      text: '待審核',
      color: 'bg-yellow-100 text-yellow-800',
      icon: ClockIcon,
    },
    'approved': {
      text: '已核准',
      color: 'bg-green-100 text-green-800',
      icon: CheckCircleIcon,
    },
    'rejected': {
      text: '已駁回',
      color: 'bg-red-100 text-red-800',
      icon: XCircleIcon,
    },
  };

  return statusMap[task.status as keyof typeof statusMap] || null;
}

/**
 * 獲取用戶權限
 */
export function getUserPermissions(task: TaskPackage, userId?: string): UserPermissions {
  const isAssignee = task.assigness?.includes(userId || '') || false;
  const isReviewer = task.reviewers?.includes(userId || '') || false;
  
  return {
    canAssign: true, // 根據實際業務邏輯調整
    canReview: isReviewer,
    canEdit: isAssignee || isReviewer,
    canSubmit: isAssignee,
  };
} 