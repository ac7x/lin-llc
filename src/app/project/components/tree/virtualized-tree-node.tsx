'use client';
import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ChevronRightIcon,
  ChevronDownIcon,
  FolderIcon,
  PackageIcon,
  FileIcon,
  CheckSquareIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserPlusIcon,
  EditIcon,
  EyeIcon,
} from 'lucide-react';
import { useGoogleAuth } from '@/hooks/use-google-auth';
import { FlatItem } from '../../utils/tree-flattener';
import { Project, Package, Subpackage, TaskPackage } from '../../types';

interface VirtualizedTreeNodeProps {
  item: FlatItem;
  style: React.CSSProperties;
  onToggleExpand: (id: string) => void;
  onItemClick: (item: FlatItem) => void;
  onAssignTask?: (item: FlatItem) => void;
  onSubmitTask?: (item: FlatItem) => void;
  onReviewTask?: (item: FlatItem) => void;
  isSelected: boolean;
}

/**
 * 虛擬化樹節點組件
 * 使用 React.memo 優化渲染性能
 */
export const VirtualizedTreeNode = memo<VirtualizedTreeNodeProps>(({
  item,
  style,
  onToggleExpand,
  onItemClick,
  onAssignTask,
  onSubmitTask,
  onReviewTask,
  isSelected,
}) => {
  const { user } = useGoogleAuth();

  // 根據項目類型獲取圖標和樣式
  const getItemInfo = () => {
    switch (item.type) {
      case 'project':
        return {
          icon: FolderIcon,
          color: 'text-blue-600',
          bgColor: isSelected ? 'bg-blue-50' : 'hover:bg-blue-50',
        };
      case 'package':
        return {
          icon: PackageIcon,
          color: 'text-green-600',
          bgColor: isSelected ? 'bg-green-50' : 'hover:bg-green-50',
        };
      case 'subpackage':
        return {
          icon: FileIcon,
          color: 'text-purple-600',
          bgColor: isSelected ? 'bg-purple-50' : 'hover:bg-purple-50',
        };
      case 'task':
        return {
          icon: CheckSquareIcon,
          color: 'text-orange-600',
          bgColor: isSelected ? 'bg-orange-50' : 'hover:bg-orange-50',
        };
      default:
        return {
          icon: FileIcon,
          color: 'text-gray-600',
          bgColor: isSelected ? 'bg-gray-50' : 'hover:bg-gray-50',
        };
    }
  };

  // 獲取狀態信息
  const getStatusInfo = (data: any) => {
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
  };

  // 檢查用戶權限
  const getUserPermissions = (data: any) => {
    if (item.type !== 'task') return { canAssign: false, canSubmit: false, canReview: false };
    
    const taskData = data as TaskPackage;
    const isSubmitter = taskData.submitters?.includes(user?.uid || '') || false;
    const isReviewer = taskData.reviewers?.includes(user?.uid || '') || false;
    
    return {
      canAssign: user?.uid, // 簡化權限檢查
      canSubmit: isSubmitter && (taskData.status === 'in-progress' || taskData.status === 'rejected'),
      canReview: isReviewer && taskData.status === 'submitted',
    };
  };

  const itemInfo = getItemInfo();
  const ItemIcon = itemInfo.icon;
  const statusInfo = getStatusInfo(item.data);
  const StatusIcon = statusInfo?.icon;
  const permissions = getUserPermissions(item.data);

  // 縮排樣式
  const indentStyle = {
    paddingLeft: `${item.level * 20 + 8}px`,
  };

  return (
    <div style={style}>
      <div
        className={`flex items-center gap-2 py-2 px-2 cursor-pointer transition-colors ${itemInfo.bgColor} border-l-2 ${
          isSelected ? 'border-l-blue-500' : 'border-l-transparent'
        }`}
        style={indentStyle}
        onClick={() => onItemClick(item)}
      >
        {/* 展開/收起按鈕 */}
        {item.hasChildren && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(item.id);
            }}
          >
            {item.isExpanded ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )}
          </Button>
        )}

        {/* 空白佔位（無子項目時） */}
        {!item.hasChildren && <div className="w-6" />}

        {/* 項目圖標 */}
        <ItemIcon className={`h-4 w-4 ${itemInfo.color}`} />

        {/* 項目名稱 */}
        <span className="flex-1 text-sm font-medium truncate">
          {(item.data as any).name}
        </span>

        {/* 進度信息（僅對有進度的項目） */}
        {(item.data as any).progress !== undefined && (
          <div className="flex items-center gap-2 min-w-[120px]">
            <div className="w-16 text-xs text-muted-foreground">
              {(item.data as any).progress || 0}%
            </div>
            <Progress 
              value={(item.data as any).progress || 0} 
              className="w-16 h-2" 
            />
          </div>
        )}

        {/* 狀態 Badge */}
        {statusInfo && StatusIcon && (
          <Badge className={`${statusInfo.color} text-xs`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusInfo.text}
          </Badge>
        )}

        {/* 任務操作按鈕 */}
        {item.type === 'task' && (
          <div className="flex gap-1 ml-2">
            {permissions.canAssign && onAssignTask && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onAssignTask(item);
                }}
                title="指派任務"
              >
                <UserPlusIcon className="h-3 w-3" />
              </Button>
            )}

            {permissions.canSubmit && onSubmitTask && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onSubmitTask(item);
                }}
                title="更新進度"
              >
                <EditIcon className="h-3 w-3" />
              </Button>
            )}

            {permissions.canReview && onReviewTask && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onReviewTask(item);
                }}
                title="審核任務"
              >
                <EyeIcon className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}

        {/* 子項目計數 */}
        {item.hasChildren && (
          <div className="text-xs text-muted-foreground ml-2">
            {getChildCount(item.data)}
          </div>
        )}
      </div>
    </div>
  );
});

// 設置 displayName 用於調試
VirtualizedTreeNode.displayName = 'VirtualizedTreeNode';

/**
 * 獲取子項目數量
 */
function getChildCount(data: Project | Package | Subpackage | TaskPackage): string {
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