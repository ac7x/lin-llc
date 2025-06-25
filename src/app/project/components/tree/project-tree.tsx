'use client';
import { ProjectTreeProps } from '@/app/project/types';
import ProjectNode from './project-node';

/**
 * 專案樹狀組件 - 根元件，遞迴渲染整棵專案結構
 * 負責整合所有子組件並處理資料流，是整個樹狀結構的入口點
 */
export default function ProjectTree({
  project,
  selectedProject,
  selectedItem,
  onSelectProject,
  onItemClick,
  onAddPackage,
  onAddTaskPackage,
  onAddSubpackage,
  pkgInputs,
  setPkgInputs,
  taskPackageInputs,
  setTaskPackageInputs,
  subInputs,
  setSubInputs,
  loading,
  isItemSelected,
}: ProjectTreeProps) {
  return (
    <ProjectNode
      project={project}
      selectedProject={selectedProject}
      selectedItem={selectedItem}
      onSelectProject={onSelectProject}
      onItemClick={onItemClick}
      onAddPackage={onAddPackage}
      onAddSubpackage={onAddSubpackage}
      onAddTaskPackage={onAddTaskPackage}
      loading={loading}
      isItemSelected={isItemSelected}
      pkgInputs={pkgInputs}
      setPkgInputs={setPkgInputs}
      taskPackageInputs={taskPackageInputs}
      setTaskPackageInputs={setTaskPackageInputs}
      subInputs={subInputs}
      setSubInputs={setSubInputs}
    />
  );
}
