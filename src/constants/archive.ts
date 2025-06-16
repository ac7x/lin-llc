export const TABLE_COLUMNS = {
  contracts: [
    { key: 'contractName', label: '合約名稱', type: 'text' },
    { key: 'contractPrice', label: '價格', type: 'number' },
  ],
  orders: [
    { key: 'orderName', label: '訂單名稱', type: 'text' },
  ],
  quotes: [
    { key: 'quoteName', label: '估價單名稱', type: 'text' },
    { key: 'quotePrice', label: '價格', type: 'number' },
  ],
  projects: [
    { key: 'projectName', label: '專案名稱', type: 'text' },
    { key: 'contractId', label: '合約ID', type: 'text' },
    { key: 'createdAt', label: '建立日期', type: 'date' },
  ],
} as const;

export const PAGE_TITLES = {
  contracts: '封存合約',
  orders: '封存訂單',
  quotes: '封存估價單',
  projects: '封存專案',
} as const;
