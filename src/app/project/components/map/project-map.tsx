'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { mapService, type LatLng, type AddressInfo } from './map-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, RotateCcw, ZoomIn, ZoomOut, Locate } from 'lucide-react';

interface ProjectMapProps {
  address?: string;
  region?: string;
  projectName?: string;
  onLocationUpdate?: (addressInfo: AddressInfo) => void;
  className?: string;
  height?: number;
  showControls?: boolean;
  interactive?: boolean;
}

/**
 * 專案地圖組件
 */
export function ProjectMap({
  address,
  region,
  projectName = '專案位置',
  onLocationUpdate,
  className = '',
  height = 400,
  showControls = true,
  interactive = true,
}: ProjectMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string>('');

  /**
   * 初始化地圖
   */
  const initializeMap = useCallback(async () => {
    if (!mapRef.current) return;

    try {
      setIsLoading(true);
      setError(null);

      await mapService.loadGoogleMaps();
      const google = (window as any).google;

      // 確定初始位置
      let initialLocation: LatLng;
      let initialAddress = '';

      if (address) {
        try {
          const addressInfo = await mapService.geocodeAddress(address);
          initialLocation = addressInfo.location;
          initialAddress = addressInfo.formattedAddress;
        } catch {
          // 如果地址解析失敗，使用地區座標
          initialLocation = region
            ? mapService.getCityCoordinates(region)
            : mapService.getCityCoordinates('台北市');
        }
      } else if (region) {
        initialLocation = mapService.getCityCoordinates(region);
      } else {
        initialLocation = mapService.getCityCoordinates('台北市');
      }

      // 創建地圖
      const mapOptions = {
        center: initialLocation,
        zoom: address ? 16 : 12,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: !showControls,
        gestureHandling: interactive ? 'auto' : 'none',
        zoomControl: showControls,
        mapTypeControl: showControls,
        streetViewControl: showControls,
        fullscreenControl: showControls,
      };

      mapInstanceRef.current = new google.maps.Map(mapRef.current, mapOptions);

      // 添加標記
      if (address || region) {
        addMarker(initialLocation, initialAddress || projectName);
      }

      // 如果允許互動，添加點擊事件
      if (interactive && onLocationUpdate) {
        mapInstanceRef.current.addListener('click', async (event: any) => {
          const clickedLocation = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng(),
          };

          try {
            const addressInfo = await mapService.reverseGeocode(clickedLocation);
            addMarker(clickedLocation, addressInfo.formattedAddress);
            setCurrentLocation(clickedLocation);
            setCurrentAddress(addressInfo.formattedAddress);
            onLocationUpdate(addressInfo);
          } catch (error) {
            console.error('無法獲取地址資訊:', error);
          }
        });
      }

      setCurrentLocation(initialLocation);
      setCurrentAddress(initialAddress || projectName);
    } catch (error) {
      console.error('地圖初始化失敗:', error);
      setError('地圖載入失敗，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  }, [address, region, projectName, onLocationUpdate, showControls, interactive]);

  /**
   * 添加地圖標記
   */
  const addMarker = useCallback((location: LatLng, title: string) => {
    if (!mapInstanceRef.current) return;

    const google = (window as any).google;

    // 移除舊標記
    if (markerRef.current) {
      markerRef.current.map = null;
    }

    // 檢查是否支援 AdvancedMarkerElement
    if (google.maps.marker?.AdvancedMarkerElement) {
      // 使用新的 AdvancedMarkerElement
      markerRef.current = new google.maps.marker.AdvancedMarkerElement({
        position: location,
        map: mapInstanceRef.current,
        title: title,
      });

      // 創建資訊窗口
      const infoWindow = new google.maps.InfoWindow({
        content: `<div class="p-2"><strong>${title}</strong></div>`,
      });

      // 點擊標記顯示資訊
      markerRef.current.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, markerRef.current);
      });
    } else {
      // 降級使用舊的 Marker（暫時保留以確保兼容性）
      markerRef.current = new google.maps.Marker({
        position: location,
        map: mapInstanceRef.current,
        title: title,
        animation: google.maps.Animation.DROP,
      });

      // 創建資訊窗口
      const infoWindow = new google.maps.InfoWindow({
        content: `<div class="p-2"><strong>${title}</strong></div>`,
      });

      // 點擊標記顯示資訊
      markerRef.current.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, markerRef.current);
      });
    }
  }, []);

  /**
   * 重置到初始位置
   */
  const resetView = useCallback(() => {
    if (!mapInstanceRef.current || !currentLocation) return;

    mapInstanceRef.current.setCenter(currentLocation);
    mapInstanceRef.current.setZoom(address ? 16 : 12);
  }, [currentLocation, address]);

  /**
   * 放大地圖
   */
  const zoomIn = useCallback(() => {
    if (!mapInstanceRef.current) return;
    const currentZoom = mapInstanceRef.current.getZoom();
    mapInstanceRef.current.setZoom(currentZoom + 1);
  }, []);

  /**
   * 縮小地圖
   */
  const zoomOut = useCallback(() => {
    if (!mapInstanceRef.current) return;
    const currentZoom = mapInstanceRef.current.getZoom();
    mapInstanceRef.current.setZoom(Math.max(1, currentZoom - 1));
  }, []);

  /**
   * 定位到當前位置
   */
  const locateUser = useCallback(() => {
    if (!navigator.geolocation) {
      setError('您的瀏覽器不支援定位功能');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        try {
          const addressInfo = await mapService.reverseGeocode(userLocation);
          
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setCenter(userLocation);
            mapInstanceRef.current.setZoom(16);
          }

          if (interactive && onLocationUpdate) {
            addMarker(userLocation, '您的位置');
            setCurrentLocation(userLocation);
            setCurrentAddress(addressInfo.formattedAddress);
            onLocationUpdate(addressInfo);
          }
        } catch (error) {
          console.error('無法獲取地址資訊:', error);
        }
      },
      (error) => {
        console.error('定位失敗:', error);
        setError('無法獲取您的位置');
      }
    );
  }, [interactive, onLocationUpdate, addMarker]);

  // 初始化地圖
  useEffect(() => {
    initializeMap();
  }, [initializeMap]);

  // 地址變更時更新地圖
  useEffect(() => {
    if (address && mapInstanceRef.current) {
      mapService.geocodeAddress(address)
        .then((addressInfo) => {
          mapInstanceRef.current.setCenter(addressInfo.location);
          addMarker(addressInfo.location, addressInfo.formattedAddress);
          setCurrentLocation(addressInfo.location);
          setCurrentAddress(addressInfo.formattedAddress);
        })
        .catch((error) => {
          console.error('地址更新失敗:', error);
        });
    }
  }, [address, addMarker]);

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            專案地圖
          </CardTitle>
          {showControls && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={zoomIn}
                disabled={isLoading}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={zoomOut}
                disabled={isLoading}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetView}
                disabled={isLoading || !currentLocation}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              {interactive && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={locateUser}
                  disabled={isLoading}
                >
                  <Locate className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
        {currentAddress && (
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="secondary" className="text-xs">
              {currentAddress}
            </Badge>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {error && (
          <Alert className="m-4 mb-0">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
              <Skeleton className="w-full h-full" style={{ height }} />
            </div>
          )}
          
          <div
            ref={mapRef}
            className="w-full border-0"
            style={{ height: `${height}px` }}
          />
          
          {interactive && (
            <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-md px-2 py-1 text-xs text-muted-foreground">
              點擊地圖選擇位置
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 