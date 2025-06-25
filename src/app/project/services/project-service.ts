import { collection, addDoc, getDocs, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';
import type { Project, Package } from '@/app/project/types';

/**
 * 專案服務類別 - 處理專案相關的操作
 * 包含專案的建立、讀取、更新等操作
 */
class ProjectService {
  /**
   * 載入專案列表
   * @param hasPermission 權限檢查函數
   * @returns 專案列表
   */
  static async loadProjects(hasPermission: (permission: string) => boolean): Promise<Project[]> {
    // 檢查是否有查看專案權限
    if (!hasPermission('project:read')) {
      console.warn('用戶沒有查看專案權限');
      throw new Error('權限不足');
    }

    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
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
      };
    }) as Project[];
  }

  /**
   * 建立專案
   * @param projectName 專案名稱
   * @param hasPermission 權限檢查函數
   * @returns 新建立的專案
   */
  static async createProject(
    projectName: string, 
    hasPermission: (permission: string) => boolean
  ): Promise<Project> {
    if (!projectName.trim()) {
      throw new Error('專案名稱不能為空');
    }
    
    // 檢查是否有創建專案權限
    if (!hasPermission('project:write')) {
      console.warn('用戶沒有創建專案權限');
      throw new Error('權限不足');
    }

    const docRef = await addDoc(collection(db, 'projects'), {
      name: projectName.trim(),
      createdAt: new Date().toISOString(),
      packages: [],
    });

    return {
      id: docRef.id,
      name: projectName.trim(),
      description: '',
      createdAt: new Date().toISOString(),
      packages: [],
      completed: 0,
      total: 0,
      progress: 0,
    };
  }

  /**
   * 更新專案 packages
   * @param projectId 專案 ID
   * @param packages 更新的 packages 陣列
   */
  static async updateProjectPackages(projectId: string, packages: Package[]): Promise<void> {
    await updateDoc(doc(db, 'projects', projectId), { packages });
  }

  /**
   * 更新專案
   * @param projectId 專案 ID
   * @param updates 更新的專案資料
   */
  static async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
    await updateDoc(doc(db, 'projects', projectId), updates);
  }

  /**
   * 計算進度百分比
   * @param completed 已完成數量
   * @param total 總數量
   * @returns 進度百分比
   */
  static calculateProgress(completed: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  }

  /**
   * 計算專案總進度
   * @param project 專案物件
   * @returns 進度資訊
   */
  static calculateProjectProgress(project: Project) {
    const totalTasks = project.packages.reduce((total, pkg) => 
      total + pkg.subpackages.reduce((subTotal, sub) => 
        subTotal + sub.taskpackages.length, 0
      ), 0
    );
    const completedTasks = project.packages.reduce((total, pkg) => 
      total + pkg.subpackages.reduce((subTotal, sub) => 
        subTotal + sub.taskpackages.reduce((taskTotal, task) => 
          taskTotal + task.completed, 0
        ), 0
      ), 0
    );
    return {
      completed: completedTasks,
      total: totalTasks,
      progress: this.calculateProgress(completedTasks, totalTasks)
    };
  }

  /**
   * 刪除專案
   * @param projectId 專案 ID
   * @param hasPermission 權限檢查函數
   */
  static async deleteProject(
    projectId: string, 
    hasPermission: (permission: string) => boolean
  ): Promise<void> {
    // 檢查是否有刪除專案權限
    if (!hasPermission('project:delete')) {
      console.warn('用戶沒有刪除專案權限');
      throw new Error('權限不足');
    }

    // 這裡需要實作刪除邏輯，可能需要使用 deleteDoc
    // 暫時拋出錯誤，因為需要實作刪除功能
    throw new Error('刪除專案功能尚未實作');
  }
}

export default ProjectService;
