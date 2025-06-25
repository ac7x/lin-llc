import { Project, Package, Subpackage, TaskPackage } from '../types';

/**
 * 扁平化項目類型
 */
export type FlatItemType = 'project' | 'package' | 'subpackage' | 'task';

/**
 * 扁平化項目介面
 */
export interface FlatItem {
  id: string;                    // 唯一標識符
  type: FlatItemType;           // 項目類型
  data: Project | Package | Subpackage | TaskPackage; // 原始數據
  level: number;                // 層級深度 (0=專案, 1=包, 2=子包, 3=任務)
  parentId?: string;            // 父級ID
  projectId: string;            // 專案ID
  packageIndex?: number;        // 包索引
  subpackageIndex?: number;     // 子包索引
  taskIndex?: number;           // 任務索引
  hasChildren: boolean;         // 是否有子項目
  isExpanded: boolean;          // 是否展開
  isVisible: boolean;           // 是否可見
}

/**
 * 展開狀態管理
 */
export class ExpandedState {
  private expandedIds = new Set<string>();

  toggle(id: string): void {
    if (this.expandedIds.has(id)) {
      this.expandedIds.delete(id);
    } else {
      this.expandedIds.add(id);
    }
  }

  isExpanded(id: string): boolean {
    return this.expandedIds.has(id);
  }

  expand(id: string): void {
    this.expandedIds.add(id);
  }

  collapse(id: string): void {
    this.expandedIds.delete(id);
  }

  expandAll(ids: string[]): void {
    ids.forEach(id => this.expandedIds.add(id));
  }

  collapseAll(): void {
    this.expandedIds.clear();
  }

  getExpandedIds(): string[] {
    return Array.from(this.expandedIds);
  }
}

/**
 * 樹狀數據扁平化器
 */
export class TreeFlattener {
  private expandedState: ExpandedState;

  constructor(expandedState: ExpandedState) {
    this.expandedState = expandedState;
  }

  /**
   * 將專案數據扁平化為一維數組
   * @param project 專案數據
   * @param searchTerm 搜索關鍵字
   * @returns 扁平化的項目列表
   */
  flattenProject(project: Project, searchTerm?: string): FlatItem[] {
    const items: FlatItem[] = [];
    
    // 專案根節點
    const projectItem: FlatItem = {
      id: `project-${project.id}`,
      type: 'project',
      data: project,
      level: 0,
      projectId: project.id,
      hasChildren: project.packages.length > 0,
      isExpanded: this.expandedState.isExpanded(`project-${project.id}`),
      isVisible: this.matchesSearch(project.name, searchTerm),
    };
    
    items.push(projectItem);

    // 只有展開時才處理子項目
    if (projectItem.isExpanded && project.packages.length > 0) {
      project.packages.forEach((pkg, packageIndex) => {
        const packageItems = this.flattenPackage(
          pkg, 
          project.id, 
          packageIndex, 
          searchTerm
        );
        items.push(...packageItems);
      });
    }

    return this.filterVisible(items, searchTerm);
  }

  /**
   * 扁平化工作包
   */
  private flattenPackage(
    pkg: Package, 
    projectId: string, 
    packageIndex: number, 
    searchTerm?: string
  ): FlatItem[] {
    const items: FlatItem[] = [];
    const packageId = `package-${projectId}-${packageIndex}`;

    const packageItem: FlatItem = {
      id: packageId,
      type: 'package',
      data: pkg,
      level: 1,
      parentId: `project-${projectId}`,
      projectId,
      packageIndex,
      hasChildren: pkg.subpackages.length > 0,
      isExpanded: this.expandedState.isExpanded(packageId),
      isVisible: this.matchesSearch(pkg.name, searchTerm),
    };

    items.push(packageItem);

    if (packageItem.isExpanded && pkg.subpackages.length > 0) {
      pkg.subpackages.forEach((subpkg, subpackageIndex) => {
        const subpackageItems = this.flattenSubpackage(
          subpkg,
          projectId,
          packageIndex,
          subpackageIndex,
          searchTerm
        );
        items.push(...subpackageItems);
      });
    }

    return items;
  }

