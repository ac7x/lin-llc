'use client';
import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
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

interface TaskPackage { name: string }
interface Subpackage { taskpackages: TaskPackage[] }
interface Package { name: string; subpackages: Subpackage[] }
interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  packages: Package[];
}

export default function ProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [pkgInputs, setPkgInputs] = useState<Record<string, string>>({});
  const [taskPackageInputs, setTaskPackageInputs] = useState<Record<string, Record<number, string>>>({});
  const [subInputs, setSubInputs] = useState<Record<string, Record<number, Record<number, string>>>>({});
  const [showTaskPackageInputs, setShowTaskPackageInputs] = useState<Record<number, boolean>>({});

  // 載入專案列表
  useEffect(() => {
    void (async () => {
      const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const projectList = snapshot.docs.map(doc => {
        const data = doc.data();
        // 確保 packages 是陣列，且每個 package 都有 tasks 陣列
        const packages = Array.isArray(data.packages) 
          ? data.packages.map((pkg: any) => ({
              name: pkg.name || '',
              subpackages: Array.isArray(pkg.subpackages) 
                ? pkg.subpackages.map((sub: any) => ({ taskpackages: Array.isArray(sub.taskpackages) ? sub.taskpackages.map((task: any) => ({ name: task.name || '' })) : [] }))
                : []
            }))
          : [];
        
        return {
          id: doc.id,
          name: data.name || '',
          description: data.description || '',
          createdAt: data.createdAt || new Date().toISOString(),
          packages,
        };
      }) as Project[];
      setProjects(projectList);
      // 預設選擇第一個專案
      if (projectList.length > 0 && !selectedProject) {
        setSelectedProject(projectList[0]);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 建立專案
  const handleCreateProject = async () => {
    if (!projectName.trim()) return;
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'projects'), {
        name: projectName.trim(),
        description: projectDescription.trim(),
        createdAt: new Date().toISOString(),
        packages: [],
      });
      const newProject: Project = {
        id: docRef.id,
        name: projectName.trim(),
        description: projectDescription.trim(),
        createdAt: new Date().toISOString(),
        packages: [],
      };
      setProjects(prev => [newProject, ...prev]);
      setProjectName('');
      setProjectDescription('');
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
    setLoading(true);
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;
      const updatedPackages = [
        ...project.packages,
        { name: pkgName.trim(), subpackages: [] }
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
    setLoading(true);
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;
      const updatedPackages = project.packages.map((pkg, idx) =>
        idx === pkgIdx
          ? { ...pkg, subpackages: [...pkg.subpackages, { taskpackages: [] }] }
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
                  ? { ...sub, taskpackages: [...sub.taskpackages, { name: taskPackageName.trim() }] }
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

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar className="z-50">
          <SidebarHeader className="border-b px-6 py-4">
            <div className="flex items-center gap-2">
              <FolderIcon className="h-5 w-5" />
              <h2 className="text-lg font-semibold">專案管理</h2>
            </div>
          </SidebarHeader>
          <SidebarContent className="pb-20">
            {/* 建立專案表單 */}
            <SidebarGroup>
              <SidebarGroupLabel className="px-4 py-2 text-sm font-medium text-muted-foreground">
                建立專案
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="p-4 space-y-2">
                  <Input
                    placeholder="專案名稱"
                    value={projectName}
                    onChange={e => setProjectName(e.target.value)}
                    className="text-sm"
                  />
                  <Input
                    placeholder="專案描述（選填）"
                    value={projectDescription}
                    onChange={e => setProjectDescription(e.target.value)}
                    className="text-sm"
                  />
                  <Button 
                    onClick={handleCreateProject} 
                    disabled={loading || !projectName.trim()}
                    className="w-full"
                    size="sm"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    {loading ? '建立中...' : '建立專案'}
                  </Button>
                  {success && (
                    <p className="text-green-600 text-center text-xs">專案建立成功！</p>
                  )}
                </div>
              </SidebarGroupContent>
            </SidebarGroup>

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
                      onSelectProject={setSelectedProject}
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
              
              <div className="flex-1 overflow-auto p-6">
                {selectedProject ? (
                  <div className="space-y-6">
                    {/* 專案資訊 */}
                    <Card className="border-0 shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <SettingsIcon className="h-5 w-5" />
                          專案資訊
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 mb-2">{selectedProject.description || '無描述'}</p>
                        <p className="text-sm text-gray-400">
                          建立時間：{new Date(selectedProject.createdAt).toLocaleString('zh-TW')}
                        </p>
                      </CardContent>
                    </Card>

                    {/* 專案概覽卡片 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            <CheckSquareIcon className="h-5 w-5 text-green-500" />
                            <div>
                              <p className="text-2xl font-bold">
                                {selectedProject.packages?.reduce((total, pkg) => total + (pkg.subpackages?.length || 0), 0) || 0}
                              </p>
                              <p className="text-sm text-muted-foreground">任務</p>
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
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">請選擇一個專案</p>
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
                        <p><strong>總任務數：</strong>
                          {selectedProject.packages?.reduce((total, pkg) => total + (pkg.subpackages?.length || 0), 0) || 0}
                        </p>
                        <p><strong>總子工作包數：</strong>
                          {selectedProject.packages?.reduce((total, pkg) => 
                            total + pkg.subpackages?.reduce((taskTotal, task) => 
                              taskTotal + task.taskpackages?.length || 0, 0
                            ), 0
                          ) || 0}
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
  onSelectProject: (project: Project) => void;
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
  onSelectProject,
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
      const packageTasks = new Set(prev[pkgIdx] || []);
      if (packageTasks.has(taskIdx)) {
        packageTasks.delete(taskIdx);
      } else {
        packageTasks.add(taskIdx);
      }
      return { ...prev, [pkgIdx]: packageTasks };
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
            <FolderIcon className="h-4 w-4" />
            <span className="truncate">{project.name}</span>
            <Link href={`/project/${project.id}`} className="ml-auto p-1 hover:bg-accent rounded">
              <ChevronRightIcon className="h-3 w-3" />
            </Link>
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
                      <PackageIcon className="h-3 w-3" />
                      <span className="truncate text-sm">{pkg.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {pkg.subpackages?.length || 0}
                      </span>
                      <Link href={`/project/${project.id}/package/${pkgIdx}`} className="ml-1 p-1 hover:bg-accent rounded">
                        <ChevronRightIcon className="h-3 w-3" />
                      </Link>
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
                                <ListIcon className="h-3 w-3" />
                                <span className="truncate text-xs">子工作包 {taskIdx + 1}</span>
                                <span className="ml-auto text-xs text-muted-foreground">
                                  {sub.taskpackages?.length || 0}
                                </span>
                                <Link href={`/project/${project.id}/package/${pkgIdx}/subpackage/${taskIdx}`} className="ml-1 p-1 hover:bg-accent rounded">
                                  <ChevronRightIcon className="h-3 w-3" />
                                </Link>
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub className="mx-1 border-l border-border/10">
                                {/* 任務列表 */}
                                {sub.taskpackages?.map((task, subIdx) => (
                                  <SidebarMenuItem key={subIdx}>
                                    <SidebarMenuButton className="pl-2">
                                      <CheckSquareIcon className="h-3 w-3" />
                                      <span className="truncate text-xs">{task.name}</span>
                                      <Link href={`/project/${project.id}/package/${pkgIdx}/subpackage/${taskIdx}/taskpackage/${subIdx}`} className="ml-auto p-1 hover:bg-accent rounded">
                                        <ChevronRightIcon className="h-3 w-3" />
                                      </Link>
                                    </SidebarMenuButton>
                                  </SidebarMenuItem>
                                ))}
                                {/* 新增任務按鈕 */}
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
                                          className="flex-1 text-xs h-6"
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
                                          className="h-6 w-6 p-0"
                                        >
                                          <PlusIcon className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleAddSubClick(pkgIdx, taskIdx)}
                                        className="w-full justify-start text-xs h-6 text-muted-foreground hover:text-foreground"
                                      >
                                        <PlusIcon className="h-3 w-3 mr-1" />
                                        新增任務
                                      </Button>
                                    )}
                                  </div>
                                </SidebarMenuItem>
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </Collapsible>
                        </SidebarMenuItem>
                      ))}
                      {/* 新增子工作包按鈕 */}
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
                                className="flex-1 text-xs h-6"
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
                                className="h-6 w-6 p-0"
                              >
                                <PlusIcon className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAddTaskPackageClick(pkgIdx)}
                              className="w-full justify-start text-xs h-6 text-muted-foreground hover:text-foreground"
                            >
                              <PlusIcon className="h-3 w-3 mr-1" />
                              新增子工作包
                            </Button>
                          )}
                        </div>
                      </SidebarMenuItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
            ))}
            {/* 新增工作包按鈕 */}
            <SidebarMenuItem>
              <div className="pl-1 pr-1 py-1">
                {showPackageInput ? (
                  <div className="flex gap-1">
                    <Input
                      placeholder="工作包名稱"
                      value={pkgInputs[project.id] || ''}
                      onChange={e => setPkgInputs(prev => ({ ...prev, [project.id]: e.target.value }))}
                      className="flex-1 text-xs h-6"
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
                      className="h-6 w-6 p-0"
                    >
                      <PlusIcon className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAddPackageClick}
                    className="w-full justify-start text-xs h-6 text-muted-foreground hover:text-foreground"
                  >
                    <PlusIcon className="h-3 w-3 mr-1" />
                    新增工作包
                  </Button>
                )}
              </div>
            </SidebarMenuItem>
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
} 