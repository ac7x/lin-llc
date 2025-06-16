/**
 * 權限類別組件
 * 用於顯示和管理特定類別的權限
 */

import React from 'react';
import type { UnifiedPermission } from '@/types/permission';

interface PermissionCategoryProps {
  category: string;
  permissions: UnifiedPermission[];
  selectedPermissions: string[];
  onPermissionChange: (permissionId: string, checked: boolean) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

export function PermissionCategory({
  category,
  permissions,
  selectedPermissions,
  onPermissionChange,
  isExpanded,
  onToggle
}: PermissionCategoryProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
      >
        <span className="font-medium">{category}</span>
        <svg
          className={`w-5 h-5 transform transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      
      {isExpanded && (
        <div className="p-4 space-y-2">
          {permissions.map(permission => (
            <div key={permission.id} className="flex items-center">
              <input
                type="checkbox"
                id={`permission-${permission.id}`}
                checked={selectedPermissions.includes(permission.id)}
                onChange={(e) => onPermissionChange(permission.id, e.target.checked)}
                className="mr-2"
              />
              <label htmlFor={`permission-${permission.id}`} className="text-sm">
                {permission.name}
                <span className="text-gray-500 dark:text-gray-400 text-xs ml-1">
                  ({permission.description})
                </span>
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 