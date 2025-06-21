/**
 * 專案模板管理頁面
 * 
 * 提供專案模板的管理功能，包括：
 * - 模板列表顯示
 * - 模板創建
 * - 模板編輯
 * - 模板刪除
 * - 模板應用
 */

'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { PageContainer, PageHeader } from '@/modules/test-projects/components/common';
import { TemplateService } from '@/modules/test-projects/services/templateService';
import { projectStyles } from '@/modules/test-projects/styles';
import type { Template } from '@/modules/test-projects/types/project';

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 載入模板資料
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setIsLoading(true);
        const templatesData = await TemplateService.getAllTemplates();
        setTemplates(templatesData);
      } catch (error) {
        console.error('載入模板失敗:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplates();
  }, []);

  // 篩選模板
  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // 獲取所有分類
  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))];

  const handleCreateTemplate = () => {
    router.push('/projects/templates/create');
  };

  const handleEditTemplate = (templateId: string) => {
    router.push(`/projects/templates/${templateId}/edit`);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (confirm('確定要刪除此模板嗎？此操作無法復原。')) {
      try {
        await TemplateService.deleteTemplate(templateId);
        setTemplates(templates.filter(t => t.id !== templateId));
      } catch (error) {
        console.error('刪除模板失敗:', error);
        alert('刪除模板失敗');
      }
    }
  };

  const handleApplyTemplate = (templateId: string) => {
    router.push(`/projects/generate-from-contract?template=${templateId}`);
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className='flex items-center justify-center h-64'>
          <div className='text-gray-500 dark:text-gray-400'>載入中...</div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title='專案模板'
        subtitle='管理和應用專案模板'
      >
        <button
          onClick={handleCreateTemplate}
          className={projectStyles.button.primary}
        >
          新增模板
        </button>
      </PageHeader>

      <div className='space-y-6'>
        {/* 篩選和搜尋 */}
        <div className={projectStyles.card.base}>
          <div className='flex flex-col sm:flex-row gap-4'>
            {/* 分類篩選 */}
            <div className='flex-1'>
              <label htmlFor='category' className={projectStyles.form.label}>
                分類
              </label>
              <select
                id='category'
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={projectStyles.form.select}
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? '全部' : category}
                  </option>
                ))}
              </select>
            </div>

            {/* 搜尋 */}
            <div className='flex-1'>
              <label htmlFor='search' className={projectStyles.form.label}>
                搜尋
              </label>
              <input
                id='search'
                type='text'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={projectStyles.form.input}
                placeholder='搜尋模板名稱或描述...'
              />
            </div>
          </div>
        </div>

        {/* 模板列表 */}
        <div className={projectStyles.card.base}>
          <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-4'>
            模板列表 ({filteredTemplates.length})
          </h3>

          {filteredTemplates.length === 0 ? (
            <div className='text-center py-12'>
              <div className='text-gray-500 dark:text-gray-400 mb-4'>
                沒有找到符合條件的模板
              </div>
              <button
                onClick={handleCreateTemplate}
                className={projectStyles.button.outline}
              >
                建立第一個模板
              </button>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {filteredTemplates.map(template => (
                <div
                  key={template.id}
                  className='border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow duration-200'
                >
                  {/* 模板標題和分類 */}
                  <div className='flex justify-between items-start mb-4'>
                    <div>
                      <h4 className='font-medium text-gray-900 dark:text-gray-100 mb-1'>
                        {template.name}
                      </h4>
                      <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'>
                        {template.category}
                      </span>
                    </div>
                  </div>

                  {/* 模板描述 */}
                  <p className='text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3'>
                    {template.description}
                  </p>

                  {/* 模板統計 */}
                  <div className='flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4'>
                    <span>
                      子工作包: {template.subWorkpackages?.length || 0}
                    </span>
                    <span>
                      建立者: {template.createdBy}
                    </span>
                  </div>

                  {/* 建立時間 */}
                  <div className='text-xs text-gray-500 dark:text-gray-400 mb-4'>
                    建立於: {(() => {
                      if (template.createdAt instanceof Date) {
                        return template.createdAt.toLocaleDateString();
                      }
                      if (typeof template.createdAt === 'object' && template.createdAt?.toDate) {
                        return template.createdAt.toDate().toLocaleDateString();
                      }
                      return '未知';
                    })()}
                  </div>

                  {/* 操作按鈕 */}
                  <div className='flex space-x-2'>
                    <button
                      onClick={() => handleApplyTemplate(template.id)}
                      className='flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200'
                    >
                      應用
                    </button>
                    <button
                      onClick={() => handleEditTemplate(template.id)}
                      className='px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors duration-200'
                    >
                      編輯
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className='px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-colors duration-200'
                    >
                      刪除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 模板使用說明 */}
        <div className={projectStyles.card.base}>
          <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-4'>
            如何使用模板
          </h3>
          
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='text-center'>
              <div className='w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3'>
                <span className='text-blue-600 dark:text-blue-400 font-semibold'>1</span>
              </div>
              <h4 className='font-medium text-gray-900 dark:text-gray-100 mb-2'>
                選擇模板
              </h4>
              <p className='text-sm text-gray-600 dark:text-gray-400'>
                從現有模板中選擇適合的專案結構
              </p>
            </div>
            
            <div className='text-center'>
              <div className='w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3'>
                <span className='text-blue-600 dark:text-blue-400 font-semibold'>2</span>
              </div>
              <h4 className='font-medium text-gray-900 dark:text-gray-100 mb-2'>
                應用模板
              </h4>
              <p className='text-sm text-gray-600 dark:text-gray-400'>
                點擊「應用」按鈕，自動生成專案結構
              </p>
            </div>
            
            <div className='text-center'>
              <div className='w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3'>
                <span className='text-blue-600 dark:text-blue-400 font-semibold'>3</span>
              </div>
              <h4 className='font-medium text-gray-900 dark:text-gray-100 mb-2'>
                自訂調整
              </h4>
              <p className='text-sm text-gray-600 dark:text-gray-400'>
                根據實際需求調整專案細節
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
