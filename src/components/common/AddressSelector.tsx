/**
 * 地址選擇器組件
 *
 * 使用 Google Maps API 提供地址選擇功能
 * 功能包括：
 * - 地址輸入框
 * - 點擊開啟 Google 地圖選址
 * - 地址自動完成
 * - 地圖標記選擇
 */

'use client';

import { Loader } from '@googlemaps/js-api-loader';
import { useState, useEffect, useRef } from 'react';

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
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  // 初始化 Google Maps API
  useEffect(() => {
    const initGoogleMaps = async () => {
      if (typeof window === 'undefined' || window.google) return;

      setIsLoading(true);
      try {
        const loader = new Loader({
          apiKey: 'AIzaSyBdgNEAkXT0pCWOkSK7xXoAcUsOWbJEz8o',
          version: 'weekly',
          libraries: ['places'],
        });

        await loader.load();

        // 初始化自動完成功能
        if (inputRef.current && window.google) {
          autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
            componentRestrictions: { country: 'tw' }, // 限制在台灣
            fields: ['formatted_address', 'geometry', 'name'],
            types: ['establishment', 'geocode'],
          });

          autocompleteRef.current?.addListener('place_changed', () => {
            const place = autocompleteRef.current?.getPlace();
            if (place?.formatted_address) {
              const address = place.formatted_address;
              setSelectedAddress(address);
              onChange(address);
            }
          });
        }
      } catch (_error) {
      } finally {
        setIsLoading(false);
      }
    };

    initGoogleMaps();
  }, [onChange]);

  // 開啟地圖選址
  const openMapSelector = () => {
    if (!window.google || !mapRef.current) return;

    setIsMapOpen(true);

    // 初始化地圖
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 23.5, lng: 121 }, // 台灣中心點
      zoom: 7,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    mapInstanceRef.current = map;

    // 添加點擊事件
    map.addListener('click', (event: google.maps.MapMouseEvent) => {
      const lat = event.latLng?.lat();
      const lng = event.latLng?.lng();

      if (lat && lng) {
        // 清除之前的標記
        if (markerRef.current) {
          markerRef.current.setMap(null);
        }

        // 添加新標記
        markerRef.current = new window.google.maps.Marker({
          position: { lat, lng },
          map,
          draggable: true,
        });

        // 獲取地址
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode(
          { location: { lat, lng } },
          (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
            if (status === 'OK' && results && results[0]) {
              const address = results[0].formatted_address;
              setSelectedAddress(address);
              onChange(address);
            }
          }
        );
      }
    });
  };

  // 確認地圖選擇
  const confirmMapSelection = () => {
    setIsMapOpen(false);
    if (mapInstanceRef.current) {
      mapInstanceRef.current = null;
    }
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }
  };

  // 取消地圖選擇
  const cancelMapSelection = () => {
    setIsMapOpen(false);
    setSelectedAddress(value);
    if (mapInstanceRef.current) {
      mapInstanceRef.current = null;
    }
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }
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
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
              />
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
              />
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
              <button
                onClick={cancelMapSelection}
                className='text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              >
                <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
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

            <div
              ref={mapRef}
              className='w-full h-96 rounded-lg border border-gray-300 dark:border-gray-700'
            />

            <div className='flex justify-end space-x-3 mt-4'>
              <button
                onClick={cancelMapSelection}
                className='px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200'
              >
                取消
              </button>
              <button
                onClick={confirmMapSelection}
                className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200'
              >
                確認選擇
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
