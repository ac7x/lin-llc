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
import { ProjectNodeProps, SelectedItem, Project } from '../../../types';
import { FlatItem } from './tree-flattener';
import { COMPACT_INPUT_STYLE, COMPACT_BUTTON_STYLE, SMALL_BUTTON_STYLE, ITEM_SELECT_STYLE } from '../../../constants';
import { 
  getItemInfo, 
  getChildCount, 
  getStatusInfo, 
  getBorderColor, 
  getIndentStyle,
  getItemContainerClasses,
  getItemTextClasses,
  getItemTextWrapperClasses,
  getItemCountClasses,
  getIconClasses,
  getToggleButtonClasses,
  getToggleIconClasses,
  getActionButtonClasses,
  getSpacerClasses,
  getCollapsibleGroupClasses,
  getInputContainerClasses,
  getInputWrapperClasses,
  getAddButtonWrapperClasses,
  getTreeContainerClasses,
  getSubmenuContainerClasses
} from './tree-utils';
import { RenameDialog } from './rename-dialog';
import { SimpleContextMenu } from '../../ui/simple-context-menu';
import ProjectPackageNode from './project-package-node';

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
  // === 狀態管理 ===
  const [expanded, setExpanded] = useState(selectedProject?.id === project.id);
  const [showInput, setShowInput] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  
  // === 計算邏輯 ===
  const projectItem: SelectedItem = {
    type: 'project',
    projectId: project.id,
  };

  const isSelected = selectedProject?.id === project.id;
  const itemInfo = getItemInfo('project', isSelected);
  const ItemIcon = itemInfo.icon;
  
  // 使用統一樣式系統
  const containerClasses = getItemContainerClasses(itemInfo, isSelected, getBorderColor('project'));
  const textClasses = getItemTextClasses(itemInfo.color);
  const textWrapperClasses = getItemTextWrapperClasses();
  const countClasses = getItemCountClasses(isSelected, itemInfo.color);
  const iconClasses = getIconClasses(itemInfo.color);
  const toggleButtonClasses = getToggleButtonClasses();
  const toggleIconClasses = getToggleIconClasses(isSelected, itemInfo.color);
  const actionButtonClasses = getActionButtonClasses();
  const spacerClasses = getSpacerClasses();
  const collapsibleGroupClasses = getCollapsibleGroupClasses();
  const inputContainerClasses = getInputContainerClasses();
  const inputWrapperClasses = getInputWrapperClasses();
  const addButtonWrapperClasses = getAddButtonWrapperClasses();
  const submenuContainerClasses = getSubmenuContainerClasses(1);

  // === 事件處理 ===
  const handleRename = () => {
    setShowRenameDialog(true);
  };

  const handleRenameConfirm = (newName: string) => {
    if (onRename) {
      onRename(projectItem, newName);
    }
  };

  const handleAddPackageClick = () => {
    setShowInput(true);
  };

  const handleAddPackage = () => {
    const packageName = pkgInputs[project.id] || '';
    if (packageName.trim() && onAddPackage) {
      onAddPackage(project.id, packageName.trim());
      setPkgInputs(prev => ({ ...prev, [project.id]: '' }));
      setShowInput(false);
    }
  };

  const handleItemClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onSelectProject) {
      onSelectProject(project);
    }
    
    if (onItemClick) {
      onItemClick(projectItem);
    }
  };

  const handleExpansionToggle = () => {
    setExpanded(!expanded);
  };

  // === 配置 ===
  const contextMenuProps = {
    itemType: 'project' as const,
    itemName: project.name,
    onRename: handleRename,
  };

  // === 渲染 ===
  return (
    <div className={getTreeContainerClasses()}>
      <Collapsible open={expanded} onOpenChange={setExpanded} className={collapsibleGroupClasses}>
        <SimpleContextMenu {...contextMenuProps}>
          <div className={containerClasses} onClick={handleItemClick}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className={toggleButtonClasses}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleExpansionToggle();
                }}
              >
                {expanded ? (
                  <ChevronDownIcon className={toggleIconClasses} />
                ) : (
                  <ChevronRightIcon className={toggleIconClasses} />
                )}
              </Button>
            </CollapsibleTrigger>

            <ItemIcon className={iconClasses} />

            <div className={textWrapperClasses}>
              <span className={textClasses}>
                {project.name}
              </span>
            </div>

            <Badge variant="outline" className={countClasses}>
              {getChildCount(project)} 包
            </Badge>
          </div>
        </SimpleContextMenu>

        <CollapsibleContent>
          <div className={submenuContainerClasses}>
            {/* 新增包輸入 */}
            {showInput && (
              <div className={inputWrapperClasses}>
                <div className={inputContainerClasses}>
                  <Input
                    placeholder="輸入包名稱"
                    value={pkgInputs[project.id] || ''}
                    onChange={(e) => setPkgInputs(prev => ({ ...prev, [project.id]: e.target.value }))}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddPackage();
                      } else if (e.key === 'Escape') {
                        setShowInput(false);
                        setPkgInputs(prev => ({ ...prev, [project.id]: '' }));
                      }
                    }}
                    className={COMPACT_INPUT_STYLE}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={handleAddPackage}
                    disabled={!pkgInputs[project.id]?.trim()}
                    className={COMPACT_BUTTON_STYLE}
                  >
                    確認
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowInput(false);
                      setPkgInputs(prev => ({ ...prev, [project.id]: '' }));
                    }}
                    className={COMPACT_BUTTON_STYLE}
                  >
                    取消
                  </Button>
                </div>
              </div>
            )}

            {/* 包列表 */}
            {project.packages?.map((_, packageIndex) => (
              <ProjectPackageNode
                key={`${project.id}-${packageIndex}`}
                project={project}
                packageIndex={packageIndex}
                selectedItem={selectedItem}
                onItemClick={onItemClick}
                onAddSubpackage={onAddSubpackage || (async () => {})}
                onAddTaskPackage={onAddTaskPackage || (async () => {})}
                loading={loading}
                taskPackageInputs={taskPackageInputs || {}}
                setTaskPackageInputs={setTaskPackageInputs || (() => {})}
                subInputs={subInputs || {}}
                setSubInputs={setSubInputs || (() => {})}
                isItemSelected={isItemSelected}
                onRename={onRename}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 重命名對話框 */}
      <RenameDialog
        isOpen={showRenameDialog}
        onClose={() => setShowRenameDialog(false)}
        currentName={project.name}
        itemType="project"
        onRename={handleRenameConfirm}
      />
    </div>
  );
}

