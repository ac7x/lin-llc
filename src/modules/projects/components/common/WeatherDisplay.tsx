/**
 * 天氣顯示組件
 *
 * 整合 OpenWeatherMap API 顯示當前天氣資訊
 */

'use client';

import { cn, loadingStyles } from '@/utils/classNameUtils';
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
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('天氣資料取得失敗');
    }
    
    const data = await response.json();
    return {
      weather: data.weather[0]?.description || '未知',
      temperature: Math.round(data.main?.temp || 0),
    };
  } catch (error) {
    console.error('取得天氣資料失敗:', error);
    return { weather: '資料取得失敗', temperature: 0 };
  }
}

export default function WeatherDisplay({ 
  weatherData, 
  loading, 
  error, 
  className 
}: WeatherDisplayProps) {
  if (loading) {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        <div className={cn(loadingStyles.spinner, 'w-4 h-4')} />
        <span className="text-sm text-gray-600">載入天氣中...</span>
      </div>
    );
  }

  if (error || !weatherData) {
    return (
      <div className={cn('text-sm text-gray-500', className)}>
        天氣資訊無法取得
      </div>
    );
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <div className="flex items-center space-x-1">
        <span className="text-sm text-gray-600">{weatherData.weather}</span>
        <span className="text-sm font-medium text-gray-900">
          {weatherData.temperature}°C
        </span>
      </div>
    </div>
  );
} 