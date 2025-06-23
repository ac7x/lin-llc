'use client';

import { collection, doc, getDoc, onSnapshot, query, setDoc, Timestamp, where } from 'firebase/firestore';
import { ChevronRight, File, Folder } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useEffect, useState } from 'react';
import type { ReactElement } from 'react';

import type { Project, Workpackage } from '@/app/projects/types/project';
import { ProjectProgressPercent } from '@/app/projects/utils/progressUtils';
import { ModeToggle } from '@/components/common/ModeToggle';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarProvider,
  SidebarRail,
} from '@/components/ui/sidebar';
import { navigationItems } from '@/constants/navigation';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase-client';
import type { NavigationItem } from '@/types/navigation';
import { modalStyles, inputStyles, buttonStyles } from '@/utils/classNameUtils';
import { safeAsync, retry, getErrorMessage, logError } from '@/utils/errorUtils';

// 專案樹狀結構數據
const projectTreeData = [
  {
    name: '專案管理',
    items: [
      {
        name: '進行中專案',
        items: [
          { name: '專案 A', path: '/projects/project-a' },
          { name: '專案 B', path: '/projects/project-b' },
        ],
      },
      {
        name: '已完成專案',
        items: [
          { name: '專案 C', path: '/projects/project-c' },
          { name: '專案 D', path: '/projects/project-d' },
        ],
      },
    ],
  },
  {
    name: '工作包',
    items: [
      { name: '設計階段', path: '/workpackages/design' },
      { name: '施工階段', path: '/workpackages/construction' },
      { name: '驗收階段', path: '/workpackages/acceptance' },
    ],
  },
];

