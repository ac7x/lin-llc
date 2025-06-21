/**
 * 新增報價單頁面
 *
 * 提供建立新報價單的功能，包含：
 * - 報價單基本資訊輸入
 * - 報價項目動態新增/刪除
 * - 自動計算單價和總價
 * - 表單驗證
 * - 即時儲存
 */

'use client';

import { doc, setDoc } from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase-client';
import { QuoteItem } from '@/types/finance';


export default function QuoteAddPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [quoteName, setQuoteName] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [quotePrice, setQuotePrice] = useState<number>(0);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([
    { quoteItemId: '', quoteItemPrice: 0, quoteItemQuantity: 1, quoteItemWeight: 0 },
  ]);

  // 項目總價
  const totalQuoteItemPrice = Number(
    quoteItems.reduce((sum, item) => sum + (item.quoteItemPrice || 0), 0).toFixed(2)
  );

  // 單價自動計算
  const getUnitPrice = (item: QuoteItem) =>
    Number((item.quoteItemQuantity ? item.quoteItemPrice / item.quoteItemQuantity : 0).toFixed(2));

  // 欄位變動時自動計算
  const handleItemChange = (idx: number, key: keyof QuoteItem, value: string | number) => {
    setQuoteItems(items =>
      items.map((item, i) => {
        if (i !== idx) return item;
        const newItem = { ...item, [key]: value };
        // 權重變動時自動算金額
        if (key === 'quoteItemWeight' && typeof value === 'number' && quotePrice > 0) {
          newItem.quoteItemPrice = Number(((value as number) * quotePrice).toFixed(2));
        }
        // 金額變動時自動算權重
        if (key === 'quoteItemPrice' && typeof value === 'number' && quotePrice > 0) {
          newItem.quoteItemWeight = Number(((value as number) / quotePrice).toFixed(4));
        }
        return newItem;
      })
    );
  };
  const addItem = () =>
    setQuoteItems([
      ...quoteItems,
      { quoteItemId: '', quoteItemPrice: 0, quoteItemQuantity: 1, quoteItemWeight: 0 },
    ]);
  const removeItem = (idx: number) => setQuoteItems(items => items.filter((_, i) => i !== idx));

  // 處理送出
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const quoteId = nanoid();
      await setDoc(doc(db, 'finance', 'default', 'quotes', quoteId), {
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
      });
      router.push('/quotes');
    } catch (_error) {
      alert('建立報價單失敗，請稍後再試');
    }
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
          {/* 客戶聯絡資訊 */}
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
          {/* 估價項目列表 */}
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
                        onChange={e => handleItemChange(idx, 'quoteItemId', e.target.value)}
                      />
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700'>
                      <input
                        type='number'
                        className='w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                        value={item.quoteItemPrice}
                        onChange={e => handleItemChange(idx, 'quoteItemPrice', Number(e.target.value))}
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
                        onChange={e => handleItemChange(idx, 'quoteItemQuantity', Number(e.target.value))}
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
                        onChange={e => handleItemChange(idx, 'quoteItemWeight', Number(e.target.value))}
                      />
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700'>{getUnitPrice(item)}</td>
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
            {/* 權重總和與總金額同一行，貼齊表格右側 */}
            <div className='mt-2 flex justify-end gap-4 text-sm'>
              <span>
                <span className='font-bold'>權重總和：</span>
                <span
                  style={{
                    color:
                      Math.abs(
                        quoteItems.reduce((sum, item) => sum + (item.quoteItemWeight ?? 0), 0) - 1
                      ) > 0.001
                        ? 'red'
                        : undefined,
                  }}
                >
                  {quoteItems.reduce((sum, item) => sum + (item.quoteItemWeight ?? 0), 0).toFixed(2)}
                </span>
              </span>
              <span>
                <span className='font-bold'>項目總金額：</span> {totalQuoteItemPrice}
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
                onClick={() => router.push('/quotes')}
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
