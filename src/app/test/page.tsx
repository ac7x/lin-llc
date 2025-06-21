/**
 * 專案模組測試頁面
 * 
 * 展示 src/modules/projects 模組的所有功能，包括：
 * - 組件展示
 * - Hooks 測試
 * - 服務層測試
 * - 工具函數測試
 * - 型別定義展示
 */

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

// 導入專案模組的所有組件和功能
import {
  // 通用組件
  AddressSelector,
  DataLoader,
  LoadingSpinner,
  PageContainer,
  PageHeader,
  WeatherDisplay,
  
  // 儀表板組件
  ProjectDashboard,
  ProjectsTable,
  ProjectStats,
  
  // 工作包組件
  WorkpackageList,
  
  // Hooks
  useProjectActions,
  useFilteredProjects,
  useProjectStats,
  useQualityScore,
  useProjectState,
  useProjectForm,
  useProjectErrorHandler,
  
  // 服務
  ProjectService,
  WorkpackageService,
  JournalService,
  IssueService,
  TemplateService,
  
  // 工具函數
  calculateProjectProgress,
  calculateProjectQualityScore,
  calculateSchedulePerformanceIndex,
  calculateCostPerformanceIndex,
  getUpcomingMilestones,
  getOverdueMilestones,
  analyzeProjectStatusTrend,
  calculateProjectPriorityScore,
  
  // 進度工具
  ProgressBarWithPercent,
  ProjectHealthIndicator,
  
  // 常數
  PROJECT_STATUS_OPTIONS,
  PROJECT_TYPE_OPTIONS,
  PROJECT_PRIORITY_OPTIONS,
  PROJECT_RISK_LEVEL_OPTIONS,
  PROJECT_HEALTH_LEVEL_OPTIONS,
  PROJECT_PHASE_OPTIONS,
  
  // 樣式
  projectStyles,
  
  // 型別
  type Project,
  type Workpackage,
  type SubWorkpackage,
  type ProjectStatus,
  type ProjectType,
  type ProjectPriority,
  type ProjectRiskLevel,
  type ProjectHealthLevel,
  type ProjectPhase,
  type IssueRecord,
  type Expense,
  type MaterialEntry,
  type Template,
} from '@/modules/projects';

