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
import { LoadingSpinner, DataLoader, PageContainer, PageHeader } from '@/app/modules/projects/components/common';
import { WorkPackageList, WorkPackageForm } from '@/app/modules/projects/components/work-packages';
import { WorkPackageService } from '@/app/modules/projects/services';
import type { Project, WorkPackage } from '@/app/modules/projects/types';
import { logError, safeAsync, retry } from '@/utils/errorUtils';
import { projectStyles } from '@/app/modules/projects/styles';

interface ProjectWithId extends Project {
  id: string;
}

export default function ProjectWorkPackagesPage() {
  const params = useParams();
  const projectId = params.project as string;
  
  const [project, setProject] = useState<ProjectWithId | null>(null);
  const [workPackages, setWorkPackages] = useState<WorkPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWorkPackageForm, setShowWorkPackageForm] = useState(false);
  const [editingWorkPackage, setEditingWorkPackage] = useState<WorkPackage | null>(null);

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
  const loadWorkPackages = async () => {
    if (!projectId) return;

    try {
      const workPackagesData = await WorkPackageService.getWorkPackagesByProject(projectId);
      setWorkPackages(workPackagesData);
    } catch (err) {
      logError(err as Error, { operation: 'fetch_workPackages', projectId });
    }
  };

  useEffect(() => {
    loadProject();
  }, [projectId]);

  useEffect(() => {
    if (project) {
      loadWorkPackages();
    }
  }, [project]);

  // 處理新增工作包
  const handleCreateWorkPackage = async (workPackageData: Partial<WorkPackage>) => {
    if (!projectId) return;
    
    try {
      // 這裡需要實作工作包服務的創建方法
      await loadWorkPackages();
      setShowWorkPackageForm(false);
      setEditingWorkPackage(null);
    } catch (err) {
      logError(err as Error, { operation: 'create_workPackage', projectId });
    }
  };

  // 處理編輯工作包
  const handleEditWorkPackage = async (workPackageData: Partial<WorkPackage>) => {
    if (!editingWorkPackage) return;
    
    try {
      // 這裡需要實作工作包服務的更新方法
      await loadWorkPackages();
      setShowWorkPackageForm(false);
      setEditingWorkPackage(null);
    } catch (err) {
      logError(err as Error, { operation: 'update_workPackage', projectId });
    }
  };

  // 處理刪除工作包
  const handleDeleteWorkPackage = async (workPackageId: string) => {
    if (!projectId) return;
    
    try {
      // 這裡需要實作工作包服務的刪除方法
      await loadWorkPackages();
    } catch (err) {
      logError(err as Error, { operation: 'delete_workPackage', projectId });
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
          onClick={() => setShowWorkPackageForm(true)}
          className={projectStyles.button.primary}
        >
          新增工作包
        </button>
      </PageHeader>

      <DataLoader
        loading={loading}
        error={error ? new Error(error) : null}
        data={workPackages}
      >
        {(data) => (
          projectId && (
            <WorkPackageList
              workPackages={data}
              projectId={projectId}
            />
          )
        )}
      </DataLoader>

      {/* 工作包表單模態框 */}
      {showWorkPackageForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <WorkPackageForm
              workPackage={editingWorkPackage || undefined}
              projectId={projectId}
              onSubmit={editingWorkPackage ? handleEditWorkPackage : handleCreateWorkPackage}
              onCancel={() => {
                setShowWorkPackageForm(false);
                setEditingWorkPackage(null);
              }}
              isSubmitting={loading}
            />
          </div>
        </div>
      )}
    </PageContainer>
  );
}
