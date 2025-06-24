'use client';
import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { PlusIcon, FolderIcon, PackageIcon, CheckSquareIcon } from 'lucide-react';

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

  return (
    <SidebarProvider>
      <div className="flex h-screen">
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
          </SidebarContent>
        </Sidebar>

        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={70}>
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
                        <CardTitle>專案資訊</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 mb-2">{selectedProject.description || '無描述'}</p>
                        <p className="text-sm text-gray-400">
                          建立時間：{new Date(selectedProject.createdAt).toLocaleString('zh-TW')}
                        </p>
                      </CardContent>
                    </Card>

                    {/* 新增工作包表單 */}
                    <Card>
                      <CardHeader>
                        <CardTitle>新增工作包</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
                          <Input
                            placeholder="工作包名稱"
                            value={pkgInputs[selectedProject.id] || ''}
                            onChange={e => setPkgInputs(prev => ({ ...prev, [selectedProject.id]: e.target.value }))}
                            className="flex-1"
                          />
                          <Button
                            onClick={() => handleAddPackage(selectedProject.id, pkgInputs[selectedProject.id] || '')}
                            disabled={loading || !(pkgInputs[selectedProject.id] || '').trim()}
                          >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            新增
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 工作包列表 */}
                    <div className="space-y-4">
                      <h2 className="text-lg font-semibold">工作包列表</h2>
                      {selectedProject.packages?.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">尚無工作包</p>
                      ) : (
                        selectedProject.packages?.map((pkg, pkgIdx) => (
                          <Card key={pkgIdx}>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <PackageIcon className="h-5 w-5" />
                                {pkg.name}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {/* 新增任務表單 */}
                              <div className="flex gap-2">
                                <Input
                                  placeholder="新增任務"
                                  value={taskInputs[selectedProject.id]?.[pkgIdx] || ''}
                                  onChange={e => setTaskInputs(prev => ({
                                    ...prev,
                                    [selectedProject.id]: { ...prev[selectedProject.id], [pkgIdx]: e.target.value }
                                  }))}
                                  className="flex-1"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleAddTask(selectedProject.id, pkgIdx, taskInputs[selectedProject.id]?.[pkgIdx] || '')}
                                  disabled={loading || !(taskInputs[selectedProject.id]?.[pkgIdx] || '').trim()}
                                >
                                  <PlusIcon className="h-4 w-4 mr-2" />
                                  新增任務
                                </Button>
                              </div>

                              {/* 任務列表 */}
                              <div className="space-y-2">
                                {pkg.tasks?.map((task, taskIdx) => (
                                  <div key={taskIdx} className="border rounded p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                      <CheckSquareIcon className="h-4 w-4" />
                                      <span className="font-medium">任務 {taskIdx + 1}</span>
                                    </div>
                                    
                                    {/* 新增子工作包表單 */}
                                    <div className="flex gap-2 mb-2">
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
                                        className="flex-1"
                                        size={20}
                                      />
                                      <Button
                                        size="sm"
                                        onClick={() => handleAddSubpackage(selectedProject.id, pkgIdx, taskIdx, subInputs[selectedProject.id]?.[pkgIdx]?.[taskIdx] || '')}
                                        disabled={loading || !(subInputs[selectedProject.id]?.[pkgIdx]?.[taskIdx] || '').trim()}
                                      >
                                        <PlusIcon className="h-4 w-4 mr-2" />
                                        新增子工作包
                                      </Button>
                                    </div>

                                    {/* 子工作包列表 */}
                                    <ul className="ml-4 space-y-1">
                                      {task.subpackages?.map((sub, subIdx) => (
                                        <li key={subIdx} className="flex items-center gap-2">
                                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                          <span>{sub.name}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
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

          <ResizablePanel defaultSize={30}>
            <div className="h-full border-l bg-muted/10 p-4">
              <h3 className="font-semibold mb-4">專案概覽</h3>
              {selectedProject ? (
                <div className="space-y-4">
                  <div className="text-sm">
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
                </div>
              ) : (
                <p className="text-gray-500 text-sm">選擇專案以查看概覽</p>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </SidebarProvider>
  );
} 