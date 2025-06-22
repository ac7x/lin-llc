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

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { nanoid } from 'nanoid';
import Link from 'next/link';

import { useAuth } from '@/hooks/useAuth';

import { cn, longClassName } from '@/utils/classNameUtils';

// 導入專案模組的所有組件和功能
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
} from '@/app/modules/test-projects/components';

// 導入 Hooks
import {
  useProjectForm,
  useProjectErrorHandler,
} from '@/app/modules/test-projects/hooks';

// 導入服務
import {
  ProjectService,
  WorkpackageService,
  IssueService,
  TemplateService,
} from '@/app/modules/test-projects/services';

// 導入工具函數和常數
import {
  calculateProjectProgress,
  calculateProjectQualityScore,
  calculateSchedulePerformanceIndex,
  calculateCostPerformanceIndex,
  analyzeProjectStatusTrend,
  calculateProjectPriorityScore,
} from '@/app/modules/test-projects/utils';

import {
  ProgressBarWithPercent,
  ProjectHealthIndicator,
} from '@/app/modules/test-projects/utils/progressUtils';

import {
  PROJECT_STATUS_OPTIONS,
  PROJECT_TYPE_OPTIONS,
  PROJECT_PRIORITY_OPTIONS,
  PROJECT_RISK_LEVEL_OPTIONS,
} from '@/app/modules/test-projects/constants';

