'use client';
import { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { CheckCircleIcon, AlertCircleIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useTaskManagement } from '@/app/project/hooks/use-task-management';
import type { Project } from '@/app/project/types';

interface TaskSubmissionDialogProps {
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
  } | null;
  onUpdateTask: (taskId: string, updates: { completed: number; total: number; progress: number; status?: string }) => void;
}

export function TaskSubmissionDialog({
  isOpen,
  onClose,
  task,
  onUpdateTask,
}: TaskSubmissionDialogProps) {
  const { submitTaskProgress } = useTaskManagement();
  const [completed, setCompleted] = useState(task?.completed || 0);
  const [total, setTotal] = useState(task?.total || 0);
  const [loading, setLoading] = useState(false);

  // 當任務改變時更新狀態
  useEffect(() => {
    if (task) {
      setCompleted(task.completed);
      setTotal(task.total);
    }
  }, [task]);

  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isComplete = progress === 100;

  const handleSubmit = async () => {
    if (!task) return;

    if (completed < 0 || total < 0) {
      toast.error('數量不能為負數');
      return;
    }

    if (completed > total) {
      toast.error('完成數量不能超過總數量');
      return;
    }

    if (total <= 0) {
      toast.error('總數量必須大於0');
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

      // 使用 submitTaskProgress 函數來正確處理審核流程
      const success = await submitTaskProgress(
        projectData,
        {
          packageIndex: task.packageIndex,
          subpackageIndex: task.subpackageIndex,
          taskIndex: task.taskIndex,
        },
        completed,
        total,
        () => {} // 空的更新回調，因為我們會手動更新本地狀態
      );

      if (success) {
        // 重新獲取更新後的專案數據來取得正確的任務狀態
        const updatedProjectDoc = await getDoc(projectRef);
        if (updatedProjectDoc.exists()) {
          const updatedProjectData = updatedProjectDoc.data() as Project;
          const updatedTask = updatedProjectData.packages[task.packageIndex]
            .subpackages[task.subpackageIndex]
            .taskpackages[task.taskIndex];

          // 更新本地任務狀態
          onUpdateTask(task.id, {
            completed,
            total,
            progress: updatedTask.progress,
            status: updatedTask.status,
          });

          // 根據狀態顯示適當的訊息
          if (updatedTask.status === 'submitted') {
            toast.success('任務已提交審核，等待審核者審核');
          } else if (updatedTask.status === 'approved') {
            toast.success('任務已完成並自動核准');
          } else {
            toast.success('任務進度已更新');
          }
        }

        onClose();
      } else {
        toast.error('進度提交失敗');
      }
      
    } catch (error) {
      console.error('提交進度錯誤:', error);
      toast.error('進度提交失敗');
    } finally {
      setLoading(false);
    }
  };

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5" />
            更新任務進度
          </DialogTitle>
          <DialogDescription>
            更新任務「{task.name}」的完成進度
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 完成數量輸入 */}
          <div className="space-y-2">
            <Label htmlFor="completed">已完成數量</Label>
            <Input
              id="completed"
              type="number"
              min="0"
              value={completed}
              onChange={(e) => setCompleted(Number(e.target.value))}
              placeholder="輸入已完成數量"
            />
          </div>

          {/* 總數量輸入 */}
          <div className="space-y-2">
            <Label htmlFor="total">總數量</Label>
            <Input
              id="total"
              type="number"
              min="1"
              value={total}
              onChange={(e) => setTotal(Number(e.target.value))}
              placeholder="輸入總數量"
            />
          </div>

          {/* 進度顯示 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>進度</Label>
              <span className="text-sm text-muted-foreground">
                {completed} / {total} ({progress}%)
              </span>
            </div>
            <Progress value={progress} className="w-full" />
            
            {isComplete && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircleIcon className="h-4 w-4" />
                <span>任務已完成，將自動提交審核</span>
              </div>
            )}
            
            {completed > total && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircleIcon className="h-4 w-4" />
                <span>完成數量不能超過總數量</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            取消
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || completed > total || total <= 0}
          >
            {loading ? '提交中...' : isComplete ? '提交審核' : '更新進度'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 