import type { ContractData, OrderData, QuoteData } from './finance';
import type { Project } from './project';

// 封存資料的 Firestore 原始結構
export interface FirestoreArchiveData extends Record<string, unknown> {
  id: string;
  idx: number;
  archivedAt: { toDate: () => Date } | Date | null;
  createdAt: { toDate: () => Date } | Date | null;
  contractName?: string;
  contractPrice?: number;
  orderName?: string;
  quoteName?: string;
  quotePrice?: number;
  projectName?: string;
  contractId?: string;
}

// 基礎封存資料型別，定義所有封存項目在 UI 層共有的欄位，並確保日期為 Date 物件
export interface BaseArchiveData {
  id: string;
  idx: number;
  archivedAt: Date | null;
  createdAt: Date | null;
}

// 使用 Omit 移除原始模型中與 BaseArchiveData 衝突的日期欄位
type ContractForArchive = Omit<ContractData, 'createdAt' | 'updatedAt' | 'archivedAt'>;
type OrderForArchive = Omit<OrderData, 'createdAt' | 'updatedAt' | 'archivedAt'>;
type QuoteForArchive = Omit<QuoteData, 'createdAt' | 'updatedAt' | 'archivedAt'>;
type ProjectForArchive = Omit<Project, 'createdAt' | 'updatedAt' | 'archivedAt'>;

// 結合基礎封存資料與移除衝突欄位後的模型，建立專用於封存頁面的安全型別
export type ArchivedContract = ContractForArchive & BaseArchiveData;
export type ArchivedOrder = OrderForArchive & BaseArchiveData;
export type ArchivedQuote = QuoteForArchive & BaseArchiveData;
export type ArchivedProject = ProjectForArchive & BaseArchiveData;

// 所有可能的封存資料聯合類型
export type ArchiveData = ArchivedContract | ArchivedOrder | ArchivedQuote | ArchivedProject;

// 封存類型字串枚舉
export type ArchiveType = 'contracts' | 'orders' | 'quotes' | 'projects';
