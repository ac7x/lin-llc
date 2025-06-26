'use client';
import React, { memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ChevronRightIcon,
  ChevronDownIcon,
  UserPlusIcon,
  EditIcon,
  EyeIcon,
} from 'lucide-react';
import { useGoogleAuth } from '@/hooks/use-google-auth';
import { FlatItem } from '../../utils/tree-flattener';
import { Project, Package, Subpackage, TaskPackage } from '../../types';
import { SimpleContextMenu } from '../ui/simple-context-menu';
import { 
  getItemInfo, 
  getStatusInfo, 
  getUserPermissions, 
  getBorderColor, 
  getChildCount as utilGetChildCount, 
  getIndentStyle 
} from './tree-utils';
import { RenameDialog } from './rename-dialog';

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

  // 使用工具函數獲取項目信息
  const itemInfo = getItemInfo(item.type, isSelected);

  // 使用工具函數獲取狀態和權限信息
  const ItemIcon = itemInfo.icon;
  const statusInfo = getStatusInfo(item.data);
  const StatusIcon = statusInfo?.icon;
  const permissions = getUserPermissions(item.data, user?.uid);

  // 使用工具函數獲取樣式
  const indentStyle = getIndentStyle(item.level);

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
            {utilGetChildCount(item.data)}
          </div>
        )}
        </div>
      </SimpleContextMenu>

      {/* 重新命名對話框 */}
      <RenameDialog
        isOpen={showRenameDialog}
        onClose={() => setShowRenameDialog(false)}
        currentName={(item.data as any).name || ''}
        itemType={item.type as 'project' | 'package' | 'subpackage' | 'task'}
        onRename={handleRenameConfirm}
      />
    </div>
  );
});

// 設置 displayName 用於調試
VirtualizedTreeNode.displayName = 'VirtualizedTreeNode';

 