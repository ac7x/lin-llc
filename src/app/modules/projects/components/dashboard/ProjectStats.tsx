import { projectStyles } from '../../styles';

interface ProjectStatsProps {
  stats?: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    onHoldProjects: number;
    planningProjects?: number;
    overdueProjects: number;
    totalQualityIssues: number;
    averageQualityScore: number;
  };
}

export default function ProjectStats({ stats }: ProjectStatsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-4 mb-6">
        {[...Array(7)].map((_, i) => (
          <div key={i} className={`${projectStyles.card.stats} animate-pulse`}>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 mb-6">
      <div className={`${projectStyles.card.stats} ${projectStyles.card.statsColors.blue}`}>
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalProjects}</div>
        <div className="text-sm text-blue-600 dark:text-blue-400">總專案數</div>
      </div>
      <div className={`${projectStyles.card.stats} ${projectStyles.card.statsColors.indigo}`}>
        <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.planningProjects || 0}</div>
        <div className="text-sm text-indigo-600 dark:text-indigo-400">規劃中</div>
      </div>
      <div className={`${projectStyles.card.stats} ${projectStyles.card.statsColors.yellow}`}>
        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.activeProjects}</div>
        <div className="text-sm text-yellow-600 dark:text-yellow-400">執行中</div>
      </div>
      <div className={`${projectStyles.card.stats} ${projectStyles.card.statsColors.green}`}>
        <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completedProjects}</div>
        <div className="text-sm text-green-600 dark:text-green-400">已完成</div>
      </div>
      <div className={`${projectStyles.card.stats} ${projectStyles.card.statsColors.orange}`}>
        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.onHoldProjects}</div>
        <div className="text-sm text-orange-600 dark:text-orange-400">暫停中</div>
      </div>
      <div className={`${projectStyles.card.stats} ${projectStyles.card.statsColors.red}`}>
        <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.overdueProjects}</div>
        <div className="text-sm text-red-600 dark:text-red-400">逾期專案</div>
      </div>
      <div className={`${projectStyles.card.stats} ${projectStyles.card.statsColors.pink}`}>
        <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">{stats.totalQualityIssues}</div>
        <div className="text-sm text-pink-600 dark:text-pink-400">品質問題</div>
      </div>
      <div className={`${projectStyles.card.stats} ${projectStyles.card.statsColors.indigo}`}>
        <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.averageQualityScore}</div>
        <div className="text-sm text-indigo-600 dark:text-indigo-400">平均品質</div>
      </div>
    </div>
  );
} 