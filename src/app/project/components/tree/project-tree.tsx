'use client';
import { useState } from 'react';
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
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { ProjectTreeProps } from '../../types';
import { COMPACT_INPUT_STYLE, COMPACT_BUTTON_STYLE, SMALL_BUTTON_STYLE, ITEM_SELECT_STYLE } from '../../constants';

/**
 * 專案樹狀組件 - 根元件，遞迴渲染整棵專案結構
 * 負責整合所有子組件並處理資料流，是整個樹狀結構的入口點
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
}: ProjectTreeProps) {
  const [expandedPackages, setExpandedPackages] = useState<Set<number>>(new Set());
  const [expandedTasks, setExpandedTasks] = useState<Record<number, Set<number>>>({});
  const [showPackageInput, setShowPackageInput] = useState(false);
  const [showTaskPackageInputs, setShowTaskPackageInputs] = useState<Record<number, boolean>>({});
  const [showSubInputs, setShowSubInputs] = useState<Record<number, Record<number, boolean>>>({});
  const [expandedProject, setExpandedProject] = useState(selectedProject?.id === project.id);

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
              <SidebarMenuItem key={pkgIdx}>
                <Collapsible
                  className="group/collapsible"
                  defaultOpen={expandedPackages.has(pkgIdx)}
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      onClick={() => togglePackageExpanded(pkgIdx)}
                      className="pl-2"
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
                            <span className="truncate text-sm">{pkg.name}</span>
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
                        <SidebarMenuItem key={taskIdx}>
                          <Collapsible
                            className="group/collapsible"
                            defaultOpen={expandedTasks[pkgIdx]?.has(taskIdx)}
                          >
                            <CollapsibleTrigger asChild>
                              <SidebarMenuButton
                                onClick={() => toggleTaskExpanded(pkgIdx, taskIdx)}
                                className="pl-2"
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
                                            <span className="truncate text-xs">{task.name}</span>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>{task.name}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                        <span className={`text-xs ${
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
