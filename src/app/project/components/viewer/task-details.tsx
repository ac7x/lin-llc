import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SquareIcon } from 'lucide-react';
import { Project, SelectedItem } from '../../types';

interface TaskDetailsProps {
  project: Project;
  selectedItem: SelectedItem;
}

/**
 * 任務詳情組件
 * 顯示任務的詳細資訊和所屬關係
 */
export function TaskDetails({ project, selectedItem }: TaskDetailsProps) {
  if (selectedItem?.type !== 'task') return null;

  const task = project.packages[selectedItem.packageIndex]?.subpackages[selectedItem.subpackageIndex]?.taskpackages[selectedItem.taskIndex];
  if (!task) return null;

  const packageName = project.packages[selectedItem.packageIndex]?.name;
  const subpackageName = project.packages[selectedItem.packageIndex]?.subpackages[selectedItem.subpackageIndex]?.name;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SquareIcon className="h-5 w-5" />
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="truncate max-w-[400px]">
                任務：{task.name}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>任務：{task.name}</p>
            </TooltipContent>
          </Tooltip>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 任務進度 */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>任務進度</span>
              <span>
                {task.completed || 0} / {task.total || 0} 
                ({task.progress || 0}%)
              </span>
            </div>
            <Progress value={task.progress || 0} className="h-2" />
          </div>

          <div>
            <h4 className="font-medium mb-2">任務詳情</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">所屬工作包：</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="truncate max-w-[200px]">{packageName}</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{packageName}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">所屬子工作包：</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="truncate max-w-[200px]">{subpackageName}</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{subpackageName}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">任務名稱：</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="truncate max-w-[200px]">{task.name}</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{task.name}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">完成數量：</span>
                <span>{task.completed || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">總數量：</span>
                <span>{task.total || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 