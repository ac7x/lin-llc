/**
 * Sidebar 組件統一導出檔案
 * 提供 sidebar 相關的所有組件和工具函數
 */

// 主要 Sidebar 組件
export { ProjectSidebar } from './project-sidebar';

// 樹狀組件導出 - 容器組件
export { default as ProjectTree } from './tree/project-tree';

// 樹狀組件導出 - 節點組件 (支援職責分離)
export { default as ProjectNode } from './tree/project-node';
export { default as ProjectPackageNode } from './tree/project-package-node';
export { default as ProjectSubpackageNode } from './tree/project-subpackage-node';
export { default as ProjectTaskpackageNode } from './tree/project-taskpackage-node';

// 虛擬化支持組件 - 已整合到 ProjectTree 中
// VirtualizedTreeNode 已被整合到 ProjectTree 中，不再需要單獨導出

// 共享組件導出
export { RenameDialog } from './tree/rename-dialog';
export { TaskActionButtons } from './tree/task-action-buttons';

// 工具函數導出
export * from './tree/tree-utils';

// 類型導出 - 重新導出統一類型定義
export * from '../../types';

// 常數導出 - 重新導出統一常數定義
export * from '../../constants';