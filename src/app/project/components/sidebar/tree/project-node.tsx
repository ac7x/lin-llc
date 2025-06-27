'use client';
import { useState, useCallback } from 'react';
import { 
  FolderIcon,
  FolderOpenIcon,
  PlusIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import { ProjectNodeProps, SelectedItem } from '../../../types';
import { FlatItem } from '../../../utils/tree-flattener';
import { COMPACT_INPUT_STYLE, COMPACT_BUTTON_STYLE, SMALL_BUTTON_STYLE, ITEM_SELECT_STYLE } from '../../../constants';
import { getItemInfo, getChildCount, getStatusInfo, getBorderColor, getIndentStyle } from './tree-utils';
import { RenameDialog } from './rename-dialog';
import { SimpleContextMenu } from '../../ui/simple-context-menu';
import ProjectPackageNode from './project-package-node';

/**
 * 虛擬化專案項目渲染組件
 * 專門處理虛擬化模式下的專案項目渲染
 */
export function VirtualizedProjectItem({
  item,
  style,
  isSelected,
  onToggleExpand,
  onItemClick,
  onProjectUpdate,
  renameDialogStates,
  setRenameDialogStates,
}: {
  item: FlatItem;
  style: React.CSSProperties;
  isSelected: boolean;
  onToggleExpand: (id: string) => void;
  onItemClick: (item: FlatItem) => void;
  onProjectUpdate?: (updatedProject: any) => void;
  renameDialogStates: Record<string, boolean>;
  setRenameDialogStates: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  if (item.type !== 'project') return null;

  const project = item.data as any;
  const itemInfo = getItemInfo(item.type, isSelected);
  const ItemIcon = itemInfo.icon;
  const statusInfo = getStatusInfo(item.data);
  const StatusIcon = statusInfo?.icon;
  const indentStyle = getIndentStyle(item.level);

  // 右鍵菜單處理
  const handleRename = useCallback(() => {
    setRenameDialogStates(prev => ({ ...prev, [item.id]: true }));
  }, [item.id, setRenameDialogStates]);

  const handleRenameConfirm = useCallback((newName: string) => {
    console.log('Rename project:', project.name, 'to:', newName);
    setRenameDialogStates(prev => ({ ...prev, [item.id]: false }));
  }, [item.id, project.name, setRenameDialogStates]);

  const contextMenuProps = {
    itemType: 'project' as const,
    itemName: project.name || '',
    currentQuantity: project.total !== undefined ? {
      completed: project.completed || 0,
      total: project.total || 0,
    } : undefined,
    onRename: handleRename,
  };

  return (
    <div key={item.id} style={style}>
      <SimpleContextMenu {...contextMenuProps}>
        <div
          className={`flex items-center gap-2 py-2 px-2 cursor-pointer transition-colors ${itemInfo.bgColor} border-l-2 ${
            isSelected ? getBorderColor(item.type) : 'border-l-transparent'
          }`}
          style={indentStyle}
          onClick={() => onItemClick(item)}
        >
          {/* 展開/收起按鈕 */}
          {item.hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(item.id);
              }}
            >
              {item.isExpanded ? (
                <ChevronDownIcon className={`h-4 w-4 ${isSelected ? itemInfo.color : ''}`} />
              ) : (
                <ChevronRightIcon className={`h-4 w-4 ${isSelected ? itemInfo.color : ''}`} />
              )}
            </Button>
          )}

          {/* 空白佔位（無子項目時） */}
          {!item.hasChildren && <div className="w-6" />}

          {/* 項目圖標 */}
          <ItemIcon className={`h-4 w-4 ${itemInfo.color}`} />

          {/* 項目名稱 */}
          <span className={`flex-1 text-sm font-medium truncate ${itemInfo.color}`}>
            {project.name}
          </span>

          {/* 進度信息（僅對有進度的項目） */}
          {project.progress !== undefined && (
            <div className="flex items-center gap-2 min-w-[120px]">
              <div className={`w-16 text-xs ${isSelected ? itemInfo.color : 'text-muted-foreground'}`}>
                {project.progress || 0}%
              </div>
              <Progress 
                value={project.progress || 0} 
                className="w-16 h-2" 
              />
            </div>
          )}

          {/* 狀態 Badge */}
          {statusInfo && StatusIcon && (
            <Badge className={`${statusInfo.color} text-xs`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusInfo.text}
            </Badge>
          )}

          {/* 子項目計數 */}
          {item.hasChildren && (
            <div className={`text-xs ml-2 ${isSelected ? itemInfo.color : 'text-muted-foreground'}`}>
              {getChildCount(project)}
            </div>
          )}
        </div>
      </SimpleContextMenu>

      {/* 重新命名對話框 */}
      <RenameDialog
        isOpen={renameDialogStates[item.id] || false}
        onClose={() => setRenameDialogStates(prev => ({ ...prev, [item.id]: false }))}
        currentName={project.name || ''}
        itemType="project"
        onRename={handleRenameConfirm}
      />
    </div>
  );
}

