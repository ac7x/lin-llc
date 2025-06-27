'use client';
import { useState, useMemo, useCallback, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import { 
  ExpandIcon,
  ListCollapseIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { 
  FlatItem, 
  ExpandedState, 
  TreeFlattener, 
  TreeBatchOperations 
} from './tree-flattener';

import { ProjectTreeProps, SelectedItem, Project } from '../../../types';
import { useGoogleAuth } from '@/app/(system)';
import ProjectTaskpackageNode, { VirtualizedTaskpackageItem } from './project-taskpackage-node';
import ProjectSubpackageNode, { VirtualizedSubpackageItem } from './project-subpackage-node';
import ProjectPackageNode, { VirtualizedPackageItem } from './project-package-node';
import ProjectNode, { VirtualizedProjectItem } from './project-node';

// 虛擬化相關常數
const ITEM_HEIGHT = 48;
const DEFAULT_VIRTUALIZED_HEIGHT = 400;

// 擴展接口以支持虛擬化
interface EnhancedProjectTreeProps extends ProjectTreeProps {
  useVirtualization?: boolean;
  searchTerm?: string;
  virtualizedHeight?: number;
  onProjectUpdate?: (updatedProject: Project) => void;
}

/**
 * 統一的專案樹狀組件 - 支持傳統和虛擬化兩種模式
 * 根據 useVirtualization 屬性自動切換渲染方式
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
  useVirtualization = false,
  searchTerm = '',
  virtualizedHeight = DEFAULT_VIRTUALIZED_HEIGHT,
  onProjectUpdate,
}: EnhancedProjectTreeProps) {
  // === 模式判斷 ===
  if (useVirtualization) {
    return (
      <VirtualizedProjectTree
        project={project}
        selectedItem={selectedItem}
        onItemClick={onItemClick}
        searchTerm={searchTerm}
        virtualizedHeight={virtualizedHeight}
        onProjectUpdate={onProjectUpdate}
      />
    );
  }

  // === 傳統模式 ===
  return (
    <TraditionalProjectTree
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
      onProjectUpdate={onProjectUpdate}
    />
  );
}

/**
 * 傳統專案樹組件 - 使用原有的節點組件
 */
function TraditionalProjectTree({
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
  onProjectUpdate,
}: ProjectTreeProps & {
  onProjectUpdate?: (updatedProject: Project) => void;
}) {
  return (
    <ProjectNode
      project={project}
      selectedProject={selectedProject}
      selectedItem={selectedItem}
      onSelectProject={onSelectProject}
      onItemClick={onItemClick}
      onAddPackage={onAddPackage}
      onAddSubpackage={onAddSubpackage}
      onAddTaskPackage={onAddTaskPackage}
      loading={loading}
      isItemSelected={isItemSelected}
      pkgInputs={pkgInputs}
      setPkgInputs={setPkgInputs}
      taskPackageInputs={taskPackageInputs}
      setTaskPackageInputs={setTaskPackageInputs}
      subInputs={subInputs}
      setSubInputs={setSubInputs}
      onProjectUpdate={onProjectUpdate}
    />
  );
}

/**
 * 虛擬化專案樹組件 - 使用虛擬化渲染
 */
function VirtualizedProjectTree({
  project,
  selectedItem,
  onItemClick,
  searchTerm = '',
  virtualizedHeight = DEFAULT_VIRTUALIZED_HEIGHT,
  onProjectUpdate,
}: {
  project: Project;
  selectedItem: SelectedItem;
  onItemClick: (item: SelectedItem) => void;
  searchTerm?: string;
  virtualizedHeight?: number;
  onProjectUpdate?: (updatedProject: Project) => void;
}) {
  const { user } = useGoogleAuth();

  // === 狀態管理 ===
  const [expandedState] = useState(() => new ExpandedState());
  const [refreshKey, setRefreshKey] = useState(0);
  const [renameDialogStates, setRenameDialogStates] = useState<Record<string, boolean>>({});
  const [expandClickCount, setExpandClickCount] = useState(0);

  // === refs ===
  const listRef = useRef<List>(null);

  // === 計算邏輯 ===
  const flattener = useMemo(() => new TreeFlattener(expandedState), [expandedState]);
  
  const flattenedItems = useMemo(() => {
    const items = flattener.flattenProject(project, searchTerm);
    return items.filter(item => item.isVisible);
  }, [flattener, project, searchTerm, refreshKey]);

  const stats = useMemo(() => 
    TreeBatchOperations.calculateStats(flattenedItems),
    [flattenedItems]
  );

  // === 事件處理 ===
  const handleToggleExpand = useCallback((id: string) => {
    expandedState.toggle(id);
    setRefreshKey(prev => prev + 1);
  }, [expandedState]);

  const handleItemClick = useCallback((item: FlatItem) => {
    let selectedItem: SelectedItem = null;
    
    switch (item.type) {
      case 'project':
        selectedItem = { type: 'project', projectId: item.projectId };
        break;
      case 'package':
        selectedItem = { 
          type: 'package', 
          projectId: item.projectId, 
          packageIndex: item.packageIndex! 
        };
        break;
      case 'subpackage':
        selectedItem = { 
          type: 'subpackage', 
          projectId: item.projectId, 
          packageIndex: item.packageIndex!, 
          subpackageIndex: item.subpackageIndex! 
        };
        break;
      case 'task':
        selectedItem = { 
          type: 'task', 
          projectId: item.projectId, 
          packageIndex: item.packageIndex!, 
          subpackageIndex: item.subpackageIndex!, 
          taskIndex: item.taskIndex! 
        };
        break;
    }
    
    onItemClick(selectedItem);
  }, [onItemClick]);

  // 智能展開/收起循環按鈕
  const handleExpandToggle = useCallback(() => {
    const nextCount = (expandClickCount + 1) % 4;
    setExpandClickCount(nextCount);

    switch (nextCount) {
      case 1:
        // 第一次點擊：智能展開到第一層
        TreeBatchOperations.expandToLevel(expandedState, flattenedItems, 1);
        break;
      case 2:
        // 第二次點擊：智能展開到第二層
        TreeBatchOperations.expandToLevel(expandedState, flattenedItems, 2);
        break;
      case 3:
        // 第三次點擊：智能展開到第三層
        TreeBatchOperations.expandToLevel(expandedState, flattenedItems, 3);
        break;
      case 0:
        // 第四次點擊（回到0）：全部收起
        expandedState.collapseAll();
        break;
    }
    
    setRefreshKey(prev => prev + 1);
  }, [expandedState, flattenedItems, expandClickCount]);

  // === 工具函數 ===
  const isVirtualizedItemSelected = useCallback((item: FlatItem): boolean => {
    if (!selectedItem) return false;
    
    switch (item.type) {
      case 'project':
        return selectedItem.type === 'project' && selectedItem.projectId === item.projectId;
      case 'package':
        return selectedItem.type === 'package' && 
               selectedItem.projectId === item.projectId && 
               selectedItem.packageIndex === item.packageIndex;
      case 'subpackage':
        return selectedItem.type === 'subpackage' && 
               selectedItem.projectId === item.projectId && 
               selectedItem.packageIndex === item.packageIndex &&
               selectedItem.subpackageIndex === item.subpackageIndex;
      case 'task':
        return selectedItem.type === 'task' && 
               selectedItem.projectId === item.projectId && 
               selectedItem.packageIndex === item.packageIndex &&
               selectedItem.subpackageIndex === item.subpackageIndex &&
               selectedItem.taskIndex === item.taskIndex;
      default:
        return false;
    }
  }, [selectedItem]);

  // === 渲染函數 ===
  const renderVirtualizedItem = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = flattenedItems[index];
    if (!item) return null;

    const isSelected = isVirtualizedItemSelected(item);

    switch (item.type) {
      case 'task':
        return (
          <VirtualizedTaskpackageItem
            item={item}
            style={style}
            isSelected={isSelected}
            onToggleExpand={handleToggleExpand}
            onItemClick={handleItemClick}
            onProjectUpdate={onProjectUpdate}
            renameDialogStates={renameDialogStates}
            setRenameDialogStates={setRenameDialogStates}
          />
        );
      case 'subpackage':
        return (
          <VirtualizedSubpackageItem
            item={item}
            style={style}
            isSelected={isSelected}
            onToggleExpand={handleToggleExpand}
            onItemClick={handleItemClick}
            onProjectUpdate={onProjectUpdate}
            renameDialogStates={renameDialogStates}
            setRenameDialogStates={setRenameDialogStates}
          />
        );
      case 'package':
        return (
          <VirtualizedPackageItem
            item={item}
            style={style}
            isSelected={isSelected}
            onToggleExpand={handleToggleExpand}
            onItemClick={handleItemClick}
            onProjectUpdate={onProjectUpdate}
            renameDialogStates={renameDialogStates}
            setRenameDialogStates={setRenameDialogStates}
          />
        );
      case 'project':
        return (
          <VirtualizedProjectItem
            item={item}
            style={style}
            isSelected={isSelected}
            onToggleExpand={handleToggleExpand}
            onItemClick={handleItemClick}
            onProjectUpdate={onProjectUpdate}
            renameDialogStates={renameDialogStates}
            setRenameDialogStates={setRenameDialogStates}
          />
        );
      default:
        return null;
    }
  }, [flattenedItems, handleToggleExpand, handleItemClick, isVirtualizedItemSelected, onProjectUpdate, renameDialogStates, setRenameDialogStates]);

  // 獲取展開按鈕的狀態
  const getExpandButtonState = () => {
    const expandedCount = stats.expanded;
    const totalExpandable = flattenedItems.filter(item => item.hasChildren).length;
    
    switch (expandClickCount) {
      case 0:
        return {
          icon: ExpandIcon,
          title: '智能展開 (第一層)',
          variant: 'outline' as const,
        };
      case 1:
        return {
          icon: ExpandIcon,
          title: '智能展開 (第二層)',
          variant: 'secondary' as const,
        };
      case 2:
        return {
          icon: ExpandIcon,
          title: '智能展開 (第三層)',
          variant: 'default' as const,
        };
      case 3:
        return {
          icon: ListCollapseIcon,
          title: '全部收起',
          variant: 'destructive' as const,
        };
      default:
        return {
          icon: ExpandIcon,
          title: '智能展開',
          variant: 'outline' as const,
        };
    }
  };

  const renderControlPanel = () => {
    const buttonState = getExpandButtonState();
    const ButtonIcon = buttonState.icon;

    return (
      <div className="mb-2 pb-2 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {stats && (
              <>
                <Badge variant="outline" className="text-xs">
                  {stats.total} 項目
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {stats.byType.task} 任務
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {stats.expanded} 展開
                </Badge>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant={buttonState.variant}
              size="sm"
              onClick={handleExpandToggle}
              title={buttonState.title}
              className="h-6 px-2 text-xs"
            >
              <ButtonIcon className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderVirtualizedList = () => (
    <div className="border rounded-md overflow-hidden bg-background">
      {flattenedItems.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-xs text-muted-foreground">
          {searchTerm ? '沒有找到匹配的項目' : '暫無數據'}
        </div>
      ) : (
        <List
          ref={listRef}
          height={virtualizedHeight}
          width="100%"
          itemCount={flattenedItems.length}
          itemSize={ITEM_HEIGHT}
          itemData={flattenedItems}
          overscanCount={5}
        >
          {renderVirtualizedItem}
        </List>
      )}
    </div>
  );

  return (
    <div className="w-full">
      {renderControlPanel()}
      {renderVirtualizedList()}
    </div>
  );
}