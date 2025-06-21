/**
 * ClassName 工具函數
 * 
 * 提供安全的 className 組合功能，避免 Firebase Performance 監控錯誤
 * 特別針對 Tailwind CSS v4 和長 className 字串進行優化
 */

/**
 * 安全地組合多個 className
 * 將長 className 分解為更小的部分以避免 Firebase Performance 錯誤
 */
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * 條件式 className 組合
 */
export const conditionalClass = (
  baseClass: string,
  condition: boolean,
  trueClass: string = '',
  falseClass: string = ''
): string => {
  return cn(baseClass, condition ? trueClass : falseClass);
};

/**
 * 將長 className 分解為多行模板字串
 * 避免單行過長的 className 導致 Firebase Performance 錯誤
 * 限制每個 className 片段的最大長度
 */
export const longClassName = (classes: string[]): string => {
  // 過濾掉空字串並限制每個片段的最大長度
  const filteredClasses = classes
    .filter(Boolean)
    .map(cls => {
      // 如果單個 className 超過 100 字元，進行分割
      if (cls.length > 100) {
        return cls.split(' ').join(' ');
      }
      return cls;
    });
  
  return filteredClasses.join(' ');
};

/**
 * 全域樣式組合
 */
export const globalStyles = {
  body: longClassName([
    'antialiased bg-white text-gray-900',
    'dark:bg-gray-900 dark:text-gray-100'
  ]),
  
  main: longClassName([
    'min-h-screen bg-gray-50 dark:bg-gray-800'
  ]),
  
  container: longClassName([
    'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'
  ])
};

/**
 * 常用的輸入框樣式組合
 */
export const inputStyles = {
  base: longClassName([
    'w-full px-4 py-2 rounded-lg border',
    'border-gray-300 dark:border-gray-700',
    'bg-white dark:bg-gray-900',
    'text-gray-900 dark:text-gray-100',
    'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
    'transition-colors duration-200'
  ]),
  
  // 較大的輸入框
  large: longClassName([
    'w-full px-4 py-3 rounded-lg border',
    'border-gray-300 dark:border-gray-600',
    'bg-white dark:bg-gray-700',
    'text-gray-900 dark:text-gray-100',
    'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
    'transition-colors'
  ]),
  
  // 表格輸入框
  table: longClassName([
    'border px-2 py-1 rounded w-full',
    'bg-white dark:bg-gray-900',
    'text-black dark:text-gray-100',
    'border-gray-300 dark:border-gray-700'
  ]),

  // 搜尋輸入框
  search: longClassName([
    'w-40 rounded-lg border border-gray-300 dark:border-gray-700',
    'bg-white dark:bg-gray-900 px-3 py-2 text-sm',
    'text-gray-900 dark:text-gray-100',
    'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
    'transition-colors duration-200'
  ]),

  // 日期輸入框
  date: longClassName([
    'w-full px-4 py-2 rounded-lg border',
    'border-gray-300 dark:border-gray-700',
    'bg-white dark:bg-gray-900',
    'text-gray-900 dark:text-gray-100',
    'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
    'transition-colors duration-200'
  ])
};

/**
 * 常用的按鈕樣式組合
 */
export const buttonStyles = {
  primary: longClassName([
    'inline-flex items-center px-4 py-2',
    'border border-transparent text-sm font-medium rounded-md',
    'text-white bg-blue-600 hover:bg-blue-700',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
  ]),
  
  secondary: longClassName([
    'inline-flex items-center px-4 py-2',
    'border border-transparent text-sm font-medium rounded-md',
    'text-white bg-indigo-600 hover:bg-indigo-700',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
  ]),
  
  success: longClassName([
    'inline-flex items-center px-4 py-2',
    'bg-green-600 hover:bg-green-700 text-white',
    'font-medium rounded-lg transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
  ]),
  
  danger: longClassName([
    'inline-flex items-center px-4 py-2',
    'bg-red-600 hover:bg-red-700 text-white',
    'font-medium rounded-lg transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
  ]),
  
  outline: longClassName([
    'px-4 py-2 border border-gray-300 dark:border-gray-700',
    'rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700',
    'transition-colors duration-200'
  ]),

  // 小按鈕
  small: longClassName([
    'px-3 py-2 text-sm border border-gray-300 dark:border-gray-600',
    'rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700',
    'transition-colors duration-200'
  ]),

  // 圖示按鈕
  icon: longClassName([
    'p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700',
    'transition-colors duration-200'
  ]),

  // 新增按鈕
  add: longClassName([
    'px-4 py-2 bg-blue-600 text-white rounded-lg',
    'hover:bg-blue-700 transition-colors duration-200',
    'flex items-center'
  ]),

  // 編輯按鈕
  edit: longClassName([
    'p-2 text-blue-600 hover:text-blue-700',
    'dark:text-blue-400 dark:hover:text-blue-300',
    'transition-colors duration-200'
  ]),

  // 刪除按鈕
  delete: longClassName([
    'p-2 text-red-600 hover:text-red-700',
    'dark:text-red-400 dark:hover:text-red-300',
    'transition-colors duration-200'
  ]),

  // 全螢幕按鈕
  fullscreen: longClassName([
    'p-2 rounded-lg bg-gray-100 dark:bg-gray-700',
    'hover:bg-gray-200 dark:hover:bg-gray-600',
    'text-gray-700 dark:text-gray-100',
    'border border-gray-300 dark:border-gray-600',
    'transition-colors duration-200'
  ])
};

