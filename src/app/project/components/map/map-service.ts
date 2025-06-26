/**
 * Google Maps API 服務
 */

// Google Maps API 設定
const GOOGLE_MAPS_API_KEY = 'AIzaSyBdgNEAkXT0pCWOkSK7xXoAcUsOWbJEz8o';

/**
 * 地理座標介面
 */
export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * 地址資訊介面
 */
export interface AddressInfo {
  formattedAddress: string;
  location: LatLng;
  placeId?: string;
  addressComponents?: Array<{
    longName: string;
    shortName: string;
    types: string[];
  }>;
}

/**
 * 地址搜索結果介面
 */
export interface AddressSearchResult {
  placeId: string;
  formattedAddress: string;
  location: LatLng;
  description: string;
}

/**
 * 台灣地區的預設中心點
 */
export const TAIWAN_CENTER: LatLng = {
  lat: 23.8103,
  lng: 120.9605,
};

/**
 * 台灣各縣市的座標
 */
export const TAIWAN_CITIES_COORDINATES: Record<string, LatLng> = {
  '台北市': { lat: 25.0330, lng: 121.5654 },
  '新北市': { lat: 25.0117, lng: 121.4647 },
  '桃園市': { lat: 24.9937, lng: 121.3009 },
  '台中市': { lat: 24.1477, lng: 120.6736 },
  '台南市': { lat: 22.9998, lng: 120.2269 },
  '高雄市': { lat: 22.6273, lng: 120.3014 },
  '基隆市': { lat: 25.1276, lng: 121.7391 },
  '新竹市': { lat: 24.8138, lng: 120.9675 },
  '新竹縣': { lat: 24.8387, lng: 121.0177 },
  '苗栗縣': { lat: 24.5602, lng: 120.8214 },
  '彰化縣': { lat: 24.0518, lng: 120.5161 },
  '南投縣': { lat: 23.9609, lng: 120.9718 },
  '雲林縣': { lat: 23.7092, lng: 120.4313 },
  '嘉義市': { lat: 23.4801, lng: 120.4491 },
  '嘉義縣': { lat: 23.4518, lng: 120.2554 },
  '屏東縣': { lat: 22.5519, lng: 120.5487 },
  '宜蘭縣': { lat: 24.7022, lng: 121.7378 },
  '花蓮縣': { lat: 23.9871, lng: 121.6015 },
  '台東縣': { lat: 22.7972, lng: 121.1713 },
  '澎湖縣': { lat: 23.5711, lng: 119.5794 },
  '金門縣': { lat: 24.4492, lng: 118.3765 },
  '連江縣': { lat: 26.197, lng: 119.9397 },
};

class MapService {
  private isLoaded = false;
  private loadPromise: Promise<void> | null = null;

  /**
   * 獲取 App Check token
   */
  private async getAppCheckToken(): Promise<string | null> {
    try {
      // 檢查多種可能的 App Check 實現
      if (typeof window === 'undefined') return null;

      // 方法1: Firebase App Check (最常見)
      const firebase = (window as any).firebase;
      if (firebase?.appCheck?.getToken) {
        const tokenResult = await firebase.appCheck.getToken();
        return tokenResult.token;
      }

      // 方法2: 直接存取 appCheck 全局物件
      const appCheck = (window as any).appCheck;
      if (appCheck?.getToken) {
        const tokenResult = await appCheck.getToken();
        return tokenResult.token;
      }

      // 方法3: 從 Firebase app 實例獲取
      const app = (window as any).firebaseApp || (window as any).app;
      if (app && firebase?.appCheck) {
        const appCheckInstance = firebase.appCheck(app);
        if (appCheckInstance?.getToken) {
          const tokenResult = await appCheckInstance.getToken();
          return tokenResult.token;
        }
      }

      // 方法4: 檢查是否有其他 App Check 實現
      if ((window as any).getAppCheckToken) {
        return await (window as any).getAppCheckToken();
      }

      console.log('未找到 App Check token，繼續載入地圖');
      return null;
    } catch (error) {
      console.warn('獲取 App Check token 失敗:', error);
      return null;
    }
  }

