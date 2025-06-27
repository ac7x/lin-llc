'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  CheckSquareIcon, 
  UserPlusIcon, 
  EditIcon, 
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from 'lucide-react';
import { useGoogleAuth } from '@/app/(system)';
import { useTaskManagement } from '../../hooks';
import { TaskAssignmentDialog, TaskSubmissionDialog, TaskReviewDialog } from '../task';
import { Project, SelectedItem } from '../../types';

interface TaskpackageDetailsProps {
  project: Project;
  selectedItem: SelectedItem;
  onProjectUpdate: (updatedProject: Project) => void;
}

/**
 * 任務包詳情組件
 * 顯示任務包的詳細資訊和管理功能
 */
export function TaskpackageDetails({ 
  project, 
  selectedItem,
  onProjectUpdate
}: TaskpackageDetailsProps) {
  const { user } = useGoogleAuth();
  const { assignTask, submitTaskProgress, reviewTask, loading } = useTaskManagement();
  
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [showSubmissionDialog, setShowSubmissionDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);

  if (selectedItem?.type !== 'task') return null;

  const { packageIndex, subpackageIndex, taskIndex } = selectedItem;
  const task = project.packages[packageIndex]?.subpackages[subpackageIndex]?.taskpackages[taskIndex];
  
  if (!task) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">任務包不存在</p>
        </CardContent>
      </Card>
    );
  }

  const packageName = project.packages[packageIndex]?.name;
  const subpackageName = project.packages[packageIndex]?.subpackages[subpackageIndex]?.name;

  // 檢查用戶權限
  const isSubmitter = task.submitters?.includes(user?.uid || '') || false;
  const isReviewer = task.reviewers?.includes(user?.uid || '') || false;
  const canAssign = user?.uid; // 簡化權限檢查
  const canSubmit = isSubmitter && (task.status === 'in-progress' || task.status === 'rejected');
  const canReview = isReviewer && task.status === 'submitted';

  // 狀態信息
  const getStatusInfo = (status?: string) => {
    switch (status) {
      case 'in-progress':
        return { text: '進行中', color: 'bg-blue-100 text-blue-800', icon: ClockIcon };
      case 'submitted':
        return { text: '待審核', color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon };
      case 'approved':
        return { text: '已核准', color: 'bg-green-100 text-green-800', icon: CheckCircleIcon };
      case 'rejected':
        return { text: '已駁回', color: 'bg-red-100 text-red-800', icon: XCircleIcon };
      default:
        return { text: '草稿', color: 'bg-gray-100 text-gray-800', icon: ClockIcon };
    }
  };

  const statusInfo = getStatusInfo(task.status);
  const StatusIcon = statusInfo.icon;

  // 處理任務指派
  const handleAssignTask = async (submitters: string[], reviewers: string[]) => {
    const success = await assignTask(
      project,
      { packageIndex, subpackageIndex, taskIndex },
      submitters,
      reviewers,
      onProjectUpdate
    );
    return success;
  };

  // 處理任務提交
  const handleSubmitTask = async (completed: number, total: number) => {
    const success = await submitTaskProgress(
      project,
      { packageIndex, subpackageIndex, taskIndex },
      completed,
      total,
      onProjectUpdate
    );
    return success;
  };

  // 處理任務審核
  const handleReviewTask = async (approved: boolean, comment?: string) => {
    const success = await reviewTask(
      project,
      { packageIndex, subpackageIndex, taskIndex },
      approved,
      onProjectUpdate,
      comment
    );
    return success;
  };

  return (
    <>
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquareIcon className="h-5 w-5" />
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="truncate max-w-[400px]">
                  任務包：{task.name}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>任務包：{task.name}</p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 狀態和操作按鈕 */}
            <div className="flex items-center justify-between">
              <Badge className={statusInfo.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusInfo.text}
              </Badge>
              
              <div className="flex gap-2">
                {canAssign && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAssignmentDialog(true)}
                    disabled={loading}
                  >
                    <UserPlusIcon className="h-4 w-4 mr-1" />
                    指派
                  </Button>
                )}
                
                {canSubmit && (
                  <Button
                    size="sm"
                    onClick={() => setShowSubmissionDialog(true)}
                    disabled={loading}
                  >
                    <EditIcon className="h-4 w-4 mr-1" />
                    更新進度
                  </Button>
                )}
                
                {(canReview || task.status !== 'draft') && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowReviewDialog(true)}
                    disabled={loading}
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    {canReview ? '審核' : '查看'}
                  </Button>
                )}
              </div>
            </div>

            {/* 任務包進度 */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>任務包進度</span>
                <span>
                  {task.completed || 0} / {task.total || 0} 
                  ({task.progress || 0}%)
                </span>
              </div>
              <Progress value={task.progress || 0} className="h-2" />
            </div>

            {/* 人員信息 */}
            {((task.submitters && task.submitters.length > 0) || (task.reviewers && task.reviewers.length > 0)) && (
              <div className="space-y-3">
                <h4 className="font-medium">人員指派</h4>
                
                {task.submitters && task.submitters.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">提交者</p>
                    <div className="flex flex-wrap gap-1">
                      {task.submitters.map((uid) => (
                        <Badge key={uid} variant="secondary" className="text-xs">
                          {uid}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {task.reviewers && task.reviewers.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">審核者</p>
                    <div className="flex flex-wrap gap-1">
                      {task.reviewers.map((uid) => (
                        <Badge key={uid} variant="outline" className="text-xs">
                          {uid}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 任務包詳情 */}
            <div>
              <h4 className="font-medium mb-2">任務包詳情</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">所屬工作包：</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="truncate max-w-[200px]">{packageName}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{packageName}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">所屬子工作包：</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="truncate max-w-[200px]">{subpackageName}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{subpackageName}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">任務包名稱：</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="truncate max-w-[200px]">{task.name}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{task.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">完成數量：</span>
                  <span>{task.completed || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">總數量：</span>
                  <span>{task.total || 0}</span>
                </div>
              </div>
            </div>

            {/* 時間信息 */}
            {(task.submittedAt || task.approvedAt) && (
              <div>
                <h4 className="font-medium mb-2">時間記錄</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  {task.submittedAt && (
                    <p>提交時間：{new Date(task.submittedAt).toLocaleString('zh-TW')}</p>
                  )}
                  {task.approvedAt && (
                    <p>審核時間：{new Date(task.approvedAt).toLocaleString('zh-TW')}</p>
                  )}
                  {task.submittedBy && (
                    <p>提交者：{task.submittedBy}</p>
                  )}
                  {task.approvedBy && (
                    <p>審核者：{task.approvedBy}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 對話框 */}
      <TaskAssignmentDialog
        isOpen={showAssignmentDialog}
        onClose={() => setShowAssignmentDialog(false)}
        taskName={task.name}
        projectName={project.name}
        currentSubmitters={task.submitters || []}
        currentReviewers={task.reviewers || []}
        onAssign={handleAssignTask}
      />

      <TaskSubmissionDialog
        isOpen={showSubmissionDialog}
        onClose={() => setShowSubmissionDialog(false)}
        task={showSubmissionDialog ? {
          id: `${project.id}-${packageIndex}-${subpackageIndex}-${taskIndex}`,
          name: task.name,
          projectName: project.name,
          projectId: project.id,
          packageIndex,
          subpackageIndex,
          taskIndex,
          completed: task.completed || 0,
          total: task.total || 0,
        } : null}
        onUpdateTask={(taskId, updates) => {
          // 更新本地狀態或觸發重新載入
          console.log('Task updated:', taskId, updates);
          // 可以在這裡觸發專案更新
        }}
      />

      <TaskReviewDialog
        isOpen={showReviewDialog}
        onClose={() => setShowReviewDialog(false)}
        task={showReviewDialog ? {
          id: `${project.id}-${packageIndex}-${subpackageIndex}-${taskIndex}`,
          name: task.name,
          projectName: project.name,
          projectId: project.id,
          packageIndex,
          subpackageIndex,
          taskIndex,
          completed: task.completed || 0,
          total: task.total || 0,
          status: task.status,
          submittedAt: task.submittedAt,
          approvedAt: task.approvedAt,
        } : null}
        onUpdateTask={(taskId, updates) => {
          // 更新本地狀態或觸發重新載入
          console.log('Task updated:', taskId, updates);
          // 可以在這裡觸發專案更新
        }}
      />
    </>
  );
} 