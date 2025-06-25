'use client';
import { 
  PackageIcon,
  ListIcon,
  SquareIcon,
  SquareCheckIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Project, SelectedItem, Subpackage, TaskPackage } from '@/app/project/types';

interface ProjectPackageDetailProps {
  selectedProject: Project | null;
  selectedItem: SelectedItem;
  loading: boolean;
  isItemSelected: (item: SelectedItem) => boolean;
  onItemClick: (item: SelectedItem) => void;
}

/**
 * 工作包詳細資訊組件 - 顯示工作包層級的詳細資訊
 * 包含工作包進度和子工作包列表
 */
export default function ProjectPackageDetail({
  selectedProject,
  selectedItem,
  loading,
  isItemSelected,
  onItemClick,
}: ProjectPackageDetailProps) {
  // 如果不是選中工作包或沒有專案資料，不顯示
  if (selectedItem?.type !== 'package' || !selectedProject) {
    return null;
  }

  const package_ = selectedProject.packages[selectedItem.packageIndex];
  
  if (!package_) {
    return null;
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PackageIcon className="h-5 w-5" />
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="truncate max-w-[300px]">
                工作包：{package_.name}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>工作包：{package_.name}</p>
            </TooltipContent>
          </Tooltip>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 工作包進度 */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>工作包進度</span>
              <span>
                {package_.completed || 0} / {package_.total || 0} 
                ({package_.progress || 0}%)
              </span>
            </div>
            <Progress value={package_.progress || 0} className="h-2" />
          </div>

          <div>
            <h4 className="font-medium mb-2">子工作包列表</h4>
            {package_.subpackages?.length > 0 ? (
              <div className="space-y-2">
                {package_.subpackages.map((sub: Subpackage, idx: number) => (
                  <div key={idx} className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <ListIcon className="h-4 w-4" />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="font-medium truncate max-w-[200px]">{sub.name}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{sub.name}</p>
                        </TooltipContent>
                      </Tooltip>
                      <span className="text-sm text-muted-foreground">
                        ({sub.taskpackages?.length || 0} 個任務)
                      </span>
                      <span className="text-sm text-blue-600">
                        {sub.completed || 0}/{sub.total || 0} ({sub.progress || 0}%)
                      </span>
                    </div>
                    <Progress value={sub.progress || 0} className="h-1 mb-2" />
                    {sub.taskpackages?.length > 0 && (
                      <div className="ml-6 space-y-1">
                        {sub.taskpackages.map((task: TaskPackage, taskIdx: number) => (
                          <div key={taskIdx} className="flex items-center gap-2 text-sm">
                            {isItemSelected({
                              type: 'task',
                              projectId: selectedProject.id,
                              packageIndex: selectedItem.packageIndex,
                              subpackageIndex: idx,
                              taskIndex: taskIdx
                            }) ? (
                              <SquareCheckIcon className="h-3 w-3" />
                            ) : (
                              <SquareIcon className="h-3 w-3" />
                            )}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="truncate max-w-[150px]">{task.name}</span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{task.name}</p>
                              </TooltipContent>
                            </Tooltip>
                            <span className="text-xs text-muted-foreground">
                              {task.completed || 0}/{task.total || 0}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">尚無子工作包</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
