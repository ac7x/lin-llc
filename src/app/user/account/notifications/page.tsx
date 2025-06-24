'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGoogleAuth } from '@/hooks/use-google-auth';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  createdAt: string;
  isRead: boolean;
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
      const q = query(
        collection(db, 'notifications'),
        where('targetUid', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      setNotifications(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification)));
      setLoading(false);
    })();
  }, [user]);

  if (!user) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">通知</h1>
        <p>請先登入以查看通知</p>
      </div>
    );
  }

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <main className="p-4">
      <h1 className="text-xl font-bold mb-4">通知</h1>
      
      {loading ? (
        <div>載入中...</div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">目前沒有通知</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card key={notification.id} className={notification.isRead ? 'opacity-75' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{notification.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={getTypeColor(notification.type)}>
                      {notification.type}
                    </Badge>
                    {!notification.isRead && (
                      <Badge variant="secondary">未讀</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  {notification.message}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(notification.createdAt).toLocaleString('zh-TW')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
