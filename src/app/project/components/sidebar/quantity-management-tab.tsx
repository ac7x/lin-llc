'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calculator, Lightbulb, ChevronRight, ChevronDown } from 'lucide-react';
import { QuantityDistributionDialog } from '../dialogs/quantity-distribution-dialog';
import { useProjectOperations } from '../../hooks';
import { usePermissionContext } from '@/app/(system)';
import { Project, Package, Subpackage } from '../../types';
import { FlatItem, ExpandedState, TreeFlattener } from '../../utils/tree-flattener';

interface QuantityManagementTabProps {
  project: Project;
  onProjectUpdate: (updatedProject: Project) => void;
}

// 簡化的樹狀節點組件 - 專為 sidebar 設計
function CompactTreeNode({
  item,
  style,
  onToggleExpand,
  onDistributeQuantity,
}: {
  item: FlatItem;
  style: React.CSSProperties;
  onToggleExpand: (id: string) => void;
  onDistributeQuantity?: (item: FlatItem) => void;
}) {
  const handleRightClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if ((item.type === 'package' || item.type === 'subpackage') && onDistributeQuantity) {
      onDistributeQuantity(item);
    }
  }, [item, onDistributeQuantity]);

  const getIcon = () => {
    if (item.type === 'project') return null;
    return item.isExpanded ? (
      <ChevronDown className="h-3 w-3 text-muted-foreground" />
    ) : (
      <ChevronRight className="h-3 w-3 text-muted-foreground" />
    );
  };

  const getStatusColor = () => {
    if (item.type !== 'task') return 'text-foreground';
    const data = item.data as any;
    const status = data.status;
    switch (status) {
      case 'pending': return 'text-yellow-600';
      case 'in_progress': return 'text-blue-600';
      case 'completed': return 'text-green-600';
      case 'under_review': return 'text-purple-600';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div
      style={style}
      className="flex items-center px-2 py-0.5 hover:bg-muted/50 cursor-pointer text-xs border-b border-muted/20"
      onContextMenu={handleRightClick}
      onClick={() => item.hasChildren && onToggleExpand(item.id)}
    >
      <div 
        className="flex items-center gap-1 flex-1 min-w-0"
        style={{ paddingLeft: `${item.level * 8}px` }}
      >
        {item.hasChildren && getIcon()}
        <span className={`truncate font-medium ${getStatusColor()}`} title={(item.data as any).name}>
          {(item.data as any).name}
        </span>
        {(item.type === 'package' || item.type === 'subpackage' || item.type === 'task') && (
          <Badge variant="secondary" className="text-xs h-3 px-1 ml-auto flex-shrink-0">
            {(item.data as any).completed || 0}/{(item.data as any).total || 0}
          </Badge>
        )}
      </div>
    </div>
  );
}

/**
 * 數量分配管理 Tab 組件
 * 專注於階層式數量管理的核心功能，適用於 sidebar tabs
 */
