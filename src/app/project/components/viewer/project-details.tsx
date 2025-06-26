import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SettingsIcon, UsersIcon, MapPinIcon, CalendarIcon, EditIcon } from 'lucide-react';
import { useProjectProgress } from '../../hooks';
import { Project } from '../../types';
import { ProjectOverviewCards } from './project-overview-cards';
import { ProjectEditDialog } from './project-edit-dialog';
import { CurrentWeather, WeatherForecast } from '../weather';
import { SimpleProjectMap } from '../map';
import { permissionService } from '@/app/settings/lib/permission-service';
import type { UserProfile } from '@/app/settings/types';

interface ProjectDetailsProps {
  project: Project;
  onProjectUpdate?: (updatedProject: Project) => void;
  updateProjectInfo?: (project: Project) => Promise<boolean>;
}

/**
 * 專案詳情組件
 * 顯示專案的基本資訊、統計概覽和進度條
 */
export function ProjectDetails({ project, onProjectUpdate, updateProjectInfo }: ProjectDetailsProps) {
  const projectProgress = useProjectProgress(project);
    const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});

  // 獲取用戶資料
  useEffect(() => {
    const loadUserProfiles = async () => {
      try {
        const allUserIds = [
          ...(project.manager || []),
          ...(project.supervisor || []),
          ...(project.safety || []),
          ...(project.quality || []),
          ...(project.reviewers || []),
        ];
        
        const uniqueUserIds = [...new Set(allUserIds)];
        if (uniqueUserIds.length === 0) return;

        const profiles = await permissionService.getAllUsers();
        const profileMap: Record<string, UserProfile> = {};
        
        profiles.forEach(profile => {
          if (uniqueUserIds.includes(profile.uid)) {
            profileMap[profile.uid] = profile;
          }
        });
        
        setUserProfiles(profileMap);
      } catch (error) {
        console.error('載入用戶資料失敗:', error);
      }
    };

    loadUserProfiles();
  }, [project]);

  // 獲取用戶顯示名稱
  const getUserDisplayName = (uid: string): string => {
    const profile = userProfiles[uid];
    return profile?.displayName || profile?.email || uid;
  };

  // 渲染用戶列表
  const renderUserList = (userIds: string[] | undefined, label: string) => {
    if (!userIds || userIds.length === 0) return null;

    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">{label}：</p>
        <div className="flex flex-wrap gap-1">
          {userIds.map(uid => (
            <Badge key={uid} variant="secondary" className="text-xs">
              {getUserDisplayName(uid)}
            </Badge>
          ))}
        </div>
      </div>
    );
  };

  // 安全的日期格式化
  const formatDate = (dateValue: string | any | undefined): string => {
    if (!dateValue) return '未設定';
    
    try {
      let date: Date;
      
      // 處理 Firestore Timestamp 對象
      if (dateValue && typeof dateValue === 'object' && dateValue.toDate) {
        date = dateValue.toDate();
      }
      // 處理 ISO 字符串或其他字符串格式
      else if (typeof dateValue === 'string') {
        date = new Date(dateValue);
      }
      // 處理數字時間戳
      else if (typeof dateValue === 'number') {
        date = new Date(dateValue);
      }
      // 處理其他情況
      else {
        date = new Date(dateValue);
      }
      
      // 檢查日期是否有效
      if (isNaN(date.getTime())) {
        console.warn('無效的日期值:', dateValue);
        return '日期格式錯誤';
      }
      
      return date.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.error('日期格式化錯誤:', error, dateValue);
      return '日期格式錯誤';
    }
  };

  return (
    <>
      {/* 專案基本資訊 */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              專案資訊
            </div>
            {onProjectUpdate && updateProjectInfo && (
              <ProjectEditDialog
                project={project}
                onProjectUpdate={onProjectUpdate}
                updateProjectInfo={updateProjectInfo}
                trigger={
                  <Button variant="outline" size="sm" className="gap-2">
                    <EditIcon className="h-4 w-4" />
                    編輯
                  </Button>
                }
              />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                建立時間：
              </p>
              <p className="text-sm text-muted-foreground ml-6">
                {formatDate(project.createdAt)}
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground flex items-center gap-2">
                <MapPinIcon className="h-4 w-4" />
                專案位置：
              </p>
              <div className="ml-6 space-y-1">
                {project.region && (
                  <p className="text-sm text-muted-foreground">
                    地區：{project.region}
                  </p>
                )}
                {project.address && (
                  <p className="text-sm text-muted-foreground">
                    地址：{project.address}
                  </p>
                )}
                {!project.region && !project.address && (
                  <p className="text-sm text-muted-foreground">未設定</p>
                )}
              </div>
            </div>
          </div>

          {project.description && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">專案描述：</p>
              <p className="text-sm text-muted-foreground">
                {project.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 專案人員資訊 */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5" />
            專案人員
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              {renderUserList(project.manager, '經理')}
              {renderUserList(project.supervisor, '監工')}
            </div>
            <div className="space-y-3">
              {renderUserList(project.safety, '公安')}
              {renderUserList(project.quality, '品管')}
            </div>
          </div>
          {renderUserList(project.reviewers, '審核者')}
          
          {!project.manager && !project.supervisor && !project.safety && !project.quality && !project.reviewers && (
            <p className="text-sm text-muted-foreground text-center">
              尚未指派專案人員
            </p>
          )}
        </CardContent>
      </Card>

      {/* 專案概覽卡片 */}
      <ProjectOverviewCards project={project} />

      {/* 專案地圖 - 只有當專案設定了地區或地址時才顯示 */}
      <SimpleProjectMap project={project} />

      {/* 天氣資訊 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CurrentWeather city={project.region} />
        <WeatherForecast city={project.region} />
      </div>

      {/* 進度條 */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">專案進度</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>整體進度</span>
              <span>{projectProgress.progressText}</span>
            </div>
            <Progress value={projectProgress.getProgressPercentage()} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </>
  );
} 