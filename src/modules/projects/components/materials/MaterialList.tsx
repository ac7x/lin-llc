/**
 * 材料列表組件
 * 
 * 提供專案材料的列表顯示和管理功能，包括：
 * - 材料列表顯示
 * - 篩選和搜尋
 * - 新增/編輯/刪除操作
 * - 統計資訊
 */

'use client';

import { useState, useMemo } from 'react';

import type { MaterialEntry } from '@/modules/projects/types/project';
import { projectStyles } from '@/modules/projects/styles';

interface MaterialListProps {
  materials: MaterialEntry[];
  projectId: string;
  onEdit: (material: MaterialEntry) => void;
  onDelete: (materialId: string) => Promise<void>;
  onAdd: () => void;
  isLoading?: boolean;
}

export default function MaterialList({
  materials,
  projectId,
  onEdit,
  onDelete,
  onAdd,
  isLoading = false,
}: MaterialListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'supplier'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // 統計資訊
  const stats = useMemo(() => {
    const total = materials.length;
    const totalQuantity = materials.reduce((sum, material) => sum + material.quantity, 0);
    const uniqueSuppliers = new Set(materials.map(material => material.supplier).filter(Boolean)).size;
    const uniqueUnits = new Set(materials.map(material => material.unit)).size;
    
    return { total, totalQuantity, uniqueSuppliers, uniqueUnits };
  }, [materials]);

  // 篩選和排序材料
  const filteredAndSortedMaterials = useMemo(() => {
    let filtered = materials.filter(material => {
      const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           material.materialId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           material.supplier.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesUnit = unitFilter === 'all' || material.unit === unitFilter;
      return matchesSearch && matchesUnit;
    });

    // 排序
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case 'supplier':
          aValue = a.supplier.toLowerCase();
          bValue = b.supplier.toLowerCase();
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
  }, [materials, searchTerm, unitFilter, sortBy, sortOrder]);

  // 獲取所有單位
  const units = useMemo(() => {
    const uniqueUnits = new Set(materials.map(material => material.unit));
    return Array.from(uniqueUnits).sort();
  }, [materials]);

  const handleSort = (field: 'name' | 'quantity' | 'supplier') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleDelete = async (materialId: string) => {
    if (confirm('確定要刪除此材料嗎？此操作無法復原。')) {
      try {
        await onDelete(materialId);
      } catch (error) {
        console.error('刪除材料時發生錯誤:', error);
      }
    }
  };

  return (
    <div className='space-y-6'>
      {/* 統計卡片 */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <div className={`${projectStyles.card.stats} ${projectStyles.card.statsColors.blue}`}>
          <div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
            {stats.total}
          </div>
          <div className='text-sm text-gray-600 dark:text-gray-400'>
            材料種類
          </div>
        </div>
        <div className={`${projectStyles.card.stats} ${projectStyles.card.statsColors.green}`}>
          <div className='text-2xl font-bold text-green-600 dark:text-green-400'>
            {stats.totalQuantity}
          </div>
          <div className='text-sm text-gray-600 dark:text-gray-400'>
            總數量
          </div>
        </div>
        <div className={`${projectStyles.card.stats} ${projectStyles.card.statsColors.yellow}`}>
          <div className='text-2xl font-bold text-yellow-600 dark:text-yellow-400'>
            {stats.uniqueSuppliers}
          </div>
          <div className='text-sm text-gray-600 dark:text-gray-400'>
            供應商
          </div>
        </div>
        <div className={`${projectStyles.card.stats} ${projectStyles.card.statsColors.indigo}`}>
          <div className='text-2xl font-bold text-indigo-600 dark:text-indigo-400'>
            {stats.uniqueUnits}
          </div>
          <div className='text-sm text-gray-600 dark:text-gray-400'>
            單位種類
          </div>
        </div>
      </div>

      {/* 控制列 */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div className='flex items-center space-x-4'>
          <input
            type='text'
            placeholder='搜尋材料...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={projectStyles.form.search}
          />
          <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className={projectStyles.form.select}
          >
            <option value='all'>所有單位</option>
            {units.map(unit => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </div>
        
        <button
          onClick={onAdd}
          className={projectStyles.button.primary}
          disabled={isLoading}
        >
          新增材料
        </button>
      </div>

      {/* 材料列表 */}
      <div className={projectStyles.card.base}>
        <div className='overflow-x-auto'>
          <table className={projectStyles.table.table}>
            <thead className={projectStyles.table.thead}>
              <tr>
                <th className={projectStyles.table.th}>
                  <button
                    onClick={() => handleSort('name')}
                    className='flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-300'
                  >
                    <span>材料名稱</span>
                    {sortBy === 'name' && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className={projectStyles.table.th}>材料編號</th>
                <th className={projectStyles.table.th}>
                  <button
                    onClick={() => handleSort('quantity')}
                    className='flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-300'
                  >
                    <span>數量</span>
                    {sortBy === 'quantity' && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className={projectStyles.table.th}>單位</th>
                <th className={projectStyles.table.th}>
                  <button
                    onClick={() => handleSort('supplier')}
                    className='flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-300'
                  >
                    <span>供應商</span>
                    {sortBy === 'supplier' && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className={projectStyles.table.th}>備註</th>
                <th className={projectStyles.table.th}>操作</th>
              </tr>
            </thead>
            <tbody className={projectStyles.table.tbody}>
              {filteredAndSortedMaterials.length === 0 ? (
                <tr>
                  <td colSpan={7} className='px-6 py-8 text-center text-gray-500 dark:text-gray-400'>
                    {searchTerm || unitFilter !== 'all' ? '沒有符合條件的材料' : '尚無材料記錄'}
                  </td>
                </tr>
              ) : (
                filteredAndSortedMaterials.map((material) => (
                  <tr key={material.id} className={projectStyles.table.rowHover}>
                    <td className={projectStyles.table.td}>
                      <div className='font-medium text-gray-900 dark:text-gray-100'>
                        {material.name}
                      </div>
                    </td>
                    <td className={projectStyles.table.td}>
                      <span className='text-sm text-gray-500 dark:text-gray-400'>
                        {material.materialId}
                      </span>
                    </td>
                    <td className={projectStyles.table.td}>
                      <span className='font-medium text-gray-900 dark:text-gray-100'>
                        {material.quantity}
                      </span>
                    </td>
                    <td className={projectStyles.table.td}>
                      <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'>
                        {material.unit}
                      </span>
                    </td>
                    <td className={projectStyles.table.td}>
                      {material.supplier ? (
                        <span className='text-sm text-gray-900 dark:text-gray-100'>
                          {material.supplier}
                        </span>
                      ) : (
                        <span className='text-sm text-gray-500 dark:text-gray-400'>
                          未指定
                        </span>
                      )}
                    </td>
                    <td className={projectStyles.table.td}>
                      {material.notes ? (
                        <div className='max-w-xs truncate' title={material.notes}>
                          <span className='text-sm text-gray-600 dark:text-gray-400'>
                            {material.notes}
                          </span>
                        </div>
                      ) : (
                        <span className='text-sm text-gray-500 dark:text-gray-400'>
                          -
                        </span>
                      )}
                    </td>
                    <td className={projectStyles.table.td}>
                      <div className='flex items-center space-x-2'>
                        <button
                          onClick={() => onEdit(material)}
                          className={projectStyles.button.edit}
                          title='編輯'
                        >
                          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(material.id)}
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

      {/* 單位統計 */}
      {units.length > 0 && (
        <div className={projectStyles.card.base}>
          <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-4'>
            單位統計
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {units.map(unit => {
              const unitMaterials = materials.filter(material => material.unit === unit);
              const totalQuantity = unitMaterials.reduce((sum, material) => sum + material.quantity, 0);
              
              return (
                <div key={unit} className='flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg'>
                  <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                    {unit}
                  </span>
                  <div className='text-right'>
                    <div className='text-sm font-semibold text-gray-900 dark:text-gray-100'>
                      {unitMaterials.length} 種
                    </div>
                    <div className='text-xs text-gray-500 dark:text-gray-400'>
                      總量: {totalQuantity}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
