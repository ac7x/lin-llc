'use client';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
import { usePermissionContext } from '@/context/permission-context';
import { ProjectSidebar } from './components/sidebar/project-sidebar';
import { ProjectViewer } from './components/viewer/project-viewer';

import { MainContentSkeleton, RightPanelSkeleton, DetailsSkeleton } from './components/ui/project-skeletons';
import { 
  useProjectData, 
  useProjectOperations, 
  useProjectSelection,
  useProjectProgress,
  useProjectWizard
} from './hooks';
import { SelectedItem } from './types';

export default function ProjectListPage() {
  const { hasPermission, loading: permissionLoading, userRole, userProfile } = usePermissionContext();
  
  // 等待權限檢查完成
  if (permissionLoading) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>載入中...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
            <p className="text-muted-foreground text-center mt-2">
              正在檢查用戶權限...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 檢查是否有查看專案權限 - 在所有其他邏輯之前
  if (!hasPermission('project:read')) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>權限不足</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              您沒有權限查看專案列表
            </p>
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>當前角色：</strong>{userRole?.name || '未分配'}
              </p>
              <p className="text-sm mt-1">
                <strong>用戶資料：</strong>{userProfile?.displayName || '未設定'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <AuthorizedProjectPage />;
}

// 已授權的專案頁面組件
function AuthorizedProjectPage() {
  const { hasPermission } = usePermissionContext();
  
  // 使用專案數據管理 hook
  const projectData = useProjectData(hasPermission);
  
  // 使用專案選擇管理 hook
  const projectSelection = useProjectSelection();
  
  // 使用專案操作 hook
  const projectOperations = useProjectOperations(
    hasPermission,
    (updatedProject) => {
      projectData.updateProject(updatedProject);
      projectSelection.updateSelectedProject(updatedProject);
    },
    (newProject) => {
      projectData.addProject(newProject);
      projectSelection.selectProject(newProject);
    }
  );

  // 使用進度管理 hook
  const projectProgress = useProjectProgress(projectSelection.selectedProject);

  // 使用專案精靈 hook
  const { createProject: createProjectWithWizard, loading: wizardLoading } = useProjectWizard();

  // 當專案列表載入後，自動選擇第一個專案
  useEffect(() => {
    if (projectData.projects.length > 0 && !projectSelection.selectedProject) {
      projectSelection.autoSelectFirstProject(projectData.projects);
    }
  }, [projectData.projects, projectSelection]);

  // CRUD 操作包裝函數
  const handleCreateProject = async (config: {
    name: string;
    createPackages: boolean;
    packageCount: number;
    createSubpackages: boolean;
    subpackageCount: number;
    createTasks: boolean;
    taskCount: number;
  }) => {
    const createdProject = await createProjectWithWizard(config);
    projectData.addProject(createdProject);
    projectSelection.selectProject(createdProject);
  };

  const handleAddPackage = async (projectId: string, pkgName: string) => {
    const success = await projectOperations.addPackage(projectId, pkgName, projectData.projects);
    if (success) {
      projectSelection.clearPackageInput(projectId);
    }
  };

  const handleAddSubpackage = async (projectId: string, pkgIdx: number, subName: string) => {
    const success = await projectOperations.addSubpackage(projectId, pkgIdx, subName, projectData.projects);
    if (success) {
      projectSelection.clearSubpackageInput(projectId, pkgIdx);
    }
  };

  const handleAddTaskPackage = async (projectId: string, pkgIdx: number, subIdx: number, taskPackageName: string) => {
    const success = await projectOperations.addTaskPackage(projectId, pkgIdx, subIdx, taskPackageName, projectData.projects);
    if (success) {
      projectSelection.clearTaskPackageInput(projectId, pkgIdx, subIdx);
    }
  };

  const handleItemClick = (item: SelectedItem) => {
    projectSelection.handleItemClick(item, projectData.projects);
  };

  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="w-full h-[calc(100vh-5rem)] bg-background flex flex-col">
          <div className="flex flex-1 min-h-0 w-full">
            <ProjectSidebar
              projects={projectData.projects}
              selectedProject={projectSelection.selectedProject}
              selectedItem={projectSelection.selectedItem}
              loading={projectData.loading || projectOperations.loading || wizardLoading}
              pkgInputs={projectSelection.pkgInputs}
              setPkgInputs={projectSelection.setPkgInputs}
              taskPackageInputs={projectSelection.taskPackageInputs}
              setTaskPackageInputs={projectSelection.setTaskPackageInputs}
              subInputs={projectSelection.subInputs}
              setSubInputs={projectSelection.setSubInputs}
              onSelectProject={projectSelection.selectProject}
              onItemClick={handleItemClick}
              onAddPackage={handleAddPackage}
              onAddTaskPackage={handleAddTaskPackage}
              onAddSubpackage={handleAddSubpackage}
              onCreateProject={handleCreateProject}
              onProjectUpdate={(updatedProject) => {
                projectData.updateProject(updatedProject);
                projectSelection.updateSelectedProject(updatedProject);
              }}
              isItemSelected={projectSelection.isItemSelected}
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
                            {projectSelection.selectedProject ? projectSelection.selectedProject.name : '選擇專案'}
                          </h1>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{projectSelection.selectedProject ? projectSelection.selectedProject.name : '選擇專案'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </header>
                  
                  <div className="flex-1 overflow-auto">
                    <div className="h-full p-6 overflow-auto">
                      {projectData.loading ? (
                        <MainContentSkeleton />
                      ) : (
                        <ProjectViewer 
                          selectedProject={projectSelection.selectedProject} 
                          selectedItem={projectSelection.selectedItem}
                          onProjectUpdate={(updatedProject) => {
                            projectData.updateProject(updatedProject);
                            projectSelection.updateSelectedProject(updatedProject);
                          }}
                          updateProjectInfo={projectOperations.updateProjectInfo}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle className="w-1 bg-border hover:bg-border/80 transition-colors" />

              <ResizablePanel defaultSize={50} minSize={20}>
                <ResizablePanelGroup direction="vertical">
                  <ResizablePanel defaultSize={25} minSize={15}>
                    <div className="flex h-full items-center justify-center p-4 bg-muted/5">
                      <div className="h-full flex flex-col justify-center text-center">
                        <h3 className="font-semibold mb-2">專案概覽</h3>
                        {projectData.loading ? (
                          <RightPanelSkeleton />
                        ) : projectSelection.selectedProject ? (
                          <div className="space-y-2 text-sm">
                            <p><strong>專案名稱：</strong>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="truncate max-w-[150px] inline-block">{projectSelection.selectedProject.name}</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{projectSelection.selectedProject.name}</p>
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
                    <div className="flex h-full items-start justify-center p-4 bg-muted/10">
                      <div className="h-full flex flex-col text-center">
                        <h3 className="font-semibold mb-2">詳細資訊</h3>
                        {projectData.loading ? (
                          <DetailsSkeleton />
                        ) : projectSelection.selectedProject ? (
                          <div className="flex-1 space-y-2 text-sm overflow-auto">
                            <div className="space-y-3">
                              <div>
                                <p><strong>建立時間：</strong></p>
                                <p className="text-xs text-muted-foreground">
                                  {(() => {
                                    try {
                                      const createdAt = projectSelection.selectedProject.createdAt;
                                      if (!createdAt) return '未設定';
                                      
                                      let date: Date;
                                      if (typeof createdAt === 'string') {
                                        if (createdAt.includes('T') || createdAt.includes('Z')) {
                                          date = new Date(createdAt);
                                        } else {
                                          const timestamp = parseInt(createdAt);
                                          date = !isNaN(timestamp) ? new Date(timestamp) : new Date(createdAt);
                                        }
                                      } else {
                                        date = new Date(createdAt);
                                      }
                                      
                                      return isNaN(date.getTime()) ? '日期格式錯誤' : date.toLocaleString('zh-TW');
                                    } catch (error) {
                                      return '日期格式錯誤';
                                    }
                                  })()}
                                </p>
                              </div>
                              
                              <div>
                                <p><strong>專案描述：</strong></p>
                                <p className="text-xs text-muted-foreground">
                                  {projectSelection.selectedProject.description || '無描述'}
                                </p>
                              </div>
                              
                              <div>
                                <p><strong>專案進度：</strong></p>
                                <p className="text-xs text-muted-foreground">
                                  {projectProgress.progressDescription}
                                </p>
                              </div>
                              
                              <div>
                                <p><strong>進度百分比：</strong></p>
                                <p className="text-xs text-muted-foreground">
                                  {projectProgress.getProgressPercentage()}%
                                </p>
                              </div>
                            </div>
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
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
} 