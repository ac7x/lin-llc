/**
 * 專案樹統一樣式配置
 * 供虛擬化和傳統模式共享使用
 */

import React from 'react';
import {
  FolderIcon,
  PackageIcon,
  BookOpen,
  CheckSquareIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from 'lucide-react';

// === 類型定義 ===

/**
 * 項目信息接口
 */
export interface ItemInfo {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

/**
 * 狀態信息接口
 */
export interface StatusInfo {
  text: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}

// === 基礎尺寸 ===
export const TREE_STYLES = {
  // 項目高度
  itemHeight: 48,
  compactItemHeight: 32,
  
  // 縮排設置
  indentStep: 20,
  baseIndent: 8,
  
  // 按鈕尺寸
  toggleButtonSize: 24,
  actionButtonSize: 24,
  
  // 間距
  itemGap: 8,
  contentPadding: 8,
  
  // 邊框
  borderWidth: 2,
  
  // 動畫
  transitionDuration: '200ms',
} as const;

// === 通用樣式類名 ===
export const TREE_CLASSES = {
  // === 容器樣式 ===
  treeContainer: 'w-full',
  listContainer: 'space-y-0',
  
  // === 項目容器 ===
  itemContainer: 'flex items-center gap-2 py-2 px-2 cursor-pointer transition-colors',
  itemContainerHover: 'hover:bg-accent/50',
  
  // === 選中狀態 ===
  selectedBorder: 'border-l-2',
  unselectedBorder: 'border-l-2 border-l-transparent',
  
  // === 按鈕樣式 ===
  toggleButton: 'h-6 w-6 p-0',
  toggleButtonVariant: 'ghost',
  toggleButtonSize: 'sm',
  actionButton: 'h-6 w-6 p-0',
  actionButtonVariant: 'ghost',
  actionButtonSize: 'sm',
  
  // === 文字樣式 ===
  itemText: 'flex-1 text-sm font-medium truncate',
  itemTextWrapper: 'flex-1 min-w-0',
  itemCount: 'text-xs ml-2',
  
  // === 圖標樣式 ===
  itemIcon: 'h-4 w-4',
  statusIcon: 'h-3 w-3 mr-1',
  toggleIcon: 'h-4 w-4',
  
  // === 進度相關 ===
  progressContainer: 'flex items-center gap-2 min-w-[120px]',
  progressText: 'w-16 text-xs',
  progressBar: 'w-16 h-2',
  
  // === 數量顯示 ===
  quantityBadge: 'text-xs',
  quantityText: 'text-xs',
  
  // === 空白佔位 ===
  spacer: 'w-6',
  
  // === 工具提示 ===
  tooltipTrigger: 'cursor-pointer',
  
  // === 子菜單容器 ===
  submenuContainer: 'mx-1 border-l border-border/30',
  submenuContainerLevel1: 'mx-1 border-l border-border/30',
  submenuContainerLevel2: 'mx-1 border-l border-border/20', 
  submenuContainerLevel3: 'mx-1 border-l border-border/10',
  
  // === 摺疊容器 ===
  collapsibleGroup: 'group/collapsible',
  
  // === 輸入相關 ===
  inputContainer: 'flex gap-1',
  inputWrapper: 'pl-1 pr-1 py-1',
  addButtonWrapper: 'pl-1 pr-1 py-1 space-y-1 mt-4 border-t pt-4',
  
  // === 新增：虛擬化特定樣式 ===
  virtualizedItemContainer: 'flex items-center gap-2 py-2 px-2 cursor-pointer transition-colors',
  virtualizedBorder: 'border-l-2',
  virtualizedBorderTransparent: 'border-l-transparent',
  virtualizedToggleButton: 'h-6 w-6 p-0',
  virtualizedSpacerButton: 'w-6',
  
  // === 新增：任務操作樣式 ===
  taskActionsContainer: 'flex items-center gap-2 ml-2',
  taskButtonsGroup: 'flex gap-1',
  taskActionButton: 'h-6 w-6 p-0',
  
  // === 新增：擴展圖標樣式 ===
  actionIcon: 'h-4 w-4',
  statusIconSmall: 'h-3 w-3 mr-1',
  toggleIconStandard: 'h-4 w-4',
  
  // === 新增：Badge 和計數樣式 ===
  statusBadge: 'text-xs',
  countText: 'text-xs ml-2',
} as const;

// === 響應式樣式 ===
export const RESPONSIVE_STYLES = {
  mobile: {
    itemHeight: 40,
    itemText: 'text-xs',
    itemIcon: 'h-3 w-3',
  },
  desktop: {
    itemHeight: 48,
    itemText: 'text-sm',
    itemIcon: 'h-4 w-4',
  },
} as const;

// === 顏色主題 ===
export const TREE_COLORS = {
  project: {
    border: 'border-l-slate-600',
    selectedBg: 'bg-slate-100 border-slate-300',
    selectedText: 'text-slate-900',
    unselectedText: 'text-slate-700',
    hoverBg: 'hover:bg-slate-50',
  },
  package: {
    border: 'border-l-slate-500',
    selectedBg: 'bg-slate-100 border-slate-300',
    selectedText: 'text-slate-900',
    unselectedText: 'text-slate-700',
    hoverBg: 'hover:bg-slate-50',
  },
  subpackage: {
    border: 'border-l-slate-400',
    selectedBg: 'bg-slate-100 border-slate-300',
    selectedText: 'text-slate-900',
    unselectedText: 'text-slate-700',
    hoverBg: 'hover:bg-slate-50',
  },
  task: {
    border: 'border-l-slate-400',
    selectedBg: 'bg-slate-100 border-slate-300',
    selectedText: 'text-slate-900',
    unselectedText: 'text-slate-700',
    hoverBg: 'hover:bg-slate-50',
  },
} as const;

// === 工具函數 ===

/**
 * 獲取項目容器的完整樣式類名
 */
export function getItemContainerClasses(
  itemInfo: { bgColor: string },
  isSelected: boolean,
  borderColor: string
): string {
  return `${TREE_CLASSES.itemContainer} ${itemInfo.bgColor} ${TREE_CLASSES.selectedBorder} ${
    isSelected ? borderColor : 'border-l-transparent'
  }`;
}

/**
 * 獲取項目文字的樣式類名
 */
export function getItemTextClasses(itemColor: string): string {
  return `${TREE_CLASSES.itemText} ${itemColor}`;
}

/**
 * 獲取項目文字包裝器的樣式類名
 */
export function getItemTextWrapperClasses(): string {
  return TREE_CLASSES.itemTextWrapper;
}

/**
 * 獲取項目計數的樣式類名
 */
export function getItemCountClasses(isSelected: boolean, itemColor: string): string {
  return `${TREE_CLASSES.itemCount} ${isSelected ? itemColor : 'text-muted-foreground'}`;
}

/**
 * 獲取圖標的樣式類名
 */
export function getIconClasses(itemColor: string): string {
  return `${TREE_CLASSES.itemIcon} ${itemColor}`;
}

/**
 * 獲取切換按鈕的樣式類名
 */
export function getToggleButtonClasses(): string {
  return TREE_CLASSES.toggleButton;
}

/**
 * 獲取切換圖標的樣式類名
 */
export function getToggleIconClasses(isSelected: boolean, itemColor: string): string {
  return `${TREE_CLASSES.toggleIcon} ${isSelected ? itemColor : ''}`;
}

/**
 * 獲取操作按鈕的樣式類名
 */
export function getActionButtonClasses(): string {
  return TREE_CLASSES.actionButton;
}

/**
 * 獲取進度文字的樣式類名
 */
export function getProgressTextClasses(isSelected: boolean, itemColor: string): string {
  return `${TREE_CLASSES.progressText} ${isSelected ? itemColor : 'text-muted-foreground'}`;
}

/**
 * 獲取子菜單容器的樣式類名
 */
export function getSubmenuContainerClasses(level: number = 1): string {
  switch (level) {
    case 1:
      return TREE_CLASSES.submenuContainerLevel1;
    case 2:
      return TREE_CLASSES.submenuContainerLevel2;
    case 3:
      return TREE_CLASSES.submenuContainerLevel3;
    default:
      return TREE_CLASSES.submenuContainer;
  }
}

/**
 * 獲取摺疊組件的樣式類名
 */
export function getCollapsibleGroupClasses(): string {
  return TREE_CLASSES.collapsibleGroup;
}

/**
 * 獲取工具提示觸發器的樣式類名
 */
export function getTooltipTriggerClasses(): string {
  return TREE_CLASSES.tooltipTrigger;
}

/**
 * 獲取輸入容器的樣式類名
 */
export function getInputContainerClasses(): string {
  return TREE_CLASSES.inputContainer;
}

/**
 * 獲取輸入包裝器的樣式類名
 */
export function getInputWrapperClasses(): string {
  return TREE_CLASSES.inputWrapper;
}

/**
 * 獲取添加按鈕包裝器的樣式類名
 */
export function getAddButtonWrapperClasses(): string {
  return TREE_CLASSES.addButtonWrapper;
}

/**
 * 獲取空白佔位符的樣式類名
 */
export function getSpacerClasses(): string {
  return TREE_CLASSES.spacer;
}

/**
 * 計算縮排樣式
 */
export function calculateIndentStyle(level: number): React.CSSProperties {
  return {
    paddingLeft: `${level * TREE_STYLES.indentStep + TREE_STYLES.baseIndent}px`,
  };
}

/**
 * 獲取虛擬化項目的樣式（包含縮排）
 */
export function getVirtualizedItemStyle(
  baseStyle: React.CSSProperties,
  level: number
): React.CSSProperties {
  return {
    ...baseStyle,
    ...calculateIndentStyle(level),
  };
}

/**
 * 獲取樹狀容器的樣式類名
 */
export function getTreeContainerClasses(): string {
  return TREE_CLASSES.treeContainer;
}

/**
 * 獲取列表容器的樣式類名
 */
export function getListContainerClasses(): string {
  return TREE_CLASSES.listContainer;
}

// === 項目樣式相關函數 ===

/**
 * 獲取項目信息（圖標、顏色等）
 */
export function getItemInfo(type: string, isSelected: boolean): ItemInfo {
  const baseColors = {
    project: {
      selected: 'text-slate-900',
      unselected: 'text-slate-700',
      bg: isSelected ? 'bg-slate-100' : 'hover:bg-slate-50',
    },
    package: {
      selected: 'text-slate-900',
      unselected: 'text-slate-700',
      bg: isSelected ? 'bg-slate-100' : 'hover:bg-slate-50',
    },
    subpackage: {
      selected: 'text-slate-900',
      unselected: 'text-slate-700',
      bg: isSelected ? 'bg-slate-100' : 'hover:bg-slate-50',
    },
    task: {
      selected: 'text-slate-900',
      unselected: 'text-slate-700',
      bg: isSelected ? 'bg-slate-100' : 'hover:bg-slate-50',
    },
  };

  const config = baseColors[type as keyof typeof baseColors];
  
  return {
    icon: type === 'project' ? FolderIcon : 
          type === 'package' ? PackageIcon : 
          type === 'subpackage' ? BookOpen : 
          CheckSquareIcon,
    color: isSelected ? config.selected : config.unselected,
    bgColor: config.bg,
  };
}

/**
 * 獲取邊框顏色
 */
export function getBorderColor(type: string): string {
  const colors = {
    project: 'border-l-slate-600',
    package: 'border-l-slate-500',
    subpackage: 'border-l-slate-400',
    task: 'border-l-slate-400',
  };
  
  return colors[type as keyof typeof colors] || 'border-l-slate-300';
}

/**
 * 獲取縮排樣式
 */
export function getIndentStyle(level: number): React.CSSProperties {
  return calculateIndentStyle(level);
}