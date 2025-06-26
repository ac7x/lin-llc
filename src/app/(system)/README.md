# 系統架構 (System Architecture)

## 📋 概覽

本目錄包含整個應用程式的核心系統架構，採用三層分離的設計模式：

```
src/app/(system)/
├── auth/                    # 認證層 (Authentication Layer)
│   ├── context/
│   │   └── auth-context.tsx     # 認證上下文提供者
│   └── hooks/
│       ├── use-google-auth.ts   # Google OAuth 登入 hook
│       └── use-auth-redirect.ts # 登入重定向處理 hook
├── permissions/             # 權限層 (Permission Layer)
│   ├── components/
│   │   ├── permission-guard.tsx         # 權限控制組件
│   │   └── permission-matrix-analyzer.tsx # 權限矩陣分析組件
│   ├── context/
│   │   └── permission-context.tsx       # 權限上下文提供者
│   ├── hooks/
│   │   ├── use-permission.ts            # 基礎權限管理 hook
│   │   └── use-permission-optimized.ts  # 優化版權限管理 hook
│   ├── lib/
│   │   ├── env-config.ts               # 環境配置管理
│   │   ├── permission-init.ts          # 權限系統初始化
│   │   ├── permission-matrix.ts        # 權限矩陣配置
│   │   └── permission-service.ts       # 權限管理服務
│   └── types/
│       └── index.ts                    # 權限相關類型定義
├── data/                    # 資料層 (Data Layer)
│   └── lib/
│       ├── firebase-config.ts          # Firebase 配置
│       └── firebase-init.ts            # Firebase 服務初始化
├── index.ts                 # 統一導出入口
└── README.md               # 系統架構文檔
```

## 🏗️ 三層架構設計

### 1. 認證層 (Authentication Layer)
```
auth/
├── context/
│   └── auth-context.tsx     # 認證上下文，管理全域認證狀態
└── hooks/
    ├── use-google-auth.ts   # Google OAuth 登入功能
    └── use-auth-redirect.ts # 處理登入重定向結果
```

**職責：**
- Google OAuth 認證流程
- Firebase Auth 狀態管理
- 用戶會話生命週期管理
- 登入重定向處理
- 用戶資料自動同步

**主要組件：**
- `AuthProvider` - 認證上下文提供者，管理全域認證狀態
- `useAuth` - 認證狀態 hook，提供用戶信息和載入狀態
- `useGoogleAuth` - Google 登入 hook，支援彈窗和重定向登入
- `useAuthRedirect` - 重定向結果處理 hook

### 2. 權限層 (Permission Layer)
```
permissions/
├── components/
│   ├── permission-guard.tsx         # 權限控制組件集合
│   └── permission-matrix-analyzer.tsx # 權限矩陣分析可視化組件
├── context/
│   └── permission-context.tsx       # 權限上下文提供者
├── hooks/
│   ├── use-permission.ts            # 完整功能權限管理 hook
│   └── use-permission-optimized.ts  # 效能優化版權限管理 hook
├── lib/
│   ├── env-config.ts               # 環境變數和擁有者配置
│   ├── permission-init.ts          # 預設權限和角色初始化
│   ├── permission-matrix.ts        # 結構化權限矩陣配置
│   └── permission-service.ts       # RBAC 權限管理服務
└── types/
    └── index.ts                    # 完整的權限系統類型定義
```

**職責：**
- RBAC (角色基礎存取控制) 權限管理
- 細粒度權限檢查和控制
- 多層級資料範圍控制
- 權限矩陣可視化分析
- 動態角色和權限管理
- 用戶積分和活動追蹤
- 權限快取和效能優化

**主要組件：**
- `PermissionProvider` - 權限上下文提供者，管理全域權限狀態
- `PermissionGuard` - 基於權限 ID 的存取控制組件
- `RoleGuard` - 基於角色的存取控制組件
- `DataScopeGuard` - 資料範圍存取控制組件
- `ProjectPermissionGuard` - 專案權限控制組件
- `ProjectActionGuard` - 專案操作權限控制組件
- `PermissionMatrixAnalyzer` - 權限矩陣分析和可視化組件

**核心服務：**
- `permissionService` - 權限管理核心服務
- `PermissionMatrixGenerator` - 權限矩陣生成和分析工具
- 結構化權限配置和角色映射
- 用戶在線狀態和積分系統

### 3. 資料層 (Data Layer)
```
data/
└── lib/
    ├── firebase-config.ts      # Firebase 專案配置和常數
    └── firebase-init.ts        # Firebase 服務初始化和管理
```

**職責：**
- Firebase 應用程式初始化和配置
- Firestore 資料庫連接管理
- Firebase Storage 文件存儲服務
- Firebase Analytics 分析服務
- Firebase App Check 安全防護
- 開發環境 Emulator 整合支援
- reCAPTCHA v3 驗證配置
- Google Maps API 整合配置

**主要服務：**
- `db` - Firestore 資料庫實例
- `auth` - Firebase Auth 認證實例
- `storage` - Firebase Storage 存儲實例
- `analytics` - Firebase Analytics 分析實例
- `appCheck` - Firebase App Check 安全實例
- `initializeClientServices()` - 客戶端服務初始化函數
- `getAppCheck()` / `getAppCheckSync()` - App Check 實例取得函數

