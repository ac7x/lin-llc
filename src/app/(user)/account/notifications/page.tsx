'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useGoogleAuth } from '@/app/(system)';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/app/(system)';
import { NotificationService } from '@/app/project/utils/notification-service';
import { 
  BellIcon, 
  CheckIcon, 
  InfoIcon, 
  AlertTriangleIcon, 
  XCircleIcon, 
  CheckCircleIcon,
  UserIcon,
  EyeIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'task' | 'review';
  targetUid: string;
  isRead: boolean;
  createdAt: string;
  data?: {
    projectId?: string;
    packageIndex?: number;
    subpackageIndex?: number;
    taskIndex?: number;
    action?: string;
  };
}

export default function NotificationsPage() {
  const { user } = useGoogleAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        const q = query(
          collection(db, 'notifications'),
          where('targetUid', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        setNotifications(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification)));
      } catch (error) {
        console.error('載入通知失敗:', error);
        toast.error('載入通知失敗');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (!user) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">請先登入以查看通知</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getTypeInfo = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return { text: '成功', color: 'bg-green-100 text-green-800', icon: CheckCircleIcon };
      case 'warning':
        return { text: '警告', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangleIcon };
      case 'error':
        return { text: '錯誤', color: 'bg-red-100 text-red-800', icon: XCircleIcon };
      case 'task':
        return { text: '任務', color: 'bg-blue-100 text-blue-800', icon: UserIcon };
      case 'review':
        return { text: '審核', color: 'bg-purple-100 text-purple-800', icon: EyeIcon };
      default:
        return { text: '資訊', color: 'bg-blue-100 text-blue-800', icon: InfoIcon };
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    const success = await NotificationService.markAsRead(notificationId);
    if (success) {
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
      toast.success('已標記為已讀');
    } else {
      toast.error('標記失敗');
    }
  };

  const handleViewProject = (notification: Notification) => {
    if (notification.data?.projectId) {
      let url = `/project?projectId=${notification.data.projectId}`;
      
      if (notification.data.packageIndex !== undefined && notification.data.packageIndex >= 0) {
        url += `&packageIndex=${notification.data.packageIndex}`;
      }
      
      if (notification.data.subpackageIndex !== undefined && notification.data.subpackageIndex >= 0) {
        url += `&subpackageIndex=${notification.data.subpackageIndex}`;
      }
      
      if (notification.data.taskIndex !== undefined && notification.data.taskIndex >= 0) {
        url += `&taskIndex=${notification.data.taskIndex}`;
      }
      
      window.open(url, '_blank');
      
      // 標記為已讀
      if (!notification.isRead) {
        void handleMarkAsRead(notification.id);
      }
    }
  };

  // 按類型分組通知
  const notificationsByType = {
    unread: notifications.filter(n => !n.isRead),
    task: notifications.filter(n => n.type === 'task'),
    review: notifications.filter(n => n.type === 'review'),
    all: notifications,
  };

  return (
    <main className="p-4 space-y-6">
      <div className="flex items-center gap-2">
        <BellIcon className="h-6 w-6" />
        <h1 className="text-2xl font-bold">通知中心</h1>
      </div>
      
      {loading ? (
        <div className="text-center py-8">載入中...</div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">目前沒有通知</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* 統計卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{notificationsByType.unread.length}</div>
                  <div className="text-sm text-muted-foreground">未讀通知</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{notificationsByType.task.length}</div>
                  <div className="text-sm text-muted-foreground">任務通知</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{notificationsByType.review.length}</div>
                  <div className="text-sm text-muted-foreground">審核通知</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{notificationsByType.all.length}</div>
                  <div className="text-sm text-muted-foreground">總通知數</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 通知列表 */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">通知列表</h2>
            {notifications.map((notification) => {
              const typeInfo = getTypeInfo(notification.type);
              const TypeIcon = typeInfo.icon;

              return (
                <Card key={notification.id} className={notification.isRead ? 'opacity-75' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <TypeIcon className="h-4 w-4" />
                        {notification.title}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={typeInfo.color}>
                          {typeInfo.text}
                        </Badge>
                        {!notification.isRead && (
                          <Badge variant="secondary">未讀</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      {notification.message}
                    </p>
                    
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-muted-foreground">
                        {new Date(notification.createdAt).toLocaleString('zh-TW')}
                      </p>
                      
                      <div className="flex gap-2">
                        {!notification.isRead && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            <CheckIcon className="h-4 w-4 mr-1" />
                            標記已讀
                          </Button>
                        )}
                        
                        {notification.data?.projectId && (
                          <Button
                            size="sm"
                            onClick={() => handleViewProject(notification)}
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            查看詳情
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
