'use client';
import { useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/(system)';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useTaskManagement } from '@/app/project/hooks/use-task-management';
import type { Project } from '@/app/project/types';

interface TaskReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: {
    id: string;
    name: string;
    projectName: string;
    projectId: string;
    packageIndex: number;
    subpackageIndex: number;
    taskIndex: number;
    completed: number;
    total: number;
    status?: 'draft' | 'in-progress' | 'submitted' | 'approved' | 'rejected';
    submittedAt?: string;
    approvedAt?: string;
  } | null;
  onUpdateTask: (taskId: string, updates: { status?: string; approvedAt?: string }) => void;
}

export function TaskReviewDialog({
  isOpen,
  onClose,
  task,
  onUpdateTask,
}: TaskReviewDialogProps) {
  const { reviewTask } = useTaskManagement();
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  if (!task) return null;

  const progress = task.total > 0 ? Math.round((task.completed / task.total) * 100) : 0;
  const isComplete = progress === 100;

  const getStatusInfo = (status?: string) => {
    switch (status) {
      case 'submitted':
        return { text: '待審核', color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon };
      case 'approved':
        return { text: '已核准', color: 'bg-green-100 text-green-800', icon: CheckCircleIcon };
      case 'rejected':
        return { text: '已駁回', color: 'bg-red-100 text-red-800', icon: XCircleIcon };
      default:
        return { text: '進行中', color: 'bg-blue-100 text-blue-800', icon: ClockIcon };
    }
  };

  const statusInfo = getStatusInfo(task.status);
  const StatusIcon = statusInfo.icon;

  const handleReview = async (approved: boolean) => {
    if (!approved && !comment.trim()) {
      toast.error('駁回時請提供理由');
      return;
    }

    setLoading(true);
    
    try {
      // 獲取專案數據
      const projectRef = doc(db, 'projects', task.projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        toast.error('找不到專案數據');
        return;
      }

      const projectData = projectDoc.data() as Project;

      const success = await reviewTask(
        projectData,
        {
          packageIndex: task.packageIndex,
          subpackageIndex: task.subpackageIndex,
          taskIndex: task.taskIndex,
        },
        approved,
        () => {}, // 空的更新回調
        comment
      );

      if (success) {
        // 重新獲取更新後的專案數據
        const updatedProjectDoc = await getDoc(projectRef);
        if (updatedProjectDoc.exists()) {
          const updatedProjectData = updatedProjectDoc.data() as Project;
          const updatedTask = updatedProjectData.packages[task.packageIndex]
            .subpackages[task.subpackageIndex]
            .taskpackages[task.taskIndex];

          // 更新本地任務狀態
          onUpdateTask(task.id, {
            status: updatedTask.status,
            approvedAt: updatedTask.approvedAt,
          });

          toast.success(approved ? '任務審核通過' : '任務已駁回');
        }

        setComment('');
        onClose();
      } else {
        toast.error('審核失敗');
      }
      
    } catch (error) {
      console.error('審核任務失敗:', error);
      toast.error('審核失敗');
    } finally {
      setLoading(false);
    }
  };

  const canReview = task.status === 'submitted';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StatusIcon className="h-5 w-5" />
            任務審核
          </DialogTitle>
          <DialogDescription>
            審核任務「{task.name}」的提交內容
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 任務基本資訊 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">專案：</span>
              <span className="text-sm text-muted-foreground">{task.projectName}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">狀態：</span>
              <Badge className={statusInfo.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusInfo.text}
              </Badge>
            </div>

            {task.submittedAt && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">提交時間：</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(task.submittedAt).toLocaleString('zh-TW')}
                </span>
              </div>
            )}
          </div>

          {/* 進度資訊 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>任務進度</Label>
              <span className="text-sm text-muted-foreground">
                {task.completed} / {task.total} ({progress}%)
              </span>
            </div>
            <Progress value={progress} className="w-full" />
            
            {isComplete && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircleIcon className="h-4 w-4" />
                <span>任務已完成</span>
              </div>
            )}
          </div>

          {/* 審核意見 */}
          {canReview && (
            <div className="space-y-2">
              <Label htmlFor="comment">審核意見</Label>
              <Textarea
                id="comment"
                placeholder="請輸入審核意見（駁回時必填）"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {canReview ? '取消' : '關閉'}
          </Button>
          
          {canReview && (
            <>
              <Button 
                variant="destructive" 
                onClick={() => handleReview(false)}
                disabled={loading || !comment.trim()}
              >
                {loading ? '處理中...' : '駁回'}
              </Button>
              <Button onClick={() => handleReview(true)} disabled={loading}>
                {loading ? '處理中...' : '核准'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 