"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth, useCollection } from '@/hooks/useAuth';
import Link from "next/link";
import { useParams } from "next/navigation";

// 定義封存類型
type ArchiveType = 'contracts' | 'invoices' | 'orders' | 'quotes' | 'projects';

// 定義欄位值類型
type ColumnValue = string | number | Date | null;

// 定義基礎資料型別
interface BaseArchiveData {
    id: string;
    idx: number;
    archivedAt: Date | null;
    createdAt: Date | null;
}

// 定義各類型的特定欄位
interface ContractData extends BaseArchiveData {
    contractName: string;
    contractPrice: number;
}

interface InvoiceData extends BaseArchiveData {
    invoiceName: string;
    totalAmount: number;
}

interface OrderData extends BaseArchiveData {
    orderName: string;
}

interface QuoteData extends BaseArchiveData {
    quoteName: string;
    quotePrice: number;
}

interface ProjectData extends BaseArchiveData {
    projectName: string;
    contractId: string;
}

// 定義所有可能的封存資料類型
type ArchiveData = ContractData | InvoiceData | OrderData | QuoteData | ProjectData;

// 定義 Firestore 原始資料型別
interface FirestoreData {
    id: string;
    idx: number;
    archivedAt: { toDate: () => Date } | Date | null;
    createdAt: { toDate: () => Date } | Date | null;
    contractName?: string;
    contractPrice?: number;
    invoiceName?: string;
    totalAmount?: number;
    orderName?: string;
    quoteName?: string;
    quotePrice?: number;
    projectName?: string;
    contractId?: string;
    [key: string]: unknown;
}

