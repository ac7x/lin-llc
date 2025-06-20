'use client';

import { nanoid } from 'nanoid';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { db, doc, setDoc, Timestamp } from '@/lib/firebase-client';
import { OrderItem } from '@/types/finance';

export default function OrderAddPage() {
  const router = useRouter();
  const [clientName, setClientName] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [orderName, setOrderName] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    { orderItemId: '', orderItemPrice: 0, orderItemQuantity: 1 },
  ]);

  // 項目總價與自動計算
  const getOrderItemPrice = (quantity: number, unitPrice: number) =>
    Number((quantity * unitPrice).toFixed(2));
  const totalOrderItemPrice = Number(
    orderItems.reduce((sum, item) => sum + (item.orderItemPrice || 0), 0).toFixed(2)
  );
  const orderPrice = totalOrderItemPrice;

  // 權重與百分比
  const getWeight = (price: number) => Number((orderPrice ? price / orderPrice : 0).toFixed(4));
  const getPercent = (price: number) =>
    orderPrice ? ((price / orderPrice) * 100).toFixed(2) : '0.00';

  // 單價與自動計算
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

  // 項目操作
  const handleItemChange = (idx: number, key: keyof OrderItem, value: string | number) => {
    setOrderItems(items =>
      items.map((item, i) => {
        if (i !== idx) return item;

        const updated = { ...item, [key]: value };
        // 當數量改變時，保持單價不變並重新計算總價
        if (key === 'orderItemQuantity') {
          const unitPrice = getUnitPrice(item);
          updated.orderItemPrice = getOrderItemPrice(Number(value) || 0, unitPrice);
        }
        return updated;
      })
    );
  };
  const addItem = () =>
    setOrderItems([...orderItems, { orderItemId: '', orderItemPrice: 0, orderItemQuantity: 1 }]);
  const removeItem = (idx: number) => setOrderItems(items => items.filter((_, i) => i !== idx));

  // 處理送出
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const orderId = nanoid(5);
      const now = new Date();
      await setDoc(doc(db, 'finance', 'default', 'orders', orderId), {
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
      });
      router.push('/orders');
    } catch (err) {
      alert(`新增訂單失敗: ${  err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <main className='max-w-xl mx-auto px-4 py-8'>
      <h1 className='text-2xl font-bold mb-4'>新增訂單</h1>
      <form onSubmit={handleSubmit}>
        {/* 訂單名稱、訂單金額、客戶名稱同一行 */}
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
        {/* 客戶聯絡人、聯絡電話、郵箱同一行 */}
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

        {/* 訂單項目 */}
        <div className='mb-4'>
          <label className='block font-medium mb-1'>訂單項目：</label>
          <table className='w-full border text-sm mb-2 border-gray-300 dark:border-gray-700'>
            <thead>
              <tr className='bg-gray-100 dark:bg-gray-800'>
                <th className='border px-2 py-1 border-gray-300 dark:border-gray-700'>項目名稱</th>
                <th className='border px-2 py-1 border-gray-300 dark:border-gray-700'>項目金額</th>
                <th className='border px-2 py-1 border-gray-300 dark:border-gray-700'>項目數量</th>
                <th className='border px-2 py-1 border-gray-300 dark:border-gray-700'>項目單價</th>
                <th className='border px-2 py-1 border-gray-300 dark:border-gray-700'>項目權重</th>
                <th className='border px-2 py-1 border-gray-300 dark:border-gray-700'>項目佔比</th>
                <th className='border px-2 py-1 border-gray-300 dark:border-gray-700'>操作</th>
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
                      onChange={e => handleItemChange(idx, 'orderItemId', e.target.value)}
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
                        handleItemChange(idx, 'orderItemPrice', Number(e.target.value))
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
                        handleItemChange(idx, 'orderItemQuantity', Number(e.target.value))
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
            onClick={() => router.push('/orders')}
          >
            返回列表
          </button>
        </div>
      </form>
    </main>
  );
}
