# 權限管理系統設定指南

## 環境變數設定

### 1. 設定擁有者 UID

在專案根目錄建立 `.env.local` 檔案，並設定以下環境變數：

```bash
# 擁有者 UID - 請將此值設定為實際的擁有者 UID
NEXT_PUBLIC_OWNER_UID=your-owner-uid-here
```

### 2. 獲取擁有者 UID

1. 登入 Firebase Console
2. 前往 Authentication > Users
3. 找到要設為擁有者的用戶
4. 複製該用戶的 UID
5. 將 UID 填入 `NEXT_PUBLIC_OWNER_UID` 環境變數

## 權限系統功能

### 預設角色

系統預設包含以下角色：

1. **擁有者 (Owner)** - 等級 0
   - 擁有所有權限
   - 可以管理所有系統設定

2. **管理員 (Admin)** - 等級 1
   - 擁有大部分權限
   - 可以管理財務、專案、用戶

3. **經理 (Manager)** - 等級 2
   - 擁有部門管理權限
   - 可以查看和編輯財務、專案

4. **一般用戶 (User)** - 等級 3
   - 擁有基本操作權限
   - 可以查看財務、編輯專案

5. **訪客 (Guest)** - 等級 99
   - 僅有查看權限
   - 可以查看財務和專案

### 權限類別

系統包含以下權限類別：

- **財務管理** (`finance`)
  - `finance:read` - 查看財務
  - `finance:write` - 編輯財務
  - `finance:delete` - 刪除財務
  - `finance:admin` - 財務管理

- **專案管理** (`project`)
  - `project:read` - 查看專案
  - `project:write` - 編輯專案
  - `project:delete` - 刪除專案
  - `project:admin` - 專案管理

- **用戶管理** (`user`)
  - `user:read` - 查看用戶
  - `user:write` - 編輯用戶
  - `user:delete` - 刪除用戶
  - `user:admin` - 用戶管理

- **系統設定** (`settings`)
  - `settings:read` - 查看設定
  - `settings:write` - 編輯設定
  - `settings:admin` - 設定管理

- **系統管理** (`system`)
  - `system:read` - 查看系統
  - `system:write` - 編輯系統
  - `system:admin` - 系統管理

## 使用方法

### 1. 權限檢查

```tsx
import { usePermission } from '@/hooks/use-permission';

function MyComponent() {
  const { hasPermission } = usePermission();
  
  if (hasPermission('finance:read')) {
    return <div>財務資料</div>;
  }
  
  return <div>權限不足</div>;
}
```

### 2. 權限控制組件

```tsx
import { PermissionGuard } from '@/components/permission-guard';

function MyComponent() {
  return (
    <PermissionGuard permission="finance:write">
      <button>編輯財務</button>
    </PermissionGuard>
  );
}
```

### 3. 角色控制

```tsx
import { RoleGuard } from '@/components/permission-guard';

function MyComponent() {
  return (
    <RoleGuard allowedRoles={['admin', 'manager']}>
      <div>管理員專用內容</div>
    </RoleGuard>
  );
}
```

### 4. 資料範圍控制

```tsx
import { DataScopeGuard } from '@/components/permission-guard';

function MyComponent() {
  return (
    <DataScopeGuard 
      scope="department" 
      userDepartment="IT" 
      dataDepartment="IT"
    >
      <div>部門資料</div>
    </DataScopeGuard>
  );
}
```

## 自定義角色

### 創建自定義角色

```tsx
import { usePermission } from '@/hooks/use-permission';

function CreateRole() {
  const { createCustomRole } = usePermission();
  
  const handleCreate = async () => {
    const roleId = await createCustomRole({
      name: '財務專員',
      description: '專門處理財務相關工作',
      level: 5,
      permissions: ['finance:read', 'finance:write'],
      isCustom: true,
    });
  };
}
```

### 分配角色給用戶

```tsx
import { usePermission } from '@/hooks/use-permission';

function AssignRole() {
  const { assignUserRole } = usePermission();
  
  const handleAssign = async () => {
    await assignUserRole('user-uid', 'role-id');
  };
}
```

## 資料庫結構

### Collections

1. **users** - 用戶資料
   ```typescript
   {
     uid: string;
     email: string;
     displayName: string;
     photoURL?: string;
     roleId: string;
     department?: string;
     position?: string;
     phone?: string;
     isActive: boolean;
     createdAt: string;
     updatedAt: string;
     lastLoginAt: string;
     loginCount: number;
   }
   ```

2. **roles** - 角色定義
   ```typescript
   {
     id: string;
     name: string;
     description: string;
     level: number;
     permissions: string[];
     isCustom: boolean;
     createdAt: string;
     createdBy: string;
     updatedAt: string;
     updatedBy: string;
   }
   ```

3. **userRoles** - 用戶角色關聯
   ```typescript
   {
     uid: string;
     roleId: string;
     assignedBy: string;
     assignedAt: string;
     expiresAt?: string;
     isActive: boolean;
   }
   ```

4. **permissions** - 權限定義
   ```typescript
   {
     id: string;
     name: string;
     description: string;
     resource: string;
     action: string;
     category: string;
   }
   ```

5. **dataScopes** - 資料範圍控制
   ```typescript
   {
     uid: string;
     scope: 'all' | 'department' | 'own' | 'none';
     departments?: string[];
     projects?: string[];
   }
   ```

## 安全注意事項

1. **擁有者 UID 設定**
   - 確保 `NEXT_PUBLIC_OWNER_UID` 設定正確
   - 只有擁有者可以進行系統級管理

2. **權限驗證**
   - 所有敏感操作都應該進行權限檢查
   - 使用 `PermissionGuard` 組件控制 UI 顯示

3. **資料範圍**
   - 實施資料隔離，確保用戶只能訪問授權的資料
   - 使用 `DataScopeGuard` 控制資料存取

4. **角色管理**
   - 定期審查角色權限
   - 及時撤銷過期的角色分配

## 故障排除

### 常見問題

1. **權限檢查失敗**
   - 檢查用戶是否已正確登入
   - 確認用戶角色是否正確分配
   - 檢查權限 ID 是否正確

2. **擁有者權限無效**
   - 確認 `NEXT_PUBLIC_OWNER_UID` 環境變數設定正確
   - 重新啟動開發伺服器

3. **角色無法創建**
   - 確認當前用戶有 `settings:write` 權限
   - 檢查 Firestore 規則設定

4. **資料庫連接失敗**
   - 確認 Firebase 配置正確
   - 檢查網路連線
   - 確認 Firestore 規則允許讀寫操作 