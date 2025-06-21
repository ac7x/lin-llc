import Link from 'next/link';

import type { 
  ProjectDocument, 
  ProjectStatus, 
  ProjectPriority, 
  ProjectRiskLevel, 
  ProjectHealthLevel, 
  ProjectPhase, 
  ProjectType, 
  IssueRecord 
} from '@/types/project';

import { tableStyles, cn } from '@/utils/classNameUtils';

// 狀態標籤組件
const StatusBadge = ({ status }: { status?: ProjectStatus }) => {
  const statusConfig: Record<ProjectStatus, { label: string; className: string }> = {
    planning: {
      label: '規劃中',
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    },
    approved: {
      label: '已核准',
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    },
    'in-progress': {
      label: '執行中',
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    },
    'on-hold': {
      label: '暫停中',
      className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    },
    completed: {
      label: '已完成',
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    },
    cancelled: {
      label: '已取消',
      className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    },
    archived: {
      label: '已封存',
      className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    },
  };

  const config = status ? statusConfig[status] : statusConfig.planning;
  const defaultClass = 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${config?.className || defaultClass}`}>
      {config?.label || status || '-'}
    </span>
  );
};

// 優先級標籤組件
const PriorityBadge = ({ priority }: { priority?: ProjectPriority }) => {
  const priorityConfig: Record<ProjectPriority, { label: string; className: string }> = {
    low: {
      label: '低',
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    },
    medium: {
      label: '中',
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    },
    high: {
      label: '高',
      className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    },
    critical: {
      label: '緊急',
      className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    },
  };

  if (!priority) return <span className='text-gray-400 whitespace-nowrap'>-</span>;

  const config = priorityConfig[priority];
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${config.className}`}>
      {config.label}
    </span>
  );
};

// 風險等級標籤組件
const RiskBadge = ({ riskLevel }: { riskLevel?: ProjectRiskLevel }) => {
  const riskConfig: Record<ProjectRiskLevel, { label: string; className: string }> = {
    low: {
      label: '低風險',
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    },
    medium: {
      label: '中風險',
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    },
    high: {
      label: '高風險',
      className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    },
    critical: {
      label: '極高風險',
      className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    },
  };

  if (!riskLevel) return <span className='text-gray-400 whitespace-nowrap'>-</span>;

  const config = riskConfig[riskLevel];
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${config.className}`}>
      {config.label}
    </span>
  );
};

// 健康度標籤組件
const HealthBadge = ({ healthLevel }: { healthLevel?: ProjectHealthLevel }) => {
  const healthConfig: Record<ProjectHealthLevel, { label: string; className: string; icon: string }> = {
    excellent: {
      label: '優秀',
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      icon: '🟢',
    },
    good: {
      label: '良好',
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      icon: '🔵',
    },
    fair: {
      label: '一般',
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      icon: '🟡',
    },
    poor: {
      label: '不佳',
      className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      icon: '🟠',
    },
    critical: {
      label: '危急',
      className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      icon: '🔴',
    },
  };

  if (!healthLevel) return <span className='text-gray-400 whitespace-nowrap'>-</span>;

  const config = healthConfig[healthLevel];
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 whitespace-nowrap ${config.className}`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
};

// 階段標籤組件
const PhaseBadge = ({ phase }: { phase?: ProjectPhase }) => {
  const phaseConfig: Record<ProjectPhase, { label: string; className: string }> = {
    initiation: {
      label: '啟動',
      className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    },
    planning: {
      label: '規劃',
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    },
    execution: {
      label: '執行',
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    },
    monitoring: {
      label: '監控',
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    },
    closure: {
      label: '收尾',
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    },
  };

  if (!phase) return <span className='text-gray-400 whitespace-nowrap'>-</span>;

  const config = phaseConfig[phase];
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${config.className}`}>
      {config.label}
    </span>
  );
};

// 進度條組件
const ProgressBar = ({ progress }: { progress?: number }) => {
  const percentage = progress || 0;
  const getColorClass = (percent: number) => {
    if (percent >= 80) return 'bg-green-500';
    if (percent >= 60) return 'bg-yellow-500';
    if (percent >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className='flex items-center space-x-2 whitespace-nowrap'>
      <div className='w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getColorClass(percentage)}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className='text-xs text-gray-600 dark:text-gray-400 min-w-[2rem]'>
        {percentage}%
      </span>
    </div>
  );
};

// 品質評分組件
const QualityScore = ({ score }: { score?: number }) => {
  if (!score) return <span className='text-gray-400 whitespace-nowrap'>-</span>;
  
  const getColorClass = (s: number) => {
    if (s >= 8) return 'text-green-600 dark:text-green-400';
    if (s >= 6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <span className={`font-medium whitespace-nowrap ${getColorClass(score)}`}>
      {score}/10
    </span>
  );
};

// 預算顯示組件
const BudgetDisplay = ({ budget }: { budget?: number }) => {
  if (!budget) return <span className='text-gray-400 whitespace-nowrap'>-</span>;
  
  return (
    <span className='text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap'>
      ${budget.toLocaleString()}
    </span>
  );
};

// 專案類型標籤組件
const ProjectTypeBadge = ({ projectType }: { projectType?: ProjectType }) => {
  const typeConfig: Record<ProjectType, { label: string; className: string }> = {
    system: {
      label: '系統',
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    },
    maintenance: {
      label: '維護',
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    },
    transport: {
      label: '搬運',
      className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    },
  };

  if (!projectType) return <span className='text-gray-400 whitespace-nowrap'>-</span>;

  const config = typeConfig[projectType];
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${config.className}`}>
      {config.label}
    </span>
  );
};

