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
import { ProjectActionGuard } from '@/app/(system)';
import { ProjectPackageNodeProps, SelectedItem } from '../../../types';
import { COMPACT_INPUT_STYLE, COMPACT_BUTTON_STYLE, SMALL_BUTTON_STYLE, ITEM_SELECT_STYLE } from '../../../constants';
import { getItemInfo, getChildCount } from './tree-utils';
import { RenameDialog } from './rename-dialog';
import { SimpleContextMenu } from '../../ui/simple-context-menu';
import ProjectSubpackageNode from './project-subpackage-node';

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
  onRename,
}: ProjectPackageNodeProps & {
  onRename?: (packageItem: SelectedItem, newName: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  
  const package_ = project.packages[packageIndex];
  
  if (!package_) {
    return null;
  }

  const packageItem: SelectedItem = {
    type: 'package',
    projectId: project.id,
    packageIndex,
  };

  const isSelected = isItemSelected(packageItem);
  const itemInfo = getItemInfo('package', isSelected);

  // 右鍵菜單處理
  const handleRename = () => {
    setShowRenameDialog(true);
  };

  const handleRenameConfirm = (newName: string) => {
    if (onRename) {
      onRename(packageItem, newName);
    }
  };

  const contextMenuProps = {
    itemType: 'package' as const,
    itemName: package_.name,
    currentQuantity: package_.total !== undefined ? {
      completed: package_.completed || 0,
      total: package_.total || 0,
    } : undefined,
    onRename: handleRename,
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
    <>
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
                <PackageOpenIcon className={`transition-transform h-3 w-3 ${itemInfo.color}`} />
              ) : (
                <PackageIcon className={`transition-transform h-3 w-3 ${itemInfo.color}`} />
              )}
              <span className="ml-1 text-xs text-muted-foreground">{getChildCount(package_)}</span>
              <SimpleContextMenu {...contextMenuProps}>
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    onItemClick(packageItem);
                  }}
                  className={`${ITEM_SELECT_STYLE} ${
                    isSelected ? 'bg-accent' : ''
                  }`}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className={`truncate text-sm ${itemInfo.color}`}>{package_.name}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{package_.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </SimpleContextMenu>
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

    {/* 重新命名對話框 */}
    <RenameDialog
      isOpen={showRenameDialog}
      onClose={() => setShowRenameDialog(false)}
      currentName={package_.name}
      itemType="package"
      onRename={handleRenameConfirm}
    />
  </>
  );
}
