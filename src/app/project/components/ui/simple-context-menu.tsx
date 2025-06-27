'use client';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Badge } from '@/components/ui/badge';
import {
  Calculator,
  PlusIcon,
  EditIcon,
  Trash2Icon,
  CopyIcon,
  FolderPlusIcon,
  PackagePlusIcon,
  FilePlusIcon,
  UserPlusIcon,
  EyeIcon,
  TrendingUpIcon,
} from 'lucide-react';

interface SimpleContextMenuProps {
  children: React.ReactNode;
  itemType: 'project' | 'package' | 'subpackage' | 'task';
  itemName: string;
  currentQuantity?: { completed: number; total: number };
  onDistributeQuantity?: () => void;
  onAddChild?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onAssignTask?: () => void;
  onReviewTask?: () => void;
  onEditProgress?: () => void;
}

/**
 * 簡化的右鍵菜單組件 - 專注於數量分配功能
 */
export function SimpleContextMenu({
  children,
  itemType,
  itemName,
  currentQuantity,
  onDistributeQuantity,
  onAddChild,
  onRename,
  onDelete,
  onDuplicate,
  onAssignTask,
  onReviewTask,
  onEditProgress,
}: SimpleContextMenuProps) {
  
  // 獲取可添加的子項目信息
  const getChildInfo = () => {
    switch (itemType) {
      case 'project':
        return { icon: FolderPlusIcon, label: '新增工作包' };
      case 'package':
        return { icon: PackagePlusIcon, label: '新增子工作包' };
      case 'subpackage':
        return { icon: FilePlusIcon, label: '新增任務' };
      default:
        return null;
    }
  };

  // 檢查是否可以分配數量
  const canDistribute = itemType === 'package' || itemType === 'subpackage';

  const childInfo = getChildInfo();

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {/* 數量分配 - 主要功能 */}
        {canDistribute && onDistributeQuantity && (
          <>
            <ContextMenuItem onClick={onDistributeQuantity} className="font-medium">
              <Calculator className="mr-2 h-4 w-4 text-blue-600" />
              分配數量
              {currentQuantity && (
                <Badge variant="outline" className="ml-auto">
                  {currentQuantity.completed}/{currentQuantity.total}
                </Badge>
              )}
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}

        {/* 新增子項目 */}
        {childInfo && onAddChild && (
          <>
            <ContextMenuItem onClick={onAddChild}>
              <childInfo.icon className="mr-2 h-4 w-4" />
              {childInfo.label}
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}

        {/* 任務特定操作 */}
        {itemType === 'task' && (
          <>
            {onAssignTask && (
              <ContextMenuItem onClick={onAssignTask}>
                <UserPlusIcon className="mr-2 h-4 w-4 text-blue-600" />
                指派任務
              </ContextMenuItem>
            )}
            
            {onEditProgress && (
              <ContextMenuItem onClick={onEditProgress}>
                <TrendingUpIcon className="mr-2 h-4 w-4 text-green-600" />
                更新進度
              </ContextMenuItem>
            )}
            
            {onReviewTask && (
              <ContextMenuItem onClick={onReviewTask}>
                <EyeIcon className="mr-2 h-4 w-4 text-purple-600" />
                審核任務
              </ContextMenuItem>
            )}
            <ContextMenuSeparator />
          </>
        )}

        {/* 編輯操作 */}
        {onRename && (
          <ContextMenuItem onClick={onRename}>
            <EditIcon className="mr-2 h-4 w-4" />
            重新命名
          </ContextMenuItem>
        )}

        {onDuplicate && (
          <ContextMenuItem onClick={onDuplicate}>
            <CopyIcon className="mr-2 h-4 w-4" />
            複製
          </ContextMenuItem>
        )}

        {/* 危險操作 */}
        {onDelete && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem 
              onClick={onDelete}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2Icon className="mr-2 h-4 w-4" />
              刪除
            </ContextMenuItem>
          </>
        )}

        {/* 項目信息 */}
        <ContextMenuSeparator />
        <ContextMenuItem disabled className="text-xs">
          類型: {
            itemType === 'project' ? '專案' :
            itemType === 'package' ? '工作包' :
            itemType === 'subpackage' ? '子工作包' : '任務'
          } • {itemName}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
} 