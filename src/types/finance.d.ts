import { Timestamp } from 'firebase/firestore';

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
export interface ContractData {
    contractName: string; // 合約名稱
    contractPrice: number; // 合約總價
    contractItems: ContractItem[]; // 合約項目清單
    clientName: string; // 客戶名稱
    clientContact: string; // 客戶聯絡人
    clientPhone: string; // 客戶電話
    clientEmail: string; // 客戶 Email
    createdAt: Timestamp; // 建立時間
    updatedAt: Timestamp; // 更新時間
    sourceType: 'order' | 'quote'; // 來源型態（訂單或報價）
    sourceId: string; // 來源單號
    contractContent: string; // 合約內容
}

/**
 * 訂單主體資料
 */
export interface OrderData {
    orderId: string; // 訂單編號
    orderName: string; // 訂單名稱
    orderPrice: number; // 訂單總價
    orderItems: OrderItem[]; // 訂單項目清單
    totalOrderItemPrice?: number; // 訂單項目總價（可選）
    clientName: string; // 客戶名稱
    clientContact: string; // 客戶聯絡人
    clientPhone: string; // 客戶電話
    clientEmail: string; // 客戶 Email
    createdAt: Timestamp; // 建立時間
    updatedAt: Timestamp; // 更新時間
    archivedAt?: Timestamp; // 封存日期（可選）
}

/**
 * 報價單主體資料
 */
export interface QuoteData {
    quoteId: string; // 報價單編號
    quoteName: string; // 報價單名稱
    quotePrice: number; // 報價單總價
    quoteItems: QuoteItem[]; // 報價單項目清單
    totalQuoteItemPrice?: number; // 報價單項目總價（可選）
    clientName: string; // 客戶名稱
    clientContact: string; // 客戶聯絡人
    clientPhone: string; // 客戶電話
    clientEmail: string; // 客戶 Email
    createdAt: Timestamp; // 建立時間
    updatedAt: Timestamp; // 更新時間
}