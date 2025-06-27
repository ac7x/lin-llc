'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CalendarIcon, 
  DropletIcon, 
  WindIcon,
  AlertCircleIcon,
  RefreshCwIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { weatherService, type WeatherForecast } from './weather-service';
import { TaiwanCity, TaiwanCityList } from '../../project/types';

interface WeatherForecastProps {
  city?: TaiwanCity | null;
  className?: string;
}

export function WeatherForecastComponent({ city, className }: WeatherForecastProps) {
  const [forecastData, setForecastData] = useState<WeatherForecast[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // 如果沒有城市資訊，顯示提示訊息
  if (!city) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            <span className="text-lg">5天天氣預報</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center space-y-2">
            <AlertCircleIcon className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">尚未設置地區</p>
            <p className="text-xs text-muted-foreground">
              請編輯專案資訊以添加地區，然後查看天氣預報
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 獲取城市查詢字串
  const getCityQuery = () => {
    const cityInfo = TaiwanCityList.find(item => item.value === city);
    return cityInfo?.owmQuery || city;
  };

  // 獲取預報資料
  const fetchForecastData = async () => {
    setLoading(true);
    setError(null);

    try {
      const query = getCityQuery();
      const data = await weatherService.getWeatherForecast(query);
      setForecastData(data);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : '獲取天氣預報失敗');
    } finally {
      setLoading(false);
    }
  };

  // 初始載入和城市變更時重新獲取
  useEffect(() => {
    if (city) {
      fetchForecastData();
    }
  }, [city]);

  // 錯誤狀態
  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center space-y-2">
            <AlertCircleIcon className="h-8 w-8 text-destructive mx-auto" />
            <p className="text-sm text-destructive">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchForecastData}
              disabled={loading}
            >
              <RefreshCwIcon className="h-4 w-4 mr-2" />
              重試
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            <span className="text-lg">5天天氣預報</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchForecastData}
            disabled={loading}
          >
            <RefreshCwIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
        {lastUpdate && (
          <p className="text-xs text-muted-foreground">
            最後更新: {lastUpdate.toLocaleTimeString('zh-TW')}
          </p>
        )}
      </CardHeader>

      <CardContent>
        {loading || forecastData.length === 0 ? (
          // 載入骨架
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 p-3 border rounded-lg">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {forecastData.map((forecast, index) => (
              <div 
                key={index} 
                className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/30 transition-colors"
              >
                {/* 天氣圖標 */}
                <div className="flex-shrink-0">
                  <img
                    src={weatherService.getWeatherIconUrl(forecast.icon)}
                    alt={forecast.description}
                    className="h-10 w-10"
                  />
                </div>

                {/* 日期和描述 */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">
                    {index === 0 ? '今天' : forecast.date}
                  </div>
                  <div className="text-xs text-muted-foreground capitalize truncate">
                    {forecast.description}
                  </div>
                </div>

                {/* 溫度 */}
                <div className="text-right">
                  <div className="font-medium">
                    <span className="text-sm">{forecast.temperature.max}°</span>
                    <span className="text-xs text-muted-foreground ml-1">
                      / {forecast.temperature.min}°
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    高 / 低
                  </div>
                </div>

                {/* 濕度和風速 */}
                <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <DropletIcon className="h-3 w-3" />
                    {forecast.humidity}%
                  </div>
                  <div className="flex items-center gap-1">
                    <WindIcon className="h-3 w-3" />
                    {forecast.windSpeed}km/h
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 