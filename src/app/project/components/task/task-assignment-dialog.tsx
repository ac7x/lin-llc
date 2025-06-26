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
import { Label } from '@/components/ui/label';
import { UserPlusIcon } from 'lucide-react';
import { toast } from 'sonner';
import { UserSelector } from '../ui/user-selector';

interface TaskAssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  taskName: string;
  projectName: string;
  currentSubmitters: string[];
  currentReviewers: string[];
  onAssign: (submitters: string[], reviewers: string[]) => Promise<boolean>;
}

export function TaskAssignmentDialog({
  isOpen,
  onClose,
  taskName,
  projectName,
  currentSubmitters,
  currentReviewers,
  onAssign,
}: TaskAssignmentDialogProps) {
  const [submitters, setSubmitters] = useState<string[]>(currentSubmitters);
  const [reviewers, setReviewers] = useState<string[]>(currentReviewers);
  const [loading, setLoading] = useState(false);

  // 重置表單數據
  const resetForm = () => {
    setSubmitters(currentSubmitters);
    setReviewers(currentReviewers);
  };

  const handleAssign = async () => {
    // 檢查是否至少指派了提交者或審核者中的一個
    if (submitters.length === 0 && reviewers.length === 0) {
      toast.error('請至少指派一位提交者或審核者');
      return;
    }

    setLoading(true);
    try {
      const success = await onAssign(submitters, reviewers);
      if (success) {
        if (submitters.length > 0 && reviewers.length === 0) {
          toast.success('已指派提交者，可稍後再指派審核者');
        } else if (submitters.length === 0 && reviewers.length > 0) {
          toast.success('已指派審核者，請確保已有提交者完成任務');
        } else {
          toast.success('任務指派成功');
        }
        onClose();
        resetForm();
      } else {
        toast.error('任務指派失敗');
      }
    } catch (error) {
      console.error('任務指派錯誤:', error);
      toast.error('任務指派失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlusIcon className="h-5 w-5" />
            任務指派
          </DialogTitle>
          <DialogDescription>
            為任務「{taskName}」指派人員。可以先指派提交者開始工作，稍後再指派審核者。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 提交者設定 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">提交者 (Submitters) <span className="text-xs text-muted-foreground">- 可選</span></Label>
            <UserSelector
              value={submitters}
              onValueChange={setSubmitters}
              placeholder="選擇提交者"
              emptyText="找不到用戶"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              提交者負責執行任務並提交完成結果。可以先指派提交者開始工作。
            </p>
          </div>

          {/* 審核者設定 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">審核者 (Reviewers) <span className="text-xs text-muted-foreground">- 可選</span></Label>
            <UserSelector
              value={reviewers}
              onValueChange={setReviewers}
              placeholder="選擇審核者"
              emptyText="找不到用戶"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              審核者負責檢查和批准任務完成結果。可以在提交者完成工作後再指派。
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { onClose(); resetForm(); }} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleAssign} disabled={loading}>
            {loading ? '指派中...' : '確認指派'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 