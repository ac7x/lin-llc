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
  User
} from 'lucide-react';

interface BottomNavigationItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigationItems: BottomNavigationItem[] = [
  {
    href: '/',
    label: '首頁',
    icon: Home,
  },
  {
    href: '/project',
    label: '專案',
    icon: FolderOpen,
  },
  {
    href: '/user/account/task',
    label: '任務',
    icon: CheckSquare,
  },
  {
    href: '/user/account',
    label: '帳戶',
    icon: User,
  },
  {
    href: '/settings',
    label: '設定',
    icon: Settings,
  },
];

interface BottomNavigationProps {
  className?: string;
}

export function BottomNavigation({ className }: BottomNavigationProps) {
  const pathname = usePathname();

  return (
    <nav className={cn(
      'fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border',
      'flex items-center justify-around px-2 py-2',
      'safe-area-inset-bottom',
      className
    )}>
      {navigationItems.map((item) => {
        const isActive = pathname === item.href || 
          (item.href !== '/' && pathname.startsWith(item.href));
        
        return (
          <Link key={item.href} href={item.href}>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'flex flex-col items-center gap-1 h-auto py-2 px-3',
                'min-w-0 flex-1',
                isActive 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Button>
          </Link>
        );
      })}
    </nav>
  );
} 