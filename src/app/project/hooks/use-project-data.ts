import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/app/(system)/data/lib/firebase-init';
import { Project } from '../types';

/**
 * 專案數據載入管理 Hook
 * 負責專案列表的載入和狀態管理
 */
export function useProjectData(hasPermission: (permission: string) => boolean) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 載入專案列表
  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    
    // 檢查是否有查看專案權限
    if (!hasPermission('project:read')) {
      console.warn('用戶沒有查看專案權限');
      setLoading(false);
      return;
    }

    try {
      const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const projectList = snapshot.docs.map(doc => {
        const data = doc.data();
        // 確保 packages 是陣列，且每個 package 都有 tasks 陣列
        const packages = Array.isArray(data.packages) 
          ? data.packages.map((pkg: any) => ({
              name: pkg.name || '',
              completed: pkg.completed || 0,
              total: pkg.total || 0,
              progress: pkg.progress || 0,
              subpackages: Array.isArray(pkg.subpackages) 
                ? pkg.subpackages.map((sub: any) => ({ 
                    name: sub.name || '未命名子工作包',
                    completed: sub.completed || 0,
                    total: sub.total || 0,
                    progress: sub.progress || 0,
                    taskpackages: Array.isArray(sub.taskpackages) ? sub.taskpackages.map((task: any) => ({ 
                      name: task.name || '', 
                      completed: task.completed || 0, 
                      total: task.total || 0, 
                      progress: task.progress || 0 
                    })) : [] 
                  }))
                : []
            }))
          : [];
        
        return {
          id: doc.id,
          name: data.name || '',
          description: data.description || '',
          createdAt: data.createdAt || new Date().toISOString(),
          packages,
          completed: data.completed || 0,
          total: data.total || 0,
          progress: data.progress || 0,
          // 添加缺少的專案資訊欄位
          address: data.address || undefined,
          region: data.region || undefined,
          manager: data.manager || undefined,
          supervisor: data.supervisor || undefined,
          safety: data.safety || undefined,
          quality: data.quality || undefined,
          assigness: data.assigness || undefined,
          reviewers: data.reviewers || undefined,
          time: data.time || undefined,
        };
      }) as Project[];
      
      setProjects(projectList);
    } catch (error) {
      console.error('載入專案失敗:', error);
      setError('載入專案失敗');
    } finally {
      setLoading(false);
    }
  };

  // 初始載入
  useEffect(() => {
    void loadProjects();
  }, [hasPermission]); // eslint-disable-line react-hooks/exhaustive-deps

  // 更新專案列表中的特定專案
  const updateProject = (updatedProject: Project) => {
    setProjects(prev =>
      prev.map(p => (p.id === updatedProject.id ? updatedProject : p))
    );
  };

  // 新增專案到列表
  const addProject = (newProject: Project) => {
    setProjects(prev => [newProject, ...prev]);
  };

  // 刪除專案
  const removeProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
  };

  return {
    projects,
    loading,
    error,
    loadProjects,
    updateProject,
    addProject,
    removeProject,
    setProjects,
  };
} 