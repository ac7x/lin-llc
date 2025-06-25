'use client';
import { 
  SettingsIcon,
  PackageIcon,
  ListIcon,
  SquareIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Project, SelectedItem } from '@/app/project/types';

interface ProjectDetailProps {
  selectedProject: Project | null;
  selectedItem: SelectedItem;
  loading: boolean;
  calculateProjectProgress: (project: Project) => { completed: number; total: number; progress: number };
}

/**
 * 專案詳細資訊組件 - 顯示專案層級的詳細資訊
 * 包含專案資訊、概覽統計卡片和進度條
 */
export default function ProjectDetail({
  selectedProject,
  selectedItem,
  loading,
  calculateProjectProgress,
}: ProjectDetailProps) {
  // 如果不是選中專案或沒有專案資料，不顯示
  if (selectedItem?.type !== 'project' || !selectedProject) {
    return null;
  }

  const progress = calculateProjectProgress(selectedProject);

  return (
    <div className="space-y-6">
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
            建立時間：{new Date(selectedProject.createdAt).toLocaleString('zh-TW')}
          </p>
        </CardContent>
      </Card>

      {/* 專案概覽卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <PackageIcon className="h-5 w-5 text-blue-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>工作包數量</p>
                </TooltipContent>
              </Tooltip>
              <div>
                <p className="text-2xl font-bold">{selectedProject.packages?.length || 0}</p>
                <p className="text-sm text-muted-foreground">工作包</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <ListIcon className="h-5 w-5 text-purple-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>子工作包數量</p>
                </TooltipContent>
              </Tooltip>
              <div>
                <p className="text-2xl font-bold">
                  {selectedProject.packages?.reduce((total, pkg) => 
                    total + pkg.subpackages?.reduce((taskTotal, task) => 
                      taskTotal + task.taskpackages?.length || 0, 0
                    ), 0
                  ) || 0}
                </p>
                <p className="text-sm text-muted-foreground">子工作包</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <SquareIcon className="h-5 w-5 text-green-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>任務總數</p>
                </TooltipContent>
              </Tooltip>
              <div>
                <p className="text-2xl font-bold">
                  {selectedProject.packages?.reduce((total, pkg) => 
                    total + pkg.subpackages?.reduce((subTotal, sub) => 
                      subTotal + sub.taskpackages?.length, 0
                    ), 0
                  ) || 0}
                </p>
                <p className="text-sm text-muted-foreground">任務</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="h-5 w-5 rounded-full bg-gradient-to-r from-blue-500 to-green-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>完成進度百分比</p>
                </TooltipContent>
              </Tooltip>
              <div className="flex-1">
                <p className="text-2xl font-bold">{progress.progress}%</p>
                <p className="text-sm text-muted-foreground">完成進度</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
              <span>{progress.completed} / {progress.total} ({progress.progress}%)</span>
            </div>
            <Progress value={progress.progress} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
