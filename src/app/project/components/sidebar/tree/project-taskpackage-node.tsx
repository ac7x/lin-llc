'use client';
import { useState, useCallback } from 'react';
import { 
  SquareIcon,
  SquareCheckIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import { ProjectTaskpackageNodeProps, SelectedItem } from '../../../types';
import { FlatItem } from './tree-flattener';
import { ITEM_SELECT_STYLE } from '../../../constants';
import { getItemInfo, getStatusInfo, getUserPermissions, getBorderColor, getIndentStyle } from './tree-utils';
import { TaskActionButtons } from './task-action-buttons';
import { TaskAssignmentDialog, TaskSubmissionDialog, TaskReviewDialog } from '../../task';
import { RenameDialog } from './rename-dialog';
import { SimpleContextMenu } from '../../ui/simple-context-menu';

/**
 * 虛擬化任務包渲染組件
 * 專門處理虛擬化模式下的任務包項目渲染
 */
export function VirtualizedTaskpackageItem({
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
  const { user } = useGoogleAuth();
  const { assignTask, submitTaskProgress, reviewTask } = useTaskManagement();
  
  // 對話框狀態
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [showSubmissionDialog, setShowSubmissionDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);

  if (item.type !== 'task') return null;

  const task = item.data as any;
  const itemInfo = getItemInfo(item.type, isSelected);
  const ItemIcon = itemInfo.icon;
  const statusInfo = getStatusInfo(item.data);
  const StatusIcon = statusInfo?.icon;
  const permissions = getUserPermissions(item.data, user?.uid);
  const indentStyle = getIndentStyle(item.level);

  // 任務操作處理
  const handleAssignTask = useCallback(() => {
    setShowAssignmentDialog(true);
  }, []);

  const handleSubmitTask = useCallback(() => {
    setShowSubmissionDialog(true);
  }, []);

  const handleReviewTask = useCallback(() => {
    setShowReviewDialog(true);
  }, []);

  // 右鍵菜單處理
  const handleRename = useCallback(() => {
    setRenameDialogStates(prev => ({ ...prev, [item.id]: true }));
  }, [item.id, setRenameDialogStates]);

  const handleRenameConfirm = useCallback((newName: string) => {
    console.log('Rename task:', task.name, 'to:', newName);
    setRenameDialogStates(prev => ({ ...prev, [item.id]: false }));
  }, [item.id, task.name, setRenameDialogStates]);

  const contextMenuProps = {
    itemType: 'task' as const,
    itemName: task.name || '',
    currentQuantity: {
      completed: task.completed || 0,
      total: task.total || 0,
    },
    onRename: handleRename,
  };

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
            {task.name}
          </span>

          {/* 進度信息 */}
          {task.progress !== undefined && (
            <div className="flex items-center gap-2 min-w-[120px]">
              <div className={`w-16 text-xs ${isSelected ? itemInfo.color : 'text-muted-foreground'}`}>
                {task.progress || 0}%
              </div>
              <Progress 
                value={task.progress || 0} 
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
          <div className="flex gap-1 ml-2">
            {permissions.canAssign && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAssignTask();
                }}
                title="指派任務"
              >
                <SquareCheckIcon className={`h-3 w-3 ${isSelected ? itemInfo.color : ''}`} />
              </Button>
            )}

            {permissions.canSubmit && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSubmitTask();
                }}
                title="更新進度"
              >
                <SquareIcon className={`h-3 w-3 ${isSelected ? itemInfo.color : ''}`} />
              </Button>
            )}

            {permissions.canReview && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReviewTask();
                }}
                title="審核任務"
              >
                <SquareCheckIcon className={`h-3 w-3 ${isSelected ? itemInfo.color : ''}`} />
              </Button>
            )}
          </div>

          {/* 數量顯示 */}
          <div className={`text-xs ml-2 ${isSelected ? itemInfo.color : 'text-muted-foreground'}`}>
            {task.completed || 0}/{task.total || 0}
          </div>
        </div>
      </SimpleContextMenu>

      {/* 任務對話框 */}
      <TaskAssignmentDialog
        isOpen={showAssignmentDialog}
        onClose={() => setShowAssignmentDialog(false)}
        taskName={task.name}
        projectName={item.projectId}
        currentSubmitters={task.submitters || []}
        currentReviewers={task.reviewers || []}
        onAssign={async (submitters: string[], reviewers: string[]) => {
          console.log('Assign task in virtualized mode:', submitters, reviewers);
          return true;
        }}
      />

      <TaskSubmissionDialog
        isOpen={showSubmissionDialog}
        onClose={() => setShowSubmissionDialog(false)}
        taskName={task.name}
        currentCompleted={task.completed || 0}
        currentTotal={task.total || 0}
        onSubmit={async (completed: number, total: number) => {
          console.log('Submit task in virtualized mode:', completed, total);
          return true;
        }}
      />

      <TaskReviewDialog
        isOpen={showReviewDialog}
        onClose={() => setShowReviewDialog(false)}
        taskName={task.name}
        projectName={item.projectId}
        submittedBy={task.submittedBy}
        submittedAt={task.submittedAt}
        completed={task.completed || 0}
        total={task.total || 0}
        currentStatus={task.status}
        onReview={async (approved: boolean, comment?: string) => {
          console.log('Review task in virtualized mode:', approved, comment);
          return true;
        }}
      />

      {/* 重新命名對話框 */}
      <RenameDialog
        isOpen={renameDialogStates[item.id] || false}
        onClose={() => setRenameDialogStates(prev => ({ ...prev, [item.id]: false }))}
        currentName={task.name || ''}
        itemType="task"
        onRename={handleRenameConfirm}
      />
    </div>
  );
}

/**
 * 任務包節點組件 - 顯示單一任務包的資訊
 * 負責渲染任務包名稱、完成狀態和進度資訊，支援右鍵菜單和操作按鈕
 */
export default function ProjectTaskpackageNode({
  project,
  packageIndex,
  subpackageIndex,
  taskIndex,
  onItemClick,
  isItemSelected,
  onProjectUpdate,
}: ProjectTaskpackageNodeProps & {
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