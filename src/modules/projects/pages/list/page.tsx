/**
 * 專案詳細頁面
 * 
 * 顯示單一專案的詳細資訊，包括：
 * - 專案基本資訊
 * - 專案儀表板
 * - 工作包管理
 * - 日誌記錄
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import { doc, getDoc } from 'firebase/firestore';
import type { Project } from '@/modules/projects/types/project';
import { db } from '@/lib/firebase-client';
import { logError, safeAsync, retry } from '@/utils/errorUtils';
import { LoadingSpinner, DataLoader } from '@/modules/projects/components/common';
import { ProjectDashboard } from '@/modules/projects/components/dashboard';
import ProjectInfoPage from '@/modules/projects/components/ProjectInfoPage';

interface ProjectWithId extends Project {
  id: string;
}

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.project as string;
  const [project, setProject] = useState<ProjectWithId | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;

      setLoading(true);
      setError(null);

      await safeAsync(async () => {
        const projectDoc = await retry(() => getDoc(doc(db, 'projects', projectId)), 3, 1000);
        
        if (!projectDoc.exists()) {
          throw new Error('專案不存在');
        }

        const projectData = projectDoc.data() as Project;
        setProject({
          ...projectData,
          id: projectDoc.id,
        });
      }, (error) => {
        setError(error instanceof Error ? error.message : '載入專案失敗');
        logError(error, { operation: 'fetch_project', projectId });
      });

      setLoading(false);
    };

    fetchProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div className='text-center'>
          <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2'>
            載入失敗
          </h2>
          <p className='text-gray-600 dark:text-gray-400'>
            {error || '專案不存在'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* 專案儀表板 */}
      <ProjectDashboard project={project} />
      
      {/* 專案資訊 */}
      <ProjectInfoPage project={project} projectId={projectId} />
    </div>
  );
}
