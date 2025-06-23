'use client';

import { collection } from 'firebase/firestore';
import { List, FileText, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCollection } from 'react-firebase-hooks/firestore';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { db } from '@/lib/firebase-client';

interface DynamicNavGroupProps {
  groupLabel: string;
  collectionName: string;
  basePath: string;
  labelField: string;
  createLabel: string;
  createPathSuffix?: string;
}

export function DynamicNavGroup({
  groupLabel,
  collectionName,
  basePath,
  labelField,
  createLabel,
  createPathSuffix = 'add',
}: DynamicNavGroupProps) {
  const pathname = usePathname();
  const [snapshot, loading] = useCollection(
    collection(db, 'finance', 'default', collectionName)
  );

  const items =
    snapshot?.docs.map(doc => ({
      id: doc.id,
      label: doc.data()[labelField] || `${groupLabel.slice(0, 2)} ${doc.id}`,
      href: `${basePath}/${doc.id}`,
    })) || [];

  const createHref = `${basePath}/${createPathSuffix}`;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{groupLabel}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === basePath}
              className="data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
            >
              <Link href={basePath}>
                <List className="w-4 h-4 mr-3" />
                {groupLabel.replace('管理','')}列表
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {loading ? (
            <div className='flex items-center justify-center py-2'>
              <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-primary'></div>
            </div>
          ) : (
            items.map(item => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  className="data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                >
                  <Link href={item.href}>
                    <FileText className="w-4 h-4 mr-3 ml-4" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))
          )}

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === createHref}
              className="data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
            >
              <Link href={createHref}>
                <PlusCircle className="w-4 h-4 mr-3 ml-4" />
                {createLabel}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
} 