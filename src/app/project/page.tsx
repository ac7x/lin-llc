'use client';
import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
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
} from '@/components/ui/sidebar';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { 
  PlusIcon, 
  FolderIcon, 
  PackageIcon, 
  CheckSquareIcon, 
  ChevronDownIcon,
  ChevronRightIcon,
  SettingsIcon,
  ListIcon
} from 'lucide-react';

interface Subpackage { name: string }
interface Task { subpackages: Subpackage[] }
interface Package { name: string; tasks: Task[] }
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
  const [taskInputs, setTaskInputs] = useState<Record<string, Record<number, string>>>({});
  const [subInputs, setSubInputs] = useState<Record<string, Record<number, Record<number, string>>>>({});
  const [expandedPackages, setExpandedPackages] = useState<Record<string, Set<number>>>({});
  const [expandedTasks, setExpandedTasks] = useState<Record<string, Record<number, Set<number>>>>({});

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
              tasks: Array.isArray(pkg.tasks) 
                ? pkg.tasks.map((task: any) => ({
                    subpackages: Array.isArray(task.subpackages) 
                      ? task.subpackages.map((sub: any) => ({ name: sub.name || '' }))
                      : []
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
        { name: pkgName.trim(), tasks: [] }
      ];
      await updateProjectPackages(projectId, updatedPackages);
      setPkgInputs(prev => ({ ...prev, [projectId]: '' }));
    } finally {
      setLoading(false);
    }
  };

  // 新增任務
  const handleAddTask = async (projectId: string, pkgIdx: number, taskName: string) => {
    if (!taskName.trim()) return;
    setLoading(true);
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;
      const updatedPackages = project.packages.map((pkg, idx) =>
        idx === pkgIdx
          ? { ...pkg, tasks: [...pkg.tasks, { subpackages: [] }] }
          : pkg
      );
      await updateProjectPackages(projectId, updatedPackages);
      setTaskInputs(prev => ({
        ...prev,
        [projectId]: { ...prev[projectId], [pkgIdx]: '' }
      }));
    } finally {
      setLoading(false);
    }
  };

  // 新增子工作包
  const handleAddSubpackage = async (projectId: string, pkgIdx: number, taskIdx: number, subName: string) => {
    if (!subName.trim()) return;
    setLoading(true);
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;
      const updatedPackages = project.packages.map((pkg, i) =>
        i === pkgIdx
          ? {
              ...pkg,
              tasks: pkg.tasks.map((task, j) =>
                j === taskIdx
                  ? { ...task, subpackages: [...task.subpackages, { name: subName.trim() }] }
                  : task
              )
            }
          : pkg
      );
      await updateProjectPackages(projectId, updatedPackages);
      setSubInputs(prev => ({
        ...prev,
        [projectId]: {
          ...prev[projectId],
          [pkgIdx]: { ...prev[projectId]?.[pkgIdx], [taskIdx]: '' }
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

  // 切換工作包展開狀態
  const togglePackageExpanded = (projectId: string, pkgIdx: number) => {
    setExpandedPackages(prev => {
      const newSet = new Set(prev[projectId] || []);
      if (newSet.has(pkgIdx)) {
        newSet.delete(pkgIdx);
      } else {
        newSet.add(pkgIdx);
      }
      return { ...prev, [projectId]: newSet };
    });
  };

  // 切換任務展開狀態
  const toggleTaskExpanded = (projectId: string, pkgIdx: number, taskIdx: number) => {
    setExpandedTasks(prev => {
      const projectTasks = prev[projectId] || {};
      const packageTasks = new Set(projectTasks[pkgIdx] || []);
      if (packageTasks.has(taskIdx)) {
        packageTasks.delete(taskIdx);
      } else {
        packageTasks.add(taskIdx);
      }
      return {
        ...prev,
        [projectId]: { ...projectTasks, [pkgIdx]: packageTasks }
      };
    });
  };

  return (
    <SidebarProvider>
      <AspectRatio ratio={16 / 9} className="h-screen">
        <div className="flex h-full">
          <Sidebar>
            <SidebarHeader className="border-b px-6 py-4">
              <div className="flex items-center gap-2">
                <FolderIcon className="h-5 w-5" />
                <h2 className="text-lg font-semibold">專案管理</h2>
              </div>
            </SidebarHeader>
            <SidebarContent>
              {/* 建立專案表單 */}
              <div className="p-4 border-b">
                <Input
                  placeholder="專案名稱"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  className="mb-2"
                />
                <Input
                  placeholder="專案描述（選填）"
                  value={projectDescription}
                  onChange={e => setProjectDescription(e.target.value)}
                  className="mb-2"
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
                  <p className="text-green-600 text-center mt-2 text-sm">專案建立成功！</p>
                )}
              </div>

              {/* 專案列表 */}
              <SidebarMenu>
                {projects.map(project => (
                  <SidebarMenuItem key={project.id}>
                    <SidebarMenuButton
                      isActive={selectedProject?.id === project.id}
                      onClick={() => setSelectedProject(project)}
                      tooltip={project.description}
                    >
                      <FolderIcon className="h-4 w-4" />
                      <span className="truncate">{project.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>

              {/* 選中專案的工作包管理 */}
              {selectedProject && (
                <SidebarGroup>
                  <SidebarGroupLabel className="px-4 py-2 text-sm font-medium text-muted-foreground">
                    工作包管理
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    {/* 新增工作包 */}
                    <div className="px-4 py-2 border-b">
                      <div className="flex gap-2 mb-2">
                        <Input
                          placeholder="新增工作包"
                          value={pkgInputs[selectedProject.id] || ''}
                          onChange={e => setPkgInputs(prev => ({ ...prev, [selectedProject.id]: e.target.value }))}
                          className="flex-1 text-sm"
                          size={20}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleAddPackage(selectedProject.id, pkgInputs[selectedProject.id] || '')}
                          disabled={loading || !(pkgInputs[selectedProject.id] || '').trim()}
                          className="px-2"
                        >
                          <PlusIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* 工作包列表 */}
                    <div className="space-y-1">
                      {selectedProject.packages?.map((pkg, pkgIdx) => {
                        const isExpanded = expandedPackages[selectedProject.id]?.has(pkgIdx);
                        return (
                          <div key={pkgIdx} className="border-b">
                            {/* 工作包標題 */}
                            <button
                              onClick={() => togglePackageExpanded(selectedProject.id, pkgIdx)}
                              className="w-full px-4 py-2 text-left hover:bg-muted/50 flex items-center gap-2 text-sm"
                            >
                              {isExpanded ? (
                                <ChevronDownIcon className="h-3 w-3" />
                              ) : (
                                <ChevronRightIcon className="h-3 w-3" />
                              )}
                              <PackageIcon className="h-3 w-3" />
                              <span className="truncate">{pkg.name}</span>
                              <span className="ml-auto text-xs text-muted-foreground">
                                {pkg.tasks?.length || 0}
                              </span>
                            </button>

                            {/* 工作包內容 */}
                            {isExpanded && (
                              <div className="bg-muted/20">
                                {/* 新增任務 */}
                                <div className="px-4 py-2 border-b">
                                  <div className="flex gap-2">
                                    <Input
                                      placeholder="新增任務"
                                      value={taskInputs[selectedProject.id]?.[pkgIdx] || ''}
                                      onChange={e => setTaskInputs(prev => ({
                                        ...prev,
                                        [selectedProject.id]: { ...prev[selectedProject.id], [pkgIdx]: e.target.value }
                                      }))}
                                      className="flex-1 text-xs"
                                      size={15}
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() => handleAddTask(selectedProject.id, pkgIdx, taskInputs[selectedProject.id]?.[pkgIdx] || '')}
                                      disabled={loading || !(taskInputs[selectedProject.id]?.[pkgIdx] || '').trim()}
                                      className="px-2"
                                    >
                                      <PlusIcon className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>

                                {/* 任務列表 */}
                                <div className="space-y-1">
                                  {pkg.tasks?.map((task, taskIdx) => {
                                    const isTaskExpanded = expandedTasks[selectedProject.id]?.[pkgIdx]?.has(taskIdx);
                                    return (
                                      <div key={taskIdx} className="border-b">
                                        {/* 任務標題 */}
                                        <button
                                          onClick={() => toggleTaskExpanded(selectedProject.id, pkgIdx, taskIdx)}
                                          className="w-full px-6 py-1.5 text-left hover:bg-muted/30 flex items-center gap-2 text-xs"
                                        >
                                          {isTaskExpanded ? (
                                            <ChevronDownIcon className="h-2.5 w-2.5" />
                                          ) : (
                                            <ChevronRightIcon className="h-2.5 w-2.5" />
                                          )}
                                          <CheckSquareIcon className="h-2.5 w-2.5" />
                                          <span className="truncate">任務 {taskIdx + 1}</span>
                                          <span className="ml-auto text-xs text-muted-foreground">
                                            {task.subpackages?.length || 0}
                                          </span>
                                        </button>

                                        {/* 任務內容 */}
                                        {isTaskExpanded && (
                                          <div className="bg-muted/10">
                                            {/* 新增子工作包 */}
                                            <div className="px-6 py-1.5 border-b">
                                              <div className="flex gap-2">
                                                <Input
                                                  placeholder="新增子工作包"
                                                  value={subInputs[selectedProject.id]?.[pkgIdx]?.[taskIdx] || ''}
                                                  onChange={e => setSubInputs(prev => ({
                                                    ...prev,
                                                    [selectedProject.id]: {
                                                      ...prev[selectedProject.id],
                                                      [pkgIdx]: {
                                                        ...prev[selectedProject.id]?.[pkgIdx],
                                                        [taskIdx]: e.target.value
                                                      }
                                                    }
                                                  }))}
                                                  className="flex-1 text-xs"
                                                  size={12}
                                                />
                                                <Button
                                                  size="sm"
                                                  onClick={() => handleAddSubpackage(selectedProject.id, pkgIdx, taskIdx, subInputs[selectedProject.id]?.[pkgIdx]?.[taskIdx] || '')}
                                                  disabled={loading || !(subInputs[selectedProject.id]?.[pkgIdx]?.[taskIdx] || '').trim()}
                                                  className="px-1.5"
                                                >
                                                  <PlusIcon className="h-2.5 w-2.5" />
                                                </Button>
                                              </div>
                                            </div>

                                            {/* 子工作包列表 */}
                                            <div className="px-6 py-1">
                                              {task.subpackages?.map((sub, subIdx) => (
                                                <div key={subIdx} className="flex items-center gap-2 py-0.5 text-xs">
                                                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                                  <span className="truncate">{sub.name}</span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </SidebarGroupContent>
                </SidebarGroup>
              )}
            </SidebarContent>
          </Sidebar>

          <ResizablePanelGroup
            direction="horizontal"
            className="min-h-[200px] w-full rounded-lg border"
          >
            <ResizablePanel defaultSize={50}>
              <div className="flex h-full flex-col">
                <header className="border-b px-6 py-4">
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
                      <Card>
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
                        <Card>
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
                        
                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex items-center gap-2">
                              <CheckSquareIcon className="h-5 w-5 text-green-500" />
                              <div>
                                <p className="text-2xl font-bold">
                                  {selectedProject.packages?.reduce((total, pkg) => total + (pkg.tasks?.length || 0), 0) || 0}
                                </p>
                                <p className="text-sm text-muted-foreground">任務</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex items-center gap-2">
                              <ListIcon className="h-5 w-5 text-purple-500" />
                              <div>
                                <p className="text-2xl font-bold">
                                  {selectedProject.packages?.reduce((total, pkg) => 
                                    total + pkg.tasks?.reduce((taskTotal, task) => 
                                      taskTotal + (task.subpackages?.length || 0), 0
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
            
            <ResizableHandle withHandle />
            
            <ResizablePanel defaultSize={50}>
              <ResizablePanelGroup direction="vertical">
                <ResizablePanel defaultSize={25}>
                  <div className="flex h-full items-center justify-center p-6">
                    <div className="text-center">
                      <h3 className="font-semibold mb-2">專案概覽</h3>
                      {selectedProject ? (
                        <div className="text-sm space-y-1">
                          <p><strong>專案名稱：</strong>{selectedProject.name}</p>
                          <p><strong>工作包數量：</strong>{selectedProject.packages?.length || 0}</p>
                          <p><strong>總任務數：</strong>
                            {selectedProject.packages?.reduce((total, pkg) => total + (pkg.tasks?.length || 0), 0) || 0}
                          </p>
                          <p><strong>總子工作包數：</strong>
                            {selectedProject.packages?.reduce((total, pkg) => 
                              total + pkg.tasks?.reduce((taskTotal, task) => 
                                taskTotal + (task.subpackages?.length || 0), 0
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
                
                <ResizableHandle withHandle />
                
                <ResizablePanel defaultSize={75}>
                  <div className="flex h-full items-center justify-center p-6">
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
      </AspectRatio>
    </SidebarProvider>
  );
} 