  /**
   * 載入 Google Maps API
   */
  async loadGoogleMaps(): Promise<void> {
    if (this.isLoaded) return;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = new Promise(async (resolve, reject) => {
      // 檢查是否已經載入
      if ((window as any).google?.maps?.Geocoder) {
        this.isLoaded = true;
        resolve();
        return;
      }

      try {
        // 嘗試獲取 App Check token
        console.log('正在獲取 App Check token...');
        const appCheckToken = await this.getAppCheckToken();
        
        // 建構 Google Maps API URL
        let mapsSrc = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&language=zh-TW&region=TW`;
        
        // 如果有 App Check token，加入相關參數
        if (appCheckToken) {
          console.log('使用 App Check token 載入地圖');
          mapsSrc += `&authuser=0&hl=zh-TW&gl=TW`;
          // 設定 App Check token 到全域，讓 Maps API 能夠存取
          (window as any).google_maps_app_check_token = appCheckToken;
        } else {
          console.log('未獲取到 App Check token，使用標準載入');
        }

        // 添加回調參數
        const callbackName = `initMap_${Date.now()}`;
        mapsSrc += `&callback=${callbackName}`;

        // 設定全域回調函數
        (window as any)[callbackName] = () => {
          console.log('Google Maps API 回調觸發');
          this.waitForMapsReady()
            .then(() => {
              console.log('Google Maps API 完全準備就緒');
              this.isLoaded = true;
              // 清理回調函數
              delete (window as any)[callbackName];
              resolve();
            })
            .catch(reject);
        };

        // 創建 script 標籤
        const script = document.createElement('script');
        script.src = mapsSrc;
        script.async = true;
        script.defer = true;

        script.onerror = () => {
          console.error('Google Maps API 載入失敗');
          // 清理回調函數
          delete (window as any)[callbackName];
          reject(new Error('Failed to load Google Maps API'));
        };

        document.head.appendChild(script);
      } catch (error) {
        console.error('載入 Google Maps API 時發生錯誤:', error);
        // 如果 App Check 相關處理失敗，仍然嘗試載入標準地圖
        const fallbackCallbackName = `initMapFallback_${Date.now()}`;
        
        (window as any)[fallbackCallbackName] = () => {
          this.waitForMapsReady()
            .then(() => {
              this.isLoaded = true;
              delete (window as any)[fallbackCallbackName];
              resolve();
            })
            .catch(reject);
        };

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&language=zh-TW&region=TW&callback=${fallbackCallbackName}`;
        script.async = true;
        script.defer = true;

        script.onerror = () => {
          delete (window as any)[fallbackCallbackName];
          reject(new Error('Failed to load Google Maps API'));
        };

        document.head.appendChild(script);
      }
    });

    return this.loadPromise;
  }

  /**
   * 等待 Maps API 完全準備就緒
   */
  private async waitForMapsReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      const maxAttempts = 50; // 最多等待 5 秒
      let attempts = 0;

      const checkReady = () => {
        attempts++;
        
        // 檢查所有必要的 API 是否可用
        const google = (window as any).google;
        if (
          google?.maps?.Geocoder &&
          google?.maps?.places?.AutocompleteService &&
          google?.maps?.places?.PlacesService &&
          google?.maps?.Map &&
          google?.maps?.Marker
        ) {
          resolve();
          return;
        }

        if (attempts >= maxAttempts) {
          reject(new Error('Google Maps API initialization timeout'));
          return;
        }

        setTimeout(checkReady, 100);
      };

