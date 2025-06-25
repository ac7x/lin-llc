import { useState } from 'react';
import { usePermission } from '@/app/settings/hooks/use-permission';
import { 
  ProjectService, 
  PackageService, 
  SubpackageService, 
  TaskService 
} from '@/app/project/services';
import { calculateProjectProgress } from '@/app/project/utils';
import type { Project, SelectedItem } from '@/app/project/types';

/**
 * 專案操作 Hook - 整合所有專案相關的操作
 * 提供專案的 CRUD 操作和狀態管理
 */
export const useProjectOperations = () => {
  const { hasPermission } = usePermission();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
  const [loading, setLoading] = useState(false);
  const [showProjectInput, setShowProjectInput] = useState(false);
  const [projectInput, setProjectInput] = useState('');
  const [pkgInputs, setPkgInputs] = useState<Record<string, string>>({});
  const [taskPackageInputs, setTaskPackageInputs] = useState<Record<string, Record<number, string>>>({});
  const [subInputs, setSubInputs] = useState<Record<string, Record<number, Record<number, string>>>>({});

  // 載入專案列表
  const loadProjects = async () => {
    setLoading(true);
    try {
      const projectList = await ProjectService.loadProjects(hasPermission);
      setProjects(projectList);
      // 預設選擇第一個專案
      if (projectList.length > 0 && !selectedProject) {
        setSelectedProject(projectList[0]);
      }
    } catch (error) {
      console.error('載入專案失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 建立專案
  const handleCreateProject = async () => {
    if (!projectInput.trim()) return;
    
    setLoading(true);
    try {
      const newProject = await ProjectService.createProject(projectInput.trim(), hasPermission);
      setProjects(prev => [newProject, ...prev]);
      setProjectInput('');
      setShowProjectInput(false);
      // 自動選擇新建立的專案
      setSelectedProject(newProject);
    } catch (error) {
      console.error('建立專案失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 新增工作包
  const handleAddPackage = async (projectId: string, pkgName: string) => {
    if (!pkgName.trim()) return;
    
    setLoading(true);
    try {
      const updatedProjects = await PackageService.addPackage(projectId, pkgName, projects, hasPermission);
      setProjects(updatedProjects);
      setPkgInputs(prev => ({ ...prev, [projectId]: '' }));
      
      // 更新選中的專案
      const updatedProject = updatedProjects.find(p => p.id === projectId);
      if (updatedProject && selectedProject?.id === projectId) {
        setSelectedProject(updatedProject);
      }
    } catch (error) {
      console.error('新增工作包失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 新增子工作包
  const handleAddSubpackage = async (projectId: string, pkgIdx: number, subName: string) => {
    if (!subName.trim()) return;
    
    setLoading(true);
    try {
      const updatedProjects = await SubpackageService.addSubpackage(projectId, pkgIdx, subName, projects, hasPermission);
      setProjects(updatedProjects);
      setTaskPackageInputs(prev => ({
        ...prev,
        [projectId]: { ...prev[projectId], [pkgIdx]: '' }
      }));
      
      // 更新選中的專案
      const updatedProject = updatedProjects.find(p => p.id === projectId);
      if (updatedProject && selectedProject?.id === projectId) {
        setSelectedProject(updatedProject);
      }
    } catch (error) {
      console.error('新增子工作包失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 新增任務包
  const handleAddTaskPackage = async (projectId: string, pkgIdx: number, subIdx: number, taskPackageName: string) => {
    if (!taskPackageName.trim()) return;
    
    setLoading(true);
    try {
      const updatedProjects = await TaskService.addTaskPackage(projectId, pkgIdx, subIdx, taskPackageName, projects, hasPermission);
      setProjects(updatedProjects);
      setSubInputs(prev => ({
        ...prev,
        [projectId]: {
          ...prev[projectId],
          [pkgIdx]: { ...prev[projectId]?.[pkgIdx], [subIdx]: '' }
        }
      }));
      
      // 更新選中的專案
      const updatedProject = updatedProjects.find(p => p.id === projectId);
      if (updatedProject && selectedProject?.id === projectId) {
        setSelectedProject(updatedProject);
      }
    } catch (error) {
      console.error('新增任務包失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 檢查項目是否被選中
  const isItemSelected = (item: SelectedItem) => {
    if (!selectedItem || !item) return false;
    return JSON.stringify(selectedItem) === JSON.stringify(item);
  };

  // 處理項目點擊事件
  const handleItemClick = (item: SelectedItem) => {
    setSelectedItem(item);
    // 如果是專案，同時更新選中的專案
    if (item?.type === 'project') {
      const project = projects.find(p => p.id === item.projectId);
      if (project) {
        setSelectedProject(project);
      }
    }
  };

  // 處理建立專案按鈕點擊
  const handleAddProjectClick = () => {
    setShowProjectInput(true);
  };

  return {
    // 狀態
    projects,
    selectedProject,
    selectedItem,
    loading,
    showProjectInput,
    projectInput,
    pkgInputs,
    taskPackageInputs,
    subInputs,
    
    // 設定器
    setProjects,
    setSelectedProject,
    setSelectedItem,
    setLoading,
    setShowProjectInput,
    setProjectInput,
    setPkgInputs,
    setTaskPackageInputs,
    setSubInputs,
    
    // 操作函數
    loadProjects,
    handleCreateProject,
    handleAddPackage,
    handleAddSubpackage,
    handleAddTaskPackage,
    isItemSelected,
    handleItemClick,
    handleAddProjectClick,
    
    // 計算函數
    calculateProjectProgress: (project: Project) => calculateProjectProgress(project),
  };
}; 