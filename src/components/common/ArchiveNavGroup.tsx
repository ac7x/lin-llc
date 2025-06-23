'use client';

import { Archive, FolderArchive } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';

export function ArchiveNavGroup() {
  const pathname = usePathname();
  const navs = [
    { label: '封存總覽', href: '/finance/archive', icon: <FolderArchive className="w-4 h-4 mr-3" /> },
    { label: '封存訂單', href: '/finance/archive/orders', icon: <Archive className="w-4 h-4 mr-3 ml-4" /> },
    { label: '封存估價單', href: '/finance/archive/quotes', icon: <Archive className="w-4 h-4 mr-3 ml-4" /> },
    { label: '封存合約', href: '/finance/archive/contracts', icon: <Archive className="w-4 h-4 mr-3 ml-4" /> },
    { label: '封存專案', href: '/finance/archive/projects', icon: <Archive className="w-4 h-4 mr-3 ml-4" /> },
  ];

  return (
    <SidebarGroup>
      <SidebarGroupLabel>封存管理</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {navs.map(nav => (
            <SidebarMenuItem key={nav.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === nav.href}
                className="data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
              >
                <Link href={nav.href}>
                  {nav.icon}
                  {nav.label}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
} 