/**
 * 虛擬化專案渲染組件
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
  onProjectUpdate?: (updatedProject: Project) => void;
  renameDialogStates: Record<string, boolean>;
  setRenameDialogStates: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  // 確保數據安全性
  if (!item || item.type !== 'project' || !item.data) {
    return null;
  }

  const project = item.data as Project;
  const itemInfo = getItemInfo('project', isSelected);
  const ItemIcon = itemInfo.icon;

  // === 事件處理 ===
  const handleRename = useCallback(() => {
    setRenameDialogStates(prev => ({ ...prev, [item.id]: true }));
  }, [item.id, setRenameDialogStates]);

  const handleRenameConfirm = useCallback((newName: string) => {
    console.log('Rename project:', project.name, 'to:', newName);
    setRenameDialogStates(prev => ({ ...prev, [item.id]: false }));
  }, [item.id, project.name, setRenameDialogStates]);

  // === 配置 ===
  const contextMenuProps = {
    itemType: 'project' as const,
    itemName: project.name || '',
    onRename: handleRename,
  };

  return (
    <div key={item.id} style={style}>
      <SimpleContextMenu {...contextMenuProps}>
        <div
          className={`flex items-center gap-2 py-2 px-2 cursor-pointer transition-colors ${itemInfo.bgColor} border-l-2 ${
            isSelected ? getBorderColor(item.type) : 'border-l-transparent'
          }`}
          style={getIndentStyle(item.level)}
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
            {project.name || 'Unnamed Project'}
          </span>

          {/* 子項目計數 */}
          <Badge variant="outline" className={`text-xs ml-2 ${isSelected ? itemInfo.color : 'text-muted-foreground'}`}>
            {getChildCount(project)} 包
          </Badge>
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