      checkReady();
    });
  }

  /**
   * 檢查 API 是否已載入
   */
  isApiLoaded(): boolean {
    return this.isLoaded && !!(window as any).google?.maps;
  }

  /**
   * 地理編碼 - 地址轉座標
   */
  async geocodeAddress(address: string): Promise<AddressInfo> {
    await this.loadGoogleMaps();

    return new Promise((resolve, reject) => {
      const google = (window as any).google;
      const geocoder = new google.maps.Geocoder();

      geocoder.geocode(
        {
          address: address,
          region: 'TW', // 限制在台灣
        },
        (results: any[], status: any) => {
          if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
            const result = results[0];
            resolve({
              formattedAddress: result.formatted_address,
              location: {
                lat: result.geometry.location.lat(),
                lng: result.geometry.location.lng(),
              },
              placeId: result.place_id,
              addressComponents: result.address_components?.map((component: any) => ({
                longName: component.long_name,
                shortName: component.short_name,
                types: component.types,
              })),
            });
          } else {
            reject(new Error(`地理編碼失敗: ${status}`));
          }
        }
      );
    });
  }

  /**
   * 反向地理編碼 - 座標轉地址
   */
  async reverseGeocode(location: LatLng): Promise<AddressInfo> {
    await this.loadGoogleMaps();

    return new Promise((resolve, reject) => {
      const google = (window as any).google;
      const geocoder = new google.maps.Geocoder();

      geocoder.geocode(
        {
          location: location,
        },
        (results: any[], status: any) => {
          if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
            const result = results[0];
            resolve({
              formattedAddress: result.formatted_address,
              location: {
                lat: result.geometry.location.lat(),
                lng: result.geometry.location.lng(),
              },
              placeId: result.place_id,
              addressComponents: result.address_components?.map((component: any) => ({
                longName: component.long_name,
                shortName: component.short_name,
                types: component.types,
              })),
            });
          } else {
            reject(new Error(`反向地理編碼失敗: ${status}`));
          }
        }
      );
    });
  }

  /**
   * 地址自動完成搜索
   */
  async searchAddresses(query: string): Promise<AddressSearchResult[]> {
    await this.loadGoogleMaps();

    return new Promise((resolve, reject) => {
      const google = (window as any).google;
      const service = new google.maps.places.AutocompleteService();

      service.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: 'tw' }, // 限制在台灣
          types: ['address', 'establishment'], // 地址和場所類型
        },
        (predictions: any[], status: any) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            resolve(
              predictions.map((prediction: any) => ({
                placeId: prediction.place_id,
                formattedAddress: prediction.structured_formatting.main_text,
                description: prediction.description,
                location: { lat: 0, lng: 0 }, // 需要後續獲取詳細資訊
              }))
            );
          } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            resolve([]);
          } else {
            reject(new Error(`地址搜索失敗: ${status}`));
          }
        }
      );
    });
  }

  /**
   * 根據 Place ID 獲取詳細資訊
   */
  async getPlaceDetails(placeId: string): Promise<AddressInfo> {
    await this.loadGoogleMaps();

    return new Promise((resolve, reject) => {
      const google = (window as any).google;
      const service = new google.maps.places.PlacesService(
        document.createElement('div')
      );

      service.getDetails(
        {
          placeId: placeId,
          fields: ['formatted_address', 'geometry', 'place_id', 'address_components'],
        },
        (place: any, status: any) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            resolve({
              formattedAddress: place.formatted_address || '',
              location: {
                lat: place.geometry?.location?.lat() || 0,
                lng: place.geometry?.location?.lng() || 0,
              },
              placeId: place.place_id,
              addressComponents: place.address_components?.map((component: any) => ({
                longName: component.long_name,
                shortName: component.short_name,
                types: component.types,
              })),
            });
          } else {
            reject(new Error(`場所詳情獲取失敗: ${status}`));
          }
        }
      );
    });
  }

  /**
   * 根據縣市名稱獲取座標
   */
  getCityCoordinates(cityName: string): LatLng {
    return TAIWAN_CITIES_COORDINATES[cityName] || TAIWAN_CENTER;
  }

  /**
   * 計算兩點間距離（公里）
   */
  calculateDistance(point1: LatLng, point2: LatLng): number {
    const R = 6371; // 地球半徑（公里）
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLng = this.toRad(point2.lng - point1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(point1.lat)) *
        Math.cos(this.toRad(point2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

// Google Maps API 類型定義
declare global {
  interface Window {
    google: {
      maps: {
        Geocoder: new () => {
          geocode: (
            request: any,
            callback: (results: any[] | null, status: any) => void
          ) => void;
        };
        GeocoderStatus: {
          OK: any;
        };
        places: {
          AutocompleteService: new () => {
            getPlacePredictions: (
              request: any,
              callback: (predictions: any[] | null, status: any) => void
            ) => void;
          };
          PlacesService: new (element: HTMLElement) => {
            getDetails: (
              request: any,
              callback: (place: any | null, status: any) => void
            ) => void;
          };
          PlacesServiceStatus: {
            OK: any;
            ZERO_RESULTS: any;
          };
        };
      };
    };
    initGoogleMaps: () => void;
  }
}

export const mapService = new MapService(); 