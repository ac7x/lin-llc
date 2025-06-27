'use client';
import { useState } from 'react';
import * as Checkbox from '@radix-ui/react-checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  BookTemplateIcon,
  CheckIcon,
  PackageIcon,
  FolderIcon,
  CheckSquareIcon
} from 'lucide-react';

// 範本結構介面
interface TemplateStructure {
  packages: string[];     // 選中的工作包 ['A', 'B', 'C']
  subpackages: string[];  // 選中的子工作包 ['A', 'B']  
  tasks: string[];        // 選中的任務 ['A', 'B', 'C', 'D']
}

interface ProjectTemplatesProps {
  onCreateProject: (config: {
    name: string;
    createPackages: boolean;
    packageCount: number;
    createSubpackages: boolean;
    subpackageCount: number;
    createTaskpackages: boolean;
    taskpackageCount: number;
  }) => Promise<void>;
  loading?: boolean;
  trigger?: React.ReactNode;
}

const ABCD_OPTIONS = ['A', 'B', 'C', 'D'];

export function ProjectTemplates({ 
  onCreateProject, 
  loading = false, 
  trigger 
}: ProjectTemplatesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [structure, setStructure] = useState<TemplateStructure>({
    packages: [],
    subpackages: [],
    tasks: []
  });

  // 重置狀態
  const resetState = () => {
    setProjectName('');
    setStructure({
      packages: [],
      subpackages: [],
      tasks: []
    });
  };

  // 切換選項
  const toggleOption = (type: keyof TemplateStructure, option: string) => {
    setStructure(prev => ({
      ...prev,
      [type]: prev[type].includes(option)
        ? prev[type].filter(item => item !== option)
        : [...prev[type], option].sort()
    }));
  };

  // 建立專案
  const handleCreateProject = async () => {
    if (!projectName.trim()) return;

    try {
      await onCreateProject({
        name: projectName,
        createPackages: structure.packages.length > 0,
        packageCount: structure.packages.length,
        createSubpackages: structure.subpackages.length > 0,
        subpackageCount: structure.subpackages.length,
        createTaskpackages: structure.tasks.length > 0,
        taskpackageCount: structure.tasks.length,
      });
      
      setIsOpen(false);
      resetState();
    } catch (error) {
      console.error('建立專案失敗:', error);
    }
  };

  // 檢查是否可以建立專案
  const canCreateProject = projectName.trim() && (
    structure.packages.length > 0 || 
    structure.subpackages.length > 0 || 
    structure.tasks.length > 0
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <BookTemplateIcon className="h-4 w-4" />
            自訂範本
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookTemplateIcon className="h-5 w-5" />
            建立自訂專案範本
          </DialogTitle>
          <DialogDescription>
            選擇工作包、子工作包和任務的組合
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 專案名稱 */}
          <div className="space-y-2">
            <Label htmlFor="project-name">專案名稱</Label>
            <Input
              id="project-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="輸入專案名稱..."
            />
          </div>

          {/* 工作包選擇 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <PackageIcon className="h-5 w-5" />
                工作包
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-3">
                {ABCD_OPTIONS.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox.Root
                      checked={structure.packages.includes(option)}
                      onCheckedChange={() => toggleOption('packages', option)}
                      className="flex h-5 w-5 items-center justify-center rounded border border-gray-300 hover:bg-gray-50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    >
                      <Checkbox.Indicator>
                        <CheckIcon className="h-3 w-3 text-white" />
                      </Checkbox.Indicator>
                    </Checkbox.Root>
                    <Label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
              {structure.packages.length > 0 && (
                <div className="mt-3 text-sm text-muted-foreground">
                  已選：{structure.packages.join(', ')} ({structure.packages.length} 個工作包)
                </div>
              )}
            </CardContent>
          </Card>

          {/* 子工作包選擇 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FolderIcon className="h-5 w-5" />
                子工作包
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-3">
                {ABCD_OPTIONS.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox.Root
                      checked={structure.subpackages.includes(option)}
                      onCheckedChange={() => toggleOption('subpackages', option)}
                      className="flex h-5 w-5 items-center justify-center rounded border border-gray-300 hover:bg-gray-50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    >
                      <Checkbox.Indicator>
                        <CheckIcon className="h-3 w-3 text-white" />
                      </Checkbox.Indicator>
                    </Checkbox.Root>
                    <Label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
              {structure.subpackages.length > 0 && (
                <div className="mt-3 text-sm text-muted-foreground">
                  已選：{structure.subpackages.join(', ')} ({structure.subpackages.length} 個子工作包)
                </div>
              )}
            </CardContent>
          </Card>

          {/* 任務選擇 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckSquareIcon className="h-5 w-5" />
                任務
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-3">
                {ABCD_OPTIONS.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox.Root
                      checked={structure.tasks.includes(option)}
                      onCheckedChange={() => toggleOption('tasks', option)}
                      className="flex h-5 w-5 items-center justify-center rounded border border-gray-300 hover:bg-gray-50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    >
                      <Checkbox.Indicator>
                        <CheckIcon className="h-3 w-3 text-white" />
                      </Checkbox.Indicator>
                    </Checkbox.Root>
                    <Label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
              {structure.tasks.length > 0 && (
                <div className="mt-3 text-sm text-muted-foreground">
                  已選：{structure.tasks.join(', ')} ({structure.tasks.length} 個任務)
                </div>
              )}
            </CardContent>
          </Card>

          {/* 預覽 */}
          {canCreateProject && (
            <Card className="bg-muted/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">範本預覽</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>專案名稱：{projectName}</div>
                  {structure.packages.length > 0 && (
                    <div>工作包：{structure.packages.join(', ')} ({structure.packages.length} 個)</div>
                  )}
                  {structure.subpackages.length > 0 && (
                    <div>子工作包：{structure.subpackages.join(', ')} ({structure.subpackages.length} 個)</div>
                  )}
                  {structure.tasks.length > 0 && (
                    <div>任務：{structure.tasks.join(', ')} ({structure.tasks.length} 個)</div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={loading}
          >
            取消
          </Button>
          <Button 
            onClick={handleCreateProject}
            disabled={loading || !canCreateProject}
          >
            {loading ? '建立中...' : '建立專案'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 