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
import { SubWorkpackageList, SubWorkpackageForm } from '@/app/modules/projects/components/subwork-packages';
import { getSubWorkpackagesByProjectId, createSubWorkpackage, updateSubWorkpackage, deleteSubWorkpackage } from '@/app/modules/projects/services/subworkpackageService';
import type { Project, SubWorkPackage } from '@/app/modules/projects/types';
import { logError, safeAsync, retry } from '@/utils/errorUtils';
import { projectStyles } from '@/app/modules/projects/styles';

interface ProjectWithId extends Project {
  id: string;
}

export default function ProjectSubWorkpackagesPage() {
  const params = useParams();
  const projectId = params.project as string;
  const [project, setProject] = useState<ProjectWithId | null>(null);
  const [subWorkpackages, setSubWorkpackages] = useState<SubWorkPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSubWorkpackageForm, setShowSubWorkpackageForm] = useState(false);
  const [editingSubWorkpackage, setEditingSubWorkpackage] = useState<SubWorkPackage | null>(null);

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
  const loadSubWorkpackages = async () => {
    if (!projectId) return;

    try {
      const subWorkpackagesData = await getSubWorkpackagesByProjectId(projectId);
      setSubWorkpackages(subWorkpackagesData);
    } catch (err) {
      logError(err as Error, { operation: 'fetch_subworkpackages', projectId });
    }
  };

  useEffect(() => {
    loadProject();
  }, [projectId]);

  useEffect(() => {
    if (project) {
      loadSubWorkpackages();
    }
  }, [project]);

  // 處理新增子工作包
  const handleCreateSubWorkpackage = async (subWorkpackageData: Partial<SubWorkPackage>) => {
    if (!projectId || !project) return;
    
    setSubmitting(true);
    try {
      // 獲取第一個工作包的 ID
      const workpackageId = project.workPackages[0]?.id;
      if (!workpackageId) {
        throw new Error('專案中沒有可用的工作包');
      }

      // 創建子工作包
      await createSubWorkpackage(workpackageId, subWorkpackageData as Omit<SubWorkPackage, 'id' | 'createdAt' | 'updatedAt'>);
      
      // 重新載入子工作包列表
      await loadSubWorkpackages();
      setShowSubWorkpackageForm(false);
      setEditingSubWorkpackage(null);
    } catch (err) {
      logError(err as Error, { operation: 'create_subworkpackage', projectId });
    } finally {
      setSubmitting(false);
    }
  };

  // 處理編輯子工作包
  const handleEditSubWorkpackage = async (subWorkpackageData: Partial<SubWorkPackage>) => {
    if (!editingSubWorkpackage) return;
    
    setSubmitting(true);
    try {
      // 更新子工作包
      await updateSubWorkpackage(editingSubWorkpackage.id, subWorkpackageData);
      
      // 重新載入子工作包列表
      await loadSubWorkpackages();
      setShowSubWorkpackageForm(false);
      setEditingSubWorkpackage(null);
    } catch (err) {
      logError(err as Error, { operation: 'update_subworkpackage', projectId });
    } finally {
      setSubmitting(false);
    }
  };

  // 處理刪除子工作包
  const handleDeleteSubWorkpackage = async (subWorkpackageId: string) => {
    if (!projectId) return;
    
    try {
      // 刪除子工作包
      await deleteSubWorkpackage(subWorkpackageId);
      
      // 重新載入子工作包列表
      await loadSubWorkpackages();
    } catch (err) {
      logError(err as Error, { operation: 'delete_subworkpackage', projectId });
    }
  };

  const handleViewSubWorkpackageDetails = (subWorkpackageId: string) => {
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
          onClick={() => setShowSubWorkpackageForm(true)}
          className={projectStyles.button.primary}
        >
          新增子工作包
        </button>
      </PageHeader>

      <DataLoader
        loading={loading}
        error={error ? new Error(error) : null}
        data={subWorkpackages}
      >
        {(data) => (
          <SubWorkpackageList
            subWorkpackages={data}
            workpackageId={project.workPackages[0]?.id || ''}
            onAddSubWorkpackage={() => setShowSubWorkpackageForm(true)}
            onEditSubWorkpackage={(subWorkpackage) => {
              setEditingSubWorkpackage(subWorkpackage);
              setShowSubWorkpackageForm(true);
            }}
            onDeleteSubWorkpackage={handleDeleteSubWorkpackage}
            onViewSubWorkpackageDetails={handleViewSubWorkpackageDetails}
          />
        )}
      </DataLoader>

      {/* 子工作包表單模態框 */}
      {showSubWorkpackageForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <SubWorkpackageForm
              subWorkpackage={editingSubWorkpackage || undefined}
              workpackageId={project.workPackages[0]?.id || ''}
              onSubmit={editingSubWorkpackage ? handleEditSubWorkpackage : handleCreateSubWorkpackage}
              onCancel={() => {
                setShowSubWorkpackageForm(false);
                setEditingSubWorkpackage(null);
              }}
              isSubmitting={submitting}
            />
          </div>
        </div>
      )}
    </PageContainer>
  );
}
