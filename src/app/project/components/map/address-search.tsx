'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { mapService, type AddressSearchResult, type AddressInfo } from './map-service';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, MapPin, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddressSearchProps {
  onAddressSelect?: (addressInfo: AddressInfo) => void;
  placeholder?: string;
  className?: string;
  initialValue?: string;
  disabled?: boolean;
  showCurrentLocation?: boolean;
}

/**
 * 地址搜索組件
 */
export function AddressSearch({
  onAddressSelect,
  placeholder = '搜索地址...',
  className = '',
  initialValue = '',
  disabled = false,
  showCurrentLocation = true,
}: AddressSearchProps) {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState<AddressSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  /**
   * 執行地址搜索
   */
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    try {
      setIsSearching(true);
      const searchResults = await mapService.searchAddresses(searchQuery);
      setResults(searchResults);
      setIsOpen(searchResults.length > 0);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('地址搜索失敗:', error);
      setResults([]);
      setIsOpen(false);
    } finally {
      setIsSearching(false);
    }
  }, []);

  /**
   * 處理搜索輸入變更
   */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // 清除之前的搜索計時器
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // 設置新的搜索計時器（防抖）
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  }, [performSearch]);

  /**
   * 選擇地址
   */
  const selectAddress = useCallback(async (result: AddressSearchResult) => {
    try {
      setIsSearching(true);
      const addressInfo = await mapService.getPlaceDetails(result.placeId);
      setQuery(addressInfo.formattedAddress);
      setIsOpen(false);
      setSelectedIndex(-1);
      onAddressSelect?.(addressInfo);
    } catch (error) {
      console.error('獲取地址詳情失敗:', error);
    } finally {
      setIsSearching(false);
    }
  }, [onAddressSelect]);

  /**
   * 使用當前位置
   */
  const useCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.error('瀏覽器不支援定位功能');
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          const addressInfo = await mapService.reverseGeocode(location);
          setQuery(addressInfo.formattedAddress);
          setIsOpen(false);
          onAddressSelect?.(addressInfo);
        } catch (error) {
          console.error('獲取當前位置地址失敗:', error);
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.error('定位失敗:', error);
        setIsGettingLocation(false);
      }
    );
  }, [onAddressSelect]);

  /**
   * 清除搜索
   */
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  }, []);

  /**
   * 處理鍵盤事件
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          selectAddress(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }, [isOpen, results, selectedIndex, selectAddress]);

  /**
   * 處理輸入框焦點
   */
  const handleFocus = useCallback(() => {
    if (results.length > 0) {
      setIsOpen(true);
    }
  }, [results.length]);

  /**
   * 處理點擊外部區域
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 清理計時器
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={cn('relative w-full', className)}>
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            disabled={disabled}
            className="pl-10 pr-20"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                disabled={disabled}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            {showCurrentLocation && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={useCurrentLocation}
                disabled={disabled || isGettingLocation}
                className="h-6 w-6 p-0"
                title="使用當前位置"
              >
                {isGettingLocation ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <MapPin className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* 搜索結果下拉選單 */}
        {isOpen && (
          <Card 
            ref={resultsRef}
            className="absolute z-50 w-full mt-1 max-h-64 overflow-auto"
          >
            <CardContent className="p-0">
              {isSearching ? (
                <div className="p-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                </div>
              ) : results.length > 0 ? (
                <div className="py-1">
                  {results.map((result, index) => (
                    <button
                      key={result.placeId}
                      className={cn(
                        'w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground transition-colors',
                        'flex items-start gap-2',
                        selectedIndex === index && 'bg-accent text-accent-foreground'
                      )}
                      onClick={() => selectAddress(result)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {result.formattedAddress}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {result.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : query.length >= 2 ? (
                <div className="p-3 text-sm text-muted-foreground text-center">
                  找不到相關地址
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 