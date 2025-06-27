'use client';
import { useState, useCallback } from 'react';
import { CheckSquareIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TaskAssignmentDialog } from '../../task/task-assignment-dialog';
import { TaskSubmissionDialog } from '../../task/task-submission-dialog';
import { TaskReviewDialog } from '../../task/task-review-dialog';
import { TaskActionButtons } from './task-action-buttons';
import { SimpleContextMenu } from '../../ui/simple-context-menu';
import { RenameDialog } from './rename-dialog';

import { ProjectTaskPackageNodeProps, SelectedItem, Project } from '../../../types';
import { FlatItem } from './tree-flattener';
import { ITEM_SELECT_STYLE } from '../../../constants';
import { 
  getItemInfo, 
  getStatusInfo, 
  getUserPermissions, 
  getBorderColor, 
  getIndentStyle,
  getItemContainerClasses,
  getItemTextClasses,
  getItemTextWrapperClasses,
  getItemCountClasses,
  getIconClasses,
  getToggleButtonClasses,
  getToggleIconClasses,
  getActionButtonClasses,
  getSpacerClasses,
  getCollapsibleGroupClasses,
  getInputContainerClasses,
  getInputWrapperClasses,
  getAddButtonWrapperClasses,
  getTreeContainerClasses,
  getSubmenuContainerClasses,
  getProgressTextClasses
} from './tree-utils';
import { useGoogleAuth } from '@/app/(system)';
import { useTaskManagement } from '../../../hooks/use-task-management';

export default function ProjectTaskpackageNode({
  project,
  packageIndex,
  subpackageIndex,
  taskIndex,
  selectedItem,
  onItemClick,
  loading,
  isItemSelected,
  onProjectUpdate,
}: ProjectTaskPackageNodeProps & {
  onProjectUpdate?: (updatedProject: Project) => void;
}) {
  const { user } = useGoogleAuth();
  const { assignTask, submitTaskProgress, reviewTask } = useTaskManagement();
  
  // 對話框狀態
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [showSubmissionDialog, setShowSubmissionDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);

  // === 計算邏輯 ===
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
  const ItemIcon = itemInfo.icon;

  // 使用統一樣式系統
  const containerClasses = getItemContainerClasses(itemInfo, isSelected, getBorderColor('task'));
  const textClasses = getItemTextClasses(itemInfo.color);
  const textWrapperClasses = getItemTextWrapperClasses();
  const countClasses = getItemCountClasses(isSelected, itemInfo.color);
  const iconClasses = getIconClasses(itemInfo.color);
  const spacerClasses = getSpacerClasses();
  const progressTextClasses = getProgressTextClasses(isSelected, itemInfo.color);

  // === 事件處理 ===
  const handleItemClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onItemClick) {
      onItemClick(taskItem);
    }
  };

  // === 權限和狀態 ===
  const statusInfo = getStatusInfo(task);
  const userPermissions = getUserPermissions(task, user?.uid);
  
  // === 配置 ===
  const contextMenuProps = {
    itemType: 'task' as const,
    itemName: task.name || '',
    currentQuantity: {
      completed: task.completed || 0,
      total: task.total || 0,
    },
    onRename: () => {}, // 暫時空實現
  };

  return (
    <div className={getTreeContainerClasses()}>
        <SimpleContextMenu {...contextMenuProps}>
        <div className={containerClasses} onClick={handleItemClick}>
          {/* 空白佔位 */}
          <div className={spacerClasses} />

            {/* 項目圖標 */}
          <ItemIcon className={iconClasses} />

            {/* 項目名稱 */}
          <div className={textWrapperClasses}>
            <span className={textClasses}>
                  {task.name}
                </span>
          </div>

          {/* 進度信息 */}
          {task.progress !== undefined && (
            <div className="flex items-center gap-2 min-w-[120px]">
              <div className={progressTextClasses}>
                {task.progress || 0}%
              </div>
              <Progress 
                value={task.progress || 0} 
                className="w-16 h-2" 
              />
            </div>
          )}

          {/* 狀態 Badge */}
          {statusInfo && (
            <Badge className={`${statusInfo.color} text-xs`}>
              <statusInfo.icon className="h-3 w-3 mr-1" />
              {statusInfo.text}
            </Badge>
          )}

          {/* 數量信息 */}
          <div className={countClasses}>
            {task.completed || 0}/{task.total || 0}
          </div>

          {/* 操作按鈕 */}
            <TaskActionButtons
              task={task}
              userUid={user?.uid}
              isSelected={isSelected}
              itemColor={itemInfo.color}
            onAssignTask={() => setShowAssignmentDialog(true)}
            onSubmitTask={() => setShowSubmissionDialog(true)}
            onReviewTask={() => setShowReviewDialog(true)}
              showStatus={false}
              showProgress={false}
            />
          </div>
        </SimpleContextMenu>

      {/* 對話框 */}
      <TaskAssignmentDialog
        isOpen={showAssignmentDialog}
        onClose={() => setShowAssignmentDialog(false)}
        taskName={task.name}
        projectName={project.name || project.id}
        currentSubmitters={task.assigness || []}
        currentReviewers={task.reviewers || []}
        onAssign={async (submitters: string[], reviewers: string[]) => {
          return await assignTask(
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
        }}
      />

      <TaskSubmissionDialog
        isOpen={showSubmissionDialog}
        onClose={() => setShowSubmissionDialog(false)}
        task={{
          id: `${project.id}-${packageIndex}-${subpackageIndex}-${taskIndex}`,
          name: task.name,
          projectName: project.name || project.id,
          projectId: project.id,
          packageIndex,
          subpackageIndex,
          taskIndex,
          completed: task.completed || 0,
          total: task.total || 0,
        }}
        onUpdateTask={(taskId: string, updates: any) => {
          if (onProjectUpdate) {
            console.log('Task updated:', taskId, updates);
          }
        }}
      />

      <TaskReviewDialog
        isOpen={showReviewDialog}
        onClose={() => setShowReviewDialog(false)}
        task={{
          id: `${project.id}-${packageIndex}-${subpackageIndex}-${taskIndex}`,
          name: task.name,
          projectName: project.name || project.id,
          projectId: project.id,
          packageIndex,
          subpackageIndex,
          taskIndex,
          completed: task.completed || 0,
          total: task.total || 0,
          status: task.status,
          submittedAt: task.submittedAt,
          approvedAt: task.approvedAt,
        }}
        onUpdateTask={(taskId: string, updates: any) => {
          if (onProjectUpdate) {
            console.log('Task updated:', taskId, updates);
          }
        }}
      />
    </div>
  );
}

