/**
 * OpenWeatherMap API 服務
 */

// OpenWeatherMap API 設定
const OPENWEATHER_API_KEY = '75d07b2345362f4603a113aee9c6747c';
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

/**
 * 天氣資料介面
 */
export interface WeatherData {
  location: string;
  temperature: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  pressure: number;
  feelsLike: number;
  visibility: number;
  uvIndex?: number;
}

/**
 * 天氣預報資料介面
 */
export interface WeatherForecast {
  date: string;
  temperature: {
    min: number;
    max: number;
  };
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
}

/**
 * API 回應介面 - 當前天氣
 */
interface OpenWeatherCurrentResponse {
  name: string;
  coord: {
    lat: number;
    lon: number;
  };
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  wind: {
    speed: number;
    deg?: number;
  };
  visibility: number;
  sys: {
    country: string;
  };
}

/**
 * API 回應介面 - 5天預報
 */
interface OpenWeatherForecastResponse {
  list: Array<{
    dt: number;
    main: {
      temp_min: number;
      temp_max: number;
      humidity: number;
    };
    weather: Array<{
      main: string;
      description: string;
      icon: string;
    }>;
    wind: {
      speed: number;
    };
  }>;
  city: {
    name: string;
    country: string;
  };
}

/**
 * UV 指數回應介面
 */
interface OpenWeatherUVResponse {
  value: number;
}

class WeatherService {
  /**
   * 獲取當前天氣資料
   */
  async getCurrentWeather(query: string): Promise<WeatherData> {
    try {
      const response = await fetch(
        `${OPENWEATHER_BASE_URL}/weather?q=${encodeURIComponent(query)}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=zh_tw`
      );

      if (!response.ok) {
        throw new Error(`天氣 API 錯誤: ${response.status}`);
      }

      const data: OpenWeatherCurrentResponse = await response.json();

      // 獲取 UV 指數（使用正確的座標）
      let uvIndex: number | undefined;
      try {
        // 使用正確的座標參數
        const lat = (data as any).coord?.lat;
        const lon = (data as any).coord?.lon;
        
        if (lat && lon) {
          const uvResponse = await fetch(
            `${OPENWEATHER_BASE_URL}/uvi?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`
          );
          if (uvResponse.ok) {
            const uvData: OpenWeatherUVResponse = await uvResponse.json();
            uvIndex = uvData.value;
          }
        }
      } catch (error) {
        console.warn('無法獲取 UV 指數:', error);
      }

      return {
        location: `${data.name}, ${data.sys.country}`,
        temperature: Math.round(data.main.temp),
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 3.6), // 轉換為 km/h
        pressure: data.main.pressure,
        feelsLike: Math.round(data.main.feels_like),
        visibility: Math.round(data.visibility / 1000), // 轉換為公里
        uvIndex,
      };
    } catch (error) {
      console.error('獲取天氣資料失敗:', error);
      throw new Error('無法獲取天氣資料');
    }
  }

  /**
   * 獲取5天天氣預報
   */
  async getWeatherForecast(query: string): Promise<WeatherForecast[]> {
    try {
      const response = await fetch(
        `${OPENWEATHER_BASE_URL}/forecast?q=${encodeURIComponent(query)}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=zh_tw`
      );

      if (!response.ok) {
        throw new Error(`天氣預報 API 錯誤: ${response.status}`);
      }

      const data: OpenWeatherForecastResponse = await response.json();

      // 處理預報資料，按日期分組
      const dailyForecasts = new Map<string, WeatherForecast>();

      data.list.forEach((item) => {
        const date = new Date(item.dt * 1000).toDateString();
        
        if (!dailyForecasts.has(date)) {
          dailyForecasts.set(date, {
            date: new Date(item.dt * 1000).toLocaleDateString('zh-TW'),
            temperature: {
              min: Math.round(item.main.temp_min),
              max: Math.round(item.main.temp_max),
            },
            description: item.weather[0].description,
            icon: item.weather[0].icon,
            humidity: item.main.humidity,
            windSpeed: Math.round(item.wind.speed * 3.6),
          });
        } else {
          // 更新最低和最高溫度
          const existing = dailyForecasts.get(date)!;
          existing.temperature.min = Math.min(existing.temperature.min, Math.round(item.main.temp_min));
          existing.temperature.max = Math.max(existing.temperature.max, Math.round(item.main.temp_max));
        }
      });

      return Array.from(dailyForecasts.values()).slice(0, 5);
    } catch (error) {
      console.error('獲取天氣預報失敗:', error);
      throw new Error('無法獲取天氣預報');
    }
  }

  /**
   * 獲取天氣圖標 URL
   */
  getWeatherIconUrl(iconCode: string): string {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  }

  /**
   * 格式化風向
   */
  formatWindDirection(degrees?: number): string {
    if (degrees === undefined) return '';
    
    const directions = ['北', '東北', '東', '東南', '南', '西南', '西', '西北'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  }

  /**
   * 格式化 UV 指數等級
   */
  formatUVLevel(uvIndex?: number): string {
    if (uvIndex === undefined) return '未知';
    
    if (uvIndex <= 2) return '低';
    if (uvIndex <= 5) return '中等';
    if (uvIndex <= 7) return '高';
    if (uvIndex <= 10) return '極高';
    return '危險';
  }

  /**
   * 格式化空氣品質描述（基於能見度）
   */
  formatAirQuality(visibility: number): string {
    if (visibility >= 10) return '優良';
    if (visibility >= 6) return '良好';
    if (visibility >= 3) return '普通';
    if (visibility >= 1) return '不佳';
    return '惡劣';
  }
}

export const weatherService = new WeatherService(); 