/**
 * 專案節點組件 - 顯示專案資訊並包含工作包列表
 * 負責渲染專案名稱、可展開的工作包列表和新增工作包功能
 */
export default function ProjectNode({
  project,
  selectedProject,
  selectedItem,
  onSelectProject,
  onItemClick,
  onAddPackage,
  onAddSubpackage,
  onAddTaskPackage,
  loading,
  isItemSelected,
  pkgInputs,
  setPkgInputs,
  taskPackageInputs,
  setTaskPackageInputs,
  subInputs,
  setSubInputs,
  onRename,
  onProjectUpdate,
}: ProjectNodeProps & {
  onAddSubpackage?: (projectId: string, pkgIdx: number, subName: string) => Promise<void>;
  onAddTaskPackage?: (projectId: string, pkgIdx: number, subIdx: number, taskPackageName: string) => Promise<void>;
  taskPackageInputs?: Record<string, Record<number, string>>;
  setTaskPackageInputs?: React.Dispatch<React.SetStateAction<Record<string, Record<number, string>>>>;
  subInputs?: Record<string, Record<number, Record<number, string>>>;
  setSubInputs?: React.Dispatch<React.SetStateAction<Record<string, Record<number, Record<number, string>>>>>;
  onRename?: (projectItem: SelectedItem, newName: string) => void;
  onProjectUpdate?: (updatedProject: any) => void;
}) {
  const [expanded, setExpanded] = useState(selectedProject?.id === project.id);
  const [showInput, setShowInput] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  
  const projectItem: SelectedItem = {
    type: 'project',
    projectId: project.id,
  };

  const isSelected = selectedProject?.id === project.id;
  const itemInfo = getItemInfo('project', isSelected);

  // 右鍵菜單處理
  const handleRename = () => {
    setShowRenameDialog(true);
  };

  const handleRenameConfirm = (newName: string) => {
    if (onRename) {
      onRename(projectItem, newName);
    }
  };

  const contextMenuProps = {
    itemType: 'project' as const,
    itemName: project.name,
    onRename: handleRename,
  };

  const handleAddPackageClick = () => {
    setShowInput(true);
  };

  const handleAddPackage = () => {
    const packageName = pkgInputs[project.id] || '';
    if (packageName.trim()) {
      void onAddPackage(project.id, packageName);
      setShowInput(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddPackage();
    }
  };

  return (
    <>
      <SidebarMenuItem>
        <Collapsible
          className="group/collapsible"
          defaultOpen={selectedProject?.id === project.id}
          onOpenChange={(open) => setExpanded(open)}
        >
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              isActive={isSelected}
              onClick={() => onSelectProject(project)}
              className="pl-2"
            >
              {expanded ? (
                <FolderOpenIcon className={`transition-transform h-4 w-4 ${itemInfo.color}`} />
              ) : (
                <FolderIcon className={`transition-transform h-4 w-4 ${itemInfo.color}`} />
              )}
              <span className="ml-1 text-xs text-muted-foreground">{getChildCount(project)}</span>
              <SimpleContextMenu {...contextMenuProps}>
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    onItemClick(projectItem);
                  }}
                  className={`${ITEM_SELECT_STYLE} ${
                    isItemSelected(projectItem) ? 'bg-accent' : ''
                  }`}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className={`truncate ${itemInfo.color}`}>{project.name}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{project.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </SimpleContextMenu>
            </SidebarMenuButton>
          </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub className="mx-1 border-l border-border/30">
            {/* 工作包列表 */}
            {project.packages?.map((package_, packageIndex) => (
              <ProjectPackageNode
                key={packageIndex}
                project={project}
                packageIndex={packageIndex}
                selectedItem={selectedItem}
                onItemClick={onItemClick}
                onAddSubpackage={onAddSubpackage || (async () => {})}
                loading={loading}
                isItemSelected={isItemSelected}
                taskPackageInputs={taskPackageInputs || {}}
                setTaskPackageInputs={setTaskPackageInputs || (() => {})}
                subInputs={subInputs || {}}
                setSubInputs={setSubInputs || (() => {})}
                onAddTaskPackage={onAddTaskPackage || (async () => {})}
                onProjectUpdate={onProjectUpdate}
              />
            ))}
            
            {/* 新增工作包按鈕 - 只有有權限的用戶才能看到 */}
            <ProjectActionGuard action="create" resource="package">
              <SidebarMenuItem>
                <div className="pl-1 pr-1 py-1">
                  {showInput ? (
                    <div className="flex gap-1">
                      <Input
                        placeholder="工作包名稱"
                        value={pkgInputs[project.id] || ''}
                        onChange={e => setPkgInputs(prev => ({ ...prev, [project.id]: e.target.value }))}
                        className={COMPACT_INPUT_STYLE}
                        onKeyDown={handleKeyDown}
                      />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            onClick={handleAddPackage}
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

    {/* 重新命名對話框 */}
    <RenameDialog
      isOpen={showRenameDialog}
      onClose={() => setShowRenameDialog(false)}
      currentName={project.name}
      itemType="project"
      onRename={handleRenameConfirm}
    />
  </>
  );
}
