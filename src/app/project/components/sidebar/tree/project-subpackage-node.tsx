'use client';
import { useState, useCallback } from 'react';
import { 
  BookOpen,
  BookOpenCheck,
  PlusIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ProjectActionGuard } from '@/app/(system)';
import { ProjectSubpackageNodeProps, SelectedItem } from '../../../types';
import { FlatItem } from '../../../utils/tree-flattener';
import { COMPACT_INPUT_STYLE, COMPACT_BUTTON_STYLE, SMALL_BUTTON_STYLE, ITEM_SELECT_STYLE } from '../../../constants';
import { getItemInfo, getChildCount, getStatusInfo, getBorderColor, getIndentStyle } from './tree-utils';
import { RenameDialog } from './rename-dialog';
import { SimpleContextMenu } from '../../ui/simple-context-menu';
import ProjectTaskpackageNode from './project-taskpackage-node';

/**
 * 子工作包節點組件 - 顯示子工作包資訊並包含任務列表
 * 負責渲染子工作包名稱、可展開的任務列表和新增任務功能
 * 已從 project-tree.tsx 移動完整的子工作包相關邏輯
 */
export default function ProjectSubpackageNode({
  project,
  packageIndex,
  subpackageIndex,
  selectedItem,
  onItemClick,
  onAddTaskPackage,
  loading,
  isItemSelected,
  subInputs,
  setSubInputs,
  onRename,
  onProjectUpdate,
}: ProjectSubpackageNodeProps & {
  onRename?: (subpackageItem: SelectedItem, newName: string) => void;
  onProjectUpdate?: (updatedProject: any) => void;
}) {
  // === 狀態管理 ===
  const [expanded, setExpanded] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  
  // === 計算邏輯 ===
  const subpackage = project.packages[packageIndex]?.subpackages[subpackageIndex];
  
  if (!subpackage) {
    return null;
  }

  const subpackageItem: SelectedItem = {
    type: 'subpackage',
    projectId: project.id,
    packageIndex,
    subpackageIndex,
  };

  const isSelected = isItemSelected(subpackageItem);
  const itemInfo = getItemInfo('subpackage', isSelected);

  // === 事件處理 ===
  const handleRename = () => {
    setShowRenameDialog(true);
  };

  const handleRenameConfirm = (newName: string) => {
    if (onRename) {
      onRename(subpackageItem, newName);
    }
  };

  const handleAddTaskClick = () => {
    setShowInput(true);
  };

  const handleAddTask = () => {
    const taskName = subInputs[project.id]?.[packageIndex]?.[subpackageIndex] || '';
    if (taskName.trim()) {
      void onAddTaskPackage(project.id, packageIndex, subpackageIndex, taskName);
      setShowInput(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTask();
    }
  };

  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };

  // === 配置 ===
  const contextMenuProps = {
    itemType: 'subpackage' as const,
    itemName: subpackage.name,
    currentQuantity: subpackage.total !== undefined ? {
      completed: subpackage.completed || 0,
      total: subpackage.total || 0,
    } : undefined,
    onRename: handleRename,
  };

  // === 渲染 ===
  return (
    <>
      <SidebarMenuItem className="overflow-hidden">
        <Collapsible
          className="group/collapsible"
          defaultOpen={expanded}
          onOpenChange={setExpanded}
        >
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              onClick={handleToggleExpand}
              className="pl-2 min-h-0 h-5"
            >
              {expanded ? (
                <BookOpenCheck className={`transition-transform h-3 w-3 ${itemInfo.color}`} />
              ) : (
                <BookOpen className={`transition-transform h-3 w-3 ${itemInfo.color}`} />
              )}
              <span className="ml-1 text-xs text-muted-foreground">{getChildCount(subpackage)}</span>
              <SimpleContextMenu {...contextMenuProps}>
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    onItemClick(subpackageItem);
                  }}
                  className={`${ITEM_SELECT_STYLE} ${
                    isSelected ? 'bg-accent' : ''
                  }`}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className={`truncate text-xs ${itemInfo.color}`}>{subpackage.name}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{subpackage.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </SimpleContextMenu>
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub className="mx-1 border-l border-border/10">
              {/* 任務包列表 - 使用 ProjectTaskpackageNode 組件 */}
              {subpackage.taskpackages?.map((task, taskIndex) => (
                <ProjectTaskpackageNode
                  key={taskIndex}
                  project={project}
                  packageIndex={packageIndex}
                  subpackageIndex={subpackageIndex}
                  taskIndex={taskIndex}
                  selectedItem={selectedItem}
                  onItemClick={onItemClick}
                  loading={loading}
                  isItemSelected={isItemSelected}
                  onProjectUpdate={onProjectUpdate}
                />
              ))}
              
              {/* 新增任務包按鈕 - 只有有權限的用戶才能看到 */}
              <ProjectActionGuard action="create" resource="task">
                <SidebarMenuItem className="overflow-hidden">
                  <div className="pl-2 pr-1 py-1">
                    {showInput ? (
                      <div className="flex gap-1">
                        <Input
                          placeholder="任務名稱"
                          value={subInputs[project.id]?.[packageIndex]?.[subpackageIndex] || ''}
                          onChange={e => setSubInputs(prev => ({
                            ...prev,
                            [project.id]: {
                              ...prev[project.id],
                              [packageIndex]: {
                                ...prev[project.id]?.[packageIndex],
                                [subpackageIndex]: e.target.value
                              }
                            }
                          }))}
                          className={COMPACT_INPUT_STYLE}
                          onKeyDown={handleKeyDown}
                        />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              onClick={handleAddTask}
                              disabled={loading || !(subInputs[project.id]?.[packageIndex]?.[subpackageIndex] || '').trim()}
                              className={SMALL_BUTTON_STYLE}
                            >
                              <PlusIcon className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>建立任務</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleAddTaskClick}
                        className={COMPACT_BUTTON_STYLE}
                      >
                        <PlusIcon className="h-3 w-3 mr-1" />
                        新增任務
                      </Button>
                    )}
                  </div>
                </SidebarMenuItem>
              </ProjectActionGuard>
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenuItem>

      {/* 重新命名對話框 */}
      <RenameDialog
        isOpen={showRenameDialog}
        onClose={() => setShowRenameDialog(false)}
        currentName={subpackage.name}
        itemType="subpackage"
        onRename={handleRenameConfirm}
      />
    </>
  );
}

