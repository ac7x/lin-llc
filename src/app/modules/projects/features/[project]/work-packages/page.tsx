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
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { LoadingSpinner, DataLoader, PageContainer, PageHeader } from '@/app/modules/projects/components/common';
import { WorkPackageList, WorkPackageForm } from '@/app/modules/projects/components/work-packages';
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
      const projectWithId = {
        ...projectData,
        id: projectDoc.id,
      };
      
      setProject(projectWithId);
      // 從專案數據中提取工作包
      setWorkPackages(projectData.workPackages || []);
    }, (error) => {
      setError(error instanceof Error ? error.message : '載入專案失敗');
      logError(error, { operation: 'fetch_project', projectId });
    });

    setLoading(false);
  };

  useEffect(() => {
    loadProject();
  }, [projectId]);

  // 處理新增工作包
  const handleCreateWorkPackage = async (workPackageData: Partial<WorkPackage>) => {
    if (!project || !projectId) return;
    
    try {
      const newWorkPackage: WorkPackage = {
        id: `wp_${Date.now()}`, // 生成臨時 ID
        name: workPackageData.name || '',
        description: workPackageData.description || '',
        budget: workPackageData.budget || 0,
        quantity: workPackageData.quantity || 0,
        subPackages: [],
        status: workPackageData.status || 'draft',
        progress: workPackageData.progress || 0,
        assignedTo: workPackageData.assignedTo || null,
        category: workPackageData.category || '',
        priority: workPackageData.priority || 'medium',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 更新專案文檔中的工作包陣列
      const updatedWorkPackages = [...workPackages, newWorkPackage];
      await updateDoc(doc(db, 'projects', projectId), {
        workPackages: updatedWorkPackages,
        updatedAt: new Date(),
      });

      // 重新載入專案數據
      await loadProject();
      setShowWorkPackageForm(false);
      setEditingWorkPackage(null);
    } catch (err) {
      logError(err as Error, { operation: 'create_workPackage', projectId });
    }
  };

  // 處理編輯工作包
  const handleEditWorkPackage = async (workPackageData: Partial<WorkPackage>) => {
    if (!editingWorkPackage || !projectId) return;
    
    try {
      const updatedWorkPackages = workPackages.map(wp => 
        wp.id === editingWorkPackage.id 
          ? { ...wp, ...workPackageData, updatedAt: new Date() }
          : wp
      );

      // 更新專案文檔中的工作包陣列
      await updateDoc(doc(db, 'projects', projectId), {
        workPackages: updatedWorkPackages,
        updatedAt: new Date(),
      });

      // 重新載入專案數據
      await loadProject();
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
      const updatedWorkPackages = workPackages.filter(wp => wp.id !== workPackageId);
      
      // 更新專案文檔中的工作包陣列
      await updateDoc(doc(db, 'projects', projectId), {
        workPackages: updatedWorkPackages,
        updatedAt: new Date(),
      });

      // 重新載入專案數據
      await loadProject();
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
          <WorkPackageList
            workPackages={data}
            projectId={projectId}
            onAddWorkPackage={() => setShowWorkPackageForm(true)}
            onEditWorkPackage={(workPackage) => {
              setEditingWorkPackage(workPackage);
              setShowWorkPackageForm(true);
            }}
            onDeleteWorkPackage={handleDeleteWorkPackage}
          />
        )}
      </DataLoader>

      {/* 工作包表單模態框 */}
      {showWorkPackageForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <WorkPackageForm
              workPackage={editingWorkPackage || undefined}
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
