/**
 * 地址選擇器組件
 * 使用 Google Maps API 提供地址選擇功能
 */

'use client';

import { useEffect, useRef, useState } from 'react';

// Google Maps API Key
const GOOGLE_MAPS_API_KEY = 'AIzaSyBdgNEAkXT0pCWOkSK7xXoAcUsOWbJEz8o';

interface AddressSelectorProps {
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function AddressSelector({
  value,
  onChange,
  placeholder = '請輸入地址',
  className = '',
  disabled = false,
}: AddressSelectorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(value);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

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

    loadGoogleMaps();
  }, []);

  // 初始化地圖
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

    // 地圖點擊事件
    map.addListener('click', (event: google.maps.MapMouseEvent) => {
      const lat = event.latLng?.lat();
      const lng = event.latLng?.lng();

      if (lat && lng) {
        // 清除舊標記
        if (markerRef.current) {
          markerRef.current.setMap(null);
        }

        // 新增標記
        markerRef.current = new window.google.maps.Marker({
          position: { lat, lng },
          map,
          draggable: true,
        });

        // 地理編碼
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
      }
    });
  }, [isMapOpen, onChange]);

  const openMapSelector = () => setIsMapOpen(true);

  const closeMap = () => {
    setIsMapOpen(false);
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
          disabled={disabled || isLoading}
          className={`flex-1 px-4 py-2 rounded-l-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${className}`}
        />
        <button
          type='button'
          onClick={openMapSelector}
          disabled={disabled || isLoading}
          className='px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 flex items-center'
          title='在地圖上選擇地址'
        >
          {isLoading ? (
            <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
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
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50'>
          <div className='bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden'>
            <div className='flex justify-between items-center mb-4'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                在地圖上選擇地址
              </h3>
              <button onClick={cancelSelection} className='text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'>
                <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            </div>

            <div className='mb-4'>
              <p className='text-sm text-gray-600 dark:text-gray-400 mb-2'>
                點擊地圖上的位置來選擇地址，或拖曳標記到精確位置
              </p>
              {selectedAddress && (
                <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3'>
                  <p className='text-sm text-blue-800 dark:text-blue-200'>
                    已選擇地址: {selectedAddress}
                  </p>
                </div>
              )}
            </div>

            <div ref={mapRef} className='w-full h-96 rounded-lg border border-gray-300 dark:border-gray-700' />

            <div className='flex justify-end space-x-3 mt-4'>
              <button onClick={cancelSelection} className='px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200'>
                取消
              </button>
              <button onClick={confirmSelection} className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200'>
                確認選擇
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 