/**
 * 日誌歷史組件
 * 
 * 顯示專案日誌的歷史記錄，包括：
 * - 日誌條目列表
 * - 時間軸顯示
 * - 篩選和搜尋
 * - 分類統計
 * - 照片記錄
 * - 進度更新
 * - 天氣資訊
 */

'use client';

import { useState, useMemo, type ReactElement } from 'react';
import Image from 'next/image';

import { projectStyles } from '@/app/modules/projects/styles';
import type { BaseWithId, DailyReport, ActivityLog, PhotoRecord } from '@/app/modules/projects/types';
import { convertToDate } from '@/app/modules/projects/types';

type SortOption = 'date' | 'title' | 'priority' | 'category';
type SortDirection = 'asc' | 'desc';

interface JournalHistoryProps {
  reports: DailyReport[];
  onViewDetails?: (reportId: string) => void;
  onEdit?: (report: DailyReport) => void;
  onDelete?: (reportId: string) => void;
}

export default function JournalHistory({
  reports,
  onViewDetails,
  onEdit,
  onDelete,
}: JournalHistoryProps): ReactElement {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // 計算統計資訊
  const stats = useMemo(() => {
    const total = reports.length;
    const categories = reports.reduce((acc, report) => {
      const category = report.description ? 'progress' : 'general';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalWorkforce = reports.reduce((sum, report) => sum + (report.workforceCount || 0), 0);
    const avgWorkforce = total > 0 ? Math.round(totalWorkforce / total) : 0;

    return { total, categories, totalWorkforce, avgWorkforce };
  }, [reports]);

  // 篩選和排序日誌
  const filteredAndSortedReports = useMemo(() => {
    let filtered = reports;

    // 搜尋篩選
    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (typeof report.issues === 'string' && report.issues.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // 分類篩選
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(report => {
        const category = report.description ? 'progress' : 'general';
        return category === categoryFilter;
      });
    }

    // 按日期排序（最新的在前）
    return filtered.sort((a, b) => {
      const dateA = convertToDate(a.date);
      const dateB = convertToDate(b.date);
      return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
    });
  }, [reports, searchTerm, categoryFilter]);

  const formatDate = (date: any) => {
    const dateObj = convertToDate(date);
    if (!dateObj) return 'N/A';
    return dateObj.toLocaleDateString('zh-TW');
  };

  const formatTime = (date: any) => {
    const dateObj = convertToDate(date);
    if (!dateObj) return '';
    return dateObj.toLocaleTimeString('zh-TW', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'issue':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'milestone':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'decision':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'meeting':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getCategoryText = (category?: string) => {
    switch (category) {
      case 'progress':
        return '進度更新';
      case 'issue':
        return '問題記錄';
      case 'milestone':
        return '里程碑';
      case 'decision':
        return '決策記錄';
      case 'meeting':
        return '會議記錄';
      default:
        return '一般記錄';
    }
  };

  const getPhotoTypeText = (type: string) => {
    switch (type) {
      case 'progress':
        return '進度照片';
      case 'issue':
        return '問題照片';
      case 'material':
        return '材料照片';
      case 'safety':
        return '安全照片';
      case 'other':
        return '其他照片';
      default:
        return '照片';
    }
  };

  if (!reports || reports.length === 0) {
    return (
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500 dark:text-gray-400'>
        <div className='w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500 text-4xl'>📄</div>
        暫無工作日誌
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* 統計卡片 */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <div className={`${projectStyles.card.stats} ${projectStyles.card.statsColors.blue}`}>
          <div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
            {stats.total}
          </div>
          <div className='text-sm text-gray-600 dark:text-gray-400'>
            總日誌數
          </div>
        </div>
        <div className={`${projectStyles.card.stats} ${projectStyles.card.statsColors.green}`}>
          <div className='text-2xl font-bold text-green-600 dark:text-green-400'>
            {stats.totalWorkforce}
          </div>
          <div className='text-sm text-gray-600 dark:text-gray-400'>
            總出工人數
          </div>
        </div>
        <div className={`${projectStyles.card.stats} ${projectStyles.card.statsColors.orange}`}>
          <div className='text-2xl font-bold text-orange-600 dark:text-orange-400'>
            {stats.avgWorkforce}
          </div>
          <div className='text-sm text-gray-600 dark:text-gray-400'>
            平均出工人數
          </div>
        </div>
        <div className={`${projectStyles.card.stats} border-purple-200 dark:border-purple-800`}>
          <div className='text-2xl font-bold text-purple-600 dark:text-purple-400'>
            {reports.filter(r => r.photos && r.photos.length > 0).length}
          </div>
          <div className='text-sm text-gray-600 dark:text-gray-400'>
            有照片記錄
          </div>
        </div>
      </div>

      {/* 控制列 */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div className='flex items-center space-x-4'>
          <input
            type='text'
            placeholder='搜尋日誌...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={projectStyles.form.search}
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={projectStyles.form.select}
          >
            <option value='all'>所有分類</option>
            <option value='progress'>進度更新</option>
            <option value='general'>一般記錄</option>
          </select>
        </div>
      </div>

      {/* 日誌列表 */}
      <div className='space-y-4'>
        {filteredAndSortedReports.length === 0 ? (
          <div className='text-center py-8 text-gray-500 dark:text-gray-400'>
            {searchTerm || categoryFilter !== 'all' ? '沒有符合條件的日誌' : '尚無日誌記錄'}
          </div>
        ) : (
          filteredAndSortedReports.map((report) => (
            <div key={report.id} className={`${projectStyles.card.base} hover:shadow-md transition-shadow duration-200`}>
              <div className='flex justify-between items-start mb-4'>
                <div className='flex-1'>
                  <div className='flex items-center gap-2 mb-1'>
                    <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                      工作日誌 - {formatDate(report.date)}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor('progress')}`}>
                      進度更新
                    </span>
                  </div>
                  
                  <div className='flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-2'>
                    <span>{formatDate(report.date)} {formatTime(report.date)}</span>
                    <span>出工人數: {report.workforceCount || 0}</span>
                    {report.weather && (
                      <span>{report.weather} {report.temperature}°C</span>
                    )}
                    {report.projectProgress !== undefined && (
                      <span>專案進度: {report.projectProgress}%</span>
                    )}
                  </div>
                </div>
                
                <div className='flex items-center space-x-2'>
                  {onViewDetails && (
                    <button
                      onClick={() => onViewDetails(report.id)}
                      className={projectStyles.button.small}
                      title='查看詳情'
                    >
                      詳情
                    </button>
                  )}
                  {onEdit && (
                    <button
                      onClick={() => onEdit(report)}
                      className={projectStyles.button.edit}
                      title='編輯'
                    >
                      <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                      </svg>
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(report.id)}
                      className='p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200'
                      title='刪除'
                    >
                      <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* 工作內容 */}
              {report.description && (
                <div className='mb-4'>
                  <h4 className='font-medium text-gray-700 dark:text-gray-300 mb-2'>工作內容</h4>
                  <p className='text-gray-600 dark:text-gray-400 whitespace-pre-wrap'>
                    {report.description}
                  </p>
                </div>
              )}

              {/* 問題記錄 */}
              {report.issues && typeof report.issues === 'string' && (
                <div className='mb-4'>
                  <h4 className='font-medium text-gray-700 dark:text-gray-300 mb-2'>問題記錄</h4>
                  <p className='text-gray-600 dark:text-gray-400 whitespace-pre-wrap'>
                    {report.issues}
                  </p>
                </div>
              )}

              {/* 進度填報紀錄 */}
              {report.activities && report.activities.length > 0 && (
                <div className='mb-4'>
                  <h4 className='font-medium text-gray-700 dark:text-gray-300 mb-2'>進度填報紀錄</h4>
                  <ul className='text-gray-600 dark:text-gray-400 text-sm list-disc ml-6 space-y-1'>
                    {report.activities.map((activity: ActivityLog, i: number) => (
                      <li key={`${report.id}_activity_${activity.id || i}`}>
                        {activity.description}：{activity.progress}% - {activity.notes}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 照片記錄 */}
              {report.photos && report.photos.length > 0 && (
                <div className='mb-4'>
                  <h4 className='font-medium text-gray-700 dark:text-gray-300 mb-2'>照片記錄 ({report.photos.length})</h4>
                  <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2'>
                    {report.photos.map((photo: PhotoRecord) => (
                      <div
                        key={`${report.id}_photo_${photo.id}`}
                        className='border rounded-lg overflow-hidden bg-white dark:bg-gray-900'
                      >
                        <Image
                          src={photo.url}
                          alt={photo.description}
                          width={300}
                          height={200}
                          className='w-full h-24 object-cover'
                        />
                        <div className='p-2 text-xs'>
                          <p className='truncate text-gray-900 dark:text-gray-100'>
                            {photo.description}
                          </p>
                          <p className='text-gray-500 dark:text-gray-400 capitalize'>
                            {getPhotoTypeText(photo.type)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 天氣資訊 */}
              {(report.weather || report.temperature !== undefined || report.rainfall !== undefined) && (
                <div className='mb-4'>
                  <h4 className='font-medium text-gray-700 dark:text-gray-300 mb-2'>天氣資訊</h4>
                  <div className='flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400'>
                    {report.weather && <span>天氣: {report.weather}</span>}
                    {report.temperature !== undefined && <span>溫度: {report.temperature}°C</span>}
                    {report.rainfall !== undefined && <span>降雨量: {report.rainfall}mm</span>}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
