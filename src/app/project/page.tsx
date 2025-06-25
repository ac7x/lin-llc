'use client';
import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenuSub,
  SidebarRail,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { 
  ChevronRightIcon,
  FolderIcon,
  PackageIcon,
  ListIcon,
  CheckSquareIcon,
  PlusIcon,
  SettingsIcon,
} from 'lucide-react';
import { ProjectActionGuard } from '@/app/settings/components/permission-guard';
import { usePermission } from '@/app/settings/hooks/use-permission';

// 提取重複的 Input 樣式為常數，避免 Firebase Performance 錯誤
const COMPACT_INPUT_STYLE = "flex-1 text-xs h-6";

// 提取重複的 Button 樣式為常數，避免 Firebase Performance 錯誤
const COMPACT_BUTTON_STYLE = "w-full justify-start text-xs h-6 text-muted-foreground hover:text-foreground";

// 提取小型 Button 樣式為常數，避免 Firebase Performance 錯誤
const SMALL_BUTTON_STYLE = "h-6 w-6 p-0";

// 提取項目選擇樣式為常數，避免 Firebase Performance 錯誤
const ITEM_SELECT_STYLE = "flex items-center gap-2 hover:bg-accent rounded p-1 flex-1 cursor-pointer";

// ... 排程時間 生成代碼過程不會影響到註解 ...
interface ScheduleTime {
  plannedStart?: string;    // 計畫起始時間 - 專案或任務的預期開始時間
  plannedEnd?: string;      // 計畫結束時間 - 專案或任務的預期完成時間
  scheduledStart?: string;  // 排定開始時間 - 經過資源規劃後的實際排程開始時間
  scheduledEnd?: string;    // 排定結束時間 - 經過資源規劃後的實際排程結束時間
  actualStart?: string;     // 實際開始時間 - 專案或任務實際開始執行的時間
  actualEnd?: string;       // 實際結束時間 - 專案或任務實際完成執行的時間
  createdAt?: string;       // 建立時間 - 此時間排程記錄的建立時間戳記
  updatedAt?: string;       // 更新時間 - 此時間排程記錄的最後修改時間戳記
}
// ... 排程時間 生成代碼過程不會影響到註解 ...

interface TaskPackage { 
  name: string;
  time?: ScheduleTime;
  assigness?: string[];
  completed: number;
  total: number;
  progress: number;
}
interface Subpackage { 
  name: string; 
    time?: ScheduleTime;
    assigness?: string[];
  taskpackages: TaskPackage[];
  completed: number;
  total: number;
  progress: number;
}
interface Package { 
  name: string; 
  time?: ScheduleTime;
  assigness?: string[];
  subpackages: Subpackage[];
  completed: number;
  total: number;
  progress: number;
}
interface Project {
  id: string;
  name: string;
  time?: ScheduleTime;
  assigness?: string[];
  description: string;
  createdAt: string;
  packages: Package[];
  completed: number;
  total: number;
  progress: number;
}

// 選中項目的類型
type SelectedItem = 
  | { type: 'project'; projectId: string }
  | { type: 'package'; projectId: string; packageIndex: number }
  | { type: 'subpackage'; projectId: string; packageIndex: number; subpackageIndex: number }
  | { type: 'task'; projectId: string; packageIndex: number; subpackageIndex: number; taskIndex: number }
  | null;

