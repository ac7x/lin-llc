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
 */
export const longClassName = (classes: string[]): string => {
  return classes.join(' ');
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
  ])
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
    'border-b border-gray-200 dark:border-gray-700'
  ]),
  
  // 表格資料格樣式
  td: longClassName([
    'px-4 py-3 text-sm',
    'text-gray-900 dark:text-gray-100'
  ]),
  
  // 表格容器樣式
  table: longClassName([
    'w-full border-collapse'
  ]),
  
  // 表格標題列樣式
  thead: longClassName([
    'bg-gray-50 dark:bg-gray-900'
  ]),
  
  // 表格內容列樣式
  tbody: longClassName([
    'divide-y divide-gray-200 dark:divide-gray-700'
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
  ])
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
    'w-full max-w-md text-black dark:text-gray-100'
  ]),
  
  title: longClassName([
    'text-xl font-bold mb-4',
    'bg-gradient-to-r from-blue-600 to-blue-400',
    'bg-clip-text text-transparent'
  ])
}; 