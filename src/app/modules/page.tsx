/**
 * 專案模組展示頁面
 * 
 * 展示 src/modules/projects 模組的核心功能
 * - 組件展示
 * - 頁面功能預覽
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { nanoid } from 'nanoid';
import Link from 'next/link';

import { useAuth } from '@/hooks/useAuth';
import { cn, longClassName } from '@/utils/classNameUtils';

// 導入專案模組的核心組件
import {
  // 通用組件
  AddressSelector,
  DataLoader,
  LoadingSpinner,
  PageContainer,
  PageHeader,
  
  // 儀表板組件
  ProjectDashboard,
  ProjectsTable,
  ProjectStats,
  
  // 專案相關組件
  ProjectInfoDisplay,
  
  // 工作包組件
  WorkPackageCard,
  WorkPackageForm,
  WorkPackageList,
  
  // 子工作包組件
  SubWorkPackageCard,
  SubWorkPackageForm,
  SubWorkPackageList,
  
  // 日誌組件
  JournalCard,
  JournalForm,
  
  // 問題組件
  IssueForm,
  IssueList,
  IssueTracker,
  
  // 管理組件
  RiskManager,
  
  // 費用組件
  ExpenseForm,
  ExpenseList,
  
  // 材料組件
  MaterialForm,
  MaterialList,
  
  // 模板組件
  TemplateCard,
  TemplateForm,
  
  // 合約生成組件
  ContractSelector,
  TemplateSelector,
  ProjectSetupForm,
  
  // 日曆組件
  CalendarView,
  
  // Gemini 組件
  ProjectGeminiChat,
  ProjectAnalysisDisplay,
} from '@/app/modules/projects/components';

// 導入服務
import {
  ProjectService,
  WorkPackageService,
  IssueService,
  TemplateService,
} from '@/app/modules/projects/services';

// 導入工具函數
import {
  calculateProjectProgress,
  calculateProjectQualityScore,
} from '@/app/modules/projects/utils';

import {
  ProgressBarWithPercent,
  ProjectHealthIndicator,
} from '@/app/modules/projects/utils/progressUtils';

import { projectStyles } from '@/app/modules/projects/styles';

// 導入型別
import type {
  WorkPackage,
  SubWorkPackage,
  IssueRecord,
  Template,
  ProjectDocument,
  ProjectStats as ProjectStatsType,
  Expense,
  MaterialEntry,
} from '@/app/modules/projects/types';

// 導入 Firebase 相關
import { db, collection, addDoc, Timestamp } from '@/lib/firebase-client';
import type { ContractItem } from '@/types/finance';
import {
  getErrorMessage,
  logError,
  safeAsync,
  retry,
} from '@/utils/errorUtils';

// 定義合約列型別
interface ContractRow {
  idx: number;
  id: string;
  name: string;
  createdAt: Date | null;
  raw: Record<string, unknown>;
}

export default function TestPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('components');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 核心數據狀態
  const [projects, setProjects] = useState<ProjectDocument[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectDocument | null>(null);
  const [workPackages, setWorkPackages] = useState<WorkPackage[]>([]);
  const [subWorkPackages, setSubWorkPackages] = useState<SubWorkPackage[]>([]);
  const [issues, setIssues] = useState<IssueRecord[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [projectStats, setProjectStats] = useState<ProjectStatsType | null>(null);
  
  // 合約生成專案相關狀態
  const [selectedContractId, setSelectedContractId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [showProjectSetup, setShowProjectSetup] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string>('');

  // 取得所有已建立專案的 contractId 清單，避免重複建立
  const [projectsSnapshot] = useCollection(collection(db, 'projects'));

  // 取得已建立專案的 contractId Set
  const existingContractIds = useMemo(() => {
    if (!projectsSnapshot) return new Set<string>();
    return new Set(
      projectsSnapshot.docs.map(doc => doc.data()?.contractId).filter((id): id is string => !!id)
    );
  }, [projectsSnapshot]);

  const [contractsSnapshot] = useCollection(collection(db, 'finance', 'default', 'contracts'));

  // 僅顯示尚未建立專案的合約
  const contractRows: ContractRow[] = useMemo(() => {
    if (!contractsSnapshot) return [];
    return contractsSnapshot.docs
      .filter(doc => {
        const data = doc.data();
        const contractId = (data.contractId as string) || doc.id;
        return !existingContractIds.has(contractId);
      })
      .map((doc, idx) => {
        const data = doc.data();
        return {
          idx: idx + 1,
          id: (data.contractId as string) || doc.id,
          name: (data.contractName as string) || (data.contractId as string) || doc.id,
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : data.createdAt
              ? new Date(data.createdAt)
              : null,
          raw: data,
        };
      });
  }, [contractsSnapshot, existingContractIds]);

  const tabs = [
    { id: 'components', label: '組件展示' },
    { id: 'pages', label: '頁面功能' },
    { id: 'contract-generation', label: '合約生成專案' },
  ];

  // 載入專案詳細資料
  const loadProjectDetails = useCallback(async (projectId: string) => {
    try {
      const [workPackagesData, issuesData] = await Promise.all([
        WorkPackageService.getWorkPackagesByProject(projectId),
        IssueService.getIssuesByProject(projectId),
      ]);
      
      setWorkPackages(workPackagesData);
      setIssues(issuesData);
      
      // 如果有工作包，載入第一個工作包的子工作包
      if (workPackagesData.length > 0) {
        setSubWorkPackages([]);
      }
    } catch (err) {
      console.error('載入專案詳細資料失敗:', err);
    }
  }, []);

  // 初始化數據
  useEffect(() => {
    if (user) {
      // 載入專案數據
      const loadProjects = async () => {
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
        } finally {
          setLoading(false);
        }
      };

      // 載入統計資料
      const loadStats = async () => {
        try {
          const stats = await ProjectService.getProjectStats();
          setProjectStats(stats);
        } catch (err) {
          console.error('載入統計資料失敗:', err);
        }
      };

      // 載入模板
      const loadTemplates = async () => {
        try {
          const templatesData = await TemplateService.getAllTemplates();
          setTemplates(templatesData);
        } catch (err) {
          console.error('載入模板失敗:', err);
        }
      };

      loadProjects();
      loadStats();
      loadTemplates();
    }
  }, [user, loadProjectDetails]);

  // 重新載入函數
  const handleReload = useCallback(async () => {
    if (!user) return;
    
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
    } finally {
      setLoading(false);
    }
  }, [user, loadProjectDetails]);

  // 合約生成專案相關函數
  const handleContractSelect = (contractId: string) => {
    setSelectedContractId(contractId);
    setShowProjectSetup(false);
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
  };

  // 將合約項目轉換為工作包
  const convertContractItemsToWorkPackages = (contractItems: ContractItem[]): WorkPackage[] => {
    if (!contractItems || !Array.isArray(contractItems) || contractItems.length === 0) {
      return [];
    }

    return contractItems.map(item => {
      const id = nanoid(8);
      const totalPrice = item.contractItemPrice * item.contractItemQuantity;
      const workPackageName = `項目 ${item.contractItemId}`;
      const workPackageDescription = `合約項目 ${item.contractItemId} - 數量: ${item.contractItemQuantity}${item.contractItemWeight ? `, 權重: ${item.contractItemWeight}` : ''}`;

      const workPackage: WorkPackage = {
        id,
        name: workPackageName,
        description: workPackageDescription,
        status: 'planned' as import('@/app/modules/projects/types').WorkPackageStatus,
        progress: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        budget: totalPrice,
        quantity: item.contractItemQuantity,
        category: '合約項目',
        priority: 'medium',
        subPackages: [],
        ...(item.contractItemWeight && item.contractItemWeight > 0.7 ? { priority: 'high' as const } : {}),
        ...(item.contractItemWeight && item.contractItemWeight < 0.3 ? { priority: 'low' as const } : {}),
      };

      return workPackage;
    });
  };

  const handleProjectSetupSubmit = async (data: Record<string, string | number>) => {
    const selectedContract = contractRows.find(c => c.id === selectedContractId);
    
    if (!selectedContract) {
      alert('未找到選擇的合約');
      return;
    }

    setImportingId(selectedContractId);
    setImportMessage('');
    
    await safeAsync(async () => {
      const contractItems = (selectedContract.raw.contractItems as ContractItem[]) || [];
      const workPackages = convertContractItemsToWorkPackages(contractItems);

      const decomposition = {
        nodes: [
          {
            id: 'root',
            type: 'custom',
            position: { x: 0, y: 50 },
            data: { label: selectedContract.name || '專案分解' },
          },
        ],
        edges: [],
      };

      const projectData = {
        projectName: data.projectName as string,
        contractId: selectedContract.id,
        owner: user?.uid || 'default',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        status: 'planning' as const,
        decomposition,
        workPackages,
        qualityScore: 10,
        lastQualityAdjustment: Timestamp.now(),
        manager: data.manager as string,
        inspector: data.inspector as string,
        safety: data.safety as string,
        supervisor: data.supervisor as string,
        safetyOfficer: data.safetyOfficer as string,
        costController: data.costController as string,
        area: data.area as string,
        address: data.address as string,
        region: data.region as string,
        estimatedBudget: data.estimatedBudget as number,
        estimatedDuration: data.estimatedDuration as number,
      };

      await retry(() => addDoc(collection(db, 'projects'), projectData), 3, 1000);
      setImportMessage(`已成功由合約建立專案，合約ID: ${selectedContract.id}`);
      
      // 重新載入專案列表
      const projectsData = await ProjectService.getAllProjects();
      const projectsWithId = projectsData as ProjectDocument[];
      setProjects(projectsWithId);
      
      setShowProjectSetup(false);
      setSelectedContractId('');
      setSelectedTemplateId('');
    }, (error) => {
      setImportMessage(`建立失敗: ${getErrorMessage(error)}`);
      logError(error, { operation: 'import_project', contractId: selectedContract.id });
    });
    
    setImportingId(null);
  };

  const handleProjectSetupCancel = () => {
    setShowProjectSetup(false);
    setSelectedContractId('');
    setSelectedTemplateId('');
    setImportMessage('');
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
            onClick={handleReload}
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
              className={cn(
                longClassName([
                  'py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap'
                ]),
                activeTab === tab.id
                  ? longClassName([
                      'border-blue-500 text-blue-600 dark:text-blue-400'
                    ])
                  : longClassName([
                      'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                      'dark:text-gray-400 dark:hover:text-gray-300'
                    ])
              )}
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
                <h4 className="font-medium mb-2">DataLoader</h4>
                <DataLoader
                  loading={false}
                  error={null}
                  data={[]}
                  emptyMessage="尚無資料"
                >
                  {(data) => <div>資料載入成功</div>}
                </DataLoader>
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
                <ProjectStats stats={projectStats} />
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
              data={workPackages}
            >
              {(data) => (
                <div className="space-y-4">
                  <WorkPackageList 
                    workPackages={data} 
                    projectId={selectedProject?.id || ''} 
                  />
                  
                  {/* 工作包卡片展示 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.slice(0, 3).map((workPackage) => (
                      <WorkPackageCard
                        key={workPackage.id}
                        workPackage={workPackage}
                        onEdit={(_workPackage) => {
                          // 處理編輯
                        }}
                        onDelete={(_workPackageId) => {
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
              data={subWorkPackages}
            >
              {(data) => (
                <div className="space-y-4">
                  <SubWorkPackageList
                    subWorkPackages={data}
                    workPackageId={workPackages[0]?.id || ''}
                    onAddSubWorkPackage={() => {
                      // 處理新增子工作包
                    }}
                    onEditSubWorkPackage={(_subWorkPackage) => {
                      // 處理編輯
                    }}
                    onDeleteSubWorkPackage={(_subWorkPackageId) => {
                      // 處理刪除
                    }}
                  />

                  {/* 子工作包卡片展示 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.slice(0, 3).map((subWorkPackage) => (
                      <SubWorkPackageCard
                        key={subWorkPackage.id}
                        subWorkPackage={subWorkPackage}
                        workPackageId={workPackages[0]?.id || ''}
                        onEdit={(_subWorkPackage) => {
                          // 處理編輯
                        }}
                        onDelete={(_subWorkPackageId) => {
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
                milestones={selectedProject.milestones || []}
                workPackages={workPackages}
                onDateClick={(_date) => {
                  // 處理日期點擊
                }}
                onMilestoneClick={(_milestone) => {
                  // 處理里程碑點擊
                }}
                onWorkPackageClick={(_workPackage) => {
                  // 處理工作包點擊
                }}
              />
            </section>
          )}
          {selectedProject && (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                時程管理
              </h3>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    專案時程
                  </h4>
                  <button
                    onClick={() => {
                      // 導航到時程管理頁面
                      window.location.href = `/modules/projects/features/${selectedProject.id}/schedule`;
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    查看完整時程
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">開始日期</span>
                    <span className="text-sm font-medium">
                      {(() => {
                        if (selectedProject.startDate instanceof Date) {
                          return selectedProject.startDate.toLocaleDateString('zh-TW');
                        }
                        if (typeof selectedProject.startDate === 'object' && selectedProject.startDate?.toDate) {
                          return selectedProject.startDate.toDate().toLocaleDateString('zh-TW');
                        }
                        return '未設定';
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">結束日期</span>
                    <span className="text-sm font-medium">
                      {(() => {
                        if (selectedProject.estimatedEndDate instanceof Date) {
                          return selectedProject.estimatedEndDate.toLocaleDateString('zh-TW');
                        }
                        if (typeof selectedProject.estimatedEndDate === 'object' && selectedProject.estimatedEndDate?.toDate) {
                          return selectedProject.estimatedEndDate.toDate().toLocaleDateString('zh-TW');
                        }
                        return '未設定';
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">進度</span>
                    <span className="text-sm font-medium">
                      {selectedProject.progress || 0}%
                    </span>
                  </div>
                </div>
              </div>
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
                  onAddIssue={() => {
                    // 處理新增問題
                  }}
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
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              專案子頁面功能展示
            </h3>
            
            {/* 工作包管理 */}
            <div className="mb-8 p-6 border rounded-lg">
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                工作包管理頁面
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h5 className="font-medium">專案工作包</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      管理專案的主要工作包和進度追蹤
                    </p>
                  </div>
                  <button className={projectStyles.button.primary}>
                    新增工作包
                  </button>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    工作包管理功能開發中 - 此頁面將提供工作包創建、進度管理和資源分配功能
                  </p>
                </div>
              </div>
            </div>

            {/* 子工作包管理 */}
            <div className="mb-8 p-6 border rounded-lg">
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                子工作包管理頁面
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h5 className="font-medium">子工作包</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      管理工作包下的詳細任務和子項目
                    </p>
                  </div>
                  <button className={projectStyles.button.primary}>
                    新增子工作包
                  </button>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    子工作包管理功能開發中 - 此頁面將提供詳細任務分解和進度追蹤
                  </p>
                </div>
              </div>
            </div>
            {/* Gemini AI 助手 */}
            <div className="mb-8 p-6 border rounded-lg">
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                Gemini AI 助手頁面
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h5 className="font-medium">AI 專案助手</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      使用 Gemini AI 協助專案管理和決策
                    </p>
                  </div>
                  <button className={projectStyles.button.primary}>
                    開始對話
                  </button>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Gemini AI 功能開發中 - 此頁面將提供 AI 驅動的專案分析、建議生成和智能助手功能
                  </p>
                </div>
              </div>
            </div>

            {/* 日曆視圖 */}
            <div className="mb-8 p-6 border rounded-lg">
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                專案日曆頁面
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h5 className="font-medium">專案時程</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      查看專案時程和重要事件
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded">
                      月視圖
                    </button>
                    <button className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                      週視圖
                    </button>
                    <button className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                      日視圖
                    </button>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    日曆功能開發中 - 此頁面將顯示工作包時程、里程碑和重要事件
                  </p>
                </div>
              </div>
            </div>

            {/* 費用管理 */}
            <div className="mb-8 p-6 border rounded-lg">
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                費用管理頁面
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h5 className="font-medium">專案費用</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      管理專案相關費用和支出
                    </p>
                  </div>
                  <button className={projectStyles.button.primary}>
                    新增費用
                  </button>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    費用管理功能開發中 - 此頁面將提供費用記錄、分類和報表功能
                  </p>
                </div>
              </div>
            </div>

            {/* 材料管理 */}
            <div className="mb-8 p-6 border rounded-lg">
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                材料管理頁面
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h5 className="font-medium">專案材料</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      管理專案使用的材料和資源
                    </p>
                  </div>
                  <button className={projectStyles.button.primary}>
                    新增材料
                  </button>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    材料管理功能開發中 - 此頁面將提供材料庫存、使用記錄和採購管理
                  </p>
                </div>
              </div>
            </div>

            {/* 日誌管理 */}
            <div className="mb-8 p-6 border rounded-lg">
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                日誌管理頁面
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h5 className="font-medium">專案日誌</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      記錄專案進度和重要事件
                    </p>
                  </div>
                  <button className={projectStyles.button.primary}>
                    新增日誌
                  </button>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    日誌管理功能開發中 - 此頁面將提供日誌記錄、搜尋和歷史追蹤
                  </p>
                </div>
              </div>
            </div>

            {/* 問題管理 */}
            <div className="mb-8 p-6 border rounded-lg">
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                問題管理頁面
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h5 className="font-medium">專案問題</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      追蹤和管理專案中的問題和風險
                    </p>
                  </div>
                  <button className={projectStyles.button.primary}>
                    新增問題
                  </button>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    問題管理功能開發中 - 此頁面將提供問題追蹤、狀態管理和解決方案記錄
                  </p>
                </div>
              </div>
            </div>

            {/* 專案資訊頁面 */}
            <div className="mb-8 p-6 border rounded-lg">
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                專案資訊頁面
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h5 className="font-medium">專案概覽</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      查看專案基本資訊和統計資料
                    </p>
                  </div>
                  <button className={projectStyles.button.outline}>
                    編輯專案
                  </button>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    專案資訊頁面功能開發中 - 此頁面將顯示專案詳細資訊、人員配置和進度統計
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* 數據管理 */}
      {activeTab === 'pages' && (
        <div className="space-y-8">
          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              專案子頁面縮圖總覽
            </h3>
            
            {/* 測試專案選擇 */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium mb-2">測試專案選擇</h4>
              <div className="flex items-center space-x-4">
                <select 
                  className="px-3 py-2 border rounded-lg"
                  onChange={(e) => {
                    const project = projects.find(p => p.id === e.target.value);
                    if (project) {
                      setSelectedProject(project);
                    }
                  }}
                  value={selectedProject?.id || ''}
                >
                  <option value="">請選擇測試專案</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.projectName}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-gray-600">
                  選擇專案以預覽子頁面
                </span>
              </div>
            </div>

            {/* 專案子頁面縮圖 */}
            {selectedProject && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* 專案主頁 */}
                <div className="border rounded-lg shadow bg-white dark:bg-gray-900 p-4 flex flex-col">
                  <div className="w-full h-48 mb-3 border rounded overflow-hidden bg-gray-50 dark:bg-gray-800">
                    <iframe
                      src={`/modules/projects/features/${selectedProject.id}`}
                      title="專案主頁"
                      className="w-full h-full"
                      style={{ border: 'none' }}
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-medium mb-1">專案主頁</span>
                    <Link
                      href={`/modules/projects/features/${selectedProject.id}`}
                      target="_blank"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      開新分頁檢視
                    </Link>
                  </div>
                </div>

                {/* 日曆頁面 */}
                <div className="border rounded-lg shadow bg-white dark:bg-gray-900 p-4 flex flex-col">
                  <div className="w-full h-48 mb-3 border rounded overflow-hidden bg-gray-50 dark:bg-gray-800">
                    <iframe
                      src={`/modules/projects/features/${selectedProject.id}/calendar`}
                      title="日曆頁面"
                      className="w-full h-full"
                      style={{ border: 'none' }}
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-medium mb-1">日曆頁面</span>
                    <Link
                      href={`/modules/projects/features/${selectedProject.id}/calendar`}
                      target="_blank"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      開新分頁檢視
                    </Link>
                  </div>
                </div>

                {/* 費用頁面 */}
                <div className="border rounded-lg shadow bg-white dark:bg-gray-900 p-4 flex flex-col">
                  <div className="w-full h-48 mb-3 border rounded overflow-hidden bg-gray-50 dark:bg-gray-800">
                    <iframe
                      src={`/modules/projects/features/${selectedProject.id}/expenses`}
                      title="費用頁面"
                      className="w-full h-full"
                      style={{ border: 'none' }}
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-medium mb-1">費用頁面</span>
                    <Link
                      href={`/modules/projects/features/${selectedProject.id}/expenses`}
                      target="_blank"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      開新分頁檢視
                    </Link>
                  </div>
                </div>

                {/* 問題頁面 */}
                <div className="border rounded-lg shadow bg-white dark:bg-gray-900 p-4 flex flex-col">
                  <div className="w-full h-48 mb-3 border rounded overflow-hidden bg-gray-50 dark:bg-gray-800">
                    <iframe
                      src={`/modules/projects/features/${selectedProject.id}/issues`}
                      title="問題頁面"
                      className="w-full h-full"
                      style={{ border: 'none' }}
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-medium mb-1">問題頁面</span>
                    <Link
                      href={`/modules/projects/features/${selectedProject.id}/issues`}
                      target="_blank"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      開新分頁檢視
                    </Link>
                  </div>
                </div>

                {/* 日誌頁面 */}
                <div className="border rounded-lg shadow bg-white dark:bg-gray-900 p-4 flex flex-col">
                  <div className="w-full h-48 mb-3 border rounded overflow-hidden bg-gray-50 dark:bg-gray-800">
                    <iframe
                      src={`/modules/projects/features/${selectedProject.id}/journal`}
                      title="日誌頁面"
                      className="w-full h-full"
                      style={{ border: 'none' }}
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-medium mb-1">日誌頁面</span>
                    <Link
                      href={`/modules/projects/features/${selectedProject.id}/journal`}
                      target="_blank"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      開新分頁檢視
                    </Link>
                  </div>
                </div>

                {/* 材料頁面 */}
                <div className="border rounded-lg shadow bg-white dark:bg-gray-900 p-4 flex flex-col">
                  <div className="w-full h-48 mb-3 border rounded overflow-hidden bg-gray-50 dark:bg-gray-800">
                    <iframe
                      src={`/modules/projects/features/${selectedProject.id}/materials`}
                      title="材料頁面"
                      className="w-full h-full"
                      style={{ border: 'none' }}
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-medium mb-1">材料頁面</span>
                    <Link
                      href={`/modules/projects/features/${selectedProject.id}/materials`}
                      target="_blank"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      開新分頁檢視
                    </Link>
                  </div>
                </div>

                {/* 子工作包頁面 */}
                <div className="border rounded-lg shadow bg-white dark:bg-gray-900 p-4 flex flex-col">
                  <div className="w-full h-48 mb-3 border rounded overflow-hidden bg-gray-50 dark:bg-gray-800">
                    <iframe
                      src={`/modules/projects/features/${selectedProject.id}/subwork-packages`}
                      title="子工作包頁面"
                      className="w-full h-full"
                      style={{ border: 'none' }}
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-medium mb-1">子工作包頁面</span>
                    <Link
                      href={`/modules/projects/features/${selectedProject.id}/subwork-packages`}
                      target="_blank"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      開新分頁檢視
                    </Link>
                  </div>
                </div>

                {/* 工作包頁面 */}
                <div className="border rounded-lg shadow bg-white dark:bg-gray-900 p-4 flex flex-col">
                  <div className="w-full h-48 mb-3 border rounded overflow-hidden bg-gray-50 dark:bg-gray-800">
                    <iframe
                      src={`/modules/projects/features/${selectedProject.id}/work-packages`}
                      title="工作包頁面"
                      className="w-full h-full"
                      style={{ border: 'none' }}
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-medium mb-1">工作包頁面</span>
                    <Link
                      href={`/modules/projects/features/${selectedProject.id}/work-packages`}
                      target="_blank"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      開新分頁檢視
                    </Link>
                  </div>
                </div>

                {/* 專案文件頁面 */}
                <div className="border rounded-lg shadow bg-white dark:bg-gray-900 p-4 flex flex-col">
                  <div className="w-full h-48 mb-3 border rounded overflow-hidden bg-gray-50 dark:bg-gray-800">
                    <iframe
                      src={`/modules/projects/features/${selectedProject.id}/document`}
                      title="專案文件頁面"
                      className="w-full h-full"
                      style={{ border: 'none' }}
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-medium mb-1">專案文件</span>
                    <Link
                      href={`/modules/projects/features/${selectedProject.id}/document`}
                      target="_blank"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      開新分頁檢視
                    </Link>
                  </div>
                </div>

                {/* Gemini AI 頁面 */}
                <div className="border rounded-lg shadow bg-white dark:bg-gray-900 p-4 flex flex-col">
                  <div className="w-full h-48 mb-3 border rounded overflow-hidden bg-gray-50 dark:bg-gray-800">
                    <iframe
                      src={`/modules/projects/features/${selectedProject.id}/gemini`}
                      title="Gemini AI 頁面"
                      className="w-full h-full"
                      style={{ border: 'none' }}
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-medium mb-1">AI 分析</span>
                    <Link
                      href={`/modules/projects/features/${selectedProject.id}/gemini`}
                      target="_blank"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      開新分頁檢視
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* 獨立頁面（不需要專案ID） */}
            <section className="mt-8">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                獨立頁面
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* 專案管理頁面 */}
                <div className="border rounded-lg shadow bg-white dark:bg-gray-900 p-4 flex flex-col">
                  <div className="w-full h-48 mb-3 border rounded overflow-hidden bg-gray-50 dark:bg-gray-800">
                    <iframe
                      src="/modules/projects/features/admin"
                      title="專案管理頁面"
                      className="w-full h-full"
                      style={{ border: 'none' }}
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-medium mb-1">專案管理</span>
                    <Link
                      href="/modules/projects/features/admin"
                      target="_blank"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      開新分頁檢視
                    </Link>
                  </div>
                </div>

                {/* 專案分析頁面 */}
                <div className="border rounded-lg shadow bg-white dark:bg-gray-900 p-4 flex flex-col">
                  <div className="w-full h-48 mb-3 border rounded overflow-hidden bg-gray-50 dark:bg-gray-800">
                    <iframe
                      src="/modules/projects/features/analytics"
                      title="專案分析頁面"
                      className="w-full h-full"
                      style={{ border: 'none' }}
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-medium mb-1">專案分析</span>
                    <Link
                      href="/modules/projects/features/analytics"
                      target="_blank"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      開新分頁檢視
                    </Link>
                  </div>
                </div>

                {/* 合約管理頁面 */}
                <div className="border rounded-lg shadow bg-white dark:bg-gray-900 p-4 flex flex-col">
                  <div className="w-full h-48 mb-3 border rounded overflow-hidden bg-gray-50 dark:bg-gray-800">
                    <iframe
                      src="/modules/projects/features/contracts"
                      title="合約管理頁面"
                      className="w-full h-full"
                      style={{ border: 'none' }}
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-medium mb-1">合約管理</span>
                    <Link
                      href="/modules/projects/features/contracts"
                      target="_blank"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      開新分頁檢視
                    </Link>
                  </div>
                </div>

                {/* 合約生成專案頁面 */}
                <div className="border rounded-lg shadow bg-white dark:bg-gray-900 p-4 flex flex-col">
                  <div className="w-full h-48 mb-3 border rounded overflow-hidden bg-gray-50 dark:bg-gray-800">
                    <iframe
                      src="/modules/projects/features/generate-from-contract"
                      title="合約生成專案頁面"
                      className="w-full h-full"
                      style={{ border: 'none' }}
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-medium mb-1">合約生成專案</span>
                    <Link
                      href="/modules/projects/features/generate-from-contract"
                      target="_blank"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      開新分頁檢視
                    </Link>
                  </div>
                </div>

                {/* 專案列表頁面 */}
                <div className="border rounded-lg shadow bg-white dark:bg-gray-900 p-4 flex flex-col">
                  <div className="w-full h-48 mb-3 border rounded overflow-hidden bg-gray-50 dark:bg-gray-800">
                    <iframe
                      src="/modules/projects/features/list"
                      title="專案列表頁面"
                      className="w-full h-full"
                      style={{ border: 'none' }}
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-medium mb-1">專案列表</span>
                    <Link
                      href="/modules/projects/features/list"
                      target="_blank"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      開新分頁檢視
                    </Link>
                  </div>
                </div>

                {/* 模板管理頁面 */}
                <div className="border rounded-lg shadow bg-white dark:bg-gray-900 p-4 flex flex-col">
                  <div className="w-full h-48 mb-3 border rounded overflow-hidden bg-gray-50 dark:bg-gray-800">
                    <iframe
                      src="/modules/projects/features/templates"
                      title="模板管理頁面"
                      className="w-full h-full"
                      style={{ border: 'none' }}
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-medium mb-1">模板管理</span>
                    <Link
                      href="/modules/projects/features/templates"
                      target="_blank"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      開新分頁檢視
                    </Link>
                  </div>
                </div>

                {/* 個人資料頁面 */}
                <div className="border rounded-lg shadow bg-white dark:bg-gray-900 p-4 flex flex-col">
                  <div className="w-full h-48 mb-3 border rounded overflow-hidden bg-gray-50 dark:bg-gray-800">
                    <iframe
                      src="/modules/projects/features/profile"
                      title="個人資料頁面"
                      className="w-full h-full"
                      style={{ border: 'none' }}
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-medium mb-1">個人資料</span>
                    <Link
                      href="/modules/projects/features/profile"
                      target="_blank"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      開新分頁檢視
                    </Link>
                  </div>
                </div>

                {/* 登入頁面 */}
                <div className="border rounded-lg shadow bg-white dark:bg-gray-900 p-4 flex flex-col">
                  <div className="w-full h-48 mb-3 border rounded overflow-hidden bg-gray-50 dark:bg-gray-800">
                    <iframe
                      src="/modules/projects/features/signin"
                      title="登入頁面"
                      className="w-full h-full"
                      style={{ border: 'none' }}
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-medium mb-1">登入</span>
                    <Link
                      href="/modules/projects/features/signin"
                      target="_blank"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      開新分頁檢視
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          </section>
        </div>
      )}

      {/* 合約生成專案功能 */}
      {activeTab === 'contract-generation' && (
        <div className="space-y-8">
          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              合約生成專案功能
            </h3>
            
            {/* 步驟指示器 */}
            <div className="mb-6">
              <div className="flex items-center justify-center space-x-4">
                <div className={`flex items-center ${selectedContractId ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedContractId ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    1
                  </div>
                  <span className="ml-2 text-sm font-medium">選擇合約</span>
                </div>
                <div className={`w-8 h-0.5 ${selectedContractId ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                <div className={`flex items-center ${selectedTemplateId ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedTemplateId ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    2
                  </div>
                  <span className="ml-2 text-sm font-medium">選擇模板</span>
                </div>
                <div className={`w-8 h-0.5 ${selectedTemplateId ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                <div className={`flex items-center ${showProjectSetup ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${showProjectSetup ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    3
                  </div>
                  <span className="ml-2 text-sm font-medium">設定專案</span>
                </div>
              </div>
            </div>

            {/* 狀態訊息 */}
            {importMessage && (
              <div className={`p-4 rounded-lg ${
                importMessage.includes('成功') 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                  : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
              }`}>
                {importMessage}
              </div>
            )}

            {/* 步驟 1: 合約選擇 */}
            {!selectedContractId && (
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  步驟 1: 選擇合約
                </h4>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    從以下合約中選擇一個來生成專案：
                  </p>
                  <ContractSelector
                    contracts={contractRows.map(row => ({
                      id: row.id,
                      contractNumber: row.id,
                      contractName: row.name,
                      clientName: '客戶名稱',
                      contractValue: 1000000,
                      startDate: row.createdAt || new Date(),
                      endDate: new Date((row.createdAt || new Date()).getTime() + 365 * 24 * 60 * 60 * 1000),
                      description: '合約描述'
                    }))}
                    selectedContractId={selectedContractId}
                    onSelectContract={handleContractSelect}
                  />
                </div>
              </div>
            )}

            {/* 步驟 2: 模板選擇 */}
            {selectedContractId && !selectedTemplateId && (
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  步驟 2: 選擇模板
                </h4>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    選擇要應用的專案模板：
                  </p>
                  <TemplateSelector
                    templates={templates}
                    selectedTemplateId={selectedTemplateId}
                    onSelectTemplate={handleTemplateSelect}
                  />
                </div>
              </div>
            )}

            {/* 步驟 3: 專案設定 */}
            {selectedContractId && selectedTemplateId && showProjectSetup && (
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  步驟 3: 設定專案資訊
                </h4>
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
                  <ProjectSetupForm
                    initialData={{
                      projectName: `專案 ${selectedContractId}`,
                      description: '從合約生成的專案',
                      estimatedBudget: 1000000,
                      estimatedDuration: 365,
                      manager: '',
                      inspector: '',
                      safety: '',
                      supervisor: '',
                      safetyOfficer: '',
                      costController: '',
                      area: '',
                      address: '',
                      region: '',
                    }}
                    onSubmit={handleProjectSetupSubmit}
                    onCancel={handleProjectSetupCancel}
                    isLoading={!!importingId}
                  />
                </div>
              </div>
            )}

            {/* 重置按鈕 */}
            {(selectedContractId || selectedTemplateId || showProjectSetup) && (
              <div className="flex justify-center">
                <button
                  onClick={handleProjectSetupCancel}
                  className={projectStyles.button.outline}
                >
                  重新開始
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </PageContainer>
  );
}
