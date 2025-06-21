/**
 * 專案儀表板組件
 * 
 * 提供專業化的專案概覽，包含：
 * - 專案關鍵指標 (KPI)
 * - 進度追蹤
 * - 風險監控
 * - 品質分析
 * - 財務績效
 * - 里程碑管理
 */

'use client';

import { useMemo } from 'react';

import type { Project } from '@/app/projects/types/project';
import { ProgressBarWithPercent, ProjectHealthIndicator } from '@/app/projects/utils/progressUtils';
import { cn } from '@/utils/classNameUtils';
import {
  calculateProjectProgress,
  calculateProjectQualityScore,
  calculateSchedulePerformanceIndex,
  calculateCostPerformanceIndex,
  getUpcomingMilestones,
  getOverdueMilestones,
  analyzeProjectStatusTrend,
} from '../utils/projectUtils';

interface ProjectDashboardProps {
  project: Project;
}

export default function ProjectDashboard({ project }: ProjectDashboardProps) {
  const progress = useMemo(() => calculateProjectProgress(project), [project]);
  const qualityScore = useMemo(() => calculateProjectQualityScore(project), [project]);
  const spi = useMemo(() => calculateSchedulePerformanceIndex(project), [project]);
  const cpi = useMemo(() => calculateCostPerformanceIndex(project), [project]);
  const statusTrend = useMemo(() => analyzeProjectStatusTrend(project), [project]);
  const upcomingMilestones = useMemo(() => getUpcomingMilestones(project.milestones || []), [project.milestones]);
  const overdueMilestones = useMemo(() => getOverdueMilestones(project.milestones || []), [project.milestones]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'on-hold': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      default: return '➡️';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600 dark:text-green-400';
      case 'declining': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className='space-y-6'>
      {/* 專案概覽 */}
      <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
        <div className='flex justify-between items-start mb-4'>
          <div>
            <h2 className='text-xl font-bold text-gray-900 dark:text-gray-100'>
              {project.projectName}
            </h2>
            <p className='text-gray-600 dark:text-gray-400 mt-1'>
              合約ID: {project.contractId || '未指定'}
            </p>
          </div>
          <div className={cn('flex items-center space-x-3')}>
            <span className={cn('px-3 py-1 rounded-full text-sm font-medium', getStatusColor(project.status))}>
              {project.status === 'planning' && '規劃中'}
              {project.status === 'approved' && '已核准'}
              {project.status === 'in-progress' && '執行中'}
              {project.status === 'on-hold' && '暫停中'}
              {project.status === 'completed' && '已完成'}
              {project.status === 'cancelled' && '已取消'}
              {project.status === 'archived' && '已封存'}
            </span>
            <ProjectHealthIndicator project={project} />
          </div>
        </div>

        {/* 狀態趨勢 */}
        <div className={cn('flex items-center space-x-2 text-sm', getTrendColor(statusTrend.trend))}>
          <span>{getTrendIcon(statusTrend.trend)}</span>
          <span className={cn('font-medium')}>
            {statusTrend.trend === 'improving' && '專案狀態改善中'}
            {statusTrend.trend === 'declining' && '專案狀態需關注'}
            {statusTrend.trend === 'stable' && '專案狀態穩定'}
          </span>
        </div>
      </div>

      {/* 關鍵指標 */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>整體進度</p>
              <p className='text-2xl font-bold text-gray-900 dark:text-gray-100'>{progress}%</p>
            </div>
            <div className='w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center'>
              <span className='text-blue-600 dark:text-blue-400 text-xl'>📊</span>
            </div>
          </div>
          <div className='mt-4'>
            <ProgressBarWithPercent progress={progress} size='small' />
          </div>
        </div>

        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>品質評分</p>
              <p className='text-2xl font-bold text-gray-900 dark:text-gray-100'>{qualityScore}/10</p>
            </div>
            <div className='w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center'>
              <span className='text-green-600 dark:text-green-400 text-xl'>⭐</span>
            </div>
          </div>
          <div className={cn('mt-4')}>
            <div className={cn('flex space-x-1')}>
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-3 h-3 rounded-full',
                    i < qualityScore ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>時程績效</p>
              <p className='text-2xl font-bold text-gray-900 dark:text-gray-100'>{spi.toFixed(2)}</p>
            </div>
            <div className='w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center'>
              <span className='text-yellow-600 dark:text-yellow-400 text-xl'>⏰</span>
            </div>
          </div>
          <div className='mt-4'>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              {spi >= 1.0 ? '進度超前' : spi >= 0.9 ? '進度正常' : '進度落後'}
            </p>
          </div>
        </div>

        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>成本績效</p>
              <p className='text-2xl font-bold text-gray-900 dark:text-gray-100'>{cpi.toFixed(2)}</p>
            </div>
            <div className='w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center'>
              <span className='text-purple-600 dark:text-purple-400 text-xl'>💰</span>
            </div>
          </div>
          <div className='mt-4'>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              {cpi >= 1.0 ? '成本控制良好' : cpi >= 0.9 ? '成本正常' : '成本超支'}
            </p>
          </div>
        </div>
      </div>

      {/* 風險與里程碑 */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* 風險監控 */}
        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4'>
            風險監控
          </h3>
          {/* highRisks.length > 0 ? (
            <div className='space-y-3'>
              {highRisks.slice(0, 3).map(risk => (
                <div key={risk.id} className='p-3 bg-red-50 dark:bg-red-900/20 rounded-lg'>
                  <div className='flex justify-between items-start'>
                    <div>
                      <p className='font-medium text-red-800 dark:text-red-200'>{risk.title}</p>
                      <p className='text-sm text-red-600 dark:text-red-300 mt-1'>
                        {risk.description}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      risk.riskLevel === 'critical' 
                        ? 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200'
                        : 'bg-orange-200 text-orange-800 dark:bg-orange-800 dark:text-orange-200'
                    }`}>
                      {risk.riskLevel === 'critical' ? '極高風險' : '高風險'}
                    </span>
                  </div>
                </div>
              ))}
              {highRisks.length > 3 && (
                <p className='text-sm text-gray-600 dark:text-gray-400 text-center'>
                  還有 {highRisks.length - 3} 個高風險項目
                </p>
              )}
            </div>
          ) : (
            <div className='text-center py-8'>
              <span className='text-4xl'>✅</span>
              <p className='text-gray-600 dark:text-gray-400 mt-2'>目前無高風險項目</p>
            </div>
          )} */}
        </div>

        {/* 里程碑 */}
        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4'>
            里程碑
          </h3>
          <div className='space-y-3'>
            {overdueMilestones.length > 0 ? (
              overdueMilestones.slice(0, 3).map((milestone: import('@/app/projects/types/project').ProjectMilestone) => (
                <div key={milestone.id} className='p-2 bg-red-50 dark:bg-red-900/20 rounded-lg'>
                  <div className='font-medium text-red-700 dark:text-red-300'>
                    {milestone.name}（逾期）
                  </div>
                  <div className='text-xs text-gray-500 dark:text-gray-400'>
                    預計完成：{milestone.targetDate?.toString()}
                  </div>
                </div>
              ))
            ) : (
              <p className='text-gray-600 dark:text-gray-400 mt-2'>目前無逾期里程碑</p>
            )}
          </div>
          <div className='space-y-3'>
            {upcomingMilestones.length > 0 ? (
              upcomingMilestones.slice(0, 3).map((milestone: import('@/app/projects/types/project').ProjectMilestone) => (
                <div key={milestone.id} className='p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg'>
                  <div className='font-medium text-yellow-700 dark:text-yellow-300'>
                    {milestone.name}（即將到期）
                  </div>
                  <div className='text-xs text-gray-500 dark:text-gray-400'>
                    預計完成：{milestone.targetDate?.toString()}
                  </div>
                </div>
              ))
            ) : (
              <p className='text-gray-600 dark:text-gray-400 mt-2'>目前無即將到期里程碑</p>
            )}
          </div>
        </div>
      </div>

      {/* 狀態指標 */}
      <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
        <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4'>
          專案狀態指標
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          {statusTrend.indicators.map((indicator: string, index: number) => (
            <div key={index} className='flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg'>
              <span className='text-sm'>📋</span>
              <span className='text-sm text-gray-700 dark:text-gray-300'>{indicator}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 