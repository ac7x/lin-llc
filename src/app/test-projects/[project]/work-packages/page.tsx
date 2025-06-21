/**
 * 專案工作包管理頁面
 * 
 * 管理專案的主要工作包，包括：
 * - 工作包列表
 * - 新增工作包
 * - 進度管理
 * - 資源分配
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { LoadingSpinner, DataLoader, PageContainer, PageHeader } from '@/app/test-projects/components/common';
import { WorkpackageList, WorkpackageForm } from '@/app/test-projects/components/work-packages';
import { WorkpackageService } from '@/app/test-projects/services';
import type { Project, WorkPackage } from '@/app/test-projects/types/project';
import { logError, safeAsync, retry } from '@/utils/errorUtils';
import { projectStyles } from '@/app/test-projects/styles';

interface ProjectWithId extends Project {
  id: string;
}

export default function ProjectWorkpackagesPage() {
  const params = useParams();
  const projectId = params.project as string;
  
  const [project, setProject] = useState<ProjectWithId | null>(null);
  const [workpackages, setWorkpackages] = useState<WorkPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWorkpackageForm, setShowWorkpackageForm] = useState(false);
  const [editingWorkpackage, setEditingWorkpackage] = useState<WorkPackage | null>(null);

  // 載入專案資料
  const loadProject = async () => {
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

  // 載入工作包資料
  const loadWorkpackages = async () => {
    if (!projectId) return;

    try {
      const workpackagesData = await WorkpackageService.getWorkpackagesByProject(projectId);
      setWorkpackages(workpackagesData);
    } catch (err) {
      logError(err as Error, { operation: 'fetch_workpackages', projectId });
    }
  };

  useEffect(() => {
    loadProject();
  }, [projectId]);

  useEffect(() => {
    if (project) {
      loadWorkpackages();
    }
  }, [project]);

  // 處理新增工作包
  const handleCreateWorkpackage = async (workpackageData: Partial<WorkPackage>) => {
    if (!projectId) return;
    
    try {
      // 這裡需要實作工作包服務的創建方法
      await loadWorkpackages();
      setShowWorkpackageForm(false);
      setEditingWorkpackage(null);
    } catch (err) {
      logError(err as Error, { operation: 'create_workpackage', projectId });
    }
  };

  // 處理編輯工作包
  const handleEditWorkpackage = async (workpackageData: Partial<WorkPackage>) => {
    if (!editingWorkpackage) return;
    
    try {
      // 這裡需要實作工作包服務的更新方法
      await loadWorkpackages();
      setShowWorkpackageForm(false);
      setEditingWorkpackage(null);
    } catch (err) {
      logError(err as Error, { operation: 'update_workpackage', projectId });
    }
  };

  // 處理刪除工作包
  const handleDeleteWorkpackage = async (workpackageId: string) => {
    if (!projectId) return;
    
    try {
      // 這裡需要實作工作包服務的刪除方法
      await loadWorkpackages();
    } catch (err) {
      logError(err as Error, { operation: 'delete_workpackage', projectId });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            載入失敗
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {error || '專案不存在'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={`${project.projectName} - 工作包管理`}
        subtitle='管理專案的主要工作包'
      >
        <button
          onClick={() => setShowWorkpackageForm(true)}
          className={projectStyles.button.primary}
        >
          新增工作包
        </button>
      </PageHeader>

      <DataLoader
        loading={loading}
        error={error ? new Error(error) : null}
        data={workpackages}
      >
        {(data) => (
          projectId && (
            <WorkpackageList
              workpackages={data}
              projectId={projectId}
            />
          )
        )}
      </DataLoader>

      {/* 工作包表單模態框 */}
      {showWorkpackageForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <WorkpackageForm
              workpackage={editingWorkpackage || undefined}
              projectId={projectId}
              onSubmit={editingWorkpackage ? handleEditWorkpackage : handleCreateWorkpackage}
              onCancel={() => {
                setShowWorkpackageForm(false);
                setEditingWorkpackage(null);
              }}
              isSubmitting={loading}
            />
          </div>
        </div>
      )}
    </PageContainer>
  );
}
