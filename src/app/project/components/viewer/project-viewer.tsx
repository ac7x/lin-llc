import { Project, SelectedItem } from '../../types';
import { ProjectDetails } from './project-details';
import { PackageDetails } from './package-details';
import { SubpackageDetails } from './subpackage-details';
import { TaskDetails } from './task-details';

interface ProjectViewerProps {
  selectedProject: Project | null;
  selectedItem: SelectedItem;
  onProjectUpdate?: (updatedProject: Project) => void;
  updateProjectInfo?: (project: Project) => Promise<boolean>;
}

/**
 * 項目檢視器組件
 * 根據選中的項目類型顯示相應的詳情組件
 */
export function ProjectViewer({ selectedProject, selectedItem, onProjectUpdate, updateProjectInfo }: ProjectViewerProps) {
  // 如果沒有選中項目，顯示提示
  if (!selectedItem) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">請選擇一個項目</p>
      </div>
    );
  }

  // 如果沒有選中專案，但有選中項目，顯示錯誤
  if (!selectedProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500">專案資料載入錯誤</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 根據選中項目類型顯示不同內容 */}
      {selectedItem.type === 'project' && (
        <ProjectDetails 
          project={selectedProject} 
          onProjectUpdate={onProjectUpdate}
          updateProjectInfo={updateProjectInfo}
        />
      )}

      {selectedItem.type === 'package' && (
        <PackageDetails project={selectedProject} selectedItem={selectedItem} />
      )}

      {selectedItem.type === 'subpackage' && (
        <SubpackageDetails project={selectedProject} selectedItem={selectedItem} />
      )}

      {selectedItem.type === 'task' && (
        <TaskDetails 
          project={selectedProject} 
          selectedItem={selectedItem} 
          onProjectUpdate={onProjectUpdate || (() => {})}
        />
      )}
    </div>
  );
} 