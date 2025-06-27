/**
 * Sidebar 組件統一導出檔案
 * 提供 sidebar 相關的所有組件和工具函數
 * 
 * === 職責分離架構 ===
 * 1. 主要容器組件：ProjectSidebar - 整體 sidebar 容器，包含數量管理
 * 2. 樹狀渲染組件：ProjectTree - 支援傳統和虛擬化兩種模式
 * 3. 節點組件：各種 Node 組件 - 負責各自類型的節點渲染
 * 4. 虛擬化組件：各種 VirtualizedXXXItem - 專門處理虛擬化渲染
 * 5. 共享組件：對話框和工具組件
 * 6. 工具函數：純函數工具
 */

// === 主要容器組件 ===
export { ProjectSidebar } from './project-sidebar';

// === 樹狀渲染組件 ===
export { default as ProjectTree } from './tree/project-tree';

// === 傳統節點組件 ===
export { default as ProjectNode } from './tree/project-node';
export { default as ProjectPackageNode } from './tree/project-package-node';
export { default as ProjectSubpackageNode } from './tree/project-subpackage-node';
export { default as ProjectTaskpackageNode } from './tree/project-taskpackage-node';

// === 虛擬化渲染組件 ===
export { VirtualizedProjectItem } from './tree/project-node';
export { VirtualizedPackageItem } from './tree/project-package-node';
export { VirtualizedSubpackageItem } from './tree/project-subpackage-node';
export { VirtualizedTaskpackageItem } from './tree/project-taskpackage-node';

// === 共享組件 ===
export { RenameDialog } from './tree/rename-dialog';
export { TaskActionButtons } from './tree/task-action-buttons';

// === 工具函數 ===
export * from './tree/tree-utils';

// === 類型定義 ===
export * from '../../types';

// === 常數定義 ===
export * from '../../constants';