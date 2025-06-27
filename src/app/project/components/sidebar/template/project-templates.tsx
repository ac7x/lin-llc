'use client';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Building2Icon, 
  CodeIcon, 
  CalendarDaysIcon,
  HomeIcon,
  FactoryIcon,
  BookTemplateIcon,
  CheckIcon,
  SparklesIcon
} from 'lucide-react';

// 專案範本介面
interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
  structure: {
    packageCount: number;
    subpackageCount: number;
    taskCount: number;
  };
  tags: string[];
}

// 預設範本
const templates: ProjectTemplate[] = [
  {
    id: 'construction',
    name: '建築工程專案',
    description: '適用於建築施工、裝修等工程專案',
    icon: Building2Icon,
    category: '工程建設',
    structure: {
      packageCount: 5,
      subpackageCount: 3,
      taskCount: 4,
    },
    tags: ['建築', '施工', '工程'],
  },
  {
    id: 'software',
    name: '軟體開發專案',
    description: '適用於軟體開發、系統建置等技術專案',
    icon: CodeIcon,
    category: '軟體開發',
    structure: {
      packageCount: 4,
      subpackageCount: 3,
      taskCount: 5,
    },
    tags: ['開發', '軟體', '系統'],
  },
  {
    id: 'event',
    name: '活動規劃專案',
    description: '適用於活動企劃、會議籌辦等專案',
    icon: CalendarDaysIcon,
    category: '活動企劃',
    structure: {
      packageCount: 3,
      subpackageCount: 2,
      taskCount: 3,
    },
    tags: ['活動', '企劃', '會議'],
  },
  {
    id: 'renovation',
    name: '裝修改造專案',
    description: '適用於室內裝修、空間改造等專案',
    icon: HomeIcon,
    category: '裝修設計',
    structure: {
      packageCount: 4,
      subpackageCount: 2,
      taskCount: 3,
    },
    tags: ['裝修', '設計', '改造'],
  },
  {
    id: 'manufacturing',
    name: '製造生產專案',
    description: '適用於產品製造、生產流程管理等專案',
    icon: FactoryIcon,
    category: '製造生產',
    structure: {
      packageCount: 6,
      subpackageCount: 4,
      taskCount: 3,
    },
    tags: ['製造', '生產', '品質'],
  },
];

interface ProjectTemplatesProps {
  onCreateProject: (config: {
    name: string;
    createPackages: boolean;
    packageCount: number;
    createSubpackages: boolean;
    subpackageCount: number;
    createTasks: boolean;
    taskCount: number;
  }) => Promise<void>;
  loading?: boolean;
  trigger?: React.ReactNode;
}

export function ProjectTemplates({ 
  onCreateProject, 
  loading = false, 
  trigger 
}: ProjectTemplatesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [projectName, setProjectName] = useState('');
  const [step, setStep] = useState<'select' | 'confirm'>('select');

  // 重置狀態
  const resetState = () => {
    setStep('select');
    setSelectedTemplate(null);
    setProjectName('');
  };

  // 選擇範本
  const handleTemplateSelect = (template: ProjectTemplate) => {
    setSelectedTemplate(template);
    setProjectName(`${template.name} - ${new Date().toLocaleDateString()}`);
    setStep('confirm');
  };

  // 建立專案
  const handleCreateProject = async () => {
    if (!selectedTemplate) return;

    try {
      await onCreateProject({
        name: projectName,
        createPackages: true,
        packageCount: selectedTemplate.structure.packageCount,
        createSubpackages: true,
        subpackageCount: selectedTemplate.structure.subpackageCount,
        createTasks: true,
        taskCount: selectedTemplate.structure.taskCount,
      });
      
      setIsOpen(false);
      resetState();
    } catch (error) {
      console.error('建立專案失敗:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <BookTemplateIcon className="h-4 w-4" />
            專案範本
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
        {step === 'select' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <SparklesIcon className="h-5 w-5" />
                選擇專案範本
              </DialogTitle>
              <DialogDescription>
                從預設範本快速建立專案，節省設定時間
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              {templates.map((template) => (
                <Card 
                  key={template.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <template.icon className="h-4 w-4" />
                      {template.name}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {template.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs px-2 py-0">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        結構：{template.structure.packageCount} 包 × {template.structure.subpackageCount} 子包 × {template.structure.taskCount} 任務
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {step === 'confirm' && selectedTemplate && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckIcon className="h-5 w-5" />
                確認建立專案
              </DialogTitle>
              <DialogDescription>
                確認專案資訊並建立
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <selectedTemplate.icon className="h-4 w-4" />
                    {selectedTemplate.name}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {selectedTemplate.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="font-semibold text-lg">{selectedTemplate.structure.packageCount}</div>
                      <div className="text-xs text-muted-foreground">工作包</div>
                    </div>
                    <div>
                      <div className="font-semibold text-lg">{selectedTemplate.structure.subpackageCount}</div>
                      <div className="text-xs text-muted-foreground">子包/包</div>
                    </div>
                    <div>
                      <div className="font-semibold text-lg">{selectedTemplate.structure.taskCount}</div>
                      <div className="text-xs text-muted-foreground">任務/子包</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label htmlFor="project-name">專案名稱</Label>
                <Input
                  id="project-name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="輸入專案名稱..."
                />
              </div>
            </div>

            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setStep('select')}
                disabled={loading}
              >
                返回選擇
              </Button>
              <Button 
                onClick={handleCreateProject}
                disabled={loading || !projectName.trim()}
              >
                {loading ? '建立中...' : '建立專案'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
} 