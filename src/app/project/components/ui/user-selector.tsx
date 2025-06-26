'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CheckIcon, UsersIcon, XIcon } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { permissionService } from '@/app/(system)';
import type { UserProfile } from '@/app/(system)';

export interface User {
  uid: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
}

interface UserSelectorProps {
  value?: string[];
  onValueChange?: (value: string[]) => void;
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
  maxItems?: number;
  className?: string;
}

export function UserSelector({
  value = [],
  onValueChange,
  placeholder = '選擇用戶',
  emptyText = '找不到用戶',
  disabled = false,
  maxItems,
  className,
}: UserSelectorProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // 獲取用戶列表
  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const userProfiles = await permissionService.getAllUsers();
        
        const formattedUsers: User[] = userProfiles.map((profile: UserProfile) => ({
          uid: profile.uid,
          displayName: profile.displayName,
          email: profile.email,
          photoURL: profile.photoURL,
        }));
        
        setUsers(formattedUsers);
      } catch (error) {
        console.error('載入用戶列表失敗:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  // 處理用戶選擇
  const handleSelectUser = (userUid: string) => {
    const newValue = value.includes(userUid)
      ? value.filter(id => id !== userUid)
      : (maxItems && value.length >= maxItems)
      ? value
      : [...value, userUid];
    
    onValueChange?.(newValue);
  };

  // 移除用戶
  const handleRemoveUser = (userUid: string) => {
    const newValue = value.filter(id => id !== userUid);
    onValueChange?.(newValue);
  };

  // 獲取用戶顯示名稱
  const getUserDisplayName = (uid: string) => {
    const user = users.find(u => u.uid === uid);
    return user?.displayName || user?.email || uid;
  };

  // 用戶列表組件
  const UserList = ({
    setOpen,
  }: {
    setOpen: (open: boolean) => void;
  }) => (
    <Command>
      <CommandInput placeholder="搜索用戶..." />
      <CommandList>
        <CommandEmpty>
          {loading ? '載入中...' : emptyText}
        </CommandEmpty>
        <CommandGroup>
          {users.map((user) => (
            <CommandItem
              key={user.uid}
              value={user.uid}
              onSelect={() => {
                handleSelectUser(user.uid);
                if (!isMobile) {
                  setOpen(false);
                }
              }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || '用戶頭像'}
                    className="h-6 w-6 rounded-full"
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                    <UsersIcon className="h-3 w-3" />
                  </div>
                )}
                <div>
                  <div className="font-medium">{user.displayName || user.email}</div>
                  {user.displayName && user.email && (
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  )}
                </div>
              </div>
              {value.includes(user.uid) && (
                <CheckIcon className="h-4 w-4 text-primary" />
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );

  // 選中的用戶顯示
  const selectedUsersBadges = value.map((uid) => (
    <Badge 
      key={uid} 
      variant="secondary" 
      className="flex items-center gap-1 max-w-[200px]"
    >
      <span className="truncate">{getUserDisplayName(uid)}</span>
      {!disabled && (
        <XIcon 
          className="h-3 w-3 cursor-pointer hover:text-destructive" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleRemoveUser(uid);
          }}
        />
      )}
    </Badge>
  ));

  if (isMobile) {
    return (
      <div className={className}>
        {/* 已選中的用戶 */}
        {value.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedUsersBadges}
          </div>
        )}
        
        {/* 移動端抽屜 */}
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              disabled={disabled || Boolean(maxItems && value.length >= maxItems)}
            >
              <UsersIcon className="h-4 w-4 mr-2" />
              {value.length > 0 ? `已選擇 ${value.length} 位用戶` : placeholder}
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <div className="mt-4 border-t">
              <UserList setOpen={setOpen} />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* 已選中的用戶 */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedUsersBadges}
        </div>
      )}
      
      {/* 桌面端彈出框 */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-start" 
            disabled={disabled || Boolean(maxItems && value.length >= maxItems)}
          >
            <UsersIcon className="h-4 w-4 mr-2" />
            {value.length > 0 ? `已選擇 ${value.length} 位用戶` : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <UserList setOpen={setOpen} />
        </PopoverContent>
      </Popover>
    </div>
  );
} 