/**
 * 虛擬化任務包渲染組件
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
  onProjectUpdate?: (updatedProject: Project) => void;
  renameDialogStates: Record<string, boolean>;
  setRenameDialogStates: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  // 確保數據安全性
  if (!item || item.type !== 'task' || !item.data) {
    return null;
  }

  const { user } = useGoogleAuth();
  const { assignTask, submitTaskProgress, reviewTask } = useTaskManagement();
  
  // 對話框狀態
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [showSubmissionDialog, setShowSubmissionDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);

  const task = item.data as any; // TaskPackage type
  const itemInfo = getItemInfo('task', isSelected);
  const ItemIcon = itemInfo.icon;

  // === 權限和狀態 ===
  const statusInfo = getStatusInfo(task);
  const userPermissions = getUserPermissions(task, user?.uid);

  // === 事件處理 ===
  const handleRename = useCallback(() => {
    setRenameDialogStates(prev => ({ ...prev, [item.id]: true }));
  }, [item.id, setRenameDialogStates]);

  const handleRenameConfirm = useCallback((newName: string) => {
    console.log('Rename task:', task.name, 'to:', newName);
    setRenameDialogStates(prev => ({ ...prev, [item.id]: false }));
  }, [item.id, task.name, setRenameDialogStates]);

  // === 配置 ===
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
          style={getIndentStyle(item.level)}
          onClick={() => onItemClick(item)}
        >
          {/* 空白佔位 */}
          <div className="w-6" />

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
          {statusInfo && (
            <Badge className={`${statusInfo.color} text-xs`}>
              <statusInfo.icon className="h-3 w-3 mr-1" />
              {statusInfo.text}
            </Badge>
          )}

          {/* 數量信息 */}
          <Badge variant="outline" className={`text-xs ml-2 ${isSelected ? itemInfo.color : 'text-muted-foreground'}`}>
            {task.completed || 0}/{task.total || 0}
          </Badge>

          {/* 操作按鈕 */}
          <TaskActionButtons
            task={task}
            userUid={user?.uid}
            isSelected={isSelected}
            itemColor={itemInfo.color}
            onAssignTask={() => setShowAssignmentDialog(true)}
            onSubmitTask={() => setShowSubmissionDialog(true)}
            onReviewTask={() => setShowReviewDialog(true)}
            showStatus={false}
            showProgress={false}
          />
        </div>
      </SimpleContextMenu>

      {/* 對話框 */}
      <TaskAssignmentDialog
        isOpen={showAssignmentDialog}
        onClose={() => setShowAssignmentDialog(false)}
        taskName={task.name || 'Unnamed Task'}
        projectName={item.projectId}
        currentSubmitters={task.assigness || []}
        currentReviewers={task.reviewers || []}
        onAssign={async (submitters: string[], reviewers: string[]) => {
          console.log('Assign task in virtualized mode:', submitters, reviewers);
          return true;
        }}
      />

      <TaskSubmissionDialog
        isOpen={showSubmissionDialog}
        onClose={() => setShowSubmissionDialog(false)}
        task={{
          id: `${item.projectId}-${item.packageIndex || 0}-${item.subpackageIndex || 0}-${item.taskIndex || 0}`,
          name: task.name || 'Unnamed Task',
          projectName: item.projectId,
          projectId: item.projectId,
          packageIndex: item.packageIndex || 0,
          subpackageIndex: item.subpackageIndex || 0,
          taskIndex: item.taskIndex || 0,
          completed: task.completed || 0,
          total: task.total || 0,
        }}
        onUpdateTask={(taskId: string, updates: any) => {
          console.log('Update task in virtualized mode:', taskId, updates);
        }}
      />

      <TaskReviewDialog
        isOpen={showReviewDialog}
        onClose={() => setShowReviewDialog(false)}
        task={{
          id: `${item.projectId}-${item.packageIndex || 0}-${item.subpackageIndex || 0}-${item.taskIndex || 0}`,
          name: task.name || 'Unnamed Task',
          projectName: item.projectId,
          projectId: item.projectId,
          packageIndex: item.packageIndex || 0,
          subpackageIndex: item.subpackageIndex || 0,
          taskIndex: item.taskIndex || 0,
          completed: task.completed || 0,
          total: task.total || 0,
          status: task.status,
          submittedAt: task.submittedAt,
          approvedAt: task.approvedAt,
        }}
        onUpdateTask={(taskId: string, updates: any) => {
          console.log('Update task in virtualized mode:', taskId, updates);
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