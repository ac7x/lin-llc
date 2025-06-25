'use client';
import { useState, Dispatch, SetStateAction } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
} from 'lucide-react';
import { ProjectActionGuard } from '@/app/settings/components/permission-guard';
import { ProjectTree } from './tree';
import { Project, SelectedItem } from '../types';

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
  onCreateProject: (projectName: string) => Promise<void>;
  isItemSelected: (item: SelectedItem) => boolean;
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
  isItemSelected,
}: ProjectSidebarProps) {
  const [showProjectInput, setShowProjectInput] = useState(false);
  const [projectInput, setProjectInput] = useState('');

  // 處理建立專案
  const handleCreateProject = async () => {
    if (!projectInput.trim()) return;
    
    await onCreateProject(projectInput.trim());
    setProjectInput('');
    setShowProjectInput(false);
  };

  // 處理建立專案按鈕點擊
  const handleAddProjectClick = () => {
    setShowProjectInput(true);
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
              {loading ? (
                <ProjectListSkeleton />
              ) : (
                <>
                  {projects.map(project => (
                    <ProjectTree 
                      key={project.id} 
                      project={project}
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
                              value={projectInput}
                              onChange={e => setProjectInput(e.target.value)}
                              className="flex-1 text-xs h-6"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  void handleCreateProject();
                                }
                              }}
                            />
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  onClick={() => void handleCreateProject()}
                                  disabled={loading || !projectInput.trim()}
                                  className="h-6 w-6 p-0"
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
                            className="w-full justify-start text-xs h-6 text-muted-foreground hover:text-foreground"
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
  );
} 