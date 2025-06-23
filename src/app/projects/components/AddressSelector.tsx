/**
 * 地址選擇器組件
 * 使用 Google Maps API 提供地址選擇功能
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

import { cn, modalStyles, inputStyles, buttonStyles, loadingStyles } from '@/utils/classNameUtils';
import { logError } from '@/utils/errorUtils';

// Google Maps API Key
const GOOGLE_MAPS_API_KEY = 'AIzaSyBdgNEAkXT0pCWOkSK7xXoAcUsOWbJEz8o';

interface AddressSelectorProps {
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
}

interface AddressSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export default function AddressSelector({
  value,
  onChange,
  placeholder = '請輸入地址',
  className = '',
  disabled = false,
  readOnly = false,
}: AddressSelectorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(value);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const searchBoxRef = useRef<HTMLInputElement>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  // 載入 Google Maps API
  useEffect(() => {
    if (typeof window === 'undefined' || window.google?.maps) return;

    setIsLoading(true);
    
    const loadGoogleMaps = async () => {
      try {
        const { Loader } = await import('@googlemaps/js-api-loader');
        const loader = new Loader({
          apiKey: GOOGLE_MAPS_API_KEY,
          version: 'weekly',
          libraries: ['places'],
        });
        await loader.load();
      } catch {
        // Google Maps 載入失敗，靜默處理
      } finally {
        setIsLoading(false);
      }
    };

    void loadGoogleMaps();
  }, []);

  // 地理編碼
  const geocodeLocation = useCallback((lat: number, lng: number) => {
    if (!window.google?.maps) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode(
      { location: { lat, lng } },
      (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
        const address = status === 'OK' && results?.[0] 
          ? results[0].formatted_address 
          : `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        setSelectedAddress(address);
        onChange(address);
      }
    );
  }, [onChange]);

  // 更新標記和地址
  const updateMarkerAndAddress = useCallback((lat: number, lng: number) => {
    if (!mapInstanceRef.current) return;
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }
    markerRef.current = new window.google.maps.Marker({
      position: { lat, lng },
      map: mapInstanceRef.current,
      draggable: !readOnly,
    });
    if (!readOnly) {
      markerRef.current.addListener('dragend', () => {
        const position = markerRef.current?.getPosition();
        if (position) {
          geocodeLocation(position.lat(), position.lng());
        }
      });
    }
    geocodeLocation(lat, lng);
  }, [geocodeLocation, readOnly]);

  // 初始化地圖和服務
  useEffect(() => {
    if (!isMapOpen || !mapRef.current || !window.google?.maps) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 23.5, lng: 121 },
      zoom: 7,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    mapInstanceRef.current = map;
    autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
    placesServiceRef.current = new window.google.maps.places.PlacesService(map);

    // 地圖點擊事件 - 只在非只讀模式下啟用
    if (!readOnly) {
      map.addListener('click', (event: google.maps.MapMouseEvent) => {
        const lat = event.latLng?.lat();
        const lng = event.latLng?.lng();

        if (lat && lng) {
          updateMarkerAndAddress(lat, lng);
        }
      });
    }
  }, [isMapOpen, updateMarkerAndAddress, readOnly]);

  // 獲取當前位置
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('您的瀏覽器不支援地理定位功能');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter({ lat: latitude, lng: longitude });
          mapInstanceRef.current.setZoom(15);
          updateMarkerAndAddress(latitude, longitude);
        }
      },
      (error) => {
        logError(error, { operation: 'get_current_location' });
        alert('無法獲取您的位置，請手動選擇地址');
      }
    );
  };

  // 搜尋建議
  const searchSuggestions = async (query: string) => {
    if (!query.trim() || !autocompleteServiceRef.current) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    try {
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: 'tw' }, // 限制在台灣
          types: ['geocode', 'establishment'],
        },
        (predictions: google.maps.places.AutocompletePrediction[] | null, status: google.maps.places.PlacesServiceStatus) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions as AddressSuggestion[]);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        }
      );
    } catch (error) {
      // 搜尋建議失敗，記錄錯誤並靜默處理
      logError(error, { operation: 'search_suggestions', query });
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsSearching(false);
    }
  };

  // 選擇建議地址
  const selectSuggestion = (suggestion: AddressSuggestion) => {
    if (!placesServiceRef.current) return;

    placesServiceRef.current.getDetails(
      {
        placeId: suggestion.place_id,
        fields: ['geometry', 'formatted_address'],
      },
      (place: google.maps.places.PlaceResult | null, status: google.maps.places.PlacesServiceStatus) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setCenter({ lat, lng });
            mapInstanceRef.current.setZoom(16);
            updateMarkerAndAddress(lat, lng);
          }
          
          setSearchTerm(suggestion.description);
          setShowSuggestions(false);
        }
      }
    );
  };

  // 搜尋地址
  const searchAddress = () => {
    if (!searchTerm.trim() || !mapInstanceRef.current) return;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode(
      { address: searchTerm },
      (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
        if (status === 'OK' && results?.[0]) {
          const location = results[0].geometry.location;
          const lat = location.lat();
          const lng = location.lng();
          
          mapInstanceRef.current?.setCenter({ lat, lng });
          mapInstanceRef.current?.setZoom(16);
          updateMarkerAndAddress(lat, lng);
        } else {
          alert('找不到該地址，請嘗試其他關鍵字');
        }
      }
    );
  };

  const openMapSelector = () => setIsMapOpen(true);

  const closeMap = () => {
    setIsMapOpen(false);
    setShowSuggestions(false);
    if (mapInstanceRef.current) {
      mapInstanceRef.current = null;
    }
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }
  };

  const confirmSelection = () => closeMap();

  const cancelSelection = () => {
    setSelectedAddress(value);
    setSearchTerm('');
    closeMap();
  };

  return (
    <div className='relative'>
      <div className='flex'>
        <input
          ref={inputRef}
          type='text'
          value={selectedAddress}
          onChange={e => {
            setSelectedAddress(e.target.value);
            onChange(e.target.value);
          }}
          placeholder={placeholder}
          disabled={disabled || isLoading || readOnly}
          className={cn(inputStyles.base, 'flex-1 rounded-l-lg', className)}
        />
        <button
          type='button'
          onClick={openMapSelector}
          disabled={disabled || isLoading || readOnly}
          className={cn(buttonStyles.primary, 'rounded-r-lg disabled:opacity-50 flex items-center')}
          title='在地圖上選擇地址'
        >
          {isLoading ? (
            <div className={loadingStyles.spinnerWhite}></div>
          ) : (
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
            </svg>
          )}
        </button>
      </div>

      {/* 地圖選址彈窗 */}
      {isMapOpen && (
        <div className={modalStyles.overlay}>
          <div className={cn(modalStyles.container, 'max-w-5xl')}>
            <div className='flex justify-between items-center mb-4'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                {readOnly ? '查看地址位置' : '在地圖上選擇地址'}
              </h3>
              <button onClick={cancelSelection} className='text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'>
                <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            </div>

            {/* 搜尋和工具列 - 只在非只讀模式下顯示 */}
            {!readOnly && (
              <div className='mb-4 space-y-3'>
                <div className='flex gap-2'>
                  <div className='flex-1 relative'>
                    <input
                      ref={searchBoxRef}
                      type='text'
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        void searchSuggestions(e.target.value);
                      }}
                      placeholder='搜尋地址或地點...'
                      className={inputStyles.base}
                    />
                    {isSearching && (
                      <div className='absolute right-3 top-1/2 -translate-y-1/2'>
                        <div className={loadingStyles.spinnerGreen}></div>
                      </div>
                    )}
                    
                    {/* 搜尋建議下拉選單 */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div className='absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto'>
                        {suggestions.map((suggestion) => (
                          <button
                            key={suggestion.place_id}
                            onClick={() => selectSuggestion(suggestion)}
                            className='w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 border-b border-gray-100 dark:border-gray-700 last:border-b-0'
                          >
                            <div className='font-medium text-gray-900 dark:text-gray-100'>
                              {suggestion.structured_formatting.main_text}
                            </div>
                            <div className='text-sm text-gray-500 dark:text-gray-400'>
                              {suggestion.structured_formatting.secondary_text}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={searchAddress}
                    disabled={!searchTerm.trim()}
                    className={cn(buttonStyles.success, 'disabled:opacity-50 flex items-center')}
                  >
                    <svg className='w-4 h-4 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                    </svg>
                    搜尋
                  </button>
                  <button
                    onClick={getCurrentLocation}
                    className={cn('px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center')}
                    title='使用當前位置'
                  >
                    <svg className='w-4 h-4 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
                    </svg>
                    定位
                  </button>
                </div>
                
                <div className='flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400'>
                  <span className='flex items-center'>
                    <svg className='w-4 h-4 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                    </svg>
                    點擊地圖選擇位置
                  </span>
                  <span className='flex items-center'>
                    <svg className='w-4 h-4 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 9l4-4 4 4m0 6l-4 4-4-4' />
                    </svg>
                    拖曳標記精確定位
                  </span>
                  <span className='flex items-center'>
                    <svg className='w-4 h-4 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                    </svg>
                    搜尋地址自動定位
                  </span>
                </div>
              </div>
            )}

            {/* 已選擇地址顯示 */}
            {selectedAddress && (
              <div className='mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3'>
                <p className='text-sm text-blue-800 dark:text-blue-200'>
                  <span className='font-medium'>{readOnly ? '地址位置:' : '已選擇地址:'}</span> {selectedAddress}
                </p>
              </div>
            )}

            {/* 地圖容器 */}
            <div ref={mapRef} className='w-full h-96 rounded-lg border border-gray-300 dark:border-gray-700' />

            <div className='flex justify-end space-x-3 mt-4'>
              <button onClick={cancelSelection} className={buttonStyles.outline}>
                {readOnly ? '關閉' : '取消'}
              </button>
              {!readOnly && (
                <button onClick={confirmSelection} className={buttonStyles.primary}>
                  確認選擇
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 