'use client';
import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { useGoogleAuth } from '@/app/(system)';
import { db } from '@/app/(system)/data/lib/firebase-init';
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
  FileIcon,
  XIcon
} from 'lucide-react';
import {
  PackageTemplate,
  SubPackageTemplate,
  TaskPackageTemplate,
  ProjectTemplate,
  TemplateType,
  TaskPackageItem,
  SubPackageItem,
  PackageItem
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
  const { user } = useGoogleAuth();
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
    taskPackages: [] as TaskPackageItem[],
    subPackages: [] as SubPackageItem[],
    packages: [] as PackageItem[],
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
      // 從 Firebase 載入任務包模板
      const taskTemplatesQuery = query(
        collection(db, 'taskPackageTemplates'),
        orderBy('createdAt', 'desc')
      );
      const taskTemplatesSnapshot = await getDocs(taskTemplatesQuery);
      const taskTemplatesData = taskTemplatesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TaskPackageTemplate[];
      setTaskTemplates(taskTemplatesData);

      // 從 Firebase 載入子工作包模板
      const subTemplatesQuery = query(
        collection(db, 'subPackageTemplates'),
        orderBy('createdAt', 'desc')
      );
      const subTemplatesSnapshot = await getDocs(subTemplatesQuery);
      const subTemplatesData = subTemplatesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SubPackageTemplate[];
      setSubTemplates(subTemplatesData);

      // 從 Firebase 載入工作包模板
      const packageTemplatesQuery = query(
        collection(db, 'packageTemplates'),
        orderBy('createdAt', 'desc')
      );
      const packageTemplatesSnapshot = await getDocs(packageTemplatesQuery);
      const packageTemplatesData = packageTemplatesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PackageTemplate[];
      setPackageTemplates(packageTemplatesData);

      // 從 Firebase 載入專案模板
      const projectTemplatesQuery = query(
        collection(db, 'projectTemplates'),
        orderBy('createdAt', 'desc')
      );
      const projectTemplatesSnapshot = await getDocs(projectTemplatesQuery);
      const projectTemplatesData = projectTemplatesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ProjectTemplate[];
      setProjectTemplates(projectTemplatesData);
    } catch (error) {
      console.error('載入模板失敗:', error);
    }
  };

  // 重置表單
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      taskPackages: [],
      subPackages: [],
      packages: [],
      selectedPackageTemplates: []
    });
    setEditingTemplate(null);
    setIsEditMode(false);
  };

  // 添加項目到當前模板
  const addItemToCurrentTemplate = () => {
    switch (activeTab) {
      case 'taskpackage':
        setFormData(prev => ({
          ...prev,
          taskPackages: [...prev.taskPackages, { name: '', defaultTotal: 1 }]
        }));
        break;
      case 'subpackage':
        setFormData(prev => ({
          ...prev,
          subPackages: [...prev.subPackages, { name: '', taskPackageTemplates: [] }]
        }));
        break;
      case 'package':
        setFormData(prev => ({
          ...prev,
          packages: [...prev.packages, { name: '', subPackageTemplates: [] }]
        }));
        break;
    }
  };

  // 刪除項目
  const removeItemFromCurrentTemplate = (index: number) => {
    switch (activeTab) {
      case 'taskpackage':
        setFormData(prev => ({
          ...prev,
          taskPackages: prev.taskPackages.filter((_, i) => i !== index)
        }));
        break;
      case 'subpackage':
        setFormData(prev => ({
          ...prev,
          subPackages: prev.subPackages.filter((_, i) => i !== index)
        }));
        break;
      case 'package':
        setFormData(prev => ({
          ...prev,
          packages: prev.packages.filter((_, i) => i !== index)
        }));
        break;
    }
  };

  // 更新項目
  const updateItem = (index: number, field: string, value: any) => {
    switch (activeTab) {
      case 'taskpackage':
        setFormData(prev => ({
          ...prev,
          taskPackages: prev.taskPackages.map((item, i) => 
            i === index ? { ...item, [field]: value } : item
          )
        }));
        break;
      case 'subpackage':
        setFormData(prev => ({
          ...prev,
          subPackages: prev.subPackages.map((item, i) => 
            i === index ? { ...item, [field]: value } : item
          )
        }));
        break;
      case 'package':
        setFormData(prev => ({
          ...prev,
          packages: prev.packages.map((item, i) => 
            i === index ? { ...item, [field]: value } : item
          )
        }));
        break;
    }
  };

  // 創建模板
  const handleCreateTemplate = async () => {
    if (!formData.name.trim() || !user) return;

    try {
      const now = new Date().toISOString();
      const newTemplate = {
        name: formData.name,
        description: formData.description,
        createdAt: now,
        createdBy: user.uid
      };

      let templateData: any = newTemplate;
      let collectionName = '';

      switch (activeTab) {
        case 'taskpackage':
          templateData = {
            ...newTemplate,
            taskPackages: formData.taskPackages
          };
          collectionName = 'taskPackageTemplates';
          break;

        case 'subpackage':
          templateData = {
            ...newTemplate,
            subPackages: formData.subPackages
          };
          collectionName = 'subPackageTemplates';
          break;

        case 'package':
          templateData = {
            ...newTemplate,
            packages: formData.packages
          };
          collectionName = 'packageTemplates';
          break;

        case 'project':
          templateData = {
            ...newTemplate,
            packageTemplates: formData.selectedPackageTemplates
          };
          collectionName = 'projectTemplates';
          break;
      }

      // 寫入到 Firebase
      const docRef = await addDoc(collection(db, collectionName), templateData);
      
      // 更新本地狀態
      const createdTemplate = { id: docRef.id, ...templateData };
      
      switch (activeTab) {
        case 'taskpackage':
          setTaskTemplates(prev => [createdTemplate as TaskPackageTemplate, ...prev]);
          break;
        case 'subpackage':
          setSubTemplates(prev => [createdTemplate as SubPackageTemplate, ...prev]);
          break;
        case 'package':
          setPackageTemplates(prev => [createdTemplate as PackageTemplate, ...prev]);
          break;
        case 'project':
          setProjectTemplates(prev => [createdTemplate as ProjectTemplate, ...prev]);
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
      taskPackages: template.taskPackages || [],
      subPackages: template.subPackages || [],
      packages: template.packages || [],
      selectedPackageTemplates: template.packageTemplates || []
    });
  };

  // 更新模板
  const handleUpdateTemplate = async () => {
    if (!editingTemplate || !formData.name.trim()) return;

    try {
      let updateData: any = {
        name: formData.name,
        description: formData.description
      };
      
      let collectionName = '';

      switch (activeTab) {
        case 'taskpackage':
          updateData.taskPackages = formData.taskPackages;
          collectionName = 'taskPackageTemplates';
          break;

        case 'subpackage':
          updateData.subPackages = formData.subPackages;
          collectionName = 'subPackageTemplates';
          break;

        case 'package':
          updateData.packages = formData.packages;
          collectionName = 'packageTemplates';
          break;

        case 'project':
          updateData.packageTemplates = formData.selectedPackageTemplates;
          collectionName = 'projectTemplates';
          break;
      }

      // 更新 Firebase 中的模板
      const templateRef = doc(db, collectionName, editingTemplate.id);
      await updateDoc(templateRef, updateData);

      // 更新本地狀態
      const updatedTemplate = {
        ...editingTemplate,
        ...updateData
      };

      switch (activeTab) {
        case 'taskpackage':
          setTaskTemplates(prev => 
            prev.map(t => t.id === editingTemplate.id ? updatedTemplate : t)
          );
          break;

        case 'subpackage':
          setSubTemplates(prev => 
            prev.map(t => t.id === editingTemplate.id ? updatedTemplate : t)
          );
          break;

        case 'package':
          setPackageTemplates(prev => 
            prev.map(t => t.id === editingTemplate.id ? updatedTemplate : t)
          );
          break;

        case 'project':
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
      let collectionName = '';

      switch (activeTab) {
        case 'taskpackage':
          collectionName = 'taskPackageTemplates';
          break;
        case 'subpackage':
          collectionName = 'subPackageTemplates';
          break;
        case 'package':
          collectionName = 'packageTemplates';
          break;
        case 'project':
          collectionName = 'projectTemplates';
          break;
      }

      // 從 Firebase 刪除模板
      const templateRef = doc(db, collectionName, templateId);
      await deleteDoc(templateRef);

      // 更新本地狀態
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

  // 切換包模板選擇
  const togglePackageTemplateSelection = (templateId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedPackageTemplates: prev.selectedPackageTemplates.includes(templateId)
        ? prev.selectedPackageTemplates.filter(id => id !== templateId)
        : [...prev.selectedPackageTemplates, templateId]
    }));
  };

  // 切換子模板選擇
  const toggleSubTemplateSelection = (itemIndex: number, templateId: string) => {
    if (activeTab === 'subpackage') {
      const item = formData.subPackages[itemIndex];
      const templates = item.taskPackageTemplates.includes(templateId)
        ? item.taskPackageTemplates.filter(id => id !== templateId)
        : [...item.taskPackageTemplates, templateId];
      
      updateItem(itemIndex, 'taskPackageTemplates', templates);
    } else if (activeTab === 'package') {
      const item = formData.packages[itemIndex];
      const templates = item.subPackageTemplates.includes(templateId)
        ? item.subPackageTemplates.filter(id => id !== templateId)
        : [...item.subPackageTemplates, templateId];
      
      updateItem(itemIndex, 'subPackageTemplates', templates);
    }
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

  // 渲染項目編輯表單
  const renderItemForm = () => {
    switch (activeTab) {
      case 'taskpackage':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>任務包項目</Label>
              <Button type="button" size="sm" onClick={addItemToCurrentTemplate}>
                <PlusIcon className="h-4 w-4 mr-1" />
                添加任務包
              </Button>
            </div>
            {formData.taskPackages.map((item, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1">
                    <Input
                      placeholder="任務包名稱"
                      value={item.name}
                      onChange={(e) => updateItem(index, 'name', e.target.value)}
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      min="1"
                      placeholder="數量"
                      value={item.defaultTotal}
                      onChange={(e) => updateItem(index, 'defaultTotal', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeItemFromCurrentTemplate(index)}
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        );

      case 'subpackage':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>子工作包項目</Label>
              <Button type="button" size="sm" onClick={addItemToCurrentTemplate}>
                <PlusIcon className="h-4 w-4 mr-1" />
                添加子工作包
              </Button>
            </div>
            {formData.subPackages.map((item, index) => (
              <Card key={index} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder="子工作包名稱"
                        value={item.name}
                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeItemFromCurrentTemplate(index)}
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  {taskTemplates.length > 0 && (
                    <div>
                      <Label className="text-sm">包含的任務包模板</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {taskTemplates.map((template) => (
                          <div key={template.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`sub-${index}-task-${template.id}`}
                              checked={item.taskPackageTemplates.includes(template.id)}
                              onChange={() => toggleSubTemplateSelection(index, template.id)}
                            />
                            <Label htmlFor={`sub-${index}-task-${template.id}`} className="text-sm">
                              {template.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        );

      case 'package':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>工作包項目</Label>
              <Button type="button" size="sm" onClick={addItemToCurrentTemplate}>
                <PlusIcon className="h-4 w-4 mr-1" />
                添加工作包
              </Button>
            </div>
            {formData.packages.map((item, index) => (
              <Card key={index} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder="工作包名稱"
                        value={item.name}
                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeItemFromCurrentTemplate(index)}
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  {subTemplates.length > 0 && (
                    <div>
                      <Label className="text-sm">包含的子工作包模板</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {subTemplates.map((template) => (
                          <div key={template.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`pkg-${index}-sub-${template.id}`}
                              checked={item.subPackageTemplates.includes(template.id)}
                              onChange={() => toggleSubTemplateSelection(index, template.id)}
                            />
                            <Label htmlFor={`pkg-${index}-sub-${template.id}`} className="text-sm">
                              {template.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        );

      default:
        return null;
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
            模板管理
          </DialogTitle>
          <DialogDescription>
            創建和管理模板
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
                        placeholder="模板名稱"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`${tabType}-description`}>描述</Label>
                    <Textarea
                      id={`${tabType}-description`}
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="模板描述"
                      rows={2}
                    />
                  </div>

                  {/* 動態項目編輯 */}
                  {tabType !== 'project' && renderItemForm()}

                  {/* 專案模板的工作包選擇 */}
                  {tabType === 'project' && packageTemplates.length > 0 && (
                    <div className="space-y-2">
                      <Label>包含的工作包模板</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {packageTemplates.map((template) => (
                          <div key={template.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`project-pkg-${template.id}`}
                              checked={formData.selectedPackageTemplates.includes(template.id)}
                              onChange={() => togglePackageTemplateSelection(template.id)}
                            />
                            <Label htmlFor={`project-pkg-${template.id}`} className="text-sm">
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
                      暫無模板
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
                    placeholder="專案名稱"
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
                        <p className="text-sm text-muted-foreground">暫無模板</p>
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
                        <p className="text-sm text-muted-foreground">暫無模板</p>
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
                        <p className="text-sm text-muted-foreground">暫無模板</p>
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