// 定義表格欄位配置
const TABLE_COLUMNS = {
    contracts: [
        { key: 'contractName', label: '合約名稱', type: 'text' },
        { key: 'contractPrice', label: '價格', type: 'number' },
    ],
    invoices: [
        { key: 'invoiceName', label: '發票名稱', type: 'text' },
        { key: 'totalAmount', label: '金額', type: 'number' },
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

// 定義頁面標題
const PAGE_TITLES = {
    contracts: '封存合約',
    invoices: '封存發票',
    orders: '封存訂單',
    quotes: '封存估價單',
    projects: '封存專案',
} as const;

// 定義欄位值格式化函數
const formatColumnValue = (value: ColumnValue, type: 'text' | 'number' | 'date'): string => {
    if (value == null) return '-';
    
    switch (type) {
        case 'date':
            return value instanceof Date ? value.toLocaleDateString() : '-';
        case 'number':
            return typeof value === 'number' ? value.toLocaleString() : '-';
        default:
            return String(value);
    }
};

// 型別守衛函數
function isContractData(data: ArchiveData): data is ContractData {
    return 'contractName' in data && 'contractPrice' in data;
}

function isInvoiceData(data: ArchiveData): data is InvoiceData {
    return 'invoiceName' in data && 'totalAmount' in data;
}

function isOrderData(data: ArchiveData): data is OrderData {
    return 'orderName' in data;
}

function isQuoteData(data: ArchiveData): data is QuoteData {
    return 'quoteName' in data && 'quotePrice' in data;
}

function isProjectData(data: ArchiveData): data is ProjectData {
    return 'projectName' in data && 'contractId' in data;
}

// 處理 Firestore 日期
function processFirestoreDate(date: { toDate: () => Date } | Date | null): Date | null {
    if (!date) return null;
    if (date instanceof Date) return date;
    if (typeof date.toDate === 'function') return date.toDate();
    return null;
}

// 根據類型獲取特定資料
function getTypedData(data: FirestoreData, type: ArchiveType): ArchiveData {
    const baseData = {
        id: data.id,
        idx: data.idx,
        archivedAt: processFirestoreDate(data.archivedAt),
        createdAt: processFirestoreDate(data.createdAt),
    };

    switch (type) {
        case 'contracts':
            if (typeof data.contractName !== 'string' || typeof data.contractPrice !== 'number') {
                throw new Error('Invalid contract data structure');
            }
            return { ...baseData, contractName: data.contractName, contractPrice: data.contractPrice } as ContractData;
        case 'invoices':
            if (typeof data.invoiceName !== 'string' || typeof data.totalAmount !== 'number') {
                throw new Error('Invalid invoice data structure');
            }
            return { ...baseData, invoiceName: data.invoiceName, totalAmount: data.totalAmount } as InvoiceData;
        case 'orders':
            if (typeof data.orderName !== 'string') {
                throw new Error('Invalid order data structure');
            }
            return { ...baseData, orderName: data.orderName } as OrderData;
        case 'quotes':
            if (typeof data.quoteName !== 'string' || typeof data.quotePrice !== 'number') {
                throw new Error('Invalid quote data structure');
            }
            return { ...baseData, quoteName: data.quoteName, quotePrice: data.quotePrice } as QuoteData;
        case 'projects':
            if (typeof data.projectName !== 'string' || typeof data.contractId !== 'string') {
                throw new Error('Invalid project data structure');
            }
            return { ...baseData, projectName: data.projectName, contractId: data.contractId } as ProjectData;
        default:
            throw new Error(`Unknown archive type: ${type}`);
    }
}

// 驗證資料完整性
function validateData(data: ArchiveData, type: ArchiveType): boolean {
    switch (type) {
        case 'contracts':
            return isContractData(data);
        case 'invoices':
            return isInvoiceData(data);
        case 'orders':
            return isOrderData(data);
        case 'quotes':
            return isQuoteData(data);
        case 'projects':
            return isProjectData(data);
        default:
            return false;
    }
}

export default function ArchivePage() {
    const { type } = useParams<{ type: ArchiveType }>();
    const { db, collection, doc, getDoc } = useAuth();
    const [archiveRetentionDays, setArchiveRetentionDays] = useState<number>(3650);
    const [search, setSearch] = useState("");

    // 獲取封存保留天數
    useEffect(() => {
        async function fetchRetentionDays() {
            const docRef = doc(db, 'settings', 'archive');
            const snapshot = await getDoc(docRef);
            if (snapshot.exists()) {
                const data = snapshot.data();
                setArchiveRetentionDays(typeof data.retentionDays === 'number' ? data.retentionDays : 3650);
            }
        }
        fetchRetentionDays();
    }, [db, doc, getDoc]);

    // 獲取封存資料
    const [dataSnapshot, loading, error] = useCollection(
        collection(db, `archived/default/${type}`)
    );

    // 處理資料
    const rows = useMemo(() => {
        if (!dataSnapshot) return [];
        let arr = dataSnapshot.docs.map((doc, idx) => {
            try {
                const data = { ...doc.data(), id: doc.id, idx: idx + 1 } as FirestoreData;
                const typedData = getTypedData(data, type);
                
                // 驗證資料完整性
                if (!validateData(typedData, type)) {
                    console.warn(`Invalid data structure for type ${type}:`, data);
                    return null;
                }
                
                return typedData;
            } catch (err) {
                console.error(`Error processing document ${doc.id}:`, err);
                return null;
            }
        }).filter((data): data is ArchiveData => data !== null);

        // 搜尋過濾
        if (search.trim()) {
            const s = search.trim().toLowerCase();
            arr = arr.filter(r => 
                Object.values(r).some(val => 
                    String(val).toLowerCase().includes(s)
                )
            );
        }

        return arr;
    }, [dataSnapshot, search, type]);

    // 渲染表格內容
    const renderTableContent = () => {
        if (loading) {
            return <tr><td colSpan={TABLE_COLUMNS[type].length + 2} className="text-center py-4 dark:text-gray-300">載入中...</td></tr>;
        }
        if (error) {
            return <tr><td colSpan={TABLE_COLUMNS[type].length + 2} className="text-center text-red-500 py-4 dark:text-red-400">{String(error)}</td></tr>;
        }
        if (rows.length === 0) {
            return <tr><td colSpan={TABLE_COLUMNS[type].length + 2} className="text-center text-gray-400 py-4 dark:text-gray-500">尚無封存資料</td></tr>;
        }

        return rows.map((row) => (
            <tr key={row.id}>
                <td className="border px-2 py-1 text-center dark:border-gray-700 dark:text-gray-100">{row.idx}</td>
                {TABLE_COLUMNS[type].map(({ key, type: columnType }) => (
                    <td key={key} className="border px-2 py-1 dark:border-gray-700 dark:text-gray-100">
                        {formatColumnValue(row[key as keyof typeof row], columnType)}
                    </td>
                ))}
                <td className="border px-2 py-1 dark:border-gray-700 dark:text-gray-100">
                    {formatColumnValue(row.archivedAt, 'date')}
                </td>
                {type === 'projects' && (
                    <td className="border px-2 py-1 dark:border-gray-700">
                        <Link href={`/owner/projects/${row.id}`} className="text-blue-600 hover:underline dark:text-blue-400">
                            查看
                        </Link>
                    </td>
                )}
            </tr>
        ));
    };

    return (
        <main className="max-w-2xl mx-auto px-4 py-8">
            {/* 封存自動刪除提示 */}
            <div className="mb-4 p-3 rounded bg-yellow-100 text-yellow-800 border border-yellow-300 text-sm dark:bg-yellow-900 dark:text-yellow-100 dark:border-yellow-700">
                封存文件將於 {archiveRetentionDays} 天（約{' '}
                {Math.round(archiveRetentionDays / 365)} 年）後自動刪除。
            </div>

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold dark:text-gray-100">{PAGE_TITLES[type]}</h1>
            </div>

            {/* 搜尋框 */}
            <div className="mb-4">
                <input
                    type="text"
                    className="border rounded px-2 py-1 w-full dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                    placeholder="搜尋..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* 資料表格 */}
            <table className="w-full border text-sm dark:border-gray-700">
                <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800">
                        <th className="border px-2 py-1 dark:border-gray-700 dark:text-gray-100">序號</th>
                        {TABLE_COLUMNS[type].map(({ key, label }) => (
                            <th key={key} className="border px-2 py-1 dark:border-gray-700 dark:text-gray-100">
                                {label}
                            </th>
                        ))}
                        <th className="border px-2 py-1 dark:border-gray-700 dark:text-gray-100">封存日期</th>
                        {type === 'projects' && (
                            <th className="border px-2 py-1 dark:border-gray-700 dark:text-gray-100">操作</th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {renderTableContent()}
                </tbody>
            </table>
        </main>
    );
} 