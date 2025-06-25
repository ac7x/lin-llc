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
import { Badge } from '@/components/ui/badge';
import { UserPlusIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';

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
  const [submitterInput, setSubmitterInput] = useState('');
  const [reviewerInput, setReviewerInput] = useState('');
  const [submitters, setSubmitters] = useState<string[]>(currentSubmitters);
  const [reviewers, setReviewers] = useState<string[]>(currentReviewers);
  const [loading, setLoading] = useState(false);

  const handleAddSubmitter = () => {
    const uid = submitterInput.trim();
    if (uid && !submitters.includes(uid)) {
      setSubmitters([...submitters, uid]);
      setSubmitterInput('');
    }
  };

  const handleAddReviewer = () => {
    const uid = reviewerInput.trim();
    if (uid && !reviewers.includes(uid)) {
      setReviewers([...reviewers, uid]);
      setReviewerInput('');
    }
  };

  const handleRemoveSubmitter = (uid: string) => {
    setSubmitters(submitters.filter(s => s !== uid));
  };

  const handleRemoveReviewer = (uid: string) => {
    setReviewers(reviewers.filter(r => r !== uid));
  };

  const handleAssign = async () => {
    if (submitters.length === 0) {
      toast.error('請至少指派一位提交者');
      return;
    }
    
    if (reviewers.length === 0) {
      toast.error('請至少指派一位審核者');
      return;
    }

    setLoading(true);
    try {
      const success = await onAssign(submitters, reviewers);
      if (success) {
        toast.success('任務指派成功');
        onClose();
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
            為任務「{taskName}」指派提交者和審核者
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 提交者設定 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">提交者 (Submitters)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="輸入用戶 UID"
                value={submitterInput}
                onChange={(e) => setSubmitterInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubmitter();
                  }
                }}
                className="flex-1"
              />
              <Button 
                size="sm" 
                onClick={handleAddSubmitter}
                disabled={!submitterInput.trim()}
              >
                新增
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {submitters.map((uid) => (
                <Badge key={uid} variant="secondary" className="flex items-center gap-1">
                  <span className="max-w-[120px] truncate">{uid}</span>
                  <XIcon 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={() => handleRemoveSubmitter(uid)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* 審核者設定 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">審核者 (Reviewers)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="輸入用戶 UID"
                value={reviewerInput}
                onChange={(e) => setReviewerInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddReviewer();
                  }
                }}
                className="flex-1"
              />
              <Button 
                size="sm" 
                onClick={handleAddReviewer}
                disabled={!reviewerInput.trim()}
              >
                新增
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {reviewers.map((uid) => (
                <Badge key={uid} variant="outline" className="flex items-center gap-1">
                  <span className="max-w-[120px] truncate">{uid}</span>
                  <XIcon 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={() => handleRemoveReviewer(uid)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
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