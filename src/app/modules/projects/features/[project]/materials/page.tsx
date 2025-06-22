/**
 * 專案材料管理頁面
 * 
 * 管理專案材料和設備，包括：
 * - 材料列表
 * - 新增材料
 * - 庫存管理
 * - 採購追蹤
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { LoadingSpinner, DataLoader, PageContainer, PageHeader } from '@/app/modules/projects/components/common';
import { MaterialForm, MaterialList } from '@/app/modules/projects/components/materials';
import type { Project, MaterialEntry } from '@/app/modules/projects/types';
import { logError, safeAsync, retry } from '@/utils/errorUtils';
import { projectStyles } from '@/app/modules/projects/styles';

interface ProjectWithId extends Project {
  id: string;
}

export default function ProjectMaterialsPage() {
  const params = useParams();
  const projectId = params.project as string;
  
  const [project, setProject] = useState<ProjectWithId | null>(null);
  const [materials, setMaterials] = useState<MaterialEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialEntry | null>(null);

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

  // 載入材料資料
  const loadMaterials = async () => {
    if (!projectId) return;

    try {
      // 這裡需要實作材料服務的載入方法
      // const materialsData = await MaterialService.getMaterialsByProject(projectId);
      // setMaterials(materialsData);
      setMaterials([]); // 暫時設為空陣列
    } catch (err) {
      logError(err as Error, { operation: 'fetch_materials', projectId });
    }
  };

  useEffect(() => {
    loadProject();
  }, [projectId]);

  useEffect(() => {
    if (project) {
      loadMaterials();
    }
  }, [project]);

  // 處理新增材料
  const handleCreateMaterial = async (materialData: Omit<MaterialEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!projectId) return;
    
    try {
      // 這裡需要實作材料服務的創建方法
      await loadMaterials();
      setShowMaterialForm(false);
      setEditingMaterial(null);
    } catch (err) {
      logError(err as Error, { operation: 'create_material', projectId });
    }
  };

  // 處理編輯材料
  const handleEditMaterial = async (materialData: Partial<MaterialEntry>) => {
    if (!editingMaterial) return;
    
    try {
      // 這裡需要實作材料服務的更新方法
      await loadMaterials();
      setShowMaterialForm(false);
      setEditingMaterial(null);
    } catch (err) {
      logError(err as Error, { operation: 'update_material', projectId });
    }
  };

  // 處理刪除材料
  const handleDeleteMaterial = async (materialId: string) => {
    if (!projectId) return;
    
    try {
      // 這裡需要實作材料服務的刪除方法
      await loadMaterials();
    } catch (err) {
      logError(err as Error, { operation: 'delete_material', projectId });
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
        title={`${project.projectName} - 材料管理`}
        subtitle='管理專案材料和設備'
      >
        <button
          onClick={() => setShowMaterialForm(true)}
          className={projectStyles.button.primary}
        >
          新增材料
        </button>
      </PageHeader>

      <DataLoader
        loading={loading}
        error={error ? new Error(error) : null}
        data={materials}
      >
        {(data) => (
          <MaterialList
            materials={data}
            onEdit={(material) => {
              setEditingMaterial(material);
              setShowMaterialForm(true);
            }}
            onDelete={handleDeleteMaterial}
            onAdd={() => setShowMaterialForm(true)}
            isLoading={loading}
          />
        )}
      </DataLoader>

      {/* 材料表單模態框 */}
      {showMaterialForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <MaterialForm
              material={editingMaterial || undefined}
              onSubmit={editingMaterial ? handleEditMaterial : handleCreateMaterial}
              onCancel={() => {
                setShowMaterialForm(false);
                setEditingMaterial(null);
              }}
              isLoading={loading}
            />
          </div>
        </div>
      )}
    </PageContainer>
  );
}
