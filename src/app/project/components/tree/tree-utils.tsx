'use client';
import React from 'react';
import {
  FolderIcon,
  PackageIcon,
  BookOpen,
  CheckSquareIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from 'lucide-react';
import { Project, Package, Subpackage, TaskPackage } from '../../types';

/**
 * 項目信息接口
 */
export interface ItemInfo {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

/**
 * 狀態信息接口
 */
export interface StatusInfo {
  text: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * 用戶權限接口
 */
export interface UserPermissions {
  canAssign: boolean;
  canSubmit: boolean;
  canReview: boolean;
}

/**
 * 根據項目類型獲取圖標和樣式
 */
export function getItemInfo(type: string, isSelected: boolean = false): ItemInfo {
  switch (type) {
    case 'project':
      return {
        icon: FolderIcon,
        color: isSelected ? 'text-blue-800' : 'text-blue-600',
        bgColor: isSelected ? 'bg-blue-100 border-blue-300' : 'hover:bg-blue-50',
      };
    case 'package':
      return {
        icon: PackageIcon,
        color: isSelected ? 'text-green-800' : 'text-green-600',
        bgColor: isSelected ? 'bg-green-100 border-green-300' : 'hover:bg-green-50',
      };
    case 'subpackage':
      return {
        icon: BookOpen,
        color: isSelected ? 'text-purple-800' : 'text-purple-600',
        bgColor: isSelected ? 'bg-purple-100 border-purple-300' : 'hover:bg-purple-50',
      };
    case 'task':
      return {
        icon: CheckSquareIcon,
        color: isSelected ? 'text-orange-800' : 'text-orange-600',
        bgColor: isSelected ? 'bg-orange-100 border-orange-300' : 'hover:bg-orange-50',
      };
    default:
      return {
        icon: BookOpen,
        color: isSelected ? 'text-gray-800' : 'text-gray-600',
        bgColor: isSelected ? 'bg-gray-100 border-gray-300' : 'hover:bg-gray-50',
      };
  }
}

/**
 * 獲取狀態信息
 */
export function getStatusInfo(data: any): StatusInfo | null {
  if (!data.status) return null;
  
  switch (data.status) {
    case 'in-progress':
      return { text: '進行中', color: 'bg-blue-100 text-blue-800', icon: ClockIcon };
    case 'submitted':
      return { text: '待審核', color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon };
    case 'approved':
      return { text: '已核准', color: 'bg-green-100 text-green-800', icon: CheckCircleIcon };
    case 'rejected':
      return { text: '已駁回', color: 'bg-red-100 text-red-800', icon: XCircleIcon };
    default:
      return { text: '草稿', color: 'bg-gray-100 text-gray-800', icon: ClockIcon };
  }
}

/**
 * 檢查用戶權限
 */
export function getUserPermissions(data: any, userUid?: string): UserPermissions {
  if (!data || !userUid) {
    return { canAssign: false, canSubmit: false, canReview: false };
  }
  
  const taskData = data as TaskPackage;
  const isSubmitter = taskData.submitters?.includes(userUid) || false;
  const isReviewer = taskData.reviewers?.includes(userUid) || false;
  
  return {
    canAssign: !!userUid, // 簡化權限檢查
    canSubmit: isSubmitter && (taskData.status === 'in-progress' || taskData.status === 'rejected'),
    canReview: isReviewer && taskData.status === 'submitted',
  };
}

/**
 * 根據項目類型獲取邊框顏色
 */
export function getBorderColor(type: string): string {
  switch (type) {
    case 'project':
      return 'border-l-blue-500';
    case 'package':
      return 'border-l-green-500';
    case 'subpackage':
      return 'border-l-purple-500';
    case 'task':
      return 'border-l-orange-500';
    default:
      return 'border-l-gray-500';
  }
}

/**
 * 獲取子項目數量
 */
export function getChildCount(data: Project | Package | Subpackage | TaskPackage): string {
  if ('packages' in data) {
    return `${data.packages.length} 包`;
  }
  if ('subpackages' in data) {
    return `${data.subpackages.length} 子包`;
  }
  if ('taskpackages' in data) {
    return `${data.taskpackages.length} 任務`;
  }
  return '';
}

/**
 * 獲取縮排樣式
 */
export function getIndentStyle(level: number): React.CSSProperties {
  return {
    paddingLeft: `${level * 20 + 8}px`,
  };
} 