# 權限矩陣系統說明

## 📋 概覽

本權限系統採用 **RBAC (Role-Based Access Control)** 模式，提供結構化的權限管理功能。系統支援多層級角色、細粒度權限控制和完整的權限分析工具。

## 🏗️ 系統架構

### 核心組件

```
src/app/settings/
├── components/
│   ├── permission-guard.tsx           # 權限控制組件
│   └── permission-matrix-analyzer.tsx # 權限矩陣分析器
├── hooks/
│   ├── use-permission.ts              # 基礎權限Hook
│   └── use-permission-optimized.ts    # 優化版權限Hook
├── lib/
│   ├── env-config.ts                  # 環境配置
│   ├── permission-init.ts             # 權限初始化
│   ├── permission-service.ts          # 權限服務
│   └── permission-matrix.ts           # 結構化權限矩陣 🆕
├── types/
│   └── index.ts                       # 型別定義
└── page.tsx                          # 設定頁面
```

## 🎭 角色層級

| 角色 | 層級 | 權限覆蓋率 | 說明 |
|------|------|------------|------|
| 擁有者 (owner) | 0 | 100% | 系統擁有者，擁有所有權限 |
| 管理員 (admin) | 1 | ~80% | 系統管理員，擁有大部分權限 |
| 經理 (manager) | 2 | ~60% | 部門經理，擁有部門管理權限 |
| 一般用戶 (user) | 3 | ~40% | 一般用戶，擁有基本操作權限 |
| 訪客 (guest) | 99 | ~10% | 訪客用戶，僅有查看權限 |

## 🔐 權限類別

### 1. 系統權限 (system)
- `system:read` - 查看系統資訊
- `system:write` - 編輯系統設定
- `system:admin` - 完整系統管理權限

### 2. 設定權限 (settings)
- `settings:read` - 查看系統設定
- `settings:write` - 編輯系統設定
- `settings:admin` - 完整設定管理權限

### 3. 用戶權限 (user)
- `user:read` - 查看用戶資料
- `user:write` - 編輯用戶資料
- `user:delete` - 刪除用戶資料
- `user:admin` - 完整用戶管理權限

### 4. 財務權限 (finance)
- `finance:read` - 查看財務資料
- `finance:write` - 編輯財務資料
- `finance:delete` - 刪除財務資料
- `finance:admin` - 完整財務管理權限

### 5. 專案權限 (project)
專案權限是最複雜的權限類別，支援多級資源控制：

#### 基礎權限
- `project:read` - 查看專案
- `project:write` - 編輯專案
- `project:delete` - 刪除專案
- `project:admin` - 完整專案管理

#### 工作包權限
- `project:package:read` - 查看工作包
- `project:package:write` - 編輯工作包
- `project:package:delete` - 刪除工作包
- `project:package:create` - 創建工作包

#### 子工作包權限
- `project:subpackage:read` - 查看子工作包
- `project:subpackage:write` - 編輯子工作包
- `project:subpackage:delete` - 刪除子工作包
- `project:subpackage:create` - 創建子工作包

#### 任務權限
- `project:task:read` - 查看任務
- `project:task:write` - 編輯任務
- `project:task:delete` - 刪除任務
- `project:task:create` - 創建任務
- `project:task:assign` - 指派任務

#### 成員權限
- `project:member:read` - 查看專案成員
- `project:member:write` - 編輯專案成員
- `project:member:add` - 新增專案成員
- `project:member:remove` - 移除專案成員

#### 設定權限
- `project:settings:read` - 查看專案設定
- `project:settings:write` - 編輯專案設定

### 6. 導航權限 (navigation)
- `navigation:home` - 首頁導航
- `navigation:project` - 專案導航
- `navigation:task` - 任務導航
- `navigation:account` - 帳戶導航
- `navigation:settings` - 設定導航

### 7. 儀表板權限 (dashboard)
- `dashboard:read` - 查看儀表板

### 8. 通知權限 (notification)
- `notification:read` - 查看通知
- `notification:write` - 管理通知

## 🛠️ 使用方法

### 1. 權限檢查組件

```tsx
import { PermissionGuard } from '@/app/settings/components/permission-guard';

// 基本權限檢查
<PermissionGuard permission="project:task:create">
  <CreateTaskButton />
</PermissionGuard>

// 角色檢查
<RoleGuard allowedRoles={['admin', 'manager']}>
  <AdminPanel />
</RoleGuard>

// 專案權限檢查
<ProjectActionGuard action="create" resource="task">
  <CreateTaskForm />
</ProjectActionGuard>

// 需要擁有者權限
<PermissionGuard permission="settings:admin" requireOwner>
  <SystemSettings />
</PermissionGuard>
```

