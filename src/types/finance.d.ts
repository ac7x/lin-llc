/**
 * 財務相關型別定義
 * 包含合約、報價單、訂單等財務相關資料結構
 * 用於管理專案中的財務文件和交易記錄
 */

import { DateField, BaseWithDates } from './common';

/**
 * 合約項目資料
 */
export interface ContractItem {
    contractItemId: string; // 項目唯一識別碼
    contractItemPrice: number; // 項目單價
    contractItemQuantity: number; // 項目數量
    contractItemWeight?: number | null; // 項目權重（可選）
}

/**
 * 報價單項目資料
 */
export interface QuoteItem {
    quoteItemId: string; // 項目唯一識別碼
    quoteItemPrice: number; // 項目單價
    quoteItemQuantity: number; // 項目數量
    quoteItemWeight?: number; // 項目權重（可選）
}

/**
 * 訂單項目資料
 */
export interface OrderItem {
    orderItemId: string; // 項目唯一識別碼
    orderItemPrice: number; // 項目單價
    orderItemQuantity: number; // 項目數量
    orderItemWeight?: number; // 項目權重（可選）
}

/**
 * 合約主體資料
 */
export interface ContractData extends BaseWithDates {
    contractId: string; // 合約唯一識別碼
    contractName: string; // 合約名稱
    contractPrice: number; // 合約總價
    contractItems: ContractItem[]; // 合約項目清單
    clientName: string; // 客戶名稱
    clientContact: string; // 客戶聯絡人
    clientPhone: string; // 客戶電話
    clientEmail: string; // 客戶 Email
    sourceType?: 'order' | 'quote'; // 來源型態（訂單或報價）
    sourceId?: string; // 來源單號
    contractContent?: string; // 合約內容
    status: 'draft' | 'issued' | 'cancelled'; // 合約狀態
    notes?: string; // 備註（可選）
    projectId?: string; // 關聯專案（可選）
    type?: '請款' | '支出'; // 合約性質（可選）
    contractNumber?: string; // 合約編號
    contractDate?: DateField; // 合約日期
    archivedAt?: DateField | null; // 封存日期
}

/**
 * 訂單主體資料
 */
export interface OrderData extends BaseWithDates {
    orderId: string; // 訂單編號
    orderName: string; // 訂單名稱
    orderPrice: number; // 訂單總價
    orderItems: OrderItem[]; // 訂單項目清單
    totalOrderItemPrice?: number; // 訂單項目總價（可選）
    clientName: string; // 客戶名稱
    clientContact: string; // 客戶聯絡人
    clientPhone: string; // 客戶電話
    clientEmail: string; // 客戶 Email
    archivedAt?: DateField | null; // 封存日期（可選）
}

/**
 * 報價單主體資料
 */
export interface QuoteData extends BaseWithDates {
    quoteId: string; // 報價單編號
    quoteName: string; // 報價單名稱
    quotePrice: number; // 報價單總價
    quoteItems: QuoteItem[]; // 報價單項目清單
    totalQuoteItemPrice?: number; // 報價單項目總價（可選）
    clientName: string; // 客戶名稱
    clientContact: string; // 客戶聯絡人
    clientPhone: string; // 客戶電話
    clientEmail: string; // 客戶 Email
    archivedAt?: DateField | null; // 封存日期 (新增)
}

export interface ExpenseItem extends BaseWithDates {
    expenseItemId: string; // 項目唯一識別碼
    description: string; // 項目描述
    quantity: number; // 項目數量
    unitPrice: number; // 單價
    amount: number; // 總金額
    workpackageId: string; // 關聯工作包 ID
    subWorkpackageId?: string; // 可選：關聯子工作包
}

export interface ExpenseData extends BaseWithDates {
    expenseId: string; // 支出編號
    expenseNumber: string; // 支出號碼
    expenseDate: DateField; // 支出日期
    clientName: string; // 客戶名稱
    clientContact: string; // 客戶聯絡人
    clientPhone: string; // 客戶電話
    clientEmail: string; // 客戶 Email
    projectId: string; // 關聯專案
    type: '請款' | '支出'; // 支出性質
    items: ExpenseItem[]; // 支出項目清單
    totalAmount: number; // 總金額
    relatedOrderId?: string; // 相關訂單編號（可選）
    relatedContractId?: string; // 相關合約編號（可選）
    status: 'draft' | 'issued' | 'cancelled'; // 支出狀態
    notes?: string; // 備註（可選）
    expenseName?: string; // 支出名稱（對應專案名稱，可選）
}
