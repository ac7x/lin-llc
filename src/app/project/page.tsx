'use client';
import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { 
  PackageIcon,
  ListIcon,
  SquareIcon,
  SettingsIcon,
} from 'lucide-react';
import { usePermission } from '@/app/settings/hooks/use-permission';
import { ProjectSidebar } from './components/project-sidebar';
import { Project, SelectedItem, Package } from './types';
import { 
  calculateProjectProgress, 
  calculateProjectStatistics,
  updateAllProgress 
} from './utils';
import { useProjectProgress } from './hooks';

export default function ProjectListPage() {
  const { hasPermission } = usePermission();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
  const [loading, setLoading] = useState(false);
  const [pkgInputs, setPkgInputs] = useState<Record<string, string>>({});
  const [taskPackageInputs, setTaskPackageInputs] = useState<Record<string, Record<number, string>>>({});
  const [subInputs, setSubInputs] = useState<Record<string, Record<number, Record<number, string>>>>({});
  
  // 使用進度管理 hook
  const projectProgress = useProjectProgress(selectedProject);

  // 檢查項目是否被選中
  const isItemSelected = (item: SelectedItem) => {
    if (!selectedItem || !item) return false;
    return JSON.stringify(selectedItem) === JSON.stringify(item);
  };

  // 載入專案列表
  useEffect(() => {
    void (async () => {
      setLoading(true);
      // 檢查是否有查看專案權限
      if (!hasPermission('project:read')) {
        console.warn('用戶沒有查看專案權限');
        setLoading(false);
        return;
      }

      try {
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
      } catch (error) {
        console.error('載入專案失敗:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [hasPermission]); // eslint-disable-line react-hooks/exhaustive-deps

  // 建立專案
  const handleCreateProject = async (projectName: string) => {
    // 檢查是否有創建專案權限
    if (!hasPermission('project:write')) {
      console.warn('用戶沒有創建專案權限');
      return;
    }

    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'projects'), {
        name: projectName,
        createdAt: new Date().toISOString(),
        packages: [],
      });
      const newProject: Project = {
        id: docRef.id,
        name: projectName,
        description: '',
        createdAt: new Date().toISOString(),
        packages: [],
        completed: 0,
        total: 0,
        progress: 0,
      };
      setProjects(prev => [newProject, ...prev]);
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

  // 注意：進度計算邏輯已移至 utils/progress-calculator.ts

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

  // 專案列表 Skeleton 組件
  const ProjectListSkeleton = () => (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-2 p-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  );

  // 專案概覽 Skeleton 組件
  const ProjectOverviewSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded" />
              <div className="flex-1">
                <Skeleton className="h-8 w-12 mb-1" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // 進度條 Skeleton 組件
  const ProgressSkeleton = () => (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <Skeleton className="h-6 w-24" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="flex h-screen w-full pb-20">
          <ProjectSidebar
            projects={projects}
            selectedProject={selectedProject}
            selectedItem={selectedItem}
            loading={loading}
            pkgInputs={pkgInputs}
            setPkgInputs={setPkgInputs}
            taskPackageInputs={taskPackageInputs}
            setTaskPackageInputs={setTaskPackageInputs}
            subInputs={subInputs}
            setSubInputs={setSubInputs}
            onSelectProject={setSelectedProject}
            onItemClick={handleItemClick}
            onAddPackage={handleAddPackage}
            onAddTaskPackage={handleAddTaskPackage}
            onAddSubpackage={handleAddSubpackage}
            onCreateProject={handleCreateProject}
            isItemSelected={isItemSelected}
          />

          <ResizablePanelGroup
            direction="horizontal"
            className="flex-1 min-h-0"
          >
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="flex h-full flex-col">
                <header className="border-b px-6 py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                  <div className="flex items-center gap-2">
                    <SidebarTrigger />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <h1 className="text-xl font-semibold truncate max-w-[200px]">
                          {selectedProject ? selectedProject.name : '選擇專案'}
                        </h1>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{selectedProject ? selectedProject.name : '選擇專案'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </header>
                
                <div className="flex-1 overflow-auto p-6 pb-20">
                  {loading ? (
                    <div className="space-y-6">
                      {/* 專案資訊 Skeleton */}
                      <Card className="border-0 shadow-sm">
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-5 w-5" />
                            <Skeleton className="h-6 w-24" />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-4 w-48" />
                        </CardContent>
                      </Card>

                      {/* 專案概覽 Skeleton */}
                      <ProjectOverviewSkeleton />

                      {/* 進度條 Skeleton */}
                      <ProgressSkeleton />
                    </div>
                  ) : selectedItem ? (
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
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <PackageIcon className="h-5 w-5 text-blue-500" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>工作包數量</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <div>
                                    <p className="text-2xl font-bold">{projectProgress.getPackageCount()}</p>
                                    <p className="text-sm text-muted-foreground">工作包</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                            
                            <Card className="border-0 shadow-sm">
                              <CardContent className="pt-6">
                                <div className="flex items-center gap-2">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <ListIcon className="h-5 w-5 text-purple-500" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>子工作包數量</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <div>
                                    <p className="text-2xl font-bold">
                                      {projectProgress.getSubpackageCount()}
                                    </p>
                                    <p className="text-sm text-muted-foreground">子工作包</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                            
                            <Card className="border-0 shadow-sm">
                              <CardContent className="pt-6">
                                <div className="flex items-center gap-2">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <SquareIcon className="h-5 w-5 text-green-500" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>任務總數</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <div>
                                    <p className="text-2xl font-bold">
                                      {projectProgress.getTaskCount()}
                                    </p>
                                    <p className="text-sm text-muted-foreground">任務</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>

                            <Card className="border-0 shadow-sm">
                              <CardContent className="pt-6">
                                <div className="flex items-center gap-2">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="h-5 w-5 rounded-full bg-gradient-to-r from-blue-500 to-green-500" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>完成進度百分比</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <div className="flex-1">
                                    <p className="text-2xl font-bold">
                                      {projectProgress.getProgressPercentage()}%
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
                              <div className="space-y-4">
                                <div className="flex justify-between text-sm">
                                  <span>整體進度</span>
                                  <span>{projectProgress.progressText}</span>
                                </div>
                                <Progress value={projectProgress.getProgressPercentage()} className="h-2" />
                              </div>
                            </CardContent>
                          </Card>
                        </>
                      )}

                      {selectedItem.type === 'package' && selectedProject && (
                        <Card className="border-0 shadow-sm">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <PackageIcon className="h-5 w-5" />
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="truncate max-w-[300px]">
                                    工作包：{selectedProject.packages[selectedItem.packageIndex]?.name}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>工作包：{selectedProject.packages[selectedItem.packageIndex]?.name}</p>
                                </TooltipContent>
                              </Tooltip>
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
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <span className="font-medium truncate max-w-[200px]">{sub.name}</span>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>{sub.name}</p>
                                            </TooltipContent>
                                          </Tooltip>
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
                                                <SquareIcon className="h-3 w-3" />
                                                <Tooltip>
                                                  <TooltipTrigger asChild>
                                                    <span className="truncate max-w-[150px]">{task.name}</span>
                                                  </TooltipTrigger>
                                                  <TooltipContent>
                                                    <p>{task.name}</p>
                                                  </TooltipContent>
                                                </Tooltip>
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
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="truncate max-w-[400px]">
                                    子工作包：{selectedProject.packages[selectedItem.packageIndex]?.name} - {selectedProject.packages[selectedItem.packageIndex]?.subpackages[selectedItem.subpackageIndex]?.name}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>子工作包：{selectedProject.packages[selectedItem.packageIndex]?.name} - {selectedProject.packages[selectedItem.packageIndex]?.subpackages[selectedItem.subpackageIndex]?.name}</p>
                                </TooltipContent>
                              </Tooltip>
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
                                          <SquareIcon className="h-3 w-3" />
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <span className="font-medium truncate max-w-[250px]">{task.name}</span>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>{task.name}</p>
                                            </TooltipContent>
                                          </Tooltip>
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
                              <SquareIcon className="h-5 w-5" />
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="truncate max-w-[400px]">
                                    任務：{selectedProject.packages[selectedItem.packageIndex]?.subpackages[selectedItem.subpackageIndex]?.taskpackages[selectedItem.taskIndex]?.name}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>任務：{selectedProject.packages[selectedItem.packageIndex]?.subpackages[selectedItem.subpackageIndex]?.taskpackages[selectedItem.taskIndex]?.name}</p>
                                </TooltipContent>
                              </Tooltip>
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
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="truncate max-w-[200px]">{selectedProject.packages[selectedItem.packageIndex]?.name}</span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{selectedProject.packages[selectedItem.packageIndex]?.name}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">所屬子工作包：</span>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="truncate max-w-[200px]">{selectedProject.packages[selectedItem.packageIndex]?.subpackages[selectedItem.subpackageIndex]?.name}</span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{selectedProject.packages[selectedItem.packageIndex]?.subpackages[selectedItem.subpackageIndex]?.name}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">任務名稱：</span>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="truncate max-w-[200px]">{selectedProject.packages[selectedItem.packageIndex]?.subpackages[selectedItem.subpackageIndex]?.taskpackages[selectedItem.taskIndex]?.name}</span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{selectedProject.packages[selectedItem.packageIndex]?.subpackages[selectedItem.subpackageIndex]?.taskpackages[selectedItem.taskIndex]?.name}</p>
                                      </TooltipContent>
                                    </Tooltip>
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
                      {loading ? (
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-20" />
                          </div>
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-8" />
                          </div>
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-8" />
                          </div>
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-8" />
                          </div>
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-20" />
                          </div>
                        </div>
                      ) : selectedProject ? (
                        <div className="text-sm space-y-1">
                          <p><strong>專案名稱：</strong>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="truncate max-w-[150px] inline-block">{selectedProject.name}</span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{selectedProject.name}</p>
                              </TooltipContent>
                            </Tooltip>
                          </p>
                          <p><strong>工作包數量：</strong>{projectProgress.getPackageCount()}</p>
                          <p><strong>總子工作包數：</strong>{projectProgress.getSubpackageCount()}</p>
                          <p><strong>總任務數：</strong>{projectProgress.getTaskCount()}</p>
                          <p><strong>完成進度：</strong>{projectProgress.progressText}</p>
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
                      {loading ? (
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-16" />
                          </div>
                          <Skeleton className="h-3 w-32" />
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-16" />
                          </div>
                          <Skeleton className="h-3 w-24" />
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-16" />
                          </div>
                          <Skeleton className="h-3 w-40" />
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-20" />
                          </div>
                          <Skeleton className="h-3 w-16" />
                        </div>
                      ) : selectedProject ? (
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
                            {projectProgress.progressDescription}
                          </p>
                          <p><strong>進度百分比：</strong></p>
                          <p className="text-xs text-muted-foreground">
                            {projectProgress.getProgressPercentage()}%
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
    </TooltipProvider>
  );
} 