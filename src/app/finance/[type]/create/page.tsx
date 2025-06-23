'use client';

import { QueryDocumentSnapshot } from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { useRouter, useParams } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';

import { useAuth } from '@/hooks/useAuth';
import {
  db,
  collection,
  setDoc,
  doc,
  getDocs,
  Timestamp,
} from '@/lib/firebase-client';
import {
  OrderData,
  QuoteData,
  OrderItem,
  QuoteItem,
} from '@/types/finance';
import {
  getErrorMessage,
  logError,
  safeAsync,
  retry,
} from '@/utils/errorUtils';

export default function FinanceCreatePage() {
  const params = useParams();
  const type = params.type;

  if (type === 'contracts') {
    return <ImportContractPage />;
  }
  if (type === 'orders') {
    return <OrderAddPage />;
  }
  if (type === 'quotes') {
    return <QuoteAddPage />;
  }

  return (
    <div className='flex h-full w-full items-center justify-center'>
      <p className='text-red-500'>無效的財務類型: {type}</p>
    </div>
  );
}

// #region Create Contract from Order/Quote
type SourceTab = 'order' | 'quote';

interface RowBase {
  idx: number;
  id: string;
  name: string;
  createdAt: Date | null;
  raw: Record<string, unknown>;
}

function ImportContractPage() {
  const [tab, setTab] = useState<SourceTab>('order');
  const [ordersSnapshot] = useCollection(
    collection(db, 'finance', 'default', 'orders')
  );
  const [quotesSnapshot] = useCollection(
    collection(db, 'finance', 'default', 'quotes')
  );
  const [importingId, setImportingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const [contractOrderIds, setContractOrderIds] = useState<Set<string>>(
    new Set()
  );
  const [contractQuoteIds, setContractQuoteIds] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    const loadContractIds = async () => {
      const contractsRef = collection(db, 'finance', 'default', 'contracts');
      const contractsSnap = await getDocs(contractsRef);
      const orderIds = new Set<string>();
      const quoteIds = new Set<string>();
      contractsSnap.forEach((doc: QueryDocumentSnapshot) => {
        const data = doc.data();
        if (data.sourceType === 'order' && data.sourceId)
          orderIds.add(data.sourceId);
        if (data.sourceType === 'quote' && data.sourceId)
          quoteIds.add(data.sourceId);
      });
      setContractOrderIds(orderIds);
      setContractQuoteIds(quoteIds);
    };

    loadContractIds();
  }, []);

  const orderRows: RowBase[] = useMemo(() => {
    if (!ordersSnapshot) return [];
    return ordersSnapshot.docs
      .filter(doc => !contractOrderIds.has(doc.id))
      .map((doc, idx) => {
        const data = doc.data() as Record<string, unknown>;
        return {
          idx: idx + 1,
          id: (data.orderId as string) || doc.id,
          name:
            (data.orderName as string) || (data.orderId as string) || doc.id,
          createdAt:
            data.createdAt &&
            typeof data.createdAt === 'object' &&
            'toDate' in data.createdAt
              ? (data.createdAt as { toDate: () => Date }).toDate()
              : data.createdAt
              ? new Date(data.createdAt as string)
              : null,
          raw: data,
        };
      });
  }, [ordersSnapshot, contractOrderIds]);

  const quoteRows: RowBase[] = useMemo(() => {
    if (!quotesSnapshot) return [];
    return quotesSnapshot.docs
      .filter(doc => !contractQuoteIds.has(doc.id))
      .map((doc, idx) => {
        const data = doc.data() as Record<string, unknown>;
        return {
          idx: idx + 1,
          id: (data.quoteId as string) || doc.id,
          name:
            (data.quoteName as string) || (data.quoteId as string) || doc.id,
          createdAt:
            data.createdAt &&
            typeof data.createdAt === 'object' &&
            'toDate' in data.createdAt
              ? (data.createdAt as { toDate: () => Date }).toDate()
              : data.createdAt
              ? new Date(data.createdAt as string)
              : null,
          raw: data,
        };
      });
  }, [quotesSnapshot, contractQuoteIds]);

  const handleImportContract = async (row: RowBase) => {
    setImportingId(row.id);
    setMessage('');
    await safeAsync(
      async () => {
        let contractData: Record<string, unknown> = {};
        const newContractId = nanoid(8);

        if (tab === 'order') {
          const order = row.raw as unknown as OrderData;
          contractData = {
            contractId: newContractId,
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
            contractId: newContractId,
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

        await retry(
          () =>
            setDoc(
              doc(db, 'finance', 'default', 'contracts', newContractId),
              contractData
            ),
          3,
          1000
        );

        setMessage(
          `已成功由${
            tab === 'order' ? '訂單' : '估價單'
          }建立合約，來源ID: ${row.id}`
        );
      },
      error => {
        setMessage(`建立失敗: ${getErrorMessage(error)}`);
        logError(error, {
          operation: 'import_contract',
          sourceType: tab,
          sourceId: row.id,
        });
      }
    );
    setImportingId(null);
  };

  const tabButton = (type: SourceTab, label: string) => (
    <button
      className={`px-4 py-2 rounded-t ${
        tab === type
          ? 'bg-blue-600 text-white'
          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
      }`}
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
      {message && (
        <div className='mb-4 text-green-600 dark:text-green-400'>
          {message}
        </div>
      )}
      <table className='w-full border text-sm bg-white dark:bg-gray-900'>
        <thead>
          <tr className='bg-gray-100 dark:bg-gray-800'>
            <th className='border px-2 py-1 border-gray-300 dark:border-gray-700'>
              序號
            </th>
            <th className='border px-2 py-1 border-gray-300 dark:border-gray-700'>
              {tab === 'order' ? '訂單名稱' : '估價單名稱'}
            </th>
            <th className='border px-2 py-1 border-gray-300 dark:border-gray-700'>
              建立日期
            </th>
            <th className='border px-2 py-1 border-gray-300 dark:border-gray-700'>
              操作
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                className='text-center text-gray-400 dark:text-gray-500 py-4'
              >
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
// #endregion

// #region Add Order
function OrderAddPage() {
  const router = useRouter();
  const [clientName, setClientName] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [orderName, setOrderName] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    { orderItemId: '', orderItemPrice: 0, orderItemQuantity: 1 },
  ]);

  const getOrderItemPrice = (quantity: number, unitPrice: number) =>
    Number((quantity * unitPrice).toFixed(2));
  const totalOrderItemPrice = Number(
    orderItems
      .reduce((sum, item) => sum + (item.orderItemPrice || 0), 0)
      .toFixed(2)
  );
  const orderPrice = totalOrderItemPrice;

  const getWeight = (price: number) =>
    Number((orderPrice ? price / orderPrice : 0).toFixed(4));
  const getPercent = (price: number) =>
    orderPrice ? ((price / orderPrice) * 100).toFixed(2) : '0.00';

  const getUnitPrice = (item: OrderItem) =>
    Number((item.orderItemPrice / (item.orderItemQuantity || 1)).toFixed(2));
  const setUnitPrice = (idx: number, unitPrice: number) => {
    const item = orderItems[idx];
    handleItemChange(
      idx,
      'orderItemPrice',
      getOrderItemPrice(item.orderItemQuantity || 1, unitPrice)
    );
  };

  const handleItemChange = (
    idx: number,
    key: keyof OrderItem,
    value: string | number
  ) => {
    setOrderItems(items =>
      items.map((item, i) => {
        if (i !== idx) return item;

        const updated = { ...item, [key]: value };
        if (key === 'orderItemQuantity') {
          const unitPrice = getUnitPrice(item);
          updated.orderItemPrice = getOrderItemPrice(
            Number(value) || 0,
            unitPrice
          );
        }
        return updated;
      })
    );
  };
  const addItem = () =>
    setOrderItems([
      ...orderItems,
      { orderItemId: '', orderItemPrice: 0, orderItemQuantity: 1 },
    ]);
  const removeItem = (idx: number) =>
    setOrderItems(items => items.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await safeAsync(
      async () => {
        const orderId = nanoid(5);
        const now = new Date();
        await retry(
          () =>
            setDoc(doc(db, 'finance', 'default', 'orders', orderId), {
              orderId,
              orderName,
              orderPrice,
              orderItems: orderItems.map((item, idx) => ({
                ...item,
                orderItemId: item.orderItemId || String(idx + 1),
              })),
              totalOrderItemPrice,
              createdAt: Timestamp.fromDate(now),
              updatedAt: Timestamp.fromDate(now),
              clientName,
              clientContact,
              clientPhone,
              clientEmail,
            }),
          3,
          1000
        );
        router.push('/finance/orders');
      },
      error => {
        alert(`建立訂單失敗：${getErrorMessage(error)}`);
        logError(error, { operation: 'add_order' });
      }
    );
  };

  return (
    <main className='max-w-xl mx-auto px-4 py-8'>
      <h1 className='text-2xl font-bold mb-4'>新增訂單</h1>
      <form onSubmit={handleSubmit}>
        <div className='grid grid-cols-3 gap-4 mb-4'>
          <div>
            <label className='block font-medium mb-1'>訂單名稱：</label>
            <input
              type='text'
              className='border px-2 py-1 rounded w-full bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:outline-blue-400 focus:ring-2 focus:ring-blue-200'
              value={orderName}
              onChange={e => setOrderName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className='block font-medium mb-1'>訂單金額：</label>
            <input
              type='number'
              className='border px-2 py-1 rounded w-full bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:outline-blue-400 focus:ring-2 focus:ring-blue-200'
              value={orderPrice}
              readOnly
              tabIndex={-1}
            />
          </div>
          <div>
            <label className='block font-medium mb-1'>客戶名稱：</label>
            <input
              type='text'
              className='border px-2 py-1 rounded w-full bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:outline-blue-400 focus:ring-2 focus:ring-blue-200'
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              required
            />
          </div>
        </div>
        <div className='grid grid-cols-3 gap-4 mb-4'>
          <div>
            <label className='block font-medium mb-1'>客戶聯絡人：</label>
            <input
              type='text'
              className='border px-2 py-1 rounded w-full bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:outline-blue-400 focus:ring-2 focus:ring-blue-200'
              value={clientContact}
              onChange={e => setClientContact(e.target.value)}
              required
            />
          </div>
          <div>
            <label className='block font-medium mb-1'>聯絡電話：</label>
            <input
              type='text'
              className='border px-2 py-1 rounded w-full bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:outline-blue-400 focus:ring-2 focus:ring-blue-200'
              value={clientPhone}
              onChange={e => setClientPhone(e.target.value)}
              required
            />
          </div>
          <div>
            <label className='block font-medium mb-1'>郵箱：</label>
            <input
              type='email'
              className='border px-2 py-1 rounded w-full bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:outline-blue-400 focus:ring-2 focus:ring-blue-200'
              value={clientEmail}
              onChange={e => setClientEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className='mb-4'>
          <label className='block font-medium mb-1'>訂單項目：</label>
          <table className='w-full border text-sm mb-2 border-gray-300 dark:border-gray-700'>
            <thead>
              <tr className='bg-gray-100 dark:bg-gray-800'>
                <th className='border px-2 py-1 border-gray-300 dark:border-gray-700'>
                  項目名稱
                </th>
                <th className='border px-2 py-1 border-gray-300 dark:border-gray-700'>
                  項目金額
                </th>
                <th className='border px-2 py-1 border-gray-300 dark:border-gray-700'>
                  項目數量
                </th>
                <th className='border px-2 py-1 border-gray-300 dark:border-gray-700'>
                  項目單價
                </th>
                <th className='border px-2 py-1 border-gray-300 dark:border-gray-700'>
                  項目權重
                </th>
                <th className='border px-2 py-1 border-gray-300 dark:border-gray-700'>
                  項目佔比
                </th>
                <th className='border px-2 py-1 border-gray-300 dark:border-gray-700'>
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {orderItems.map((item, idx) => (
                <tr key={idx}>
                  <td className='border px-2 py-1 border-gray-300 dark:border-gray-700'>
                    <input
                      type='text'
                      className='border px-2 py-1 rounded w-32 bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:outline-blue-400 focus:ring-2 focus:ring-blue-200'
                      value={item.orderItemId}
                      onChange={e =>
                        handleItemChange(idx, 'orderItemId', e.target.value)
                      }
                      required
                    />
                  </td>
                  <td className='border px-2 py-1 border-gray-300 dark:border-gray-700 text-right'>
                    <input
                      type='number'
                      className='border px-2 py-1 rounded w-24 bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700 text-right focus:outline-blue-400 focus:ring-2 focus:ring-blue-200'
                      min={0}
                      value={item.orderItemPrice}
                      onChange={e =>
                        handleItemChange(
                          idx,
                          'orderItemPrice',
                          Number(e.target.value)
                        )
                      }
                      required
                    />
                  </td>
                  <td className='border px-2 py-1 border-gray-300 dark:border-gray-700'>
                    <input
                      type='number'
                      className='border px-2 py-1 rounded w-20 bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:outline-blue-400 focus:ring-2 focus:ring-blue-200'
                      min={0}
                      value={item.orderItemQuantity}
                      onChange={e =>
                        handleItemChange(
                          idx,
                          'orderItemQuantity',
                          Number(e.target.value)
                        )
                      }
                      required
                    />
                  </td>
                  <td className='border px-2 py-1 text-center border-gray-300 dark:border-gray-700'>
                    <input
                      type='number'
                      className='border px-2 py-1 rounded w-24 bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700 text-right focus:outline-blue-400 focus:ring-2 focus:ring-blue-200'
                      min={0}
                      value={getUnitPrice(item)}
                      onChange={e => setUnitPrice(idx, Number(e.target.value))}
                      step='0.01'
                      required
                    />
                  </td>
                  <td className='border px-2 py-1 text-center border-gray-300 dark:border-gray-700'>
                    {getWeight(item.orderItemPrice).toFixed(2)}
                  </td>
                  <td className='border px-2 py-1 text-center border-gray-300 dark:border-gray-700'>
                    {getPercent(item.orderItemPrice)}%
                  </td>
                  <td className='border px-2 py-1 text-center border-gray-300 dark:border-gray-700'>
                    {orderItems.length > 1 && (
                      <button
                        type='button'
                        className='text-red-500 dark:text-red-400'
                        onClick={() => removeItem(idx)}
                      >
                        刪除
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className='flex justify-end text-sm text-gray-700 dark:text-gray-200 mt-2'>
            <span>
              項目總價：<span className='font-bold'>{totalOrderItemPrice}</span>
            </span>
            <span className='ml-6'>
              訂單金額：<span className='font-bold'>{orderPrice}</span>
            </span>
          </div>
          <button
            type='button'
            className='bg-gray-200 dark:bg-gray-700 text-black dark:text-gray-100 px-3 py-1 rounded mt-2'
            onClick={addItem}
          >
            新增項目
          </button>
        </div>
        <div className='mt-6 flex gap-2'>
          <button
            type='submit'
            className='bg-blue-600 dark:bg-green-900 text-white dark:text-green-400 px-6 py-2 rounded'
          >
            送出訂單
          </button>
          <button
            type='button'
            className='bg-gray-300 dark:bg-gray-800 text-black dark:text-gray-100 px-6 py-2 rounded'
            onClick={() => router.push('/finance/orders')}
          >
            返回列表
          </button>
        </div>
      </form>
    </main>
  );
}
// #endregion

// #region Add Quote
function QuoteAddPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [quoteName, setQuoteName] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [quotePrice, setQuotePrice] = useState<number>(0);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([
    {
      quoteItemId: '',
      quoteItemPrice: 0,
      quoteItemQuantity: 1,
      quoteItemWeight: 0,
    },
  ]);

  const totalQuoteItemPrice = Number(
    quoteItems
      .reduce((sum, item) => sum + (item.quoteItemPrice || 0), 0)
      .toFixed(2)
  );

  const getUnitPrice = (item: QuoteItem) =>
    Number(
      (item.quoteItemQuantity
        ? item.quoteItemPrice / item.quoteItemQuantity
        : 0
      ).toFixed(2)
    );

  const handleItemChange = (
    idx: number,
    key: keyof QuoteItem,
    value: string | number
  ) => {
    setQuoteItems(items =>
      items.map((item, i) => {
        if (i !== idx) return item;
        const newItem = { ...item, [key]: value };
        if (
          key === 'quoteItemWeight' &&
          typeof value === 'number' &&
          quotePrice > 0
        ) {
          newItem.quoteItemPrice = Number(
            ((value as number) * quotePrice).toFixed(2)
          );
        }
        if (
          key === 'quoteItemPrice' &&
          typeof value === 'number' &&
          quotePrice > 0
        ) {
          newItem.quoteItemWeight = Number(
            ((value as number) / quotePrice).toFixed(4)
          );
        }
        return newItem;
      })
    );
  };
  const addItem = () =>
    setQuoteItems([
      ...quoteItems,
      {
        quoteItemId: '',
        quoteItemPrice: 0,
        quoteItemQuantity: 1,
        quoteItemWeight: 0,
      },
    ]);
  const removeItem = (idx: number) =>
    setQuoteItems(items => items.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    await safeAsync(
      async () => {
        const quoteId = nanoid();
        await retry(
          () =>
            setDoc(doc(db, 'finance', 'default', 'quotes', quoteId), {
              quoteId,
              quoteName,
              clientName,
              clientContact,
              clientPhone,
              clientEmail,
              quotePrice,
              quoteItems,
              createdAt: new Date(),
              updatedAt: new Date(),
              status: 'draft',
              createdBy: user.uid,
            }),
          3,
          1000
        );
        router.push('/finance/quotes');
      },
      error => {
        alert(`建立報價單失敗，請稍後再試：${getErrorMessage(error)}`);
        logError(error, { operation: 'create_quote', userId: user.uid });
      }
    );
  };

  return (
    <main className='max-w-4xl mx-auto'>
      <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
        <h1 className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent mb-6'>
          新增估價單
        </h1>
        <form onSubmit={handleSubmit}>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                估價單名稱：
              </label>
              <input
                type='text'
                className='w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                value={quoteName}
                onChange={e => setQuoteName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                估價金額：
              </label>
              <input
                type='number'
                className='w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                value={quotePrice}
                onChange={e => setQuotePrice(Number(e.target.value))}
                step={0.01}
                min={0}
                required
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                客戶名稱：
              </label>
              <input
                type='text'
                className='w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                required
              />
            </div>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                聯絡人：
              </label>
              <input
                type='text'
                className='w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                value={clientContact}
                onChange={e => setClientContact(e.target.value)}
                required
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                電話：
              </label>
              <input
                type='tel'
                className='w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                value={clientPhone}
                onChange={e => setClientPhone(e.target.value)}
                required
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                Email：
              </label>
              <input
                type='email'
                className='w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                value={clientEmail}
                onChange={e => setClientEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div className='mb-6'>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3'>
              估價項目：
            </label>
            <table className='w-full border-collapse'>
              <thead>
                <tr className='bg-gray-50 dark:bg-gray-700/50'>
                  <th className='px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700'>
                    項目ID
                  </th>
                  <th className='px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700'>
                    金額
                  </th>
                  <th className='px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700'>
                    數量
                  </th>
                  <th className='px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700'>
                    權重
                  </th>
                  <th className='px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700'>
                    單價
                  </th>
                  <th className='px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700'>
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {quoteItems.map((item, idx) => (
                  <tr key={idx}>
                    <td className='px-4 py-3 text-sm text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700'>
                      <input
                        type='text'
                        className='w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                        value={item.quoteItemId}
                        onChange={e =>
                          handleItemChange(idx, 'quoteItemId', e.target.value)
                        }
                      />
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700'>
                      <input
                        type='number'
                        className='w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                        value={item.quoteItemPrice}
                        onChange={e =>
                          handleItemChange(
                            idx,
                            'quoteItemPrice',
                            Number(e.target.value)
                          )
                        }
                        step={0.01}
                        min={0}
                      />
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700'>
                      <input
                        type='number'
                        className='w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                        value={item.quoteItemQuantity}
                        min={1}
                        onChange={e =>
                          handleItemChange(
                            idx,
                            'quoteItemQuantity',
                            Number(e.target.value)
                          )
                        }
                      />
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700'>
                      <input
                        type='number'
                        className='w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                        value={item.quoteItemWeight}
                        step={0.0001}
                        min={0}
                        max={1}
                        onChange={e =>
                          handleItemChange(
                            idx,
                            'quoteItemWeight',
                            Number(e.target.value)
                          )
                        }
                      />
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700'>
                      {getUnitPrice(item)}
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700'>
                      <button
                        type='button'
                        onClick={() => removeItem(idx)}
                        className='text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium'
                      >
                        刪除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className='mt-2 flex justify-end gap-4 text-sm'>
              <span>
                <span className='font-bold'>權重總和：</span>
                <span
                  style={{
                    color:
                      Math.abs(
                        quoteItems.reduce(
                          (sum, item) => sum + (item.quoteItemWeight ?? 0),
                          0
                        ) - 1
                      ) > 0.001
                        ? 'red'
                        : undefined,
                  }}
                >
                  {quoteItems
                    .reduce((sum, item) => sum + (item.quoteItemWeight ?? 0), 0)
                    .toFixed(2)}
                </span>
              </span>
              <span>
                <span className='font-bold'>項目總金額：</span>{' '}
                {totalQuoteItemPrice}
              </span>
            </div>
            <div className='flex gap-4 mt-6'>
              <button
                type='submit'
                className='bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              >
                建立報價單
              </button>
              <button
                type='button'
                onClick={addItem}
                className='bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
              >
                新增項目
              </button>
              <button
                type='button'
                className='bg-gray-500 hover:bg-gray-600 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'
                onClick={() => router.push('/finance/quotes')}
              >
                取消
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
// #endregion