import { projectStyles } from '@/app/modules/test-projects/styles';

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
} from '@/app/modules/test-projects/types';

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
  
  // 真實數據狀態
  const [projects, setProjects] = useState<ProjectDocument[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectDocument | null>(null);
  const [workpackages, setWorkpackages] = useState<WorkPackage[]>([]);
  const [subWorkpackages, setSubWorkpackages] = useState<SubWorkPackage[]>([]);
  const [issues, setIssues] = useState<IssueRecord[]>([]);
  const [_setExpenses, setExpenses] = useState<Expense[]>([]);
  const [_setMaterials, setMaterials] = useState<MaterialEntry[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [projectStats, setProjectStats] = useState<ProjectStatsType | null>(null);
  
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
  const [editingWorkpackage, setEditingWorkpackage] = useState<WorkPackage | null>(null);
  const [editingSubWorkpackage, setEditingSubWorkpackage] = useState<SubWorkPackage | null>(null);

  // 合約生成專案相關狀態
  const [_contracts, setContracts] = useState<Array<{
    id: string;
    contractNumber: string;
    contractName: string;
    clientName: string;
    contractValue: number;
    startDate: Date;
    endDate: Date;
    description: string;
  }>>([]);
  const [selectedContractId, setSelectedContractId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [showProjectSetup, setShowProjectSetup] = useState(false);
  const [_projectSetupData, setProjectSetupData] = useState<Record<string, string | number>>({});

  // 合約生成專案相關狀態 - 使用真實 Firebase 數據
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

  // 測試 hooks
  const { formData, errors, handleInputChange, handleSubmit, resetForm } = useProjectForm({}, async (_data) => {
    // 處理表單提交
    console.log('表單數據:', _data);
  });
  const { handleError } = useProjectErrorHandler();

  const tabs = [
    { id: 'components', label: '組件展示' },
    { id: 'data', label: '數據管理' },
    { id: 'pages', label: '頁面功能' },
    { id: 'hooks', label: 'Hooks 測試' },
    { id: 'services', label: '服務層測試' },
    { id: 'utils', label: '工具函數' },
    { id: 'types', label: '型別定義' },
    { id: 'constants', label: '常數' },
    { id: 'styles', label: '樣式' },
    { id: 'contract-generation', label: '合約生成專案' },
    { id: 'forms', label: '表單測試' },
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

  // 載入合約資料
  useEffect(() => {
    setContracts([
      {
        id: 'contract-001',
        contractNumber: 'CT-2024-001',
        contractName: '台北市信義區辦公大樓新建工程',
        clientName: '台北市政府',
        contractValue: 15000000,
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-12-31'),
        description: '信義區辦公大樓新建工程，包含基礎工程、結構工程、機電工程等'
      },
      {
        id: 'contract-002',
        contractNumber: 'CT-2024-002',
        contractName: '新北市板橋區住宅社區工程',
        clientName: '新北市政府',
        contractValue: 25000000,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2025-06-30'),
        description: '板橋區住宅社區工程，包含多棟住宅大樓及公共設施'
      },
      {
        id: 'contract-003',
        contractNumber: 'CT-2024-003',
        contractName: '桃園市機場捷運站體工程',
        clientName: '桃園市政府',
        contractValue: 35000000,
        startDate: new Date('2024-03-01'),
        endDate: new Date('2025-12-31'),
        description: '機場捷運站體工程，包含站體結構、機電設備、裝修工程等'
      }
    ]);
  }, []);

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

  // 合約生成專案相關函數
  const handleContractSelect = (contractId: string) => {
    setSelectedContractId(contractId);
    setShowProjectSetup(false);
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
  };

  // 將合約項目轉換為工作包
  const convertContractItemsToWorkpackages = (contractItems: ContractItem[]): WorkPackage[] => {
    if (!contractItems || !Array.isArray(contractItems) || contractItems.length === 0) {
      return [];
    }

    // 將合約項目轉換為工作包
    return contractItems.map(item => {
      const id = nanoid(8); // 使用 nanoid 生成唯一 ID
      
      // 計算總價：單價 × 數量
      const totalPrice = item.contractItemPrice * item.contractItemQuantity;
      
      // 建立更詳細的工作包名稱和描述
      const workpackageName = `項目 ${item.contractItemId}`;
      const workpackageDescription = `合約項目 ${item.contractItemId} - 數量: ${item.contractItemQuantity}${item.contractItemWeight ? `, 權重: ${item.contractItemWeight}` : ''}`;

      const workpackage: WorkPackage = {
        id,
        name: workpackageName,
        description: workpackageDescription,
        status: 'planned' as import('@/app/modules/test-projects/types').WorkpackageStatus,
        progress: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        budget: totalPrice, // 使用總價（單價 × 數量）
        quantity: item.contractItemQuantity, // 添加缺少的 quantity 屬性
        category: '合約項目',
        priority: 'medium',
        subPackages: [],
        // 可以根據權重設定優先級
        ...(item.contractItemWeight && item.contractItemWeight > 0.7 ? { priority: 'high' as const } : {}),
        ...(item.contractItemWeight && item.contractItemWeight < 0.3 ? { priority: 'low' as const } : {}),
      };

      return workpackage;
    });
  };

  const handleProjectSetupSubmit = async (data: Record<string, string | number>) => {
    setProjectSetupData(data);
    
    const selectedContract = contractRows.find(c => c.id === selectedContractId);
    const _selectedTemplate = templates.find(t => t.id === selectedTemplateId);
    
    if (!selectedContract) {
      alert('未找到選擇的合約');
      return;
    }

    setImportingId(selectedContractId);
    setImportMessage('');
    
    await safeAsync(async () => {
      // 取得合約項目並轉換為工作包
      const contractItems = (selectedContract.raw.contractItems as ContractItem[]) || [];
      const workpackages = convertContractItemsToWorkpackages(contractItems);

      // 預設一個基本的分解資料，包含必要的節點欄位與可選欄位
      const decomposition = {
        nodes: [
          {
            id: 'root', // 節點唯一識別碼
            type: 'custom', // 可選欄位：節點類型
            position: { x: 0, y: 50 }, // 節點座標，x=0 貼齊左邊
            data: { label: selectedContract.name || '專案分解' }, // 自訂資料型別，至少含 label
            // ...其他可選欄位如 width, height 等...
          },
        ],
        edges: [],
      };

      const projectData = {
        projectName: data.projectName as string,
        contractId: selectedContract.id,
        owner: user?.uid || 'default', // 設置專案擁有者
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        status: 'planning' as const,
        decomposition, // 專案分解資料
        workpackages, // 將合約項目轉換後的工作包列表
        // 初始化品質分數
        qualityScore: 10, // 初始品質分數為 10
        lastQualityAdjustment: Timestamp.now(), // 設置品質分數調整時間
        // 從專案設定表單獲得的資料
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
      await loadProjects();
      
      // 重置狀態
      setShowProjectSetup(false);
      setSelectedContractId('');
      setSelectedTemplateId('');
      setProjectSetupData({});
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
    setProjectSetupData({});
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
                data={[]}
              >
                {(_data) => (
                  <ExpenseList
                    expenses={[]}
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
                data={[]}
              >
                {(_data) => (
                  <MaterialList
                    materials={[]}
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

      {/* 頁面功能測試 */}
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
                      src={`/test-projects/${selectedProject.id}`}
                      title="專案主頁"
                      className="w-full h-full"
                      style={{ border: 'none' }}
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-medium mb-1">專案主頁</span>
                    <Link
                      href={`/test-projects/${selectedProject.id}`}
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
                      src={`/test-projects/${selectedProject.id}/calendar`}
                      title="日曆頁面"
                      className="w-full h-full"
                      style={{ border: 'none' }}
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-medium mb-1">日曆頁面</span>
                    <Link
                      href={`/test-projects/${selectedProject.id}/calendar`}
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
                      src={`/test-projects/${selectedProject.id}/expenses`}
                      title="費用頁面"
                      className="w-full h-full"
                      style={{ border: 'none' }}
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-medium mb-1">費用頁面</span>
                    <Link
                      href={`/test-projects/${selectedProject.id}/expenses`}
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
                      src={`/test-projects/${selectedProject.id}/issues`}
                      title="問題頁面"
                      className="w-full h-full"
                      style={{ border: 'none' }}
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-medium mb-1">問題頁面</span>
                    <Link
                      href={`/test-projects/${selectedProject.id}/issues`}
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
                      src={`/test-projects/${selectedProject.id}/journal`}
                      title="日誌頁面"
                      className="w-full h-full"
                      style={{ border: 'none' }}
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-medium mb-1">日誌頁面</span>
                    <Link
                      href={`/test-projects/${selectedProject.id}/journal`}
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
                      src={`/test-projects/${selectedProject.id}/materials`}
                      title="材料頁面"
                      className="w-full h-full"
                      style={{ border: 'none' }}
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-medium mb-1">材料頁面</span>
                    <Link
                      href={`/test-projects/${selectedProject.id}/materials`}
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
                      src={`/test-projects/${selectedProject.id}/subwork-packages`}
                      title="子工作包頁面"
                      className="w-full h-full"
                      style={{ border: 'none' }}
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-medium mb-1">子工作包頁面</span>
                    <Link
                      href={`/test-projects/${selectedProject.id}/subwork-packages`}
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
                      src={`/test-projects/${selectedProject.id}/work-packages`}
                      title="工作包頁面"
                      className="w-full h-full"
                      style={{ border: 'none' }}
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-medium mb-1">工作包頁面</span>
                    <Link
                      href={`/test-projects/${selectedProject.id}/work-packages`}
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
                      src={`/test-projects/${selectedProject.id}/document`}
                      title="專案文件頁面"
                      className="w-full h-full"
                      style={{ border: 'none' }}
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-medium mb-1">專案文件</span>
                    <Link
                      href={`/test-projects/${selectedProject.id}/document`}
                      target="_blank"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      開新分頁檢視
                    </Link>
                  </div>
                </div>

                {/* 專案預算頁面 */}
                <div className="border rounded-lg shadow bg-white dark:bg-gray-900 p-4 flex flex-col">
                  <div className="w-full h-48 mb-3 border rounded overflow-hidden bg-gray-50 dark:bg-gray-800">
                    <iframe
                      src={`/test-projects/${selectedProject.id}/budget`}
                      title="專案預算頁面"
                      className="w-full h-full"
                      style={{ border: 'none' }}
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-medium mb-1">專案預算</span>
                    <Link
                      href={`/test-projects/${selectedProject.id}/budget`}
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
                {/* 合約生成專案頁面 */}
                <div className="border rounded-lg shadow bg-white dark:bg-gray-900 p-4 flex flex-col">
                  <div className="w-full h-48 mb-3 border rounded overflow-hidden bg-gray-50 dark:bg-gray-800">
                    <iframe
                      src="/test-projects/generate-from-contract"
                      title="合約生成專案頁面"
                      className="w-full h-full"
                      style={{ border: 'none' }}
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-medium mb-1">合約生成專案</span>
                    <Link
                      href="/test-projects/generate-from-contract"
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
                      src="/test-projects/list"
                      title="專案列表頁面"
                      className="w-full h-full"
                      style={{ border: 'none' }}
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-medium mb-1">專案列表</span>
                    <Link
                      href="/test-projects/list"
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
                      src="/test-projects/templates"
                      title="模板管理頁面"
                      className="w-full h-full"
                      style={{ border: 'none' }}
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-medium mb-1">模板管理</span>
                    <Link
                      href="/test-projects/templates"
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

      {/* 表單測試 */}
      {activeTab === 'forms' && (
        <div className="space-y-8">
          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              表單組件測試
            </h3>
            
            {/* 工作包表單 */}
            <div className="mb-8 p-6 border rounded-lg">
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                工作包表單
              </h4>
              <WorkpackageForm
                projectId={selectedProject?.id || ''}
                onSubmit={async (_data) => {
                  // 處理提交
                }}
                onCancel={() => {
                  // 處理取消
                }}
              />
            </div>

            {/* 子工作包表單 */}
            <div className="mb-8 p-6 border rounded-lg">
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                子工作包表單
              </h4>
              <SubWorkpackageForm
                workpackageId={workpackages[0]?.id || ''}
                onSubmit={async (_data) => {
                  // 處理提交
                }}
                onCancel={() => {
                  // 處理取消
                }}
              />
            </div>

            {/* 問題表單 */}
            <div className="mb-8 p-6 border rounded-lg">
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                問題表單
              </h4>
              <IssueForm
                projectId={selectedProject?.id || ''}
                onSubmit={handleCreateIssue}
                onCancel={() => setShowIssueForm(false)}
                isLoading={false}
              />
            </div>

            {/* 日誌表單 */}
            <div className="mb-8 p-6 border rounded-lg">
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                日誌表單
              </h4>
              <JournalForm
                projectId={selectedProject?.id || ''}
                onSubmit={async (_data) => {
                  // 處理提交
                }}
                onCancel={() => {
                  // 處理取消
                }}
              />
            </div>

            {/* 費用表單 */}
            <div className="mb-8 p-6 border rounded-lg">
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                費用表單
              </h4>
              <ExpenseForm
                projectId={selectedProject?.id || ''}
                onSubmit={async (_expenseData) => {
                  // 處理提交
                }}
                onCancel={() => {
                  // 處理取消
                }}
                isLoading={false}
              />
            </div>

            {/* 材料表單 */}
            <div className="mb-8 p-6 border rounded-lg">
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                材料表單
              </h4>
              <MaterialForm
                projectId={selectedProject?.id || ''}
                onSubmit={async (_materialData) => {
                  // 處理提交
                }}
                onCancel={() => {
                  // 處理取消
                }}
                isLoading={false}
              />
            </div>

            {/* 模板表單 */}
            <div className="mb-8 p-6 border rounded-lg">
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                模板表單
              </h4>
              <TemplateForm
                onSubmit={async (_templateData) => {
                  // 處理提交
                  return Promise.resolve();
                }}
                onCancel={() => {
                  // 處理取消
                }}
                isLoading={false}
              />
            </div>
          </section>
        </div>
      )}
    </PageContainer>
  );
}

