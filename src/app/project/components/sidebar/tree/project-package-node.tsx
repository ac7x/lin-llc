'use client';
import { useState, useCallback } from 'react';
import { 
  PackageIcon,
  PackageOpenIcon,
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
import { ProjectPackageNodeProps, SelectedItem } from '../../../types';
import { FlatItem } from './tree-flattener';
import { COMPACT_INPUT_STYLE, COMPACT_BUTTON_STYLE, SMALL_BUTTON_STYLE, ITEM_SELECT_STYLE } from '../../../constants';
import { getItemInfo, getChildCount, getStatusInfo, getBorderColor, getIndentStyle } from './tree-utils';
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
  onProjectUpdate,
}: ProjectPackageNodeProps & {
  onRename?: (packageItem: SelectedItem, newName: string) => void;
  onProjectUpdate?: (updatedProject: any) => void;
}) {
  // === 狀態管理 ===
  const [expanded, setExpanded] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  
  // === 計算邏輯 ===
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

  // === 事件處理 ===
  const handleRename = () => {
    setShowRenameDialog(true);
  };

  const handleRenameConfirm = (newName: string) => {
    if (onRename) {
      onRename(packageItem, newName);
    }
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

  // === 配置 ===
  const contextMenuProps = {
    itemType: 'package' as const,
    itemName: package_.name,
    currentQuantity: package_.total !== undefined ? {
      completed: package_.completed || 0,
      total: package_.total || 0,
    } : undefined,
    onRename: handleRename,
  };

  // === 渲染 ===
  return (
    <>
      <SidebarMenuItem className="overflow-hidden">
        <Collapsible
          className="group/collapsible"
          defaultOpen={expanded}
          onOpenChange={setExpanded}
        >
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              onClick={() => setExpanded(!expanded)}
              className="pl-2 min-h-0 h-6"
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
              {/* 子工作包列表 - 使用 ProjectSubpackageNode 組件 */}
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
                  onProjectUpdate={onProjectUpdate}
                />
              ))}
              
              {/* 新增子工作包按鈕 - 只有有權限的用戶才能看到 */}
              <ProjectActionGuard action="create" resource="subpackage">
                <SidebarMenuItem className="overflow-hidden">
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

/**
 * 虛擬化工作包渲染組件
 * 專門處理虛擬化模式下的工作包項目渲染
 */
export function VirtualizedPackageItem({
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
  if (item.type !== 'package') return null;

  // === 計算邏輯 ===
  const package_ = item.data as any;
  const itemInfo = getItemInfo(item.type, isSelected);
  const ItemIcon = itemInfo.icon;
  const statusInfo = getStatusInfo(item.data);
  const StatusIcon = statusInfo?.icon;
  const indentStyle = getIndentStyle(item.level);

  // === 事件處理 ===
  const handleRename = useCallback(() => {
    setRenameDialogStates(prev => ({ ...prev, [item.id]: true }));
  }, [item.id, setRenameDialogStates]);

  const handleRenameConfirm = useCallback((newName: string) => {
    console.log('Rename package:', package_.name, 'to:', newName);
    setRenameDialogStates(prev => ({ ...prev, [item.id]: false }));
  }, [item.id, package_.name, setRenameDialogStates]);

  // === 配置 ===
  const contextMenuProps = {
    itemType: 'package' as const,
    itemName: package_.name || '',
    currentQuantity: package_.total !== undefined ? {
      completed: package_.completed || 0,
      total: package_.total || 0,
    } : undefined,
    onRename: handleRename,
  };

  // === 渲染 ===
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
            {package_.name}
          </span>

          {/* 進度信息 */}
          {package_.progress !== undefined && (
            <div className="flex items-center gap-2 min-w-[120px]">
              <div className={`w-16 text-xs ${isSelected ? itemInfo.color : 'text-muted-foreground'}`}>
                {package_.progress || 0}%
              </div>
              <Progress 
                value={package_.progress || 0} 
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
              {package_.subpackages?.length || 0} 子包
            </div>
          )}
        </div>
      </SimpleContextMenu>

      {/* 重新命名對話框 */}
      <RenameDialog
        isOpen={renameDialogStates[item.id] || false}
        onClose={() => setRenameDialogStates(prev => ({ ...prev, [item.id]: false }))}
        currentName={package_.name || ''}
        itemType="package"
        onRename={handleRenameConfirm}
      />
    </div>
  );
}
