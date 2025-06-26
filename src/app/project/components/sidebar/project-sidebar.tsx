'use client';
import { useState, Dispatch, SetStateAction } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from 'lucide-react';
import { ProjectActionGuard } from '@/app/settings/components/permission-guard';
import ProjectTree from '../tree/project-tree';
import { CreateProjectWizard } from '../create/create-project-wizard';
import { QuantityManagementTab } from './quantity-management-tab';
import { Project, SelectedItem } from '../../types';

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
    <Sidebar className="z-50">
      <SidebarHeader className="border-b px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <FolderIcon className="h-5 w-5" />
          <h2 className="text-lg font-semibold">專案管理</h2>
        </div>
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
                  <SidebarGroupLabel className="px-4 py-2 text-sm font-medium text-muted-foreground">
                    專案列表
                  </SidebarGroupLabel>
                </SidebarGroup>
                <div className="flex-1 overflow-y-auto px-2 pb-4">
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