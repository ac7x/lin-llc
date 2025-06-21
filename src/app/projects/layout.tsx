/**
 * 專案模組布局
 *
 * 提供專案相關頁面的共用布局，包含：
 * - 專案側邊導航選單
 * - 工作包管理功能
 * - 專案快速操作
 * - 響應式設計
 * - 權限驗證
 */

'use client';

import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { collection, deleteDoc, doc, getDoc, onSnapshot, query, setDoc, Timestamp, where } from 'firebase/firestore';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, type ReactNode } from 'react';

import { PermissionCheck } from '@/components/common/PermissionCheck';
import { PageLayout, PageContent, Sidebar } from '@/components/layout/PageLayout';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase-client';
import type { Project, Workpackage } from '@/types/project';
import { navigationStyles, modalStyles, inputStyles, cn, buttonStyles } from '@/utils/classNameUtils';
import { safeAsync, retry, getErrorMessage, logError } from '@/utils/errorUtils';
import { ProjectProgressPercent, ProgressBar } from '@/utils/progressUtils';
import { calculateWorkpackageProgress } from '@/utils/projectUtils';

function SidebarContent() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [projectsSnapshot, setProjectsSnapshot] = useState<import('firebase/firestore').QuerySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
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
        // 根據用戶權限決定查詢條件，與 useFilteredProjects 保持一致
        let q;
        
        // 如果用戶不是管理員或擁有者，只顯示屬於自己的專案
        if (user.currentRole && !['manager', 'admin', 'owner'].includes(user.currentRole)) {
          q = query(
            collection(db, 'projects'),
            where('owner', '==', user.uid)
          );
        } else {
          // 管理員和擁有者可以看到所有專案
          q = query(collection(db, 'projects'));
        }

        const unsubscribe = onSnapshot(
          q,
          snapshot => {
            setProjectsSnapshot(snapshot);
            setLoading(false);
          },
          async (_firebaseError) => {
            // 如果是索引錯誤或其他錯誤，記錄錯誤但不中斷應用
            setLoading(false);
            setError('無法載入專案資料，請檢查網路連線或稍後再試。');
          }
        );

        return () => unsubscribe();
      } catch (_error) {
        setLoading(false);
        setError('無法設定專案查詢，請重新整理頁面。');
      }
    };

    fetchProjects();
  }, [user?.uid, user?.currentRole]);

  const toggleOpen = (projectId: string) => {
    setOpenMap(prev => ({ ...prev, [projectId]: !prev[projectId] }));
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
      <ul className='space-y-2'>
        {navs.map(nav => (
          <li key={nav.href}>
            <Link
              href={nav.href}
              className={cn(
                navigationStyles.navItem,
                navigationStyles.navItemHover,
                pathname === nav.href
                  ? navigationStyles.navItemActive
                  : navigationStyles.navItemInactive
              )}
            >
              <span className='mr-3'>{nav.icon}</span>
              {nav.label}
            </Link>
          </li>
        ))}
      </ul>
      
      <div className='flex-1 overflow-y-auto mt-4'>
        {loading ? (
          <div className='flex items-center justify-center py-8'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
          </div>
        ) : error ? (
          <div className='flex flex-col items-center justify-center py-8 text-center'>
            <div className='text-red-400 text-6xl mb-4'>⚠️</div>
            <p className='text-red-600 dark:text-red-400 text-sm mb-2'>載入專案時發生錯誤</p>
            <p className='text-gray-500 dark:text-gray-400 text-xs mb-4'>{error}</p>
            {error.includes('索引') && (
              <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 max-w-sm'>
                <p className='text-blue-800 dark:text-blue-200 text-xs'>
                  <strong>解決方法：</strong><br/>
                  1. 點擊錯誤訊息中的連結建立索引<br/>
                  2. 或前往 Firebase 控制台手動建立索引<br/>
                  3. 等待索引建立完成後重新整理頁面
                </p>
              </div>
            )}
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
          <ul className='space-y-2'>
            {projects.map(project => (
              <li key={project.id} className='group'>
                <div className='flex items-center'>
                  <button
                    type='button'
                    aria-label={openMap[project.id] ? '收合' : '展開'}
                    onClick={() => toggleOpen(project.id)}
                    className={navigationStyles.toggleButton}
                  >
                    {openMap[project.id] ? (
                      <ChevronDownIcon className='w-5 h-5 text-gray-500' />
                    ) : (
                      <ChevronRightIcon className='w-5 h-5 text-gray-500' />
                    )}
                  </button>
                  <Link
                    href={`/projects/${project.id}`}
                    className={cn(
                      navigationStyles.projectNavItem,
                      navigationStyles.navItemHover,
                      pathname === `/projects/${project.id}`
                        ? navigationStyles.navItemActive
                        : navigationStyles.navItemInactive
                    )}
                  >
                    <div className='flex items-center justify-between gap-2'>
                      <span className='truncate'>
                        {project.projectName || project.projectId || project.id}
                      </span>
                      <ProjectProgressPercent project={project} />
                    </div>
                  </Link>
                  <button
                    title='封存專案'
                    className={navigationStyles.archiveButton}
                    onClick={async e => {
                      e.preventDefault();
                      if (!window.confirm('確定要封存此專案？')) return;
                      await safeAsync(async () => {
                        const projectData = { ...project, archivedAt: Timestamp.now() };
                        const userId = project.owner || 'default';
                        await retry(() => setDoc(
                          doc(db, 'archived', userId, 'projects', project.id),
                          projectData
                        ), 3, 1000);
                        await retry(() => deleteDoc(doc(db, 'projects', project.id)), 3, 1000);
                      }, (error) => {
                        alert(`封存專案失敗: ${getErrorMessage(error)}`);
                        logError(error, { operation: 'archive_project', projectId: project.id });
                      });
                    }}
                  >
                    🗑️
                  </button>
                </div>
                {openMap[project.id] && (
                  <div className='pl-12 mt-2 space-y-2'>
                    {project.workpackages?.map(wp => (
                      <div key={wp.id} className='group/item'>
                        <Link
                          href={`/projects/${project.id}/workpackages/${wp.id}`}
                          className={cn(
                            navigationStyles.workpackageNavItem,
                            navigationStyles.workpackageNavItemHover,
                            pathname.includes(`/workpackages/${wp.id}`)
                              ? navigationStyles.workpackageNavItemActive
                              : navigationStyles.workpackageNavItemInactive
                          )}
                        >
                          <div className='flex items-center justify-between gap-2'>
                            <span className='truncate'>{wp.name}</span>
                            <span className='text-xs text-gray-500 flex-shrink-0'>
                              {(wp.subWorkpackages?.length || 0) > 0 &&
                                `(${wp.subWorkpackages?.length})`}
                            </span>
                          </div>
                          <div className='mt-1 flex items-center gap-2'>
                            <ProgressBar wp={wp as import('@/types/project').Workpackage} />
                            <span className='text-xs text-gray-500'>
                              {calculateWorkpackageProgress(
                                wp as import('@/types/project').Workpackage
                              )}
                              %
                            </span>
                          </div>
                        </Link>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        setSelectedProjectId(project.id);
                        setShowCreateModal(true);
                      }}
                      className={navigationStyles.addWorkpackageButton}
                    >
                      <span className='mr-2'>+</span> 新增工作包
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

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

export default function ProjectsLayout({ children }: { children: ReactNode }) {
  return (
    <PermissionCheck requiredPermission='projects'>
      <PageLayout withSidebar>
        <Sidebar>
          <SidebarContent />
        </Sidebar>
        <PageContent>{children}</PageContent>
      </PageLayout>
    </PermissionCheck>
  );
}
