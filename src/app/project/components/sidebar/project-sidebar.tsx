'use client';
import { useState, useMemo, useCallback, Dispatch, SetStateAction, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarRail,
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FolderIcon,
  PlusIcon,
  Calculator,
  BookTemplateIcon,
  SearchIcon,
  ZapIcon,
  ExpandIcon,
  ListCollapseIcon,
  RefreshCwIcon,
  Lightbulb,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { ProjectActionGuard } from '@/app/(system)';
import { useProjectOperations } from '../../hooks';
import { usePermissionContext } from '@/app/(system)';
import ProjectTree from './tree/project-tree';
import { CreateProjectWizard } from '../create/create-project-wizard';
import { ProjectTemplates } from '../template';
import { QuantityDistributionDialog } from '../dialogs/quantity-distribution-dialog';
import { Project, SelectedItem, Package, Subpackage } from '../../types';
import { FlatItem, ExpandedState, TreeFlattener } from '../../utils/tree-flattener';

interface ProjectSidebarProps {
  projects: Project[];
  selectedProject: Project | null;
  selectedItem: SelectedItem;
  loading: boolean;
  pkgInputs: Record<string, string>;
  setPkgInputs: Dispatch<SetStateAction<Record<string, string>>>;
  taskPackageInputs: Record<string, Record<number, string>>;
  setTaskPackageInputs: Dispatch<SetStateAction<Record<string, Record<number, string>>>>;
  subInputs: Record<string, Record<number, Record<number, string>>>;
  setSubInputs: Dispatch<SetStateAction<Record<string, Record<number, Record<number, string>>>>>;
  onSelectProject: (project: Project) => void;
  onItemClick: (item: SelectedItem) => void;
  onAddPackage: (projectId: string, pkgName: string) => Promise<void>;
  onAddTaskPackage: (projectId: string, pkgIdx: number, subIdx: number, taskPackageName: string) => Promise<void>;
  onAddSubpackage: (projectId: string, pkgIdx: number, subName: string) => Promise<void>;
  onCreateProject: (config: {
    name: string;
    createPackages: boolean;
    packageCount: number;
    createSubpackages: boolean;
    subpackageCount: number;
    createTasks: boolean;
    taskCount: number;
  }) => Promise<void>;
  onProjectUpdate: (updatedProject: Project) => void;
  isItemSelected: (item: SelectedItem) => boolean;
}

// 簡化的樹狀節點組件 - 專為 sidebar 設計
function CompactTreeNode({
  item,
  style,
  onToggleExpand,
  onDistributeQuantity,
}: {
  item: FlatItem;
  style: React.CSSProperties;
  onToggleExpand: (id: string) => void;
  onDistributeQuantity?: (item: FlatItem) => void;
}) {
  const handleRightClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if ((item.type === 'package' || item.type === 'subpackage') && onDistributeQuantity) {
      onDistributeQuantity(item);
    }
  }, [item, onDistributeQuantity]);

  const getIcon = () => {
    if (item.type === 'project') return null;
    return item.isExpanded ? (
      <ChevronDown className="h-3 w-3 text-muted-foreground" />
    ) : (
      <ChevronRight className="h-3 w-3 text-muted-foreground" />
    );
  };

  const getStatusColor = () => {
    if (item.type !== 'task') return 'text-foreground';
    const data = item.data as any;
    const status = data.status;
    switch (status) {
      case 'pending': return 'text-yellow-600';
      case 'in_progress': return 'text-blue-600';
      case 'completed': return 'text-green-600';
      case 'under_review': return 'text-purple-600';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div
      style={style}
      className="flex items-center px-2 py-0.5 hover:bg-muted/50 cursor-pointer text-xs border-b border-muted/20"
      onContextMenu={handleRightClick}
      onClick={() => item.hasChildren && onToggleExpand(item.id)}
    >
      <div 
        className="flex items-center gap-1 flex-1 min-w-0"
        style={{ paddingLeft: `${item.level * 8}px` }}
      >
        {item.hasChildren && getIcon()}
        <span className={`truncate font-medium ${getStatusColor()}`} title={(item.data as any).name}>
          {(item.data as any).name}
        </span>
        {(item.type === 'package' || item.type === 'subpackage' || item.type === 'task') && (
          <Badge variant="secondary" className="text-xs h-3 px-1 ml-auto flex-shrink-0">
            {(item.data as any).completed || 0}/{(item.data as any).total || 0}
          </Badge>
        )}
      </div>
    </div>
  );
}

