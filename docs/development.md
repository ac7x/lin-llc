# 🛠️ 開發指南

本指南提供 LIN LLC 企業管理系統的開發規範和最佳實踐。

## 📋 開發環境設定

### 快速開始
```bash
# 複製專案
git clone https://github.com/your-org/lin-llc.git
cd lin-llc

# 安裝依賴
npm install

# 設定環境變數
cp .env.example .env.local

# 啟動開發伺服器
npm run dev
```

### 必要工具
- **Node.js**: 20.x+
- **IDE**: VSCode (推薦) + TypeScript 擴充功能
- **瀏覽器**: Chrome DevTools

## 🏗️ 技術架構

### 核心技術棧
- **前端**: Next.js 15 + React 18 + TypeScript
- **樣式**: Tailwind CSS + Radix UI
- **後端**: Firebase (Auth, Firestore, Storage)
- **AI**: Google Gemini API
- **地圖**: Google Maps API

### 專案結構
```
src/
├── app/                    # App Router 頁面
│   ├── dashboard/          # 儀表板
│   ├── finance/            # 財務管理
│   ├── project/            # 專案管理
│   └── settings/           # 系統設定
├── components/ui/          # UI 組件庫
├── hooks/                  # 自訂 Hooks
├── lib/                   # 工具函數
└── types/                 # TypeScript 型別
```

## 📝 編碼規範

### TypeScript 規範
```typescript
// ✅ 正確：使用嚴格型別
interface User {
  id: string;
  name: string;
  email: string;
}

// ❌ 錯誤：避免使用 any
const user: any = getUserData();

// ✅ 正確：使用 unknown 並做型別檢查
const user: unknown = getUserData();
if (isUser(user)) {
  // 使用 user
}
```

### React 組件規範
```typescript
// ✅ 正確：Function Component + TypeScript
interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ children, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button 
      className={cn('btn', `btn-${variant}`)}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// ❌ 錯誤：避免 class component
class Button extends React.Component { ... }
```

### 命名規範
- **檔案**: kebab-case (`user-profile.tsx`)
- **組件**: PascalCase (`UserProfile`)
- **函數/變數**: camelCase (`getUserData`)
- **常數**: UPPER_SNAKE_CASE (`API_BASE_URL`)

## 🔄 開發工作流程

### Git 工作流程
```bash
# 1. 建立功能分支
git checkout -b feature/add-user-management

# 2. 開發功能
# 3. 提交變更
git add .
git commit -m "feat: add user management interface"

# 4. 推送並建立 PR
git push origin feature/add-user-management
```

### 提交訊息規範
```
feat: 新增功能
fix: 修復錯誤
docs: 文件更新
style: 樣式調整
refactor: 重構代碼
test: 測試相關
chore: 維護工作
```

## 🧪 測試與品質

### 程式碼檢查
```bash
# 型別檢查
npm run type-check

# ESLint 檢查
npm run lint

# 自動修復
npm run lint:fix

# 格式化
npm run format
```

### 建置測試
```bash
# 開發建置
npm run build

# 預覽建置結果
npm run start
```

## 🔥 Firebase 開發

### Firestore 查詢
```typescript
// ✅ 正確：加上限制和錯誤處理
async function getProjects() {
  try {
    const projectsRef = collection(db, 'projects');
    const q = query(
      projectsRef, 
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    throw new Error('無法載入專案列表');
  }
}
```

### 安全規則
- 依賴 Firebase Security Rules 控制權限
- 前端不實作權限邏輯
- 所有 API 調用須有錯誤處理

## 🎨 UI/UX 開發

### Tailwind CSS 使用
```tsx
// ✅ 正確：使用 Tailwind + cn() 工具
import { cn } from '@/lib/utils';

<div className={cn(
  'flex items-center space-x-2',
  'rounded-lg border p-4',
  isActive && 'bg-blue-50 border-blue-200'
)}>
```

### 響應式設計
```tsx
// 行動優先設計
<div className="
  grid grid-cols-1 gap-4
  md:grid-cols-2 md:gap-6
  lg:grid-cols-3 lg:gap-8
">
```

## ⚡ 效能優化

### React 最佳實踐
```typescript
// 使用 React.memo 優化重渲染
export const ProjectCard = React.memo(({ project }: { project: Project }) => {
  return <div>{project.name}</div>;
});

// 使用 useMemo 快取計算結果
const expensiveValue = useMemo(() => {
  return calculateComplexValue(data);
}, [data]);

// 使用 useCallback 穩定函數引用
const handleClick = useCallback(() => {
  onItemClick(item.id);
}, [item.id, onItemClick]);
```

### 程式碼分割
```typescript
// 動態載入組件
const ProjectViewer = dynamic(() => import('./components/ProjectViewer'), {
  loading: () => <div>載入中...</div>
});
```

## 🐛 偵錯與問題排除

### 常見問題
1. **Hydration 錯誤**: 確保 SSR 和 CSR 渲染一致
2. **Firebase 連線**: 檢查環境變數和網路連線
3. **型別錯誤**: 使用 TypeScript strict 模式

### 偵錯工具
- React DevTools
- Firebase Emulator Suite
- Chrome DevTools
- Next.js 內建偵錯

## 📦 套件管理

### 新增依賴
```bash
# 生產依賴
npm install package-name

# 開發依賴
npm install -D package-name

# 檢查安全漏洞
npm audit
```

### 版本管理
- 遵循語義化版本 (Semantic Versioning)
- 定期更新依賴套件
- 測試相容性

## 🚀 部署準備

### 建置檢查
```bash
# 完整檢查
npm run check

# 建置測試
npm run build

# 型別檢查
npm run type-check
```

### 環境變數
- 開發: `.env.local`
- 測試: `.env.test`
- 生產: Firebase Hosting 環境變數

---

遵循這些開發規範可確保程式碼品質和團隊協作效率。如有疑問請參考其他文件或聯繫開發團隊。
