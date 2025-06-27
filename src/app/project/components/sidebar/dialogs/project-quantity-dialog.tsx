'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Calculator, Shuffle, Equal, TrendingUp } from 'lucide-react';
import { Package, SubPackage, TaskPackage } from '../../../types';

interface QuantityDistributionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: Package | SubPackage;
  itemType: 'package' | 'subpackage';
  onDistribute: (distributionData: DistributionData) => Promise<boolean>;
}

interface DistributionData {
  parentTotal: number;
  distributions: Array<{
    index: number;
    name: string;
    allocated: number;
    completed?: number;
  }>;
}

type DistributionMode = 'equal' | 'proportional' | 'manual' | 'remaining';

/**
 * 數量分配對話框 - 階層式數量管理的核心組件
 */
export function QuantityDistributionDialog({
  isOpen,
  onClose,
  item,
  itemType,
  onDistribute,
}: QuantityDistributionDialogProps) {
  const [parentTotal, setParentTotal] = useState(0);
  const [distributionMode, setDistributionMode] = useState<DistributionMode>('equal');
  const [distributions, setDistributions] = useState<DistributionData['distributions']>([]);
  const [loading, setLoading] = useState(false);

  // 獲取子項目列表
  const getChildren = () => {
    if (itemType === 'package') {
      return (item as Package).subpackages || [];
    } else {
      return (item as SubPackage).taskpackages || [];
    }
  };

  // 初始化數據
  useEffect(() => {
    if (isOpen) {
      const children = getChildren();
      const currentTotal = (item as any).total || 0;
      
      setParentTotal(currentTotal);
      setDistributions(
        children.map((child, index) => ({
          index,
          name: child.name,
          allocated: child.total || 0,
          completed: child.completed || 0,
        }))
      );
    }
  }, [isOpen, item, itemType]);

  // 計算統計信息
  const stats = {
    totalAllocated: distributions.reduce((sum, dist) => sum + dist.allocated, 0),
    totalCompleted: distributions.reduce((sum, dist) => sum + (dist.completed || 0), 0),
    remaining: parentTotal - distributions.reduce((sum, dist) => sum + dist.allocated, 0),
    childrenCount: distributions.length,
  };

  // 分配策略實現
  const applyDistributionMode = (mode: DistributionMode, total: number) => {
    const children = getChildren();
    let newDistributions = [...distributions];

    switch (mode) {
      case 'equal':
        // 平均分配
        const avgAmount = Math.floor(total / children.length);
        const remainder = total % children.length;
        
        newDistributions = children.map((child, index) => ({
          index,
          name: child.name,
          allocated: avgAmount + (index < remainder ? 1 : 0),
          completed: child.completed || 0,
        }));
        break;

      case 'proportional':
        // 按現有比例分配
        const currentTotal = distributions.reduce((sum, dist) => sum + dist.allocated, 0);
        if (currentTotal > 0) {
          let allocated = 0;
          newDistributions = distributions.map((dist, index) => {
            const proportion = dist.allocated / currentTotal;
            const newAmount = index === distributions.length - 1 
              ? total - allocated // 最後一個獲得剩餘數量
              : Math.floor(total * proportion);
            allocated += newAmount;
            return { ...dist, allocated: newAmount };
          });
        } else {
          // 如果沒有現有分配，降級為平均分配
          return applyDistributionMode('equal', total);
        }
        break;

      case 'remaining':
        // 保持現有分配，將剩餘數量分配給第一個項目
        const existingTotal = distributions.reduce((sum, dist) => sum + dist.allocated, 0);
        const remainingAmount = total - existingTotal;
        
        if (remainingAmount !== 0 && distributions.length > 0) {
          newDistributions[0] = {
            ...newDistributions[0],
            allocated: newDistributions[0].allocated + remainingAmount,
          };
        }
        break;

      case 'manual':
        // 手動模式，不自動分配
        break;
    }

    setDistributions(newDistributions);
    
    // 檢查是否需要自動調整總數量
    const newTotalAllocated = newDistributions.reduce((sum, dist) => sum + dist.allocated, 0);
    if (newTotalAllocated > total && mode !== 'manual') {
      setParentTotal(newTotalAllocated);
    }
  };

  // 處理總數量變更
  const handleTotalChange = (newTotal: number) => {
    setParentTotal(newTotal);
    if (distributionMode !== 'manual') {
      applyDistributionMode(distributionMode, newTotal);
    }
  };

  // 處理單個分配變更
  const handleDistributionChange = (index: number, newValue: number) => {
    const newDistributions = [...distributions];
    newDistributions[index] = {
      ...newDistributions[index],
      allocated: Math.max(0, newValue),
    };
    setDistributions(newDistributions);
    
    // 自動調整總數量以避免超出分配
    const newTotalAllocated = newDistributions.reduce((sum, dist) => sum + dist.allocated, 0);
    if (newTotalAllocated > parentTotal) {
      setParentTotal(newTotalAllocated);
    }
  };

  // 驗證分配
  const validateDistribution = () => {
    const errors: string[] = [];
    
    if (parentTotal <= 0) {
      errors.push('總數量必須大於 0');
    }
    
    distributions.forEach((dist, index) => {
      if (dist.allocated < (dist.completed || 0)) {
        errors.push(`${dist.name}: 分配數量不能小於已完成數量`);
      }
    });

    return errors;
  };

  // 提交分配
  const handleSubmit = async () => {
    const errors = validateDistribution();
    if (errors.length > 0) {
      alert('驗證失敗:\n' + errors.join('\n'));
      return;
    }

    setLoading(true);
    try {
      const success = await onDistribute({
        parentTotal,
        distributions,
      });
      
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('分配失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 獲取分配模式描述
  const getModeDescription = (mode: DistributionMode) => {
    const descriptions = {
      equal: '將總數量平均分配給所有子項目',
      proportional: '按現有數量比例重新分配',
      remaining: '保持現有分配，剩餘數量分配給第一項',
      manual: '手動設置每個子項目的數量',
    };
    return descriptions[mode];
  };

  const children = getChildren();
  const validationErrors = validateDistribution();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {itemType === 'package' ? '工作包' : '子工作包'}數量分配 - {(item as any).name}
          </DialogTitle>
          <DialogDescription>
            設置總數量並分配到{itemType === 'package' ? '子工作包' : '任務'}中
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 總數量設置 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">總數量設置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="total">總數量</Label>
                  <Input
                    id="total"
                    type="number"
                    value={parentTotal}
                    onChange={(e) => handleTotalChange(parseInt(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>分配策略</Label>
                  <Select value={distributionMode} onValueChange={(value: DistributionMode) => {
                    setDistributionMode(value);
                    if (value !== 'manual') {
                      applyDistributionMode(value, parentTotal);
                    }
                  }}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equal">
                        <div className="flex items-center gap-2">
                          <Equal className="h-4 w-4" />
                          平均分配
                        </div>
                      </SelectItem>
                      <SelectItem value="proportional">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          比例分配
                        </div>
                      </SelectItem>
                      <SelectItem value="remaining">
                        <div className="flex items-center gap-2">
                          <Shuffle className="h-4 w-4" />
                          剩餘分配
                        </div>
                      </SelectItem>
                      <SelectItem value="manual">
                        <div className="flex items-center gap-2">
                          <Calculator className="h-4 w-4" />
                          手動設置
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                {getModeDescription(distributionMode)}
              </div>

              {/* 快速操作按鈕 */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyDistributionMode('equal', parentTotal)}
                >
                  平均分配
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyDistributionMode('proportional', parentTotal)}
                >
                  比例分配
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newDistributions = distributions.map(dist => ({
                      ...dist,
                      allocated: 0,
                    }));
                    setDistributions(newDistributions);
                  }}
                >
                  重置分配
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 統計信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>分配統計</span>
                {stats.totalAllocated !== parentTotal && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setParentTotal(stats.totalAllocated)}
                    className="text-xs"
                  >
                    同步總數量
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalAllocated}</div>
                  <div className="text-sm text-muted-foreground">已分配</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.totalCompleted}</div>
                  <div className="text-sm text-muted-foreground">已完成</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${stats.remaining === 0 ? 'text-green-600' : stats.remaining > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                    {stats.remaining}
                  </div>
                  <div className="text-sm text-muted-foreground">剩餘</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.childrenCount}</div>
                  <div className="text-sm text-muted-foreground">子項目</div>
                </div>
              </div>
              
              {stats.remaining !== 0 && (
                <div className={`mt-4 p-3 rounded border ${
                  stats.remaining > 0 
                    ? 'bg-orange-50 border-orange-200' 
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className={`flex items-center gap-2 ${
                    stats.remaining > 0 ? 'text-orange-800' : 'text-blue-800'
                  }`}>
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {stats.remaining > 0 
                        ? `還有 ${stats.remaining} 未分配` 
                        : `自動調整了總數量 (+${Math.abs(stats.remaining)})`
                      }
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 分配詳情 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">分配詳情</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {distributions.map((dist, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{dist.name}</div>
                      {dist.completed !== undefined && (
                        <div className="text-sm text-muted-foreground">
                          已完成: {dist.completed}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`dist-${index}`} className="text-sm">分配:</Label>
                      <Input
                        id={`dist-${index}`}
                        type="number"
                        value={dist.allocated}
                        onChange={(e) => handleDistributionChange(index, parseInt(e.target.value) || 0)}
                        className="w-20"
                        min="0"
                      />
                    </div>
                    
                    {dist.completed !== undefined && dist.allocated > 0 && (
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={(dist.completed / dist.allocated) * 100} 
                          className="w-20" 
                        />
                        <span className="text-xs text-muted-foreground min-w-[3rem]">
                          {Math.round((dist.completed / dist.allocated) * 100)}%
                        </span>
                      </div>
                    )}
                    
                    <Badge variant={dist.allocated >= (dist.completed || 0) ? "secondary" : "destructive"}>
                      {dist.allocated >= (dist.completed || 0) ? "正常" : "不足"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 驗證錯誤 */}
          {validationErrors.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  驗證錯誤
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-red-700 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || validationErrors.length > 0}
          >
            {loading ? '分配中...' : '確認分配'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 