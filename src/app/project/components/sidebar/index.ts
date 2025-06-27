/**
 * Sidebar 組件統一導出檔案
 * 提供 sidebar 相關的所有組件和工具函數
 * 
 * === 職責分離架構 ===
 * 1. 主要容器組件：ProjectSidebar - 整體 sidebar 容器，包含數量管理和標籤頁
 * 2. 樹狀渲染組件：ProjectTree - 支援傳統和虛擬化兩種模式的統一樹狀組件
 * 3. 節點組件：各種 Node 組件 - 負責各自類型的節點渲染（傳統模式）
 * 4. 虛擬化組件：各種 VirtualizedXXXItem - 專門處理虛擬化渲染（大量數據優化）
 * 5. 對話框組件：操作相關的彈出對話框
 * 6. 工具函數：樣式系統、樹狀數據處理、權限管理等純函數工具
 * 7. 統一樣式系統：通過 tree-styles 和 tree-utils 提供一致的視覺體驗
 */

// === 主要容器組件 ===
export { ProjectSidebar } from './project-sidebar';

// === 專案建立和範本組件 ===
export { CreateProjectWizard } from './create/project-wizard';
export { ProjectTemplates } from './template/project-templates';

// === 對話框組件 ===
export { QuantityDistributionDialog } from './dialogs/project-quantity-dialog';

// === 樹狀渲染組件 ===
export { default as ProjectTree } from './tree/project-tree';

// === 傳統節點組件（用於傳統模式的樹狀結構） ===
export { default as ProjectNode } from './tree/project-node';
export { default as ProjectPackageNode } from './tree/project-package-node';
export { default as ProjectSubpackageNode } from './tree/project-subpackage-node';
export { default as ProjectTaskpackageNode } from './tree/project-taskpackage-node';

// === 虛擬化渲染組件（用於大量數據的高性能渲染） ===
export { VirtualizedProjectItem } from './tree/project-node';
export { VirtualizedPackageItem } from './tree/project-package-node';
export { VirtualizedSubpackageItem } from './tree/project-subpackage-node';
export { VirtualizedTaskpackageItem } from './tree/project-taskpackage-node';

// === 共享 UI 組件 ===
export { RenameDialog } from './tree/rename-dialog';
export { TaskActionButtons } from './tree/task-action-buttons';

// === 工具函數和樣式系統 ===
// tree-utils 包含所有樣式函數、權限管理、狀態處理等工具
// tree-styles 的所有內容通過 tree-utils 重新導出，提供統一的樣式系統
export * from './tree/tree-utils';

// === 虛擬化數據處理 ===
// 樹狀數據扁平化、展開狀態管理、批量操作等虛擬化相關工具
export * from './tree/tree-flattener';

// === 類型定義 ===
export * from '../../types';

// === 常數定義 ===
export * from '../../constants';

// === 重要提醒 ===
/**
 * 使用指南：
 * 
 * 1. 傳統模式 vs 虛擬化模式：
 *    - 數據量 < 200 項：使用傳統模式（ProjectTree useVirtualization=false）
 *    - 數據量 >= 200 項：自動切換虛擬化模式（ProjectTree useVirtualization=true）
 * 
 * 2. 樣式一致性：
 *    - 所有組件使用統一的樣式系統（tree-styles + tree-utils）
 *    - 虛擬化和傳統模式視覺完全一致
 * 
 * 3. 性能考量：
 *    - 虛擬化模式支援上萬項目的流暢渲染
 *    - 智能展開/收起避免性能問題
 * 
 * 4. 權限管理：
 *    - 通過 tree-utils 中的權限函數統一處理
 *    - 支援細粒度的操作權限控制
 */

