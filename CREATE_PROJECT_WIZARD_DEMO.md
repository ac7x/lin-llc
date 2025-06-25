# 專案建立精靈使用示例

## 🎯 功能概述

專案建立精靈是一個多步驟的對話框組件，讓用戶能夠快速建立具有完整結構的專案。

## 🚀 核心特色

### 三步驟流程
1. **Step 1**: 專案基本信息 + 可選一鍵建立包
2. **Step 2**: 詢問是否為每個包建立子包
3. **Step 3**: 詢問是否為每個子包建立任務

### 智能流程控制
- 若不建立包 → 直接完成
- 若建立包但不建立子包 → 跳過任務步驟
- 完全響應式設計，適配不同場景

## 📝 使用方法

### 基本使用
```tsx
import { CreateProjectWizard } from '@/app/project/components/create-project-wizard';
import { useProjectWizard } from '@/app/project/hooks';

function MyComponent() {
  const { createProject, loading } = useProjectWizard();

  const handleCreateProject = async (config) => {
    const project = await createProject(config);
    console.log('建立的專案:', project);
  };

  return (
    <CreateProjectWizard
      onCreateProject={handleCreateProject}
      loading={loading}
    />
  );
}
```

### 自定義觸發器
```tsx
<CreateProjectWizard
  onCreateProject={handleCreateProject}
  loading={loading}
  trigger={
    <Button variant="outline">
      <PlusIcon className="h-4 w-4 mr-2" />
      建立新專案
    </Button>
  }
/>
```

## 🎨 UI 設計

### Step 1: 專案設定畫面
```
📋 建立新專案
┌─────────────────────────────────┐
│ 專案名稱: [___________________] │
│                                 │
│ ☐ 一鍵建立包                    │
│   └─ 數量: [3]                  │
│                                 │
│           [建立專案]             │
└─────────────────────────────────┘
```

### Step 2: 子包詢問
```
🔔 是否建立子包？
┌─────────────────────────────────┐
│ ( ) 否，稍後手動新增            │
│ (●) 是，每個包都建立一個子包    │
│                                 │
│     [返回]     [繼續]           │
└─────────────────────────────────┘
```

### Step 3: 任務詢問
```
🗂️ 是否建立任務？
┌─────────────────────────────────┐
│ ( ) 否，稍後手動新增            │
│ (●) 是，每個子包都建立一個任務  │
│                                 │
│     [返回]     [完成]           │
└─────────────────────────────────┘
```

## 🔧 技術實現

### 狀態管理
- 使用 `useState` 管理多步驟狀態
- 使用 `react-hook-form` + `zod` 驗證表單
- 智能流程控制邏輯

### 表單驗證
```tsx
const projectFormSchema = z.object({
  name: z.string().min(1, '專案名稱不能為空'),
  createPackages: z.boolean(),
  packageCount: z.number().min(1).max(50),
});
```

### 業務邏輯分離
```tsx
// Hook 處理資料邏輯
const { createProject, loading } = useProjectWizard();

// 組件處理 UI 邏輯
<CreateProjectWizard onCreateProject={createProject} />
```

## 📊 實際效果示例

### 情境 1: 簡單專案
```
用戶輸入: "網站改版專案"
選擇: 不建立包
結果: 只建立空專案
```

### 情境 2: 結構化專案
```
用戶輸入: "大樓建設專案"
Step 1: 建立 3 個包
Step 2: 每個包建立子包
Step 3: 每個子包建立任務
結果: 1專案 → 3包 → 3子包 → 3任務
```

### 情境 3: 部分結構
```
用戶輸入: "產品開發專案"
Step 1: 建立 5 個包
Step 2: 建立子包
Step 3: 不建立任務
結果: 1專案 → 5包 → 5子包
```

## 🎯 最佳實踐

### 1. 用戶體驗
- 清晰的步驟指示
- 智能的流程跳轉
- 即時的表單驗證

### 2. 數據完整性
- 自動計算總數量
- 一致的命名規範
- 完整的時間戳記

### 3. 性能優化
- 批量創建避免多次網路請求
- 適當的載入狀態顯示
- 錯誤處理機制

## 🔮 未來擴展

### 計劃功能
1. **範本系統**: 預設的專案範本
2. **批量操作**: 一次建立多個專案
3. **進階設定**: 更多自訂選項
4. **匯入功能**: 從 Excel 匯入專案結構

### 整合可能
- 與專案管理工具整合
- 支援更多檔案格式
- 團隊協作功能
- 進度追蹤提醒

---

這個精靈組件讓專案建立變得簡單且強大，用戶能夠用最少的步驟建立結構完整的專案！ 