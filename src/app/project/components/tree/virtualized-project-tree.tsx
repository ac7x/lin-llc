'use client';
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  SearchIcon,
  ExpandIcon,
  ListCollapseIcon,
  SettingsIcon,
  RefreshCwIcon,
} from 'lucide-react';
import { useTaskManagement } from '../../hooks';
import { VirtualizedTreeNode } from './virtualized-tree-node';
import { 
  FlatItem, 
  ExpandedState, 
  TreeFlattener, 
  TreeBatchOperations 
} from '../../utils/tree-flattener';
import { TaskAssignmentDialog, TaskSubmissionDialog, TaskReviewDialog } from '../task';
import { Project, SelectedItem } from '../../types';

interface VirtualizedProjectTreeProps {
  project: Project;
  onProjectUpdate: (updatedProject: Project) => void;
  onItemSelect?: (item: SelectedItem) => void;
  selectedItem?: SelectedItem;
  height?: number;
}

// 項目高度常數
const ITEM_HEIGHT = 48;
const DEFAULT_HEIGHT = 600;

/**
 * 虛擬化專案樹狀組件
 * 支援大規模數據的高性能渲染
 */
export function VirtualizedProjectTree({
  project,
  onProjectUpdate,
  onItemSelect,
  selectedItem,
  height = DEFAULT_HEIGHT,
}: VirtualizedProjectTreeProps) {
  // 狀態管理
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedState] = useState(() => new ExpandedState());
  const [selectedFlatItem, setSelectedFlatItem] = useState<FlatItem | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // 對話框狀態
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [showSubmissionDialog, setShowSubmissionDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [activeTaskItem, setActiveTaskItem] = useState<FlatItem | null>(null);

  // refs
  const listRef = useRef<List>(null);

  // 任務管理 hook
  const { assignTask, submitTaskProgress, reviewTask, loading } = useTaskManagement();

  // 創建扁平化器
  const flattener = useMemo(() => new TreeFlattener(expandedState), [expandedState]);

  // 扁平化數據
  const flattenedItems = useMemo(() => {
    const items = flattener.flattenProject(project, searchTerm);
    return items.filter(item => item.isVisible);
  }, [flattener, project, searchTerm, refreshKey]);

  // 統計信息
  const stats = useMemo(() => 
    TreeBatchOperations.calculateStats(flattenedItems),
    [flattenedItems]
  );

  // 展開/收起切換
  const handleToggleExpand = useCallback((id: string) => {
    expandedState.toggle(id);
    setRefreshKey(prev => prev + 1);
  }, [expandedState]);

  // 項目點擊處理
  const handleItemClick = useCallback((item: FlatItem) => {
    setSelectedFlatItem(item);
    
    // 轉換為 SelectedItem 格式
    if (onItemSelect) {
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
      
      onItemSelect(selectedItem);
    }
  }, [onItemSelect]);

  // 任務操作處理函數
  const handleAssignTask = useCallback((item: FlatItem) => {
    setActiveTaskItem(item);
    setShowAssignmentDialog(true);
  }, []);

  const handleSubmitTask = useCallback((item: FlatItem) => {
    setActiveTaskItem(item);
    setShowSubmissionDialog(true);
  }, []);

  const handleReviewTask = useCallback((item: FlatItem) => {
    setActiveTaskItem(item);
    setShowReviewDialog(true);
  }, []);

  // 實際的任務操作
  const doAssignTask = useCallback(async (submitters: string[], reviewers: string[]) => {
    if (!activeTaskItem) return false;
    
    const success = await assignTask(
      project,
      {
        packageIndex: activeTaskItem.packageIndex!,
        subpackageIndex: activeTaskItem.subpackageIndex!,
        taskIndex: activeTaskItem.taskIndex!,
      },
      submitters,
      reviewers,
      onProjectUpdate
    );
    
    if (success) {
      setRefreshKey(prev => prev + 1);
    }
    
    return success;
  }, [activeTaskItem, assignTask, project, onProjectUpdate]);

  const doSubmitTask = useCallback(async (completed: number, total: number) => {
    if (!activeTaskItem) return false;
    
    const success = await submitTaskProgress(
      project,
      {
        packageIndex: activeTaskItem.packageIndex!,
        subpackageIndex: activeTaskItem.subpackageIndex!,
        taskIndex: activeTaskItem.taskIndex!,
      },
      completed,
      total,
      onProjectUpdate
    );
    
    if (success) {
      setRefreshKey(prev => prev + 1);
    }
    
    return success;
  }, [activeTaskItem, submitTaskProgress, project, onProjectUpdate]);

  const doReviewTask = useCallback(async (approved: boolean, comment?: string) => {
    if (!activeTaskItem) return false;
    
    const success = await reviewTask(
      project,
      {
        packageIndex: activeTaskItem.packageIndex!,
        subpackageIndex: activeTaskItem.subpackageIndex!,
        taskIndex: activeTaskItem.taskIndex!,
      },
      approved,
      onProjectUpdate,
      comment
    );
    
    if (success) {
      setRefreshKey(prev => prev + 1);
    }
    
    return success;
  }, [activeTaskItem, reviewTask, project, onProjectUpdate]);

  // 批量操作
  const handleExpandAll = useCallback(() => {
    TreeBatchOperations.smartExpand(expandedState, flattenedItems, 200);
    setRefreshKey(prev => prev + 1);
  }, [expandedState, flattenedItems]);

  const handleCollapseAll = useCallback(() => {
    expandedState.collapseAll();
    setRefreshKey(prev => prev + 1);
  }, [expandedState]);

  // 檢查項目是否被選中
  const isItemSelected = useCallback((item: FlatItem): boolean => {
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

  // 渲染項目的函數
  const renderItem = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = flattenedItems[index];
    if (!item) return null;

    return (
      <VirtualizedTreeNode
        key={item.id}
        item={item}
        style={style}
        onToggleExpand={handleToggleExpand}
        onItemClick={handleItemClick}
        onAssignTask={handleAssignTask}
        onSubmitTask={handleSubmitTask}
        onReviewTask={handleReviewTask}
        isSelected={isItemSelected(item)}
      />
    );
  }, [flattenedItems, handleToggleExpand, handleItemClick, handleAssignTask, handleSubmitTask, handleReviewTask, isItemSelected]);

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <span>專案樹狀結構</span>
            <div className="flex items-center gap-2">
              {/* 統計信息 */}
              <Badge variant="outline">
                {stats.total} 項目
              </Badge>
              <Badge variant="outline">
                {stats.byType.task} 任務
              </Badge>
            </div>
          </CardTitle>
          
          {/* 控制面板 */}
          <div className="flex items-center gap-2">
            {/* 搜索框 */}
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索專案、包、任務..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* 操作按鈕 */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExpandAll}
              title="智能展開"
            >
              <ExpandIcon className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleCollapseAll}
              title="全部收起"
            >
              <ListCollapseIcon className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRefreshKey(prev => prev + 1)}
              title="重新整理"
            >
              <RefreshCwIcon className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {/* 虛擬化列表 */}
          <div className="border-t">
            {flattenedItems.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                {searchTerm ? '沒有找到匹配的項目' : '暫無數據'}
              </div>
            ) : (
              <List
                ref={listRef}
                height={height}
                width="100%"
                itemCount={flattenedItems.length}
                itemSize={ITEM_HEIGHT}
                itemData={flattenedItems}
                overscanCount={5}
              >
                {renderItem}
              </List>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 任務對話框 */}
      {activeTaskItem && (
        <>
          <TaskAssignmentDialog
            isOpen={showAssignmentDialog}
            onClose={() => setShowAssignmentDialog(false)}
            taskName={(activeTaskItem.data as any).name}
            projectName={project.name}
            currentSubmitters={(activeTaskItem.data as any).submitters || []}
            currentReviewers={(activeTaskItem.data as any).reviewers || []}
            onAssign={doAssignTask}
          />

          <TaskSubmissionDialog
            isOpen={showSubmissionDialog}
            onClose={() => setShowSubmissionDialog(false)}
            taskName={(activeTaskItem.data as any).name}
            currentCompleted={(activeTaskItem.data as any).completed || 0}
            currentTotal={(activeTaskItem.data as any).total || 0}
            onSubmit={doSubmitTask}
          />

          <TaskReviewDialog
            isOpen={showReviewDialog}
            onClose={() => setShowReviewDialog(false)}
            taskName={(activeTaskItem.data as any).name}
            projectName={project.name}
            submittedBy={(activeTaskItem.data as any).submittedBy}
            submittedAt={(activeTaskItem.data as any).submittedAt}
            completed={(activeTaskItem.data as any).completed || 0}
            total={(activeTaskItem.data as any).total || 0}
            currentStatus={(activeTaskItem.data as any).status}
            onReview={doReviewTask}
          />
        </>
      )}
    </>
  );
} 