**配置常數：**
- `firebaseConfig` - Firebase 專案配置
- `RECAPTCHA_CONFIG` - reCAPTCHA 配置
- `APP_CHECK_CONFIG` - App Check 配置
- `GOOGLE_MAPS_API_KEY` - Google Maps API 金鑰
- `GOOGLE_MAPS_MAP_ID` - Google Maps 地圖 ID

## 🔄 使用方式

### 基礎導入
```typescript
// 從系統架構統一導出入口導入（推薦方式）
import { 
  // 認證相關
  AuthProvider, 
  useAuth,
  useGoogleAuth,
  useAuthRedirect,
  
  // 權限相關
  PermissionProvider, 
  usePermissionContext,
  PermissionGuard,
  RoleGuard,
  DataScopeGuard,
  ProjectActionGuard,
  PermissionMatrixAnalyzer,
  
  // 資料層相關
  db,
  auth,
  storage,
  analytics,
  appCheck,
  initializeClientServices,
  firebaseConfig,
  
  // 類型定義
  UserProfile,
  Role,
  Permission
} from '@/app/(system)';

// 或者從具體層級導入（特殊需求時使用）
import { useAuth } from '@/app/(system)/auth/context/auth-context';
import { PermissionGuard } from '@/app/(system)/permissions/components/permission-guard';
import { permissionService } from '@/app/(system)/permissions/lib/permission-service';
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
  <CreateTaskButton />
</PermissionGuard>

// 角色檢查
<RoleGuard allowedRoles={['admin', 'manager']}>
  <AdminPanel />
</RoleGuard>

// 資料範圍控制
<DataScopeGuard 
  scope="department" 
  userDepartment={currentUser.department}
  dataDepartment={document.department}
>
  <SensitiveDocument />
</DataScopeGuard>

// 專案權限檢查
<ProjectPermissionGuard permission="project:settings:write">
  <ProjectSettingsForm />
</ProjectPermissionGuard>

// 專案操作檢查
<ProjectActionGuard action="create" resource="task">
  <TaskCreationForm />
</ProjectActionGuard>

// 擁有者專用功能
<PermissionGuard permission="system:admin" requireOwner>
  <SystemAdminPanel />
</PermissionGuard>
```

