/**
 * 專案日誌頁面
 *
 * 提供專案進度記錄和日誌功能，包含：
 * - 日誌記錄
 * - 照片上傳
 * - 天氣資訊整合
 * - 進度追蹤
 * - 歷史記錄
 */

'use client';

import { useParams } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react';
import { useDocument } from 'react-firebase-hooks/firestore';

import WeatherDisplay, {
  fetchWeather,
  WeatherData,
} from '@/app/projects/components/WeatherDisplay';
import { Project } from '@/app/projects/types/project';
import { useAuth } from '@/hooks/useAuth';
import { db, doc } from '@/lib/firebase-client';

import JournalForm from './components/JournalForm';
import JournalHistory from './components/JournalHistory';

export default function ProjectJournalPage() {
  useAuth();
  const params = useParams();
  const projectId = params?.project as string;
  const [projectDoc, loading, error] = useDocument(doc(db, 'projects', projectId));
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(true);
  const [weatherError, setWeatherError] = useState<boolean>(false);

  const projectData = useMemo(() => {
    if (!projectDoc?.exists()) return null;
    return projectDoc.data() as Project;
  }, [projectDoc]);

  const projectRegion = useMemo(() => projectData?.region || '', [projectData]);

  useEffect(() => {
    if (!projectRegion) {
      setWeatherError(true);
      setWeatherLoading(false);
      return;
    }

    const loadWeather = async () => {
      try {
        setWeatherLoading(true);
        setWeatherError(false);
        const data = await fetchWeather(projectRegion);
        setWeatherData(data);
      } catch {
        setWeatherError(true);
      } finally {
        setWeatherLoading(false);
      }
    };

    (async () => {
      await loadWeather();
    })();
  }, [projectRegion]);

  if (loading) return <div className='p-4'>載入中...</div>;
  if (error) return <div className='p-4 text-red-500'>錯誤: {error.message}</div>;
  if (!projectDoc?.exists() || !projectData) return <div className='p-4'>找不到專案</div>;

  return (
    <main className='max-w-4xl mx-auto'>
      <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
        <div className='flex justify-between items-center mb-6'>
          <div>
            <h1 className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent'>
              專案工作日誌
            </h1>
            <p className='text-gray-600 dark:text-gray-400 mt-2'>記錄每日工作進度和相關資訊</p>
          </div>
        </div>

        <div className='mb-6'>
          <WeatherDisplay weatherData={weatherData} loading={weatherLoading} error={weatherError} />
        </div>

        <JournalForm projectId={projectId} projectData={projectData} weatherData={weatherData} />

        <div className='mt-8'>
          <JournalHistory reports={projectData.reports || []} />
        </div>
      </div>
    </main>
  );
}
