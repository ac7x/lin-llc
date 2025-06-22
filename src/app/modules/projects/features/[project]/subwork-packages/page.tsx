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
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { LoadingSpinner, DataLoader, PageContainer, PageHeader } from '@/app/modules/projects/components/common';
import { SubWorkPackageList, SubWorkPackageForm } from '@/app/modules/projects/components/subwork-packages';
import type { Project, SubWorkPackage, WorkPackage } from '@/app/modules/projects/types';
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
      const projectWithId = {
        ...projectData,
        id: projectDoc.id,
      };
      
      setProject(projectWithId);
      
      // 從專案的工作包中提取所有子工作包
      const allSubWorkPackages: SubWorkPackage[] = [];
      projectData.workPackages?.forEach(workPackage => {
        if (workPackage.subPackages && workPackage.subPackages.length > 0) {
          allSubWorkPackages.push(...workPackage.subPackages);
        }
      });
      setSubWorkPackages(allSubWorkPackages);
    }, (error) => {
      setError(error instanceof Error ? error.message : '載入專案失敗');
      logError(error, { operation: 'fetch_project', projectId });
    });

    setLoading(false);
  };

  useEffect(() => {
    loadProject();
  }, [projectId]);

  // 處理新增子工作包
  const handleCreateSubWorkPackage = async (subWorkPackageData: Partial<SubWorkPackage>) => {
    if (!project || !projectId) return;
    
    setSubmitting(true);
    try {
      // 獲取第一個工作包的 ID
      const firstWorkPackage = project.workPackages?.[0];
      if (!firstWorkPackage) {
        throw new Error('專案中沒有可用的工作包');
      }

      const newSubWorkPackage: SubWorkPackage = {
        id: `swp_${Date.now()}`, // 生成臨時 ID
        name: subWorkPackageData.name || '',
        description: subWorkPackageData.description || '',
        quantity: subWorkPackageData.quantity || 0,
        unitWeight: subWorkPackageData.unitWeight || 1,
        completedUnits: subWorkPackageData.completedUnits || 0,
        progress: subWorkPackageData.progress || 0,
        workers: subWorkPackageData.workers || [],
        status: subWorkPackageData.status || 'draft',
        assignedTo: subWorkPackageData.assignedTo || null,
        priority: subWorkPackageData.priority || 'medium',
        estimatedQuantity: subWorkPackageData.estimatedQuantity || 0,
        actualQuantity: subWorkPackageData.actualQuantity || 0,
        unit: subWorkPackageData.unit || '個',
        budget: subWorkPackageData.budget || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 更新專案文檔中的工作包陣列
      const updatedWorkPackages = project.workPackages.map(wp => 
        wp.id === firstWorkPackage.id 
          ? { ...wp, subPackages: [...(wp.subPackages || []), newSubWorkPackage] }
          : wp
      );

      await updateDoc(doc(db, 'projects', projectId), {
        workPackages: updatedWorkPackages,
        updatedAt: new Date(),
      });

      // 重新載入專案數據
      await loadProject();
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
    if (!editingSubWorkPackage || !project || !projectId) return;
    
    setSubmitting(true);
    try {
      // 更新專案文檔中的工作包陣列
      const updatedWorkPackages = project.workPackages.map(wp => ({
        ...wp,
        subPackages: wp.subPackages?.map(subWp => 
          subWp.id === editingSubWorkPackage.id 
            ? { ...subWp, ...subWorkPackageData, updatedAt: new Date() }
            : subWp
        ) || []
      }));

      await updateDoc(doc(db, 'projects', projectId), {
        workPackages: updatedWorkPackages,
        updatedAt: new Date(),
      });

      // 重新載入專案數據
      await loadProject();
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
    if (!project || !projectId) return;
    
    try {
      // 更新專案文檔中的工作包陣列
      const updatedWorkPackages = project.workPackages.map(wp => ({
        ...wp,
        subPackages: wp.subPackages?.filter(subWp => subWp.id !== subWorkPackageId) || []
      }));

      await updateDoc(doc(db, 'projects', projectId), {
        workPackages: updatedWorkPackages,
        updatedAt: new Date(),
      });

      // 重新載入專案數據
      await loadProject();
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
            workPackageId={project.workPackages?.[0]?.id || ''}
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