export default function ProjectListPage() {
  const { hasPermission } = usePermission();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
  const [showProjectInput, setShowProjectInput] = useState(false);
  const [pkgInputs, setPkgInputs] = useState<Record<string, string>>({});
  const [taskPackageInputs, setTaskPackageInputs] = useState<Record<string, Record<number, string>>>({});
  const [subInputs, setSubInputs] = useState<Record<string, Record<number, Record<number, string>>>>({});

  // 載入專案列表
  useEffect(() => {
    void (async () => {
      // 檢查是否有查看專案權限
      if (!hasPermission('project:read')) {
        console.warn('用戶沒有查看專案權限');
        return;
      }

      const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const projectList = snapshot.docs.map(doc => {
        const data = doc.data();
        // 確保 packages 是陣列，且每個 package 都有 tasks 陣列
        const packages = Array.isArray(data.packages) 
          ? data.packages.map((pkg: any) => ({
              name: pkg.name || '',
              completed: pkg.completed || 0,
              total: pkg.total || 0,
              progress: pkg.progress || 0,
              subpackages: Array.isArray(pkg.subpackages) 
                ? pkg.subpackages.map((sub: any) => ({ 
                    name: sub.name || '未命名子工作包',
                    completed: sub.completed || 0,
                    total: sub.total || 0,
                    progress: sub.progress || 0,
                    taskpackages: Array.isArray(sub.taskpackages) ? sub.taskpackages.map((task: any) => ({ 
                      name: task.name || '', 
                      completed: task.completed || 0, 
                      total: task.total || 0, 
                      progress: task.progress || 0 
                    })) : [] 
                  }))
                : []
            }))
          : [];
        
        return {
          id: doc.id,
          name: data.name || '',
          description: data.description || '',
          createdAt: data.createdAt || new Date().toISOString(),
          packages,
          completed: data.completed || 0,
          total: data.total || 0,
          progress: data.progress || 0,
        };
      }) as Project[];
      setProjects(projectList);
      // 預設選擇第一個專案
      if (projectList.length > 0 && !selectedProject) {
        setSelectedProject(projectList[0]);
      }
    })();
  }, [hasPermission]); // eslint-disable-line react-hooks/exhaustive-deps

  // 建立專案
  const handleCreateProject = async () => {
    if (!projectName.trim()) return;
    
    // 檢查是否有創建專案權限
    if (!hasPermission('project:write')) {
      console.warn('用戶沒有創建專案權限');
      return;
    }

    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'projects'), {
        name: projectName.trim(),
        createdAt: new Date().toISOString(),
        packages: [],
      });
      const newProject: Project = {
        id: docRef.id,
        name: projectName.trim(),
        description: '',
        createdAt: new Date().toISOString(),
        packages: [],
        completed: 0,
        total: 0,
        progress: 0,
      };
      setProjects(prev => [newProject, ...prev]);
      setProjectName('');
      setShowProjectInput(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      // 自動選擇新建立的專案
      setSelectedProject(newProject);
    } catch (error) {
      console.error('建立專案失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 新增工作包
  const handleAddPackage = async (projectId: string, pkgName: string) => {
    if (!pkgName.trim()) return;
    
    // 檢查是否有創建工作包權限
    if (!hasPermission('project:package:create')) {
      console.warn('用戶沒有創建工作包權限');
      return;
    }

    setLoading(true);
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;
      const updatedPackages = [
        ...project.packages,
        { name: pkgName.trim(), subpackages: [], completed: 0, total: 0, progress: 0 }
      ];
      await updateProjectPackages(projectId, updatedPackages);
      setPkgInputs(prev => ({ ...prev, [projectId]: '' }));
    } finally {
      setLoading(false);
    }
  };

  // 新增子工作包
  const handleAddSubpackage = async (projectId: string, pkgIdx: number, subName: string) => {
    if (!subName.trim()) return;
    
    // 檢查是否有創建子工作包權限
    if (!hasPermission('project:subpackage:create')) {
      console.warn('用戶沒有創建子工作包權限');
      return;
    }

    setLoading(true);
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;
      const updatedPackages = project.packages.map((pkg, idx) =>
        idx === pkgIdx
          ? { ...pkg, subpackages: [...pkg.subpackages, { name: subName.trim(), taskpackages: [], completed: 0, total: 0, progress: 0 }] }
          : pkg
      );
      await updateProjectPackages(projectId, updatedPackages);
      setTaskPackageInputs(prev => ({
        ...prev,
        [projectId]: { ...prev[projectId], [pkgIdx]: '' }
      }));
    } finally {
      setLoading(false);
    }
  };

  // 新增任務包
  const handleAddTaskPackage = async (projectId: string, pkgIdx: number, subIdx: number, taskPackageName: string) => {
    if (!taskPackageName.trim()) return;
    
    // 檢查是否有創建任務權限
    if (!hasPermission('project:task:create')) {
      console.warn('用戶沒有創建任務權限');
      return;
    }

    setLoading(true);
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;
      const updatedPackages = project.packages.map((pkg, i) =>
        i === pkgIdx
          ? {
              ...pkg,
              subpackages: pkg.subpackages.map((sub, j) =>
                j === subIdx
                  ? { ...sub, taskpackages: [...sub.taskpackages, { name: taskPackageName.trim(), completed: 0, total: 0, progress: 0 }] }
                  : sub
              )
            }
          : pkg
      );
      await updateProjectPackages(projectId, updatedPackages);
      setSubInputs(prev => ({
        ...prev,
        [projectId]: {
          ...prev[projectId],
          [pkgIdx]: { ...prev[projectId]?.[pkgIdx], [subIdx]: '' }
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  // Firestore 更新 packages 共用方法
  const updateProjectPackages = async (projectId: string, packages: Package[]) => {
    await updateDoc(doc(db, 'projects', projectId), { packages });
    setProjects(prev =>
      prev.map(p => (p.id === projectId ? { ...p, packages } : p))
    );
    // 更新選中的專案
    if (selectedProject?.id === projectId) {
      setSelectedProject(prev => prev ? { ...prev, packages } : null);
    }
  };

  // 計算進度百分比
  const calculateProgress = (completed: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  // 計算專案總進度
  const calculateProjectProgress = (project: Project) => {
    const totalTasks = project.packages.reduce((total, pkg) => 
      total + pkg.subpackages.reduce((subTotal, sub) => 
        subTotal + sub.taskpackages.length, 0
      ), 0
    );
    const completedTasks = project.packages.reduce((total, pkg) => 
      total + pkg.subpackages.reduce((subTotal, sub) => 
        subTotal + sub.taskpackages.reduce((taskTotal, task) => 
          taskTotal + task.completed, 0
        ), 0
      ), 0
    );
    return {
      completed: completedTasks,
      total: totalTasks,
      progress: calculateProgress(completedTasks, totalTasks)
    };
  };

  // 處理項目點擊事件
  const handleItemClick = (item: SelectedItem) => {
    setSelectedItem(item);
    // 如果是專案，同時更新選中的專案
    if (item?.type === 'project') {
      const project = projects.find(p => p.id === item.projectId);
      if (project) {
        setSelectedProject(project);
      }
    }
  };

  // 處理建立專案按鈕點擊
  const handleAddProjectClick = () => {
    setShowProjectInput(true);
  };

  // 檢查是否有查看專案權限
  if (!hasPermission('project:read')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>權限不足</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              您沒有權限查看專案列表
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full pb-20">
        <Sidebar className="z-50">
          <SidebarHeader className="border-b px-6 py-4">
            <div className="flex items-center gap-2">
              <FolderIcon className="h-5 w-5" />
              <h2 className="text-lg font-semibold">專案管理</h2>
            </div>
          </SidebarHeader>
          <SidebarContent className="pb-20">
            {/* 專案樹狀結構 */}
              <SidebarGroup>
                <SidebarGroupLabel className="px-4 py-2 text-sm font-medium text-muted-foreground">
                專案列表
                </SidebarGroupLabel>
                <SidebarGroupContent>
                <SidebarMenu>
                  {projects.map(project => (
                    <ProjectTree 
                      key={project.id} 
                      project={project}
                      selectedProject={selectedProject}
                      selectedItem={selectedItem}
                      onSelectProject={setSelectedProject}
                      onItemClick={handleItemClick}
                      onAddPackage={handleAddPackage}
                      onAddTaskPackage={handleAddTaskPackage}
                      onAddSubpackage={handleAddSubpackage}
                      pkgInputs={pkgInputs}
                      setPkgInputs={setPkgInputs}
                      taskPackageInputs={taskPackageInputs}
                      setTaskPackageInputs={setTaskPackageInputs}
                      subInputs={subInputs}
                      setSubInputs={setSubInputs}
                      loading={loading}
                    />
                  ))}
                  
                  {/* 新增專案按鈕 - 只有有權限的用戶才能看到 */}
                  <ProjectActionGuard action="create" resource="project">
                    <SidebarMenuItem>
                      <div className="pl-1 pr-1 py-1">
                        {showProjectInput ? (
                          <div className="flex gap-1">
                            <Input
                              placeholder="專案名稱"
                              value={projectName}
                              onChange={e => setProjectName(e.target.value)}
                              className={COMPACT_INPUT_STYLE}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  void handleCreateProject();
                                  setShowProjectInput(false);
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              onClick={() => {
                                void handleCreateProject();
                                setShowProjectInput(false);
                              }}
                              disabled={loading || !projectName.trim()}
                              className="h-6 w-6 p-0"
                            >
                              <PlusIcon className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleAddProjectClick}
                            className={COMPACT_BUTTON_STYLE}
                          >
                            <PlusIcon className="h-3 w-3 mr-1" />
                            {projects.length === 0 ? '新增第一個專案' : '新增專案'}
                          </Button>
                        )}
                        {success && (
                          <p className="text-green-600 text-center text-xs mt-1">專案建立成功！</p>
                        )}
                      </div>
                    </SidebarMenuItem>
                  </ProjectActionGuard>
                </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
          </SidebarContent>
          <SidebarRail />
        </Sidebar>

        <ResizablePanelGroup
          direction="horizontal"
          className="flex-1 min-h-0"
        >
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="flex h-full flex-col">
              <header className="border-b px-6 py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex items-center gap-2">
                  <SidebarTrigger />
                  <h1 className="text-xl font-semibold">
                    {selectedProject ? selectedProject.name : '選擇專案'}
                  </h1>
                </div>
              </header>
              
              <div className="flex-1 overflow-auto p-6 pb-20">
                {selectedItem ? (
                  <div className="space-y-6">
                    {/* 根據選中項目類型顯示不同內容 */}
                    {selectedItem.type === 'project' && selectedProject && (
                      <>
                        {/* 專案資訊 */}
                        <Card className="border-0 shadow-sm">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <SettingsIcon className="h-5 w-5" />
                              專案資訊
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-gray-400">
                              建立時間：{new Date(selectedProject.createdAt).toLocaleString('zh-TW')}
                            </p>
                          </CardContent>
                        </Card>

                        {/* 專案概覽卡片 */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <Card className="border-0 shadow-sm">
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-2">
                                <PackageIcon className="h-5 w-5 text-blue-500" />
                                <div>
                                  <p className="text-2xl font-bold">{selectedProject.packages?.length || 0}</p>
                                  <p className="text-sm text-muted-foreground">工作包</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card className="border-0 shadow-sm">
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-2">
                                <ListIcon className="h-5 w-5 text-purple-500" />
                                <div>
                                  <p className="text-2xl font-bold">
                                    {selectedProject.packages?.reduce((total, pkg) => 
                                      total + pkg.subpackages?.reduce((taskTotal, task) => 
                                        taskTotal + task.taskpackages?.length || 0, 0
                                      ), 0
                                    ) || 0}
                                  </p>
                                  <p className="text-sm text-muted-foreground">子工作包</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card className="border-0 shadow-sm">
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-2">
                                <CheckSquareIcon className="h-5 w-5 text-green-500" />
                                <div>
                                  <p className="text-2xl font-bold">
                                    {selectedProject.packages?.reduce((total, pkg) => 
                                      total + pkg.subpackages?.reduce((subTotal, sub) => 
                                        subTotal + sub.taskpackages?.length, 0
                                      ), 0
                                    ) || 0}
                                  </p>
                                  <p className="text-sm text-muted-foreground">任務</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="border-0 shadow-sm">
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-2">
                                <div className="h-5 w-5 rounded-full bg-gradient-to-r from-blue-500 to-green-500" />
                                <div className="flex-1">
                                  <p className="text-2xl font-bold">
                                    {(() => {
                                      const progress = calculateProjectProgress(selectedProject);
                                      return `${progress.progress}%`;
                                    })()}
                                  </p>
                                  <p className="text-sm text-muted-foreground">完成進度</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* 進度條 */}
                        <Card className="border-0 shadow-sm">
                          <CardHeader>
                            <CardTitle className="text-lg">專案進度</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {(() => {
                              const progress = calculateProjectProgress(selectedProject);
                              return (
                                <div className="space-y-4">
                                  <div className="flex justify-between text-sm">
                                    <span>整體進度</span>
                                    <span>{progress.completed} / {progress.total} ({progress.progress}%)</span>
                                  </div>
                                  <Progress value={progress.progress} className="h-2" />
                                </div>
                              );
                            })()}
                          </CardContent>
                        </Card>
                      </>
                    )}

                    {selectedItem.type === 'package' && selectedProject && (
                      <Card className="border-0 shadow-sm">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <PackageIcon className="h-5 w-5" />
                            工作包：{selectedProject.packages[selectedItem.packageIndex]?.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {/* 工作包進度 */}
                            <div>
                              <div className="flex justify-between text-sm mb-2">
                                <span>工作包進度</span>
                                <span>
                                  {selectedProject.packages[selectedItem.packageIndex]?.completed || 0} / {selectedProject.packages[selectedItem.packageIndex]?.total || 0} 
                                  ({selectedProject.packages[selectedItem.packageIndex]?.progress || 0}%)
                                </span>
                              </div>
                              <Progress value={selectedProject.packages[selectedItem.packageIndex]?.progress || 0} className="h-2" />
                            </div>

                            <div>
                              <h4 className="font-medium mb-2">子工作包列表</h4>
                              {selectedProject.packages[selectedItem.packageIndex]?.subpackages?.length > 0 ? (
                                <div className="space-y-2">
                                  {selectedProject.packages[selectedItem.packageIndex].subpackages.map((sub, idx) => (
                                    <div key={idx} className="p-3 border rounded-lg">
                                      <div className="flex items-center gap-2 mb-2">
                                        <ListIcon className="h-4 w-4" />
                                        <span className="font-medium">{sub.name}</span>
                                        <span className="text-sm text-muted-foreground">
                                          ({sub.taskpackages?.length || 0} 個任務)
                                        </span>
                                        <span className="text-sm text-blue-600">
                                          {sub.completed || 0}/{sub.total || 0} ({sub.progress || 0}%)
                                        </span>
                                      </div>
                                      <Progress value={sub.progress || 0} className="h-1 mb-2" />
                                      {sub.taskpackages?.length > 0 && (
                                        <div className="ml-6 space-y-1">
                                          {sub.taskpackages.map((task, taskIdx) => (
                                            <div key={taskIdx} className="flex items-center gap-2 text-sm">
                                              <CheckSquareIcon className="h-3 w-3" />
                                              <span>{task.name}</span>
                                              <span className="text-xs text-muted-foreground">
                                                {task.completed || 0}/{task.total || 0}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-muted-foreground">尚無子工作包</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {selectedItem.type === 'subpackage' && selectedProject && (
                      <Card className="border-0 shadow-sm">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <ListIcon className="h-5 w-5" />
                            子工作包：{selectedProject.packages[selectedItem.packageIndex]?.name} - {selectedProject.packages[selectedItem.packageIndex]?.subpackages[selectedItem.subpackageIndex]?.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {/* 子工作包進度 */}
                            <div>
                              <div className="flex justify-between text-sm mb-2">
                                <span>子工作包進度</span>
                                <span>
                                  {selectedProject.packages[selectedItem.packageIndex]?.subpackages[selectedItem.subpackageIndex]?.completed || 0} / {selectedProject.packages[selectedItem.packageIndex]?.subpackages[selectedItem.subpackageIndex]?.total || 0} 
                                  ({selectedProject.packages[selectedItem.packageIndex]?.subpackages[selectedItem.subpackageIndex]?.progress || 0}%)
                                </span>
                              </div>
                              <Progress value={selectedProject.packages[selectedItem.packageIndex]?.subpackages[selectedItem.subpackageIndex]?.progress || 0} className="h-2" />
                            </div>

                            <div>
                              <h4 className="font-medium mb-2">任務列表</h4>
                              {selectedProject.packages[selectedItem.packageIndex]?.subpackages[selectedItem.subpackageIndex]?.taskpackages?.length > 0 ? (
                                <div className="space-y-2">
                                  {selectedProject.packages[selectedItem.packageIndex].subpackages[selectedItem.subpackageIndex].taskpackages.map((task, idx) => (
                                    <div key={idx} className="p-3 border rounded">
                                      <div className="flex items-center gap-2 mb-2">
                                        <CheckSquareIcon className="h-4 w-4" />
                                        <span className="font-medium">{task.name}</span>
                                        <span className="text-sm text-blue-600">
                                          {task.completed || 0}/{task.total || 0} ({task.progress || 0}%)
                                        </span>
                                      </div>
                                      <Progress value={task.progress || 0} className="h-1" />
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-muted-foreground">尚無任務</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {selectedItem.type === 'task' && selectedProject && (
                      <Card className="border-0 shadow-sm">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <CheckSquareIcon className="h-5 w-5" />
                            任務：{selectedProject.packages[selectedItem.packageIndex]?.subpackages[selectedItem.subpackageIndex]?.taskpackages[selectedItem.taskIndex]?.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {/* 任務進度 */}
                            <div>
                              <div className="flex justify-between text-sm mb-2">
                                <span>任務進度</span>
                                <span>
                                  {selectedProject.packages[selectedItem.packageIndex]?.subpackages[selectedItem.subpackageIndex]?.taskpackages[selectedItem.taskIndex]?.completed || 0} / {selectedProject.packages[selectedItem.packageIndex]?.subpackages[selectedItem.subpackageIndex]?.taskpackages[selectedItem.taskIndex]?.total || 0} 
                                  ({selectedProject.packages[selectedItem.packageIndex]?.subpackages[selectedItem.subpackageIndex]?.taskpackages[selectedItem.taskIndex]?.progress || 0}%)
                                </span>
                              </div>
                              <Progress value={selectedProject.packages[selectedItem.packageIndex]?.subpackages[selectedItem.subpackageIndex]?.taskpackages[selectedItem.taskIndex]?.progress || 0} className="h-2" />
                            </div>

                            <div>
                              <h4 className="font-medium mb-2">任務詳情</h4>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">所屬工作包：</span>
                                  <span>{selectedProject.packages[selectedItem.packageIndex]?.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">所屬子工作包：</span>
                                  <span>{selectedProject.packages[selectedItem.packageIndex]?.subpackages[selectedItem.subpackageIndex]?.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">任務名稱：</span>
                                  <span>{selectedProject.packages[selectedItem.packageIndex]?.subpackages[selectedItem.subpackageIndex]?.taskpackages[selectedItem.taskIndex]?.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">完成數量：</span>
                                  <span>{selectedProject.packages[selectedItem.packageIndex]?.subpackages[selectedItem.subpackageIndex]?.taskpackages[selectedItem.taskIndex]?.completed || 0}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">總數量：</span>
                                  <span>{selectedProject.packages[selectedItem.packageIndex]?.subpackages[selectedItem.subpackageIndex]?.taskpackages[selectedItem.taskIndex]?.total || 0}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">請選擇一個項目</p>
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle className="w-1 bg-border hover:bg-border/80 transition-colors" />

          <ResizablePanel defaultSize={50} minSize={20}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={25} minSize={15}>
                <div className="flex h-full items-center justify-center p-6 bg-muted/5">
                  <div className="text-center">
                    <h3 className="font-semibold mb-2">專案概覽</h3>
                    {selectedProject ? (
                      <div className="text-sm space-y-1">
                        <p><strong>專案名稱：</strong>{selectedProject.name}</p>
                        <p><strong>工作包數量：</strong>{selectedProject.packages?.length || 0}</p>
                        <p><strong>總子工作包數：</strong>
                          {selectedProject.packages?.reduce((total, pkg) => 
                            total + pkg.subpackages?.reduce((taskTotal, task) => 
                              taskTotal + task.taskpackages?.length || 0, 0
                            ), 0
                          ) || 0}
                        </p>
                        <p><strong>總任務數：</strong>
                          {selectedProject.packages?.reduce((total, pkg) => 
                            total + pkg.subpackages?.reduce((subTotal, sub) => 
                              subTotal + sub.taskpackages?.length, 0
                            ), 0
                          ) || 0}
                        </p>
                        <p><strong>完成進度：</strong>
                          {(() => {
                            const progress = calculateProjectProgress(selectedProject);
                            return `${progress.completed}/${progress.total} (${progress.progress}%)`;
                          })()}
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-500">選擇專案以查看概覽</p>
                    )}
                  </div>
                </div>
              </ResizablePanel>
              
              <ResizableHandle withHandle className="h-1 bg-border hover:bg-border/80 transition-colors" />
              
              <ResizablePanel defaultSize={75} minSize={25}>
                <div className="flex h-full items-center justify-center p-6 bg-muted/10">
                  <div className="text-center">
                    <h3 className="font-semibold mb-2">詳細資訊</h3>
                    {selectedProject ? (
                      <div className="text-sm space-y-1">
                        <p><strong>建立時間：</strong></p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(selectedProject.createdAt).toLocaleString('zh-TW')}
                        </p>
                        <p><strong>專案描述：</strong></p>
                        <p className="text-xs text-muted-foreground">
                          {selectedProject.description || '無描述'}
                        </p>
                        <p><strong>專案進度：</strong></p>
                        <p className="text-xs text-muted-foreground">
                          {(() => {
                            const progress = calculateProjectProgress(selectedProject);
                            return `已完成 ${progress.completed} 個任務，共 ${progress.total} 個任務`;
                          })()}
                        </p>
                        <p><strong>進度百分比：</strong></p>
                        <p className="text-xs text-muted-foreground">
                          {(() => {
                            const progress = calculateProjectProgress(selectedProject);
                            return `${progress.progress}%`;
                          })()}
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-500">選擇專案以查看詳細資訊</p>
                    )}
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </SidebarProvider>
  );
}

// ProjectTree 組件 - 實現樹狀結構
interface ProjectTreeProps {
  project: Project;
  selectedProject: Project | null;
  selectedItem: SelectedItem;
  onSelectProject: (project: Project) => void;
  onItemClick: (item: SelectedItem) => void;
  onAddPackage: (projectId: string, pkgName: string) => Promise<void>;
  onAddTaskPackage: (projectId: string, pkgIdx: number, subIdx: number, taskPackageName: string) => Promise<void>;
  onAddSubpackage: (projectId: string, pkgIdx: number, subName: string) => Promise<void>;
  pkgInputs: Record<string, string>;
  setPkgInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  taskPackageInputs: Record<string, Record<number, string>>;
  setTaskPackageInputs: React.Dispatch<React.SetStateAction<Record<string, Record<number, string>>>>;
  subInputs: Record<string, Record<number, Record<number, string>>>;
  setSubInputs: React.Dispatch<React.SetStateAction<Record<string, Record<number, Record<number, string>>>>>;
  loading: boolean;
}

function ProjectTree({
  project,
  selectedProject,
  selectedItem,
  onSelectProject,
  onItemClick,
  onAddPackage,
  onAddTaskPackage,
  onAddSubpackage,
  pkgInputs,
  setPkgInputs,
  taskPackageInputs,
  setTaskPackageInputs,
  subInputs,
  setSubInputs,
  loading
}: ProjectTreeProps) {
  const [expandedPackages, setExpandedPackages] = useState<Set<number>>(new Set());
  const [expandedTasks, setExpandedTasks] = useState<Record<number, Set<number>>>({});
  const [showPackageInput, setShowPackageInput] = useState(false);
  const [showTaskPackageInputs, setShowTaskPackageInputs] = useState<Record<number, boolean>>({});
  const [showSubInputs, setShowSubInputs] = useState<Record<number, Record<number, boolean>>>({});

  const togglePackageExpanded = (pkgIdx: number) => {
    setExpandedPackages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pkgIdx)) {
        newSet.delete(pkgIdx);
      } else {
        newSet.add(pkgIdx);
      }
      return newSet;
    });
  };

  const toggleTaskExpanded = (pkgIdx: number, taskIdx: number) => {
    setExpandedTasks(prev => {
      const newTasks = { ...prev };
      if (!newTasks[pkgIdx]) {
        newTasks[pkgIdx] = new Set();
      }
      const taskSet = new Set(newTasks[pkgIdx]);
      if (taskSet.has(taskIdx)) {
        taskSet.delete(taskIdx);
      } else {
        taskSet.add(taskIdx);
      }
      newTasks[pkgIdx] = taskSet;
      return newTasks;
    });
  };

  const handleAddPackageClick = () => {
    setShowPackageInput(true);
  };

  const handleAddTaskPackageClick = (pkgIdx: number) => {
    setShowTaskPackageInputs(prev => ({ ...prev, [pkgIdx]: true }));
  };

  const handleAddSubClick = (pkgIdx: number, taskIdx: number) => {
    setShowSubInputs(prev => ({
      ...prev,
      [pkgIdx]: { ...prev[pkgIdx], [taskIdx]: true }
    }));
  };

  // 檢查項目是否被選中
  const isItemSelected = (item: SelectedItem) => {
    if (!selectedItem || !item) return false;
    return JSON.stringify(selectedItem) === JSON.stringify(item);
  };

  return (
    <SidebarMenuItem>
      <Collapsible
        className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
        defaultOpen={selectedProject?.id === project.id}
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            isActive={selectedProject?.id === project.id}
            onClick={() => onSelectProject(project)}
            className="pl-2"
          >
            <ChevronRightIcon className="transition-transform h-4 w-4" />
            <div 
              onClick={(e) => {
                e.stopPropagation();
                onItemClick({ type: 'project', projectId: project.id });
              }}
              className={`${ITEM_SELECT_STYLE} ${
                isItemSelected({ type: 'project', projectId: project.id }) ? 'bg-accent' : ''
              }`}
            >
              <FolderIcon className="h-4 w-4" />
              <span className="truncate">{project.name}</span>
            </div>
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub className="mx-1 border-l border-border/30">
            {/* 工作包列表 */}
            {project.packages?.map((pkg, pkgIdx) => (
              <SidebarMenuItem key={pkgIdx}>
                <Collapsible
                  className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
                  defaultOpen={expandedPackages.has(pkgIdx)}
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      onClick={() => togglePackageExpanded(pkgIdx)}
                      className="pl-2"
                    >
                      <ChevronRightIcon className="transition-transform h-3 w-3" />
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          onItemClick({ type: 'package', projectId: project.id, packageIndex: pkgIdx });
                        }}
                        className={`${ITEM_SELECT_STYLE} ${
                          isItemSelected({ type: 'package', projectId: project.id, packageIndex: pkgIdx }) ? 'bg-accent' : ''
                        }`}
                      >
                        <PackageIcon className="h-3 w-3" />
                        <span className="truncate text-sm">{pkg.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {pkg.subpackages?.length || 0}
                        </span>
                        <span className="text-xs text-blue-600">
                          {pkg.completed || 0}/{pkg.total || 0}
                        </span>
                      </div>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="mx-1 border-l border-border/20">
                      {/* 子工作包列表 */}
                      {pkg.subpackages?.map((sub, taskIdx) => (
                        <SidebarMenuItem key={taskIdx}>
                          <Collapsible
                            className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
                            defaultOpen={expandedTasks[pkgIdx]?.has(taskIdx)}
                          >
                            <CollapsibleTrigger asChild>
                              <SidebarMenuButton
                                onClick={() => toggleTaskExpanded(pkgIdx, taskIdx)}
                                className="pl-2"
                              >
                                <ChevronRightIcon className="transition-transform h-3 w-3" />
                                <div 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onItemClick({ type: 'subpackage', projectId: project.id, packageIndex: pkgIdx, subpackageIndex: taskIdx });
                                  }}
                                  className={`${ITEM_SELECT_STYLE} ${
                                    isItemSelected({ type: 'subpackage', projectId: project.id, packageIndex: pkgIdx, subpackageIndex: taskIdx }) ? 'bg-accent' : ''
                                  }`}
                                >
                                  <ListIcon className="h-3 w-3" />
                                  <span className="truncate text-xs">{sub.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {sub.taskpackages?.length || 0}
                                  </span>
                                  <span className="text-xs text-blue-600">
                                    {sub.completed || 0}/{sub.total || 0}
                                  </span>
                                </div>
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub className="mx-1 border-l border-border/10">
                                {/* 任務列表 */}
                                {sub.taskpackages?.map((task, subIdx) => (
                                  <SidebarMenuItem key={subIdx}>
                                    <SidebarMenuButton className="pl-2">
                                      <div 
                                        onClick={() => onItemClick({ 
                                          type: 'task', 
                                          projectId: project.id, 
                                          packageIndex: pkgIdx, 
                                          subpackageIndex: taskIdx, 
                                          taskIndex: subIdx 
                                        })}
                                        className={`${ITEM_SELECT_STYLE} ${
                                          isItemSelected({ 
                                            type: 'task', 
                                            projectId: project.id, 
                                            packageIndex: pkgIdx, 
                                            subpackageIndex: taskIdx, 
                                            taskIndex: subIdx 
                                          }) ? 'bg-accent' : ''
                                        }`}
                                      >
                                        <CheckSquareIcon className="h-3 w-3" />
                                        <span className="truncate text-xs">{task.name}</span>
                                        <span className="text-xs text-blue-600">
                                          {task.completed || 0}/{task.total || 0}
                                        </span>
                                      </div>
                                    </SidebarMenuButton>
                                  </SidebarMenuItem>
                                ))}
                                {/* 新增任務按鈕 - 只有有權限的用戶才能看到 */}
                                <ProjectActionGuard action="create" resource="task">
                                  <SidebarMenuItem>
                                    <div className="pl-2 pr-1 py-1">
                                      {showSubInputs[pkgIdx]?.[taskIdx] ? (
                                        <div className="flex gap-1">
                                          <Input
                                            placeholder="任務名稱"
                                            value={subInputs[project.id]?.[pkgIdx]?.[taskIdx] || ''}
                                            onChange={e => setSubInputs(prev => ({
                                              ...prev,
                                              [project.id]: {
                                                ...prev[project.id],
                                                [pkgIdx]: {
                                                  ...prev[project.id]?.[pkgIdx],
                                                  [taskIdx]: e.target.value
                                                }
                                              }
                                            }))}
                                            className={COMPACT_INPUT_STYLE}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                void onAddTaskPackage(project.id, pkgIdx, taskIdx, subInputs[project.id]?.[pkgIdx]?.[taskIdx] || '');
                                                setShowSubInputs(prev => ({
                                                  ...prev,
                                                  [pkgIdx]: { ...prev[pkgIdx], [taskIdx]: false }
                                                }));
                                              }
                                            }}
                                          />
                                          <Button
                                            size="sm"
                                            onClick={() => {
                                              void onAddTaskPackage(project.id, pkgIdx, taskIdx, subInputs[project.id]?.[pkgIdx]?.[taskIdx] || '');
                                              setShowSubInputs(prev => ({
                                                ...prev,
                                                [pkgIdx]: { ...prev[pkgIdx], [taskIdx]: false }
                                              }));
                                            }}
                                            disabled={loading || !(subInputs[project.id]?.[pkgIdx]?.[taskIdx] || '').trim()}
                                            className={SMALL_BUTTON_STYLE}
                                          >
                                            <PlusIcon className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleAddSubClick(pkgIdx, taskIdx)}
                                          className={COMPACT_BUTTON_STYLE}
                                        >
                                          <PlusIcon className="h-3 w-3 mr-1" />
                                          新增任務
                                        </Button>
                                      )}
                                    </div>
                                  </SidebarMenuItem>
                                </ProjectActionGuard>
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </Collapsible>
                        </SidebarMenuItem>
                      ))}
                      {/* 新增子工作包按鈕 - 只有有權限的用戶才能看到 */}
                      <ProjectActionGuard action="create" resource="subpackage">
                        <SidebarMenuItem>
                          <div className="pl-1 pr-1 py-1">
                            {showTaskPackageInputs[pkgIdx] ? (
                              <div className="flex gap-1">
                                <Input
                                  placeholder="子工作包名稱"
                                  value={taskPackageInputs[project.id]?.[pkgIdx] || ''}
                                  onChange={e => setTaskPackageInputs(prev => ({
                                    ...prev,
                                    [project.id]: { ...prev[project.id], [pkgIdx]: e.target.value }
                                  }))}
                                  className={COMPACT_INPUT_STYLE}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      void onAddSubpackage(project.id, pkgIdx, taskPackageInputs[project.id]?.[pkgIdx] || '');
                                      setShowTaskPackageInputs(prev => ({ ...prev, [pkgIdx]: false }));
                                    }
                                  }}
                                />
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    void onAddSubpackage(project.id, pkgIdx, taskPackageInputs[project.id]?.[pkgIdx] || '');
                                    setShowTaskPackageInputs(prev => ({ ...prev, [pkgIdx]: false }));
                                  }}
                                  disabled={loading || !(taskPackageInputs[project.id]?.[pkgIdx] || '').trim()}
                                  className={SMALL_BUTTON_STYLE}
                                >
                                  <PlusIcon className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAddTaskPackageClick(pkgIdx)}
                                className={COMPACT_BUTTON_STYLE}
                              >
                                <PlusIcon className="h-3 w-3 mr-1" />
                                新增子工作包
                              </Button>
                            )}
                          </div>
                        </SidebarMenuItem>
                      </ProjectActionGuard>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
            ))}
            {/* 新增工作包按鈕 - 只有有權限的用戶才能看到 */}
            <ProjectActionGuard action="create" resource="package">
              <SidebarMenuItem>
                <div className="pl-1 pr-1 py-1">
                  {showPackageInput ? (
                    <div className="flex gap-1">
                      <Input
                        placeholder="工作包名稱"
                        value={pkgInputs[project.id] || ''}
                        onChange={e => setPkgInputs(prev => ({ ...prev, [project.id]: e.target.value }))}
                        className={COMPACT_INPUT_STYLE}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            void onAddPackage(project.id, pkgInputs[project.id] || '');
                            setShowPackageInput(false);
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          void onAddPackage(project.id, pkgInputs[project.id] || '');
                          setShowPackageInput(false);
                        }}
                        disabled={loading || !(pkgInputs[project.id] || '').trim()}
                        className={SMALL_BUTTON_STYLE}
                      >
                        <PlusIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleAddPackageClick}
                      className={COMPACT_BUTTON_STYLE}
                    >
                      <PlusIcon className="h-3 w-3 mr-1" />
                      新增工作包
                    </Button>
                  )}
                </div>
              </SidebarMenuItem>
            </ProjectActionGuard>
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
} 