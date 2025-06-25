'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquareIcon, ListIcon } from 'lucide-react';

export default function SubpackagePage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        // 這裡應該根據路由參數獲取子工作包資料
        // 實際實現時需要從 URL 參數或 context 中獲取 projectId, packageId, subpackageId
        setLoading(false);
      } catch (error) {
        console.error('載入子工作包資料失敗:', error);
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <main className="p-4">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">載入中...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="p-4">
      <div className="space-y-6">
        {/* 子工作包資訊 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListIcon className="h-5 w-5" />
              子工作包資訊
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">子工作包的基本資訊和描述</p>
          </CardContent>
        </Card>

        {/* 任務列表 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquareIcon className="h-5 w-5" />
              任務列表
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-muted-foreground">此子工作包下的任務列表</p>
              {/* 這裡可以顯示任務列表，每個任務可以點擊進入任務詳情頁面 */}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
} 