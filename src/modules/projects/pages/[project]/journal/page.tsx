/**
 * 專案日誌頁面
 */

'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

import { PageContainer, PageHeader } from '@/modules/projects/components/common';
import { ProjectService } from '@/modules/projects/services/projectService';
import { projectStyles } from '@/modules/projects/styles';
import type { Project } from '@/modules/projects/types/project';

export default function ProjectJournalPage() {
  const params = useParams();
  const projectId = params.project as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProject = async () => {
      try {
        setIsLoading(true);
        const projectData = await ProjectService.getProjectById(projectId);
        setProject(projectData);
      } catch (error) {
        console.error('載入專案失敗:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className='flex items-center justify-center h-64'>
          <div className='text-gray-500 dark:text-gray-400'>載入中...</div>
        </div>
      </PageContainer>
    );
  }

  if (!project) {
    return (
      <PageContainer>
        <div className='text-center py-12'>
          <div className='text-gray-500 dark:text-gray-400'>專案不存在</div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={`${project.projectName} - 專案日誌`}
        subtitle='記錄專案進度和重要事件'
      >
        <button className={projectStyles.button.primary}>
          新增日誌
        </button>
      </PageHeader>

      <div className={projectStyles.card.base}>
        <div className='text-center py-12'>
          <div className='text-gray-500 dark:text-gray-400 mb-4'>
            專案日誌功能開發中
          </div>
          <p className='text-sm text-gray-400 dark:text-gray-500'>
            此頁面將提供日誌記錄、進度追蹤和事件管理功能
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
