'use client';

import { 
  PermissionAlert,
  AccessDeniedAlert,
  ProjectListPermissionAlert,
  ProjectEditPermissionAlert,
  SettingsPermissionAlert,
  PermissionProtected,
} from './index';
import { Button } from '@/components/ui/button';

// 使用範例組件
export function PermissionAlertExamples() {
  return (
    <div className="space-y-4 p-4">
      <h2 className="text-lg font-semibold">權限提示組件使用範例</h2>
      
      {/* 基本權限提示 */}
      <div className="space-y-2">
        <h3 className="font-medium">基本權限提示</h3>
        <PermissionAlert type="access" />
      </div>

      {/* 自定義訊息 */}
      <div className="space-y-2">
        <h3 className="font-medium">自定義訊息</h3>
        <PermissionAlert 
          type="view"
          title="無法查看財務資料"
          message="您需要財務相關權限才能查看此資料"
        />
      </div>

      {/* 預設組件 */}
      <div className="space-y-2">
        <h3 className="font-medium">預設組件</h3>
        <AccessDeniedAlert />
        <ProjectListPermissionAlert />
        <ProjectEditPermissionAlert />
        <SettingsPermissionAlert />
      </div>

      {/* 權限保護組件使用範例 */}
      <div className="space-y-2">
        <h3 className="font-medium">權限保護組件</h3>
        
        {/* 保護按鈕 - 需要專案編輯權限 */}
        <PermissionProtected 
          permission="project:write"
          alertType="edit"
          alertTitle="專案編輯權限不足"
          alertMessage="您需要專案編輯權限才能使用此功能"
        >
          <Button>編輯專案</Button>
        </PermissionProtected>

        {/* 保護內容 - 需要財務查看權限 */}
        <PermissionProtected 
          permission="finance:read"
          alertType="view"
          alertMessage="您沒有權限查看財務資料"
        >
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium">財務資料</h4>
            <p>這裡是受權限保護的財務資料內容...</p>
          </div>
        </PermissionProtected>

        {/* 使用自定義後備內容 */}
        <PermissionProtected 
          permission="settings:write"
          fallback={
            <div className="text-muted-foreground text-sm">
              此功能需要管理員權限
            </div>
          }
        >
          <Button variant="destructive">危險操作</Button>
        </PermissionProtected>
      </div>
    </div>
  );
} 