  /**
   * 扁平化子工作包
   */
  private flattenSubpackage(
    subpkg: Subpackage,
    projectId: string,
    packageIndex: number,
    subpackageIndex: number,
    searchTerm?: string
  ): FlatItem[] {
    const items: FlatItem[] = [];
    const subpackageId = `subpackage-${projectId}-${packageIndex}-${subpackageIndex}`;

    const subpackageItem: FlatItem = {
      id: subpackageId,
      type: 'subpackage',
      data: subpkg,
      level: 2,
      parentId: `package-${projectId}-${packageIndex}`,
      projectId,
      packageIndex,
      subpackageIndex,
      hasChildren: subpkg.taskpackages.length > 0,
      isExpanded: this.expandedState.isExpanded(subpackageId),
      isVisible: this.matchesSearch(subpkg.name, searchTerm),
    };

    items.push(subpackageItem);

    if (subpackageItem.isExpanded && subpkg.taskpackages.length > 0) {
      subpkg.taskpackages.forEach((task, taskIndex) => {
        const taskItem = this.flattenTask(
          task,
          projectId,
          packageIndex,
          subpackageIndex,
          taskIndex,
          searchTerm
        );
        items.push(taskItem);
      });
    }

    return items;
  }

  /**
   * 扁平化任務包
   */
  private flattenTask(
    task: TaskPackage,
    projectId: string,
    packageIndex: number,
    subpackageIndex: number,
    taskIndex: number,
    searchTerm?: string
  ): FlatItem {
    const taskId = `task-${projectId}-${packageIndex}-${subpackageIndex}-${taskIndex}`;

    return {
      id: taskId,
      type: 'task',
      data: task,
      level: 3,
      parentId: `subpackage-${projectId}-${packageIndex}-${subpackageIndex}`,
      projectId,
      packageIndex,
      subpackageIndex,
      taskIndex,
      hasChildren: false,
      isExpanded: false,
      isVisible: this.matchesSearch(task.name, searchTerm),
    };
  }

  /**
   * 搜索匹配
   */
  private matchesSearch(text: string, searchTerm?: string): boolean {
    if (!searchTerm) return true;
    return text.toLowerCase().includes(searchTerm.toLowerCase());
  }

  /**
   * 過濾可見項目
   */
  private filterVisible(items: FlatItem[], searchTerm?: string): FlatItem[] {
    if (!searchTerm) return items;

    const visibleItems: FlatItem[] = [];
    
    for (const item of items) {
      // 如果項目本身匹配搜索
      if (item.isVisible) {
        visibleItems.push(item);
        continue;
      }

      // 如果子項目匹配搜索，則父項目也應該可見
      const hasMatchingChildren = this.hasMatchingDescendants(item, items, searchTerm);
      if (hasMatchingChildren) {
        visibleItems.push({ ...item, isVisible: true });
      }
    }

    return visibleItems;
  }

  /**
   * 檢查是否有匹配的後代項目
   */
  private hasMatchingDescendants(
    parent: FlatItem, 
    allItems: FlatItem[], 
    searchTerm: string
  ): boolean {
    return allItems.some(item => 
      item.parentId === parent.id && 
      (item.isVisible || this.hasMatchingDescendants(item, allItems, searchTerm))
    );
  }
}

/**
 * 批量操作工具
 */
export class TreeBatchOperations {
  /**
   * 批量展開到指定層級
   */
  static expandToLevel(
    expandedState: ExpandedState, 
    items: FlatItem[], 
    maxLevel: number
  ): void {
    const idsToExpand = items
      .filter(item => item.level < maxLevel && item.hasChildren)
      .map(item => item.id);
    
    expandedState.expandAll(idsToExpand);
  }

  /**
   * 智能展開 - 只展開有限數量的節點以避免性能問題
   */
  static smartExpand(
    expandedState: ExpandedState,
    items: FlatItem[],
    maxNodes: number = 500
  ): void {
    let expandedCount = 0;
    
    // 按層級順序展開
    for (let level = 0; level < 4 && expandedCount < maxNodes; level++) {
      const levelItems = items.filter(item => 
        item.level === level && item.hasChildren
      );
      
      for (const item of levelItems) {
        if (expandedCount >= maxNodes) break;
        expandedState.expand(item.id);
        expandedCount++;
      }
    }
  }

  /**
   * 計算統計信息
   */
  static calculateStats(items: FlatItem[]): {
    total: number;
    byType: Record<FlatItemType, number>;
    byLevel: Record<number, number>;
    expanded: number;
  } {
    const stats = {
      total: items.length,
      byType: { project: 0, package: 0, subpackage: 0, task: 0 } as Record<FlatItemType, number>,
      byLevel: {} as Record<number, number>,
      expanded: 0,
    };

    items.forEach(item => {
      stats.byType[item.type]++;
      stats.byLevel[item.level] = (stats.byLevel[item.level] || 0) + 1;
      if (item.isExpanded) stats.expanded++;
    });

    return stats;
  }
} 