// 專案導航組件
function ProjectNavigation({ pathname }: { pathname: string }) {
  const { user } = useAuth();
  const [projectsSnapshot, setProjectsSnapshot] = useState<import('firebase/firestore').QuerySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
  const [wpOpenMap, setWpOpenMap] = useState<Record<string, boolean>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [newWorkpackage, setNewWorkpackage] = useState({
    name: '',
    description: '',
    category: '',
    budget: '',
  });

  useEffect(() => {
    if (!user?.uid) {
      return;
    }

    const fetchProjects = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let q;
        
        if (user.currentRole && !['manager', 'admin', 'owner'].includes(user.currentRole)) {
          q = query(
            collection(db, 'projects'),
            where('owner', '==', user.uid)
          );
        } else {
          q = query(collection(db, 'projects'));
        }

        const unsubscribe = onSnapshot(
          q,
          snapshot => {
            setProjectsSnapshot(snapshot);
            setLoading(false);
          },
          async (firebaseError) => {
            logError(firebaseError, { operation: 'fetch_projects', userId: user?.uid });
            setLoading(false);
            setError('無法載入專案資料，請檢查網路連線或稍後再試。');
          }
        );

        return () => unsubscribe();
      } catch (error) {
        logError(error, { operation: 'setup_project_query', userId: user?.uid });
        setLoading(false);
        setError('無法設定專案查詢，請重新整理頁面。');
      }
    };

    fetchProjects();
  }, [user?.uid, user?.currentRole]);

  const toggleOpen = (projectId: string) => {
    setOpenMap(prev => ({ ...prev, [projectId]: !prev[projectId] }));
  };

  const toggleWpOpen = (workpackageId: string) => {
    setWpOpenMap(prev => ({ ...prev, [workpackageId]: !prev[workpackageId] }));
  };

  const handleAddWorkpackage = async () => {
    if (!selectedProjectId || !newWorkpackage.name.trim()) return;

    await safeAsync(async () => {
      const workpackageData: Workpackage = {
        id: crypto.randomUUID(),
        name: newWorkpackage.name,
        description: newWorkpackage.description,
        category: newWorkpackage.category,
        budget: newWorkpackage.budget ? parseFloat(newWorkpackage.budget) : undefined,
        subWorkpackages: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const projectRef = doc(db, 'projects', selectedProjectId);
      const projectDoc = await retry(() => getDoc(projectRef), 3, 1000);
      
      if (!projectDoc.exists()) {
        throw new Error('專案不存在');
      }

      const projectData = projectDoc.data() as Project;
      const updatedWorkpackages = [...(projectData.workpackages || []), workpackageData];

      await retry(() => setDoc(projectRef, {
        ...projectData,
        workpackages: updatedWorkpackages,
        updatedAt: Timestamp.now(),
      }, { merge: true }), 3, 1000);

      setNewWorkpackage({ name: '', description: '', category: '', budget: '' });
      setShowCreateModal(false);
      setSelectedProjectId('');
    }, (error) => {
      alert(`建立工作包失敗: ${getErrorMessage(error)}`);
      logError(error, { operation: 'create_workpackage', projectId: selectedProjectId });
    });
  };

  const navs = [
    { href: '/projects', label: '專案列表', icon: '📋' },
    { href: '/projects/import', label: '匯入專案', icon: '📥' },
    { href: '/projects/templates', label: '範本管理', icon: '📄' },
  ];

  const projects =
    (projectsSnapshot?.docs.map((docSnapshot: import('firebase/firestore').QueryDocumentSnapshot) => ({
      id: docSnapshot.id,
      ...docSnapshot.data(),
    })) as (Project & { id: string })[]) || [];

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>專案管理</SidebarGroupLabel>
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
                    <span className="mr-3">{nav.icon}</span>
                    {nav.label}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>專案列表</SidebarGroupLabel>
        <SidebarGroupContent>
          {loading ? (
            <div className='flex items-center justify-center py-8'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
            </div>
          ) : error ? (
            <div className='flex flex-col items-center justify-center py-8 text-center'>
              <div className='text-red-400 text-6xl mb-4'>⚠️</div>
              <p className='text-red-600 dark:text-red-400 text-sm mb-2'>載入專案時發生錯誤</p>
              <p className='text-gray-500 dark:text-gray-400 text-xs mb-4'>{error}</p>
              <button
                onClick={() => window.location.reload()}
                className='mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm'
              >
                重新整理
              </button>
            </div>
          ) : projects.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-8 text-center'>
              <div className='text-gray-400 text-6xl mb-4'>📋</div>
              <p className='text-gray-500 dark:text-gray-400 text-sm mb-2'>目前沒有專案</p>
              <p className='text-gray-400 dark:text-gray-500 text-xs'>請先建立專案或從合約匯入</p>
            </div>
          ) : (
            <SidebarMenu>
              {projects.map(project => (
                <SidebarMenuItem key={project.id}>
                  <Collapsible open={openMap[project.id]} onOpenChange={() => toggleOpen(project.id)}>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="group/collapsible [&[data-state=open]>svg:first-child]:rotate-90">
                        <ChevronRight className="w-4 h-4 transition-transform" />
                        <Folder className="w-4 h-4" />
                        <span className="truncate">
                          {project.projectName || project.projectId || project.id}
                        </span>
                        <ProjectProgressPercent project={project} />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {project.workpackages?.map(wp => {
                          const hasSubWps = wp.subWorkpackages && wp.subWorkpackages.length > 0;
                          return (
                            <SidebarMenuItem key={wp.id}>
                              {hasSubWps ? (
                                <Collapsible
                                  open={wpOpenMap[wp.id]}
                                  onOpenChange={() => toggleWpOpen(wp.id)}
                                >
                                  <CollapsibleTrigger asChild>
                                    <SidebarMenuButton className="group/collapsible [&[data-state=open]>svg:first-child]:rotate-90">
                                      <ChevronRight className="w-4 h-4 transition-transform" />
                                      <Folder className="w-4 h-4" />
                                      <span className="truncate">{wp.name}</span>
                                      <span className="text-xs text-gray-500 flex-shrink-0">
                                        {`(${wp.subWorkpackages.length})`}
                                      </span>
                                    </SidebarMenuButton>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
                                    <SidebarMenuSub>
                                      <SidebarMenuItem>
                                        <SidebarMenuButton
                                          asChild
                                          isActive={
                                            pathname ===
                                            `/projects/${project.id}/workpackages/${wp.id}`
                                          }
                                          className="data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                                        >
                                          <Link
                                            href={`/projects/${project.id}/workpackages/${wp.id}`}
                                          >
                                            <span className="pl-6 truncate">工作包概覽</span>
                                          </Link>
                                        </SidebarMenuButton>
                                      </SidebarMenuItem>
                                      {wp.subWorkpackages.map(subWp => (
                                        <SidebarMenuItem key={subWp.id}>
                                          <SidebarMenuButton
                                            asChild
                                            isActive={pathname.includes(
                                              `/subworkpackages/${subWp.id}`
                                            )}
                                            className="data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                                          >
                                            <Link
                                              href={`/projects/${project.id}/subworkpackages/${subWp.id}`}
                                            >
                                              <File className="w-4 h-4 ml-6" />
                                              <span className="truncate">{subWp.name}</span>
                                            </Link>
                                          </SidebarMenuButton>
                                        </SidebarMenuItem>
                                      ))}
                                    </SidebarMenuSub>
                                  </CollapsibleContent>
                                </Collapsible>
                              ) : (
                                <SidebarMenuButton
                                  asChild
                                  isActive={pathname.includes(`/workpackages/${wp.id}`)}
                                  className="data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                                >
                                  <Link href={`/projects/${project.id}/workpackages/${wp.id}`}>
                                    <File className="w-4 h-4" />
                                    <span className="truncate">{wp.name}</span>
                                  </Link>
                                </SidebarMenuButton>
                              )}
                            </SidebarMenuItem>
                          );
                        })}
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            onClick={() => {
                              setSelectedProjectId(project.id);
                              setShowCreateModal(true);
                            }}
                          >
                            <span className="mr-2">+</span> 新增工作包
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          )}
        </SidebarGroupContent>
      </SidebarGroup>

      {showCreateModal && projectsSnapshot && (
        <div className={modalStyles.overlay}>
          <div className={modalStyles.container}>
            <h2 className={modalStyles.title}>
              建立工作包
            </h2>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleAddWorkpackage();
              }}
              className='space-y-4'
            >
              <div>
                <label className='block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300'>
                  工作包名稱
                </label>
                <input
                  type='text'
                  className={inputStyles.base}
                  value={newWorkpackage.name}
                  onChange={e => setNewWorkpackage(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300'>
                  描述
                </label>
                <textarea
                  className={inputStyles.base}
                  value={newWorkpackage.description}
                  onChange={e =>
                    setNewWorkpackage(prev => ({ ...prev, description: e.target.value }))
                  }
                  rows={3}
                />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300'>
                    類別
                  </label>
                  <input
                    type='text'
                    className={inputStyles.base}
                    value={newWorkpackage.category}
                    onChange={e =>
                      setNewWorkpackage(prev => ({ ...prev, category: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300'>
                    預算
                  </label>
                  <input
                    type='number'
                    className={inputStyles.base}
                    value={newWorkpackage.budget}
                    onChange={e =>
                      setNewWorkpackage(prev => ({ ...prev, budget: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className='flex justify-end gap-3 pt-4'>
                <button
                  type='button'
                  className={buttonStyles.outline}
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewWorkpackage({ name: '', description: '', category: '', budget: '' });
                  }}
                >
                  取消
                </button>
                <button
                  type='submit'
                  className={buttonStyles.primary}
                  disabled={!newWorkpackage.name.trim()}
                >
                  建立
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// 樹狀組件
function TreeItem({ item, pathname }: { item: any; pathname: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.items && item.items.length > 0;

  if (!hasChildren) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={pathname === item.path}
          className="data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
        >
          <Link href={item.path}>
            <File className="w-4 h-4" />
            {item.name}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton className="group/collapsible [&[data-state=open]>svg:first-child]:rotate-90">
            <ChevronRight className="w-4 h-4 transition-transform" />
            <Folder className="w-4 h-4" />
            {item.name}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.items.map((subItem: any, index: number) => (
              <TreeItem key={index} item={subItem} pathname={pathname} />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}

// 主要導航組件
function MainNavigation({ pathname, filteredNavigationItems }: { 
  pathname: string; 
  filteredNavigationItems: NavigationItem[] 
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>主要功能</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {filteredNavigationItems.map((item: NavigationItem) => {
            const isActive = pathname.startsWith(item.path);
            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  className="data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                >
                  <Link href={item.path}>
                    <span className="flex-shrink-0">{item.icon}</span>
                    {item.name}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

// 專案樹狀導航組件
function ProjectTreeNavigation({ pathname }: { pathname: string }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>專案結構</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {projectTreeData.map((item, index) => (
            <TreeItem key={index} item={item} pathname={pathname} />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export default function BottomNavigation(): ReactElement | null {
  const pathname = usePathname();
  const { user, hasPermission } = useAuth();
  const activeItemRef = useRef<HTMLLIElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  const filteredNavigationItems = navigationItems.filter((item: NavigationItem) =>
    hasPermission(item.id)
  );

  // 檢查是否在專案頁面
  const isProjectPage = pathname.startsWith('/projects');

  // 檢測設備類型
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [pathname, filteredNavigationItems]);

  if (!user || filteredNavigationItems.length === 0) {
    return null;
  }

  // 移動設備版本 - 底部導航
  if (isMobile) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border z-50">
        <div className="flex justify-center overflow-x-auto scrollbar-hide h-full items-center">
          <ul className="flex h-full">
            {filteredNavigationItems.map((item: NavigationItem) => {
              const isActive = pathname.startsWith(item.path);
              return (
                <li key={item.id} ref={isActive ? activeItemRef : null} className="flex-shrink-0">
                  <Link
                    href={item.path}
                    className={`flex flex-col items-center justify-center w-20 h-full rounded-none transition-all duration-200 ${
                      isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span className="text-xs mt-1 font-medium">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        {/* 移動端主題切換按鈕 */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
          <ModeToggle />
        </div>
      </nav>
    );
  }

  // 桌面版本 - 側邊導航
  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar className="fixed left-0 top-0 h-full w-64 bg-background border-r border-border z-40" collapsible="icon">
        <SidebarHeader className="border-b border-border p-4">
          <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center transition-all duration-200">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent transition-all duration-200 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:hidden">
              LIN LLC
            </h1>
            <div className="flex items-center gap-2 group-data-[collapsible=icon]:gap-0 transition-all duration-200">
              <ModeToggle />
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          {/* 主要導航 */}
          <MainNavigation 
            pathname={pathname} 
            filteredNavigationItems={filteredNavigationItems} 
          />
          
          {/* 根據當前頁面顯示相應的詳細導航 */}
          {isProjectPage && <ProjectNavigation pathname={pathname} />}
          {!isProjectPage && <ProjectTreeNavigation pathname={pathname} />}
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
    </SidebarProvider>
  );
}
