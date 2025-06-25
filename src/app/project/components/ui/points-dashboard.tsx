'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePermission } from '@/app/settings/hooks/use-permission';
import { useAuth } from '@/context/auth-context';
import { POINTS_CONFIG } from '../../utils/points-system';
import { 
  Trophy, 
  Star, 
  TrendingUp, 
  Award,
  History,
  Users
} from 'lucide-react';

interface PointsDashboardProps {
  className?: string;
}

export function PointsDashboard({ className }: PointsDashboardProps) {
  const { user } = useAuth();
  const {
    userPoints,
    pointsHistory,
    pointsLeaderboard,
    loadUserPoints,
    loadPointsHistory,
    loadPointsLeaderboard
  } = usePermission();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.uid) return;
      
      setLoading(true);
      try {
        await Promise.all([
          loadUserPoints(user.uid),
          loadPointsHistory(user.uid, 10),
          loadPointsLeaderboard(5)
        ]);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [user?.uid, loadUserPoints, loadPointsHistory, loadPointsLeaderboard]);

  const userRank = pointsLeaderboard.findIndex(u => u.uid === user?.uid) + 1;

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 積分總覽 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">我的積分</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{userPoints}</div>
            <p className="text-xs text-muted-foreground">累積獲得的總積分</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">排名</CardTitle>
            <Trophy className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {userRank > 0 ? `#${userRank}` : '未上榜'}
            </div>
            <p className="text-xs text-muted-foreground">在所有用戶中的排名</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活動記錄</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{pointsHistory.length}</div>
            <p className="text-xs text-muted-foreground">最近的積分活動</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 積分規則說明 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              積分獲得方式
            </CardTitle>
            <CardDescription>了解如何獲得積分</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">完成任務</span>
                <Badge variant="outline">+{POINTS_CONFIG.TASK_COMPLETED}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">審核任務</span>
                <Badge variant="outline">+{POINTS_CONFIG.TASK_REVIEWED}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">100% 完成度獎勵</span>
                <Badge variant="secondary">+{POINTS_CONFIG.PERFECT_SCORE}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">完成子工作包</span>
                <Badge variant="secondary">+{POINTS_CONFIG.SUBPACKAGE_COMPLETED}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">完成工作包</span>
                <Badge variant="default">+{POINTS_CONFIG.PACKAGE_COMPLETED}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold">完成專案</span>
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
                  +{POINTS_CONFIG.PROJECT_COMPLETED}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 積分歷史 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              最近積分活動
            </CardTitle>
            <CardDescription>您最近的積分獲得記錄</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {pointsHistory.length > 0 ? (
                <div className="space-y-3">
                  {pointsHistory.map((record, index) => (
                    <div key={index} className="flex justify-between items-start p-3 rounded-lg border">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{record.reason}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(record.createdAt).toLocaleString('zh-TW')}
                        </p>
                      </div>
                      <Badge 
                        variant={record.points >= 100 ? "default" : "secondary"}
                        className={record.points >= 100 ? "bg-gradient-to-r from-green-500 to-blue-500" : ""}
                      >
                        +{record.points}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>還沒有積分記錄</p>
                  <p className="text-xs">完成任務開始獲得積分吧！</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* 排行榜預覽 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            積分排行榜 (前5名)
          </CardTitle>
          <CardDescription>查看頂尖用戶的積分表現</CardDescription>
        </CardHeader>
        <CardContent>
          {pointsLeaderboard.length > 0 ? (
            <div className="space-y-3">
              {pointsLeaderboard.slice(0, 5).map((leaderUser, index) => (
                <div 
                  key={leaderUser.uid} 
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    leaderUser.uid === user?.uid ? 'bg-primary/5 border-primary' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                      {index + 1}
                    </div>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={leaderUser.photoURL} alt={leaderUser.displayName} />
                      <AvatarFallback>{leaderUser.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{leaderUser.displayName}</p>
                      {leaderUser.uid === user?.uid && (
                        <Badge variant="outline" className="text-xs">這是你</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={index === 0 ? "default" : index === 1 ? "secondary" : "outline"}
                      className={index === 0 ? "bg-gradient-to-r from-yellow-500 to-orange-500" : ""}
                    >
                      {leaderUser.points} 積分
                    </Badge>
                    {index < 3 && (
                      <span className="text-lg">
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暫無排行榜數據</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 