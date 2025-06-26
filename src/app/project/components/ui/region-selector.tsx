'use client';

import * as React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CheckIcon, MapPinIcon } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { TaiwanCity, TaiwanCityList } from '../../types';

interface RegionSelectorProps {
  value?: TaiwanCity;
  onValueChange?: (value: TaiwanCity | undefined) => void;
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
}

export function RegionSelector({
  value,
  onValueChange,
  placeholder = '選擇地區',
  emptyText = '找不到地區',
  disabled = false,
  className,
}: RegionSelectorProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  // 處理地區選擇
  const handleSelectRegion = (city: TaiwanCity) => {
    onValueChange?.(value === city ? undefined : city);
    setOpen(false);
  };

  // 獲取選中地區的顯示標籤
  const getSelectedLabel = () => {
    if (!value) return placeholder;
    const cityInfo = TaiwanCityList.find(city => city.value === value);
    return cityInfo?.label || value;
  };

  // 地區列表組件
  const RegionList = ({
    setOpen,
  }: {
    setOpen: (open: boolean) => void;
  }) => (
    <Command>
      <CommandInput placeholder="搜索地區..." />
      <CommandList>
        <CommandEmpty>{emptyText}</CommandEmpty>
        <CommandGroup>
          {TaiwanCityList.map((cityInfo) => (
            <CommandItem
              key={cityInfo.value}
              value={cityInfo.label}
              onSelect={() => handleSelectRegion(cityInfo.value)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <MapPinIcon className="h-4 w-4" />
                <span>{cityInfo.label}</span>
              </div>
              {value === cityInfo.value && (
                <CheckIcon className="h-4 w-4 text-primary" />
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );

  if (isMobile) {
    return (
      <div className={className}>
        {/* 移動端抽屜 */}
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              disabled={disabled}
            >
              <MapPinIcon className="h-4 w-4 mr-2" />
              {getSelectedLabel()}
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <div className="mt-4 border-t">
              <RegionList setOpen={setOpen} />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* 桌面端彈出框 */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-start" 
            disabled={disabled}
          >
            <MapPinIcon className="h-4 w-4 mr-2" />
            {getSelectedLabel()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-60 p-0" align="start">
          <RegionList setOpen={setOpen} />
        </PopoverContent>
      </Popover>
    </div>
  );
} 