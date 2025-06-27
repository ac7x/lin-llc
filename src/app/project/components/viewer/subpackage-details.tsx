import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ListIcon, SquareIcon } from 'lucide-react';
import { Project, SelectedItem } from '../../types';

interface SubpackageDetailsProps {
  project: Project;
  selectedItem: SelectedItem;
}

/**
 * 子工作包詳情組件
 * 顯示子工作包的詳細資訊和任務列表
 */
export function SubpackageDetails({ project, selectedItem }: SubpackageDetailsProps) {
  if (selectedItem?.type !== 'subpackage') return null;

  const subpackage = project.packages[selectedItem.packageIndex]?.subpackages[selectedItem.subpackageIndex];
  if (!subpackage) return null;

  const packageName = project.packages[selectedItem.packageIndex]?.name;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListIcon className="h-5 w-5" />
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="truncate max-w-[400px]">
                子工作包：{packageName} - {subpackage.name}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>子工作包：{packageName} - {subpackage.name}</p>
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
                {subpackage.taskpackages.map((task, idx) => (
                  <div key={idx} className="p-3 border rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <SquareIcon className="h-3 w-3" />
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