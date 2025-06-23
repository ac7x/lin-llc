/**
 * 子工作包詳情頁面
 *
 * 專注於單一子工作包的生命週期管理，提供：
 * - 關鍵指標 (KPI) 概覽
 * - 詳細資料編輯
 * - 任務清單管理
 * - 進度記錄與追蹤
 * - 問題與照片整合
 */
'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { useDocument } from 'react-firebase-hooks/firestore';

import { DataLoader } from '@/app/projects/components/DataLoader';
import type { Project, SubWorkpackage, Workpackage } from '@/app/projects/types/project';
import { ProgressBarWithPercent } from '@/app/projects/utils/progressUtils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { db, doc } from '@/lib/firebase-client';
import { cardStyles, getStatusBadgeStyle } from '@/utils/classNameUtils';
import { formatLocalDate } from '@/utils/dateUtils';


// Helper to find data from project document
const findSubWorkpackageData = (
  project: Project,
  workpackageId: string,
  subworkpackageId: string
) => {
  const workpackage = project.workpackages?.find(wp => wp.id === workpackageId);
  if (!workpackage) {
    return { workpackage: null, subworkpackage: null };
  }
  const subworkpackage = workpackage.subWorkpackages?.find(sub => sub.id === subworkpackageId);
  return { workpackage, subworkpackage: subworkpackage || null };
};


export default function SubWorkpackageDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const projectId = params.project as string;
  const workpackageId = params.workpackage as string;
  const subworkpackageId = params.subworkpackage as string;

  const [projectDoc, loading, error] = useDocument(doc(db, 'projects', projectId));

  const { workpackage, subworkpackage } = useMemo(() => {
    if (!projectDoc?.exists()) {
      return { workpackage: null, subworkpackage: null };
    }
    const projectData = projectDoc.data() as Project;
    return findSubWorkpackageData(projectData, workpackageId, subworkpackageId);
  }, [projectDoc, workpackageId, subworkpackageId]);

  const projectData = useMemo(
    () => (projectDoc?.exists() ? (projectDoc.data() as Project) : null),
    [projectDoc]
  );

  return (
    <DataLoader loading={loading} error={error} data={{ project: projectData, workpackage, subworkpackage }}>
      {({ project, workpackage, subworkpackage }) => {
        if (!project || !workpackage || !subworkpackage) {
          return (
            <div className={cardStyles.base}>
              <p>找不到指定的子工作包資料。</p>
              <Link href={`/projects/${projectId}`}>返回專案</Link>
            </div>
          );
        }

        const subWorkpackageStatus = subworkpackage.status || 'draft';

        const statusLabels: Record<SubWorkpackage['status'] & string, string> = {
          draft: '草稿',
          assigned: '已分配',
          'in-progress': '執行中',
          review: '審查中',
          completed: '已完成',
          'on-hold': '暫停中',
          cancelled: '已取消',
        };

        return (
          <div className='space-y-6'>
            {/* Breadcrumbs */}
            <div className='flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400'>
              <Link href={`/projects/${projectId}`} className='hover:underline'>
                {project.projectName}
              </Link>
              <ChevronRight className='h-4 w-4' />
              <Link
                href={`/projects/${projectId}/workpackages/${workpackageId}`}
                className='hover:underline'
              >
                {workpackage.name}
              </Link>
              <ChevronRight className='h-4 w-4' />
              <span className='font-semibold text-gray-700 dark:text-gray-200'>
                {subworkpackage.name}
              </span>
            </div>

            {/* Header */}
            <div className={cardStyles.base}>
              <div className='flex justify-between items-start'>
                <div>
                  <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
                    {subworkpackage.name}
                  </h1>
                  <p className='text-gray-600 dark:text-gray-400 mt-1'>
                    {subworkpackage.description || '沒有描述'}
                  </p>
                </div>
                <span className={getStatusBadgeStyle(subWorkpackageStatus, 'projectStatus')}>
                  {statusLabels[subWorkpackageStatus] || subWorkpackageStatus}
                </span>
              </div>
            </div>

            {/* KPI Card */}
            <div className={cardStyles.base}>
              <h2 className='text-lg font-semibold mb-4'>關鍵指標</h2>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                <div>
                  <p className='text-sm text-gray-500 dark:text-gray-400'>進度</p>
                  <ProgressBarWithPercent progress={subworkpackage.progress || 0} />
                </div>
                <div>
                  <p className='text-sm text-gray-500 dark:text-gray-400'>數量</p>
                  <p className='text-lg font-bold text-gray-900 dark:text-gray-100'>
                    {subworkpackage.actualQuantity || 0} / {subworkpackage.estimatedQuantity || 'N/A'}{' '}
                    {subworkpackage.unit}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-gray-500 dark:text-gray-400'>計劃開始日期</p>
                  <p className='text-lg font-bold text-gray-900 dark:text-gray-100'>
                    {formatLocalDate(subworkpackage.plannedStartDate) || '-'}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-gray-500 dark:text-gray-400'>計劃結束日期</p>
                  <p className='text-lg font-bold text-gray-900 dark:text-gray-100'>
                    {formatLocalDate(subworkpackage.plannedEndDate) || '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue='details' className='w-full'>
              <TabsList>
                <TabsTrigger value='details'>詳細資料</TabsTrigger>
                <TabsTrigger value='tasks'>任務清單</TabsTrigger>
                <TabsTrigger value='progress'>進度記錄</TabsTrigger>
                <TabsTrigger value='issues'>相關問題</TabsTrigger>
                <TabsTrigger value='photos'>相關照片</TabsTrigger>
              </TabsList>
              <TabsContent value='details' className={cardStyles.base}>
                <h2 className='text-lg font-semibold mb-4'>詳細資料</h2>
                <p>詳細資料編輯功能待實現。</p>
              </TabsContent>
              <TabsContent value='tasks' className={cardStyles.base}>
                <h2 className='text-lg font-semibold mb-4'>任務清單</h2>
                <p>任務清單功能待實現。</p>
              </TabsContent>
              <TabsContent value='progress' className={cardStyles.base}>
                <h2 className='text-lg font-semibold mb-4'>進度記錄</h2>
                <p>進度記錄功能待實現。</p>
              </TabsContent>
              <TabsContent value='issues' className={cardStyles.base}>
                <h2 className='text-lg font-semibold mb-4'>相關問題</h2>
                <p>相關問題功能待實現。</p>
              </TabsContent>
              <TabsContent value='photos' className={cardStyles.base}>
                <h2 className='text-lg font-semibold mb-4'>相關照片</h2>
                <p>相關照片功能待實現。</p>
              </TabsContent>
            </Tabs>
          </div>
        );
      }}
    </DataLoader>
  );
} 