'use client';

import { useParams, useRouter } from 'next/navigation';
import { FormEvent, ChangeEvent, useEffect, useState } from 'react';
import { useDocument } from 'react-firebase-hooks/firestore';

import { useAuth } from '@/hooks/useAuth';
import { db, doc, updateDoc, Timestamp } from '@/lib/firebase-client';
import { OrderItem, QuoteItem } from '@/types/finance';
import {
  getErrorMessage,
  logError,
  safeAsync,
  retry,
} from '@/utils/errorUtils';

export default function FinanceDetailPage() {
  const params = useParams();
  const type = params.type as 'contracts' | 'orders' | 'quotes';

  if (type === 'contracts') {
    return <ContractDetail />;
  }
  if (type === 'orders') {
    return <OrderDetail />;
  }
  if (type === 'quotes') {
    return <QuoteDetail />;
  }

  return (
    <div className='flex h-full w-full items-center justify-center'>
      <p className='text-red-500'>無效的財務類型: {type}</p>
    </div>
  );
}

function ContractDetail() {
  const { loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const contractId = params?.id as string;
  const [contractDoc, loading, error] = useDocument(
    contractId ? doc(db, 'finance', 'default', 'contracts', contractId) : null
  );

  if (authLoading || loading) {
    return (
      <main className='max-w-2xl mx-auto px-4 py-8 bg-white dark:bg-gray-900'>
        <div>載入中...</div>
      </main>
    );
  }
  if (error) {
    return (
      <main className='max-w-2xl mx-auto px-4 py-8 bg-white dark:bg-gray-900'>
        <div className='text-red-500'>{String(error)}</div>
      </main>
    );
  }
  if (!contractDoc || !contractDoc.exists()) {
    return (
      <main className='max-w-2xl mx-auto px-4 py-8 bg-white dark:bg-gray-900'>
        <div className='text-gray-400 dark:text-gray-500'>找不到合約</div>
      </main>
    );
  }

  const data = contractDoc.data();
  const createdAt = data.createdAt?.toDate();
  const contractItems = Array.isArray(data.contractItems)
    ? data.contractItems
    : [];

  return (
    <main className='max-w-2xl mx-auto px-4 py-8 bg-white dark:bg-gray-900'>
      <h1 className='text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100'>
        合約詳情
      </h1>
      <div className='mb-2 text-sm text-gray-500 dark:text-gray-400'>
        此合約可能由訂單或估價單產生，來源資訊如下。
      </div>
      <div className='mb-4 space-y-2'>
        <div>
          <span className='font-bold'>合約名稱：</span>{' '}
          {data.contractName || data.contractId || contractId}
        </div>
        <div>
          <span className='font-bold'>合約ID：</span>{' '}
          {data.contractId || contractId}
        </div>
        <div>
          <span className='font-bold'>合約金額：</span> {data.contractPrice ?? '-'}
        </div>
        <div>
          <span className='font-bold'>建立日期：</span>{' '}
          {createdAt ? createdAt.toLocaleDateString() : '-'}
        </div>
        <div>
          <span className='font-bold'>客戶名稱：</span> {data.clientName ?? '-'}
        </div>
        <div>
          <span className='font-bold'>聯絡人：</span> {data.clientContact ?? '-'}
        </div>
        <div>
          <span className='font-bold'>電話：</span> {data.clientPhone ?? '-'}
        </div>
        <div>
          <span className='font-bold'>Email：</span> {data.clientEmail ?? '-'}
        </div>
        <div>
          <span className='font-bold'>來源：</span>
          {data.sourceType === 'order' && data.sourceId ? (
            <span>
              訂單
              <button
                className='ml-2 text-blue-600 hover:underline dark:text-blue-400'
                onClick={() =>
                  router.push(`/finance/orders/${data.sourceId}`)
                }
              >
                {data.sourceId}
              </button>
            </span>
          ) : data.sourceType === 'quote' && data.sourceId ? (
            <span>
              估價單
              <button
                className='ml-2 text-green-600 hover:underline dark:text-green-400'
                onClick={() =>
                  router.push(`/finance/quotes/${data.sourceId}`)
                }
              >
                {data.sourceId}
              </button>
            </span>
          ) : (
            <span>-</span>
          )}
        </div>
      </div>
      {contractItems.length > 0 && (
        <div className='mb-4'>
          <div className='font-bold mb-2'>合約項目</div>
          <table className='w-full border text-sm mb-2 bg-white dark:bg-gray-900'>
            <thead>
              <tr className='bg-gray-100 dark:bg-gray-800'>
                <th className='border px-2 py-1 border-gray-300 dark:border-gray-700'>
                  項目ID
                </th>
                <th className='border px-2 py-1 border-gray-300 dark:border-gray-700'>
                  單價
                </th>
                <th className='border px-2 py-1 border-gray-300 dark:border-gray-700'>
                  數量
                </th>
                <th className='border px-2 py-1 border-gray-300 dark:border-gray-700'>
                  權重
                </th>
              </tr>
            </thead>
            <tbody>
              {contractItems.map((item, idx) => (
                <tr
                  key={item.contractItemId || idx}
                  className='bg-white dark:bg-gray-900'
                >
                  <td className='border px-2 py-1 border-gray-300 dark:border-gray-700'>
                    {item.contractItemId ?? '-'}
                  </td>
                  <td className='border px-2 py-1 border-gray-300 dark:border-gray-700'>
                    {item.contractItemPrice ?? '-'}
                  </td>
                  <td className='border px-2 py-1 border-gray-300 dark:border-gray-700'>
                    {item.contractItemQuantity ?? '-'}
                  </td>
                  <td className='border px-2 py-1 border-gray-300 dark:border-gray-700'>
                    {item.contractItemWeight !== undefined
                      ? item.contractItemWeight
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className='mb-4'>
        <span className='font-bold'>合約條款：</span>
        <pre className='bg-gray-100 dark:bg-gray-800 rounded p-2 mt-1 whitespace-pre-wrap border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200'>
          {data.contractContent || '（無內容）'}
        </pre>
      </div>
      <button
        className='bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2 rounded hover:bg-gray-300 dark:hover:bg-gray-600'
        onClick={() => router.push('/finance/contracts')}
      >
        返回列表
      </button>
    </main>
  );
}

function OrderDetail() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;
  const [orderName, setOrderName] = useState('');
  const [orderPrice, setOrderPrice] = useState(0);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [clientName, setClientName] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editOrderName, setEditOrderName] = useState('');
  const [editOrderItems, setEditOrderItems] = useState<OrderItem[]>([]);
  const [editClientName, setEditClientName] = useState('');
  const [editClientContact, setEditClientContact] = useState('');
  const [editClientPhone, setEditClientPhone] = useState('');
  const [editClientEmail, setEditClientEmail] = useState('');

  const [orderDoc] = useDocument(
    orderId ? doc(db, 'finance', 'default', 'orders', orderId) : null
  );

  useEffect(() => {
    if (!orderId) return;
    if (orderDoc) {
      if (!orderDoc.exists()) {
        setError('找不到訂單');
        setLoading(false);
        return;
      }
      const data = orderDoc.data();
      setOrderName(data.orderName || '');
      setOrderPrice(data.orderPrice || 0);
      setOrderItems(Array.isArray(data.orderItems) ? data.orderItems : []);
      setClientName(data.clientName || '');
      setClientContact(data.clientContact || '');
      setClientPhone(data.clientPhone || '');
      setClientEmail(data.clientEmail || '');
      setEditOrderName(data.orderName || '');
      setEditOrderItems(
        Array.isArray(data.orderItems) ? data.orderItems : []
      );
      setEditClientName(data.clientName || '');
      setEditClientContact(data.clientContact || '');
      setEditClientPhone(data.clientPhone || '');
      setEditClientEmail(data.clientEmail || '');
      setLoading(false);
    }
  }, [orderId, orderDoc]);

  const editOrderPrice = editOrderItems.reduce(
    (sum, item) => sum + (item.orderItemPrice || 0),
    0
  );

  const getWeight = (price: number) => (orderPrice ? price / orderPrice : 0);
  const getPercent = (price: number) =>
    orderPrice ? ((price / orderPrice) * 100).toFixed(2) : '0.00';

  const handleEditItemChange = (
    idx: number,
    key: keyof OrderItem,
    value: string | number
  ) => {
    setEditOrderItems(items =>
      items.map((item, i) => (i === idx ? { ...item, [key]: value } : item))
    );
  };
  const addEditItem = () =>
    setEditOrderItems([
      ...editOrderItems,
      { orderItemId: '', orderItemPrice: 0, orderItemQuantity: 1 },
    ]);
  const removeEditItem = (idx: number) =>
    setEditOrderItems(items => items.filter((_, i) => i !== idx));

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    await safeAsync(
      async () => {
        await retry(
          () =>
            updateDoc(doc(db, 'finance', 'default', 'orders', orderId), {
              orderName: editOrderName,
              orderPrice: editOrderPrice,
              orderItems: editOrderItems.map((item, idx) => ({
                ...item,
                orderItemId: item.orderItemId || String(idx + 1),
              })),
              clientName: editClientName,
              clientContact: editClientContact,
              clientPhone: editClientPhone,
              clientEmail: editClientEmail,
              updatedAt: Timestamp.now(),
            }),
          3,
          1000
        );
        setOrderName(editOrderName);
        setOrderPrice(editOrderPrice);
        setOrderItems(editOrderItems);
        setClientName(editClientName);
        setClientContact(editClientContact);
        setClientPhone(editClientPhone);
        setClientEmail(editClientEmail);
        setEditing(false);
      },
      error => {
        setError(getErrorMessage(error));
        logError(error, { operation: 'save_order_edit', orderId });
      }
    );
  };

  return (
    <main className='max-w-xl mx-auto px-4 py-8'>
      <h1 className='text-2xl font-bold mb-4'>訂單詳情</h1>
      {loading ? (
        <div className='text-gray-400'>載入中...</div>
      ) : error ? (
        <div className='text-red-500'>{error}</div>
      ) : editing ? (
        <form onSubmit={handleSaveEdit}>
          <div className='grid grid-cols-3 gap-4 mb-4'>
            <div>
              <label className='block font-medium mb-1'>訂單名稱：</label>
              <input
                type='text'
                className='border px-2 py-1 rounded w-full bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700'
                value={editOrderName}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setEditOrderName(e.target.value)
                }
              />
            </div>
            <div>
              <label className='block font-medium mb-1'>訂單金額：</label>
              <input
                type='number'
                className='border px-2 py-1 rounded w-full bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700'
                value={editOrderPrice}
                readOnly
                tabIndex={-1}
              />
            </div>
            <div>
              <label className='block font-medium mb-1'>客戶名稱：</label>
              <input
                type='text'
                className='border px-2 py-1 rounded w-full bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700'
                value={editClientName}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setEditClientName(e.target.value)
                }
              />
            </div>
          </div>
          <div className='grid grid-cols-3 gap-4 mb-4'>
            <div>
              <label className='block font-medium mb-1'>客戶聯絡人：</label>
              <input
                type='text'
                className='border px-2 py-1 rounded w-full bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700'
                value={editClientContact}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setEditClientContact(e.target.value)
                }
              />
            </div>
            <div>
              <label className='block font-medium mb-1'>聯絡電話：</label>
              <input
                type='text'
                className='border px-2 py-1 rounded w-full bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700'
                value={editClientPhone}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setEditClientPhone(e.target.value)
                }
              />
            </div>
            <div>
              <label className='block font-medium mb-1'>郵箱：</label>
              <input
                type='email'
                className='border px-2 py-1 rounded w-full bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700'
                value={editClientEmail}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setEditClientEmail(e.target.value)
                }
              />
            </div>
          </div>

          <div className='mb-4'>
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
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {editOrderItems.map((item, idx) => (
                  <tr key={idx}>
                    <td className='border px-2 py-1 border-gray-300 dark:border-gray-700'>
                      <input
                        type='text'
                        className='border px-2 py-1 rounded w-32 bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700'
                        value={item.orderItemId}
                        onChange={e =>
                          handleEditItemChange(idx, 'orderItemId', e.target.value)
                        }
                        required
                      />
                    </td>
                    <td className='border px-2 py-1 border-gray-300 dark:border-gray-700'>
                      <input
                        type='number'
                        className='border px-2 py-1 rounded w-24 bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700'
                        value={item.orderItemPrice}
                        min={0}
                        onChange={e =>
                          handleEditItemChange(
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
                        className='border px-2 py-1 rounded w-16 bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700'
                        value={item.orderItemQuantity}
                        min={1}
                        onChange={e =>
                          handleEditItemChange(
                            idx,
                            'orderItemQuantity',
                            Number(e.target.value)
                          )
                        }
                        required
                      />
                    </td>
                    <td className='border px-2 py-1 border-gray-300 dark:border-gray-700 text-center'>
                      {item.orderItemQuantity
                        ? (
                            item.orderItemPrice / item.orderItemQuantity
                          ).toFixed(2)
                        : '0.00'}
                    </td>
                    <td className='border px-2 py-1 border-gray-300 dark:border-gray-700 text-center'>
                      <button
                        type='button'
                        className='text-red-500'
                        onClick={() => removeEditItem(idx)}
                      >
                        刪除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              type='button'
              className='bg-gray-200 dark:bg-gray-700 text-black dark:text-gray-100 px-3 py-1 rounded mt-2'
              onClick={addEditItem}
            >
              新增項目
            </button>
          </div>
          <div className='mt-6 flex gap-2'>
            <button
              type='submit'
              className='bg-blue-500 text-white px-4 py-2 rounded'
            >
              儲存
            </button>
          </div>
        </form>
      ) : (
        <form>
          <div className='grid grid-cols-3 gap-4 mb-4'>
            <div>
              <label className='block font-medium mb-1'>訂單名稱：</label>
              <input
                type='text'
                className='border px-2 py-1 rounded w-full bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700'
                value={orderName}
                readOnly
              />
            </div>
            <div>
              <label className='block font-medium mb-1'>訂單金額：</label>
              <input
                type='number'
                className='border px-2 py-1 rounded w-full bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700'
                value={orderPrice}
                readOnly
              />
            </div>
            <div>
              <label className='block font-medium mb-1'>客戶名稱：</label>
              <input
                type='text'
                className='border px-2 py-1 rounded w-full bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700'
                value={clientName}
                readOnly
              />
            </div>
          </div>
          <div className='grid grid-cols-3 gap-4 mb-4'>
            <div>
              <label className='block font-medium mb-1'>客戶聯絡人：</label>
              <input
                type='text'
                className='border px-2 py-1 rounded w-full bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700'
                value={clientContact}
                readOnly
              />
            </div>
            <div>
              <label className='block font-medium mb-1'>聯絡電話：</label>
              <input
                type='text'
                className='border px-2 py-1 rounded w-full bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700'
                value={clientPhone}
                readOnly
              />
            </div>
            <div>
              <label className='block font-medium mb-1'>郵箱：</label>
              <input
                type='email'
                className='border px-2 py-1 rounded w-full bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700'
                value={clientEmail}
                readOnly
              />
            </div>
          </div>
          <div className='mb-4'>
            <label className='block font-medium mb-1'>訂單項目：</label>
            <table className='w-full border text-sm mb-2 border-gray-300 dark:border-gray-700'>
              <thead>
                <tr className='bg-gray-100 dark:bg-gray-800'>
                  <th className='border px-2 py-1 border-gray-300 dark:border-gray-700'>
                    項目ID
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
                    權重
                  </th>
                  <th className='border px-2 py-1 border-gray-300 dark:border-gray-700'>
                    佔比
                  </th>
                </tr>
              </thead>
              <tbody>
                {orderItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className='text-center text-gray-400'>
                      無項目
                    </td>
                  </tr>
                ) : (
                  orderItems.map((item, idx) => (
                    <tr key={item.orderItemId + idx}>
                      <td className='border px-2 py-1 border-gray-300 dark:border-gray-700'>
                        {item.orderItemId}
                      </td>
                      <td className='border px-2 py-1 border-gray-300 dark:border-gray-700 text-right'>
                        {item.orderItemPrice}
                      </td>
                      <td className='border px-2 py-1 border-gray-300 dark:border-gray-700'>
                        {item.orderItemQuantity}
                      </td>
                      <td className='border px-2 py-1 text-center border-gray-300 dark:border-gray-700'>
                        {item.orderItemQuantity
                          ? (
                              item.orderItemPrice / item.orderItemQuantity
                            ).toFixed(2)
                          : '0.00'}
                      </td>
                      <td className='border px-2 py-1 text-center border-gray-300 dark:border-gray-700'>
                        {getWeight(item.orderItemPrice).toFixed(2)}
                      </td>
                      <td className='border px-2 py-1 text-center border-gray-300 dark:border-gray-700'>
                        {getPercent(item.orderItemPrice)}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className='mt-6 flex gap-2'>
            <button
              type='button'
              className='bg-blue-600 dark:bg-green-900 text-white dark:text-green-400 px-6 py-2 rounded'
              onClick={() => router.push('/finance/orders')}
            >
              返回列表
            </button>
            <button
              type='button'
              className='bg-yellow-500 dark:bg-yellow-800 text-white dark:text-yellow-200 px-6 py-2 rounded'
              onClick={() => setEditing(true)}
            >
              編輯
            </button>
          </div>
        </form>
      )}
    </main>
  );
}

function QuoteDetail() {
  const router = useRouter();
  const params = useParams();
  const quoteId = params?.id as string;
  const [quoteName, setQuoteName] = useState('');
  const [quotePrice, setQuotePrice] = useState(0);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [clientName, setClientName] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editQuoteName, setEditQuoteName] = useState('');
  const [editQuotePrice, setEditQuotePrice] = useState(0);
  const [editQuoteItems, setEditQuoteItems] = useState<QuoteItem[]>([]);
  const [editClientName, setEditClientName] = useState('');
  const [editClientContact, setEditClientContact] = useState('');
  const [editClientPhone, setEditClientPhone] = useState('');
  const [editClientEmail, setEditClientEmail] = useState('');

  const [quoteDoc] = useDocument(
    quoteId ? doc(db, 'finance', 'default', 'quotes', quoteId) : null
  );

  useEffect(() => {
    if (!quoteId) return;
    if (quoteDoc) {
      if (!quoteDoc.exists()) {
        setError('找不到估價單');
        setLoading(false);
        return;
      }
      const data = quoteDoc.data();
      setQuoteName(data.quoteName || '');
      setQuotePrice(data.quotePrice || 0);
      setQuoteItems(Array.isArray(data.quoteItems) ? data.quoteItems : []);
      setClientName(data.clientName || '');
      setClientContact(data.clientContact || '');
      setClientPhone(data.clientPhone || '');
      setClientEmail(data.clientEmail || '');
      setEditQuoteName(data.quoteName || '');
      setEditQuotePrice(data.quotePrice || 0);
      setEditQuoteItems(
        Array.isArray(data.quoteItems) ? data.quoteItems : []
      );
      setEditClientName(data.clientName || '');
      setEditClientContact(data.clientContact || '');
      setEditClientPhone(data.clientPhone || '');
      setEditClientEmail(data.clientEmail || '');
      setLoading(false);
    }
  }, [quoteId, quoteDoc]);

  const getWeight = (price: number) =>
    Number((quotePrice ? price / quotePrice : 0).toFixed(4));
  const getUnitPrice = (item: QuoteItem) =>
    Number(
      (item.quoteItemQuantity
        ? item.quoteItemPrice / item.quoteItemQuantity
        : 0
      ).toFixed(2)
    );

  const handleEditItemChange = (
    idx: number,
    key: keyof QuoteItem,
    value: string | number
  ) => {
    setEditQuoteItems(items =>
      items.map((item, i) => {
        if (i !== idx) return item;
        const newItem = { ...item, [key]: value };
        if (key === 'quoteItemWeight' && typeof value === 'number' && quotePrice > 0) {
          newItem.quoteItemPrice = Number(((value as number) * quotePrice).toFixed(2));
        }
        if (key === 'quoteItemPrice' && typeof value === 'number' && quotePrice > 0) {
          newItem.quoteItemWeight = Number(
            ((value as number) / quotePrice).toFixed(4)
          );
        }
        return newItem;
      })
    );
  };
  const addEditItem = () =>
    setEditQuoteItems([
      ...editQuoteItems,
      { quoteItemId: '', quoteItemPrice: 0, quoteItemQuantity: 1 },
    ]);
  const removeEditItem = (idx: number) =>
    setEditQuoteItems(items => items.filter((_, i) => i !== idx));

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    await safeAsync(
      async () => {
        await retry(
          () =>
            updateDoc(doc(db, 'finance', 'default', 'quotes', quoteId), {
              quoteName: editQuoteName,
              quotePrice: editQuotePrice,
              quoteItems: editQuoteItems.map((item, idx) => ({
                ...item,
                quoteItemId: item.quoteItemId || String(idx + 1),
              })),
              clientName: editClientName,
              clientContact: editClientContact,
              clientPhone: editClientPhone,
              clientEmail: editClientEmail,
              updatedAt: Timestamp.now(),
            }),
          3,
          1000
        );
        setQuoteName(editQuoteName);
        setQuotePrice(editQuotePrice);
        setQuoteItems(editQuoteItems);
        setClientName(editClientName);
        setClientContact(editClientContact);
        setClientPhone(editClientPhone);
        setClientEmail(editClientEmail);
        setEditing(false);
      },
      error => {
        setError(getErrorMessage(error));
        logError(error, { operation: 'save_quote_edit', quoteId });
      }
    );
  };

  return (
    <main className='max-w-xl mx-auto px-4 py-8 bg-white dark:bg-gray-800 text-black dark:text-gray-100 rounded shadow'>
      <h1 className='text-2xl font-bold mb-4'>估價單詳情</h1>
      {loading ? (
        <div className='text-center py-8'>載入中...</div>
      ) : error ? (
        <div className='text-center text-red-500 py-8'>{error}</div>
      ) : editing ? (
        <form onSubmit={handleSaveEdit}>
          <div className='grid grid-cols-3 gap-4 mb-4'>
            <div>
              <label className='block font-medium mb-1'>估價單名稱：</label>
              <input
                type='text'
                className='border px-2 py-1 rounded w-full bg-white dark:bg-gray-900 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700'
                value={editQuoteName}
                onChange={e => setEditQuoteName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className='block font-medium mb-1'>估價金額：</label>
              <input
                type='number'
                className='border px-2 py-1 rounded w-full bg-white dark:bg-gray-900 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700'
                value={editQuotePrice}
                min={0}
                onChange={e => setEditQuotePrice(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label className='block font-medium mb-1'>客戶名稱：</label>
              <input
                type='text'
                className='border px-2 py-1 rounded w-full bg-white dark:bg-gray-900 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700'
                value={editClientName}
                onChange={e => setEditClientName(e.target.value)}
              />
            </div>
          </div>
          <div className='grid grid-cols-3 gap-4 mb-4'>
            <div>
              <label className='block font-medium mb-1'>聯絡人：</label>
              <input
                type='text'
                className='border px-2 py-1 rounded w-full bg-white dark:bg-gray-900 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700'
                value={editClientContact}
                onChange={e => setEditClientContact(e.target.value)}
              />
            </div>
            <div>
              <label className='block font-medium mb-1'>電話：</label>
              <input
                type='text'
                className='border px-2 py-1 rounded w-full bg-white dark:bg-gray-900 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700'
                value={editClientPhone}
                onChange={e => setEditClientPhone(e.target.value)}
              />
            </div>
            <div>
              <label className='block font-medium mb-1'>Email：</label>
              <input
                type='email'
                className='border px-2 py-1 rounded w-full bg-white dark:bg-gray-900 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700'
                value={editClientEmail}
                onChange={e => setEditClientEmail(e.target.value)}
              />
            </div>
          </div>
          <div className='mb-4'>
            <label className='block font-medium mb-2'>估價項目：</label>
            <table className='w-full border text-sm mb-2'>
              <thead>
                <tr className='bg-gray-100 dark:bg-gray-800'>
                  <th className='border px-2 py-1'>項目名稱</th>
                  <th className='border px-2 py-1'>金額</th>
                  <th className='border px-1 py-1'>數量</th>
                  <th className='border px-2 py-1 min-w-[90px]'>權重</th>
                  <th className='border px-2 py-1'>單價</th>
                  <th className='border px-1 py-1'></th>
                </tr>
              </thead>
              <tbody>
                {editQuoteItems.map((item, idx) => (
                  <tr key={idx}>
                    <td className='border px-2 py-1'>
                      <input
                        type='text'
                        className='border px-2 py-1 rounded w-full'
                        value={item.quoteItemId}
                        onChange={e =>
                          handleEditItemChange(idx, 'quoteItemId', e.target.value)
                        }
                        required
                      />
                    </td>
                    <td className='border px-2 py-1'>
                      <input
                        type='number'
                        className='border px-2 py-1 rounded w-full'
                        value={item.quoteItemPrice}
                        min={0}
                        onChange={e =>
                          handleEditItemChange(
                            idx,
                            'quoteItemPrice',
                            Number(e.target.value)
                          )
                        }
                        required
                      />
                    </td>
                    <td className='border px-1 py-1'>
                      <input
                        type='number'
                        className='border px-1 py-1 rounded w-full'
                        value={item.quoteItemQuantity}
                        min={1}
                        onChange={e =>
                          handleEditItemChange(
                            idx,
                            'quoteItemQuantity',
                            Number(e.target.value)
                          )
                        }
                        required
                      />
                    </td>
                    <td className='border px-2 py-1'>
                      <input
                        type='number'
                        className='border px-2 py-1 rounded w-full'
                        value={
                          item.quoteItemWeight ?? getWeight(item.quoteItemPrice)
                        }
                        min={0}
                        max={1}
                        step={0.01}
                        onChange={e =>
                          handleEditItemChange(
                            idx,
                            'quoteItemWeight',
                            Number(e.target.value)
                          )
                        }
                      />
                    </td>
                    <td className='border px-2 py-1 text-center'>
                      {getUnitPrice(item)}
                    </td>
                    <td className='border px-1 py-1 text-center'>
                      <button
                        type='button'
                        title='刪除'
                        className='text-red-500 p-0 m-0 leading-none text-lg'
                        onClick={() => removeEditItem(idx)}
                        disabled={editQuoteItems.length === 1}
                        style={{ lineHeight: 1 }}
                      >
                        🗑️
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
                        editQuoteItems.reduce(
                          (sum, item) =>
                            sum +
                            (item.quoteItemWeight ??
                              getWeight(item.quoteItemPrice)),
                          0
                        ) - 1
                      ) > 0.001
                        ? 'red'
                        : undefined,
                  }}
                >
                  {editQuoteItems
                    .reduce(
                      (sum, item) =>
                        sum +
                        (item.quoteItemWeight ?? getWeight(item.quoteItemPrice)),
                      0
                    )
                    .toFixed(2)}
                </span>
              </span>
              <span>
                <span className='font-bold'>項目總金額：</span>{' '}
                {editQuoteItems.reduce(
                  (sum, item) => sum + (item.quoteItemPrice || 0),
                  0
                )}
              </span>
            </div>
            <button
              type='button'
              className='px-3 py-1 bg-blue-500 text-white rounded mt-2'
              onClick={addEditItem}
            >
              新增項目
            </button>
          </div>
          <div className='mt-6 flex gap-2'>
            <button
              type='submit'
              className='px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700'
            >
              儲存
            </button>
            <button
              type='button'
              className='px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500'
              onClick={() => setEditing(false)}
            >
              取消
            </button>
          </div>
        </form>
      ) : (
        <div>
          <div className='grid grid-cols-3 gap-4 mb-4'>
            <div>
              <span className='font-bold'>估價單名稱：</span> {quoteName}
            </div>
            <div>
              <span className='font-bold'>估價金額：</span> {quotePrice}
            </div>
            <div>
              <span className='font-bold'>客戶名稱：</span> {clientName}
            </div>
          </div>
          <div className='grid grid-cols-3 gap-4 mb-4'>
            <div>
              <span className='font-bold'>聯絡人：</span> {clientContact}
            </div>
            <div>
              <span className='font-bold'>電話：</span> {clientPhone}
            </div>
            <div>
              <span className='font-bold'>Email：</span> {clientEmail}
            </div>
          </div>
          <div className='mb-4'>
            <label className='block font-medium mb-2'>估價項目：</label>
            <table className='w-full border text-sm mb-2'>
              <thead>
                <tr className='bg-gray-100 dark:bg-gray-800'>
                  <th className='border px-2 py-1'>項目名稱</th>
                  <th className='border px-2 py-1'>金額</th>
                  <th className='border px-1 py-1'>數量</th>
                  <th className='border px-2 py-1 min-w-[90px]'>權重</th>
                  <th className='border px-2 py-1'>單價</th>
                </tr>
              </thead>
              <tbody>
                {quoteItems.map((item, idx) => (
                  <tr key={idx}>
                    <td className='border px-2 py-1'>{item.quoteItemId}</td>
                    <td className='border px-2 py-1'>{item.quoteItemPrice}</td>
                    <td className='border px-1 py-1'>
                      {item.quoteItemQuantity}
                    </td>
                    <td className='border px-2 py-1'>
                      {(
                        item.quoteItemWeight ?? getWeight(item.quoteItemPrice)
                      ).toFixed(2)}
                    </td>
                    <td className='border px-2 py-1 text-center'>
                      {getUnitPrice(item)}
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
                          (sum, item) =>
                            sum +
                            (item.quoteItemWeight ??
                              getWeight(item.quoteItemPrice)),
                          0
                        ) - 1
                      ) > 0.001
                        ? 'red'
                        : undefined,
                  }}
                >
                  {quoteItems
                    .reduce(
                      (sum, item) =>
                        sum +
                        (item.quoteItemWeight ?? getWeight(item.quoteItemPrice)),
                      0
                    )
                    .toFixed(2)}
                </span>
              </span>
              <span>
                <span className='font-bold'>項目總金額：</span>{' '}
                {quoteItems.reduce(
                  (sum, item) => sum + (item.quoteItemPrice || 0),
                  0
                )}
              </span>
            </div>
          </div>
          <div className='mt-6 flex gap-2'>
            <button
              type='button'
              className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
              onClick={() => setEditing(true)}
            >
              編輯
            </button>
            <button
              type='button'
              className='px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500'
              onClick={() => router.push('/finance/quotes')}
            >
              返回
            </button>
          </div>
        </div>
      )}
    </main>
  );
}