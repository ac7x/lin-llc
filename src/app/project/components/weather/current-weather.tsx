'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CloudIcon, 
  ThermometerIcon, 
  DropletIcon, 
  WindIcon, 
  EyeIcon,
  SunIcon,
  AlertCircleIcon,
  RefreshCwIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { weatherService, type WeatherData } from './weather-service';
import { TaiwanCity, TaiwanCityList } from '../../types';

interface CurrentWeatherProps {
  city: TaiwanCity;
  className?: string;
}

export function CurrentWeather({ city, className }: CurrentWeatherProps) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // 獲取城市查詢字串
  const getCityQuery = () => {
    const cityInfo = TaiwanCityList.find(item => item.value === city);
    return cityInfo?.owmQuery || city;
  };

  // 獲取天氣資料
  const fetchWeatherData = async () => {
    setLoading(true);
    setError(null);

    try {
      const query = getCityQuery();
      const data = await weatherService.getCurrentWeather(query);
      setWeatherData(data);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : '獲取天氣資料失敗');
    } finally {
      setLoading(false);
    }
  };

  // 初始載入和城市變更時重新獲取
  useEffect(() => {
    fetchWeatherData();
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
              onClick={fetchWeatherData}
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
            <CloudIcon className="h-5 w-5" />
            <span className="text-lg">當前天氣</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchWeatherData}
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
        {loading || !weatherData ? (
          // 載入骨架
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 主要天氣資訊 */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={weatherService.getWeatherIconUrl(weatherData.icon)}
                  alt={weatherData.description}
                  className="h-16 w-16"
                />
              </div>
              <div>
                <div className="text-3xl font-bold">{weatherData.temperature}°C</div>
                <div className="text-sm text-muted-foreground capitalize">
                  {weatherData.description}
                </div>
                <div className="text-xs text-muted-foreground">
                  體感溫度 {weatherData.feelsLike}°C
                </div>
              </div>
            </div>

            {/* 詳細資訊網格 */}
            <div className="grid grid-cols-2 gap-4">
              {/* 濕度 */}
              <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                <DropletIcon className="h-4 w-4 text-blue-500" />
                <div>
                  <div className="text-sm font-medium">{weatherData.humidity}%</div>
                  <div className="text-xs text-muted-foreground">濕度</div>
                </div>
              </div>

              {/* 風速 */}
              <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                <WindIcon className="h-4 w-4 text-green-500" />
                <div>
                  <div className="text-sm font-medium">{weatherData.windSpeed} km/h</div>
                  <div className="text-xs text-muted-foreground">風速</div>
                </div>
              </div>

              {/* 氣壓 */}
              <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                <ThermometerIcon className="h-4 w-4 text-orange-500" />
                <div>
                  <div className="text-sm font-medium">{weatherData.pressure} hPa</div>
                  <div className="text-xs text-muted-foreground">氣壓</div>
                </div>
              </div>

              {/* 能見度 */}
              <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                <EyeIcon className="h-4 w-4 text-purple-500" />
                <div>
                  <div className="text-sm font-medium">{weatherData.visibility} km</div>
                  <div className="text-xs text-muted-foreground">能見度</div>
                </div>
              </div>
            </div>

            {/* 額外資訊 */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                空氣品質: {weatherService.formatAirQuality(weatherData.visibility)}
              </Badge>
              {weatherData.uvIndex !== undefined && (
                <Badge variant="secondary">
                  <SunIcon className="h-3 w-3 mr-1" />
                  UV: {weatherService.formatUVLevel(weatherData.uvIndex)}
                </Badge>
              )}
            </div>

            {/* 位置資訊 */}
            <div className="text-xs text-muted-foreground text-center border-t pt-2">
              {weatherData.location}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 