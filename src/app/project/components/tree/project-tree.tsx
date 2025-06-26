'use client';
import { useState, useMemo, useCallback, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import { 
  FolderIcon,
  FolderOpenIcon,
  PackageIcon,
  PackageOpenIcon,
  ListIcon,
  BookOpen,
  BookOpenCheck,
  SquareIcon,
  SquareCheckIcon,
  PlusIcon,
  ExpandIcon,
  ListCollapseIcon,
  RefreshCwIcon,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ProjectActionGuard } from '@/app/settings/components/permission-guard';
import { useTaskManagement } from '../../hooks';
import { VirtualizedTreeNode } from './virtualized-tree-node';
import { 
  FlatItem, 
  ExpandedState, 
  TreeFlattener, 
  TreeBatchOperations 
} from '../../utils/tree-flattener';
import { TaskAssignmentDialog, TaskSubmissionDialog, TaskReviewDialog } from '../task';
import { ProjectTreeProps, SelectedItem, Project } from '../../types';
import { COMPACT_INPUT_STYLE, COMPACT_BUTTON_STYLE, SMALL_BUTTON_STYLE, ITEM_SELECT_STYLE } from '../../constants';

// 虛擬化相關常數
const ITEM_HEIGHT = 48;
const DEFAULT_VIRTUALIZED_HEIGHT = 400;

// 擴展接口以支持虛擬化
interface EnhancedProjectTreeProps extends ProjectTreeProps {
  useVirtualization?: boolean;
  searchTerm?: string;
  virtualizedHeight?: number;
  onProjectUpdate?: (updatedProject: Project) => void;
}

/**
 * 統一的專案樹狀組件 - 支持傳統和虛擬化兩種模式
 * 根據 useVirtualization 屬性自動切換渲染方式
 */
export default function ProjectTree({
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
  loading,
  isItemSelected,
  useVirtualization = false,
  searchTerm = '',
  virtualizedHeight = DEFAULT_VIRTUALIZED_HEIGHT,
  onProjectUpdate,
}: EnhancedProjectTreeProps) {
  // 傳統模式狀態
  const [expandedPackages, setExpandedPackages] = useState<Set<number>>(new Set());
  const [expandedTasks, setExpandedTasks] = useState<Record<number, Set<number>>>({});
  const [showPackageInput, setShowPackageInput] = useState(false);
  const [showTaskPackageInputs, setShowTaskPackageInputs] = useState<Record<number, boolean>>({});
  const [showSubInputs, setShowSubInputs] = useState<Record<number, Record<number, boolean>>>({});
  const [expandedProject, setExpandedProject] = useState(selectedProject?.id === project.id);

  // 虛擬化模式狀態
  const [expandedState] = useState(() => new ExpandedState());
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [showSubmissionDialog, setShowSubmissionDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [activeTaskItem, setActiveTaskItem] = useState<FlatItem | null>(null);

  // refs
  const listRef = useRef<List>(null);

  // 任務管理 hook
  const { assignTask, submitTaskProgress, reviewTask } = useTaskManagement();

  // 虛擬化相關計算
  const flattener = useMemo(() => new TreeFlattener(expandedState), [expandedState]);
  
  const flattenedItems = useMemo(() => {
    if (!useVirtualization) return [];
    const items = flattener.flattenProject(project, searchTerm);
    return items.filter(item => item.isVisible);
  }, [flattener, project, searchTerm, refreshKey, useVirtualization]);

  const stats = useMemo(() => 
    useVirtualization ? TreeBatchOperations.calculateStats(flattenedItems) : null,
    [flattenedItems, useVirtualization]
  );

  // 虛擬化事件處理
  const handleVirtualizedToggleExpand = useCallback((id: string) => {
    expandedState.toggle(id);
    setRefreshKey(prev => prev + 1);
  }, [expandedState]);

  const handleVirtualizedItemClick = useCallback((item: FlatItem) => {
    // 轉換為 SelectedItem 格式
    let selectedItem: SelectedItem = null;
    
    switch (item.type) {
      case 'project':
        selectedItem = { type: 'project', projectId: item.projectId };
        break;
      case 'package':
        selectedItem = { 
          type: 'package', 
          projectId: item.projectId, 
          packageIndex: item.packageIndex! 
        };
        break;
      case 'subpackage':
        selectedItem = { 
          type: 'subpackage', 
          projectId: item.projectId, 
          packageIndex: item.packageIndex!, 
          subpackageIndex: item.subpackageIndex! 
        };
        break;
      case 'task':
        selectedItem = { 
          type: 'task', 
          projectId: item.projectId, 
          packageIndex: item.packageIndex!, 
          subpackageIndex: item.subpackageIndex!, 
          taskIndex: item.taskIndex! 
        };
        break;
    }
    
    onItemClick(selectedItem);
  }, [onItemClick]);

  // 虛擬化任務操作
  const handleAssignTask = useCallback((item: FlatItem) => {
    setActiveTaskItem(item);
    setShowAssignmentDialog(true);
  }, []);

  const handleSubmitTask = useCallback((item: FlatItem) => {
    setActiveTaskItem(item);
    setShowSubmissionDialog(true);
  }, []);

  const handleReviewTask = useCallback((item: FlatItem) => {
    setActiveTaskItem(item);
    setShowReviewDialog(true);
  }, []);

  // 虛擬化批量操作
  const handleExpandAll = useCallback(() => {
    TreeBatchOperations.smartExpand(expandedState, flattenedItems, 200);
    setRefreshKey(prev => prev + 1);
  }, [expandedState, flattenedItems]);

  const handleCollapseAll = useCallback(() => {
    expandedState.collapseAll();
    setRefreshKey(prev => prev + 1);
  }, [expandedState]);

  // 檢查虛擬化項目是否被選中
  const isVirtualizedItemSelected = useCallback((item: FlatItem): boolean => {
    if (!selectedItem) return false;
    
    switch (item.type) {
      case 'project':
        return selectedItem.type === 'project' && selectedItem.projectId === item.projectId;
      case 'package':
        return selectedItem.type === 'package' && 
               selectedItem.projectId === item.projectId && 
               selectedItem.packageIndex === item.packageIndex;
      case 'subpackage':
        return selectedItem.type === 'subpackage' && 
               selectedItem.projectId === item.projectId && 
               selectedItem.packageIndex === item.packageIndex &&
               selectedItem.subpackageIndex === item.subpackageIndex;
      case 'task':
        return selectedItem.type === 'task' && 
               selectedItem.projectId === item.projectId && 
               selectedItem.packageIndex === item.packageIndex &&
               selectedItem.subpackageIndex === item.subpackageIndex &&
               selectedItem.taskIndex === item.taskIndex;
      default:
        return false;
    }
  }, [selectedItem]);

  // 虛擬化渲染項目
  const renderVirtualizedItem = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = flattenedItems[index];
    if (!item) return null;

    return (
      <VirtualizedTreeNode
        key={item.id}
        item={item}
        style={style}
        onToggleExpand={handleVirtualizedToggleExpand}
        onItemClick={handleVirtualizedItemClick}
        onAssignTask={handleAssignTask}
        onSubmitTask={handleSubmitTask}
        onReviewTask={handleReviewTask}
        isSelected={isVirtualizedItemSelected(item)}
      />
    );
  }, [flattenedItems, handleVirtualizedToggleExpand, handleVirtualizedItemClick, handleAssignTask, handleSubmitTask, handleReviewTask, isVirtualizedItemSelected]);

  // 傳統模式事件處理
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

  // 渲染虛擬化模式
  if (useVirtualization) {
    return (
      <div className="w-full">
        {/* 虛擬化控制面板 */}
        <div className="mb-2 pb-2 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {stats && (
                <>
                  <Badge variant="outline" className="text-xs">
                    {stats.total} 項目
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {stats.byType.task} 任務
                  </Badge>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExpandAll}
                title="智能展開"
                className="h-6 px-2 text-xs"
              >
                <ExpandIcon className="h-3 w-3" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleCollapseAll}
                title="全部收起"
                className="h-6 px-2 text-xs"
              >
                <ListCollapseIcon className="h-3 w-3" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRefreshKey(prev => prev + 1)}
                title="重新整理"
                className="h-6 px-2 text-xs"
              >
                <RefreshCwIcon className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* 虛擬化列表 */}
        <div className="border rounded-md overflow-hidden bg-background">
          {flattenedItems.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-xs text-muted-foreground">
              {searchTerm ? '沒有找到匹配的項目' : '暫無數據'}
            </div>
          ) : (
            <List
              ref={listRef}
              height={virtualizedHeight}
              width="100%"
              itemCount={flattenedItems.length}
              itemSize={ITEM_HEIGHT}
              itemData={flattenedItems}
              overscanCount={5}
            >
              {renderVirtualizedItem}
            </List>
          )}
        </div>

        {/* 任務對話框 */}
        {activeTaskItem && (
          <>
            <TaskAssignmentDialog
              isOpen={showAssignmentDialog}
              onClose={() => setShowAssignmentDialog(false)}
              taskName={(activeTaskItem.data as any).name}
              projectName={project.name}
              currentSubmitters={(activeTaskItem.data as any).submitters || []}
              currentReviewers={(activeTaskItem.data as any).reviewers || []}
              onAssign={async (submitters: string[], reviewers: string[]) => {
                if (!activeTaskItem) return false;
                
                const success = await assignTask(
                  project,
                  {
                    packageIndex: activeTaskItem.packageIndex!,
                    subpackageIndex: activeTaskItem.subpackageIndex!,
                    taskIndex: activeTaskItem.taskIndex!,
                  },
                  submitters,
                  reviewers,
                  // 這裡需要從父組件傳入 onProjectUpdate
                  onProjectUpdate || (() => {})
                );
                
                if (success) {
                  setRefreshKey(prev => prev + 1);
                }
                
                return success;
              }}
            />

            <TaskSubmissionDialog
              isOpen={showSubmissionDialog}
              onClose={() => setShowSubmissionDialog(false)}
              taskName={(activeTaskItem.data as any).name}
              currentCompleted={(activeTaskItem.data as any).completed || 0}
              currentTotal={(activeTaskItem.data as any).total || 0}
              onSubmit={async (completed: number, total: number) => {
                if (!activeTaskItem) return false;
                
                const success = await submitTaskProgress(
                  project,
                  {
                    packageIndex: activeTaskItem.packageIndex!,
                    subpackageIndex: activeTaskItem.subpackageIndex!,
                    taskIndex: activeTaskItem.taskIndex!,
                  },
                  completed,
                  total,
                  // 這裡需要從父組件傳入 onProjectUpdate
                  onProjectUpdate || (() => {})
                );
                
                if (success) {
                  setRefreshKey(prev => prev + 1);
                }
                
                return success;
              }}
            />

            <TaskReviewDialog
              isOpen={showReviewDialog}
              onClose={() => setShowReviewDialog(false)}
              taskName={(activeTaskItem.data as any).name}
              projectName={project.name}
              submittedBy={(activeTaskItem.data as any).submittedBy}
              submittedAt={(activeTaskItem.data as any).submittedAt}
              completed={(activeTaskItem.data as any).completed || 0}
              total={(activeTaskItem.data as any).total || 0}
              currentStatus={(activeTaskItem.data as any).status}
              onReview={async (approved: boolean, comment?: string) => {
                if (!activeTaskItem) return false;
                
                const success = await reviewTask(
                  project,
                  {
                    packageIndex: activeTaskItem.packageIndex!,
                    subpackageIndex: activeTaskItem.subpackageIndex!,
                    taskIndex: activeTaskItem.taskIndex!,
                  },
                  approved,
                  // 這裡需要從父組件傳入 onProjectUpdate
                  onProjectUpdate || (() => {}),
                  comment
                );
                
                if (success) {
                  setRefreshKey(prev => prev + 1);
                }
                
                return success;
              }}
            />
          </>
        )}
      </div>
    );
  }

  // 傳統模式渲染 (保持原有邏輯)
  return (
    <SidebarMenuItem>
      <Collapsible
        className="group/collapsible"
        defaultOpen={selectedProject?.id === project.id}
        onOpenChange={(open) => setExpandedProject(open)}
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            isActive={selectedProject?.id === project.id}
            onClick={() => onSelectProject(project)}
            className="pl-2"
          >
            {expandedProject ? (
              <FolderOpenIcon className="transition-transform h-4 w-4" />
            ) : (
              <FolderIcon className="transition-transform h-4 w-4" />
            )}
            <span className="ml-1 text-xs text-muted-foreground">{project.packages?.length || 0}</span>
            <div 
              onClick={(e) => {
                e.stopPropagation();
                onItemClick({ type: 'project', projectId: project.id });
              }}
              className={`${ITEM_SELECT_STYLE} ${
                isItemSelected({ type: 'project', projectId: project.id }) ? 'bg-accent' : ''
              }`}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="truncate">{project.name}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{project.name}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub className="mx-1 border-l border-border/30">
            {/* 工作包列表 */}
            {project.packages?.map((pkg, pkgIdx) => (
              <SidebarMenuItem key={pkgIdx} className="overflow-hidden">
                <Collapsible
                  className="group/collapsible"
                  defaultOpen={expandedPackages.has(pkgIdx)}
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      onClick={() => togglePackageExpanded(pkgIdx)}
                      className="pl-2 min-h-0 h-6"
                    >
                      {expandedPackages.has(pkgIdx) ? (
                        <PackageOpenIcon className="transition-transform h-3 w-3" />
                      ) : (
                        <PackageIcon className="transition-transform h-3 w-3" />
                      )}
                      <span className="ml-1 text-xs text-muted-foreground">{pkg.subpackages?.length || 0}</span>
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          onItemClick({ type: 'package', projectId: project.id, packageIndex: pkgIdx });
                        }}
                        className={`${ITEM_SELECT_STYLE} ${
                          isItemSelected({ type: 'package', projectId: project.id, packageIndex: pkgIdx }) ? 'bg-accent' : ''
                        }`}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="truncate text-xs">{pkg.name}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{pkg.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="mx-1 border-l border-border/20">
                      {/* 子工作包列表 */}
                      {pkg.subpackages?.map((sub, taskIdx) => (
                        <SidebarMenuItem key={taskIdx} className="overflow-hidden">
                          <Collapsible
                            className="group/collapsible"
                            defaultOpen={expandedTasks[pkgIdx]?.has(taskIdx)}
                          >
                            <CollapsibleTrigger asChild>
                              <SidebarMenuButton
                                onClick={() => toggleTaskExpanded(pkgIdx, taskIdx)}
                                className="pl-2 min-h-0 h-5"
                              >
                                {expandedTasks[pkgIdx]?.has(taskIdx) ? (
                                  <BookOpenCheck className="transition-transform h-3 w-3" />
                                ) : (
                                  <BookOpen className="transition-transform h-3 w-3" />
                                )}
                                <span className="ml-1 text-xs text-muted-foreground">{sub.taskpackages?.length || 0}</span>
                                <div 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onItemClick({ type: 'subpackage', projectId: project.id, packageIndex: pkgIdx, subpackageIndex: taskIdx });
                                  }}
                                  className={`${ITEM_SELECT_STYLE} ${
                                    isItemSelected({ type: 'subpackage', projectId: project.id, packageIndex: pkgIdx, subpackageIndex: taskIdx }) ? 'bg-accent' : ''
                                  }`}
                                >
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="truncate text-xs">{sub.name}</span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{sub.name}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub className="mx-1 border-l border-border/10">
                                {/* 任務列表 */}
                                {sub.taskpackages?.map((task, subIdx) => (
                                  <SidebarMenuItem key={subIdx} className="overflow-hidden">
                                    <SidebarMenuButton className="pl-2 min-h-0 h-5">
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
                                        {isItemSelected({
                                          type: 'task',
                                          projectId: project.id,
                                          packageIndex: pkgIdx,
                                          subpackageIndex: taskIdx,
                                          taskIndex: subIdx
                                        }) ? (
                                          <SquareCheckIcon className="h-3 w-3" />
                                        ) : (
                                          <SquareIcon className="h-3 w-3" />
                                        )}
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <span className="truncate text-xs flex-1">{task.name}</span>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>{task.name}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                        <span className={`text-xs flex-shrink-0 ml-1 ${
                                          isItemSelected({
                                            type: 'task',
                                            projectId: project.id,
                                            packageIndex: pkgIdx,
                                            subpackageIndex: taskIdx,
                                            taskIndex: subIdx
                                          }) ? 'text-orange-600' : 'text-blue-600'
                                        }`}>
                                          {task.completed || 0}/{task.total || 0}
                                        </span>
                                      </div>
                                    </SidebarMenuButton>
                                  </SidebarMenuItem>
                                ))}
                                {/* 新增任務按鈕 - 只有有權限的用戶才能看到 */}
                                <ProjectActionGuard action="create" resource="task">
                                  <SidebarMenuItem className="overflow-hidden">
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
                                          <Tooltip>
                                            <TooltipTrigger asChild>
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
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>建立任務</p>
                                            </TooltipContent>
                                          </Tooltip>
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
                        <SidebarMenuItem className="overflow-hidden">
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
                                <Tooltip>
                                  <TooltipTrigger asChild>
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
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>建立子工作包</p>
                                  </TooltipContent>
                                </Tooltip>
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
              <SidebarMenuItem className="overflow-hidden">
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
                      <Tooltip>
                        <TooltipTrigger asChild>
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
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>建立工作包</p>
                        </TooltipContent>
                      </Tooltip>
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
