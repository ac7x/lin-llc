/**
 * 專案模組測試頁面
 * 
 * 展示 src/modules/projects 模組的所有功能，使用真實的 Firebase 服務串接
 * - 組件展示
 * - Hooks 測試
 * - 服務層測試
 * - 工具函數測試
 * - 型別定義展示
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
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
  ProjectStatsComponent,
  
  // 專案相關組件
  ProjectEditModal,
  ProjectInfoDisplay,
  ProjectInfoPage,
  
  // 工作包組件
  WorkpackageCard,
  WorkpackageForm,
  WorkpackageList,
  
  // 子工作包組件
  SubWorkpackageCard,
  SubWorkpackageForm,
  SubWorkpackageList,
  
  // 日誌組件
  JournalCard,
  JournalForm,
  JournalHistory,
  
  // 問題組件
  IssueForm,
  IssueList,
  IssueTracker,
  
  // 費用組件
  ExpenseForm,
  ExpenseList,
  
  // 材料組件
  MaterialForm,
  MaterialList,
  
  // 模板組件
  TemplateCard,
  TemplateForm,
  
  // 管理組件
  RiskManager,
  ChangeManager,
  MilestoneTracker,
  
  // 日曆組件
  CalendarView,
  
  // 生成專案組件
  ContractSelector,
  ProjectSetupForm,
  TemplateSelector,
  
  // Hooks
  useProjectForm,
  useProjectErrorHandler,
  useFilteredProjects,
  
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
  
  // 樣式
  projectStyles,
  
  // 型別
  type Workpackage,
  type SubWorkpackage,
  type IssueRecord,
  type Template,
  type ProjectDocument,
  type ProjectStats,
  type Expense,
  type MaterialEntry,
  type ProjectMilestone,
  type ProjectRisk,
  type ProjectChange,
} from '@/modules/projects';

export default function TestPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('components');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 真實數據狀態
  const [projects, setProjects] = useState<ProjectDocument[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectDocument | null>(null);
  const [workpackages, setWorkpackages] = useState<Workpackage[]>([]);
  const [subWorkpackages, setSubWorkpackages] = useState<SubWorkpackage[]>([]);
  const [issues, setIssues] = useState<IssueRecord[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [materials, setMaterials] = useState<MaterialEntry[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [projectStats, setProjectStats] = useState<ProjectStats | null>(null);
  
  // 表單狀態
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [showWorkpackageForm, setShowWorkpackageForm] = useState(false);
  const [showSubWorkpackageForm, setShowSubWorkpackageForm] = useState(false);
  
  // 編輯狀態
  const [editingIssue, setEditingIssue] = useState<IssueRecord | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<MaterialEntry | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [editingWorkpackage, setEditingWorkpackage] = useState<Workpackage | null>(null);
  const [editingSubWorkpackage, setEditingSubWorkpackage] = useState<SubWorkpackage | null>(null);

  // 測試 hooks
  const { formData, errors, handleInputChange, handleSubmit, resetForm } = useProjectForm({}, async (data) => {
    // 處理表單提交
    console.log('表單數據:', data);
  });
  const { handleError } = useProjectErrorHandler();

  const tabs = [
    { id: 'components', label: '組件展示' },
    { id: 'data', label: '數據管理' },
    { id: 'hooks', label: 'Hooks 測試' },
    { id: 'services', label: '服務層測試' },
    { id: 'utils', label: '工具函數' },
    { id: 'types', label: '型別定義' },
    { id: 'constants', label: '常數' },
    { id: 'styles', label: '樣式' },
  ];

  // 載入專案詳細資料
  const loadProjectDetails = useCallback(async (projectId: string) => {
    try {
      const [workpackagesData, issuesData] = await Promise.all([
        WorkpackageService.getWorkpackagesByProject(projectId),
        IssueService.getIssuesByProject(projectId),
      ]);
      
      setWorkpackages(workpackagesData);
      setIssues(issuesData);
      
      // 如果有工作包，載入第一個工作包的子工作包
      if (workpackagesData.length > 0) {
        // 這裡需要實作載入子工作包的邏輯
        setSubWorkpackages([]);
      }
    } catch (err) {
      handleError(err as Error, 'load_project_details');
    }
  }, [handleError]);

  // 載入專案數據
  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const projectsData = await ProjectService.getAllProjects();
      const projectsWithId = projectsData as ProjectDocument[];
      setProjects(projectsWithId);
      
      if (projectsWithId.length > 0) {
        setSelectedProject(projectsWithId[0]);
        await loadProjectDetails(projectsWithId[0].id);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '載入專案失敗';
      setError(errorMessage);
      handleError(err as Error, 'load_projects');
    } finally {
      setLoading(false);
    }
  }, [loadProjectDetails, handleError]);

  // 載入統計資料
  const loadStats = useCallback(async () => {
    try {
      const stats = await ProjectService.getProjectStats();
      setProjectStats(stats);
    } catch (err) {
      handleError(err as Error, 'load_stats');
    }
  }, [handleError]);

  // 載入模板
  const loadTemplates = useCallback(async () => {
    try {
      const templatesData = await TemplateService.getAllTemplates();
      setTemplates(templatesData);
    } catch (err) {
      handleError(err as Error, 'load_templates');
    }
  }, [handleError]);

  // 初始化數據
  useEffect(() => {
    if (user) {
      loadProjects();
      loadStats();
      loadTemplates();
    }
  }, [user, loadProjects, loadStats, loadTemplates]);

  // 處理新增問題
  const handleCreateIssue = async (issueData: Omit<IssueRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!selectedProject) return;
    
    setLoading(true);
    try {
      await IssueService.createIssue(issueData);
      await loadProjectDetails(selectedProject.id);
      setShowIssueForm(false);
      setEditingIssue(null);
    } catch (err) {
      handleError(err as Error, 'create_issue');
    } finally {
      setLoading(false);
    }
  };

  // 處理編輯問題
  const handleEditIssue = async (issueData: Partial<IssueRecord>) => {
    if (!editingIssue) return;
    
    setLoading(true);
    try {
      await IssueService.updateIssue(editingIssue.id, issueData);
      await loadProjectDetails(selectedProject!.id);
      setShowIssueForm(false);
      setEditingIssue(null);
    } catch (err) {
      handleError(err as Error, 'update_issue');
    } finally {
      setLoading(false);
    }
  };

  // 處理刪除問題
  const handleDeleteIssue = async (issueId: string) => {
    if (!selectedProject) return;
    
    setLoading(true);
    try {
      await IssueService.deleteIssue(issueId);
      await loadProjectDetails(selectedProject.id);
    } catch (err) {
      handleError(err as Error, 'delete_issue');
    } finally {
      setLoading(false);
    }
  };

  // 處理問題狀態變更
  const handleIssueStatusChange = async (issueId: string, status: 'open' | 'in-progress' | 'resolved') => {
    if (!selectedProject) return;
    
    setLoading(true);
    try {
      await IssueService.updateIssue(issueId, { status });
      await loadProjectDetails(selectedProject.id);
    } catch (err) {
      handleError(err as Error, 'update_issue_status');
    } finally {
      setLoading(false);
    }
  };

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
        subtitle="使用真實 Firebase 服務串接的專案模組功能展示"
      >
        <div className="flex space-x-2">
          <button
            onClick={loadProjects}
            disabled={loading}
            className={projectStyles.button.outline}
          >
            {loading ? '載入中...' : '重新載入'}
          </button>
        </div>
      </PageHeader>

      {/* 錯誤顯示 */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* 標籤導航 */}
      <div className="mb-6">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
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
                  onChange={(_address) => {
                    // 處理地址變更
                  }}
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
              {selectedProject && (
                <ProjectDashboard project={{
                  id: selectedProject.id,
                  projectName: selectedProject.projectName,
                  status: selectedProject.status,
                  progress: selectedProject.progress,
                }} />
              )}
              {projectStats && (
                <ProjectStatsComponent stats={projectStats} />
              )}
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              專案列表
            </h3>
            <DataLoader
              loading={loading}
              error={error ? new Error(error) : null}
              data={projects as any[]}
            >
              {(data) => (
                <ProjectsTable 
                  projects={data} 
                  showAdvancedColumns={true}
                />
              )}
            </DataLoader>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              工作包組件
            </h3>
            <DataLoader
              loading={loading}
              error={error ? new Error(error) : null}
              data={workpackages}
            >
              {(data) => (
                <div className="space-y-4">
                  <WorkpackageList 
                    workpackages={data} 
                    projectId={selectedProject?.id || ''} 
                  />
                  
                  {/* 工作包卡片展示 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.slice(0, 3).map((workpackage) => (
                      <WorkpackageCard
                        key={workpackage.id}
                        workpackage={workpackage}
                        projectId={selectedProject?.id || ''}
                        onEdit={(_workpackage) => {
                          // 處理編輯
                        }}
                        onDelete={(_workpackageId) => {
                          // 處理刪除
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </DataLoader>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              子工作包組件
            </h3>
            <DataLoader
              loading={loading}
              error={error ? new Error(error) : null}
              data={subWorkpackages}
            >
              {(data) => (
                <div className="space-y-4">
                  <SubWorkpackageList
                    subWorkpackages={data}
                    workpackageId={workpackages[0]?.id || ''}
                    onAddSubWorkpackage={() => setShowSubWorkpackageForm(true)}
                    onEditSubWorkpackage={(_subWorkpackage) => {
                      // 處理編輯
                    }}
                    onDeleteSubWorkpackage={(_subWorkpackageId) => {
                      // 處理刪除
                    }}
                  />
                  
                  {/* 子工作包卡片展示 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.slice(0, 3).map((subWorkpackage) => (
                      <SubWorkpackageCard
                        key={subWorkpackage.id}
                        subWorkpackage={subWorkpackage}
                        workpackageId={workpackages[0]?.id || ''}
                        onEdit={(_subWorkpackage) => {
                          // 處理編輯
                        }}
                        onDelete={(_subWorkpackageId) => {
                          // 處理刪除
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </DataLoader>
          </section>

          {selectedProject && (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                日曆視圖
              </h3>
              <CalendarView
                projectId={selectedProject.id}
                milestones={selectedProject.milestones || []}
                workpackages={workpackages}
                onDateClick={(_date) => {
                  // 處理日期點擊
                }}
                onMilestoneClick={(_milestone) => {
                  // 處理里程碑點擊
                }}
                onWorkpackageClick={(_workpackage) => {
                  // 處理工作包點擊
                }}
              />
            </section>
          )}

          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              管理組件
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 問題追蹤器 */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-4">問題追蹤器</h4>
                <IssueTracker
                  issues={issues}
                  projectId={selectedProject?.id || ''}
                  onAddIssue={() => setShowIssueForm(true)}
                  onEditIssue={(_issue) => {
                    // 處理編輯
                  }}
                  onDeleteIssue={(_issueId) => {
                    // 處理刪除
                  }}
                />
              </div>

              {/* 風險管理器 */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-4">風險管理器</h4>
                <RiskManager
                  risks={selectedProject?.risks || []}
                  projectId={selectedProject?.id || ''}
                  onAddRisk={() => {
                    // 處理新增風險
                  }}
                  onEditRisk={(_risk) => {
                    // 處理編輯風險
                  }}
                  onDeleteRisk={(_riskId) => {
                    // 處理刪除風險
                  }}
                />
              </div>

              {/* 變更管理器 */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-4">變更管理器</h4>
                <ChangeManager
                  changes={selectedProject?.changes || []}
                  projectId={selectedProject?.id || ''}
                  onAddChange={() => {
                    // 處理新增變更
                  }}
                  onEditChange={(_change) => {
                    // 處理編輯變更
                  }}
                  onDeleteChange={(_changeId) => {
                    // 處理刪除變更
                  }}
                />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              里程碑追蹤器
            </h3>
            <MilestoneTracker
              milestones={selectedProject?.milestones || []}
              projectId={selectedProject?.id || ''}
              onAddMilestone={() => {
                // 處理新增里程碑
              }}
              onEditMilestone={(_milestone) => {
                // 處理編輯里程碑
              }}
              onDeleteMilestone={(_milestoneId) => {
                // 處理刪除里程碑
              }}
            />
          </section>
        </div>
      )}

      {/* 數據管理 */}
      {activeTab === 'data' && (
        <div className="space-y-8">
          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              問題管理
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">專案問題</h4>
                <button
                  onClick={() => setShowIssueForm(true)}
                  className={projectStyles.button.primary}
                >
                  新增問題
                </button>
              </div>
              
              <DataLoader
                loading={loading}
                error={error ? new Error(error) : null}
                data={issues}
              >
                {(data) => (
                  <IssueList
                    issues={data}
                    projectId={selectedProject?.id || ''}
                    onEdit={(issue) => {
                      setEditingIssue(issue);
                      setShowIssueForm(true);
                    }}
                    onDelete={handleDeleteIssue}
                    onAdd={() => setShowIssueForm(true)}
                    onStatusChange={handleIssueStatusChange}
                    isLoading={loading}
                  />
                )}
              </DataLoader>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              費用管理
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">專案費用</h4>
                <button
                  onClick={() => setShowExpenseForm(true)}
                  className={projectStyles.button.primary}
                >
                  新增費用
                </button>
              </div>
              
              <DataLoader
                loading={loading}
                error={error ? new Error(error) : null}
                data={expenses}
              >
                {(data) => (
                  <ExpenseList
                    expenses={data}
                    projectId={selectedProject?.id || ''}
                    onEdit={(_expense) => {
                      // 處理編輯費用
                    }}
                    onDelete={async (_expenseId) => {
                      // 處理刪除費用
                    }}
                    onAdd={() => setShowExpenseForm(true)}
                    isLoading={loading}
                  />
                )}
              </DataLoader>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              材料管理
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">專案材料</h4>
                <button
                  onClick={() => setShowMaterialForm(true)}
                  className={projectStyles.button.primary}
                >
                  新增材料
                </button>
              </div>
              
              <DataLoader
                loading={loading}
                error={error ? new Error(error) : null}
                data={materials}
              >
                {(data) => (
                  <MaterialList
                    materials={data}
                    projectId={selectedProject?.id || ''}
                    onEdit={(_material) => {
                      // 處理編輯材料
                    }}
                    onDelete={async (_materialId) => {
                      // 處理刪除材料
                    }}
                    onAdd={() => setShowMaterialForm(true)}
                    isLoading={loading}
                  />
                )}
              </DataLoader>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              模板管理
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">專案模板</h4>
                <button
                  onClick={() => setShowTemplateForm(true)}
                  className={projectStyles.button.primary}
                >
                  新增模板
                </button>
              </div>
              
              <DataLoader
                loading={loading}
                error={error ? new Error(error) : null}
                data={templates}
              >
                {(data) => (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        onEdit={(template) => {
                          setEditingTemplate(template);
                          setShowTemplateForm(true);
                        }}
                        onDelete={async (templateId) => {
                          try {
                            await TemplateService.deleteTemplate(templateId);
                            await loadTemplates();
                          } catch (err) {
                            handleError(err as Error, 'delete_template');
                          }
                        }}
                        onSelect={(_template) => {
                          // 處理模板選擇
                        }}
                      />
                    ))}
                  </div>
                )}
              </DataLoader>
            </div>
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
                  onChange={(e) => handleInputChange('projectName', e.target.value)}
                  className={projectStyles.form.input}
                />
                {errors.projectName && (
                  <p className="text-sm text-red-600 mt-1">{errors.projectName}</p>
                )}
              </div>
              <button
                onClick={() => {
                  // 表單驗證和提交
                  console.log('表單數據:', formData);
                }}
                className={projectStyles.button.primary}
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
                className={projectStyles.button.danger}
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
                    alert(`總專案數: ${stats.totalProjects}`);
                  } catch (error) {
                    handleError(error as Error, 'get_project_stats');
                  }
                }}
                className={projectStyles.button.primary}
              >
                取得專案統計
              </button>
              
              <button
                onClick={async () => {
                  try {
                    const allProjects = await ProjectService.getAllProjects();
                    alert(`載入 ${allProjects.length} 個專案`);
                  } catch (error) {
                    handleError(error as Error, 'get_all_projects');
                  }
                }}
                className={projectStyles.button.secondary}
              >
                取得所有專案
              </button>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              工作包服務
            </h3>
            <div className="p-4 border rounded-lg space-y-4">
              <button
                onClick={async () => {
                  if (!selectedProject) {
                    alert('請先選擇專案');
                    return;
                  }
                  try {
                    const workpackages = await WorkpackageService.getWorkpackagesByProject(selectedProject.id);
                    alert(`載入 ${workpackages.length} 個工作包`);
                  } catch (error) {
                    handleError(error as Error, 'get_workpackages');
                  }
                }}
                className={projectStyles.button.primary}
              >
                取得專案工作包
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
              {selectedProject && (
                <>
                  <div>
                    <p>專案進度: {calculateProjectProgress(selectedProject)}%</p>
                    <ProgressBarWithPercent percent={calculateProjectProgress(selectedProject)} />
                  </div>
                  <div>
                    <p>品質分數: {calculateProjectQualityScore(selectedProject)}</p>
                    <ProjectHealthIndicator project={selectedProject} />
                  </div>
                </>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              專案分析
            </h3>
            <div className="p-4 border rounded-lg space-y-2">
              {selectedProject && (
                <>
                  <p>時程績效指數: {calculateSchedulePerformanceIndex(selectedProject)}</p>
                  <p>成本績效指數: {calculateCostPerformanceIndex(selectedProject)}</p>
                  <p>專案優先級分數: {calculateProjectPriorityScore(selectedProject)}</p>
                  <p>狀態趨勢: {analyzeProjectStatusTrend(selectedProject).trend}</p>
                </>
              )}
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
              <p><strong>ProjectDocument:</strong> 專案主要型別（包含 id）</p>
              <p><strong>Workpackage:</strong> 工作包型別</p>
              <p><strong>SubWorkpackage:</strong> 子工作包型別</p>
              <p><strong>IssueRecord:</strong> 問題記錄型別</p>
              <p><strong>Expense:</strong> 費用型別</p>
              <p><strong>MaterialEntry:</strong> 材料型別</p>
              <p><strong>Template:</strong> 模板型別</p>
              <p><strong>ProjectMilestone:</strong> 里程碑型別</p>
              <p><strong>ProjectRisk:</strong> 風險型別</p>
              <p><strong>ProjectChange:</strong> 變更型別</p>
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

      {/* 表單模態框 */}
      {showIssueForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <IssueForm
              issue={editingIssue || undefined}
              projectId={selectedProject?.id || ''}
              onSubmit={editingIssue ? handleEditIssue : handleCreateIssue}
              onCancel={() => {
                setShowIssueForm(false);
                setEditingIssue(null);
              }}
              isLoading={loading}
            />
          </div>
        </div>
      )}

      {showExpenseForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <ExpenseForm
              expense={editingExpense || undefined}
              projectId={selectedProject?.id || ''}
              onSubmit={async (expenseData) => {
                try {
                  // 這裡需要實作費用服務
                  setShowExpenseForm(false);
                  setEditingExpense(null);
                } catch (err) {
                  handleError(err as Error, 'save_expense');
                }
              }}
              onCancel={() => {
                setShowExpenseForm(false);
                setEditingExpense(null);
              }}
              isLoading={loading}
            />
          </div>
        </div>
      )}

      {showMaterialForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <MaterialForm
              material={editingMaterial || undefined}
              projectId={selectedProject?.id || ''}
              onSubmit={async (materialData) => {
                try {
                  // 這裡需要實作材料服務
                  setShowMaterialForm(false);
                  setEditingMaterial(null);
                } catch (err) {
                  handleError(err as Error, 'save_material');
                }
              }}
              onCancel={() => {
                setShowMaterialForm(false);
                setEditingMaterial(null);
              }}
              isLoading={loading}
            />
          </div>
        </div>
      )}

      {showTemplateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <TemplateForm
              template={editingTemplate}
              onSubmit={async (templateData) => {
                try {
                  if (editingTemplate) {
                    await TemplateService.updateTemplate(editingTemplate.id, templateData);
                  } else {
                    await TemplateService.createTemplate(templateData);
                  }
                  await loadTemplates();
                  setShowTemplateForm(false);
                  setEditingTemplate(null);
                } catch (err) {
                  handleError(err as Error, 'save_template');
                }
              }}
              onCancel={() => {
                setShowTemplateForm(false);
                setEditingTemplate(null);
              }}
              isLoading={loading}
            />
          </div>
        </div>
      )}

      {showWorkpackageForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <WorkpackageForm
              workpackage={editingWorkpackage || undefined}
              projectId={selectedProject?.id || ''}
              onSubmit={async (workpackageData) => {
                try {
                  // 這裡需要實作工作包服務
                  setShowWorkpackageForm(false);
                  setEditingWorkpackage(null);
                } catch (err) {
                  handleError(err as Error, 'save_workpackage');
                }
              }}
              onCancel={() => {
                setShowWorkpackageForm(false);
                setEditingWorkpackage(null);
              }}
              isSubmitting={loading}
            />
          </div>
        </div>
      )}

      {showSubWorkpackageForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <SubWorkpackageForm
              subWorkpackage={editingSubWorkpackage || undefined}
              workpackageId={workpackages[0]?.id || ''}
              onSubmit={async (subWorkpackageData) => {
                try {
                  // 這裡需要實作子工作包服務
                  setShowSubWorkpackageForm(false);
                  setEditingSubWorkpackage(null);
                } catch (err) {
                  handleError(err as Error, 'save_subworkpackage');
                }
              }}
              onCancel={() => {
                setShowSubWorkpackageForm(false);
                setEditingSubWorkpackage(null);
              }}
              isSubmitting={loading}
            />
          </div>
        </div>
      )}
    </PageContainer>
  );
}

