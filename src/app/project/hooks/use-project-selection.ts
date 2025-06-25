import { useState } from 'react';
import { Project, SelectedItem } from '../types';

/**
 * 專案選擇狀態管理 Hook
 * 負責管理專案和項目的選擇狀態
 */
export function useProjectSelection() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
  const [pkgInputs, setPkgInputs] = useState<Record<string, string>>({});
  const [taskPackageInputs, setTaskPackageInputs] = useState<Record<string, Record<number, string>>>({});
  const [subInputs, setSubInputs] = useState<Record<string, Record<number, Record<number, string>>>>({});

  // 檢查項目是否被選中
  const isItemSelected = (item: SelectedItem): boolean => {
    if (!selectedItem || !item) return false;
    return JSON.stringify(selectedItem) === JSON.stringify(item);
  };

  // 處理項目點擊事件
  const handleItemClick = (item: SelectedItem, projects: Project[]) => {
    setSelectedItem(item);
    // 如果是專案，同時更新選中的專案
    if (item?.type === 'project') {
      const project = projects.find(p => p.id === item.projectId);
      if (project) {
        setSelectedProject(project);
      }
    }
  };

  // 選擇專案
  const selectProject = (project: Project) => {
    setSelectedProject(project);
    // 同時設置選中的項目為該專案
    setSelectedItem({
      type: 'project',
      projectId: project.id,
    });
  };

  // 自動選擇第一個專案（當專案列表載入後）
  const autoSelectFirstProject = (projects: Project[]) => {
    if (projects.length > 0 && !selectedProject) {
      selectProject(projects[0]);
    }
  };

  // 清空工作包輸入
  const clearPackageInput = (projectId: string) => {
    setPkgInputs(prev => ({ ...prev, [projectId]: '' }));
  };

  // 清空子工作包輸入
  const clearSubpackageInput = (projectId: string, pkgIdx: number) => {
    setTaskPackageInputs(prev => ({
      ...prev,
      [projectId]: { ...prev[projectId], [pkgIdx]: '' }
    }));
  };

  // 清空任務包輸入
  const clearTaskPackageInput = (projectId: string, pkgIdx: number, subIdx: number) => {
    setSubInputs(prev => ({
      ...prev,
      [projectId]: {
        ...prev[projectId],
        [pkgIdx]: { ...prev[projectId]?.[pkgIdx], [subIdx]: '' }
      }
    }));
  };

  // 更新選中的專案資料（當專案資料變更時）
  const updateSelectedProject = (updatedProject: Project) => {
    if (selectedProject?.id === updatedProject.id) {
      setSelectedProject(updatedProject);
    }
  };

  // 重置所有選擇狀態
  const resetSelection = () => {
    setSelectedProject(null);
    setSelectedItem(null);
    setPkgInputs({});
    setTaskPackageInputs({});
    setSubInputs({});
  };

  // 檢查是否有選中的項目
  const hasSelection = selectedItem !== null;

  // 檢查是否選中了專案
  const hasSelectedProject = selectedProject !== null;

  return {
    // 狀態
    selectedProject,
    selectedItem,
    pkgInputs,
    taskPackageInputs,
    subInputs,
    
    // 狀態設置器
    setSelectedProject,
    setSelectedItem,
    setPkgInputs,
    setTaskPackageInputs,
    setSubInputs,
    
    // 操作方法
    isItemSelected,
    handleItemClick,
    selectProject,
    autoSelectFirstProject,
    updateSelectedProject,
    resetSelection,
    
    // 輸入清除方法
    clearPackageInput,
    clearSubpackageInput,
    clearTaskPackageInput,
    
    // 狀態檢查
    hasSelection,
    hasSelectedProject,
  };
} 