/**
 * 虛擬化子工作包渲染組件
 * 專門處理虛擬化模式下的子工作包項目渲染
 */
export function VirtualizedSubpackageItem({
  item,
  style,
  isSelected,
  onToggleExpand,
  onItemClick,
  onProjectUpdate,
  renameDialogStates,
  setRenameDialogStates,
}: {
  item: FlatItem;
  style: React.CSSProperties;
  isSelected: boolean;
  onToggleExpand: (id: string) => void;
  onItemClick: (item: FlatItem) => void;
  onProjectUpdate?: (updatedProject: any) => void;
  renameDialogStates: Record<string, boolean>;
  setRenameDialogStates: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  if (item.type !== 'subpackage') return null;

  // === 計算邏輯 ===
  const subpackage = item.data as any;
  const itemInfo = getItemInfo(item.type, isSelected);
  const ItemIcon = itemInfo.icon;
  const statusInfo = getStatusInfo(item.data);
  const StatusIcon = statusInfo?.icon;
  const indentStyle = getIndentStyle(item.level);

  // === 事件處理 ===
  const handleRename = useCallback(() => {
    setRenameDialogStates(prev => ({ ...prev, [item.id]: true }));
  }, [item.id, setRenameDialogStates]);

  const handleRenameConfirm = useCallback((newName: string) => {
    console.log('Rename subpackage:', subpackage.name, 'to:', newName);
    setRenameDialogStates(prev => ({ ...prev, [item.id]: false }));
  }, [item.id, subpackage.name, setRenameDialogStates]);

  // === 配置 ===
  const contextMenuProps = {
    itemType: 'subpackage' as const,
    itemName: subpackage.name || '',
    currentQuantity: subpackage.total !== undefined ? {
      completed: subpackage.completed || 0,
      total: subpackage.total || 0,
    } : undefined,
    onRename: handleRename,
  };

  // === 渲染 ===
  return (
    <div key={item.id} style={style}>
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
            {subpackage.name}
          </span>

          {/* 進度信息 */}
          {subpackage.progress !== undefined && (
            <div className="flex items-center gap-2 min-w-[120px]">
              <div className={`w-16 text-xs ${isSelected ? itemInfo.color : 'text-muted-foreground'}`}>
                {subpackage.progress || 0}%
              </div>
              <Progress 
                value={subpackage.progress || 0} 
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

          {/* 子項目計數 */}
          {item.hasChildren && (
            <div className={`text-xs ml-2 ${isSelected ? itemInfo.color : 'text-muted-foreground'}`}>
              {subpackage.taskpackages?.length || 0} 任務
            </div>
          )}
        </div>
      </SimpleContextMenu>

      {/* 重新命名對話框 */}
      <RenameDialog
        isOpen={renameDialogStates[item.id] || false}
        onClose={() => setRenameDialogStates(prev => ({ ...prev, [item.id]: false }))}
        currentName={subpackage.name || ''}
        itemType="subpackage"
        onRename={handleRenameConfirm}
      />
    </div>
  );
}
