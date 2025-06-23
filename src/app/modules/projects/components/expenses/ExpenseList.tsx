/**
 * 費用列表組件
 * 
 * 提供專案費用的列表顯示和管理功能，包括：
 * - 費用列表顯示
 * - 篩選和搜尋
 * - 新增/編輯/刪除操作
 * - 統計資訊
 */

'use client';

import type { Timestamp } from 'firebase/firestore';
import { useState, useMemo, type ReactElement } from 'react';

import { projectStyles } from '@/app/modules/projects/styles';
import type { Expense } from '@/app/modules/projects/types';

interface ExpenseListProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (expenseId: string) => Promise<void>;
  onAdd: () => void;
  isLoading?: boolean;
}

// 輔助函數：格式化日期
const formatDate = (dateField: Timestamp | Date | string | null | undefined): string => {
  if (!dateField) return '-';
  
  let date: Date;
  
  if (typeof dateField === 'string') {
    date = new Date(dateField);
  } else if (dateField instanceof Date) {
    date = dateField;
  } else if (typeof dateField === 'object' && 'toDate' in dateField) {
    date = dateField.toDate();
  } else {
    return '-';
  }
  
  return date.toLocaleDateString('zh-TW');
};

// 輔助函數：格式化金額
const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function ExpenseList({
  expenses,
  onEdit,
  onDelete,
  onAdd,
  isLoading = false,
}: ExpenseListProps): ReactElement {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 統計資訊
  const stats = useMemo(() => {
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const categories = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);
    
    return { total, categories };
  }, [expenses]);

  // 篩選和排序費用
  const filteredAndSortedExpenses = useMemo(() => {
    const filtered = expenses.filter(expense => {
      const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });

    // 排序
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'date':
          aValue = a.date instanceof Date ? a.date.getTime() : 
                   typeof a.date === 'string' ? new Date(a.date).getTime() :
                   a.date?.toDate?.()?.getTime() || 0;
          bValue = b.date instanceof Date ? b.date.getTime() : 
                   typeof b.date === 'string' ? new Date(b.date).getTime() :
                   b.date?.toDate?.()?.getTime() || 0;
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'category':
          aValue = a.category;
          bValue = b.category;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [expenses, searchTerm, categoryFilter, sortBy, sortOrder]);

  // 獲取所有類別
  const categories = useMemo(() => {
    const uniqueCategories = new Set(expenses.map(expense => expense.category));
    return Array.from(uniqueCategories).sort();
  }, [expenses]);

  const handleSort = (field: 'date' | 'amount' | 'category') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleDelete = async (expenseId: string) => {
    if (confirm('確定要刪除此費用嗎？此操作無法復原。')) {
      try {
        await onDelete(expenseId);
      } catch (error) {
        // 錯誤處理已由上層組件處理
      }
    }
  };

  return (
    <div className='space-y-6'>
      {/* 統計卡片 */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <div className={`${projectStyles.card.stats} ${projectStyles.card.statsColors.blue}`}>
          <div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
            {formatAmount(stats.total)}
          </div>
          <div className='text-sm text-gray-600 dark:text-gray-400'>
            總費用
          </div>
        </div>
        <div className={`${projectStyles.card.stats} ${projectStyles.card.statsColors.green}`}>
          <div className='text-2xl font-bold text-green-600 dark:text-green-400'>
            {expenses.length}
          </div>
          <div className='text-sm text-gray-600 dark:text-gray-400'>
            費用項目
          </div>
        </div>
        <div className={`${projectStyles.card.stats} ${projectStyles.card.statsColors.yellow}`}>
          <div className='text-2xl font-bold text-yellow-600 dark:text-yellow-400'>
            {categories.length}
          </div>
          <div className='text-sm text-gray-600 dark:text-gray-400'>
            費用類別
          </div>
        </div>
      </div>

      {/* 控制列 */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div className='flex items-center space-x-4'>
          <input
            type='text'
            placeholder='搜尋費用...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={projectStyles.form.search}
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={projectStyles.form.select}
          >
            <option value='all'>所有類別</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        
        <button
          onClick={onAdd}
          className={projectStyles.button.primary}
          disabled={isLoading}
        >
          新增費用
        </button>
      </div>

      {/* 費用列表 */}
      <div className={projectStyles.card.base}>
        <div className='overflow-x-auto'>
          <table className={projectStyles.table.table}>
            <thead className={projectStyles.table.thead}>
              <tr>
                <th className={projectStyles.table.th}>
                  <button
                    onClick={() => handleSort('date')}
                    className='flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-300'
                  >
                    <span>日期</span>
                    {sortBy === 'date' && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className={projectStyles.table.th}>
                  <button
                    onClick={() => handleSort('category')}
                    className='flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-300'
                  >
                    <span>類別</span>
                    {sortBy === 'category' && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className={projectStyles.table.th}>描述</th>
                <th className={projectStyles.table.th}>
                  <button
                    onClick={() => handleSort('amount')}
                    className='flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-300'
                  >
                    <span>金額</span>
                    {sortBy === 'amount' && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className={projectStyles.table.th}>操作</th>
              </tr>
            </thead>
            <tbody className={projectStyles.table.tbody}>
              {filteredAndSortedExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className='px-6 py-8 text-center text-gray-500 dark:text-gray-400'>
                    {searchTerm || categoryFilter !== 'all' ? '沒有符合條件的費用' : '尚無費用記錄'}
                  </td>
                </tr>
              ) : (
                filteredAndSortedExpenses.map((expense) => (
                  <tr key={expense.id} className={projectStyles.table.rowHover}>
                    <td className={projectStyles.table.td}>
                      {formatDate(expense.date)}
                    </td>
                    <td className={projectStyles.table.td}>
                      <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'>
                        {expense.category}
                      </span>
                    </td>
                    <td className={projectStyles.table.td}>
                      <div className='max-w-xs truncate' title={expense.description}>
                        {expense.description}
                      </div>
                    </td>
                    <td className={projectStyles.table.td}>
                      <span className='font-medium text-gray-900 dark:text-gray-100'>
                        {formatAmount(expense.amount)}
                      </span>
                    </td>
                    <td className={projectStyles.table.td}>
                      <div className='flex items-center space-x-2'>
                        <button
                          onClick={() => onEdit(expense)}
                          className={projectStyles.button.edit}
                          title='編輯'
                        >
                          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className='p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200'
                          title='刪除'
                        >
                          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 類別統計 */}
      {categories.length > 0 && (
        <div className={projectStyles.card.base}>
          <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-4'>
            費用類別統計
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {categories.map(category => (
              <div key={category} className='flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg'>
                <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                  {category}
                </span>
                <span className='text-sm font-semibold text-gray-900 dark:text-gray-100'>
                  {formatAmount(stats.categories[category] || 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
