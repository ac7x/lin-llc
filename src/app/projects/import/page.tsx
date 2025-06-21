/**
 * 專案匯入頁面
 *
 * 提供從其他來源匯入專案的功能，包含：
 * - 合約匯入
 * - 訂單匯入
 * - 資料轉換
 * - 匯入預覽
 * - 匯入驗證
 */

'use client';

import { nanoid } from 'nanoid';
import { useState, useMemo } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';

import type { Workpackage } from '@/app/projects/types/project';
import { useAuth } from '@/hooks/useAuth';
import { db, collection, addDoc, Timestamp } from '@/lib/firebase-client';
import type { ContractItem } from '@/types/finance';
import {
  getErrorMessage,
  logError,
  safeAsync,
  retry,
} from '@/utils/errorUtils';


// 定義合約列型別
interface ContractRow {
  idx: number;
  id: string;
  name: string;
  createdAt: Date | null;
  raw: Record<string, unknown>;
}

export default function ImportProjectPage() {
  const { user } = useAuth();
  // 取得所有已建立專案的 contractId 清單，避免重複建立
  const [projectsSnapshot] = useCollection(collection(db, 'projects'));

  // 取得已建立專案的 contractId Set
  const existingContractIds = useMemo(() => {
    if (!projectsSnapshot) return new Set<string>();
    return new Set(
      projectsSnapshot.docs.map(doc => doc.data()?.contractId).filter((id): id is string => !!id)
    );
  }, [projectsSnapshot]);

  const [contractsSnapshot] = useCollection(collection(db, 'finance', 'default', 'contracts'));
  const [importingId, setImportingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');

  // 僅顯示尚未建立專案的合約
  const contractRows: ContractRow[] = useMemo(() => {
    if (!contractsSnapshot) return [];
    return contractsSnapshot.docs
      .filter(doc => {
        const data = doc.data();
        const contractId = (data.contractId as string) || doc.id;
        return !existingContractIds.has(contractId);
      })
      .map((doc, idx) => {
        const data = doc.data();
        return {
          idx: idx + 1,
          id: (data.contractId as string) || doc.id,
          name: (data.contractName as string) || (data.contractId as string) || doc.id,
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : data.createdAt
              ? new Date(data.createdAt)
              : null,
          raw: data,
        };
      });
  }, [contractsSnapshot, existingContractIds]);

  // 將合約項目轉換為工作包
  const convertContractItemsToWorkpackages = (contractItems: ContractItem[]): Workpackage[] => {
    if (!contractItems || !Array.isArray(contractItems) || contractItems.length === 0) {
      return [];
    }

    // 將合約項目轉換為工作包
    return contractItems.map(item => {
      const id = nanoid(8); // 使用 nanoid 生成唯一 ID

      // 注意：若 contractItemPrice 已為總價，budget 直接取用
      // 若 contractItemPrice 為單價，請改為 item.contractItemPrice * item.contractItemQuantity
      const workpackage: Workpackage = {
        id,
        name: String(item.contractItemId),
        description: `合約項目 ${item.contractItemId}`,
        status: 'planned' as import('@/app/projects/types/project').WorkpackageStatus,
        progress: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        budget: item.contractItemPrice, // 只取 contractItemPrice，避免重複計算
        category: '合約項目',
        priority: 'medium',
        subWorkpackages: [],
      };

      return workpackage;
    });
  };

  // 匯入合約建立專案
  const handleImport = async (row: ContractRow) => {
    setImportingId(row.id);
    setMessage('');
    await safeAsync(async () => {
      // 取得合約項目並轉換為工作包
      const contractItems = (row.raw.contractItems as ContractItem[]) || [];
      const workpackages = convertContractItemsToWorkpackages(contractItems);

      // 預設一個基本的分解資料，包含必要的節點欄位與可選欄位
      const decomposition = {
        nodes: [
          {
            id: 'root', // 節點唯一識別碼
            type: 'custom', // 可選欄位：節點類型
            position: { x: 0, y: 50 }, // 節點座標，x=0 貼齊左邊
            data: { label: row.name || '專案分解' }, // 自訂資料型別，至少含 label
            // ...其他可選欄位如 width, height 等...
          },
        ],
        edges: [],
      };
      const projectData = {
        projectName: row.name,
        contractId: row.id,
        owner: user?.uid || 'default', // 設置專案擁有者
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        status: 'planning' as import('@/app/projects/types/project').ProjectStatus,
        decomposition, // 專案分解資料
        workpackages, // 將合約項目轉換後的工作包列表
        // 初始化品質分數
        qualityScore: 10, // 初始品質分數為 10
        lastQualityAdjustment: Timestamp.now(), // 設置品質分數調整時間
      };
      await retry(() => addDoc(collection(db, 'projects'), projectData), 3, 1000);
      setMessage(`已成功由合約建立專案，合約ID: ${row.id}`);
    }, (error) => {
      setMessage(`建立失敗: ${getErrorMessage(error)}`);
      logError(error, { operation: 'import_project', contractId: row.id });
    });
    setImportingId(null);
  };

  return (
    <main className='max-w-4xl mx-auto'>
      <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
        <div className='flex justify-between items-center mb-6'>
          <h1 className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent'>
            從合約建立專案
          </h1>
        </div>

        {message && (
          <div className='mb-6 bg-blue-50 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 p-4 rounded-lg relative'>
            {message}
            <button
              className='absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200'
              onClick={() => setMessage('')}
              aria-label='關閉'
            >
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
          </div>
        )}

        <div className='overflow-x-auto'>
          <table className='w-full border-collapse'>
            <thead>
              <tr className='bg-gray-50 dark:bg-gray-900'>
                <th className='px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700'>
                  序號
                </th>
                <th className='px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700'>
                  合約名稱
                </th>
                <th className='px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700'>
                  建立日期
                </th>
                <th className='px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700'>
                  操作
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
              {contractRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className='px-4 py-8 text-center text-gray-500 dark:text-gray-400'
                  >
                    <div className='flex flex-col items-center justify-center'>
                      <svg
                        className='w-12 h-12 text-gray-400 dark:text-gray-500 mb-4'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                        />
                      </svg>
                      尚無合約
                    </div>
                  </td>
                </tr>
              ) : (
                contractRows.map(row => (
                  <tr
                    key={row.id}
                    className='hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-200'
                  >
                    <td className='px-4 py-3 text-sm text-gray-900 dark:text-gray-100'>
                      {row.idx}
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-900 dark:text-gray-100'>
                      {row.name}
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-900 dark:text-gray-100'>
                      {row.createdAt ? row.createdAt.toLocaleDateString() : '-'}
                    </td>
                    <td className='px-4 py-3 text-sm'>
                      <button
                        className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
                        disabled={!!importingId}
                        onClick={() => handleImport(row)}
                      >
                        {importingId === row.id ? (
                          <span className='flex items-center'>
                            <svg
                              className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
                              fill='none'
                              viewBox='0 0 24 24'
                            >
                              <circle
                                className='opacity-25'
                                cx='12'
                                cy='12'
                                r='10'
                                stroke='currentColor'
                                strokeWidth='4'
                              ></circle>
                              <path
                                className='opacity-75'
                                fill='currentColor'
                                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                              ></path>
                            </svg>
                            建立中...
                          </span>
                        ) : (
                          <span className='flex items-center'>
                            <svg
                              className='w-5 h-5 mr-2'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M12 4v16m8-8H4'
                              />
                            </svg>
                            建立專案
                          </span>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
