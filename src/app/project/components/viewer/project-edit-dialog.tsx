'use client';

import { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { EditIcon } from 'lucide-react';
import { Project, TaiwanCity } from '../../types';
import { UserSelector, RegionSelector } from '../ui';
import { AddressSearch, type AddressInfo } from '../map';

// 表單驗證 schema
const projectEditSchema = z.object({
  name: z.string().min(1, '專案名稱不能為空'),
  description: z.string().optional(),
  manager: z.array(z.string()).optional(),
  supervisor: z.array(z.string()).optional(),
  safety: z.array(z.string()).optional(),
  quality: z.array(z.string()).optional(),
  region: z.nativeEnum(TaiwanCity).optional(),
  address: z.string().optional(),
});

type ProjectEditFormData = z.infer<typeof projectEditSchema>;

interface ProjectEditDialogProps {
  project: Project;
  onProjectUpdate: (updatedProject: Project) => void;
  trigger?: React.ReactNode;
}

/**
 * 專案編輯對話框組件
 */
export function ProjectEditDialog({ 
  project,
  onProjectUpdate,
  trigger 
}: ProjectEditDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProjectEditFormData>({
    resolver: zodResolver(projectEditSchema),
    defaultValues: {
      name: project.name,
      description: project.description || '',
      manager: project.manager || [],
      supervisor: project.supervisor || [],
      safety: project.safety || [],
      quality: project.quality || [],
      region: project.region,
      address: project.address || '',
    },
  });

  // 當專案變更時更新表單
  useEffect(() => {
    form.reset({
      name: project.name,
      description: project.description || '',
      manager: project.manager || [],
      supervisor: project.supervisor || [],
      safety: project.safety || [],
      quality: project.quality || [],
      region: project.region,
      address: project.address || '',
    });
  }, [project, form]);

  const handleSubmit = async (data: ProjectEditFormData) => {
    setIsSubmitting(true);
    
    try {
      // 創建更新的專案物件
      const updatedProject: Project = {
        ...project,
        name: data.name,
        description: data.description || '',
        manager: data.manager && data.manager.length > 0 ? data.manager : undefined,
        supervisor: data.supervisor && data.supervisor.length > 0 ? data.supervisor : undefined,
        safety: data.safety && data.safety.length > 0 ? data.safety : undefined,
        quality: data.quality && data.quality.length > 0 ? data.quality : undefined,
        region: data.region,
        address: data.address || undefined,
      };

      // 調用更新回調
      onProjectUpdate(updatedProject);
      
      setIsOpen(false);
    } catch (error) {
      console.error('更新專案失敗:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <EditIcon className="h-4 w-4" />
            編輯專案
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>編輯專案資訊</DialogTitle>
          <DialogDescription>
            修改專案的基本資訊和人員配置
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* 基本資訊 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">基本資訊</h3>
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>專案名稱 *</FormLabel>
                    <FormControl>
                      <Input placeholder="輸入專案名稱..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>專案描述</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="輸入專案描述..." 
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 位置資訊 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">位置資訊</h3>
              
              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>地區</FormLabel>
                    <FormControl>
                      <RegionSelector
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="選擇縣市地區"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>詳細地址</FormLabel>
                    <FormControl>
                      <AddressSearch
                        initialValue={field.value || ''}
                        placeholder="搜索並選擇地址..."
                        onAddressSelect={(addressInfo: AddressInfo) => {
                          field.onChange(addressInfo.formattedAddress);
                          
                          // 自動更新地區（如果未設定）
                          const currentRegion = form.getValues('region');
                          if (!currentRegion && addressInfo.addressComponents) {
                            // 從地址組件中找出縣市資訊
                            const cityComponent = addressInfo.addressComponents.find(
                              component => component.types.includes('administrative_area_level_1')
                            );
                            if (cityComponent) {
                              const cityName = cityComponent.longName;
                              // 檢查是否為有效的台灣縣市
                              if (Object.values(TaiwanCity).includes(cityName as TaiwanCity)) {
                                form.setValue('region', cityName as TaiwanCity);
                              }
                            }
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 人員配置 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">人員配置</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="manager"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>經理</FormLabel>
                      <FormControl>
                        <UserSelector
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="選擇經理"
                        />
                      </FormControl>
                      <FormDescription>
                        負責專案管理的經理
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="supervisor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>監工</FormLabel>
                      <FormControl>
                        <UserSelector
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="選擇監工"
                        />
                      </FormControl>
                      <FormDescription>
                        負責現場監督的監工
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="safety"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>公安</FormLabel>
                      <FormControl>
                        <UserSelector
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="選擇公安人員"
                        />
                      </FormControl>
                      <FormDescription>
                        負責工安管理的人員
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>品管</FormLabel>
                      <FormControl>
                        <UserSelector
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="選擇品管人員"
                        />
                      </FormControl>
                      <FormDescription>
                        負責品質管理的人員
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '儲存中...' : '儲存變更'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 