'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Lock, Eye, FileX, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PermissionAlertProps {
  type?: 'access' | 'view' | 'edit' | 'delete' | 'settings';
  title?: string;
  message?: string;
  className?: string;
}

const alertConfig = {
  access: {
    icon: Lock,
    title: '權限不足',
    message: '您沒有權限執行此操作',
  },
  view: {
    icon: Eye,
    title: '查看權限不足',
    message: '您沒有權限查看此內容',
  },
  edit: {
    icon: FileX,
    title: '編輯權限不足',
    message: '您沒有權限編輯此內容',
  },
  delete: {
    icon: AlertTriangle,
    title: '刪除權限不足',
    message: '您沒有權限刪除此內容',
  },
  settings: {
    icon: Settings,
    title: '設定權限不足',
    message: '您沒有權限修改設定',
  },
};

export function PermissionAlert({ 
  type = 'access', 
  title, 
  message, 
  className 
}: PermissionAlertProps) {
  const config = alertConfig[type];
  const Icon = config.icon;

  return (
    <Alert variant="destructive" className={cn('max-w-md', className)}>
      <Icon className="h-4 w-4" />
      <AlertTitle>{title || config.title}</AlertTitle>
      <AlertDescription>
        {message || config.message}
      </AlertDescription>
    </Alert>
  );
}

// 預設權限訊息組件
export function AccessDeniedAlert({ className }: { className?: string }) {
  return (
    <PermissionAlert 
      type="access"
      className={className}
    />
  );
}

export function ProjectListPermissionAlert({ className }: { className?: string }) {
  return (
    <PermissionAlert 
      type="view"
      title="專案查看權限不足"
      message="您沒有權限查看專案列表"
      className={className}
    />
  );
}

export function ProjectEditPermissionAlert({ className }: { className?: string }) {
  return (
    <PermissionAlert 
      type="edit"
      title="專案編輯權限不足"
      message="您沒有權限編輯此專案"
      className={className}
    />
  );
}

export function SettingsPermissionAlert({ className }: { className?: string }) {
  return (
    <PermissionAlert 
      type="settings"
      title="系統設定權限不足"
      message="您沒有權限存取系統設定"
      className={className}
    />
  );
} 