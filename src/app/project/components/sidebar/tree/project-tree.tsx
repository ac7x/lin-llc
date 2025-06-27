'use client';
import { useState, useMemo, useCallback, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import { 
  ExpandIcon,
  ListCollapseIcon,
  RefreshCwIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { 
  FlatItem, 
  ExpandedState, 
  TreeFlattener, 
  TreeBatchOperations 
} from '../../../utils/tree-flattener';

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
  // 傳統模式狀態（已移至專門組件中處理）

  // 虛擬化模式狀態
  const [expandedState] = useState(() => new ExpandedState());
  const [refreshKey, setRefreshKey] = useState(0);
  
  // 虛擬化節點的重新命名狀態
  const [renameDialogStates, setRenameDialogStates] = useState<Record<string, boolean>>({});
  const { user } = useGoogleAuth();

  // refs
  const listRef = useRef<List>(null);

  // 虛擬化相關計算
  const flattener = useMemo(() => new TreeFlattener(expandedState), [expandedState]);
  
  const flattenedItems = useMemo(() => {
    if (!useVirtualization) return [];
    const items = flattener.flattenProject(project, searchTerm);
    return items.filter(item => item.isVisible);
  }, [flattener, project, searchTerm, refreshKey, useVirtualization]);

  const stats = useMemo(() => 
    useVirtualization ? TreeBatchOperations.calculateStats(flattenedItems) : null,
    [flattenedItems, useVirtualization]
  );

  // 虛擬化事件處理
  const handleVirtualizedToggleExpand = useCallback((id: string) => {
    expandedState.toggle(id);
    setRefreshKey(prev => prev + 1);
  }, [expandedState]);

  const handleVirtualizedItemClick = useCallback((item: FlatItem) => {
    // 轉換為 SelectedItem 格式
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



  // 虛擬化批量操作
  const handleExpandAll = useCallback(() => {
    TreeBatchOperations.smartExpand(expandedState, flattenedItems, 200);
    setRefreshKey(prev => prev + 1);
  }, [expandedState, flattenedItems]);

  const handleCollapseAll = useCallback(() => {
    expandedState.collapseAll();
    setRefreshKey(prev => prev + 1);
  }, [expandedState]);

  // 檢查虛擬化項目是否被選中
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

  // 虛擬化渲染項目 - 將不同類型委託給專門組件
  const renderVirtualizedItem = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = flattenedItems[index];
    if (!item) return null;

    const isSelected = isVirtualizedItemSelected(item);

    // 如果是任務包，使用專門的 VirtualizedTaskpackageItem 組件
    if (item.type === 'task') {
      return (
        <VirtualizedTaskpackageItem
          item={item}
          style={style}
          isSelected={isSelected}
          onToggleExpand={handleVirtualizedToggleExpand}
          onItemClick={handleVirtualizedItemClick}
          onProjectUpdate={onProjectUpdate}
          renameDialogStates={renameDialogStates}
          setRenameDialogStates={setRenameDialogStates}
        />
      );
    }

    // 如果是子工作包，使用專門的 VirtualizedSubpackageItem 組件
    if (item.type === 'subpackage') {
      return (
        <VirtualizedSubpackageItem
          item={item}
          style={style}
          isSelected={isSelected}
          onToggleExpand={handleVirtualizedToggleExpand}
          onItemClick={handleVirtualizedItemClick}
          onProjectUpdate={onProjectUpdate}
          renameDialogStates={renameDialogStates}
          setRenameDialogStates={setRenameDialogStates}
        />
      );
    }

    // 如果是工作包，使用專門的 VirtualizedPackageItem 組件
    if (item.type === 'package') {
      return (
        <VirtualizedPackageItem
          item={item}
          style={style}
          isSelected={isSelected}
          onToggleExpand={handleVirtualizedToggleExpand}
          onItemClick={handleVirtualizedItemClick}
          onProjectUpdate={onProjectUpdate}
          renameDialogStates={renameDialogStates}
          setRenameDialogStates={setRenameDialogStates}
        />
      );
    }

    // 如果是專案項目，使用專門的 VirtualizedProjectItem 組件
    if (item.type === 'project') {
      return (
        <VirtualizedProjectItem
          item={item}
          style={style}
          isSelected={isSelected}
          onToggleExpand={handleVirtualizedToggleExpand}
          onItemClick={handleVirtualizedItemClick}
          onProjectUpdate={onProjectUpdate}
          renameDialogStates={renameDialogStates}
          setRenameDialogStates={setRenameDialogStates}
        />
      );
    }

    // 其他未處理的項目類型（理論上不應該到達這裡）
    return null;
  }, [flattenedItems, handleVirtualizedToggleExpand, handleVirtualizedItemClick, isVirtualizedItemSelected, onProjectUpdate, renameDialogStates, setRenameDialogStates]);

  // 傳統模式事件處理（已移至專門組件中處理）



  // 渲染虛擬化模式
  if (useVirtualization) {
    return (
      <div className="w-full">
        {/* 虛擬化控制面板 */}
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
                </>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExpandAll}
                title="智能展開"
                className="h-6 px-2 text-xs"
              >
                <ExpandIcon className="h-3 w-3" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleCollapseAll}
                title="全部收起"
                className="h-6 px-2 text-xs"
              >
                <ListCollapseIcon className="h-3 w-3" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRefreshKey(prev => prev + 1)}
                title="重新整理"
                className="h-6 px-2 text-xs"
              >
                <RefreshCwIcon className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* 虛擬化列表 */}
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


      </div>
    );
  }

  // 傳統模式渲染 - 使用專門的 ProjectNode 組件
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