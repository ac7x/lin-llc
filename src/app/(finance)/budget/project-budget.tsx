'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { db, auth } from '@/app/(system)';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Plus, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { BudgetItem, BudgetSummary, BudgetFormData, ProjectBudgetProps } from './types';

/**
 * 專案預算組件 - 管理專案預算和支出追蹤
 */
export default function ProjectBudget({ projectId, disabled = false }: ProjectBudgetProps) {
  const [user] = useAuthState(auth);
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<BudgetFormData>({
    category: '',
    description: '',
    budgetAmount: 0,
    actualAmount: 0
  });

  // 載入預算項目
  useEffect(() => {
    if (!projectId) return;

    const q = query(
      collection(db, 'projects', projectId, 'budget'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const budgetItems: BudgetItem[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        budgetItems.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
        } as BudgetItem);
      });
      setItems(budgetItems);
    });

    return () => unsubscribe();
  }, [projectId]);

  // 計算預算統計
  const calculateSummary = (): BudgetSummary => {
    const totalBudget = items.reduce((sum, item) => sum + item.budgetAmount, 0);
    const totalActual = items.reduce((sum, item) => sum + item.actualAmount, 0);
    const remaining = totalBudget - totalActual;
    const variance = ((totalActual - totalBudget) / totalBudget) * 100;

    return { totalBudget, totalActual, remaining, variance };
  };

  // 提交新預算項目
  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!user || !formData.category.trim() || !formData.description.trim()) return;

    try {
      setLoading(true);

      const budgetItem: Omit<BudgetItem, 'id'> = {
        projectId,
        category: formData.category.trim(),
        description: formData.description.trim(),
        budgetAmount: Number(formData.budgetAmount),
        actualAmount: Number(formData.actualAmount),
        createdAt: Timestamp.now().toDate().toISOString(),
        createdBy: user.uid
      };

      await addDoc(collection(db, 'projects', projectId, 'budget'), {
        ...budgetItem,
        createdAt: Timestamp.now()
      });

      // 重置表單
      setFormData({ category: '', description: '', budgetAmount: 0, actualAmount: 0 });
      setShowAddForm(false);
    } catch (error) {
      console.error('新增預算項目失敗:', error);
      alert('新增預算項目失敗');
    } finally {
      setLoading(false);
    }
  };

  // 格式化金額
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const summary = calculateSummary();

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">請先登入以查看專案預算</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 標題與新增按鈕 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          專案預算
        </h3>
        {!disabled && (
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            variant="outline"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            新增項目
          </Button>
        )}
      </div>

      {/* 預算統計卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs text-gray-500">總預算</p>
                <p className="text-sm font-medium">{formatCurrency(summary.totalBudget)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-xs text-gray-500">實際支出</p>
                <p className="text-sm font-medium">{formatCurrency(summary.totalActual)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-xs text-gray-500">剩餘預算</p>
                <p className="text-sm font-medium">{formatCurrency(summary.remaining)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className={`h-4 w-4 ${summary.variance > 0 ? 'text-red-500' : 'text-green-500'}`} />
              <div>
                <p className="text-xs text-gray-500">預算差異</p>
                <p className="text-sm font-medium">
                  {summary.variance > 0 ? '+' : ''}{summary.variance.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 新增預算項目表單 */}
      {showAddForm && !disabled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">新增預算項目</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="預算類別 (如：人力成本、設備費用)"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  required
                />
                <Input
                  placeholder="項目描述"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
                <Input
                  type="number"
                  placeholder="預算金額"
                  value={formData.budgetAmount || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, budgetAmount: Number(e.target.value) }))}
                  required
                />
                <Input
                  type="number"
                  placeholder="實際金額"
                  value={formData.actualAmount || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, actualAmount: Number(e.target.value) }))}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? '儲存中...' : '儲存'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddForm(false)}
                >
                  取消
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 預算項目列表 */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">預算明細</h4>
        {items.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">尚無預算項目</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{item.category}</Badge>
                      <span className="text-sm font-medium">{item.description}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>預算: {formatCurrency(item.budgetAmount)}</span>
                      <span>實際: {formatCurrency(item.actualAmount)}</span>
                      <span>差異: {formatCurrency(item.actualAmount - item.budgetAmount)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      item.actualAmount > item.budgetAmount ? 'text-red-500' : 'text-green-500'
                    }`}>
                      {item.actualAmount > item.budgetAmount ? '超支' : '符合預算'}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 