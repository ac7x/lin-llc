/**
 * 專案分析頁面
 * 
 * 提供專案分析功能：
 * - 專案統計分析
 * - 進度趨勢分析
 * - 績效指標計算
 * - 數據視覺化
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/hooks/useAuth';
import { useProjectAnalytics } from '../../hooks/useProjectAnalytics';
import { AnalyticsService } from '../../services/analyticsService';
import { 
  formatNumber,
  formatCurrency,
  formatPercentage,
  formatStatus,
  formatProjectType,
  getStatusColor,
  getProgressLevel,
  getQualityLevel,
  getPerformanceLevel,
  generatePieChartData,
  generateBarChartData,
  generateLineChartData,
  calculateSummaryStats,
  generatePerformanceCards,
  generateTrendAnalysis,
  generateRecommendations,
  CHART_COLORS,
} from '../../utils/analyticsUtils';

// 統計卡片組件
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  icon?: string;
}

const StatCard = ({ title, value, subtitle, color = 'text-blue-600', icon }: StatCardProps) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <div className="flex items-center">
      {icon && (
        <div className="text-2xl mr-3">{icon}</div>
      )}
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  </div>
);

// 進度條組件
interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
  showLabel?: boolean;
}

const ProgressBar = ({ value, max, color = 'bg-blue-600', showLabel = true }: ProgressBarProps) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  
  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
          <span>{value}</span>
          <span>{max}</span>
        </div>
      )}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};

// 簡單圖表組件（使用 CSS 實現）
const SimplePieChart = ({ data }: { data: Array<{ name: string; value: number; color: string }> }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <div className="space-y-2">
      {data.map((item, index) => (
        <div key={index} className="flex items-center">
          <div 
            className="w-4 h-4 rounded mr-2"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-sm text-gray-600 dark:text-gray-400 flex-1">
            {item.name}
          </span>
          <span className="text-sm font-medium">
            {total > 0 ? Math.round((item.value / total) * 100) : 0}%
          </span>
        </div>
      ))}
    </div>
  );
};

// 趨勢圖組件
const TrendChart = ({ data }: { data: Array<{ month: string; progress: number; quality: number }> }) => {
  const maxValue = Math.max(...data.map(d => Math.max(d.progress, d.quality)));
  
  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div key={index} className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">{item.month}</span>
            <span className="text-gray-900 dark:text-gray-100">
              進度: {item.progress}% | 品質: {item.quality}%
            </span>
          </div>
          <div className="flex space-x-2">
            <div className="flex-1">
              <div className="text-xs text-blue-600 mb-1">進度</div>
              <ProgressBar 
                value={item.progress} 
                max={maxValue} 
                color="bg-blue-600"
                showLabel={false}
              />
            </div>
            <div className="flex-1">
              <div className="text-xs text-green-600 mb-1">品質</div>
              <ProgressBar 
                value={item.quality} 
                max={maxValue} 
                color="bg-green-600"
                showLabel={false}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, loading: authLoading, hasPermission } = useAuth();
  const { 
    analyticsData, 
    projectAnalysis, 
    loading, 
    error, 
    selectedTimeRange, 
    setSelectedTimeRange,
    clearError 
  } = useProjectAnalytics();

  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'performance' | 'details'>('overview');

  // 檢查權限並導航
  useEffect(() => {
    if (!authLoading && (!user || !hasPermission('analytics'))) {
      router.push('/signin');
    }
  }, [authLoading, user, hasPermission, router]);

  // 如果正在檢查權限或載入中，顯示載入狀態
  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 如果沒有權限，不渲染內容（useEffect 會處理導航）
  if (!user || !hasPermission('analytics')) {
    return null;
  }

  if (!analyticsData) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            尚無分析數據
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            請先建立專案以查看分析結果
          </p>
        </div>
      </div>
    );
  }

  const summaryStats = calculateSummaryStats(analyticsData);
  const recommendations = generateRecommendations(analyticsData);
  const trendAnalysis = generateTrendAnalysis(analyticsData.monthlyTrends);

  // 生成圖表數據
  const statusPieData = generatePieChartData(analyticsData.statusDistribution);
  const typePieData = generatePieChartData(analyticsData.typeDistribution);
  const barChartData = generateBarChartData(analyticsData.monthlyTrends);
  const lineChartData = generateLineChartData(analyticsData.monthlyTrends);

  // 計算平均績效指標
  const averagePerformance = projectAnalysis.length > 0 
    ? projectAnalysis.reduce((sum, p) => sum + p.performanceMetrics.overallPerformance, 0) / projectAnalysis.length
    : 0;

  const performanceLevel = getPerformanceLevel(averagePerformance);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">專案分析</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          專案數據分析與績效評估
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="flex-1">
              <p className="text-red-600">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 時間範圍選擇 */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">時間範圍：</span>
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="1m">最近 1 個月</option>
            <option value="3m">最近 3 個月</option>
            <option value="6m">最近 6 個月</option>
            <option value="1y">最近 1 年</option>
            <option value="all">全部時間</option>
          </select>
        </div>
      </div>

      {/* 標籤導航 */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: '概覽', icon: '📊' },
            { id: 'trends', label: '趨勢', icon: '📈' },
            { id: 'performance', label: '績效', icon: '⭐' },
            { id: 'details', label: '詳細', icon: '📋' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* 概覽標籤 */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 主要統計卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="總專案數"
              value={analyticsData.totalProjects}
              subtitle={`${analyticsData.activeProjects} 個進行中`}
              icon="📁"
            />
            <StatCard
              title="平均進度"
              value={formatPercentage(analyticsData.averageProgress)}
              subtitle="整體專案進度"
              color="text-green-600"
              icon="📈"
            />
            <StatCard
              title="平均品質"
              value={formatPercentage(analyticsData.averageQualityScore)}
              subtitle="整體專案品質"
              color="text-purple-600"
              icon="⭐"
            />
            <StatCard
              title="總預算"
              value={formatCurrency(analyticsData.totalBudget)}
              subtitle={`利用率 ${analyticsData.budgetUtilization}%`}
              color="text-orange-600"
              icon="💰"
            />
          </div>

          {/* 詳細統計 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 專案狀態分佈 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                專案狀態分佈
              </h3>
              <SimplePieChart data={statusPieData} />
            </div>

            {/* 專案類型分佈 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                專案類型分佈
              </h3>
              <SimplePieChart data={typePieData} />
            </div>
          </div>

          {/* 建議 */}
          {recommendations.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                改善建議
              </h3>
              <div className="space-y-2">
                {recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">💡</span>
                    <span className="text-gray-700 dark:text-gray-300">{recommendation}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 趨勢標籤 */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          {/* 月度趨勢 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              月度趨勢分析
            </h3>
            <TrendChart data={lineChartData} />
          </div>

          {/* 趨勢分析 */}
          {trendAnalysis && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">進度趨勢</h4>
                <div className="flex items-center space-x-2">
                  <span className={`text-2xl ${
                    trendAnalysis.progress.trend === 'up' ? 'text-green-500' : 
                    trendAnalysis.progress.trend === 'down' ? 'text-red-500' : 'text-gray-500'
                  }`}>
                    {trendAnalysis.progress.trend === 'up' ? '↗' : 
                     trendAnalysis.progress.trend === 'down' ? '↘' : '→'}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {trendAnalysis.progress.trend === 'up' ? '上升' : 
                     trendAnalysis.progress.trend === 'down' ? '下降' : '穩定'}
                    {trendAnalysis.progress.percentage}%
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">品質趨勢</h4>
                <div className="flex items-center space-x-2">
                  <span className={`text-2xl ${
                    trendAnalysis.quality.trend === 'up' ? 'text-green-500' : 
                    trendAnalysis.quality.trend === 'down' ? 'text-red-500' : 'text-gray-500'
                  }`}>
                    {trendAnalysis.quality.trend === 'up' ? '↗' : 
                     trendAnalysis.quality.trend === 'down' ? '↘' : '→'}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {trendAnalysis.quality.trend === 'up' ? '上升' : 
                     trendAnalysis.quality.trend === 'down' ? '下降' : '穩定'}
                    {trendAnalysis.quality.percentage}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 績效標籤 */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* 整體績效 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              整體績效評估
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="整體績效"
                value={formatPercentage(averagePerformance)}
                subtitle={performanceLevel.label}
                color={performanceLevel.color}
                icon="📊"
              />
              <StatCard
                title="準時率"
                value={formatPercentage(
                  analyticsData.totalProjects > 0 
                    ? (analyticsData.onTimeProjects / analyticsData.totalProjects) * 100 
                    : 0
                )}
                subtitle="專案準時完成率"
                icon="⏰"
              />
              <StatCard
                title="完成率"
                value={formatPercentage(
                  analyticsData.totalProjects > 0 
                    ? (analyticsData.completedProjects / analyticsData.totalProjects) * 100 
                    : 0
                )}
                subtitle="專案完成率"
                icon="✅"
              />
              <StatCard
                title="平均時長"
                value={`${analyticsData.averageDuration} 天`}
                subtitle="專案平均執行時長"
                icon="📅"
              />
            </div>
          </div>

          {/* 績效指標詳情 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">進度績效</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>平均進度</span>
                    <span>{formatPercentage(analyticsData.averageProgress)}</span>
                  </div>
                  <ProgressBar 
                    value={analyticsData.averageProgress} 
                    max={100} 
                    color={getProgressLevel(analyticsData.averageProgress).color}
                    showLabel={false}
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>準時專案</span>
                    <span>{analyticsData.onTimeProjects} / {analyticsData.totalProjects}</span>
                  </div>
                  <ProgressBar 
                    value={analyticsData.onTimeProjects} 
                    max={analyticsData.totalProjects} 
                    color="bg-green-600"
                    showLabel={false}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">品質績效</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>平均品質</span>
                    <span>{formatPercentage(analyticsData.averageQualityScore)}</span>
                  </div>
                  <ProgressBar 
                    value={analyticsData.averageQualityScore} 
                    max={100} 
                    color={getQualityLevel(analyticsData.averageQualityScore).color}
                    showLabel={false}
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>高品質專案</span>
                    <span>{analyticsData.highQualityProjects} / {analyticsData.totalProjects}</span>
                  </div>
                  <ProgressBar 
                    value={analyticsData.highQualityProjects} 
                    max={analyticsData.totalProjects} 
                    color="bg-green-600"
                    showLabel={false}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 詳細標籤 */}
      {activeTab === 'details' && (
        <div className="space-y-6">
          {/* 專案詳細列表 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                專案詳細分析
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      專案名稱
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      狀態
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      進度
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      品質
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      預算
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      績效
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {projectAnalysis.map((project) => (
                    <tr key={project.projectId}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {project.projectName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span 
                          className="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                          style={{ 
                            backgroundColor: `${getStatusColor(project.status)}20`,
                            color: getStatusColor(project.status)
                          }}
                        >
                          {formatStatus(project.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-20">
                          <ProgressBar 
                            value={project.progress} 
                            max={100} 
                            color={getProgressLevel(project.progress).color}
                            showLabel={false}
                          />
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {formatPercentage(project.progress)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-20">
                          <ProgressBar 
                            value={project.qualityScore} 
                            max={100} 
                            color={getQualityLevel(project.qualityScore).color}
                            showLabel={false}
                          />
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {formatPercentage(project.qualityScore)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {formatCurrency(project.budget)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium" style={{ color: getPerformanceLevel(project.performanceMetrics.overallPerformance).color }}>
                          {formatPercentage(project.performanceMetrics.overallPerformance)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
