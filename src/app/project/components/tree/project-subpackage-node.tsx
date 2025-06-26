'use client';
import { useState } from 'react';
import { 
  BookOpen,
  BookOpenCheck,
  PlusIcon,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { ProjectActionGuard } from '@/app/settings/components/permission-guard';
import { ProjectSubpackageNodeProps, SelectedItem } from '../../types';
import { COMPACT_INPUT_STYLE, COMPACT_BUTTON_STYLE, SMALL_BUTTON_STYLE, ITEM_SELECT_STYLE } from '../../constants';
import { getItemInfo, getChildCount } from './tree-utils';
import { RenameDialog } from './rename-dialog';
import { SimpleContextMenu } from '../ui/simple-context-menu';
import ProjectTaskNode from './project-task-node';

/**
 * 子工作包節點組件 - 顯示子工作包資訊並包含任務列表
 * 負責渲染子工作包名稱、可展開的任務列表和新增任務功能
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
}: ProjectSubpackageNodeProps & {
  onRename?: (subpackageItem: SelectedItem, newName: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  
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

  // 右鍵菜單處理
  const handleRename = () => {
    setShowRenameDialog(true);
  };

  const handleRenameConfirm = (newName: string) => {
    if (onRename) {
      onRename(subpackageItem, newName);
    }
  };

  const contextMenuProps = {
    itemType: 'subpackage' as const,
    itemName: subpackage.name,
    currentQuantity: subpackage.total !== undefined ? {
      completed: subpackage.completed || 0,
      total: subpackage.total || 0,
    } : undefined,
    onRename: handleRename,
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

  return (
    <>
      <SidebarMenuItem>
        <Collapsible
          className="group/collapsible"
          defaultOpen={expanded}
          onOpenChange={setExpanded}
        >
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              onClick={() => setExpanded(!expanded)}
              className="pl-2"
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
            {/* 任務列表 */}
            {subpackage.taskpackages?.map((task, taskIndex) => (
              <ProjectTaskNode
                key={taskIndex}
                project={project}
                packageIndex={packageIndex}
                subpackageIndex={subpackageIndex}
                taskIndex={taskIndex}
                selectedItem={selectedItem}
                onItemClick={onItemClick}
                loading={loading}
                isItemSelected={isItemSelected}
              />
            ))}
            
            {/* 新增任務按鈕 - 只有有權限的用戶才能看到 */}
            <ProjectActionGuard action="create" resource="task">
              <SidebarMenuItem>
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
