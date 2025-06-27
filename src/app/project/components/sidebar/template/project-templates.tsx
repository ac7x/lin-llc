'use client';
import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookTemplateIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  PackageIcon,
  FolderIcon,
  CheckSquareIcon,
  FileIcon
} from 'lucide-react';
import {
  PackageTemplate,
  SubPackageTemplate,
  TaskPackageTemplate,
  ProjectTemplate,
  TemplateType
} from '../../../types';

interface ProjectTemplatesProps {
  onCreateProject?: (config: {
    name: string;
    selectedTemplates: {
      packages: string[];
      subpackages: string[];
      taskpackages: string[];
    };
  }) => Promise<void>;
  onApplyTemplate?: (templateType: TemplateType, templateId: string, targetPath?: {
    projectId: string;
    packageIndex?: number;
    subpackageIndex?: number;
  }) => Promise<void>;
  loading?: boolean;
  trigger?: React.ReactNode;
}

export function ProjectTemplates({ 
  onCreateProject, 
  onApplyTemplate,
  loading = false, 
  trigger 
}: ProjectTemplatesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TemplateType>('taskpackage');
  
  // 模板狀態
  const [taskTemplates, setTaskTemplates] = useState<TaskPackageTemplate[]>([]);
  const [subTemplates, setSubTemplates] = useState<SubPackageTemplate[]>([]);
  const [packageTemplates, setPackageTemplates] = useState<PackageTemplate[]>([]);
  const [projectTemplates, setProjectTemplates] = useState<ProjectTemplate[]>([]);
  
  // 編輯狀態
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // 表單狀態
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    defaultTotal: 1,
    selectedSubTemplates: [] as string[],
    selectedTaskTemplates: [] as string[],
    selectedPackageTemplates: [] as string[]
  });

  // 專案創建狀態
  const [projectName, setProjectName] = useState('');
  const [selectedTemplates, setSelectedTemplates] = useState({
    packages: [] as string[],
    subpackages: [] as string[],
    taskpackages: [] as string[]
  });

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  // 載入所有模板
  const loadTemplates = async () => {
    try {
      // 這裡應該從 Firebase 或其他數據源載入模板
      // 暫時使用示例數據
      setTaskTemplates([
        {
          id: '1',
          name: '儲存液態丁烷',
          description: '處理液態丁烷的儲存任務',
          defaultTotal: 5,
          createdAt: new Date().toISOString(),
          createdBy: 'user1'
        },
        {
          id: '2',
          name: '組裝鋼輪',
          description: '鋼輪組裝相關任務',
          defaultTotal: 3,
          createdAt: new Date().toISOString(),
          createdBy: 'user1'
        }
      ]);
      
      setSubTemplates([
        {
          id: '1',
          name: '外殼（塑膠殼）',
          description: '塑膠外殼相關的子工作包',
          taskPackageTemplates: ['1'],
          createdAt: new Date().toISOString(),
          createdBy: 'user1'
        },
        {
          id: '2',
          name: '壓板（按鈕）',
          description: '按鈕壓板相關的子工作包',
          taskPackageTemplates: ['2'],
          createdAt: new Date().toISOString(),
          createdBy: 'user1'
        }
      ]);
      
      setPackageTemplates([
        {
          id: '1',
          name: '機械加工',
          description: '機械加工相關工作',
          subPackageTemplates: ['1'],
          createdAt: new Date().toISOString(),
          createdBy: 'user1'
        },
        {
          id: '2',
          name: '注塑成型',
          description: '注塑成型相關工作',
          subPackageTemplates: ['1', '2'],
          createdAt: new Date().toISOString(),
          createdBy: 'user1'
        },
        {
          id: '3',
          name: '組裝',
          description: '產品組裝相關工作',
          subPackageTemplates: ['2'],
          createdAt: new Date().toISOString(),
          createdBy: 'user1'
        },
        {
          id: '4',
          name: '檢測',
          description: '品質檢測相關工作',
          subPackageTemplates: [],
          createdAt: new Date().toISOString(),
          createdBy: 'user1'
        }
      ]);
    } catch (error) {
      console.error('載入模板失敗:', error);
    }
  };

  // 重置表單
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      defaultTotal: 1,
      selectedSubTemplates: [],
      selectedTaskTemplates: [],
      selectedPackageTemplates: []
    });
    setEditingTemplate(null);
    setIsEditMode(false);
  };

  // 創建模板
  const handleCreateTemplate = async () => {
    if (!formData.name.trim()) return;

    try {
      const now = new Date().toISOString();
      const newTemplate = {
        name: formData.name,
        description: formData.description,
        createdAt: now,
        createdBy: 'current-user-id' // 應該從 auth context 獲取
      };

      let templateData: any = newTemplate;

      switch (activeTab) {
        case 'taskpackage':
          templateData = {
            ...newTemplate,
            defaultTotal: formData.defaultTotal
          };
          const newTaskTemplate: TaskPackageTemplate = {
            id: Date.now().toString(),
            ...templateData
          };
          setTaskTemplates(prev => [...prev, newTaskTemplate]);
          break;

        case 'subpackage':
          templateData = {
            ...newTemplate,
            taskPackageTemplates: formData.selectedTaskTemplates
          };
          const newSubTemplate: SubPackageTemplate = {
            id: Date.now().toString(),
            ...templateData
          };
          setSubTemplates(prev => [...prev, newSubTemplate]);
          break;

        case 'package':
          templateData = {
            ...newTemplate,
            subPackageTemplates: formData.selectedSubTemplates
          };
          const newPackageTemplate: PackageTemplate = {
            id: Date.now().toString(),
            ...templateData
          };
          setPackageTemplates(prev => [...prev, newPackageTemplate]);
          break;

        case 'project':
          templateData = {
            ...newTemplate,
            packageTemplates: formData.selectedPackageTemplates
          };
          const newProjectTemplate: ProjectTemplate = {
            id: Date.now().toString(),
            ...templateData
          };
          setProjectTemplates(prev => [...prev, newProjectTemplate]);
          break;
      }

      resetForm();
    } catch (error) {
      console.error('創建模板失敗:', error);
    }
  };

  // 編輯模板
  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setIsEditMode(true);
    setFormData({
      name: template.name,
      description: template.description || '',
      defaultTotal: template.defaultTotal || 1,
      selectedSubTemplates: template.subPackageTemplates || [],
      selectedTaskTemplates: template.taskPackageTemplates || [],
      selectedPackageTemplates: template.packageTemplates || []
    });
  };

  // 更新模板
  const handleUpdateTemplate = async () => {
    if (!editingTemplate || !formData.name.trim()) return;

    try {
      const updatedTemplate = {
        ...editingTemplate,
        name: formData.name,
        description: formData.description
      };

      switch (activeTab) {
        case 'taskpackage':
          updatedTemplate.defaultTotal = formData.defaultTotal;
          setTaskTemplates(prev => 
            prev.map(t => t.id === editingTemplate.id ? updatedTemplate : t)
          );
          break;

        case 'subpackage':
          updatedTemplate.taskPackageTemplates = formData.selectedTaskTemplates;
          setSubTemplates(prev => 
            prev.map(t => t.id === editingTemplate.id ? updatedTemplate : t)
          );
          break;

        case 'package':
          updatedTemplate.subPackageTemplates = formData.selectedSubTemplates;
          setPackageTemplates(prev => 
            prev.map(t => t.id === editingTemplate.id ? updatedTemplate : t)
          );
          break;

        case 'project':
          updatedTemplate.packageTemplates = formData.selectedPackageTemplates;
          setProjectTemplates(prev => 
            prev.map(t => t.id === editingTemplate.id ? updatedTemplate : t)
          );
          break;
      }

      resetForm();
    } catch (error) {
      console.error('更新模板失敗:', error);
    }
  };

  // 刪除模板
  const handleDeleteTemplate = async (templateId: string) => {
    try {
      switch (activeTab) {
        case 'taskpackage':
          setTaskTemplates(prev => prev.filter(t => t.id !== templateId));
          break;
        case 'subpackage':
          setSubTemplates(prev => prev.filter(t => t.id !== templateId));
          break;
        case 'package':
          setPackageTemplates(prev => prev.filter(t => t.id !== templateId));
          break;
        case 'project':
          setProjectTemplates(prev => prev.filter(t => t.id !== templateId));
          break;
      }
    } catch (error) {
      console.error('刪除模板失敗:', error);
    }
  };

  // 創建專案
  const handleCreateProject = async () => {
    if (!projectName.trim() || !onCreateProject) return;

    try {
      await onCreateProject({
        name: projectName,
        selectedTemplates
      });
      
      setIsOpen(false);
      setProjectName('');
      setSelectedTemplates({
        packages: [],
        subpackages: [],
        taskpackages: []
      });
    } catch (error) {
      console.error('建立專案失敗:', error);
    }
  };

  // 應用模板
  const handleApplyTemplate = async (templateId: string) => {
    if (!onApplyTemplate) return;

    try {
      await onApplyTemplate(activeTab, templateId);
    } catch (error) {
      console.error('應用模板失敗:', error);
    }
  };

  // 切換模板選擇
  const toggleTemplateSelection = (templateId: string, type: keyof typeof selectedTemplates) => {
    setSelectedTemplates(prev => ({
      ...prev,
      [type]: prev[type].includes(templateId)
        ? prev[type].filter(id => id !== templateId)
        : [...prev[type], templateId]
    }));
  };

  // 取得當前分頁的模板清單
  const getCurrentTemplates = () => {
    switch (activeTab) {
      case 'taskpackage': return taskTemplates;
      case 'subpackage': return subTemplates;
      case 'package': return packageTemplates;
      case 'project': return projectTemplates;
      default: return [];
    }
  };

  // 取得範例名稱
  const getExampleName = (type: TemplateType) => {
    switch (type) {
      case 'taskpackage': return '儲存液態丁烷';
      case 'subpackage': return '外殼（塑膠殼）';
      case 'package': return '機械加工';
      case 'project': return '標準專案';
      default: return '';
    }
  };

  // 取得分頁標題
  const getTabTitle = (type: TemplateType) => {
    switch (type) {
      case 'taskpackage': return '任務包';
      case 'subpackage': return '子工作包';
      case 'package': return '工作包';
      case 'project': return '專案';
      default: return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <BookTemplateIcon className="h-4 w-4" />
            模板管理
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookTemplateIcon className="h-5 w-5" />
            專案模板管理系統
          </DialogTitle>
          <DialogDescription>
            創建和管理可重複使用的工作包、子工作包和任務包模板
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TemplateType)} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="taskpackage" className="flex items-center gap-2">
              <CheckSquareIcon className="h-4 w-4" />
              任務包
            </TabsTrigger>
            <TabsTrigger value="subpackage" className="flex items-center gap-2">
              <FolderIcon className="h-4 w-4" />
              子工作包
            </TabsTrigger>
            <TabsTrigger value="package" className="flex items-center gap-2">
              <PackageIcon className="h-4 w-4" />
              工作包
            </TabsTrigger>
            <TabsTrigger value="project" className="flex items-center gap-2">
              <FileIcon className="h-4 w-4" />
              專案
            </TabsTrigger>
          </TabsList>

          {(['taskpackage', 'subpackage', 'package', 'project'] as TemplateType[]).map((tabType) => (
            <TabsContent key={tabType} value={tabType} className="space-y-4">
              {/* 模板創建表單 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PlusIcon className="h-5 w-5" />
                    {isEditMode ? '編輯' : '創建'}{getTabTitle(tabType)}模板
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`${tabType}-name`}>模板名稱</Label>
                      <Input
                        id={`${tabType}-name`}
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder={`例如：${getExampleName(tabType)}`}
                      />
                    </div>
                    
                    {tabType === 'taskpackage' && (
                      <div className="space-y-2">
                        <Label htmlFor="default-total">預設工作項目數量</Label>
                        <Input
                          id="default-total"
                          type="number"
                          min="1"
                          value={formData.defaultTotal}
                          onChange={(e) => setFormData(prev => ({ ...prev, defaultTotal: parseInt(e.target.value) || 1 }))}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`${tabType}-description`}>描述</Label>
                    <Textarea
                      id={`${tabType}-description`}
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="描述此模板的用途和內容..."
                      rows={2}
                    />
                  </div>

                  {/* 子模板選擇 */}
                  {tabType === 'subpackage' && taskTemplates.length > 0 && (
                    <div className="space-y-2">
                      <Label>包含的任務包模板</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {taskTemplates.map((template) => (
                          <div key={template.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`task-${template.id}`}
                              checked={formData.selectedTaskTemplates.includes(template.id)}
                              onChange={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  selectedTaskTemplates: prev.selectedTaskTemplates.includes(template.id)
                                    ? prev.selectedTaskTemplates.filter(id => id !== template.id)
                                    : [...prev.selectedTaskTemplates, template.id]
                                }));
                              }}
                            />
                            <Label htmlFor={`task-${template.id}`} className="text-sm">
                              {template.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {tabType === 'package' && subTemplates.length > 0 && (
                    <div className="space-y-2">
                      <Label>包含的子工作包模板</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {subTemplates.map((template) => (
                          <div key={template.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`sub-${template.id}`}
                              checked={formData.selectedSubTemplates.includes(template.id)}
                              onChange={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  selectedSubTemplates: prev.selectedSubTemplates.includes(template.id)
                                    ? prev.selectedSubTemplates.filter(id => id !== template.id)
                                    : [...prev.selectedSubTemplates, template.id]
                                }));
                              }}
                            />
                            <Label htmlFor={`sub-${template.id}`} className="text-sm">
                              {template.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {tabType === 'project' && packageTemplates.length > 0 && (
                    <div className="space-y-2">
                      <Label>包含的工作包模板</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {packageTemplates.map((template) => (
                          <div key={template.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`pkg-${template.id}`}
                              checked={formData.selectedPackageTemplates.includes(template.id)}
                              onChange={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  selectedPackageTemplates: prev.selectedPackageTemplates.includes(template.id)
                                    ? prev.selectedPackageTemplates.filter(id => id !== template.id)
                                    : [...prev.selectedPackageTemplates, template.id]
                                }));
                              }}
                            />
                            <Label htmlFor={`pkg-${template.id}`} className="text-sm">
                              {template.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    {isEditMode && (
                      <Button variant="outline" onClick={resetForm}>
                        取消
                      </Button>
                    )}
                    <Button 
                      onClick={isEditMode ? handleUpdateTemplate : handleCreateTemplate}
                      disabled={!formData.name.trim() || loading}
                    >
                      {isEditMode ? '更新' : '創建'}模板
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 現有模板清單 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    現有{getTabTitle(tabType)}模板
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {getCurrentTemplates().length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      還沒有任何模板，開始創建第一個模板吧！
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {getCurrentTemplates().map((template) => (
                        <Card key={template.id} className="border">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium">{template.name}</h4>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditTemplate(template)}
                                >
                                  <EditIcon className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteTemplate(template.id)}
                                  className="text-destructive"
                                >
                                  <TrashIcon className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            {template.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {template.description}
                              </p>
                            )}
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-muted-foreground">
                                {new Date(template.createdAt).toLocaleDateString()}
                              </span>
                              <Button
                                size="sm"
                                onClick={() => handleApplyTemplate(template.id)}
                                disabled={!onApplyTemplate}
                              >
                                應用模板
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* 從模板創建專案 */}
        {onCreateProject && (
          <div className="border-t pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">從模板創建新專案</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name">專案名稱</Label>
                  <Input
                    id="project-name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="輸入新專案名稱..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 工作包模板選擇 */}
                  <div className="space-y-2">
                    <Label>選擇工作包模板</Label>
                    <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2">
                      {packageTemplates.map((template) => (
                        <div key={template.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`project-pkg-${template.id}`}
                            checked={selectedTemplates.packages.includes(template.id)}
                            onChange={() => toggleTemplateSelection(template.id, 'packages')}
                          />
                          <Label htmlFor={`project-pkg-${template.id}`} className="text-sm">
                            {template.name}
                          </Label>
                        </div>
                      ))}
                      {packageTemplates.length === 0 && (
                        <p className="text-sm text-muted-foreground">尚無工作包模板</p>
                      )}
                    </div>
                  </div>

                  {/* 子工作包模板選擇 */}
                  <div className="space-y-2">
                    <Label>選擇子工作包模板</Label>
                    <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2">
                      {subTemplates.map((template) => (
                        <div key={template.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`project-sub-${template.id}`}
                            checked={selectedTemplates.subpackages.includes(template.id)}
                            onChange={() => toggleTemplateSelection(template.id, 'subpackages')}
                          />
                          <Label htmlFor={`project-sub-${template.id}`} className="text-sm">
                            {template.name}
                          </Label>
                        </div>
                      ))}
                      {subTemplates.length === 0 && (
                        <p className="text-sm text-muted-foreground">尚無子工作包模板</p>
                      )}
                    </div>
                  </div>

                  {/* 任務包模板選擇 */}
                  <div className="space-y-2">
                    <Label>選擇任務包模板</Label>
                    <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2">
                      {taskTemplates.map((template) => (
                        <div key={template.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`project-task-${template.id}`}
                            checked={selectedTemplates.taskpackages.includes(template.id)}
                            onChange={() => toggleTemplateSelection(template.id, 'taskpackages')}
                          />
                          <Label htmlFor={`project-task-${template.id}`} className="text-sm">
                            {template.name}
                          </Label>
                        </div>
                      ))}
                      {taskTemplates.length === 0 && (
                        <p className="text-sm text-muted-foreground">尚無任務包模板</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={handleCreateProject}
                    disabled={!projectName.trim() || loading}
                  >
                    {loading ? '建立中...' : '建立專案'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex justify-end">
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={loading}
          >
            關閉
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 