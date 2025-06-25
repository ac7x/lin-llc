import type { Project, Package, Subpackage, TaskPackage } from '@/app/project/types';
import ProjectService from './project-service';

/**
 * 任務服務類別 - 處理任務相關的操作
 * 包含任務的建立、更新等操作
 */
class TaskService {
  /**
   * 新增任務包
   * @param projectId 專案 ID
   * @param pkgIdx 工作包索引
   * @param subIdx 子工作包索引
   * @param taskPackageName 任務包名稱
   * @param projects 專案列表
   * @param hasPermission 權限檢查函數
   * @returns 更新後的專案列表
   */
  static async addTaskPackage(
    projectId: string,
    pkgIdx: number,
    subIdx: number,
    taskPackageName: string,
    projects: Project[],
    hasPermission: (permission: string) => boolean
  ): Promise<Project[]> {
    if (!taskPackageName.trim()) {
      throw new Error('任務包名稱不能為空');
    }
    
    // 檢查是否有創建任務權限
    if (!hasPermission('project:task:create')) {
      console.warn('用戶沒有創建任務權限');
      throw new Error('權限不足');
    }

    const project = projects.find(p => p.id === projectId);
    if (!project) {
      throw new Error('專案不存在');
    }

    const updatedPackages = project.packages.map((pkg: Package, i: number) =>
      i === pkgIdx
        ? {
            ...pkg,
            subpackages: pkg.subpackages.map((sub: Subpackage, j: number) =>
              j === subIdx
                ? { ...sub, taskpackages: [...sub.taskpackages, { name: taskPackageName.trim(), completed: 0, total: 0, progress: 0 }] }
                : sub
            )
          }
        : pkg
    );

    await ProjectService.updateProjectPackages(projectId, updatedPackages);
    
    return projects.map(p => (p.id === projectId ? { ...p, packages: updatedPackages } : p));
  }

  /**
   * 更新任務包
   * @param projectId 專案 ID
   * @param pkgIdx 工作包索引
   * @param subIdx 子工作包索引
   * @param taskIdx 任務索引
   * @param updatedTask 更新的任務資料
   * @param projects 專案列表
   * @returns 更新後的專案列表
   */
  static async updateTaskPackage(
    projectId: string,
    pkgIdx: number,
    subIdx: number,
    taskIdx: number,
    updatedTask: TaskPackage,
    projects: Project[]
  ): Promise<Project[]> {
    const project = projects.find(p => p.id === projectId);
    if (!project) {
      throw new Error('專案不存在');
    }

    const updatedPackages = project.packages.map((pkg: Package, i: number) =>
      i === pkgIdx
        ? {
            ...pkg,
            subpackages: pkg.subpackages.map((sub: Subpackage, j: number) =>
              j === subIdx
                ? {
                    ...sub,
                    taskpackages: sub.taskpackages.map((task: TaskPackage, k: number) =>
                      k === taskIdx ? updatedTask : task
                    )
                  }
                : sub
            )
          }
        : pkg
    );

    await ProjectService.updateProjectPackages(projectId, updatedPackages);
    
    return projects.map(p => (p.id === projectId ? { ...p, packages: updatedPackages } : p));
  }

  /**
   * 刪除任務包
   * @param projectId 專案 ID
   * @param pkgIdx 工作包索引
   * @param subIdx 子工作包索引
   * @param taskIdx 任務索引
   * @param projects 專案列表
   * @returns 更新後的專案列表
   */
  static async deleteTaskPackage(
    projectId: string,
    pkgIdx: number,
    subIdx: number,
    taskIdx: number,
    projects: Project[]
  ): Promise<Project[]> {
    const project = projects.find(p => p.id === projectId);
    if (!project) {
      throw new Error('專案不存在');
    }

    const updatedPackages = project.packages.map((pkg: Package, i: number) =>
      i === pkgIdx
        ? {
            ...pkg,
            subpackages: pkg.subpackages.map((sub: Subpackage, j: number) =>
              j === subIdx
                ? {
                    ...sub,
                    taskpackages: sub.taskpackages.filter((_, k: number) => k !== taskIdx)
                  }
                : sub
            )
          }
        : pkg
    );

    await ProjectService.updateProjectPackages(projectId, updatedPackages);
    
    return projects.map(p => (p.id === projectId ? { ...p, packages: updatedPackages } : p));
  }

  /**
   * 更新任務進度
   * @param projectId 專案 ID
   * @param pkgIdx 工作包索引
   * @param subIdx 子工作包索引
   * @param taskIdx 任務索引
   * @param completed 已完成數量
   * @param total 總數量
   * @param projects 專案列表
   * @returns 更新後的專案列表
   */
  static async updateTaskProgress(
    projectId: string,
    pkgIdx: number,
    subIdx: number,
    taskIdx: number,
    completed: number,
    total: number,
    projects: Project[]
  ): Promise<Project[]> {
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
    
    const updatedTask: TaskPackage = {
      name: '', // 這個會在更新時被覆蓋
      completed,
      total,
      progress,
    };

    return this.updateTaskPackage(projectId, pkgIdx, subIdx, taskIdx, updatedTask, projects);
  }
}

export default TaskService;
