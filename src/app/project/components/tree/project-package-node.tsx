'use client';
import { useState } from 'react';
import { 
  PackageIcon,
  PackageOpenIcon,
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
import { ProjectPackageNodeProps, SelectedItem } from '@/app/project/types';
import ProjectSubpackageNode from './project-subpackage-node';

// 提取重複的 Input 樣式為常數，避免 Firebase Performance 錯誤
const COMPACT_INPUT_STYLE = "flex-1 text-xs h-6";

// 提取重複的 Button 樣式為常數，避免 Firebase Performance 錯誤
const COMPACT_BUTTON_STYLE = "w-full justify-start text-xs h-6 text-muted-foreground hover:text-foreground";

// 提取小型 Button 樣式為常數，避免 Firebase Performance 錯誤
const SMALL_BUTTON_STYLE = "h-6 w-6 p-0";

// 提取項目選擇樣式為常數，避免 Firebase Performance 錯誤
const ITEM_SELECT_STYLE = "flex items-center gap-2 hover:bg-accent rounded p-1 flex-1 cursor-pointer";

/**
 * 工作包節點組件 - 顯示工作包資訊並包含子工作包列表
 * 負責渲染工作包名稱、可展開的子工作包列表和新增子工作包功能
 */
export default function ProjectPackageNode({
  project,
  packageIndex,
  selectedItem,
  onItemClick,
  onAddSubpackage,
  loading,
  isItemSelected,
  taskPackageInputs,
  setTaskPackageInputs,
  subInputs,
  setSubInputs,
  onAddTaskPackage,
}: ProjectPackageNodeProps & {
  subInputs?: Record<string, Record<number, Record<number, string>>>;
  setSubInputs?: React.Dispatch<React.SetStateAction<Record<string, Record<number, Record<number, string>>>>>;
  onAddTaskPackage?: (projectId: string, pkgIdx: number, subIdx: number, taskPackageName: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showInput, setShowInput] = useState(false);
  
  const package_ = project.packages[packageIndex];
  
  if (!package_) {
    return null;
  }

  const packageItem: SelectedItem = {
    type: 'package',
    projectId: project.id,
    packageIndex,
  };

  const handleAddSubpackageClick = () => {
    setShowInput(true);
  };

  const handleAddSubpackage = () => {
    const subpackageName = taskPackageInputs[project.id]?.[packageIndex] || '';
    if (subpackageName.trim()) {
      void onAddSubpackage(project.id, packageIndex, subpackageName);
      setShowInput(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddSubpackage();
    }
  };

  return (
    <SidebarMenuItem>
      <Collapsible
        className="group/collapsible"
        defaultOpen={expanded}
        onOpenChange={setExpanded}
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            onClick={() => setExpanded(!expanded)}
            className="pl-2"
          >
            {expanded ? (
              <PackageOpenIcon className="transition-transform h-3 w-3" />
            ) : (
              <PackageIcon className="transition-transform h-3 w-3" />
            )}
            <span className="ml-1 text-xs text-muted-foreground">{package_.subpackages?.length || 0}</span>
            <div 
              onClick={(e) => {
                e.stopPropagation();
                onItemClick(packageItem);
              }}
              className={`${ITEM_SELECT_STYLE} ${
                isItemSelected(packageItem) ? 'bg-accent' : ''
              }`}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="truncate text-sm">{package_.name}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{package_.name}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub className="mx-1 border-l border-border/20">
            {/* 子工作包列表 */}
            {package_.subpackages?.map((subpackage, subpackageIndex) => (
              <ProjectSubpackageNode
                key={subpackageIndex}
                project={project}
                packageIndex={packageIndex}
                subpackageIndex={subpackageIndex}
                selectedItem={selectedItem}
                onItemClick={onItemClick}
                onAddTaskPackage={onAddTaskPackage || (async () => {})}
                loading={loading}
                isItemSelected={isItemSelected}
                subInputs={subInputs || {}}
                setSubInputs={setSubInputs || (() => {})}
              />
            ))}
            
            {/* 新增子工作包按鈕 - 只有有權限的用戶才能看到 */}
            <ProjectActionGuard action="create" resource="subpackage">
              <SidebarMenuItem>
                <div className="pl-1 pr-1 py-1">
                  {showInput ? (
                    <div className="flex gap-1">
                      <Input
                        placeholder="子工作包名稱"
                        value={taskPackageInputs[project.id]?.[packageIndex] || ''}
                        onChange={e => setTaskPackageInputs(prev => ({
                          ...prev,
                          [project.id]: { ...prev[project.id], [packageIndex]: e.target.value }
                        }))}
                        className={COMPACT_INPUT_STYLE}
                        onKeyDown={handleKeyDown}
                      />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            onClick={handleAddSubpackage}
                            disabled={loading || !(taskPackageInputs[project.id]?.[packageIndex] || '').trim()}
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
                      onClick={handleAddSubpackageClick}
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
  );
}
