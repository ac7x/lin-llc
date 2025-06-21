/**
 * 天氣顯示組件
 *
 * 整合 OpenWeatherMap API 顯示當前天氣資訊
 */

'use client';

import { cn } from '@/utils/classNameUtils';
import { TaiwanCityList } from '@/utils/taiwanCityUtils';

export interface WeatherData {
  weather: string;
  temperature: number;
}

interface WeatherDisplayProps {
  weatherData: WeatherData | null;
  loading: boolean;
  error: boolean;
  className?: string;
}

const OWM_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY;

export async function fetchWeather(region: string): Promise<WeatherData> {
  const cityInfo = TaiwanCityList.find(c => c.label === region || c.value === region);
  if (!cityInfo) return { weather: '未知', temperature: 0 };

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityInfo.owmQuery)}&appid=${OWM_API_KEY}&units=metric&lang=zh_tw`;

  try {
    const res = await fetch(url);
    if (!res.ok) return { weather: '未知', temperature: 0 };

    const data = await res.json();
    return {
      weather: data.weather?.[0]?.description || '未知',
      temperature: Math.round(data.main?.temp ?? 0),
    };
  } catch {
    return { weather: '未知', temperature: 0 };
  }
}

export default function WeatherDisplay({
  weatherData,
  loading,
  error,
  className = '',
}: WeatherDisplayProps) {
  // 使用 classNameUtils 來避免 Firebase Performance 錯誤
  const baseWeatherClass = cn(
    'inline-flex items-center px-4 py-2 rounded-lg',
    className
  );

  const loadingClass = cn(
    baseWeatherClass,
    'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
  );

  const errorClass = cn(
    baseWeatherClass,
    'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
  );

  const successClass = cn(
    baseWeatherClass,
    'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
  );

  if (loading) {
    return (
      <div className={loadingClass}>
        <svg className='animate-spin w-5 h-5 mr-2' fill='none' viewBox='0 0 24 24'>
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
        載入天氣中...
      </div>
    );
  }

  if (error || !weatherData) {
    return (
      <div className={errorClass}>
        <svg className='w-5 h-5 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
          />
        </svg>
        無法取得天氣資料，請設置專案地區
      </div>
    );
  }

  return (
    <div className={successClass}>
      <svg className='w-5 h-5 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2}
          d='M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z'
        />
      </svg>
      今日天氣：{weatherData.weather}，溫度：{weatherData.temperature}°C
    </div>
  );
}

// 導出 fetchWeather 函數供其他地方使用
// export { fetchWeather };
