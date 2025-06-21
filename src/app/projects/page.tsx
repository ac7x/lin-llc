/**
 * 專案列表頁面
 *
 * 顯示所有專案的列表，提供以下功能：
 * - 專案搜尋和篩選
 * - 專案狀態追蹤
 * - 日期格式化顯示
 * - 專案進度顯示
 * - 專案管理功能
 * - 專業化統計分析
 */

'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition, useState } from 'react';

import { DataLoader } from '@/components/common/DataLoader';
import { useAuth } from '@/hooks/useAuth';
import { useFilteredProjects, useProjectStats, type ProjectFilters, type ProjectSortOption } from '@/hooks/useFilteredProjects';

import { ProjectsTable } from './components/ProjectsTable';

export default function ProjectsPage() {
  useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [showAdvancedColumns, setShowAdvancedColumns] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // 從 URL 參數取得篩選條件
  const searchTerm = searchParams.get('q') ?? '';
  const status = searchParams.get('status') as import('@/types/project').ProjectStatus | undefined;
  const projectType = searchParams.get('type') as import('@/types/project').ProjectType | undefined;
  const priority = searchParams.get('priority') as import('@/types/project').ProjectPriority | undefined;
  const riskLevel = searchParams.get('riskLevel') as import('@/types/project').ProjectRiskLevel | undefined;
  const healthLevel = searchParams.get('healthLevel') as import('@/types/project').ProjectHealthLevel | undefined;
  const phase = searchParams.get('phase') as import('@/types/project').ProjectPhase | undefined;
  const sortBy = (searchParams.get('sort') as ProjectSortOption) || 'createdAt-desc';

  const filters: ProjectFilters = {
    searchTerm,
    status,
    projectType,
    priority,
    riskLevel,
    healthLevel,
    phase,
  };

  const { projects, loading, error } = useFilteredProjects(filters, sortBy);
  const { stats } = useProjectStats();

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(window.location.search);
    if (term) {
      params.set('q', term);
    } else {
      params.delete('q');
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(window.location.search);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  const handleSortChange = (sortOption: ProjectSortOption) => {
    const params = new URLSearchParams(window.location.search);
    params.set('sort', sortOption);
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  const clearFilters = () => {
    startTransition(() => {
      router.replace(pathname);
    });
  };

  return (
    <main className='max-w-7xl mx-auto'>
      <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
        <div className='flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4'>
          <div>
            <h1 className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent'>
              專案列表
            </h1>
            <p className='text-gray-600 dark:text-gray-400 mt-2'>管理與追蹤所有專案狀態</p>
          </div>
          <div className='flex items-center gap-2'>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className='px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200'
            >
              {showAdvancedFilters ? '簡化篩選' : '進階篩選'}
            </button>
            <button
              onClick={() => setShowAdvancedColumns(!showAdvancedColumns)}
              className='px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200'
            >
              {showAdvancedColumns ? '簡化檢視' : '詳細檢視'}
            </button>
          </div>
        </div>

        {/* 統計卡片 */}
        {stats && (
          <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 mb-6'>
            <div className='bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg'>
              <div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>{stats.totalProjects}</div>
              <div className='text-sm text-blue-600 dark:text-blue-400'>總專案數</div>
            </div>
            <div className='bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg'>
              <div className='text-2xl font-bold text-yellow-600 dark:text-yellow-400'>{stats.activeProjects}</div>
              <div className='text-sm text-yellow-600 dark:text-yellow-400'>執行中</div>
            </div>
            <div className='bg-green-50 dark:bg-green-900/20 p-4 rounded-lg'>
              <div className='text-2xl font-bold text-green-600 dark:text-green-400'>{stats.completedProjects}</div>
              <div className='text-sm text-green-600 dark:text-green-400'>已完成</div>
            </div>
            <div className='bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg'>
              <div className='text-2xl font-bold text-orange-600 dark:text-orange-400'>{stats.onHoldProjects}</div>
              <div className='text-sm text-orange-600 dark:text-orange-400'>暫停中</div>
            </div>
            <div className='bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg'>
              <div className='text-2xl font-bold text-purple-600 dark:text-purple-400'>{stats.averageProgress}%</div>
              <div className='text-sm text-purple-600 dark:text-purple-400'>平均進度</div>
            </div>
            <div className='bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg'>
              <div className='text-2xl font-bold text-indigo-600 dark:text-indigo-400'>{stats.averageQualityScore}/10</div>
              <div className='text-sm text-indigo-600 dark:text-indigo-400'>平均品質</div>
            </div>
            <div className='bg-red-50 dark:bg-red-900/20 p-4 rounded-lg'>
              <div className='text-2xl font-bold text-red-600 dark:text-red-400'>{stats.overdueProjects}</div>
              <div className='text-sm text-red-600 dark:text-red-400'>逾期專案</div>
            </div>
            <div className='bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg'>
              <div className='text-2xl font-bold text-pink-600 dark:text-pink-400'>{stats.highRiskProjects}</div>
              <div className='text-sm text-pink-600 dark:text-pink-400'>高風險</div>
            </div>
          </div>
        )}

        {/* 篩選器 */}
        <div className='bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                搜尋
              </label>
              <input
                type='text'
                className='w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                placeholder='專案名稱、合約ID、地區...'
                defaultValue={searchTerm}
                onChange={e => handleSearch(e.target.value)}
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                狀態
              </label>
              <select
                className='w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                value={status || ''}
                onChange={e => handleFilterChange('status', e.target.value)}
              >
                <option value=''>全部狀態</option>
                <option value='planning'>規劃中</option>
                <option value='approved'>已核准</option>
                <option value='in-progress'>執行中</option>
                <option value='on-hold'>暫停中</option>
                <option value='completed'>已完成</option>
                <option value='cancelled'>已取消</option>
                <option value='archived'>已封存</option>
              </select>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                專案類型
              </label>
              <select
                className='w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                value={projectType || ''}
                onChange={e => handleFilterChange('type', e.target.value)}
              >
                <option value=''>全部類型</option>
                <option value='construction'>營建工程</option>
                <option value='renovation'>裝修工程</option>
                <option value='maintenance'>維護工程</option>
                <option value='consulting'>諮詢服務</option>
                <option value='design'>設計服務</option>
                <option value='other'>其他</option>
              </select>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                排序
              </label>
              <select
                className='w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                value={sortBy}
                onChange={e => handleSortChange(e.target.value as ProjectSortOption)}
              >
                <option value='createdAt-desc'>建立日期 (新到舊)</option>
                <option value='createdAt-asc'>建立日期 (舊到新)</option>
                <option value='name-asc'>專案名稱 (A-Z)</option>
                <option value='name-desc'>專案名稱 (Z-A)</option>
                <option value='progress-desc'>進度 (高到低)</option>
                <option value='progress-asc'>進度 (低到高)</option>
                <option value='priority-desc'>優先級 (高到低)</option>
                <option value='priority-asc'>優先級 (低到高)</option>
                <option value='riskLevel-desc'>風險等級 (高到低)</option>
                <option value='riskLevel-asc'>風險等級 (低到高)</option>
                <option value='qualityScore-desc'>品質評分 (高到低)</option>
                <option value='qualityScore-asc'>品質評分 (低到高)</option>
                <option value='budget-desc'>預算 (高到低)</option>
                <option value='budget-asc'>預算 (低到高)</option>
              </select>
            </div>
          </div>

          {/* 進階篩選 */}
          {showAdvancedFilters && (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700'>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  優先級
                </label>
                <select
                  className='w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                  value={priority || ''}
                  onChange={e => handleFilterChange('priority', e.target.value)}
                >
                  <option value=''>全部優先級</option>
                  <option value='low'>低</option>
                  <option value='medium'>中</option>
                  <option value='high'>高</option>
                  <option value='critical'>緊急</option>
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  風險等級
                </label>
                <select
                  className='w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                  value={riskLevel || ''}
                  onChange={e => handleFilterChange('riskLevel', e.target.value)}
                >
                  <option value=''>全部風險等級</option>
                  <option value='low'>低風險</option>
                  <option value='medium'>中風險</option>
                  <option value='high'>高風險</option>
                  <option value='critical'>極高風險</option>
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  健康度
                </label>
                <select
                  className='w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                  value={healthLevel || ''}
                  onChange={e => handleFilterChange('healthLevel', e.target.value)}
                >
                  <option value=''>全部健康度</option>
                  <option value='excellent'>優秀</option>
                  <option value='good'>良好</option>
                  <option value='fair'>一般</option>
                  <option value='poor'>不佳</option>
                  <option value='critical'>危急</option>
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  專案階段
                </label>
                <select
                  className='w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                  value={phase || ''}
                  onChange={e => handleFilterChange('phase', e.target.value)}
                >
                  <option value=''>全部階段</option>
                  <option value='initiation'>啟動</option>
                  <option value='planning'>規劃</option>
                  <option value='execution'>執行</option>
                  <option value='monitoring'>監控</option>
                  <option value='closure'>收尾</option>
                </select>
              </div>
            </div>
          )}

          {/* 篩選操作按鈕 */}
          <div className='flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700'>
            <div className='text-sm text-gray-600 dark:text-gray-400'>
              顯示 {projects.length} 個專案
            </div>
            <button
              onClick={clearFilters}
              className='px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200'
            >
              清除篩選
            </button>
          </div>
        </div>

        {/* 專案表格 */}
        <DataLoader
          loading={loading}
          error={error}
          data={projects}
        >
          {(loadedProjects) => (
            <ProjectsTable projects={loadedProjects} showAdvancedColumns={showAdvancedColumns} />
          )}
        </DataLoader>
      </div>
    </main>
  );
}
