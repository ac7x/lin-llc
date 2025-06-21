/**
 * 地址選擇器組件
 * 提供地址選擇功能
 */

import type { ReactElement } from 'react';
import { useState } from 'react';
import { projectStyles } from '../../styles';

interface AddressSelectorProps {
  value?: string;
  onChange?: (address: string) => void;
  placeholder?: string;
  className?: string;
}

export default function AddressSelector({ 
  value = '', 
  onChange, 
  placeholder = '請選擇地址',
  className = '' 
}: AddressSelectorProps): ReactElement {
  const [isOpen, setIsOpen] = useState(false);

  const handleAddressSelect = (address: string) => {
    onChange?.(address);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        className={projectStyles.form.input}
        readOnly
        onClick={() => setIsOpen(!isOpen)}
      />
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
          <div className="p-2">
            <div 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
              onClick={() => handleAddressSelect('台北市信義區信義路五段7號')}
            >
              台北市信義區信義路五段7號
            </div>
            <div 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
              onClick={() => handleAddressSelect('台北市大安區忠孝東路四段1號')}
            >
              台北市大安區忠孝東路四段1號
            </div>
            <div 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
              onClick={() => handleAddressSelect('台北市中山區中山北路二段1號')}
            >
              台北市中山區中山北路二段1號
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 