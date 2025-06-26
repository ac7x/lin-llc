import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  PackageIcon,
  BookOpen,
  SquareIcon,
} from 'lucide-react';
import { useProjectProgress } from '../../hooks';
import { Project } from '../../types';

interface ProjectOverviewCardsProps {
  project: Project;
}

/**
 * 專案概覽卡片組件
 * 顯示專案的統計資訊：工作包數量、子工作包數量、任務數量、完成進度
 */
export function ProjectOverviewCards({ project }: ProjectOverviewCardsProps) {
  const projectProgress = useProjectProgress(project);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* 工作包數量卡片 */}
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
              <p className="text-2xl font-bold">{projectProgress.getPackageCount()}</p>
              <p className="text-sm text-muted-foreground">工作包</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 子工作包數量卡片 */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <BookOpen className="h-5 w-5 text-purple-500" />
              </TooltipTrigger>
              <TooltipContent>
                <p>子工作包數量</p>
              </TooltipContent>
            </Tooltip>
            <div>
              <p className="text-2xl font-bold">
                {projectProgress.getSubpackageCount()}
              </p>
              <p className="text-sm text-muted-foreground">子工作包</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 任務總數卡片 */}
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
                {projectProgress.getTaskCount()}
              </p>
              <p className="text-sm text-muted-foreground">任務</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 完成進度卡片 */}
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
              <p className="text-2xl font-bold">
                {projectProgress.getProgressPercentage()}%
              </p>
              <p className="text-sm text-muted-foreground">完成進度</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 