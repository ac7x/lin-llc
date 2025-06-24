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
import { useGoogleAuth } from '@/hooks/use-google-auth';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';
import type { UserProfile, Role } from '@/app/settings/types';

interface BottomNavigationItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: string;
}

const navigationItems: BottomNavigationItem[] = [
  {
    href: '/',
    label: '首頁',
    icon: Home,
    permission: 'navigation:home',
  },
  {
    href: '/dashboard',
    label: '儀表板',
    icon: BarChart3,
    permission: 'dashboard:read',
  },
  {
    href: '/project',
    label: '專案',
    icon: FolderOpen,
    permission: 'navigation:project',
  },
  {
    href: '/user/account/task',
    label: '任務',
    icon: CheckSquare,
    permission: 'navigation:task',
  },
  {
    href: '/user/account/notifications',
    label: '通知',
    icon: Bell,
    permission: 'notification:read',
  },
  {
    href: '/user/account',
    label: '帳戶',
    icon: User,
    permission: 'navigation:account',
  },
  {
    href: '/settings',
    label: '設定',
    icon: Settings,
    permission: 'navigation:settings',
  },
];

interface BottomNavigationProps {
  className?: string;
}

export function BottomNavigation({ className }: BottomNavigationProps) {
  const pathname = usePathname();
  const { user } = useGoogleAuth();
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  // 載入用戶資料和角色
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadUserData = async () => {
      try {
        // 載入用戶資料
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const profile = userSnap.data() as UserProfile;
          
          // 載入角色資料
          const roleRef = doc(db, 'roles', profile.roleId);
          const roleSnap = await getDoc(roleRef);
          
          if (roleSnap.exists()) {
            const role = roleSnap.data() as Role;
            setUserRole(role);
          }
        }
      } catch (error) {
        console.error('載入用戶資料失敗:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadUserData();
  }, [user]);

  // 檢查是否有權限
  const hasPermission = (permissionId: string): boolean => {
    if (!userRole) return false;
    return userRole.permissions.includes(permissionId);
  };

  // 過濾有權限的導航項目
  const authorizedItems = navigationItems.filter(item => hasPermission(item.permission));

  if (loading) {
    return null; // 載入時不顯示導航
  }

  // 如果沒有任何權限，不顯示導航
  if (authorizedItems.length === 0) {
    return null;
  }

  return (
    <nav className={cn(
      'fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border',
      'flex items-center justify-around px-2 py-2',
      'safe-area-inset-bottom',
      className
    )}>
      {authorizedItems.map((item) => {
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