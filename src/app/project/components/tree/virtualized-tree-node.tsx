'use client';
import React, { memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { SimpleContextMenu } from '../ui/simple-context-menu';

interface VirtualizedTreeNodeProps {
  item: FlatItem;
  style: React.CSSProperties;
  onToggleExpand: (id: string) => void;
  onItemClick: (item: FlatItem) => void;
  onAssignTask?: (item: FlatItem) => void;
  onSubmitTask?: (item: FlatItem) => void;
  onReviewTask?: (item: FlatItem) => void;
  isSelected: boolean;
  // 🎯 右鍵菜單操作
  onDistributeQuantity?: (item: FlatItem) => void;
  onAddChild?: (item: FlatItem) => void;
  onRename?: (item: FlatItem, newName: string) => void;
  onDelete?: (item: FlatItem) => void;
  onDuplicate?: (item: FlatItem) => void;
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
  onDistributeQuantity,
  onAddChild,
  onRename,
  onDelete,
  onDuplicate,
}) => {
  const { user } = useGoogleAuth();

  // 根據項目類型獲取圖標和樣式
  const getItemInfo = () => {
    switch (item.type) {
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
          icon: FileIcon,
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
          icon: FileIcon,
          color: isSelected ? 'text-gray-800' : 'text-gray-600',
          bgColor: isSelected ? 'bg-gray-100 border-gray-300' : 'hover:bg-gray-50',
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

  // 根據項目類型獲取邊框顏色
  const getBorderColor = (type: string) => {
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
  };

  // 縮排樣式
  const indentStyle = {
    paddingLeft: `${item.level * 20 + 8}px`,
  };

    // 🎯 右鍵菜單回調處理
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const handleRename = () => {
    setRenameValue((item.data as any).name || '');
    setShowRenameDialog(true);
  };

  const handleRenameConfirm = () => {
    if (renameValue.trim() && onRename) {
      onRename(item, renameValue.trim());
    }
    setShowRenameDialog(false);
  };

  const contextMenuProps = {
    itemType: item.type,
    itemName: (item.data as any).name || '',
    currentQuantity: (item.data as any).total !== undefined ? {
      completed: (item.data as any).completed || 0,
      total: (item.data as any).total || 0,
    } : undefined,
    onDistributeQuantity: onDistributeQuantity ? () => onDistributeQuantity(item) : undefined,
    onAddChild: onAddChild ? () => onAddChild(item) : undefined,
    onRename: handleRename,
    onDelete: onDelete ? () => onDelete(item) : undefined,
    onDuplicate: onDuplicate ? () => onDuplicate(item) : undefined,
  };

  return (
    <div style={style}>
      <SimpleContextMenu {...contextMenuProps}>
        <div
          className={`flex items-center gap-2 py-2 px-2 cursor-pointer transition-colors ${itemInfo.bgColor} border-l-2 ${
            isSelected ? getBorderColor(item.type) : 'border-l-transparent'
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
              <ChevronDownIcon className={`h-4 w-4 ${isSelected ? itemInfo.color : ''}`} />
            ) : (
              <ChevronRightIcon className={`h-4 w-4 ${isSelected ? itemInfo.color : ''}`} />
            )}
          </Button>
        )}

        {/* 空白佔位（無子項目時） */}
        {!item.hasChildren && <div className="w-6" />}

        {/* 項目圖標 */}
        <ItemIcon className={`h-4 w-4 ${itemInfo.color}`} />

        {/* 項目名稱 */}
        <span className={`flex-1 text-sm font-medium truncate ${itemInfo.color}`}>
          {(item.data as any).name}
        </span>

        {/* 進度信息（僅對有進度的項目） */}
        {(item.data as any).progress !== undefined && (
          <div className="flex items-center gap-2 min-w-[120px]">
            <div className={`w-16 text-xs ${isSelected ? itemInfo.color : 'text-muted-foreground'}`}>
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
                <UserPlusIcon className={`h-3 w-3 ${isSelected ? itemInfo.color : ''}`} />
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
                <EditIcon className={`h-3 w-3 ${isSelected ? itemInfo.color : ''}`} />
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
                <EyeIcon className={`h-3 w-3 ${isSelected ? itemInfo.color : ''}`} />
              </Button>
            )}
          </div>
        )}

        {/* 子項目計數 */}
        {item.hasChildren && (
          <div className={`text-xs ml-2 ${isSelected ? itemInfo.color : 'text-muted-foreground'}`}>
            {getChildCount(item.data)}
          </div>
        )}
        </div>
      </SimpleContextMenu>

      {/* 重新命名對話框 */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重新命名</DialogTitle>
            <DialogDescription>
              為 {item.type === 'package' ? '工作包' : item.type === 'subpackage' ? '子工作包' : '任務'} 輸入新名稱
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rename-input">新名稱</Label>
              <Input
                id="rename-input"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRenameConfirm();
                  }
                }}
                className="mt-1"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
              取消
            </Button>
            <Button onClick={handleRenameConfirm}>
              確認
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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