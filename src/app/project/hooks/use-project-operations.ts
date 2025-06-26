import { useState } from 'react';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/app/(system)';
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
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(db, 'projects'), {
        name: projectName.trim(),
        description: '',
        createdAt: now,
        updatedAt: now,
        packages: [],
        completed: 0,
        total: 0,
        progress: 0,
      });
      
      const newProject: Project = {
        id: docRef.id,
        name: projectName.trim(),
        description: '',
        createdAt: now,
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

  // 🎯 數量分配功能

  // 分配數量到子項目
  const distributeQuantity = async (
    projectId: string,
    itemPath: { packageIndex?: number; subpackageIndex?: number },
    distributionData: {
      parentTotal: number;
      distributions: Array<{
        index: number;
        name: string;
        allocated: number;
        completed?: number;
      }>;
    },
    projects: Project[]
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) {
        setError('專案不存在');
        return false;
      }

      let updatedPackages = [...project.packages];

      if (itemPath.subpackageIndex !== undefined && itemPath.packageIndex !== undefined) {
        // 分配子工作包數量到任務
        updatedPackages = updatedPackages.map((pkg, pkgIdx) =>
          pkgIdx === itemPath.packageIndex
            ? {
                ...pkg,
                subpackages: pkg.subpackages.map((sub, subIdx) =>
                  subIdx === itemPath.subpackageIndex
                    ? {
                        ...sub,
                        total: distributionData.parentTotal,
                        progress: sub.total > 0 ? Math.round(((sub.completed || 0) / distributionData.parentTotal) * 100) : 0,
                        taskpackages: sub.taskpackages.map((task, taskIdx) => {
                          const distribution = distributionData.distributions.find(d => d.index === taskIdx);
                          if (distribution) {
                            return {
                              ...task,
                              total: distribution.allocated,
                              progress: distribution.allocated > 0 ? Math.round(((task.completed || 0) / distribution.allocated) * 100) : 0,
                            };
                          }
                          return task;
                        })
                      }
                    : sub
                )
              }
            : pkg
        );
      } else if (itemPath.packageIndex !== undefined) {
        // 分配工作包數量到子工作包
        updatedPackages = updatedPackages.map((pkg, pkgIdx) =>
          pkgIdx === itemPath.packageIndex
            ? {
                ...pkg,
                total: distributionData.parentTotal,
                progress: pkg.total > 0 ? Math.round(((pkg.completed || 0) / distributionData.parentTotal) * 100) : 0,
                subpackages: pkg.subpackages.map((sub, subIdx) => {
                  const distribution = distributionData.distributions.find(d => d.index === subIdx);
                  if (distribution) {
                    return {
                      ...sub,
                      total: distribution.allocated,
                      progress: distribution.allocated > 0 ? Math.round(((sub.completed || 0) / distribution.allocated) * 100) : 0,
                    };
                  }
                  return sub;
                })
              }
            : pkg
        );
      }

      // 重新計算所有層級的進度
      updatedPackages = recalculateAllProgress(updatedPackages);

      const success = await updateProjectPackages(projectId, updatedPackages, projects);
      return success;
    } catch (error) {
      console.error('分配數量失敗:', error);
      setError('分配數量失敗');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 重新計算所有層級進度的輔助函數
  const recalculateAllProgress = (packages: Package[]): Package[] => {
    return packages.map(pkg => {
      // 計算工作包進度
      const subpackages = pkg.subpackages.map(sub => {
        // 計算子工作包進度
        const taskpackages = sub.taskpackages.map(task => ({
          ...task,
          progress: task.total > 0 ? Math.round(((task.completed || 0) / task.total) * 100) : 0,
        }));

        const subCompleted = taskpackages.reduce((sum, task) => sum + (task.completed || 0), 0);
        const subTotal = taskpackages.reduce((sum, task) => sum + (task.total || 0), 0);

        return {
          ...sub,
          taskpackages,
          completed: subCompleted,
          total: subTotal,
          progress: subTotal > 0 ? Math.round((subCompleted / subTotal) * 100) : 0,
        };
      });

      const pkgCompleted = subpackages.reduce((sum, sub) => sum + (sub.completed || 0), 0);
      const pkgTotal = subpackages.reduce((sum, sub) => sum + (sub.total || 0), 0);

      return {
        ...pkg,
        subpackages,
        completed: pkgCompleted,
        total: pkgTotal,
        progress: pkgTotal > 0 ? Math.round((pkgCompleted / pkgTotal) * 100) : 0,
      };
    });
  };

  // 更新專案基本資訊
  const updateProjectInfo = async (project: Project): Promise<boolean> => {
    // 檢查是否有更新專案權限
    if (!hasPermission('project:write')) {
      console.warn('用戶沒有更新專案權限');
      setError('權限不足：無法更新專案');
      return false;
    }

    if (!project.id) {
      setError('專案 ID 不能為空');
      return false;
    }

    setLoading(true);
    setError(null);
    
    try {
      const now = new Date().toISOString();
      
      // 準備要更新的專案資料
      const updateData = {
        name: project.name,
        description: project.description || '',
        manager: project.manager,
        supervisor: project.supervisor,
        safety: project.safety,
        quality: project.quality,
        region: project.region,
        address: project.address,
        updatedAt: now,
      };

      // 移除 undefined 值
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof typeof updateData] === undefined) {
          delete updateData[key as keyof typeof updateData];
        }
      });
      
      await updateDoc(doc(db, 'projects', project.id), updateData);
      
      // 更新本地狀態
      const updatedProject: Project = {
        ...project,
      };
      
      onProjectUpdate(updatedProject);
      return true;
    } catch (error) {
      console.error('更新專案資訊失敗:', error);
      setError('更新專案資訊失敗');
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
    // 🎯 數量分配功能
    distributeQuantity,
    updateProjectInfo,
    clearError,
  };
} 