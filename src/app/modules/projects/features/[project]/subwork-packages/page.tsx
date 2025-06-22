/**
 * 專案子工作包管理頁面
 * 
 * 管理專案中的子工作包，包括：
 * - 子工作包列表
 * - 新增子工作包
 * - 子工作包狀態管理
 * - 進度追蹤
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { LoadingSpinner, DataLoader, PageContainer, PageHeader } from '@/app/modules/projects/components/common';
import { SubWorkPackageList, SubWorkPackageForm } from '@/app/modules/projects/components/subwork-packages';
import { getSubWorkPackagesByProjectId, createSubWorkPackage, updateSubWorkPackage, deleteSubWorkPackage } from '@/app/modules/projects/services/subWorkPackageService';
import type { Project, SubWorkPackage } from '@/app/modules/projects/types';
import { logError, safeAsync, retry } from '@/utils/errorUtils';
import { projectStyles } from '@/app/modules/projects/styles';

interface ProjectWithId extends Project {
  id: string;
}

export default function ProjectSubWorkPackagesPage() {
  const params = useParams();
  const projectId = params.project as string;
  const [project, setProject] = useState<ProjectWithId | null>(null);
  const [subWorkPackages, setSubWorkPackages] = useState<SubWorkPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSubWorkPackageForm, setShowSubWorkPackageForm] = useState(false);
  const [editingSubWorkPackage, setEditingSubWorkPackage] = useState<SubWorkPackage | null>(null);

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

  // 載入子工作包資料
  const loadSubWorkPackages = async () => {
    if (!projectId) return;

    try {
      const subWorkPackagesData = await getSubWorkPackagesByProjectId(projectId);
      setSubWorkPackages(subWorkPackagesData);
    } catch (err) {
      logError(err as Error, { operation: 'fetch_subworkPackages', projectId });
    }
  };

  useEffect(() => {
    loadProject();
  }, [projectId]);

  useEffect(() => {
    if (project) {
      loadSubWorkPackages();
    }
  }, [project]);

  // 處理新增子工作包
  const handleCreateSubWorkPackage = async (subWorkPackageData: Partial<SubWorkPackage>) => {
    if (!projectId || !project) return;
    
    setSubmitting(true);
    try {
      // 獲取第一個工作包的 ID
      const workPackageId = project.workPackages[0]?.id;
      if (!workPackageId) {
        throw new Error('專案中沒有可用的工作包');
      }

      // 創建子工作包
      await createSubWorkPackage(workPackageId, subWorkPackageData as Omit<SubWorkPackage, 'id' | 'createdAt' | 'updatedAt'>);
      
      // 重新載入子工作包列表
      await loadSubWorkPackages();
      setShowSubWorkPackageForm(false);
      setEditingSubWorkPackage(null);
    } catch (err) {
      logError(err as Error, { operation: 'create_subworkPackage', projectId });
    } finally {
      setSubmitting(false);
    }
  };

  // 處理編輯子工作包
  const handleEditSubWorkPackage = async (subWorkPackageData: Partial<SubWorkPackage>) => {
    if (!editingSubWorkPackage) return;
    
    setSubmitting(true);
    try {
      // 更新子工作包
      await updateSubWorkPackage(editingSubWorkPackage.id, subWorkPackageData);
      
      // 重新載入子工作包列表
      await loadSubWorkPackages();
      setShowSubWorkPackageForm(false);
      setEditingSubWorkPackage(null);
    } catch (err) {
      logError(err as Error, { operation: 'update_subworkPackage', projectId });
    } finally {
      setSubmitting(false);
    }
  };

  // 處理刪除子工作包
  const handleDeleteSubWorkPackage = async (subWorkPackageId: string) => {
    if (!projectId) return;
    
    try {
      // 刪除子工作包
      await deleteSubWorkPackage(subWorkPackageId);
      
      // 重新載入子工作包列表
      await loadSubWorkPackages();
    } catch (err) {
      logError(err as Error, { operation: 'delete_subworkPackage', projectId });
    }
  };

  const handleViewSubWorkPackageDetails = (subWorkPackageId: string) => {
    // TODO: 實作查看子工作包詳情邏輯
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
        title={`${project.projectName} - 子工作包管理`}
        subtitle="管理專案中的子工作包和詳細任務"
      >
        <button
          onClick={() => setShowSubWorkPackageForm(true)}
          className={projectStyles.button.primary}
        >
          新增子工作包
        </button>
      </PageHeader>

      <DataLoader
        loading={loading}
        error={error ? new Error(error) : null}
        data={subWorkPackages}
      >
        {(data) => (
          <SubWorkPackageList
            subWorkPackages={data}
            workPackageId={project.workPackages[0]?.id || ''}
            onAddSubWorkPackage={() => setShowSubWorkPackageForm(true)}
            onEditSubWorkPackage={(subWorkPackage) => {
              setEditingSubWorkPackage(subWorkPackage);
              setShowSubWorkPackageForm(true);
            }}
            onDeleteSubWorkPackage={handleDeleteSubWorkPackage}
            onViewSubWorkPackageDetails={handleViewSubWorkPackageDetails}
          />
        )}
      </DataLoader>

      {/* 子工作包表單模態框 */}
      {showSubWorkPackageForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <SubWorkPackageForm
              subWorkPackage={editingSubWorkPackage || undefined}
              workPackageId={project.workPackages[0]?.id || ''}
              onSubmit={editingSubWorkPackage ? handleEditSubWorkPackage : handleCreateSubWorkPackage}
              onCancel={() => {
                setShowSubWorkPackageForm(false);
                setEditingSubWorkPackage(null);
              }}
              isSubmitting={submitting}
            />
          </div>
        </div>
      )}
    </PageContainer>
  );
}
