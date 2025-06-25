import type { Project, Package } from '@/app/project/types';
import ProjectService from './project-service';

/**
 * 工作包服務類別 - 處理工作包相關的操作
 * 包含工作包的建立、更新等操作
 */
class PackageService {
  /**
   * 新增工作包
   * @param projectId 專案 ID
   * @param pkgName 工作包名稱
   * @param projects 專案列表
   * @param hasPermission 權限檢查函數
   * @returns 更新後的專案列表
   */
  static async addPackage(
    projectId: string, 
    pkgName: string, 
    projects: Project[],
    hasPermission: (permission: string) => boolean
  ): Promise<Project[]> {
    if (!pkgName.trim()) {
      throw new Error('工作包名稱不能為空');
    }
    
    // 檢查是否有創建工作包權限
    if (!hasPermission('project:package:create')) {
      console.warn('用戶沒有創建工作包權限');
      throw new Error('權限不足');
    }

    const project = projects.find(p => p.id === projectId);
    if (!project) {
      throw new Error('專案不存在');
    }

    const updatedPackages = [
      ...project.packages,
      { name: pkgName.trim(), subpackages: [], completed: 0, total: 0, progress: 0 }
    ];

    await ProjectService.updateProjectPackages(projectId, updatedPackages);
    
    return projects.map(p => (p.id === projectId ? { ...p, packages: updatedPackages } : p));
  }

  /**
   * 更新工作包
   * @param projectId 專案 ID
   * @param packageIndex 工作包索引
   * @param updatedPackage 更新的工作包資料
   * @param projects 專案列表
   * @returns 更新後的專案列表
   */
  static async updatePackage(
    projectId: string,
    packageIndex: number,
    updatedPackage: Package,
    projects: Project[]
  ): Promise<Project[]> {
    const project = projects.find(p => p.id === projectId);
    if (!project) {
      throw new Error('專案不存在');
    }

    const updatedPackages = project.packages.map((pkg, idx) =>
      idx === packageIndex ? updatedPackage : pkg
    );

    await ProjectService.updateProjectPackages(projectId, updatedPackages);
    
    return projects.map(p => (p.id === projectId ? { ...p, packages: updatedPackages } : p));
  }

  /**
   * 刪除工作包
   * @param projectId 專案 ID
   * @param packageIndex 工作包索引
   * @param projects 專案列表
   * @returns 更新後的專案列表
   */
  static async deletePackage(
    projectId: string,
    packageIndex: number,
    projects: Project[]
  ): Promise<Project[]> {
    const project = projects.find(p => p.id === projectId);
    if (!project) {
      throw new Error('專案不存在');
    }

    const updatedPackages = project.packages.filter((_, idx) => idx !== packageIndex);

    await ProjectService.updateProjectPackages(projectId, updatedPackages);
    
    return projects.map(p => (p.id === projectId ? { ...p, packages: updatedPackages } : p));
  }
}

export default PackageService;