/**
 * 數量分配管理 Tab 組件
 * 專注於階層式數量管理的核心功能，適用於 sidebar tabs
 */
function QuantityManagementTab({
  project,
  onProjectUpdate,
}: {
  project: Project;
  onProjectUpdate: (updatedProject: Project) => void;
}) {
  const { hasPermission } = usePermissionContext();
  const { distributeQuantity, loading } = useProjectOperations(
    hasPermission,
    onProjectUpdate,
    () => {}
  );

  // 樹狀結構狀態
  const [expandedState] = useState(() => new ExpandedState());
  const [refreshKey, setRefreshKey] = useState(0);

  // 對話框狀態
  const [showDistributionDialog, setShowDistributionDialog] = useState(false);
  const [activeDistributionItem, setActiveDistributionItem] = useState<{
    item: FlatItem;
    data: Package | Subpackage;
    itemType: 'package' | 'subpackage';
  } | null>(null);

  const listRef = useRef<List>(null);

  // 創建扁平化器和數據
  const flattener = useMemo(() => new TreeFlattener(expandedState), [expandedState]);
  
  const flattenedItems = useMemo(() => {
    const items = flattener.flattenProject(project, '');
    return items.filter(item => item.isVisible);
  }, [flattener, project, refreshKey]);

  // 展開/收起切換
  const handleToggleExpand = useCallback((id: string) => {
    expandedState.toggle(id);
    setRefreshKey(prev => prev + 1);
  }, [expandedState]);

  // 處理數量分配請求
  const handleDistributeQuantity = useCallback((item: FlatItem) => {
    if (item.type === 'package' || item.type === 'subpackage') {
      setActiveDistributionItem({
        item,
        data: item.data as Package | Subpackage,
        itemType: item.type,
      });
      setShowDistributionDialog(true);
    }
  }, []);

  // 執行數量分配
  const executeDistribution = useCallback(async (distributionData: {
    parentTotal: number;
    distributions: Array<{
      index: number;
      name: string;
      allocated: number;
      completed?: number;
    }>;
  }) => {
    if (!activeDistributionItem) return false;

    const { item } = activeDistributionItem;
    
    const itemPath = {
      packageIndex: item.packageIndex,
      subpackageIndex: item.subpackageIndex,
    };

    const success = await distributeQuantity(
      project.id,
      itemPath,
      distributionData,
      [project]
    );

    if (success) {
      setShowDistributionDialog(false);
      setActiveDistributionItem(null);
      setRefreshKey(prev => prev + 1);
    }

    return success;
  }, [activeDistributionItem, distributeQuantity, project]);

  // 統計信息
  const getProjectStats = () => {
    const packages = project.packages || [];
    const subpackages = packages.flatMap(pkg => pkg.subpackages || []);
    const tasks = subpackages.flatMap(sub => sub.taskpackages || []);
    
    const totalTasks = tasks.length;
    const totalCompleted = tasks.reduce((sum, task) => sum + (task.completed || 0), 0);
    const totalQuantity = tasks.reduce((sum, task) => sum + (task.total || 0), 0);
    const progress = totalQuantity > 0 ? Math.round((totalCompleted / totalQuantity) * 100) : 0;

    return {
      packages: packages.length,
      subpackages: subpackages.length,
      tasks: totalTasks,
      totalQuantity,
      totalCompleted,
      progress,
    };
  };

  const stats = getProjectStats();

  // 渲染樹狀節點
  const renderTreeItem = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = flattenedItems[index];
    if (!item) return null;

    return (
      <CompactTreeNode
        key={item.id}
        item={item}
        style={style}
        onToggleExpand={handleToggleExpand}
        onDistributeQuantity={handleDistributeQuantity}
      />
    );
  }, [flattenedItems, handleToggleExpand, handleDistributeQuantity]);

  return (
    <div className="space-y-2 h-full flex flex-col">
      {/* 緊湊統計信息 */}
      <Card className="border-0 shadow-none bg-muted/20 flex-shrink-0">
        <CardHeader className="pb-2 px-3 pt-3">
          <CardTitle className="text-xs flex items-center gap-1">
            <Calculator className="h-3 w-3" />
            數量統計
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="grid grid-cols-4 gap-1 text-xs mb-2">
            <div className="text-center">
              <div className="text-sm font-bold text-blue-600">{stats.packages}</div>
              <div className="text-muted-foreground text-xs">工作包</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-green-600">{stats.subpackages}</div>
              <div className="text-muted-foreground text-xs">子包</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-purple-600">{stats.tasks}</div>
              <div className="text-muted-foreground text-xs">任務</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-orange-600">{stats.progress}%</div>
              <div className="text-muted-foreground text-xs">進度</div>
            </div>
          </div>

          <div className="bg-muted/30 rounded p-2">
            <div className="flex items-center gap-1">
              <Lightbulb className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <p className="text-xs text-muted-foreground leading-tight">
                右鍵工作包可分配數量
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 緊湊的專案樹 */}
      <Card className="border-0 shadow-none bg-muted/20 flex-1 min-h-0">
        <CardHeader className="pb-2 px-3 pt-3 flex-shrink-0">
          <CardTitle className="text-xs">階層式分配</CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 min-h-0">
          <div className="border border-muted/50 rounded-md overflow-hidden bg-background h-full">
            {flattenedItems.length === 0 ? (
              <div className="flex items-center justify-center h-16 text-xs text-muted-foreground">
                暫無數據
              </div>
            ) : (
              <List
                ref={listRef}
                height={160}
                width="100%"
                itemCount={flattenedItems.length}
                itemSize={24}
                overscanCount={3}
              >
                {renderTreeItem}
              </List>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 緊湊狀態摘要 */}
      <Card className="border-0 shadow-none bg-muted/20 flex-shrink-0">
        <CardHeader className="pb-1 px-3 pt-2">
          <CardTitle className="text-xs">狀態摘要</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-2">
          <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1 text-center border">
            總進度: {stats.totalCompleted}/{stats.totalQuantity} ({stats.progress}%)
          </div>
        </CardContent>
      </Card>

      {/* 數量分配對話框 */}
      {activeDistributionItem && (
        <QuantityDistributionDialog
          isOpen={showDistributionDialog}
          onClose={() => {
            setShowDistributionDialog(false);
            setActiveDistributionItem(null);
          }}
          item={activeDistributionItem.data}
          itemType={activeDistributionItem.itemType}
          onDistribute={executeDistribution}
        />
      )}
    </div>
  );
}

