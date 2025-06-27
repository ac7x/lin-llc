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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusIcon, PackageIcon, FolderIcon, CheckSquareIcon } from 'lucide-react';

// 表單驗證 schema
const projectFormSchema = z.object({
  name: z.string().min(1, '專案名稱不能為空'),
  createPackages: z.boolean(),
  packageCount: z.number().min(1, '包數量至少為1').max(50, '包數量不能超過50'),
  createSubpackages: z.boolean(),
  subpackageCount: z.number().min(1, '子包數量至少為1').max(50, '子包數量不能超過50'),
  createTaskpackages: z.boolean(),
  taskpackageCount: z.number().min(1, '任務包數量至少為1').max(50, '任務包數量不能超過50'),
});

type ProjectFormData = z.infer<typeof projectFormSchema>;

interface CreateProjectWizardProps {
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

/**
 * 專案建立精靈
 */
export function CreateProjectWizard({ 
  onCreateProject, 
  loading = false, 
  trigger 
}: CreateProjectWizardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: '',
      createPackages: false,
      packageCount: 3,
      createSubpackages: false,
      subpackageCount: 2,
      createTaskpackages: false,
      taskpackageCount: 3,
    },
  });

  const createPackages = form.watch('createPackages');
  const createSubpackages = form.watch('createSubpackages');
  const createTaskpackages = form.watch('createTaskpackages');

  const handleSubmit = async (data: ProjectFormData) => {
    try {
      await onCreateProject({
        name: data.name,
        createPackages: data.createPackages,
        packageCount: data.packageCount,
        createSubpackages: data.createSubpackages && data.createPackages,
        subpackageCount: data.subpackageCount,
        createTaskpackages: data.createTaskpackages && data.createSubpackages && data.createPackages,
        taskpackageCount: data.taskpackageCount,
      });
      
      setIsOpen(false);
      form.reset();
    } catch (error) {
      console.error('建立專案失敗:', error);
    }
  };

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

      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderIcon className="h-5 w-5" />
            建立新專案
          </DialogTitle>
          <DialogDescription>
            設定專案名稱和自動建立的結構
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* 專案名稱 */}
            <FormField
              control={form.control}
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

            {/* 包設定 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <PackageIcon className="h-5 w-5" />
                  工作包設定
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="createPackages"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>自動建立工作包</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          為專案自動建立指定數量的工作包
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                {createPackages && (
                  <FormField
                    control={form.control}
                    name="packageCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>工作包數量</FormLabel>
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
              </CardContent>
            </Card>

            {/* 子包設定 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <PackageIcon className="h-5 w-5" />
                  子包設定
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="createSubpackages"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!createPackages}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className={!createPackages ? 'text-muted-foreground' : ''}>
                          自動建立子包
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          為每個工作包自動建立子包 {!createPackages && '(需先啟用工作包)'}
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                {createSubpackages && createPackages && (
                  <FormField
                    control={form.control}
                    name="subpackageCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>每個工作包的子包數量</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={20}
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            {/* 任務包設定 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckSquareIcon className="h-5 w-5" />
                  任務包設定
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="createTaskpackages"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!createSubpackages || !createPackages}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className={!createSubpackages || !createPackages ? 'text-muted-foreground' : ''}>
                          自動建立任務包
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          為每個子包自動建立任務包 {(!createSubpackages || !createPackages) && '(需先啟用子包)'}
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                {createTaskpackages && createSubpackages && createPackages && (
                  <FormField
                    control={form.control}
                    name="taskpackageCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>每個子包的任務包數量</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={10}
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? '建立中...' : '建立專案'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 