# 📐 Next.js 15 專案命名與結構標準（Client Page + Server Actions）

此規範針對 Next.js 15 `app/` 目錄架構，**全部 `page.tsx` 為 Client Components（帶 `use client`）**，使用 Server Actions 進行前後端交互，且不使用 API Route。

---

## 📁 目錄與檔案命名規則

| 項目             | 命名格式     | 範例                           | 說明                                 |
|------------------|--------------|--------------------------------|--------------------------------------|
| 資料夾名稱       | `kebab-case` | `work-schedule/`, `task-form/`| 路由 segment 與一般資料夾皆用 kebab-case |
| Page 檔案         | `page.tsx`   | `page.tsx`                     | **全部 Client Components**，首行加 `use client` |
| Client Component  | `kebab-case.tsx` | `task-form.tsx`             | 元件檔案使用 kebab-case               |
| CSS Module       | `kebab-case.module.css` | `task-form.module.css`  | 對應 Component 命名                   |
| Custom Hook      | `use-xxx.ts` | `use-task-form.ts`             | 以 `use-` 開頭，camelCase 函數命名    |
| Server Actions   | `kebab-case.ts` | `create-task.ts`              | 集中放 `actions/` 資料夾               |

---

## 🧱 專案目錄範例

```txt
app/
├── layout.tsx                  # Server Component，無需 use client
├── page.tsx                   # Client Component，首頁
├── work-schedule/             # 路由資料夾
│   ├── page.tsx               # Client Component 頁面，首行帶 'use client'
│   ├── task-form.tsx          # Client Component，命名 kebab-case
│   ├── task-form.module.css   # CSS Module
│   ├── use-task-form.ts       # Custom Hook
│   └── actions/               # Server Actions 放置專區
│       ├── create-task.ts     # Server Action，首行帶 'use server'
│       └── update-task.ts
├── hooks/                     # 共用 Hook 資料夾
│   └── use-schedule.ts
├── features/                  # Domain & Application 層分離
│   └── task/
│       ├── domain/
│       │   ├── task.ts        # Entity 與 Value Object
│       │   └── workload.ts
│       ├── application/
│       │   ├── assign-task.ts # Use Case 函式
│       └── infrastructure/
│           └── task-repository.ts
```

---

## 🧑‍🎨 Component 命名規範

| 類型           | 命名格式     | 範例                     | 備註                             |
|----------------|--------------|--------------------------|----------------------------------|
| React Component | `PascalCase` | `TaskForm`, `WorkCard`   | 匯出名稱 PascalCase，檔名 kebab-case |
| Custom Hook    | `useCamelCase`| `useTaskForm`            | hook 必須以 `use` 開頭           |
| CSS Module     | `kebab-case.module.css` | `task-form.module.css` | 與 Component 同名               |
| Page           | 固定檔名     | `page.tsx`               | 頁面檔案，首行一定帶 `use client` |

---

## ⚙️ Server Actions 命名與寫法

- Server Actions 放在 `actions/` 資料夾中，每個檔案一個動作
- 每個 action 檔案首行加 `use server`
- 檔名使用 `kebab-case.ts`
- 函式命名用 `camelCase`

### 範例：

```ts
'use server'

export async function createTask(data: TaskCreateDto) {
  // 伺服器邏輯
}
```

---

## 🧱 Domain & Application 層命名

| 類型         | 命名格式     | 範例                        | 備註                            |
|--------------|--------------|-----------------------------|---------------------------------|
| Entity       | `PascalCase` | `Task`, `ScheduleItem`      | 代表資料模型                    |
| Value Object | `PascalCase` | `DateRange`, `WorkType`     | 不可變值                       |
| Use Case     | `camelCase` 或 `PascalCase` | `assignTask`, `AssignTaskUseCase` | 用函式或類別實作               |
| Repository   | `PascalCase` | `TaskRepository`            | 資料存取介面                  |

---

## 🧪 測試檔案命名

| 類型         | 命名格式               | 範例                      |
|--------------|------------------------|---------------------------|
| 單元測試     | `xxx.test.ts` 或 `.spec.ts` | `task-service.test.ts`    |
| 元件測試     | `xxx.test.tsx`         | `task-form.test.tsx`      |

---

## 🚫 禁止命名

| 錯誤用法         | 正確做法               | 原因                        |
|------------------|------------------------|-----------------------------|
| `Component2.tsx` | `task-form.tsx`        | 無語意，易混淆               |
| `Data.ts`, `Info.ts` | `workload-item.ts`  | 模糊，無法描述內容           |
| `PascalCase.tsx`（檔名） | `kebab-case.tsx` | Linux 大小寫敏感問題         |

---

## 🧰 推薦工具

- ESLint + Prettier（搭配 `@typescript-eslint`）
- EditorConfig
- TypeScript（嚴格型別）
- Cursor / GPT 生成可依據此命名產出

---

## 📅 最後更新

2025-05-25

---

如有需要 ESLint 或 Prettier 配置，或要加上 `.editorconfig`，可以再跟我說！  
這份命名規則會讓專案結構明確、易於維護、且符合 Next.js 15 現代開發最佳實踐。