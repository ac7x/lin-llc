// ============================================================================
// 專案系統樣式定義
// ============================================================================

export const projectStyles = {
  // ============================================================================
  // 頁面樣式
  // ============================================================================
  page: {
    container: 'min-h-screen bg-gray-50 dark:bg-gray-900 p-4',
    card: 'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6',
    header: 'flex justify-between items-start mb-6',
    title: 'text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent',
    subtitle: 'text-gray-600 dark:text-gray-400 mt-1',
  },

  // ============================================================================
  // 表單樣式
  // ============================================================================
  form: {
    container: 'space-y-6',
    group: 'space-y-4',
    row: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
    label: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1',
    input: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent',
    select: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent',
    textarea: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical',
    search: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent',
    date: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent',
  },

  // ============================================================================
  // 按鈕樣式
  // ============================================================================
  button: {
    primary: 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200',
    secondary: 'px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200',
    success: 'px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200',
    warning: 'px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors duration-200',
    danger: 'px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200',
    outline: 'px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200',
    small: 'px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200',
    edit: 'p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200',
  },

  // ============================================================================
  // 表格樣式
  // ============================================================================
  table: {
    container: 'overflow-x-auto',
    table: 'min-w-full divide-y divide-gray-200 dark:divide-gray-700',
    thead: 'bg-gray-50 dark:bg-gray-800',
    th: 'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
    tbody: 'bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700',
    td: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100',
    rowHover: 'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200',
  },

  // ============================================================================
  // 卡片樣式
  // ============================================================================
  card: {
    base: 'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6',
    hover: 'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow duration-200',
    stats: 'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-center',
    statsColors: {
      blue: 'border-blue-200 dark:border-blue-800',
      green: 'border-green-200 dark:border-green-800',
      yellow: 'border-yellow-200 dark:border-yellow-800',
      orange: 'border-orange-200 dark:border-orange-800',
      red: 'border-red-200 dark:border-red-800',
      pink: 'border-pink-200 dark:border-pink-800',
      indigo: 'border-indigo-200 dark:border-indigo-800',
    },
  },

  // ============================================================================
  // 進度條樣式
  // ============================================================================
  progress: {
    container: 'w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2',
    bar: 'h-2 rounded-full transition-all duration-300',
  },

  // ============================================================================
  // 載入樣式
  // ============================================================================
  loading: {
    container: 'flex items-center justify-center py-8',
    spinner: 'animate-spin rounded-full border-b-2 border-blue-500',
    spinnerSmall: 'animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500',
    spinnerWhite: 'animate-spin rounded-full h-4 w-4 border-b-2 border-white',
    spinnerGreen: 'animate-spin rounded-full h-4 w-4 border-b-2 border-green-500',
  },

  // ============================================================================
  // 模態框樣式
  // ============================================================================
  modal: {
    overlay: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4',
    container: 'bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto',
    title: 'text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4',
  },

  // ============================================================================
  // 警告樣式
  // ============================================================================
  alert: {
    success: 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3',
    error: 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3',
    info: 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3',
  },

  // ============================================================================
  // 導航樣式
  // ============================================================================
  navigation: {
    navItem: 'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200',
    navItemHover: 'hover:bg-gray-100 dark:hover:bg-gray-700',
    navItemActive: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    navItemInactive: 'text-gray-600 dark:text-gray-400',
    projectNavItem: 'flex-1 flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200',
    workPackageNavItem: 'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200',
    workPackageNavItemHover: 'hover:bg-gray-100 dark:hover:bg-gray-700',
    workPackageNavItemActive: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    workPackageNavItemInactive: 'text-gray-500 dark:text-gray-500',
    toggleButton: 'p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200',
    archiveButton: 'p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200 opacity-0 group-hover:opacity-100',
    addWorkPackageButton: 'w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors duration-200',
  },

  // ============================================================================
  // 佈局樣式
  // ============================================================================
  layout: {
    main: 'min-h-screen bg-gray-50 dark:bg-gray-900',
    pageHeader: 'flex justify-between items-start mb-6',
    pageTitle: 'text-2xl font-bold text-gray-900 dark:text-gray-100',
    pageDescription: 'text-gray-600 dark:text-gray-400 mt-1',
    filterContainer: 'mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
  },
} as const;
