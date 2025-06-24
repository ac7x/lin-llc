'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGoogleAuth } from '@/hooks/use-google-auth';
import { 
  FolderOpen, 
  CheckSquare, 
  Users, 
  TrendingUp,
  Bell,
  Clock
} from 'lucide-react';

interface DashboardStats {
  totalProjects: number;
  activeTasks: number;
  totalUsers: number;
  recentActivities: number;
  unreadNotifications: number;
  pendingTasks: number;
}

export default function DashboardPage() {
  const { user } = useGoogleAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeTasks: 0,
    totalUsers: 0,
    recentActivities: 0,
    unreadNotifications: 0,
    pendingTasks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // 模擬載入儀表板資料
    const mockStats: DashboardStats = {
      totalProjects: 12,
      activeTasks: 8,
      totalUsers: 25,
      recentActivities: 15,
      unreadNotifications: 3,
      pendingTasks: 5,
    };

    setStats(mockStats);
    setLoading(false);
  }, [user]);

  if (!user) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">儀表板</h1>
        <p>請先登入以查看儀表板</p>
      </div>
    );
  }

  const statCards = [
    {
      title: '總專案數',
      value: stats.totalProjects,
      icon: FolderOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: '進行中任務',
      value: stats.activeTasks,
      icon: CheckSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: '總用戶數',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: '最近活動',
      value: stats.recentActivities,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  const quickActions = [
    {
      title: '未讀通知',
      value: stats.unreadNotifications,
      icon: Bell,
      href: '/user/account/notifications',
    },
    {
      title: '待處理任務',
      value: stats.pendingTasks,
      icon: Clock,
      href: '/user/account/task',
    },
  ];

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-6">儀表板</h1>
      
      {loading ? (
        <div>載入中...</div>
      ) : (
        <div className="space-y-6">
          {/* 統計卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 快速操作 */}
          <Card>
            <CardHeader>
              <CardTitle>快速操作</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <action.icon className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium">{action.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {action.value} 個項目
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      查看
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 系統狀態 */}
          <Card>
            <CardHeader>
              <CardTitle>系統狀態</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>系統運行狀態</span>
                  <Badge className="bg-green-100 text-green-800">正常</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>資料庫連接</span>
                  <Badge className="bg-green-100 text-green-800">正常</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>最後更新</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date().toLocaleString('zh-TW')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}