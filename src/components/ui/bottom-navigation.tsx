'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  FolderOpen, 
  CheckSquare, 
  Settings, 
  Home,
  User,
  BarChart3,
  Bell
} from 'lucide-react';
import { useAuth, usePermissionContext } from '@/app/(system)';

interface BottomNavigationItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: string;
  exact?: boolean;
}

const navigationItems: BottomNavigationItem[] = [
  {
    href: '/',
    label: '首頁',
    icon: Home,
    permission: 'navigation:home',
    exact: true,
  },
  {
    href: '/dashboard',
    label: '儀表板',
    icon: BarChart3,
    permission: 'dashboard:read',
    exact: true,
  },
  {
    href: '/project',
    label: '專案',
    icon: FolderOpen,
    permission: 'navigation:project',
    exact: false,
  },
  {
    href: '/account/task',
    label: '任務',
    icon: CheckSquare,
    permission: 'navigation:task',
    exact: true,
  },
  {
    href: '/notifications',
    label: '通知',
    icon: Bell,
    permission: 'notification:read',
    exact: true,
  },
  {
    href: '/account',
    label: '帳戶',
    icon: User,
    permission: 'navigation:account',
    exact: true,
  },
  {
    href: '/settings',
    label: '設定',
    icon: Settings,
    permission: 'navigation:settings',
    exact: true,
  },
];

interface BottomNavigationProps {
  className?: string;
}

export function BottomNavigation({ className }: BottomNavigationProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { hasPermission, loading } = usePermissionContext();

  // 過濾有權限的導航項目
  const authorizedItems = navigationItems.filter(item => hasPermission(item.permission));

  if (loading) {
    return null; // 載入時不顯示導航
  }

  // 如果沒有登入用戶或沒有任何權限，不顯示導航
  if (!user || authorizedItems.length === 0) {
    return null;
  }

  return (
    <nav className={cn(
      'fixed bottom-0 left-0 right-0 z-50',
      'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
      'border-t border-border/50 shadow-lg',
      'flex items-center justify-around px-2 py-3',
      'h-20 pb-safe-area-inset-bottom',
      'transition-all duration-200',
      className
    )}>
      {authorizedItems.map((item) => {
        const isActive = item.exact !== false
          ? pathname === item.href
          : (pathname === item.href || pathname.startsWith(`${item.href  }/`));
        
        return (
          <Link key={item.href} href={item.href} className="flex-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'flex flex-col items-center gap-1 h-auto py-2 px-3',
                'min-w-0 w-full rounded-lg',
                'transition-all duration-200',
                isActive 
                  ? 'text-primary bg-primary/10 border border-primary/20' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 transition-transform duration-200",
                isActive && "scale-110"
              )} />
              <span className={cn(
                "text-xs font-medium transition-all duration-200",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
            </Button>
          </Link>
        );
      })}
    </nav>
  );
} 