/**
 * 載入動畫樣式組合
 */
export const loadingStyles = {
  // 標準載入動畫
  spinner: longClassName([
    'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'
  ]),

  // 小載入動畫
  spinnerSmall: longClassName([
    'animate-spin rounded-full h-4 w-4 border-b-2 border-white'
  ]),

  // 大載入動畫
  spinnerLarge: longClassName([
    'animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500'
  ]),

  // 特大載入動畫
  spinnerXLarge: longClassName([
    'animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500'
  ]),

  // 綠色載入動畫
  spinnerGreen: longClassName([
    'animate-spin rounded-full h-4 w-4 border-b-2 border-green-500'
  ]),

  // 白色載入動畫
  spinnerWhite: longClassName([
    'animate-spin rounded-full h-4 w-4 border-b-2 border-white'
  ])
};

/**
 * 狀態徽章樣式組合
 */
export const badgeStyles = {
  // 狀態徽章基礎樣式
  base: longClassName([
    'inline-flex items-center px-2.5 py-0.5 rounded-full',
    'text-xs font-medium'
  ]),

  // 成功狀態
  success: longClassName([
    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  ]),

  // 警告狀態
  warning: longClassName([
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
  ]),

  // 錯誤狀態
  error: longClassName([
    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  ]),

  // 資訊狀態
  info: longClassName([
    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
  ]),

  // 灰色狀態
  gray: longClassName([
    'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  ])
};

/**
 * 進度條樣式組合
 */
export const progressStyles = {
  // 進度條容器
  container: longClassName([
    'w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5'
  ]),

  // 進度條基礎
  bar: longClassName([
    'h-2.5 rounded-full transition-all duration-300'
  ]),

  // 進度條顏色變體
  colors: {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    red: 'bg-red-600',
    gray: 'bg-gray-600'
  }
};

/**
 * 常用的表格樣式組合
 */
export const tableStyles = {
  header: longClassName([
    'px-4 py-3 text-left text-sm font-medium',
    'text-gray-600 dark:text-gray-400',
    'border-b border-gray-200 dark:border-gray-700'
  ]),
  
  cell: longClassName([
    'px-4 py-3 text-sm',
    'text-gray-900 dark:text-gray-100'
  ]),
  
  // 表格標題樣式（解決 Firebase Performance 問題）
  th: longClassName([
    'px-4 py-3 text-left text-sm font-medium',
    'text-gray-600 dark:text-gray-400',
    'border-b border-gray-200 dark:border-gray-700',
    'whitespace-nowrap'
  ]),
  
  // 表格資料格樣式
  td: longClassName([
    'px-4 py-3 text-sm',
    'text-gray-900 dark:text-gray-100',
    'whitespace-nowrap'
  ]),
  
  // 表格容器樣式
  table: longClassName([
    'w-full border-collapse table-auto'
  ]),
  
  // 表格標題列樣式
  thead: longClassName([
    'bg-gray-50 dark:bg-gray-900'
  ]),
  
  // 表格內容列樣式
  tbody: longClassName([
    'divide-y divide-gray-200 dark:divide-gray-700'
  ]),

  // 表格行懸停樣式
  rowHover: longClassName([
    'hover:bg-gray-50 dark:hover:bg-gray-900',
    'transition-colors duration-200'
  ])
};

/**
 * 常用的卡片樣式組合
 */
export const cardStyles = {
  base: longClassName([
    'bg-white dark:bg-gray-800',
    'rounded-xl shadow-lg p-6'
  ]),
  
  hover: longClassName([
    'bg-white dark:bg-gray-700 rounded-lg shadow',
    'p-4 border border-gray-200 dark:border-gray-600',
    'hover:shadow-md transition-all duration-200'
  ]),

  // 統計卡片
  stats: longClassName([
    'p-4 rounded-lg'
  ]),

  // 統計卡片顏色變體
  statsColors: {
    blue: 'bg-blue-50 dark:bg-blue-900/20',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20',
    green: 'bg-green-50 dark:bg-green-900/20',
    orange: 'bg-orange-50 dark:bg-orange-900/20',
    red: 'bg-red-50 dark:bg-red-900/20',
    pink: 'bg-pink-50 dark:bg-pink-900/20',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20'
  }
};

/**
 * 導航相關樣式組合
 */
export const navigationStyles = {
  // 主要導航項目基礎樣式
  navItem: longClassName([
    'flex items-center px-4 py-3 rounded-lg',
    'transition-all duration-200'
  ]),
  
  // 導航項目懸停樣式
  navItemHover: longClassName([
    'hover:bg-blue-50 dark:hover:bg-gray-800'
  ]),
  
  // 導航項目激活樣式
  navItemActive: longClassName([
    'bg-blue-100 dark:bg-gray-800',
    'font-medium text-blue-600 dark:text-blue-400'
  ]),
  
  // 導航項目非激活樣式
  navItemInactive: longClassName([
    'text-gray-700 dark:text-gray-300'
  ]),
  
  // 專案導航項目基礎樣式
  projectNavItem: longClassName([
    'flex-1 min-w-0 px-4 py-3 rounded-lg',
    'transition-all duration-200'
  ]),
  
  // 工作包導航項目基礎樣式
  workpackageNavItem: longClassName([
    'block px-4 py-2 rounded-lg text-sm',
    'transition-all duration-200'
  ]),
  
  // 工作包導航項目懸停樣式
  workpackageNavItemHover: longClassName([
    'hover:bg-blue-50 dark:hover:bg-gray-800'
  ]),
  
  // 工作包導航項目激活樣式
  workpackageNavItemActive: longClassName([
    'bg-blue-100 dark:bg-gray-800',
    'font-medium text-blue-600 dark:text-blue-400'
  ]),
  
  // 工作包導航項目非激活樣式
  workpackageNavItemInactive: longClassName([
    'text-gray-600 dark:text-gray-400'
  ]),
  
  // 新增工作包按鈕樣式
  addWorkpackageButton: longClassName([
    'w-full text-left px-4 py-2 text-sm',
    'text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800',
    'rounded-lg transition-colors duration-200 flex items-center'
  ]),
  
  // 展開/收合按鈕樣式
  toggleButton: longClassName([
    'p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-800',
    'transition-colors duration-200 flex-shrink-0'
  ]),
  
  // 封存按鈕樣式
  archiveButton: longClassName([
    'ml-2 p-2 text-gray-400 hover:text-red-500',
    'opacity-0 group-hover:opacity-100',
    'transition-all duration-200 flex-shrink-0'
  ])
};

/**
 * 模態框相關樣式組合
 */
export const modalStyles = {
  overlay: longClassName([
    'fixed inset-0 bg-black/50 backdrop-blur-sm',
    'flex items-center justify-center p-4 z-50'
  ]),
  
  container: longClassName([
    'bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6',
    'w-full max-w-2xl max-h-[90vh] overflow-y-auto'
  ]),
  
  title: longClassName([
    'text-xl font-bold mb-6',
    'bg-gradient-to-r from-blue-600 to-blue-400',
    'bg-clip-text text-transparent'
  ]),

  // 小模態框
  containerSmall: longClassName([
    'bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6',
    'w-full max-w-md text-black dark:text-gray-100'
  ])
};

/**
 * 表單相關樣式組合
 */
export const formStyles = {
  // 表單組
  group: longClassName([
    'space-y-4'
  ]),

  // 表單行
  row: longClassName([
    'grid grid-cols-1 md:grid-cols-2 gap-4'
  ]),

  // 標籤
  label: longClassName([
    'block text-sm font-medium mb-1',
    'text-gray-700 dark:text-gray-300'
  ]),

  // 文字區域
  textarea: longClassName([
    'w-full px-4 py-2 rounded-lg border',
    'border-gray-300 dark:border-gray-700',
    'bg-white dark:bg-gray-900',
    'text-gray-900 dark:text-gray-100',
    'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
    'transition-colors duration-200'
  ]),

  // 選擇框
  select: longClassName([
    'w-full px-4 py-2 rounded-lg border',
    'border-gray-300 dark:border-gray-700',
    'bg-white dark:bg-gray-900',
    'text-gray-900 dark:text-gray-100',
    'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
    'transition-colors duration-200'
  ])
};

/**
 * 工具類樣式組合
 */
export const utilityStyles = {
  // 文字顏色
  textColors: {
    primary: 'text-gray-900 dark:text-gray-100',
    secondary: 'text-gray-600 dark:text-gray-400',
    muted: 'text-gray-500 dark:text-gray-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    error: 'text-red-600 dark:text-red-400',
    blue: 'text-blue-600 dark:text-blue-400'
  },

  // 背景顏色
  bgColors: {
    primary: 'bg-white dark:bg-gray-800',
    secondary: 'bg-gray-50 dark:bg-gray-900',
    muted: 'bg-gray-100 dark:bg-gray-700'
  },

  // 邊框顏色
  borderColors: {
    primary: 'border-gray-300 dark:border-gray-700',
    secondary: 'border-gray-200 dark:border-gray-600'
  },

  // 間距
  spacing: {
    section: 'mb-6',
    item: 'mb-4',
    small: 'mb-2'
  }
};

/**
 * 頁面布局樣式組合
 */
export const layoutStyles = {
  // 主容器
  main: longClassName([
    'max-w-7xl mx-auto'
  ]),

  // 頁面標題
  pageTitle: longClassName([
    'text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400',
    'bg-clip-text text-transparent'
  ]),

  // 頁面描述
  pageDescription: longClassName([
    'text-gray-600 dark:text-gray-400 mt-2'
  ]),

  // 頁面標題容器
  pageHeader: longClassName([
    'flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4'
  ]),

  // 篩選器容器
  filterContainer: longClassName([
    'bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6'
  ])
};

/**
 * 新增：狀態顏色組合
 */
export const statusColors = {
  // 專案狀態顏色
  projectStatus: {
    planning: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'in-progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'on-hold': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    completed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    archived: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
  },

  // 優先級顏色
  priority: {
    low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  },

  // 風險等級顏色
  riskLevel: {
    low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  },

  // 健康度顏色
  healthLevel: {
    excellent: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    good: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    fair: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    poor: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  },

  // 專案階段顏色
  phase: {
    initiation: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    planning: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    execution: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    monitoring: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    closure: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  },

  // 專案類型顏色
  projectType: {
    system: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    maintenance: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    transport: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
  }
};

/**
 * 新增：進度顏色組合
 */
export const progressColors = {
  // 進度條顏色
  bar: {
    high: 'bg-green-500',
    medium: 'bg-yellow-500',
    low: 'bg-orange-500',
    critical: 'bg-red-500'
  },

  // 進度文字顏色
  text: {
    high: 'text-green-600 dark:text-green-400',
    medium: 'text-yellow-600 dark:text-yellow-400',
    low: 'text-orange-600 dark:text-orange-400',
    critical: 'text-red-600 dark:text-red-400'
  }
};

/**
 * 新增：品質分數顏色組合
 */
export const qualityColors = {
  excellent: 'text-green-600 dark:text-green-400',
  good: 'text-blue-600 dark:text-blue-400',
  fair: 'text-yellow-600 dark:text-yellow-400',
  poor: 'text-orange-600 dark:text-orange-400',
  critical: 'text-red-600 dark:text-red-400'
};

/**
 * 新增：警告提示樣式組合
 */
export const alertStyles = {
  warning: longClassName([
    'bg-yellow-50 dark:bg-yellow-900/20',
    'border border-yellow-200 dark:border-yellow-800',
    'rounded-lg p-3'
  ]),
  
  info: longClassName([
    'bg-blue-50 dark:bg-blue-900/20',
    'border border-blue-200 dark:border-blue-800',
    'rounded-lg p-3'
  ]),
  
  success: longClassName([
    'bg-green-50 dark:bg-green-900/20',
    'border border-green-200 dark:border-green-800',
    'rounded-lg p-3'
  ]),
  
  error: longClassName([
    'bg-red-50 dark:bg-red-900/20',
    'border border-red-200 dark:border-red-800',
    'rounded-lg p-3'
  ])
};

/**
 * 新增：工具函數
 */

/**
 * 根據進度值獲取顏色類別
 */
export const getProgressColor = (progress: number, type: 'bar' | 'text' = 'bar') => {
  if (progress >= 80) return progressColors[type].high;
  if (progress >= 60) return progressColors[type].medium;
  if (progress >= 40) return progressColors[type].low;
  return progressColors[type].critical;
};

/**
 * 根據品質分數獲取顏色類別
 */
export const getQualityColor = (score: number) => {
  if (score >= 8) return qualityColors.excellent;
  if (score >= 6) return qualityColors.good;
  if (score >= 4) return qualityColors.fair;
  if (score >= 2) return qualityColors.poor;
  return qualityColors.critical;
};

/**
 * 根據狀態獲取徽章樣式
 */
export const getStatusBadgeStyle = (status: string, type: keyof typeof statusColors) => {
  const statusConfig = statusColors[type] as Record<string, string>;
  return cn(badgeStyles.base, statusConfig[status] || statusConfig.low || '');
}; 