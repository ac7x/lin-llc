'use client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  UserPlusIcon,
  EditIcon,
  EyeIcon,
} from 'lucide-react';
import { getUserPermissions, getStatusInfo } from './tree-utils';
import { TaskPackage } from '../../types';

interface TaskActionButtonsProps {
  task: TaskPackage;
  userUid?: string;
  isSelected?: boolean;
  itemColor?: string;
  onAssignTask?: () => void;
  onSubmitTask?: () => void;
  onReviewTask?: () => void;
  showProgress?: boolean;
  showStatus?: boolean;
}

/**
 * 任務操作按鈕組件
 * 根據用戶權限顯示不同的操作按鈕
 */
export function TaskActionButtons({
  task,
  userUid,
  isSelected = false,
  itemColor = '',
  onAssignTask,
  onSubmitTask,
  onReviewTask,
  showProgress = false,
  showStatus = false,
}: TaskActionButtonsProps) {
  const permissions = getUserPermissions(task, userUid);
  const statusInfo = getStatusInfo(task);

  return (
    <div className="flex items-center gap-2 ml-2">
      {/* 進度信息 */}
      {showProgress && task.progress !== undefined && (
        <div className="flex items-center gap-2 min-w-[120px]">
          <div className={`w-16 text-xs ${isSelected ? itemColor : 'text-muted-foreground'}`}>
            {task.progress || 0}%
          </div>
          <Progress 
            value={task.progress || 0} 
            className="w-16 h-2" 
          />
        </div>
      )}

      {/* 數量顯示 */}
      {(task.completed !== undefined || task.total !== undefined) && (
        <span className={`text-xs flex-shrink-0 ${
          isSelected ? 'text-orange-600' : 'text-blue-600'
        }`}>
          {task.completed || 0}/{task.total || 0}
        </span>
      )}

      {/* 狀態 Badge */}
      {showStatus && statusInfo && (
        <Badge className={`${statusInfo.color} text-xs`}>
          <statusInfo.icon className="h-3 w-3 mr-1" />
          {statusInfo.text}
        </Badge>
      )}

      {/* 操作按鈕 */}
      <div className="flex gap-1">
        {permissions.canAssign && onAssignTask && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onAssignTask();
            }}
            title="指派任務"
          >
            <UserPlusIcon className={`h-3 w-3 ${isSelected ? itemColor : ''}`} />
          </Button>
        )}

        {permissions.canSubmit && onSubmitTask && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onSubmitTask();
            }}
            title="更新進度"
          >
            <EditIcon className={`h-3 w-3 ${isSelected ? itemColor : ''}`} />
          </Button>
        )}

        {permissions.canReview && onReviewTask && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onReviewTask();
            }}
            title="審核任務"
          >
            <EyeIcon className={`h-3 w-3 ${isSelected ? itemColor : ''}`} />
          </Button>
        )}
      </div>
    </div>
  );
} 