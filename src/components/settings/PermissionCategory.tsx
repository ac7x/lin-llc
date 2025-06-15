/**
 * 權限類別組件
 * 顯示和管理特定類別的權限設定
 * 提供權限的展開/收合功能
 * 支援權限的勾選和更新操作
 */

import type { Permission } from '@/types/settings';

interface PermissionCategoryProps {
  category: string;
  permissions: Permission[];
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
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 flex justify-between items-center"
      >
        <span className="font-medium">{category}</span>
        <span>{isExpanded ? '▼' : '▶'}</span>
      </button>
      {isExpanded && (
        <div className="p-4 space-y-2">
          {permissions.length > 0 ? (
            permissions.map(permission => (
              <div key={permission.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={permission.id}
                  checked={selectedPermissions.includes(permission.id)}
                  onChange={(e) => onPermissionChange(permission.id, e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor={permission.id} className="text-sm">
                  {permission.name}
                  <span className="text-gray-500 dark:text-gray-400 text-xs ml-1">
                    ({permission.description})
                  </span>
                </label>
              </div>
            ))
          ) : (
            <div className="text-gray-500 dark:text-gray-400 text-sm italic">
              此類別目前沒有可用的權限
            </div>
          )}
        </div>
      )}
    </div>
  );
} 