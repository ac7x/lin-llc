/**
 * 專案材料管理頁面
 *
 * 提供專案材料的管理功能，包含：
 * - 材料清單管理
 * - 材料數量追蹤
 * - 材料成本計算
 * - 材料使用記錄
 * - 材料庫存管理
 */

'use client';

import { Timestamp, arrayUnion } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import { useState, useMemo } from 'react';
import { useDocument } from 'react-firebase-hooks/firestore';

import { Project , MaterialEntry } from '@/app/projects/types/project';
import { useAuth } from '@/hooks/useAuth';
import { db, doc, updateDoc } from '@/lib/firebase-client';
import { getErrorMessage, logError, safeAsync, retry } from '@/utils/errorUtils';

export default function ProjectMaterialsPage() {
  useAuth();
  const params = useParams();
  const projectId = params?.project as string;
  const [projectDoc, loading, error] = useDocument(doc(db, 'projects', projectId));

  const [newMaterial, setNewMaterial] = useState<{
    name: string;
    quantity: number;
    unit: string;
    supplier: string;
    notes: string;
  }>({
    name: '',
    quantity: 0,
    unit: '個',
    supplier: '',
    notes: '',
  });

  const [saving, setSaving] = useState(false);

  // 從 Firestore 獲取材料數據
  const materials = useMemo(() => {
    if (!projectDoc?.exists()) return [];
    const project = projectDoc.data() as Project;
    return project.materials || [];
  }, [projectDoc]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || !newMaterial.name) return;

    setSaving(true);
    
    await safeAsync(async () => {
      const materialEntry: MaterialEntry = {
        materialId: Timestamp.now().toMillis().toString(),
        name: newMaterial.name,
        quantity: newMaterial.quantity,
        unit: newMaterial.unit,
        supplier: newMaterial.supplier,
        notes: newMaterial.notes,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // 如果專案尚未有材料陣列，初始化一個
      if (!projectDoc?.data()?.materials) {
        await retry(() => updateDoc(doc(db, 'projects', projectId), {
          materials: [materialEntry],
        }), 3, 1000);
      } else {
        // 添加新材料到陣列
        await retry(() => updateDoc(doc(db, 'projects', projectId), {
          materials: arrayUnion(materialEntry),
        }), 3, 1000);
      }

      setNewMaterial({
        name: '',
        quantity: 0,
        unit: '個',
        supplier: '',
        notes: '',
      });

      alert('材料記錄已成功添加！');
    }, (error) => {
      alert(`保存材料記錄時出錯：${getErrorMessage(error)}`);
      logError(error, { operation: 'add_material', projectId });
    });
    
    setSaving(false);
  };

  if (loading)
    return (
      <div className='p-4 text-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto'></div>
      </div>
    );
  if (error) return <div className='p-4 text-red-500'>錯誤: {error.message}</div>;
  if (!projectDoc?.exists()) return <div className='p-4'>找不到專案</div>;

  return (
    <main className='max-w-4xl mx-auto'>
      <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
        <div className='flex justify-between items-center mb-6'>
          <div>
            <h1 className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent'>
              專案材料記錄
            </h1>
            <p className='text-gray-600 dark:text-gray-400 mt-2'>追蹤和管理專案使用的材料</p>
          </div>
        </div>

        <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6'>
          <h2 className='text-xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent'>
            記錄新材料
          </h2>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  材料名稱<span className='text-red-500'>*</span>
                </label>
                <input
                  type='text'
                  className='w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                  value={newMaterial.name}
                  onChange={e => setNewMaterial({ ...newMaterial, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  供應商
                </label>
                <input
                  type='text'
                  className='w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                  value={newMaterial.supplier}
                  onChange={e => setNewMaterial({ ...newMaterial, supplier: e.target.value })}
                />
              </div>
            </div>

            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              <div className='col-span-1 md:col-span-2'>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  數量
                </label>
                <input
                  type='number'
                  className='w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                  value={newMaterial.quantity}
                  onChange={e =>
                    setNewMaterial({ ...newMaterial, quantity: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className='col-span-1 md:col-span-2'>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  單位
                </label>
                <select
                  className='w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                  value={newMaterial.unit}
                  onChange={e => setNewMaterial({ ...newMaterial, unit: e.target.value })}
                >
                  <option value='個'>個</option>
                  <option value='箱'>箱</option>
                  <option value='公斤'>公斤</option>
                  <option value='公噸'>公噸</option>
                  <option value='立方米'>立方米</option>
                  <option value='平方米'>平方米</option>
                  <option value='公尺'>公尺</option>
                  <option value='件'>件</option>
                </select>
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                備註
              </label>
              <textarea
                className='w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 h-24'
                value={newMaterial.notes}
                onChange={e => setNewMaterial({ ...newMaterial, notes: e.target.value })}
                placeholder='材料的其他說明、特性、用途等'
              />
            </div>

            <button
              type='submit'
              className='w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
              disabled={saving || !newMaterial.name}
            >
              {saving ? (
                <span className='flex items-center justify-center'>
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
                  保存中...
                </span>
              ) : (
                '記錄材料'
              )}
            </button>
          </form>
        </div>

        <div className='bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden'>
          <h2 className='text-xl font-bold p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent'>
            材料記錄列表
          </h2>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50 dark:bg-gray-900'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider'>
                    材料名稱
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider'>
                    數量
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider'>
                    供應商
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider'>
                    備註
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
                {materials && materials.length > 0 ? (
                  materials.map(material => (
                    <tr
                      key={material.materialId}
                      className='hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-200'
                    >
                      <td className='px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100'>
                        {material.name}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100'>
                        {material.quantity} {material.unit}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100'>
                        {material.supplier || '-'}
                      </td>
                      <td className='px-6 py-4 text-gray-900 dark:text-gray-100'>
                        {material.notes || '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className='px-6 py-8 text-center text-gray-500 dark:text-gray-400'
                    >
                      <div className='flex flex-col items-center'>
                        <svg
                          className='w-12 h-12 mb-4 text-gray-400 dark:text-gray-500'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
                          />
                        </svg>
                        暫無材料記錄
                      </div>
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
