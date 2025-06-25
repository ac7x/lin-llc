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
import { ProjectSubpackageNodeProps } from '@/app/project/types';
import ProjectTaskNode from './project-task-node';

// 提取重複的 Input 樣式為常數，避免 Firebase Performance 錯誤
const COMPACT_INPUT_STYLE = "flex-1 text-xs h-6";

// 提取重複的 Button 樣式為常數，避免 Firebase Performance 錯誤
const COMPACT_BUTTON_STYLE = "w-full justify-start text-xs h-6 text-muted-foreground hover:text-foreground";

// 提取小型 Button 樣式為常數，避免 Firebase Performance 錯誤
const SMALL_BUTTON_STYLE = "h-6 w-6 p-0";

// 提取項目選擇樣式為常數，避免 Firebase Performance 錯誤
const ITEM_SELECT_STYLE = "flex items-center gap-2 hover:bg-accent rounded p-1 flex-1 cursor-pointer";

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
}: ProjectSubpackageNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const [showInput, setShowInput] = useState(false);
  
  const subpackage = project.packages[packageIndex]?.subpackages[subpackageIndex];
  
  if (!subpackage) {
    return null;
  }

  const subpackageItem = {
    type: 'subpackage' as const,
    projectId: project.id,
    packageIndex,
    subpackageIndex,
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
              <BookOpenCheck className="transition-transform h-3 w-3" />
            ) : (
              <BookOpen className="transition-transform h-3 w-3" />
            )}
            <span className="ml-1 text-xs text-muted-foreground">{subpackage.taskpackages?.length || 0}</span>
            <div 
              onClick={(e) => {
                e.stopPropagation();
                onItemClick(subpackageItem);
              }}
              className={`${ITEM_SELECT_STYLE} ${
                isItemSelected(subpackageItem) ? 'bg-accent' : ''
              }`}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="truncate text-xs">{subpackage.name}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{subpackage.name}</p>
                </TooltipContent>
              </Tooltip>
            </div>
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
  );
}
