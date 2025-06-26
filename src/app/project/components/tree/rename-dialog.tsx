'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RenameDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  itemType: 'project' | 'package' | 'subpackage' | 'task';
  onRename: (newName: string) => void;
}

/**
 * 重新命名對話框組件
 * 用於重新命名專案、工作包、子工作包或任務
 */
export function RenameDialog({
  isOpen,
  onClose,
  currentName,
  itemType,
  onRename,
}: RenameDialogProps) {
  const [newName, setNewName] = useState('');

  // 當對話框打開時，設置當前名稱
  useEffect(() => {
    if (isOpen) {
      setNewName(currentName);
    }
  }, [isOpen, currentName]);

  const handleConfirm = () => {
    if (newName.trim() && newName.trim() !== currentName) {
      onRename(newName.trim());
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const getItemTypeText = () => {
    switch (itemType) {
      case 'project':
        return '專案';
      case 'package':
        return '工作包';
      case 'subpackage':
        return '子工作包';
      case 'task':
        return '任務';
      default:
        return '項目';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>重新命名{getItemTypeText()}</DialogTitle>
          <DialogDescription>
            為{getItemTypeText()}「{currentName}」輸入新名稱
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="rename-input">新名稱</Label>
            <Input
              id="rename-input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="mt-1"
              autoFocus
              placeholder={`請輸入${getItemTypeText()}名稱`}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!newName.trim() || newName.trim() === currentName}
          >
            確認
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 