### 2. 權限Hook使用

```tsx
import { usePermissionContext } from '@/context/permission-context';

function MyComponent() {
  const { hasPermission, userRole, userProfile } = usePermissionContext();
  
  // 檢查權限
  const canCreateTask = hasPermission('project:task:create');
  
  // 異步權限檢查
  const checkPermission = async () => {
    const hasAdvancedPermission = await checkPermission('system:admin');
    if (hasAdvancedPermission) {
      // 執行需要高級權限的操作
    }
  };
  
  return (
    <div>
      {canCreateTask && <CreateTaskButton />}
      <p>當前角色: {userRole?.name}</p>
    </div>
  );
}
```

### 3. 權限矩陣工具

```tsx
import { PermissionMatrixGenerator } from '@/app/settings/lib/permission-matrix';

// 生成所有權限
const allPermissions = PermissionMatrixGenerator.generateAllPermissions();

// 檢查角色權限
const hasPermission = PermissionMatrixGenerator.hasRolePermission('admin', 'project:task:create');

// 獲取權限矩陣
const matrix = PermissionMatrixGenerator.getPermissionMatrix();

// 分析權限覆蓋率
const analysis = PermissionMatrixGenerator.analyzePermissionCoverage();
```

## 📊 權限分析

系統提供完整的權限分析功能：

### 概覽分析
- 總權限數統計
- 角色數量統計
- 權限類別統計
- 角色權限覆蓋率分析

### 權限矩陣
- 完整的角色-權限對照表
- 視覺化權限狀態
- 按類別分組顯示

### 類別分析
- 每個權限類別的詳細分析
- 角色在各類別的覆蓋率
- 權限分布統計

## 🔧 配置和擴展

### 1. 添加新權限

在 `permission-matrix.ts` 中更新 `PERMISSION_MATRIX`：

```typescript
export const PERMISSION_MATRIX: Record<string, PermissionStructure> = {
  // 現有配置...
  
  // 新增類別
  [PERMISSION_CATEGORIES.NEW_CATEGORY]: {
    category: PERMISSION_CATEGORIES.NEW_CATEGORY,
    actions: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.WRITE],
    description: '新權限類別描述',
    resources: ['resource1', 'resource2'], // 可選
  },
};
```

### 2. 修改角色權限

在 `ROLE_PERMISSION_MAPPING` 中更新角色配置：

```typescript
export const ROLE_PERMISSION_MAPPING = {
  // 現有角色...
  
  newRole: {
    level: 4,
    name: '新角色',
    description: '新角色描述',
    permissions: [
      'category:action',
      // 其他權限...
    ],
  },
};
```

### 3. 自定義權限檢查

```typescript
// 自定義權限邏輯
const customPermissionCheck = (user: UserProfile, context: any) => {
  // 實現自定義邏輯
  if (context.isOwner && user.uid === context.resourceOwnerId) {
    return true;
  }
  
  // 使用標準權限檢查
  return hasPermission('resource:action');
};
```

## 🚀 最佳實踐

### 1. 權限設計原則
- **最小權限原則**: 每個角色只擁有執行其職能所需的最小權限
- **分層授權**: 通過角色層級實現權限繼承
- **細粒度控制**: 提供足夠細的權限粒度以滿足業務需求

### 2. 安全考慮
- 定期審查權限配置
- 監控權限使用情況
- 敏感操作需要額外驗證
- 記錄權限變更歷史

### 3. 性能優化
- 使用權限快取減少數據庫查詢
- 批量權限檢查
- 異步權限載入
- 權限預載入策略

## 🔄 更新和維護

### 權限同步
系統會自動同步 Firestore 中的權限配置，確保：
- 新權限自動添加到數據庫
- 角色權限及時更新
- 用戶權限狀態實時同步

### 版本升級
當權限結構變更時：
1. 更新 `permission-matrix.ts` 配置
2. 運行權限初始化腳本
3. 檢查現有用戶權限
4. 執行數據遷移（如需要）

## 📚 相關文檔

- [權限組件API文檔](./components/README.md)
- [權限服務API文檔](./lib/README.md)
- [型別定義說明](./types/README.md)
- [Firebase配置指南](../../lib/README.md)

---

**注意**: 此權限系統設計為可擴展的架構，可根據業務需求靈活調整權限配置和角色定義。 