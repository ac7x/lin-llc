import type { Project } from '@/app/project/types';

/**
 * 計算進度百分比
 * @param completed 已完成數量
 * @param total 總數量
 * @returns 進度百分比 (0-100)
 */
export const calculateProgress = (completed: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
};

/**
 * 計算專案總進度
 * @param project 專案物件
 * @returns 專案進度資訊
 */
export const calculateProjectProgress = (project: Project) => {
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
    progress: calculateProgress(completedTasks, totalTasks)
  };
};

/**
 * 計算工作包進度
 * @param packages 工作包陣列
 * @returns 工作包進度資訊
 */
export const calculatePackageProgress = (packages: any[]) => {
  const totalTasks = packages.reduce((total, pkg) => 
    total + pkg.subpackages.reduce((subTotal: number, sub: any) => 
      subTotal + sub.taskpackages.length, 0
    ), 0
  );
  const completedTasks = packages.reduce((total, pkg) => 
    total + pkg.subpackages.reduce((subTotal: number, sub: any) => 
      subTotal + sub.taskpackages.reduce((taskTotal: number, task: any) => 
        taskTotal + task.completed, 0
      ), 0
    ), 0
  );
  return {
    completed: completedTasks,
    total: totalTasks,
    progress: calculateProgress(completedTasks, totalTasks)
  };
}; 