export function QuantityManagementTab({
  project,
  onProjectUpdate,
}: QuantityManagementTabProps) {
  const { hasPermission } = usePermissionContext();
  const { distributeQuantity, loading } = useProjectOperations(
    hasPermission,
    onProjectUpdate,
    () => {}
  );

  // 樹狀結構狀態
  const [expandedState] = useState(() => new ExpandedState());
  const [refreshKey, setRefreshKey] = useState(0);

  // 對話框狀態
  const [showDistributionDialog, setShowDistributionDialog] = useState(false);
  const [activeDistributionItem, setActiveDistributionItem] = useState<{
    item: FlatItem;
    data: Package | Subpackage;
    itemType: 'package' | 'subpackage';
  } | null>(null);

  const listRef = useRef<List>(null);

  // 創建扁平化器和數據
  const flattener = useMemo(() => new TreeFlattener(expandedState), [expandedState]);
  
  const flattenedItems = useMemo(() => {
    const items = flattener.flattenProject(project, '');
    return items.filter(item => item.isVisible);
  }, [flattener, project, refreshKey]);

  // 展開/收起切換
  const handleToggleExpand = useCallback((id: string) => {
    expandedState.toggle(id);
    setRefreshKey(prev => prev + 1);
  }, [expandedState]);

  // 處理數量分配請求
  const handleDistributeQuantity = useCallback((item: FlatItem) => {
    if (item.type === 'package' || item.type === 'subpackage') {
      setActiveDistributionItem({
        item,
        data: item.data as Package | Subpackage,
        itemType: item.type,
      });
      setShowDistributionDialog(true);
    }
  }, []);

  // 執行數量分配
  const executeDistribution = useCallback(async (distributionData: {
    parentTotal: number;
    distributions: Array<{
      index: number;
      name: string;
      allocated: number;
      completed?: number;
    }>;
  }) => {
    if (!activeDistributionItem) return false;

    const { item } = activeDistributionItem;
    
    const itemPath = {
      packageIndex: item.packageIndex,
      subpackageIndex: item.subpackageIndex,
    };

    const success = await distributeQuantity(
      project.id,
      itemPath,
      distributionData,
      [project]
    );

    if (success) {
      setShowDistributionDialog(false);
      setActiveDistributionItem(null);
      setRefreshKey(prev => prev + 1);
    }

    return success;
  }, [activeDistributionItem, distributeQuantity, project]);



  // 統計信息
  const getProjectStats = () => {
    const packages = project.packages || [];
    const subpackages = packages.flatMap(pkg => pkg.subpackages || []);
    const tasks = subpackages.flatMap(sub => sub.taskpackages || []);
    
    const totalTasks = tasks.length;
    const totalCompleted = tasks.reduce((sum, task) => sum + (task.completed || 0), 0);
    const totalQuantity = tasks.reduce((sum, task) => sum + (task.total || 0), 0);
    const progress = totalQuantity > 0 ? Math.round((totalCompleted / totalQuantity) * 100) : 0;

    return {
      packages: packages.length,
      subpackages: subpackages.length,
      tasks: totalTasks,
      totalQuantity,
      totalCompleted,
      progress,
    };
  };

  const stats = getProjectStats();

  // 渲染樹狀節點
  const renderTreeItem = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = flattenedItems[index];
    if (!item) return null;

    return (
      <CompactTreeNode
        key={item.id}
        item={item}
        style={style}
        onToggleExpand={handleToggleExpand}
        onDistributeQuantity={handleDistributeQuantity}
      />
    );
  }, [flattenedItems, handleToggleExpand, handleDistributeQuantity]);

  return (
    <div className="space-y-2 h-full flex flex-col">
      {/* 緊湊統計信息 */}
      <Card className="border-0 shadow-none bg-muted/20 flex-shrink-0">
        <CardHeader className="pb-2 px-3 pt-3">
          <CardTitle className="text-xs flex items-center gap-1">
            <Calculator className="h-3 w-3" />
            數量統計
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="grid grid-cols-4 gap-1 text-xs mb-2">
            <div className="text-center">
              <div className="text-sm font-bold text-blue-600">{stats.packages}</div>
              <div className="text-muted-foreground text-xs">工作包</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-green-600">{stats.subpackages}</div>
              <div className="text-muted-foreground text-xs">子包</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-purple-600">{stats.tasks}</div>
              <div className="text-muted-foreground text-xs">任務</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-orange-600">{stats.progress}%</div>
              <div className="text-muted-foreground text-xs">進度</div>
            </div>
          </div>

          <div className="bg-muted/30 rounded p-2">
            <div className="flex items-center gap-1">
              <Lightbulb className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <p className="text-xs text-muted-foreground leading-tight">
                右鍵工作包可分配數量
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 緊湊的專案樹 */}
      <Card className="border-0 shadow-none bg-muted/20 flex-1 min-h-0">
        <CardHeader className="pb-2 px-3 pt-3 flex-shrink-0">
          <CardTitle className="text-xs">階層式分配</CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 min-h-0">
          <div className="border border-muted/50 rounded-md overflow-hidden bg-background h-full">
            {flattenedItems.length === 0 ? (
              <div className="flex items-center justify-center h-16 text-xs text-muted-foreground">
                暫無數據
              </div>
            ) : (
              <List
                ref={listRef}
                height={160}
                width="100%"
                itemCount={flattenedItems.length}
                itemSize={24}
                overscanCount={3}
              >
                {renderTreeItem}
              </List>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 緊湊狀態摘要 */}
      <Card className="border-0 shadow-none bg-muted/20 flex-shrink-0">
        <CardHeader className="pb-1 px-3 pt-2">
          <CardTitle className="text-xs">狀態摘要</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-2">
          <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1 text-center border">
            總進度: {stats.totalCompleted}/{stats.totalQuantity} ({stats.progress}%)
          </div>
        </CardContent>
      </Card>

      {/* 數量分配對話框 */}
      {activeDistributionItem && (
        <QuantityDistributionDialog
          isOpen={showDistributionDialog}
          onClose={() => {
            setShowDistributionDialog(false);
            setActiveDistributionItem(null);
          }}
          item={activeDistributionItem.data}
          itemType={activeDistributionItem.itemType}
          onDistribute={executeDistribution}
        />
      )}
    </div>
  );
} 