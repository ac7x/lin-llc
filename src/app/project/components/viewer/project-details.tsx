import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { SettingsIcon } from 'lucide-react';
import { useProjectProgress } from '../../hooks';
import { Project } from '../../types';
import { ProjectOverviewCards } from './project-overview-cards';

interface ProjectDetailsProps {
  project: Project;
}

/**
 * 專案詳情組件
 * 顯示專案的基本資訊、統計概覽和進度條
 */
export function ProjectDetails({ project }: ProjectDetailsProps) {
  const projectProgress = useProjectProgress(project);

  return (
    <>
      {/* 專案資訊 */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            專案資訊
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400">
            建立時間：{new Date(project.createdAt).toLocaleString('zh-TW')}
          </p>
        </CardContent>
      </Card>

      {/* 專案概覽卡片 */}
      <ProjectOverviewCards project={project} />

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