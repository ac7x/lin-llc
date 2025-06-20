/**
 * JournalHistory.tsx
 *
 * 顯示專案工作日誌歷史列表的組件。
 */
'use client';

import Image from 'next/image';

import { ActivityLog, DailyReport, PhotoRecord } from '@/types/project';

interface JournalHistoryProps {
  reports: DailyReport[];
}

export default function JournalHistory({ reports }: JournalHistoryProps) {
  if (!reports || reports.length === 0) {
    return (
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500 dark:text-gray-400'>
        <div className='w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500 text-4xl'>📄</div>
        暫無工作日誌
      </div>
    );
  }

  return (
    <div className='bg-white dark:bg-gray-800 rounded-lg shadow'>
      <h2 className='text-xl font-bold p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent'>
        工作日誌列表
      </h2>
      <div className='divide-y divide-gray-200 dark:divide-gray-700'>
        {reports
          .slice() // 創建副本以避免直接修改 props
          .sort((a, b) => b.date.toDate().getTime() - a.date.toDate().getTime()) //
          .map(report => (
            <div key={report.id} className='p-6'>
              <div className='flex justify-between mb-2'>
                <h3 className='font-bold text-gray-900 dark:text-gray-100'>
                  {report.date.toDate().toLocaleDateString()}
                </h3>
                <div className='flex items-center gap-4'>
                  {typeof report.projectProgress === 'number' && (
                    <div className='flex items-center gap-2'>
                      <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                        專案進度:
                      </span>
                      <span className='text-sm text-blue-600 dark:text-blue-400'>
                        {report.projectProgress}%
                      </span>
                    </div>
                  )}
                  {report.weather && (
                    <span className='text-sm text-gray-500 dark:text-gray-400'>
                      {report.weather} {report.temperature}°C
                    </span>
                  )}
                </div>
              </div>
              <div className='mb-2'>
                <span className='font-medium text-gray-700 dark:text-gray-300'>出工人數:</span>{' '}
                {report.workforceCount}
              </div>
              <div className='mb-2'>
                <span className='font-medium text-gray-700 dark:text-gray-300'>工作內容:</span>
                <p className='text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap'>
                  {report.description}
                </p>
              </div>
              {report.activities && report.activities.length > 0 && (
                <div className='mb-2'>
                  <span className='font-medium text-gray-700 dark:text-gray-300'>
                    進度填報紀錄:
                  </span>
                  <ul className='text-gray-700 dark:text-gray-300 text-sm list-disc ml-6 mt-1'>
                    {report.activities.map((a: ActivityLog, i: number) => (
                      <li key={a.id || i}>
                        {a.description}：{a.progress}%
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {report.photos && report.photos.length > 0 && (
                <div className='mt-4'>
                  <h4 className='font-medium mb-2 text-gray-900 dark:text-gray-100'>照片記錄</h4>
                  <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2'>
                    {report.photos.map((photo: PhotoRecord) => (
                      <div
                        key={photo.id}
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
                            {photo.type}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
