'use client';

import { collection, DocumentData } from 'firebase/firestore';
import { ReactNode, useMemo, useState } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';

import { db } from '@/lib/firebase-client';

export interface Column<T> {
  key: keyof T | 'actions';
  label: string;
  sortable?: boolean;
  render?: (row: T) => ReactNode;
}

interface FinanceListPageProps<T> {
  title: string;
  collectionName: string;
  columns: Column<T>[];
  nameField: keyof T;
  clientField?: keyof T;
  processData?: (doc: DocumentData) => T;
}

export function FinanceListPage<T extends DocumentData>({
  title,
  collectionName,
  columns,
  nameField,
  clientField,
  processData,
}: FinanceListPageProps<T>) {
  const [snapshot, loading, error] = useCollection(
    collection(db, 'finance', 'default', collectionName)
  );

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string>('');
  const [sortAsc, setSortAsc] = useState(true);

  const rows = useMemo(() => {
    if (!snapshot) return [];
    
    let arr = snapshot.docs.map((doc, idx) => {
      const data = doc.data();
      const processed = processData ? processData(data) : (data as T);
      return {
        ...processed,
        docId: doc.id,
        idx: idx + 1,
      };
    });

    if (search.trim()) {
      const s = search.trim().toLowerCase();
      arr = arr.filter(r => {
        const nameMatch = String(r[nameField]).toLowerCase().includes(s);
        const clientMatch = clientField ? String(r[clientField]).toLowerCase().includes(s) : false;
        return nameMatch || clientMatch;
      });
    }

    if (sortKey) {
      arr = [...arr].sort((a, b) => {
        const valA = a[sortKey as keyof typeof a];
        const valB = b[sortKey as keyof typeof b];

        if (valA && typeof valA === 'object' && 'getTime' in valA && valB && typeof valB === 'object' && 'getTime' in valB) {
          return sortAsc ? (valA as Date).getTime() - (valB as Date).getTime() : (valB as Date).getTime() - (valA as Date).getTime();
        }
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortAsc ? valA - valB : valB - valA;
        }
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return 0;
      });
    }

    return arr;
  }, [snapshot, search, sortKey, sortAsc, nameField, clientField, processData]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };
  
  const renderCell = (row: T, column: Column<T>) => {
    if (column.render) {
      return column.render(row);
    }
    const value = row[column.key as keyof T];
    if (value && typeof value === 'object' && 'toLocaleDateString' in value) {
      return (value as Date).toLocaleDateString();
    }
    return value as ReactNode;
  };

  return (
    <main className='max-w-6xl mx-auto'>
      <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700'>
        <div className='p-6 border-b border-gray-200 dark:border-gray-700'>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>{title}</h1>
        </div>
        <div className='p-6'>
          <div className='mb-6'>
            <input
              type='text'
              className='w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-colors duration-200'
              placeholder={`搜尋${nameField.toString()}或客戶名稱`}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='bg-gray-50 dark:bg-gray-700/50'>
                  {columns.map(col => (
                    <th
                      key={String(col.key)}
                      className='px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 cursor-pointer'
                      onClick={() => col.sortable && handleSort(String(col.key))}
                    >
                      {col.label} {sortKey === col.key && (sortAsc ? '▲' : '▼')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
                {loading ? (
                  <tr>
                    <td colSpan={columns.length} className='px-4 py-8 text-center text-gray-500 dark:text-gray-400'>
                      載入中...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={columns.length} className='px-4 py-8 text-center text-red-500'>
                      {String(error)}
                    </td>
                  </tr>
                ) : rows.length > 0 ? (
                  rows.map(row => (
                    <tr
                      key={row.docId}
                      className='hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200'
                    >
                      {columns.map(col => (
                        <td key={String(col.key)} className='px-4 py-3 text-gray-900 dark:text-gray-100'>
                           {renderCell(row, col)}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className='px-4 py-8 text-center text-gray-500 dark:text-gray-400'>
                      尚無資料
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
} 