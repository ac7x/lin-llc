export const NOTIFICATION_TEST_PRESETS = {
  success: {
    title: '專案完成',
    message: '專案 A 已成功完成所有階段，請檢視最終報告。',
    type: 'success' as const,
    category: 'project' as const,
  },
  warning: {
    title: '排程變更',
    message: '由於天氣因素，明日工程將延後進行，請注意調整排程。',
    type: 'warning' as const,
    category: 'schedule' as const,
  },
  error: {
    title: '系統錯誤',
    message: '檔案上傳失敗，請檢查網路連線後重試。',
    type: 'error' as const,
    category: 'system' as const,
  },
  info: {
    title: '工作提醒',
    message: '今日有 3 項待辦事項需要處理，請及時完成。',
    type: 'info' as const,
    category: 'work' as const,
  },
} as const;

export const NOTIFICATION_TEST_BUTTONS = {
  success: {
    label: '成功通知',
    className: 'bg-green-100 text-green-800 hover:bg-green-200',
  },
  warning: {
    label: '警告通知',
    className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  },
  error: {
    label: '錯誤通知',
    className: 'bg-red-100 text-red-800 hover:bg-red-200',
  },
  info: {
    label: '資訊通知',
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  },
} as const;
