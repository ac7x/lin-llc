'use client';
import { 
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
import type { Project, SelectedItem, TaskPackage } from '@/app/project/types';

interface ProjectSubpackageDetailProps {
  selectedProject: Project | null;
  selectedItem: SelectedItem;
  loading: boolean;
  isItemSelected: (item: SelectedItem) => boolean;
  onItemClick: (item: SelectedItem) => void;
}

/**
 * 子工作包詳細資訊組件 - 顯示子工作包層級的詳細資訊
 * 包含子工作包進度和任務列表
 */
export default function ProjectSubpackageDetail({
  selectedProject,
  selectedItem,
  loading,
  isItemSelected,
  onItemClick,
}: ProjectSubpackageDetailProps) {
  // 如果不是選中子工作包或沒有專案資料，不顯示
  if (selectedItem?.type !== 'subpackage' || !selectedProject) {
    return null;
  }

  const package_ = selectedProject.packages[selectedItem.packageIndex];
  const subpackage = package_?.subpackages[selectedItem.subpackageIndex];
  
  if (!package_ || !subpackage) {
    return null;
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListIcon className="h-5 w-5" />
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="truncate max-w-[400px]">
                子工作包：{package_.name} - {subpackage.name}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>子工作包：{package_.name} - {subpackage.name}</p>
            </TooltipContent>
          </Tooltip>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 子工作包進度 */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>子工作包進度</span>
              <span>
                {subpackage.completed || 0} / {subpackage.total || 0} 
                ({subpackage.progress || 0}%)
              </span>
            </div>
            <Progress value={subpackage.progress || 0} className="h-2" />
          </div>

          <div>
            <h4 className="font-medium mb-2">任務列表</h4>
            {subpackage.taskpackages?.length > 0 ? (
              <div className="space-y-2">
                {subpackage.taskpackages.map((task: TaskPackage, taskIdx: number) => (
                  <div key={taskIdx} className="p-3 border rounded">
                    <div className="flex items-center gap-2 mb-2">
                      {isItemSelected({
                        type: 'task',
                        projectId: selectedProject.id,
                        packageIndex: selectedItem.packageIndex,
                        subpackageIndex: selectedItem.subpackageIndex,
                        taskIndex: taskIdx
                      }) ? (
                        <SquareCheckIcon className="h-3 w-3" />
                      ) : (
                        <SquareIcon className="h-3 w-3" />
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="font-medium truncate max-w-[250px]">{task.name}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{task.name}</p>
                        </TooltipContent>
                      </Tooltip>
                      <span className="text-sm text-blue-600">
                        {task.completed || 0}/{task.total || 0} ({task.progress || 0}%)
                      </span>
                    </div>
                    <Progress value={task.progress || 0} className="h-1" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">尚無任務</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
