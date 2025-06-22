/**
 * 建立合約頁面
 *
 * 提供從訂單或報價單建立合約的功能，包含：
 * - 訂單/報價單選擇
 * - 合約資訊設定
 * - 合約條款管理
 * - 合約範本應用
 * - 合約預覽
 */

'use client';

import { QueryDocumentSnapshot } from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { useState, useMemo, useEffect } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';

import { db, collection, setDoc, doc, getDocs, Timestamp } from '@/lib/firebase-client';
import { OrderData, QuoteData, OrderItem, QuoteItem } from '@/types/finance';
import {
  getErrorMessage,
  logError,
  safeAsync,
  retry,
} from '@/utils/errorUtils';

// Tab 類型
type SourceTab = 'order' | 'quote';

interface RowBase {
  idx: number;
  id: string;
  name: string;
  createdAt: Date | null;
  raw: Record<string, unknown>;
}

export default function ImportContractPage() {
  const [tab, setTab] = useState<SourceTab>('order');
  // 訂單與估價單快照
  const [ordersSnapshot] = useCollection(collection(db, 'finance', 'default', 'orders'));
  const [quotesSnapshot] = useCollection(collection(db, 'finance', 'default', 'quotes'));
  const [importingId, setImportingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');

  // 已有合約的來源ID集合
  const [contractOrderIds, setContractOrderIds] = useState<Set<string>>(new Set());
  const [contractQuoteIds, setContractQuoteIds] = useState<Set<string>>(new Set());

  // 載入已存在的合約來源ID
  useEffect(() => {
    const loadContractIds = async () => {
      const contractsRef = collection(db, 'finance', 'default', 'contracts');
      const contractsSnap = await getDocs(contractsRef);
      const orderIds = new Set<string>();
      const quoteIds = new Set<string>();
      contractsSnap.forEach((doc: QueryDocumentSnapshot) => {
        const data = doc.data();
        if (data.sourceType === 'order' && data.sourceId) orderIds.add(data.sourceId);
        if (data.sourceType === 'quote' && data.sourceId) quoteIds.add(data.sourceId);
      });
      setContractOrderIds(orderIds);
      setContractQuoteIds(quoteIds);
    };

    loadContractIds();
  }, []);

  // 訂單 rows
  const orderRows: RowBase[] = useMemo(() => {
    if (!ordersSnapshot) return [];
    return ordersSnapshot.docs
      .filter(doc => !contractOrderIds.has(doc.id))
      .map((doc, idx) => {
        const data = doc.data() as Record<string, unknown>;
        return {
          idx: idx + 1,
          id: (data.orderId as string) || doc.id,
          name: (data.orderName as string) || (data.orderId as string) || doc.id,
          createdAt:
            data.createdAt && typeof data.createdAt === 'object' && 'toDate' in data.createdAt
              ? (data.createdAt as { toDate: () => Date }).toDate()
              : data.createdAt
                ? new Date(data.createdAt as string)
                : null,
          raw: data,
        };
      });
  }, [ordersSnapshot, contractOrderIds]);

  // 估價單 rows
  const quoteRows: RowBase[] = useMemo(() => {
    if (!quotesSnapshot) return [];
    return quotesSnapshot.docs
      .filter(doc => !contractQuoteIds.has(doc.id))
      .map((doc, idx) => {
        const data = doc.data() as Record<string, unknown>;
        return {
          idx: idx + 1,
          id: (data.quoteId as string) || doc.id,
          name: (data.quoteName as string) || (data.quoteId as string) || doc.id,
          createdAt:
            data.createdAt && typeof data.createdAt === 'object' && 'toDate' in data.createdAt
              ? (data.createdAt as { toDate: () => Date }).toDate()
              : data.createdAt
                ? new Date(data.createdAt as string)
                : null,
          raw: data,
        };
      });
  }, [quotesSnapshot, contractQuoteIds]);

  // 建立合約
  const handleImportContract = async (row: RowBase) => {
    setImportingId(row.id);
    setMessage('');
    await safeAsync(async () => {
      let contractData: Record<string, unknown> = {};
      // 生成 contractId
      const newContractId = nanoid(8);

      if (tab === 'order') {
        const order = row.raw as unknown as OrderData;
        contractData = {
          contractId: newContractId, // 使用生成的 ID
          contractName: order.orderName,
          contractPrice: order.orderPrice,
          contractItems: (order.orderItems as OrderItem[]).map(item => ({
            contractItemId: item.orderItemId,
            contractItemPrice: item.orderItemPrice,
            contractItemQuantity: item.orderItemQuantity,
            contractItemWeight: item.orderItemWeight ?? null,
          })),
          clientName: order.clientName,
          clientContact: order.clientContact,
          clientPhone: order.clientPhone,
          clientEmail: order.clientEmail,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          sourceType: 'order',
          sourceId: order.orderId,
          contractContent: '',
        };
      } else {
        const quote = row.raw as unknown as QuoteData;
        contractData = {
          contractId: newContractId, // 使用生成的 ID
          contractName: quote.quoteName,
          contractPrice: quote.quotePrice,
          contractItems: (quote.quoteItems as QuoteItem[]).map(item => ({
            contractItemId: item.quoteItemId,
            contractItemPrice: item.quoteItemPrice,
            contractItemQuantity: item.quoteItemQuantity,
            contractItemWeight: item.quoteItemWeight ?? null,
          })),
          clientName: quote.clientName,
          clientContact: quote.clientContact,
          clientPhone: quote.clientPhone,
          clientEmail: quote.clientEmail,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          sourceType: 'quote',
          sourceId: quote.quoteId,
          contractContent: '',
        };
      }

      // 使用 setDoc 代替 addDoc，並指定文件 ID 與 contractId 一致
      await retry(() => setDoc(doc(db, 'finance', 'default', 'contracts', newContractId), contractData), 3, 1000);

      setMessage(`已成功由${tab === 'order' ? '訂單' : '估價單'}建立合約，來源ID: ${row.id}`);
    }, (error) => {
      setMessage(`建立失敗: ${getErrorMessage(error)}`);
      logError(error, { operation: 'import_contract', sourceType: tab, sourceId: row.id });
    });
    setImportingId(null);
  };

  // Tab UI
  const tabButton = (type: SourceTab, label: string) => (
    <button
      className={`px-4 py-2 rounded-t ${tab === type ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
      onClick={() => setTab(type)}
      type='button'
    >
      {label}
    </button>
  );

  const rows = tab === 'order' ? orderRows : quoteRows;

  return (
    <main className='max-w-2xl mx-auto px-4 py-8 bg-white dark:bg-gray-900'>
      <h1 className='text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100'>
        從訂單/估價單建立合約
      </h1>
      <div className='flex mb-4 border-b border-gray-300 dark:border-gray-700'>
        {tabButton('order', '訂單')}
        {tabButton('quote', '估價單')}
      </div>
      {message && <div className='mb-4 text-green-600 dark:text-green-400'>{message}</div>}
      <table className='w-full border text-sm bg-white dark:bg-gray-900'>
        <thead>
          <tr className='bg-gray-100 dark:bg-gray-800'>
            <th className='border px-2 py-1 border-gray-300 dark:border-gray-700'>序號</th>
            <th className='border px-2 py-1 border-gray-300 dark:border-gray-700'>
              {tab === 'order' ? '訂單名稱' : '估價單名稱'}
            </th>
            <th className='border px-2 py-1 border-gray-300 dark:border-gray-700'>建立日期</th>
            <th className='border px-2 py-1 border-gray-300 dark:border-gray-700'>操作</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className='text-center text-gray-400 dark:text-gray-500 py-4'>
                尚無可建立合約的{tab === 'order' ? '訂單' : '估價單'}
              </td>
            </tr>
          ) : (
            rows.map(row => (
              <tr key={row.id} className='bg-white dark:bg-gray-900'>
                <td className='border px-2 py-1 text-center border-gray-300 dark:border-gray-700'>
                  {row.idx}
                </td>
                <td className='border px-2 py-1 border-gray-300 dark:border-gray-700'>
                  {row.name}
                </td>
                <td className='border px-2 py-1 border-gray-300 dark:border-gray-700'>
                  {row.createdAt ? row.createdAt.toLocaleDateString() : '-'}
                </td>
                <td className='border px-2 py-1 border-gray-300 dark:border-gray-700'>
                  <button
                    className='bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50'
                    disabled={!!importingId}
                    onClick={() => handleImportContract(row)}
                  >
                    {importingId === row.id ? '建立中...' : '建立合約'}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </main>
  );
}