// 模擬資料
const mockProject: Project & { id: string } = {
  id: 'project-001',
  projectName: '測試專案',
  status: 'in-progress',
  progress: 65,
  contractId: 'CTR-2024-001',
  manager: 'user1',
  inspector: 'user2',
  safety: 'user3',
  supervisor: 'user4',
  safetyOfficer: 'user5',
  costController: 'user6',
  area: '台北市',
  address: '台北市信義區信義路五段7號',
  region: '台北市',
  startDate: new Date('2024-01-01'),
  estimatedEndDate: new Date('2024-12-31'),
  projectType: 'system',
  priority: 'high',
  riskLevel: 'medium',
  healthLevel: 'good',
  phase: 'execution',
  estimatedBudget: 1000000,
  actualBudget: 750000,
  estimatedDuration: 365,
  actualDuration: 200,
  qualityScore: 8.5,
  workpackages: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockWorkpackage: Workpackage = {
  id: 'wp-001',
  name: '測試工作包',
  description: '這是一個測試工作包',
  status: 'in-progress',
  progress: 75,
  plannedStartDate: new Date('2024-01-01'),
  plannedEndDate: new Date('2024-06-30'),
  estimatedStartDate: new Date('2024-01-01'),
  estimatedEndDate: new Date('2024-06-30'),
  assignedTo: 'user1',
  budget: 500000,
  category: '系統整合',
  priority: 'high',
  subWorkpackages: [],
  estimatedHours: 800,
  actualHours: 600,
  costVariance: -50000,
  scheduleVariance: -10,
  riskLevel: 'medium',
  phase: 'execution',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockIssue: IssueRecord = {
  id: 'issue-001',
  type: 'quality',
  description: '測試問題描述',
  severity: 'medium',
  status: 'open',
  assignedTo: 'user1',
  dueDate: new Date('2024-12-31'),
  createdAt: new Date(),
  updatedAt: new Date(),
};

export default function TestPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('components');
  const [testData, setTestData] = useState({
    projects: [mockProject],
    workpackages: [mockWorkpackage],
    issues: [mockIssue],
  });

  // 測試 hooks
  const { updateProject, deleteProject } = useProjectActions();
  const { formData, errors, setFieldValue, validateForm } = useProjectForm(mockProject);
  const { handleError } = useProjectErrorHandler();

  const tabs = [
    { id: 'components', label: '組件展示' },
    { id: 'hooks', label: 'Hooks 測試' },
    { id: 'services', label: '服務層測試' },
    { id: 'utils', label: '工具函數' },
    { id: 'types', label: '型別定義' },
    { id: 'constants', label: '常數' },
    { id: 'styles', label: '樣式' },
  ];

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            需要登入
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            請先登入以查看測試頁面
          </p>
        </div>
      </div>
    );
  }

  return (
    <PageContainer>
      <PageHeader 
        title="專案模組測試頁面" 
        subtitle="展示 src/modules/projects 模組的所有功能"
      />

      {/* 標籤導航 */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 組件展示 */}
      {activeTab === 'components' && (
        <div className="space-y-8">
          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              通用組件
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">LoadingSpinner</h4>
                <LoadingSpinner size="medium" />
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">AddressSelector</h4>
                <AddressSelector 
                  value="台北市信義區信義路五段7號"
                  onChange={(address) => console.log('選擇地址:', address)}
                />
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">WeatherDisplay</h4>
                <WeatherDisplay 
                  weatherData={{ weather: '晴天', temperature: 25 }}
                  loading={false}
                  error={false}
                />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              儀表板組件
            </h3>
            <div className="space-y-4">
              <ProjectDashboard project={mockProject} />
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">專案統計</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">10</div>
                    <div className="text-sm text-gray-600">總專案數</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">5</div>
                    <div className="text-sm text-gray-600">執行中</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">3</div>
                    <div className="text-sm text-gray-600">已完成</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">1</div>
                    <div className="text-sm text-gray-600">逾期專案</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              工作包組件
            </h3>
            <div className="space-y-4">
              <WorkpackageList workpackages={[mockWorkpackage]} projectId="test-project" />
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              資料載入組件
            </h3>
            <DataLoader
              loading={false}
              error={null}
              data={[mockProject]}
              children={(data) => (
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">載入的專案</h4>
                  <p>{data[0]?.projectName}</p>
                </div>
              )}
            />
          </section>
        </div>
      )}

      {/* Hooks 測試 */}
      {activeTab === 'hooks' && (
        <div className="space-y-6">
          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              專案表單 Hook
            </h3>
            <div className="p-4 border rounded-lg space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  專案名稱
                </label>
                <input
                  type="text"
                  value={formData.projectName || ''}
                  onChange={(e) => setFieldValue('projectName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.projectName && (
                  <p className="text-sm text-red-600 mt-1">{errors.projectName}</p>
                )}
              </div>
              <button
                onClick={() => {
                  if (validateForm()) {
                    console.log('表單驗證通過:', formData);
                  } else {
                    console.log('表單驗證失敗:', errors);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                驗證表單
              </button>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              錯誤處理 Hook
            </h3>
            <div className="p-4 border rounded-lg space-y-4">
              <button
                onClick={() => {
                  try {
                    throw new Error('測試錯誤');
                  } catch (error) {
                    handleError(error as Error, 'test_operation');
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                觸發測試錯誤
              </button>
            </div>
          </section>
        </div>
      )}

      {/* 服務層測試 */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              專案服務
            </h3>
            <div className="p-4 border rounded-lg space-y-4">
              <button
                onClick={async () => {
                  try {
                    const stats = await ProjectService.getProjectStats();
                    console.log('專案統計:', stats);
                    alert(`總專案數: ${stats.totalProjects}`);
                  } catch (error) {
                    console.error('取得統計失敗:', error);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                取得專案統計
              </button>
            </div>
          </section>
        </div>
      )}

      {/* 工具函數 */}
      {activeTab === 'utils' && (
        <div className="space-y-6">
          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              進度計算
            </h3>
            <div className="p-4 border rounded-lg space-y-4">
              <div>
                <p>專案進度: {calculateProjectProgress(mockProject)}%</p>
                <ProgressBarWithPercent percent={calculateProjectProgress(mockProject)} />
              </div>
              <div>
                <p>品質分數: {calculateProjectQualityScore(mockProject)}</p>
                <ProjectHealthIndicator project={mockProject} />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              專案分析
            </h3>
            <div className="p-4 border rounded-lg space-y-2">
              <p>時程績效指數: {calculateSchedulePerformanceIndex(mockProject)}</p>
              <p>成本績效指數: {calculateCostPerformanceIndex(mockProject)}</p>
              <p>專案優先級分數: {calculateProjectPriorityScore(mockProject)}</p>
            </div>
          </section>
        </div>
      )}

      {/* 型別定義 */}
      {activeTab === 'types' && (
        <div className="space-y-6">
          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              專案型別
            </h3>
            <div className="p-4 border rounded-lg space-y-2">
              <p><strong>Project:</strong> 專案主要型別</p>
              <p><strong>Workpackage:</strong> 工作包型別</p>
              <p><strong>SubWorkpackage:</strong> 子工作包型別</p>
              <p><strong>IssueRecord:</strong> 問題記錄型別</p>
              <p><strong>Expense:</strong> 費用型別</p>
              <p><strong>MaterialEntry:</strong> 材料記錄型別</p>
              <p><strong>Template:</strong> 模板型別</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              狀態型別
            </h3>
            <div className="p-4 border rounded-lg space-y-2">
              <p><strong>ProjectStatus:</strong> planning | approved | in-progress | on-hold | completed | cancelled | archived</p>
              <p><strong>ProjectType:</strong> system | maintenance | transport</p>
              <p><strong>ProjectPriority:</strong> low | medium | high | critical</p>
              <p><strong>ProjectRiskLevel:</strong> low | medium | high | critical</p>
              <p><strong>ProjectHealthLevel:</strong> excellent | good | fair | poor | critical</p>
              <p><strong>ProjectPhase:</strong> initiation | planning | execution | monitoring | closure</p>
            </div>
          </section>
        </div>
      )}

      {/* 常數 */}
      {activeTab === 'constants' && (
        <div className="space-y-6">
          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              專案常數
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">專案狀態選項</h4>
                <ul className="text-sm space-y-1">
                  {PROJECT_STATUS_OPTIONS.map(option => (
                    <li key={option.value}>{option.label}</li>
                  ))}
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">專案類型選項</h4>
                <ul className="text-sm space-y-1">
                  {PROJECT_TYPE_OPTIONS.map(option => (
                    <li key={option.value}>{option.label}</li>
                  ))}
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">優先級選項</h4>
                <ul className="text-sm space-y-1">
                  {PROJECT_PRIORITY_OPTIONS.map(option => (
                    <li key={option.value}>{option.label}</li>
                  ))}
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">風險等級選項</h4>
                <ul className="text-sm space-y-1">
                  {PROJECT_RISK_LEVEL_OPTIONS.map(option => (
                    <li key={option.value}>{option.label}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* 樣式 */}
      {activeTab === 'styles' && (
        <div className="space-y-6">
          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              專案樣式
            </h3>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">按鈕樣式</h4>
                <div className="space-x-2">
                  <button className={projectStyles.button.primary}>主要按鈕</button>
                  <button className={projectStyles.button.secondary}>次要按鈕</button>
                  <button className={projectStyles.button.outline}>外框按鈕</button>
                  <button className={projectStyles.button.small}>小按鈕</button>
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">表單樣式</h4>
                <div className="space-y-2">
                  <input 
                    type="text" 
                    placeholder="輸入文字" 
                    className={projectStyles.form.input}
                  />
                  <select className={projectStyles.form.select}>
                    <option>選項 1</option>
                    <option>選項 2</option>
                  </select>
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">卡片樣式</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={projectStyles.card.base}>
                    <div className="p-4">基本卡片</div>
                  </div>
                  <div className={projectStyles.card.stats}>
                    <div className="p-4">統計卡片</div>
                  </div>
                  <div className={projectStyles.card.stats}>
                    <div className="p-4">統計卡片</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </PageContainer>
  );
}

