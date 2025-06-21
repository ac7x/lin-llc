/**
 * 專案費用管理頁面
 */

'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

import { PageContainer, PageHeader } from '@/modules/projects/components/common';
import { ExpenseForm, ExpenseList } from '@/modules/projects/components/expenses';
import { ProjectService } from '@/modules/projects/services/projectService';
import { projectStyles } from '@/modules/projects/styles';
import type { Project } from '@/modules/projects/types/project';

export default function ProjectExpensesPage() {
  const params = useParams();
  const projectId = params.project as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showExpenseForm, setShowExpenseForm] = useState(false);

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
        title={`${project.projectName} - 費用管理`}
        subtitle='管理專案相關費用和支出'
      >
        <button
          onClick={() => setShowExpenseForm(true)}
          className={projectStyles.button.primary}
        >
          新增費用
        </button>
      </PageHeader>

      <div className='space-y-6'>
        {showExpenseForm && (
          <ExpenseForm
            projectId={projectId}
            onClose={() => setShowExpenseForm(false)}
            onSuccess={() => {
              setShowExpenseForm(false);
              // 重新載入費用列表
            }}
          />
        )}

        <ExpenseList projectId={projectId} />
      </div>
    </PageContainer>
  );
}
