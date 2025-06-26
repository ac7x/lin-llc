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
import { 
  FolderIcon,
  PlusIcon,
  ZapIcon,
} from 'lucide-react';
import { ProjectActionGuard } from '@/app/settings/components/permission-guard';
import { VirtualizedProjectTree } from '../tree/virtualized-project-tree';
import { Project, SelectedItem } from '../../types';

interface VirtualizedProjectSidebarProps {
  projects: Project[];
  selectedProject: Project | null;
  selectedItem: SelectedItem;
  loading: boolean;
  onSelectProject: (project: Project) => void;
  onItemClick: (item: SelectedItem) => void;
  onCreateProject: (projectName: string) => Promise<void>;
  onProjectUpdate: (updatedProject: Project) => void;
}

/**
 * 虛擬化專案側邊欄組件
 * 針對大規模專案優化的高性能側邊欄
 */
export function VirtualizedProjectSidebar({
  projects,
  selectedProject,
  selectedItem,
  loading,
  onSelectProject,
  onItemClick,
  onCreateProject,
  onProjectUpdate,
}: VirtualizedProjectSidebarProps) {
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

  // 計算總統計
  const totalStats = projects.reduce((acc, project) => {
    acc.packages += project.packages.length;
    acc.subpackages += project.packages.reduce((sum, pkg) => sum + pkg.subpackages.length, 0);
    acc.tasks += project.packages.reduce((sum, pkg) => 
      sum + pkg.subpackages.reduce((subSum, sub) => subSum + sub.taskpackages.length, 0), 0
    );
    return acc;
  }, { packages: 0, subpackages: 0, tasks: 0 });

  return (
    <Sidebar className="z-50">
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <FolderIcon className="h-5 w-5" />
            <h2 className="text-lg font-semibold">專案管理</h2>
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <ZapIcon className="h-4 w-4 text-orange-500" />
            <span className="text-xs text-orange-600 font-medium">虛擬化</span>
          </div>
        </div>
        
        {/* 統計信息 */}
        <div className="text-xs text-muted-foreground mt-2">
          {projects.length} 專案 • {totalStats.packages} 包 • {totalStats.subpackages} 子包 • {totalStats.tasks} 任務
        </div>
      </SidebarHeader>
      
      <SidebarContent className="pb-20">
        {/* 專案選擇器 */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-2 text-sm font-medium text-muted-foreground">
            選擇專案
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {loading ? (
                <div className="px-4 py-2 text-sm text-muted-foreground">載入中...</div>
              ) : (
                <>
                  {projects.map(project => (
                    <SidebarMenuItem key={project.id}>
                      <Button
                        variant={selectedProject?.id === project.id ? "default" : "ghost"}
                        className="w-full justify-start text-sm h-8"
                        onClick={() => onSelectProject(project)}
                      >
                        <FolderIcon className="h-4 w-4 mr-2" />
                        <span className="truncate">{project.name}</span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {project.packages.length}
                        </span>
                      </Button>
                    </SidebarMenuItem>
                  ))}
                  
                  {/* 新增專案按鈕 */}
                  <ProjectActionGuard action="create" resource="project">
                    <SidebarMenuItem>
                      <div className="px-1 py-1">
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

        {/* 虛擬化專案樹 */}
        {selectedProject && (
          <SidebarGroup className="flex-1">
            <SidebarGroupLabel className="px-4 py-2 text-sm font-medium text-muted-foreground flex items-center gap-2">
              <span>專案結構</span>
              <ZapIcon className="h-3 w-3 text-orange-500" />
            </SidebarGroupLabel>
            <SidebarGroupContent className="flex-1 overflow-hidden">
              <div className="h-full">
                <VirtualizedProjectTree
                  project={selectedProject}
                  onProjectUpdate={onProjectUpdate}
                  onItemSelect={onItemClick}
                  selectedItem={selectedItem}
                  height={600} // 固定高度，可以根據需要調整
                />
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
} 