'use client';
import { useState } from 'react';
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
import { useGoogleAuth } from '@/app/(system)';
import { useTaskManagement } from '../../../hooks';
import { ProjectTaskNodeProps, SelectedItem } from '../../../types';
import { ITEM_SELECT_STYLE } from '../../../constants';
import { getItemInfo } from './tree-utils';
import { TaskActionButtons } from './task-action-buttons';
import { TaskAssignmentDialog, TaskSubmissionDialog, TaskReviewDialog } from '../../task';
import { RenameDialog } from './rename-dialog';
import { SimpleContextMenu } from '../../ui/simple-context-menu';

/**
 * 任務節點組件 - 顯示單一任務的資訊
 * 負責渲染任務名稱、完成狀態和進度資訊，支援右鍵菜單和操作按鈕
 */
export default function ProjectTaskNode({
  project,
  packageIndex,
  subpackageIndex,
  taskIndex,
  onItemClick,
  isItemSelected,
  onProjectUpdate,
}: ProjectTaskNodeProps & {
  onProjectUpdate?: (updatedProject: any) => void;
}) {
  const { user } = useGoogleAuth();
  const { assignTask, submitTaskProgress, reviewTask } = useTaskManagement();
  
  // 對話框狀態
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [showSubmissionDialog, setShowSubmissionDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);

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

  const isSelected = isItemSelected(taskItem);
  const itemInfo = getItemInfo('task', isSelected);

  // 任務操作處理
  const handleAssignTask = () => {
    setShowAssignmentDialog(true);
  };

  const handleSubmitTask = () => {
    setShowSubmissionDialog(true);
  };

  const handleReviewTask = () => {
    setShowReviewDialog(true);
  };

  // 右鍵菜單處理
  const handleRename = () => {
    setShowRenameDialog(true);
  };

  const handleRenameConfirm = (newName: string) => {
    // 實現重新命名邏輯
    console.log('Rename task:', task.name, 'to:', newName);
    setShowRenameDialog(false);
  };

  const contextMenuProps = {
    itemType: 'task' as const,
    itemName: task.name,
    currentQuantity: {
      completed: task.completed || 0,
      total: task.total || 0,
    },
    onRename: handleRename,
  };

  return (
    <>
      <SidebarMenuItem className="overflow-hidden">
        <SimpleContextMenu {...contextMenuProps}>
          <SidebarMenuButton className="pl-2 min-h-0 h-5">
            <div 
              onClick={() => onItemClick(taskItem)}
              className={`${ITEM_SELECT_STYLE} ${
                isSelected ? 'bg-accent' : ''
              }`}
            >
              {isSelected ? (
                <SquareCheckIcon className={`h-3 w-3 ${itemInfo.color}`} />
              ) : (
                <SquareIcon className={`h-3 w-3 ${itemInfo.color}`} />
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={`truncate text-xs flex-1 ${itemInfo.color}`}>{task.name}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{task.name}</p>
                </TooltipContent>
              </Tooltip>
              
              {/* 任務操作按鈕和進度顯示 */}
              <TaskActionButtons
                task={task}
                userUid={user?.uid}
                isSelected={isSelected}
                itemColor={itemInfo.color}
                onAssignTask={handleAssignTask}
                onSubmitTask={handleSubmitTask}
                onReviewTask={handleReviewTask}
                showStatus={false}
                showProgress={false}
              />
            </div>
          </SidebarMenuButton>
        </SimpleContextMenu>
      </SidebarMenuItem>

      {/* 任務對話框 */}
      <TaskAssignmentDialog
        isOpen={showAssignmentDialog}
        onClose={() => setShowAssignmentDialog(false)}
        taskName={task.name}
        projectName={project.name}
        currentSubmitters={task.submitters || []}
        currentReviewers={task.reviewers || []}
        onAssign={async (submitters: string[], reviewers: string[]) => {
          const success = await assignTask(
            project,
            {
              packageIndex,
              subpackageIndex,
              taskIndex,
            },
            submitters,
            reviewers,
            onProjectUpdate || (() => {})
          );
          return success;
        }}
      />

      <TaskSubmissionDialog
        isOpen={showSubmissionDialog}
        onClose={() => setShowSubmissionDialog(false)}
        taskName={task.name}
        currentCompleted={task.completed || 0}
        currentTotal={task.total || 0}
        onSubmit={async (completed: number, total: number) => {
          const success = await submitTaskProgress(
            project,
            {
              packageIndex,
              subpackageIndex,
              taskIndex,
            },
            completed,
            total,
            onProjectUpdate || (() => {})
          );
          return success;
        }}
      />

      <TaskReviewDialog
        isOpen={showReviewDialog}
        onClose={() => setShowReviewDialog(false)}
        taskName={task.name}
        projectName={project.name}
        submittedBy={task.submittedBy}
        submittedAt={task.submittedAt}
        completed={task.completed || 0}
        total={task.total || 0}
        currentStatus={task.status}
        onReview={async (approved: boolean, comment?: string) => {
          const success = await reviewTask(
            project,
            {
              packageIndex,
              subpackageIndex,
              taskIndex,
            },
            approved,
            onProjectUpdate || (() => {}),
            comment
          );
          return success;
        }}
      />

      {/* 重新命名對話框 */}
      <RenameDialog
        isOpen={showRenameDialog}
        onClose={() => setShowRenameDialog(false)}
        currentName={task.name}
        itemType="task"
        onRename={handleRenameConfirm}
      />
    </>
  );
}
