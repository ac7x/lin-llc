'use client';
import { 
  SquareIcon,
  SquareCheckIcon,
} from 'lucide-react';
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ProjectTaskNodeProps, SelectedItem } from '@/app/project/types';

// 提取項目選擇樣式為常數，避免 Firebase Performance 錯誤
const ITEM_SELECT_STYLE = "flex items-center gap-2 hover:bg-accent rounded p-1 flex-1 cursor-pointer";

/**
 * 任務節點組件 - 顯示單一任務的資訊
 * 負責渲染任務名稱、完成狀態和進度資訊
 */
export default function ProjectTaskNode({
  project,
  packageIndex,
  subpackageIndex,
  taskIndex,
  onItemClick,
  isItemSelected,
}: ProjectTaskNodeProps) {
  const task = project.packages[packageIndex]?.subpackages[subpackageIndex]?.taskpackages[taskIndex];
  
  if (!task) {
    return null;
  }

  const taskItem: SelectedItem = {
    type: 'task',
    projectId: project.id,
    packageIndex,
    subpackageIndex,
    taskIndex,
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton className="pl-2">
        <div 
          onClick={() => onItemClick(taskItem)}
          className={`${ITEM_SELECT_STYLE} ${
            isItemSelected(taskItem) ? 'bg-accent' : ''
          }`}
        >
          {isItemSelected(taskItem) ? (
            <SquareCheckIcon className="h-3 w-3" />
          ) : (
            <SquareIcon className="h-3 w-3" />
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="truncate text-xs">{task.name}</span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{task.name}</p>
            </TooltipContent>
          </Tooltip>
          <span className="text-xs text-blue-600">
            {task.completed || 0}/{task.total || 0}
          </span>
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
