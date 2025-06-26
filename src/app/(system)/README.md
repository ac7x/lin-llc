# 系統架構 (System Architecture)

## 📋 概覽

本目錄包含整個應用程式的核心系統架構，採用三層分離的設計模式：

```
src/app/(system)/
├── auth/                    # 認證層 (Authentication Layer)
├── permissions/             # 權限層 (Permission Layer)  
├── data/                    # 資料層 (Data Layer)
└── index.ts                 # 統一導出
```

## 🏗️ 三層架構設計

### 1. 認證層 (Authentication Layer)
```
auth/
├── context/
│   └── auth-context.tsx     # 認證上下文
└── hooks/                   # 認證相關 hooks (可擴展)
```

**職責：**
- Google OAuth 認證
- Firebase Auth 管理
- 用戶會話管理
- 登入狀態維護

**主要組件：**
- `AuthProvider` - 認證上下文提供者
- `useAuth` - 認證狀態 hook

### 2. 權限層 (Permission Layer)
```
permissions/
├── components/
│   └── permission-guard.tsx    # 權限控制組件
├── context/
│   └── permission-context.tsx  # 權限上下文
├── hooks/
│   ├── use-permission.ts       # 基礎權限 hook
│   └── use-permission-optimized.ts # 優化版權限 hook
├── lib/
│   ├── env-config.ts          # 環境配置
│   ├── permission-matrix.ts   # 權限矩陣
│   └── permission-service.ts  # 權限服務
└── types/
    └── index.ts               # 權限相關類型
```

**職責：**
- RBAC 角色權限管理
- 權限檢查和控制
- 資料範圍控制
- 權限矩陣分析

**主要組件：**
- `PermissionProvider` - 權限上下文提供者
- `PermissionGuard` - 權限守護組件
- `RoleGuard` - 角色守護組件
- `DataScopeGuard` - 資料範圍守護組件
- `ProjectActionGuard` - 專案操作守護組件

### 3. 資料層 (Data Layer)
```
data/
└── lib/
    └── firebase-init.ts         # Firebase 初始化和配置
```

**職責：**
- Firebase 服務初始化
- Firestore 資料庫連接
- Storage 文件存儲
- Analytics 分析服務
- 開發環境 Emulator 支援

**主要服務：**
- `db` - Firestore 資料庫實例
- `auth` - Firebase Auth 實例
- `storage` - Firebase Storage 實例
- `analytics` - Firebase Analytics 實例

## 🔄 使用方式

### 基礎導入
```typescript
// 從系統架構統一導入
import { 
  AuthProvider, 
  PermissionProvider, 
  PermissionGuard,
  useAuth,
  usePermissionContext,
  db,
  auth
} from '@/app/(system)';

// 或者從具體層級導入
import { useAuth } from '@/app/(system)/auth/context/auth-context';
import { PermissionGuard } from '@/app/(system)/permissions/components/permission-guard';
import { db } from '@/app/(system)/data/lib/firebase-init';
```

### 應用程式初始化
```typescript
// 在根 layout 中設置提供者
function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PermissionProvider>
        {children}
      </PermissionProvider>
    </AuthProvider>
  );
}
```

### 權限控制使用
```typescript
// 基本權限檢查
<PermissionGuard permission="project:task:create">
  <CreateButton />
</PermissionGuard>

// 角色檢查
<RoleGuard allowedRoles={['admin', 'manager']}>
  <AdminPanel />
</RoleGuard>

// 專案操作檢查
<ProjectActionGuard action="create" resource="task">
  <TaskForm />
</ProjectActionGuard>
```

### 認證狀態使用
```typescript
function MyComponent() {
  const { user, loading, initialized } = useAuth();
  const { hasPermission, userRole } = usePermissionContext();
  
  if (loading) return <Loading />;
  if (!user) return <LoginForm />;
  
  return (
    <div>
      <h1>歡迎, {user.displayName}</h1>
      <p>角色: {userRole?.name}</p>
      {hasPermission('admin:panel') && <AdminTools />}
    </div>
  );
}
```

## 🎯 設計原則

### 1. 單一職責原則
每個層級都有明確的職責分工：
- 認證層：只處理身份驗證
- 權限層：只處理授權和權限控制
- 資料層：只處理資料存取和連接

### 2. 依賴反轉
- 上層依賴下層的抽象介面
- 權限層依賴認證層的用戶狀態
- 各層之間通過明確的 API 交互

### 3. 開放封閉原則
- 對擴展開放：可以輕鬆添加新的權限類型、認證方式
- 對修改封閉：核心架構穩定，不需要頻繁修改

### 4. 介面隔離
- 每個層級提供清晰的介面
- 組件只依賴它們實際需要的介面

## 🔒 安全考量

### 1. 認證層安全
- 使用 Firebase Auth 的安全認證
- 支援多種認證方式 (Google OAuth)
- 自動處理 token 刷新

### 2. 權限層安全
- 細粒度權限控制
- 角色繼承和權限組合
- 前後端權限一致性檢查

### 3. 資料層安全
- Firestore 安全規則
- 資料存取權限控制
- 敏感資料加密

## 🚀 效能優化

### 1. 權限快取
- 本地權限狀態快取
- 避免重複的權限檢查
- 智能快取失效機制

### 2. 延遲載入
- 按需載入權限資料
- 組件級別的權限檢查
- 異步權限驗證

### 3. 批量操作
- 批量權限檢查
- 批量資料載入
- 減少網路請求次數

## 📈 監控和分析

### 1. 認證監控
- 登入成功/失敗率
- 用戶會話時長
- 認證方式分析

### 2. 權限使用分析
- 權限使用頻率
- 權限拒絕統計
- 角色分布分析

### 3. 效能監控
- 權限檢查延遲
- 資料載入時間
- 錯誤率統計

## 🔧 開發工具

### 1. 除錯支援
- 開發環境下的詳細日誌
- 權限檢查過程追蹤
- Firebase Emulator 整合

### 2. 測試支援
- 模擬認證狀態
- 權限場景測試
- 資料層測試工具

### 3. 開發體驗
- TypeScript 完整類型支援
- ESLint 規則檢查
- 自動化測試覆蓋

---

此系統架構設計為可擴展、安全且高效的權限管理系統，為整個應用程式提供堅實的基礎架構支撐。 