import { useState } from 'react';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';
import { Project, Package } from '../types';

/**
 * 專案 CRUD 操作管理 Hook
 * 負責專案、工作包、子工作包、任務包的增刪改查操作
 */
export function useProjectOperations(
  hasPermission: (permission: string) => boolean,
  onProjectUpdate: (updatedProject: Project) => void,
  onProjectAdd: (newProject: Project) => void
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 建立專案
  const createProject = async (projectName: string): Promise<boolean> => {
    // 檢查是否有創建專案權限
    if (!hasPermission('project:write')) {
      console.warn('用戶沒有創建專案權限');
      setError('權限不足：無法創建專案');
      return false;
    }

    if (!projectName.trim()) {
      setError('專案名稱不能為空');
      return false;
    }

    setLoading(true);
    setError(null);
    
    try {
      const docRef = await addDoc(collection(db, 'projects'), {
        name: projectName.trim(),
        createdAt: new Date().toISOString(),
        packages: [],
      });
      
      const newProject: Project = {
        id: docRef.id,
        name: projectName.trim(),
        description: '',
        createdAt: new Date().toISOString(),
        packages: [],
        completed: 0,
        total: 0,
        progress: 0,
      };
      
      onProjectAdd(newProject);
      return true;
    } catch (error) {
      console.error('建立專案失敗:', error);
      setError('建立專案失敗');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 更新專案 packages 的共用方法
  const updateProjectPackages = async (
    projectId: string, 
    packages: Package[], 
    projects: Project[]
  ): Promise<boolean> => {
    try {
      await updateDoc(doc(db, 'projects', projectId), { packages });
      
      const updatedProject = projects.find(p => p.id === projectId);
      if (updatedProject) {
        onProjectUpdate({ ...updatedProject, packages });
      }
      
      return true;
    } catch (error) {
      console.error('更新專案失敗:', error);
      setError('更新專案失敗');
      return false;
    }
  };

  // 新增工作包
  const addPackage = async (
    projectId: string, 
    pkgName: string, 
    projects: Project[]
  ): Promise<boolean> => {
    if (!pkgName.trim()) {
      setError('工作包名稱不能為空');
      return false;
    }
    
    // 檢查是否有創建工作包權限
    if (!hasPermission('project:package:create')) {
      console.warn('用戶沒有創建工作包權限');
      setError('權限不足：無法創建工作包');
      return false;
    }

    setLoading(true);
    setError(null);
    
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) {
        setError('專案不存在');
        return false;
      }
      
      const updatedPackages = [
        ...project.packages,
        { name: pkgName.trim(), subpackages: [], completed: 0, total: 0, progress: 0 }
      ];
      
      const success = await updateProjectPackages(projectId, updatedPackages, projects);
      return success;
    } catch (error) {
      console.error('新增工作包失敗:', error);
      setError('新增工作包失敗');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 新增子工作包
  const addSubpackage = async (
    projectId: string, 
    pkgIdx: number, 
    subName: string, 
    projects: Project[]
  ): Promise<boolean> => {
    if (!subName.trim()) {
      setError('子工作包名稱不能為空');
      return false;
    }
    
    // 檢查是否有創建子工作包權限
    if (!hasPermission('project:subpackage:create')) {
      console.warn('用戶沒有創建子工作包權限');
      setError('權限不足：無法創建子工作包');
      return false;
    }

    setLoading(true);
    setError(null);
    
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) {
        setError('專案不存在');
        return false;
      }
      
      const updatedPackages = project.packages.map((pkg, idx) =>
        idx === pkgIdx
          ? { 
              ...pkg, 
              subpackages: [...pkg.subpackages, { 
                name: subName.trim(), 
                taskpackages: [], 
                completed: 0, 
                total: 0, 
                progress: 0 
              }] 
            }
          : pkg
      );
      
      const success = await updateProjectPackages(projectId, updatedPackages, projects);
      return success;
    } catch (error) {
      console.error('新增子工作包失敗:', error);
      setError('新增子工作包失敗');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 新增任務包
  const addTaskPackage = async (
    projectId: string, 
    pkgIdx: number, 
    subIdx: number, 
    taskPackageName: string, 
    projects: Project[]
  ): Promise<boolean> => {
    if (!taskPackageName.trim()) {
      setError('任務包名稱不能為空');
      return false;
    }
    
    // 檢查是否有創建任務權限
    if (!hasPermission('project:task:create')) {
      console.warn('用戶沒有創建任務權限');
      setError('權限不足：無法創建任務包');
      return false;
    }

    setLoading(true);
    setError(null);
    
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) {
        setError('專案不存在');
        return false;
      }
      
      const updatedPackages = project.packages.map((pkg, i) =>
        i === pkgIdx
          ? {
              ...pkg,
              subpackages: pkg.subpackages.map((sub, j) =>
                j === subIdx
                  ? { 
                      ...sub, 
                      taskpackages: [...sub.taskpackages, { 
                        name: taskPackageName.trim(), 
                        completed: 0, 
                        total: 0, 
                        progress: 0 
                      }] 
                    }
                  : sub
              )
            }
          : pkg
      );
      
      const success = await updateProjectPackages(projectId, updatedPackages, projects);
      return success;
    } catch (error) {
      console.error('新增任務包失敗:', error);
      setError('新增任務包失敗');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 清除錯誤
  const clearError = () => {
    setError(null);
  };

  return {
    loading,
    error,
    createProject,
    addPackage,
    addSubpackage,
    addTaskPackage,
    updateProjectPackages,
    clearError,
  };
} 