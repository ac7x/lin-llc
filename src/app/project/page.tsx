'use client';
import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarRail,
} from '@/components/ui/sidebar';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { 
  FolderIcon,
  PlusIcon,
} from 'lucide-react';
import { ProjectActionGuard } from '@/app/settings/components/permission-guard';
import { usePermission } from '@/app/settings/hooks/use-permission';
import { ProjectTree } from './components/tree';
import {
  ProjectDetail,
  ProjectPackageDetail,
  ProjectSubpackageDetail,
  ProjectTaskDetail,
} from './components/detail';
import { useProjectOperations } from './hooks';
import { calculateProjectProgress } from './utils';

// 提取重複的樣式為常數
const COMPACT_INPUT_STYLE = "flex-1 text-xs h-6";
const COMPACT_BUTTON_STYLE = "w-full justify-start text-xs h-6 text-muted-foreground hover:text-foreground";
const SMALL_BUTTON_STYLE = "h-6 w-6 p-0";

export default function ProjectListPage() {
  const { hasPermission, loading: permissionLoading, userProfile } = usePermission();
  const {
    // 狀態
    projects,
    selectedProject,
    selectedItem,
    loading,
    showProjectInput,
    projectInput,
    pkgInputs,
    taskPackageInputs,
    subInputs,
    
    // 設定器
    setProjectInput,
    setShowProjectInput,
    setPkgInputs,
    setTaskPackageInputs,
    setSubInputs,
    setSelectedProject,
    
    // 操作函數
    loadProjects,
    handleCreateProject,
    handleAddPackage,
    handleAddSubpackage,
    handleAddTaskPackage,
    isItemSelected,
    handleItemClick,
    handleAddProjectClick,
    
    // 計算函數
    calculateProjectProgress: calculateProgress,
  } = useProjectOperations();

  // 權限 ready 且有 project:read 權限才載入
  useEffect(() => {
    if (!permissionLoading && userProfile && hasPermission('project:read')) {
      void loadProjects();
    }
  }, [permissionLoading, userProfile, hasPermission, loadProjects]);

  // 權限 loading 時顯示 loading skeleton
  if (permissionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>載入中...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">正在載入權限資訊，請稍候。</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  // 載入狀態組件
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
          <Sidebar className="z-50">
            <SidebarHeader className="border-b px-6 py-4">
              <div className="flex items-center gap-2">
                <FolderIcon className="h-5 w-5" />
                <h2 className="text-lg font-semibold">專案管理</h2>
              </div>
            </SidebarHeader>
            <SidebarContent className="pb-20">
              <SidebarGroup>
                <SidebarGroupLabel className="px-4 py-2 text-sm font-medium text-muted-foreground">
                  專案列表
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {loading ? (
                      <ProjectListSkeleton />
                    ) : (
                      <>
                        {projects.map((project) => (
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
                            isItemSelected={isItemSelected}
                          />
                        ))}
                        
                        {/* 新增專案按鈕 */}
                        <ProjectActionGuard action="create" resource="project">
                          <SidebarMenuItem>
                            <div className="pl-1 pr-1 py-1">
                              {showProjectInput ? (
                                <div className="flex gap-1">
                                  <Input
                                    placeholder="專案名稱"
                                    value={projectInput}
                                    onChange={e => setProjectInput(e.target.value)}
                                    className={COMPACT_INPUT_STYLE}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        void handleCreateProject();
                                        setShowProjectInput(false);
                                      }
                                    }}
                                  />
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        onClick={() => {
                                          void handleCreateProject();
                                          setShowProjectInput(false);
                                        }}
                                        disabled={loading || !projectInput.trim()}
                                        className={SMALL_BUTTON_STYLE}
                                      >
                                        <PlusIcon className="h-3 w-3" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>建立專案</p>
                                    </TooltipContent>
                                  </Tooltip>
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
                            </div>
                          </SidebarMenuItem>
                        </ProjectActionGuard>
                      </>
                    )}
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
                      <ProjectOverviewSkeleton />
                      <ProgressSkeleton />
                    </div>
                  ) : selectedItem ? (
                    <div className="space-y-6">
                      <ProjectDetail
                        selectedProject={selectedProject}
                        selectedItem={selectedItem}
                        calculateProjectProgress={calculateProgress}
                      />
                      
                      <ProjectPackageDetail
                        selectedProject={selectedProject}
                        selectedItem={selectedItem}
                        isItemSelected={isItemSelected}
                      />
                      
                      <ProjectSubpackageDetail
                        selectedProject={selectedProject}
                        selectedItem={selectedItem}
                        isItemSelected={isItemSelected}
                      />
                      
                      <ProjectTaskDetail
                        selectedProject={selectedProject}
                        selectedItem={selectedItem}
                      />
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
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center gap-2">
                              <Skeleton className="h-4 w-16" />
                              <Skeleton className="h-4 w-20" />
                            </div>
                          ))}
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
                              const progress = calculateProgress(selectedProject);
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
                      {loading ? (
                        <div className="text-sm space-y-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center gap-2">
                              <Skeleton className="h-4 w-16" />
                            </div>
                          ))}
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
                            {(() => {
                              const progress = calculateProgress(selectedProject);
                              return `已完成 ${progress.completed} 個任務，共 ${progress.total} 個任務`;
                            })()}
                          </p>
                          <p><strong>進度百分比：</strong></p>
                          <p className="text-xs text-muted-foreground">
                            {(() => {
                              const progress = calculateProgress(selectedProject);
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
    </TooltipProvider>
  );
} 