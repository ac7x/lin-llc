'use client';
import { useState, useCallback } from 'react';
import { 
  BookOpen,
  BookOpenCheck,
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
import { ProjectSubPackageNodeProps, SelectedItem, Project } from '../../../types';
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
import ProjectTaskpackageNode from './project-taskpackage-node';

/**
 * 子工作包節點組件 - 顯示子工作包資訊並包含任務列表
 * 負責渲染子工作包名稱、可展開的任務列表和新增任務功能
 * 已從 project-tree.tsx 移動完整的子工作包相關邏輯
 */
export default function ProjectSubpackageNode({
  project,
  packageIndex,
  subpackageIndex,
  selectedItem,
  onItemClick,
  onAddTaskPackage,
  loading,
  isItemSelected,
  subInputs,
  setSubInputs,
  onRename,
  onProjectUpdate,
}: ProjectSubPackageNodeProps & {
  onRename?: (item: SelectedItem, newName: string) => void;
  onProjectUpdate?: (updatedProject: Project) => void;
}) {
  // === 狀態管理 ===
  const [expanded, setExpanded] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [inputValue, setInputValue] = useState('');
  
  // === 計算邏輯 ===
  const subpackage = project.packages[packageIndex]?.subpackages[subpackageIndex];
  
  if (!subpackage) {
    return null;
  }

  const subpackageItem: SelectedItem = {
    type: 'subpackage',
    projectId: project.id,
    packageIndex,
    subpackageIndex,
  };

  const isSelected = isItemSelected(subpackageItem);
  const itemInfo = getItemInfo('subpackage', isSelected);
  const ItemIcon = itemInfo.icon;
  
  // 使用統一樣式系統
  const containerClasses = getItemContainerClasses(itemInfo, isSelected, getBorderColor('subpackage'));
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
  const submenuContainerClasses = getSubmenuContainerClasses(3);

  // === 事件處理 ===
  const handleRename = () => {
    setShowRenameDialog(true);
  };

  const handleRenameConfirm = (newName: string) => {
    if (onRename) {
      onRename(subpackageItem, newName);
    }
  };

  const handleAddTaskPackageClick = () => {
    setShowInput(true);
  };

  const handleAddTaskPackage = () => {
    if (inputValue.trim() && onAddTaskPackage) {
      onAddTaskPackage(project.id, packageIndex, subpackageIndex, inputValue.trim());
      setInputValue('');
      setShowInput(false);
    }
  };

  const handleItemClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onItemClick) {
      onItemClick(subpackageItem);
    }
  };

  const handleExpansionToggle = () => {
    setExpanded(!expanded);
  };

  // === 配置 ===
  const contextMenuProps = {
    itemType: 'subpackage' as const,
    itemName: subpackage.name,
    currentQuantity: subpackage.total !== undefined ? {
      completed: subpackage.completed || 0,
      total: subpackage.total || 0,
    } : undefined,
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
                {subpackage.name}
              </span>
            </div>

            <Badge variant="outline" className={countClasses}>
              {subpackage.taskpackages?.length || 0} 任務
            </Badge>
          </div>
        </SimpleContextMenu>

        <CollapsibleContent>
          <div className={submenuContainerClasses}>
            {/* 新增任務包輸入 */}
            {showInput && (
              <div className={inputWrapperClasses}>
                <div className={inputContainerClasses}>
                  <Input
                    placeholder="輸入任務包名稱"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddTaskPackage();
                      } else if (e.key === 'Escape') {
                        setShowInput(false);
                        setInputValue('');
                      }
                    }}
                    className={COMPACT_INPUT_STYLE}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={handleAddTaskPackage}
                    disabled={!inputValue.trim()}
                    className={COMPACT_BUTTON_STYLE}
                  >
                    確認
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowInput(false);
                      setInputValue('');
                    }}
                    className={COMPACT_BUTTON_STYLE}
                  >
                    取消
                  </Button>
                </div>
              </div>
            )}

            {/* 任務包列表 */}
            {subpackage.taskpackages?.map((_, taskIndex) => (
              <ProjectTaskpackageNode
                key={`${project.id}-${packageIndex}-${subpackageIndex}-${taskIndex}`}
                project={project}
                packageIndex={packageIndex}
                subpackageIndex={subpackageIndex}
                taskIndex={taskIndex}
                selectedItem={selectedItem}
                onItemClick={onItemClick}
                loading={loading}
                isItemSelected={isItemSelected}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 重命名對話框 */}
      <RenameDialog
        isOpen={showRenameDialog}
        onClose={() => setShowRenameDialog(false)}
        currentName={subpackage.name}
        itemType="subpackage"
        onRename={handleRenameConfirm}
      />
    </div>
  );
}

/**
 * 虛擬化子工作包渲染組件
 * 專門處理虛擬化模式下的子工作包項目渲染
 */
export function VirtualizedSubpackageItem({
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
  if (!item || item.type !== 'subpackage' || !item.data) {
    return null;
  }

  // === 計算邏輯 ===
  const subpackage = item.data as any;
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
    console.log('Rename subpackage:', subpackage.name, 'to:', newName);
    setRenameDialogStates(prev => ({ ...prev, [item.id]: false }));
  }, [item.id, subpackage.name, setRenameDialogStates]);

  // === 配置 ===
  const contextMenuProps = {
    itemType: 'subpackage' as const,
    itemName: subpackage.name || '',
    currentQuantity: subpackage.total !== undefined ? {
      completed: subpackage.completed || 0,
      total: subpackage.total || 0,
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
            {subpackage.name}
          </span>

          {/* 進度信息 */}
          {subpackage.progress !== undefined && (
            <div className="flex items-center gap-2 min-w-[120px]">
              <div className={`w-16 text-xs ${isSelected ? itemInfo.color : 'text-muted-foreground'}`}>
                {subpackage.progress || 0}%
              </div>
              <Progress 
                value={subpackage.progress || 0} 
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
          <Badge variant="outline" className={`text-xs ml-2 ${isSelected ? itemInfo.color : 'text-muted-foreground'}`}>
            {subpackage.taskpackages?.length || 0} 任務
          </Badge>
        </div>
      </SimpleContextMenu>

      {/* 重新命名對話框 */}
      <RenameDialog
        isOpen={renameDialogStates[item.id] || false}
        onClose={() => setRenameDialogStates(prev => ({ ...prev, [item.id]: false }))}
        currentName={subpackage.name || ''}
        itemType="subpackage"
        onRename={handleRenameConfirm}
      />
    </div>
  );
}
