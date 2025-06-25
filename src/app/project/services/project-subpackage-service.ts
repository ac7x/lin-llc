import type { Project, Package, Subpackage } from '@/app/project/types';
import ProjectService from './project-service';

/**
 * 子工作包服務類別 - 處理子工作包相關的操作
 * 包含子工作包的建立、更新等操作
 */
class SubpackageService {
  /**
   * 新增子工作包
   * @param projectId 專案 ID
   * @param pkgIdx 工作包索引
   * @param subName 子工作包名稱
   * @param projects 專案列表
   * @param hasPermission 權限檢查函數
   * @returns 更新後的專案列表
   */
  static async addSubpackage(
    projectId: string,
    pkgIdx: number,
    subName: string,
    projects: Project[],
    hasPermission: (permission: string) => boolean
  ): Promise<Project[]> {
    if (!subName.trim()) {
      throw new Error('子工作包名稱不能為空');
    }
    
    // 檢查是否有創建子工作包權限
    if (!hasPermission('project:subpackage:create')) {
      console.warn('用戶沒有創建子工作包權限');
      throw new Error('權限不足');
    }

    const project = projects.find(p => p.id === projectId);
    if (!project) {
      throw new Error('專案不存在');
    }

    const updatedPackages = project.packages.map((pkg: Package, idx: number) =>
      idx === pkgIdx
        ? { ...pkg, subpackages: [...pkg.subpackages, { name: subName.trim(), taskpackages: [], completed: 0, total: 0, progress: 0 }] }
        : pkg
    );

    await ProjectService.updateProjectPackages(projectId, updatedPackages);
    
    return projects.map(p => (p.id === projectId ? { ...p, packages: updatedPackages } : p));
  }

  /**
   * 更新子工作包
   * @param projectId 專案 ID
   * @param pkgIdx 工作包索引
   * @param subIdx 子工作包索引
   * @param updatedSubpackage 更新的子工作包資料
   * @param projects 專案列表
   * @returns 更新後的專案列表
   */
  static async updateSubpackage(
    projectId: string,
    pkgIdx: number,
    subIdx: number,
    updatedSubpackage: Subpackage,
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
              j === subIdx ? updatedSubpackage : sub
            )
          }
        : pkg
    );

    await ProjectService.updateProjectPackages(projectId, updatedPackages);
    
    return projects.map(p => (p.id === projectId ? { ...p, packages: updatedPackages } : p));
  }

  /**
   * 刪除子工作包
   * @param projectId 專案 ID
   * @param pkgIdx 工作包索引
   * @param subIdx 子工作包索引
   * @param projects 專案列表
   * @returns 更新後的專案列表
   */
  static async deleteSubpackage(
    projectId: string,
    pkgIdx: number,
    subIdx: number,
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
            subpackages: pkg.subpackages.filter((_, j: number) => j !== subIdx)
          }
        : pkg
    );

    await ProjectService.updateProjectPackages(projectId, updatedPackages);
    
    return projects.map(p => (p.id === projectId ? { ...p, packages: updatedPackages } : p));
  }
}

export default SubpackageService;
