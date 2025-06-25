'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, Info, Lightbulb } from 'lucide-react';
import { VirtualizedProjectTree } from './tree/virtualized-project-tree';
import { QuantityDistributionDialog } from './dialogs/quantity-distribution-dialog';
import { SimpleContextMenu } from './ui/simple-context-menu';
import { useProjectOperations, useProjectData } from '../hooks';
import { usePermission } from '@/app/settings/hooks/use-permission';
import { Project, SelectedItem, Package, Subpackage } from '../types';
import { FlatItem } from '../utils/tree-flattener';

interface QuantityManagementViewProps {
  project: Project;
  onProjectUpdate: (updatedProject: Project) => void;
}

/**
 * 數量分配管理視圖組件
 * 專注於階層式數量管理的核心功能
 */
export function QuantityManagementView({
  project,
  onProjectUpdate,
}: QuantityManagementViewProps) {
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
    <div className="space-y-6">
      {/* 頁面標題和說明 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            數量分配管理 - {project.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.packages}</div>
              <div className="text-sm text-muted-foreground">工作包</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.subpackages}</div>
              <div className="text-sm text-muted-foreground">子工作包</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.tasks}</div>
              <div className="text-sm text-muted-foreground">任務</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.progress}%</div>
              <div className="text-sm text-muted-foreground">總進度</div>
            </div>
          </div>

          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              <strong>使用方法：</strong>
              右鍵點擊工作包或子工作包，選擇「分配數量」來設置總數量並分配到子項目中。
              支援多種分配策略：平均分配、比例分配、手動設置等。
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* 專案樹狀結構 */}
      <Card>
        <CardHeader>
          <CardTitle>階層式數量分配</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <VirtualizedProjectTree
            project={project}
            onProjectUpdate={onProjectUpdate}
            onItemSelect={handleItemSelect}
            selectedItem={selectedItem}
            height={600}
            onDistributeQuantity={handleDistributeQuantity}
            onAddChild={handleAddChild}
            onRename={handleRename}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
          />
        </CardContent>
      </Card>

      {/* 分配狀態概覽 */}
      <Card>
        <CardHeader>
          <CardTitle>分配狀態概覽</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <strong>總體進度：</strong>
              {stats.totalCompleted} / {stats.totalQuantity} ({stats.progress}%)
            </div>
            
            {project.packages?.map((pkg, pkgIdx) => (
              <div key={pkgIdx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{pkg.name}</span>
                  <Badge variant="outline">
                    {pkg.completed || 0} / {pkg.total || 0}
                  </Badge>
                </div>
                
                <div className="ml-4 space-y-1">
                  {pkg.subpackages?.map((sub, subIdx) => (
                    <div key={subIdx} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{sub.name}</span>
                      <Badge variant="secondary">
                        {sub.completed || 0} / {sub.total || 0}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
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