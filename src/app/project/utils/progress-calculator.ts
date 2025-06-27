/**
 * 專案進度計算工具函數
 * 實現階層式的進度計算邏輯：任務包 -> 子工作包 -> 工作包 -> 專案
 */

import { Project, Package, SubPackage, TaskPackage } from '../types';

/**
 * 進度計算結果介面
 */
export interface ProgressResult {
  completed: number;    // 已完成數量
  total: number;        // 總數量
  progress: number;     // 進度百分比 (0-100)
}

/**
 * 安全的百分比計算函數
 * @param completed 已完成數量
 * @param total 總數量
 * @returns 百分比 (0-100)，總數為0時返回0
 */
export function calculatePercentage(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

/**
 * 計算任務包進度
 * 基礎計算：只有審核通過的任務才計算為已完成
 * @param taskPackage 任務包物件
 * @returns 進度計算結果
 */
export function calculateTaskPackageProgress(taskPackage: TaskPackage): ProgressResult {
  const total = taskPackage.total || 0;
  // 只有審核通過的任務才算已完成
  const completed = taskPackage.status === 'approved' ? (taskPackage.completed || 0) : 0;
  const progress = calculatePercentage(completed, total);

  return {
    completed,
    total,
    progress,
  };
}

/**
 * 計算子工作包進度
 * 邏輯：該子工作包下所有任務包的已完成數量加總 / 所有任務包的總數量加總 = 百分比
 * 只有審核通過的任務才計入已完成數量
 * @param subpackage 子工作包物件
 * @returns 進度計算結果
 */
export function calculateSubpackageProgress(subpackage: SubPackage): ProgressResult {
  const taskPackages = subpackage.taskpackages || [];
  
  // 如果沒有任務包，返回預設值
  if (taskPackages.length === 0) {
    return { completed: 0, total: 0, progress: 0 };
  }

  // 計算所有任務包的已完成數量和總數量（只有審核通過的任務才算已完成）
  const totalCompleted = taskPackages.reduce((sum, task) => {
    const taskCompleted = task.status === 'approved' ? (task.completed || 0) : 0;
    return sum + taskCompleted;
  }, 0);
  const totalAmount = taskPackages.reduce((sum, task) => sum + (task.total || 0), 0);
  const progress = calculatePercentage(totalCompleted, totalAmount);

  return {
    completed: totalCompleted,
    total: totalAmount,
    progress,
  };
}

/**
 * 計算工作包進度
 * 邏輯：該工作包下所有子工作包的已完成數量加總 / 所有子工作包的總數量加總 = 百分比
 * @param package_ 工作包物件
 * @returns 進度計算結果
 */
export function calculatePackageProgress(package_: Package): ProgressResult {
  const subpackages = package_.subpackages || [];
  
  // 如果沒有子工作包，返回預設值
  if (subpackages.length === 0) {
    return { completed: 0, total: 0, progress: 0 };
  }

  // 計算所有子工作包的進度，然後加總其已完成數量和總數量
  let totalCompleted = 0;
  let totalAmount = 0;

  subpackages.forEach(subpackage => {
    const subProgress = calculateSubpackageProgress(subpackage);
    totalCompleted += subProgress.completed;
    totalAmount += subProgress.total;
  });

  const progress = calculatePercentage(totalCompleted, totalAmount);

  return {
    completed: totalCompleted,
    total: totalAmount,
    progress,
  };
}

/**
 * 計算專案進度
 * 邏輯：該專案下所有工作包的已完成數量加總 / 所有工作包的總數量加總 = 百分比
 * @param project 專案物件
 * @returns 進度計算結果
 */
export function calculateProjectProgress(project: Project): ProgressResult {
  const packages = project.packages || [];
  
  // 如果沒有工作包，返回預設值
  if (packages.length === 0) {
    return { completed: 0, total: 0, progress: 0 };
  }

  // 計算所有工作包的進度，然後加總其已完成數量和總數量
  let totalCompleted = 0;
  let totalAmount = 0;

  packages.forEach(package_ => {
    const packageProgress = calculatePackageProgress(package_);
    totalCompleted += packageProgress.completed;
    totalAmount += packageProgress.total;
  });

  const progress = calculatePercentage(totalCompleted, totalAmount);

  return {
    completed: totalCompleted,
    total: totalAmount,
    progress,
  };
}

/**
 * 計算專案統計資訊
 * @param project 專案物件
 * @returns 專案統計資訊
 */
export function calculateProjectStatistics(project: Project) {
  const packages = project.packages || [];
  
  // 計算各層級數量
  const packageCount = packages.length;
  const subpackageCount = packages.reduce((total, pkg) => 
    total + (pkg.subpackages?.length || 0), 0
  );
  const taskCount = packages.reduce((total, pkg) => 
    total + (pkg.subpackages?.reduce((subTotal, sub) => 
      subTotal + (sub.taskpackages?.length || 0), 0
    ) || 0), 0
  );

  // 計算進度
  const progress = calculateProjectProgress(project);

  return {
    packageCount,
    subpackageCount,
    taskCount,
    ...progress,
  };
}

/**
 * 批量更新專案中所有層級的進度
 * @param project 專案物件
 * @returns 更新進度後的專案物件
 */
export function updateAllProgress(project: Project): Project {
  const updatedProject: Project = {
    ...project,
    packages: project.packages?.map(package_ => {
      const updatedSubpackages = package_.subpackages?.map(subpackage => {
        const updatedTaskPackages = subpackage.taskpackages?.map(task => {
          const taskProgress = calculateTaskPackageProgress(task);
          return {
            ...task,
            ...taskProgress,
          };
        }) || [];

        const subpackageProgress = calculateSubpackageProgress({
          ...subpackage,
          taskpackages: updatedTaskPackages,
        });

        return {
          ...subpackage,
          taskpackages: updatedTaskPackages,
          ...subpackageProgress,
        };
      }) || [];

      const packageProgress = calculatePackageProgress({
        ...package_,
        subpackages: updatedSubpackages,
      });

      return {
        ...package_,
        subpackages: updatedSubpackages,
        ...packageProgress,
      };
    }) || [],
  };

  // 更新專案進度
  const projectProgress = calculateProjectProgress(updatedProject);
  return {
    ...updatedProject,
    ...projectProgress,
  };
}

/**
 * 驗證進度資料的一致性
 * @param project 專案物件
 * @returns 驗證結果和錯誤訊息
 */
export function validateProgress(project: Project): { 
  isValid: boolean; 
  errors: string[]; 
} {
  const errors: string[] = [];

  // 檢查專案層級
  const calculatedProjectProgress = calculateProjectProgress(project);
  if (project.progress !== calculatedProjectProgress.progress) {
    errors.push(`專案進度不一致：儲存值 ${project.progress}%，計算值 ${calculatedProjectProgress.progress}%`);
  }

  // 檢查工作包層級
  project.packages?.forEach((package_, pkgIdx) => {
    const calculatedPackageProgress = calculatePackageProgress(package_);
    if (package_.progress !== calculatedPackageProgress.progress) {
      errors.push(`工作包[${pkgIdx}] "${package_.name}" 進度不一致：儲存值 ${package_.progress}%，計算值 ${calculatedPackageProgress.progress}%`);
    }

    // 檢查子工作包層級
    package_.subpackages?.forEach((subpackage, subIdx) => {
      const calculatedSubProgress = calculateSubpackageProgress(subpackage);
      if (subpackage.progress !== calculatedSubProgress.progress) {
        errors.push(`子工作包[${pkgIdx}][${subIdx}] "${subpackage.name}" 進度不一致：儲存值 ${subpackage.progress}%，計算值 ${calculatedSubProgress.progress}%`);
      }

      // 檢查任務包層級
      subpackage.taskpackages?.forEach((task, taskIdx) => {
        const calculatedTaskProgress = calculateTaskPackageProgress(task);
        if (task.progress !== calculatedTaskProgress.progress) {
          errors.push(`任務包[${pkgIdx}][${subIdx}][${taskIdx}] "${task.name}" 進度不一致：儲存值 ${task.progress}%，計算值 ${calculatedTaskProgress.progress}%`);
        }
      });
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
} 