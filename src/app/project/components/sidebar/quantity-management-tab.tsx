'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, Info, Lightbulb } from 'lucide-react';
import { VirtualizedProjectTree } from '../tree/virtualized-project-tree';
import { QuantityDistributionDialog } from '../dialogs/quantity-distribution-dialog';
import { useProjectOperations } from '../../hooks';
import { usePermission } from '@/app/settings/hooks/use-permission';
import { Project, SelectedItem, Package, Subpackage } from '../../types';
import { FlatItem } from '../../utils/tree-flattener';

interface QuantityManagementTabProps {
  project: Project;
  onProjectUpdate: (updatedProject: Project) => void;
}

/**
 * 數量分配管理 Tab 組件
 * 專注於階層式數量管理的核心功能，適用於 sidebar tabs
 */
export function QuantityManagementTab({
  project,
  onProjectUpdate,
}: QuantityManagementTabProps) {
  const { hasPermission } = usePermission();
  const { distributeQuantity, loading } = useProjectOperations(
    hasPermission,
    onProjectUpdate,
    () => {}
  );

  // 對話框狀態
  const [showDistributionDialog, setShowDistributionDialog] = useState(false);
  const [activeDistributionItem, setActiveDistributionItem] = useState<{
    item: FlatItem;
    data: Package | Subpackage;
    itemType: 'package' | 'subpackage';
  } | null>(null);

  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);

  // 🎯 數量分配功能實現

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
    
    // 構建項目路徑
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
    }

    return success;
  }, [activeDistributionItem, distributeQuantity, project]);

  // 🎯 其他操作的簡單實現

  const handleAddChild = useCallback((item: FlatItem) => {
    // 這裡可以實現添加子項目的邏輯
    console.log('添加子項目:', item);
  }, []);

  const handleRename = useCallback((item: FlatItem, newName: string) => {
    // 這裡可以實現重命名的邏輯
    console.log('重命名:', item, newName);
  }, []);

  const handleDelete = useCallback((item: FlatItem) => {
    // 這裡可以實現刪除的邏輯
    console.log('刪除項目:', item);
  }, []);

  const handleDuplicate = useCallback((item: FlatItem) => {
    // 這裡可以實現複製的邏輯
    console.log('複製項目:', item);
  }, []);

  // 項目選擇處理
  const handleItemSelect = useCallback((item: SelectedItem) => {
    setSelectedItem(item);
  }, []);

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

  return (
    <div className="space-y-4">
      {/* 簡化的統計信息 - 適用於 sidebar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            數量分配管理
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{stats.packages}</div>
              <div className="text-muted-foreground">工作包</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{stats.subpackages}</div>
              <div className="text-muted-foreground">子工作包</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">{stats.tasks}</div>
              <div className="text-muted-foreground">任務</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">{stats.progress}%</div>
              <div className="text-muted-foreground">總進度</div>
            </div>
          </div>

          <Alert className="py-2">
            <Lightbulb className="h-3 w-3" />
            <AlertDescription className="text-xs">
              右鍵點擊工作包或子工作包，選擇「分配數量」來設置總數量並分配到子項目中。
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* 專案樹狀結構 - 適用於 sidebar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">階層式數量分配</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <VirtualizedProjectTree
            project={project}
            onProjectUpdate={onProjectUpdate}
            onItemSelect={handleItemSelect}
            selectedItem={selectedItem}
            height={400}
            onDistributeQuantity={handleDistributeQuantity}
            onAddChild={handleAddChild}
            onRename={handleRename}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
          />
        </CardContent>
      </Card>

      {/* 簡化的分配狀態概覽 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">分配狀態</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground">
              <strong>總體進度：</strong>
              {stats.totalCompleted} / {stats.totalQuantity} ({stats.progress}%)
            </div>
            
            {project.packages?.slice(0, 3).map((pkg, pkgIdx) => (
              <div key={pkgIdx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium truncate">{pkg.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {pkg.completed || 0} / {pkg.total || 0}
                  </Badge>
                </div>
                
                <div className="ml-2 space-y-1">
                  {pkg.subpackages?.slice(0, 2).map((sub, subIdx) => (
                    <div key={subIdx} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground truncate">{sub.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {sub.completed || 0} / {sub.total || 0}
                      </Badge>
                    </div>
                  ))}
                  {(pkg.subpackages?.length || 0) > 2 && (
                    <div className="text-xs text-muted-foreground ml-2">
                      ...還有 {(pkg.subpackages?.length || 0) - 2} 個子工作包
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {(project.packages?.length || 0) > 3 && (
              <div className="text-xs text-muted-foreground">
                ...還有 {(project.packages?.length || 0) - 3} 個工作包
              </div>
            )}
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