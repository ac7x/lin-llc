import { projectStyles } from '../../styles';
import type { Project } from '@/app/modules/test-projects/types';

interface ProjectDashboardProps {
  project?: Pick<Project, 'id' | 'projectName' | 'status' | 'progress'>;
}

export default function ProjectDashboard({ project }: ProjectDashboardProps) {
  if (!project) {
    return (
      <div className={projectStyles.card.base}>
        <div className="text-center py-8">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <p className="text-gray-500 dark:text-gray-400">請選擇專案以查看儀表板</p>
        </div>
      </div>
    );
  }

  // 狀態顯示處理
  const statusText = Array.isArray(project.status)
    ? project.status.join('、')
    : project.status;

  return (
    <div className="space-y-6">
      {/* 專案概覽 */}
      <div className={projectStyles.card.base}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {project.projectName}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              專案狀態: {statusText}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded-full">
              {statusText}
            </span>
          </div>
        </div>
      </div>

      {/* 關鍵指標 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={projectStyles.card.stats}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">整體進度</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {project.progress || 0}%
              </p>
            </div>
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 text-xl">📊</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${project.progress || 0}%` }}
              />
            </div>
          </div>
        </div>

        <div className={projectStyles.card.stats}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">品質評分</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">8/10</p>
            </div>
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <span className="text-green-600 dark:text-green-400 text-xl">⭐</span>
            </div>
          </div>
        </div>

        <div className={projectStyles.card.stats}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">時程績效</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">1.2</p>
            </div>
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
              <span className="text-yellow-600 dark:text-yellow-400 text-xl">⏰</span>
            </div>
          </div>
        </div>

        <div className={projectStyles.card.stats}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">成本績效</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">0.95</p>
            </div>
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
              <span className="text-purple-600 dark:text-purple-400 text-xl">💰</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 