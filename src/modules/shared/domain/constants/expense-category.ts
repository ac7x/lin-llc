export const ExpenseCategories = {
  MATERIAL: 'material',
  LABOR: 'labor',
  EQUIPMENT: 'equipment',
  SUBCONTRACT: 'subcontract',
  TRANSPORT: 'transport',
  ADMIN: 'admin',
  SAFETY: 'safety',
  OTHER: 'other',
} as const;

export type ExpenseCategory = keyof typeof ExpenseCategories;
