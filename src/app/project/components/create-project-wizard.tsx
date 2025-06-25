'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusIcon, PackageIcon, FolderIcon, CheckSquareIcon } from 'lucide-react';

// 表單驗證 schema
const projectFormSchema = z.object({
  name: z.string().min(1, '專案名稱不能為空'),
  createPackages: z.boolean(),
  packageCount: z.number().min(1, '包數量至少為1').max(50, '包數量不能超過50'),
});

const subpackageFormSchema = z.object({
  createSubpackages: z.enum(['no', 'yes']),
});

const taskFormSchema = z.object({
  createTasks: z.enum(['no', 'yes']),
});

type ProjectFormData = z.infer<typeof projectFormSchema>;
type SubpackageFormData = z.infer<typeof subpackageFormSchema>;
type TaskFormData = z.infer<typeof taskFormSchema>;

interface CreateProjectWizardProps {
  onCreateProject: (config: {
    name: string;
    createPackages: boolean;
    packageCount: number;
    createSubpackages: boolean;
    createTasks: boolean;
  }) => Promise<void>;
  loading?: boolean;
  trigger?: React.ReactNode;
}

/**
 * 多步驟專案建立精靈
 */
export function CreateProjectWizard({ 
  onCreateProject, 
  loading = false, 
  trigger 
}: CreateProjectWizardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'project' | 'subpackage' | 'task'>('project');
  const [projectData, setProjectData] = useState<ProjectFormData | null>(null);
  const [subpackageData, setSubpackageData] = useState<SubpackageFormData | null>(null);

  // 步驟1：專案表單
  const projectForm = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: '',
      createPackages: false,
      packageCount: 3,
    },
  });

  // 步驟2：子包表單
  const subpackageForm = useForm<SubpackageFormData>({
    resolver: zodResolver(subpackageFormSchema),
    defaultValues: {
      createSubpackages: 'no',
    },
  });

  // 步驟3：任務表單
  const taskForm = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      createTasks: 'no',
    },
  });

  // 重置所有狀態
  const resetWizard = () => {
    setStep('project');
    setProjectData(null);
    setSubpackageData(null);
    projectForm.reset();
    subpackageForm.reset();
    taskForm.reset();
  };

  // 處理步驟1提交
  const handleProjectSubmit = (data: ProjectFormData) => {
    setProjectData(data);
    
    if (data.createPackages) {
      // 有包，詢問是否建立子包
      setStep('subpackage');
    } else {
      // 沒有包，直接建立專案
      void handleFinalSubmit(data, false, false);
    }
  };

  // 處理步驟2提交
  const handleSubpackageSubmit = (data: SubpackageFormData) => {
    setSubpackageData(data);
    
    if (data.createSubpackages === 'yes') {
      // 有子包，詢問是否建立任務
      setStep('task');
    } else {
      // 沒有子包，完成建立
      void handleFinalSubmit(projectData!, false, false);
    }
  };

  // 處理步驟3提交
  const handleTaskSubmit = (data: TaskFormData) => {
    void handleFinalSubmit(
      projectData!,
      subpackageData!.createSubpackages === 'yes',
      data.createTasks === 'yes'
    );
  };

  // 最終提交
  const handleFinalSubmit = async (
    project: ProjectFormData,
    createSubpackages: boolean,
    createTasks: boolean
  ) => {
    try {
      await onCreateProject({
        name: project.name,
        createPackages: project.createPackages,
        packageCount: project.packageCount,
        createSubpackages,
        createTasks,
      });
      
      setIsOpen(false);
      resetWizard();
    } catch (error) {
      console.error('建立專案失敗:', error);
    }
  };

  const createPackagesValue = projectForm.watch('createPackages');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <PlusIcon className="h-4 w-4" />
            建立專案
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        {/* 步驟1：建立專案表單 */}
        {step === 'project' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FolderIcon className="h-5 w-5" />
                建立新專案
              </DialogTitle>
              <DialogDescription>
                設定專案基本資訊和結構
              </DialogDescription>
            </DialogHeader>

            <Form {...projectForm}>
              <form onSubmit={projectForm.handleSubmit(handleProjectSubmit)} className="space-y-6">
                <FormField
                  control={projectForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>專案名稱</FormLabel>
                      <FormControl>
                        <Input placeholder="輸入專案名稱..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <FormField
                    control={projectForm.control}
                    name="createPackages"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base flex items-center gap-2">
                            <PackageIcon className="h-4 w-4" />
                            一鍵建立包
                          </FormLabel>
                          <FormDescription className="text-sm text-muted-foreground">
                            自動建立指定數量的工作包
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {createPackagesValue && (
                    <FormField
                      control={projectForm.control}
                      name="packageCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>包數量</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={50}
                              {...field}
                              onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                                 <DialogFooter>
                   <Button type="submit" disabled={loading}>
                     {createPackagesValue ? '繼續' : '建立專案'}
                   </Button>
                 </DialogFooter>
              </form>
            </Form>
          </>
        )}

        {/* 步驟2：子包詢問 */}
        {step === 'subpackage' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PackageIcon className="h-5 w-5" />
                是否建立子包？
              </DialogTitle>
              <DialogDescription>
                為每個「包」自動建立子包
              </DialogDescription>
            </DialogHeader>

            <Form {...subpackageForm}>
              <form onSubmit={subpackageForm.handleSubmit(handleSubpackageSubmit)} className="space-y-6">
                <FormField
                  control={subpackageForm.control}
                  name="createSubpackages"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="space-y-3"
                        >
                          <div className="flex items-center space-x-3 space-y-0">
                            <RadioGroupItem value="no" />
                            <Label className="font-normal">
                              否，稍後手動新增
                            </Label>
                          </div>
                          <div className="flex items-center space-x-3 space-y-0">
                            <RadioGroupItem value="yes" />
                            <Label className="font-normal">
                              是，每個包都建立一個子包
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep('project')}>
                    返回
                  </Button>
                  <Button type="submit" disabled={loading}>
                    繼續
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}

        {/* 步驟3：任務詢問 */}
        {step === 'task' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckSquareIcon className="h-5 w-5" />
                是否建立任務？
              </DialogTitle>
              <DialogDescription>
                為每個「子包」自動建立任務
              </DialogDescription>
            </DialogHeader>

            <Form {...taskForm}>
              <form onSubmit={taskForm.handleSubmit(handleTaskSubmit)} className="space-y-6">
                <FormField
                  control={taskForm.control}
                  name="createTasks"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="space-y-3"
                        >
                          <div className="flex items-center space-x-3 space-y-0">
                            <RadioGroupItem value="no" />
                            <Label className="font-normal">
                              否，稍後手動新增
                            </Label>
                          </div>
                          <div className="flex items-center space-x-3 space-y-0">
                            <RadioGroupItem value="yes" />
                            <Label className="font-normal">
                              是，每個子包都建立一個任務
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep('subpackage')}>
                    返回
                  </Button>
                  <Button type="submit" disabled={loading}>
                    完成
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
} 