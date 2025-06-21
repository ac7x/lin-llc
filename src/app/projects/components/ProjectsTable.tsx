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
} from '@/app/projects/types/project';
import { 
  cn, 
  tableStyles, 
  progressStyles,
  getStatusBadgeStyle,
  getProgressColor,
  getQualityColor
} from '@/utils/classNameUtils';

// 狀態標籤組件 - 大幅簡化
const StatusBadge = ({ status }: { status?: ProjectStatus }) => {
  if (!status) return <span className='text-gray-400 whitespace-nowrap'>-</span>;
  
  const statusLabels: Record<ProjectStatus, string> = {
    planning: '規劃中',
    approved: '已核准',
    'in-progress': '執行中',
    'on-hold': '暫停中',
    completed: '已完成',
    cancelled: '已取消',
    archived: '已封存',
  };

  return (
    <span className={getStatusBadgeStyle(status, 'projectStatus')}>
      {statusLabels[status]}
    </span>
  );
};

// 優先級標籤組件 - 大幅簡化
const PriorityBadge = ({ priority }: { priority?: ProjectPriority }) => {
  if (!priority) return <span className='text-gray-400 whitespace-nowrap'>-</span>;
  
  const priorityLabels: Record<ProjectPriority, string> = {
    low: '低',
    medium: '中',
    high: '高',
    critical: '緊急',
  };

  return (
    <span className={getStatusBadgeStyle(priority, 'priority')}>
      {priorityLabels[priority]}
    </span>
  );
};

// 風險等級標籤組件 - 大幅簡化
const RiskBadge = ({ riskLevel }: { riskLevel?: ProjectRiskLevel }) => {
  if (!riskLevel) return <span className='text-gray-400 whitespace-nowrap'>-</span>;
  
  const riskLabels: Record<ProjectRiskLevel, string> = {
    low: '低風險',
    medium: '中風險',
    high: '高風險',
    critical: '極高風險',
  };

  return (
    <span className={getStatusBadgeStyle(riskLevel, 'riskLevel')}>
      {riskLabels[riskLevel]}
    </span>
  );
};

// 健康度標籤組件 - 大幅簡化
const HealthBadge = ({ healthLevel }: { healthLevel?: ProjectHealthLevel }) => {
  if (!healthLevel) return <span className='text-gray-400 whitespace-nowrap'>-</span>;
  
  const healthConfig: Record<ProjectHealthLevel, { label: string; icon: string }> = {
    excellent: { label: '優秀', icon: '🟢' },
    good: { label: '良好', icon: '🔵' },
    fair: { label: '一般', icon: '🟡' },
    poor: { label: '不佳', icon: '🟠' },
    critical: { label: '危急', icon: '🔴' },
  };

  const config = healthConfig[healthLevel];

  return (
    <span className={cn(getStatusBadgeStyle(healthLevel, 'healthLevel'), 'flex items-center gap-1')}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
};

// 階段標籤組件 - 大幅簡化
const PhaseBadge = ({ phase }: { phase?: ProjectPhase }) => {
  if (!phase) return <span className='text-gray-400 whitespace-nowrap'>-</span>;
  
  const phaseLabels: Record<ProjectPhase, string> = {
    initiation: '啟動',
    planning: '規劃',
    execution: '執行',
    monitoring: '監控',
    closure: '收尾',
  };

  return (
    <span className={getStatusBadgeStyle(phase, 'phase')}>
      {phaseLabels[phase]}
    </span>
  );
};

// 進度條組件 - 大幅簡化
const ProgressBar = ({ progress }: { progress?: number }) => {
  const percentage = progress || 0;

  return (
    <div className='flex items-center space-x-2 whitespace-nowrap'>
      <div className={progressStyles.container}>
        <div
          className={cn(progressStyles.bar, getProgressColor(percentage, 'bar'))}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className='text-xs text-gray-600 dark:text-gray-400 min-w-[2rem]'>
        {percentage}%
      </span>
    </div>
  );
};

// 品質評分組件 - 大幅簡化
const QualityScore = ({ score }: { score?: number }) => {
  if (!score) return <span className='text-gray-400 whitespace-nowrap'>-</span>;
  
  return (
    <span className={cn('font-medium whitespace-nowrap', getQualityColor(score))}>
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

// 專案類型標籤組件 - 大幅簡化
const ProjectTypeBadge = ({ projectType }: { projectType?: ProjectType }) => {
  if (!projectType) return <span className='text-gray-400 whitespace-nowrap'>-</span>;
  
  const typeLabels: Record<ProjectType, string> = {
    system: '系統',
    maintenance: '維護',
    transport: '搬運',
  };

  return (
    <span className={getStatusBadgeStyle(projectType, 'projectType')}>
      {typeLabels[projectType]}
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
            <tr key={project.id} className={cn(tableStyles.rowHover)}>
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

