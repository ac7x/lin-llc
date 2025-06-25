'use client';
import { useState } from 'react';
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

interface TaskSubmissionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  taskName: string;
  currentCompleted: number;
  currentTotal: number;
  onSubmit: (completed: number, total: number) => Promise<boolean>;
}

export function TaskSubmissionDialog({
  isOpen,
  onClose,
  taskName,
  currentCompleted,
  currentTotal,
  onSubmit,
}: TaskSubmissionDialogProps) {
  const [completed, setCompleted] = useState(currentCompleted);
  const [total, setTotal] = useState(currentTotal);
  const [loading, setLoading] = useState(false);

  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isComplete = progress === 100;

  const handleSubmit = async () => {
    if (completed < 0 || total < 0) {
      toast.error('數量不能為負數');
      return;
    }

    if (completed > total) {
      toast.error('完成數量不能超過總數量');
      return;
    }

    setLoading(true);
    try {
      const success = await onSubmit(completed, total);
      if (success) {
        toast.success('進度提交成功');
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5" />
            更新任務進度
          </DialogTitle>
          <DialogDescription>
            更新任務「{taskName}」的完成進度
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