export function ProjectSidebar({
  projects,
  selectedProject,
  selectedItem,
  loading,
  pkgInputs,
  setPkgInputs,
  taskPackageInputs,
  setTaskPackageInputs,
  subInputs,
  setSubInputs,
  onSelectProject,
  onItemClick,
  onAddPackage,
  onAddTaskPackage,
  onAddSubpackage,
  onCreateProject,
  onProjectUpdate,
  isItemSelected,
}: ProjectSidebarProps) {
  // 搜索和虛擬化狀態
  const [searchTerm, setSearchTerm] = useState('');
  const [forceVirtualization, setForceVirtualization] = useState(false);

  // 計算是否應該使用虛擬化
  const shouldUseVirtualization = useMemo(() => {
    if (forceVirtualization) return true;
    if (!selectedProject) return false;
    
    // 計算總項目數
    const packageCount = selectedProject.packages.length;
    const subpackageCount = selectedProject.packages.reduce((sum, pkg) => sum + pkg.subpackages.length, 0);
    const taskCount = selectedProject.packages.reduce((sum, pkg) => 
      sum + pkg.subpackages.reduce((subSum, sub) => subSum + sub.taskpackages.length, 0), 0
    );
    const totalItems = 1 + packageCount + subpackageCount + taskCount;
    
    // 超過 200 個項目時自動使用虛擬化
    return totalItems > 200;
  }, [selectedProject, forceVirtualization]);

  // 獲取項目統計
  const getProjectStats = useCallback((project: Project) => {
    const packageCount = project.packages.length;
    const subpackageCount = project.packages.reduce((sum, pkg) => sum + pkg.subpackages.length, 0);
    const taskCount = project.packages.reduce((sum, pkg) => 
      sum + pkg.subpackages.reduce((subSum, sub) => subSum + sub.taskpackages.length, 0), 0
    );
    return { packageCount, subpackageCount, taskCount, totalItems: 1 + packageCount + subpackageCount + taskCount };
  }, []);

  // 處理建立專案
  const handleCreateProject = async (config: {
    name: string;
    createPackages: boolean;
    packageCount: number;
    createSubpackages: boolean;
    subpackageCount: number;
    createTasks: boolean;
    taskCount: number;
  }) => {
    await onCreateProject(config);
  };

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

  return (
    <Sidebar className="z-50 h-full">
      <SidebarHeader className="border-b px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <FolderIcon className="h-5 w-5" />
          <h2 className="text-lg font-semibold">專案管理</h2>
          {shouldUseVirtualization && (
            <div className="flex items-center gap-1 ml-auto">
              <ZapIcon className="h-4 w-4 text-orange-500" />
              <span className="text-xs text-orange-600 font-medium">虛擬化</span>
            </div>
          )}
        </div>
        
        {/* 總統計信息 */}
        {projects.length > 0 && (
          <div className="text-xs text-muted-foreground mt-2">
            {projects.length} 專案 • {projects.reduce((sum, p) => sum + getProjectStats(p).totalItems, 0)} 總項目
          </div>
        )}
      </SidebarHeader>
      
      <SidebarContent className="flex-1 overflow-hidden">
        <div className="flex flex-col h-full">
          <Tabs defaultValue="projects" className="flex-1 flex flex-col">
            <div className="flex-shrink-0 px-4 pt-4 pb-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="projects" className="flex items-center gap-2 text-xs">
                  <FolderIcon className="h-3 w-3" />
                  專案列表
                </TabsTrigger>
                <TabsTrigger value="quantity" className="flex items-center gap-2 text-xs" disabled={!selectedProject}>
                  <Calculator className="h-3 w-3" />
                  數量管理
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="projects" className="flex-1 mt-0 overflow-hidden">
              <div className="h-full flex flex-col">
                <SidebarGroup className="flex-shrink-0">
                  <SidebarGroupLabel className="px-4 py-2 text-sm font-medium text-muted-foreground flex items-center justify-between">
                    <span>專案列表</span>
                    {selectedProject && (
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          {getProjectStats(selectedProject).totalItems} 項目
                        </Badge>
                        {shouldUseVirtualization && (
                          <ZapIcon className="h-3 w-3 text-orange-500" />
                        )}
                      </div>
                    )}
                  </SidebarGroupLabel>

                  {/* 搜索和控制欄 - 只在有選中專案時顯示 */}
                  {selectedProject && (
                    <div className="px-4 pb-2 space-y-2">
                      {/* 搜索框 */}
                      <div className="relative">
                        <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                        <Input
                          placeholder="搜索專案內容..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-7 h-7 text-xs"
                        />
                      </div>

                      {/* 控制按鈕 - 只在虛擬化模式下顯示 */}
                      {shouldUseVirtualization && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => setForceVirtualization(false)}
                            title="傳統模式"
                          >
                            <ListCollapseIcon className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => setForceVirtualization(true)}
                            title="強制虛擬化"
                          >
                            <ZapIcon className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </SidebarGroup>

                <div className="flex-1 overflow-y-auto px-2 pb-4">
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {loading ? (
                        <ProjectListSkeleton />
                      ) : (
                        <>
                          {/* 專案選擇器 */}
                          {projects.map(project => {
                            const stats = getProjectStats(project);
                            const isSelected = selectedProject?.id === project.id;
                            
                            return (
                              <SidebarMenuItem key={project.id}>
                                <Button
                                  variant={isSelected ? "default" : "ghost"}
                                  className="w-full justify-start text-sm h-8 mb-1"
                                  onClick={() => onSelectProject(project)}
                                >
                                  <FolderIcon className="h-4 w-4 mr-2" />
                                  <span className="truncate flex-1 text-left">{project.name}</span>
                                  <div className="flex items-center gap-1 ml-2">
                                    <span className="text-xs text-muted-foreground">
                                      {project.packages.length}
                                    </span>
                                    {stats.totalItems > 200 && (
                                      <ZapIcon className="h-3 w-3 text-orange-500" />
                                    )}
                                  </div>
                                </Button>
                              </SidebarMenuItem>
                            );
                          })}

                          {/* 選中專案的樹狀結構 */}
                          {selectedProject && (
                            <div className="mt-4 border-t pt-4">
                              <ProjectTree 
                                project={selectedProject}
                                selectedProject={selectedProject}
                                selectedItem={selectedItem}
                                onSelectProject={onSelectProject}
                                onItemClick={onItemClick}
                                onAddPackage={onAddPackage}
                                onAddTaskPackage={onAddTaskPackage}
                                onAddSubpackage={onAddSubpackage}
                                pkgInputs={pkgInputs}
                                setPkgInputs={setPkgInputs}
                                taskPackageInputs={taskPackageInputs}
                                setTaskPackageInputs={setTaskPackageInputs}
                                subInputs={subInputs}
                                setSubInputs={setSubInputs}
                                loading={loading}
                                isItemSelected={isItemSelected}
                                useVirtualization={shouldUseVirtualization}
                                searchTerm={searchTerm}
                                virtualizedHeight={400}
                                onProjectUpdate={onProjectUpdate}
                              />
                            </div>
                          )}
                          
                          {/* 新增專案按鈕和範本 - 只有有權限的用戶才能看到 */}
                          <ProjectActionGuard action="create" resource="project">
                            <SidebarMenuItem>
                              <div className="pl-1 pr-1 py-1 space-y-1 mt-4 border-t pt-4">
                                <CreateProjectWizard
                                  onCreateProject={handleCreateProject}
                                  loading={loading}
                                  trigger={
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="w-full justify-start text-xs h-6 text-muted-foreground hover:text-foreground"
                                    >
                                      <PlusIcon className="h-3 w-3 mr-1" />
                                      {projects.length === 0 ? '新增第一個專案' : '新增專案'}
                                    </Button>
                                  }
                                />
                                <ProjectTemplates
                                  onCreateProject={handleCreateProject}
                                  loading={loading}
                                  trigger={
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="w-full justify-start text-xs h-6 text-muted-foreground hover:text-foreground"
                                    >
                                      <BookTemplateIcon className="h-3 w-3 mr-1" />
                                      範本快建
                                    </Button>
                                  }
                                />
                              </div>
                            </SidebarMenuItem>
                          </ProjectActionGuard>
                        </>
                      )}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="quantity" className="flex-1 mt-0 overflow-hidden">
              <div className="h-full flex flex-col">
                <SidebarGroup className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto px-2 pb-4">
                    <SidebarGroupContent>
                      {selectedProject ? (
                        <QuantityManagementTab
                          project={selectedProject}
                          onProjectUpdate={onProjectUpdate}
                        />
                      ) : (
                        <div className="text-center text-muted-foreground py-8">
                          請先選擇一個專案
                        </div>
                      )}
                    </SidebarGroupContent>
                  </div>
                </SidebarGroup>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
} 