### 認證狀態使用
```typescript
function MyComponent() {
  const { user, loading, initialized } = useAuth();
  const { 
    hasPermission, 
    userRole, 
    userProfile,
    allUsers,
    userPoints,
    loadUserPoints,
    updateUserActivity
  } = usePermissionContext();
  
  // Google 登入功能
  const { signInWithGoogle, signOut, error } = useGoogleAuth();
  
  useEffect(() => {
    if (user?.uid) {
      // 載入用戶積分
      loadUserPoints(user.uid);
      // 更新用戶活動時間
      updateUserActivity();
    }
  }, [user?.uid]);
  
  if (loading) return <Loading />;
  if (!user) {
    return (
      <div>
        <LoginForm />
        <button onClick={signInWithGoogle}>
          使用 Google 登入
        </button>
        {error && <p>錯誤: {error}</p>}
      </div>
    );
  }
  
  return (
    <div>
      <header>
        <h1>歡迎, {user.displayName}</h1>
        <p>角色: {userRole?.name} (等級 {userRole?.level})</p>
        <p>積分: {userPoints}</p>
        <button onClick={signOut}>登出</button>
      </header>
      
      <main>
        {hasPermission('dashboard:read') && <Dashboard />}
        {hasPermission('settings:read') && <SettingsPanel />}
        {hasPermission('user:admin') && <UserManagement users={allUsers} />}
        
        {/* 權限矩陣分析（管理員專用） */}
        <PermissionGuard permission="system:admin">
          <PermissionMatrixAnalyzer />
        </PermissionGuard>
      </main>
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

### 1. 權限快取機制
- **本地 Map 快取**：`permissionCache` 儲存權限檢查結果
- **智能快取失效**：權限更新時自動清除相關快取
- **同步權限檢查**：`hasPermission()` 基於已載入角色進行快速檢查
- **異步權限驗證**：`checkPermission()` 提供完整驗證

### 2. 優化版 Hook
- **use-permission-optimized.ts**：減少日誌輸出和重複初始化
- **useMemo 緩存**：緩存擁有者判斷和計算結果
- **精確依賴項**：優化 useEffect 依賴，避免不必要的重新執行
- **防重複初始化**：`initialized` 狀態防止重複載入

### 3. 延遲載入策略
- **按需載入權限資料**：只在需要時載入完整權限列表
- **組件級權限檢查**：權限控制組件按需檢查權限
- **異步權限驗證**：非阻塞的權限檢查機制
- **分階段初始化**：認證 -> 權限 -> 用戶資料

### 4. 批量操作優化
- **並行資料載入**：同時載入角色、權限、用戶資料
- **批量權限檢查**：一次檢查多個權限
- **減少 Firestore 查詢**：合併相關查詢
- **活動時間更新優化**：降低更新頻率（2分鐘一次）

### 5. Firebase 服務優化
- **客戶端服務初始化**：避免重複初始化 Firebase 服務
- **App Check 整合**：提供安全防護同時維持效能
- **Emulator 支援**：開發環境下的快速連接
- **服務實例重用**：單例模式確保服務實例統一

## 📈 監控和分析

### 1. 認證狀態監控
- **登入成功/失敗追蹤**：記錄登入嘗試和結果
- **用戶會話管理**：追蹤會話時長和活動狀態
- **多重認證方式**：支援彈窗和重定向登入
- **用戶資料同步**：自動創建和更新用戶資料

### 2. 權限系統分析
- **權限矩陣可視化**：`PermissionMatrixAnalyzer` 組件提供完整分析
- **角色權限覆蓋率**：分析各角色的權限分布和覆蓋率
- **權限使用統計**：追蹤權限檢查頻率和使用模式
- **權限拒絕記錄**：記錄權限檢查失敗的情況
- **角色分布分析**：用戶角色分布和變化趨勢

### 3. 用戶活動追蹤
- **在線狀態監控**：實時追蹤用戶在線/離線狀態
- **活動時間更新**：定期更新用戶最後活動時間
- **登入次數統計**：記錄用戶登入頻率
- **積分系統**：用戶積分獲取、使用和排行榜
- **積分歷史記錄**：詳細的積分變化歷史

### 4. 效能監控指標
- **權限檢查延遲**：監控權限檢查的響應時間
- **資料載入時間**：追蹤 Firestore 查詢效能
- **快取命中率**：權限快取的使用效率
- **錯誤率統計**：系統錯誤和異常追蹤
- **Firebase 服務狀態**：App Check、Auth、Firestore 服務監控

### 5. 資料分析功能
- **權限矩陣生成器**：動態生成和分析權限配置
- **角色權限對應表**：完整的角色-權限映射分析
- **權限類別統計**：按類別分析權限分布
- **系統使用報告**：綜合的系統使用情況報告

## 🔧 開發工具與支援

### 1. 除錯和診斷支援
- **環境特定日誌**：開發環境下的詳細權限檢查日誌
- **權限檢查追蹤**：完整的權限驗證過程記錄
- **Firebase Emulator 整合**：開發環境下的本地 Firebase 服務
- **錯誤處理機制**：統一的錯誤處理和記錄系統
- **權限診斷工具**：`PermissionMatrixAnalyzer` 提供即時權限分析

### 2. 測試和模擬支援
- **認證狀態模擬**：測試環境下的用戶狀態模擬
- **權限場景測試**：完整的權限控制場景測試
- **角色切換測試**：動態角色權限測試功能
- **Firebase Emulator 測試**：本地資料庫測試環境
- **權限矩陣驗證**：自動化權限配置驗證

### 3. 開發體驗優化
- **完整 TypeScript 支援**：所有組件和服務的類型安全
- **統一導出入口**：`@/app/(system)` 提供一站式導入
- **ESLint 規則檢查**：代碼品質和一致性保證
- **自動化測試覆蓋**：單元測試和整合測試支援
- **文檔和註解**：詳細的 JSDoc 和內聯註解

### 4. 配置和環境管理
- **環境變數配置**：`env-config.ts` 集中管理環境設定
- **擁有者身份驗證**：`NEXT_PUBLIC_OWNER_UID` 環境變數配置
- **開發/生產環境切換**：自動環境檢測和配置
- **Firebase 專案配置**：分離的配置檔案管理
- **reCAPTCHA 和 App Check 配置**：安全服務配置管理

### 5. 效能分析工具
- **權限檢查效能監控**：權限操作的時間追蹤
- **快取效率分析**：權限快取的使用情況分析
- **Firebase 查詢優化**：Firestore 查詢效能監控
- **用戶活動分析**：用戶行為和系統使用情況分析

## 🎯 核心特色

### ✅ 完整的 RBAC 權限系統
- 5 個預設角色（擁有者、管理員、經理、用戶、訪客）
- 8 個權限類別覆蓋所有業務需求
- 細粒度權限控制到具體操作級別
- 動態角色和權限管理

### ✅ 企業級安全防護
- Firebase App Check 防止濫用攻擊
- reCAPTCHA v3 驗證保護
- 資料範圍控制和存取隔離
- 擁有者身份特殊保護

### ✅ 高效能架構設計
- 智能權限快取機制
- 優化版 Hook 減少不必要的重新渲染
- 並行資料載入和批量操作
- Firebase 服務實例重用

### ✅ 開發者友善
- 統一的導出入口和清晰的 API
- 完整的 TypeScript 類型支援
- 豐富的開發工具和除錯功能
- 詳細的文檔和使用範例

---

**此系統架構設計為可擴展、安全且高效的企業級權限管理系統，為整個應用程式提供堅實的基礎架構支撐。三層分離的設計確保了清晰的職責分工，統一的導出機制簡化了使用複雜度，而完整的權限控制和效能優化保證了系統的可靠性和穩定性。** 