type ProjectsTableProps = {
  projects: ProjectDocument[];
  showAdvancedColumns?: boolean;
};

export function ProjectsTable({ projects, showAdvancedColumns = false }: ProjectsTableProps) {
  if (projects.length === 0) {
    return <div className='px-4 py-8 text-center text-gray-500 dark:text-gray-400'>尚無專案</div>;
  }

  return (
    <div className='overflow-x-auto'>
      <table className={tableStyles.table}>
        <thead className={tableStyles.thead}>
          <tr>
            <th className={cn(tableStyles.th, 'whitespace-nowrap')}>
              序號
            </th>
            <th className={cn(tableStyles.th, 'whitespace-normal')}>
              專案名稱
            </th>
            <th className={cn(tableStyles.th, 'whitespace-normal')}>
              合約ID
            </th>
            <th className={cn(tableStyles.th, 'whitespace-nowrap')}>
              狀態
            </th>
            <th className={cn(tableStyles.th, 'whitespace-nowrap')}>
              進度
            </th>
            {showAdvancedColumns && (
              <>
                <th className={cn(tableStyles.th, 'whitespace-nowrap')}>
                  類型
                </th>
                <th className={cn(tableStyles.th, 'whitespace-nowrap')}>
                  優先級
                </th>
                <th className={cn(tableStyles.th, 'whitespace-nowrap')}>
                  風險等級
                </th>
                <th className={cn(tableStyles.th, 'whitespace-nowrap')}>
                  健康度
                </th>
                <th className={cn(tableStyles.th, 'whitespace-nowrap')}>
                  階段
                </th>
                <th className={cn(tableStyles.th, 'whitespace-nowrap')}>
                  品質評分
                </th>
                <th className={cn(tableStyles.th, 'whitespace-nowrap')}>
                  預算
                </th>
                <th className={cn(tableStyles.th, 'whitespace-nowrap')}>
                  品質問題
                </th>
              </>
            )}
            <th className={cn(tableStyles.th, 'whitespace-nowrap')}>
              建立日期
            </th>
            <th className={cn(tableStyles.th, 'whitespace-nowrap')}>
              操作
            </th>
          </tr>
        </thead>
        <tbody className={tableStyles.tbody}>
          {projects.map((project) => (
            <tr key={project.id} className='hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200'>
              <td className={cn(tableStyles.td, 'whitespace-nowrap')}>
                {project.idx}
              </td>
              <td className={cn(tableStyles.td, 'whitespace-normal')}>
                <Link
                  href={`/projects/${project.id}`}
                  className='font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200'
                >
                  {project.projectName}
                </Link>
              </td>
              <td className={cn(tableStyles.td, 'whitespace-normal')}>
                {project.contractId || '-'}
              </td>
              <td className={cn(tableStyles.td, 'whitespace-nowrap')}>
                <StatusBadge status={project.status} />
              </td>
              <td className={cn(tableStyles.td, 'whitespace-nowrap')}>
                <ProgressBar progress={project.progress} />
              </td>
              {showAdvancedColumns && (
                <>
                  <td className={cn(tableStyles.td, 'whitespace-nowrap')}>
                    <ProjectTypeBadge projectType={project.projectType} />
                  </td>
                  <td className={cn(tableStyles.td, 'whitespace-nowrap')}>
                    <PriorityBadge priority={project.priority} />
                  </td>
                  <td className={cn(tableStyles.td, 'whitespace-nowrap')}>
                    <RiskBadge riskLevel={project.riskLevel} />
                  </td>
                  <td className={cn(tableStyles.td, 'whitespace-nowrap')}>
                    <HealthBadge healthLevel={project.healthLevel} />
                  </td>
                  <td className={cn(tableStyles.td, 'whitespace-nowrap')}>
                    <PhaseBadge phase={project.phase} />
                  </td>
                  <td className={cn(tableStyles.td, 'whitespace-nowrap')}>
                    <QualityScore score={project.qualityScore} />
                  </td>
                  <td className={cn(tableStyles.td, 'whitespace-nowrap')}>
                    <BudgetDisplay budget={project.estimatedBudget} />
                  </td>
                  <td className={cn(tableStyles.td, 'whitespace-nowrap')}>
                    {/* 品質問題數量 - 只計算未解決的品質/進度問題 */}
                    {(() => {
                      const issues = (project.issues || []) as IssueRecord[];
                      const qualityOrProgressIssues = issues.filter((issue: IssueRecord) => 
                        (issue.type === 'quality' || issue.type === 'progress') && issue.status !== 'resolved'
                      );
                      return qualityOrProgressIssues.length > 0 ? (
                        <span className='text-orange-600 dark:text-orange-400 font-bold'>
                          {qualityOrProgressIssues.length}
                        </span>
                      ) : (
                        <span className='text-gray-400'>0</span>
                      );
                    })()}
                  </td>
                </>
              )}
              <td className={cn(tableStyles.td, 'whitespace-nowrap')}>
                {project.createdAt}
              </td>
              <td className={cn(tableStyles.td, 'whitespace-nowrap')}>
                <div className='flex items-center space-x-2'>
                  <Link
                    href={`/projects/${project.id}`}
                    className='text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium transition-colors duration-200'
                  >
                    查看
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

