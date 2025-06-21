// ============================================================================
// 專案驗證規則
// ============================================================================

export const PROJECT_VALIDATION_RULES = {
  projectName: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\u4e00-\u9fa5\s\-_()（）]+$/,
  },
  contractId: {
    required: false,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9\-_]+$/,
  },
  estimatedBudget: {
    required: false,
    min: 0,
    max: 999999999,
  },
  startDate: {
    required: false,
    type: 'date',
  },
  estimatedEndDate: {
    required: false,
    type: 'date',
  },
} as const;

// ============================================================================
// 工作包驗證規則
// ============================================================================

export const WORKPACKAGE_VALIDATION_RULES = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\u4e00-\u9fa5\s\-_()（）]+$/,
  },
  description: {
    required: false,
    maxLength: 500,
  },
  budget: {
    required: false,
    min: 0,
    max: 999999999,
  },
  estimatedStartDate: {
    required: false,
    type: 'date',
  },
  estimatedEndDate: {
    required: false,
    type: 'date',
  },
} as const;

// ============================================================================
// 日誌驗證規則
// ============================================================================

export const JOURNAL_VALIDATION_RULES = {
  description: {
    required: true,
    minLength: 10,
    maxLength: 1000,
  },
  weather: {
    required: true,
    maxLength: 50,
  },
  temperature: {
    required: true,
    min: -50,
    max: 60,
  },
  rainfall: {
    required: true,
    min: 0,
    max: 1000,
  },
  workforceCount: {
    required: true,
    min: 0,
    max: 1000,
  },
} as const;

// ============================================================================
// 問題追蹤驗證規則
// ============================================================================

export const ISSUE_VALIDATION_RULES = {
  description: {
    required: true,
    minLength: 10,
    maxLength: 500,
  },
  type: {
    required: true,
    enum: ['quality', 'safety', 'progress', 'other'],
  },
  severity: {
    required: true,
    enum: ['low', 'medium', 'high'],
  },
  dueDate: {
    required: true,
    type: 'date',
  },
} as const;

// ============================================================================
// 驗證錯誤訊息
// ============================================================================

export const VALIDATION_MESSAGES = {
  required: '此欄位為必填項目',
  minLength: (min: number) => `最少需要 ${min} 個字元`,
  maxLength: (max: number) => `最多只能輸入 ${max} 個字元`,
  min: (min: number) => `數值不能小於 ${min}`,
  max: (max: number) => `數值不能大於 ${max}`,
  pattern: '格式不正確',
  date: '請輸入有效的日期',
  email: '請輸入有效的電子郵件地址',
  url: '請輸入有效的網址',
  enum: (values: string[]) => `請選擇以下其中一個選項：${values.join(', ')}`,
} as const; 