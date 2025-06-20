# 編碼標準與最佳實踐

## 目錄
1. [基本原則](#基本原則)
2. [代碼風格](#代碼風格)
3. [TypeScript 規範](#typescript-規範)
4. [React 組件規範](#react-組件規範)
5. [檔案組織](#檔案組織)
6. [命名規範](#命名規範)
7. [錯誤處理](#錯誤處理)
8. [效能優化](#效能優化)
9. [安全性](#安全性)
10. [測試規範](#測試規範)

## 基本原則

### 1. 一致性優先
- 所有代碼必須遵循統一的風格和格式
- 使用 Prettier 自動格式化
- 使用 ESLint 進行代碼檢查

### 2. 可讀性
- 代碼應該自解釋
- 使用有意義的變數和函數名稱
- 適當添加註解說明複雜邏輯

### 3. 可維護性
- 避免重複代碼
- 模組化設計
- 單一職責原則

### 4. 型別安全
- 嚴格使用 TypeScript
- 避免使用 `any` 型別
- 定義清晰的介面和型別

## 代碼風格

### 格式化規則
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

### 引號使用
- 統一使用單引號 `'`
- 字串內包含單引號時使用雙引號 `"`

### 分號
- 所有語句結尾必須加分號

### 縮排
- 使用 2 個空格
- 不使用 Tab

## TypeScript 規範

### 型別定義
```typescript
// ✅ 正確
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

// ❌ 錯誤
interface User {
  id: any;
  name: any;
  email: any;
  createdAt: any;
}
```

### 泛型使用
```typescript
// ✅ 正確
function createArray<T>(length: number, value: T): T[] {
  return Array(length).fill(value);
}

// ❌ 錯誤
function createArray(length: number, value: any): any[] {
  return Array(length).fill(value);
}
```

### 型別斷言
```typescript
// ✅ 正確 - 使用型別守衛
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

// ❌ 錯誤 - 直接斷言
const value = someValue as string;
```

## React 組件規範

### 組件定義
```typescript
// ✅ 正確 - Function Component
interface UserCardProps {
  user: User;
  onEdit?: (user: User) => void;
  onDelete?: (userId: string) => void;
}

export function UserCard({ user, onEdit, onDelete }: UserCardProps): React.ReactElement {
  return (
    <div className="user-card">
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  );
}

// ❌ 錯誤 - Class Component
export class UserCard extends React.Component<UserCardProps> {
  render() {
    return <div>...</div>;
  }
}
```

### Hooks 使用
```typescript
// ✅ 正確
export function useUser(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const userData = await getUser(userId);
        setUser(userData);
      } catch (err) {
        setError(err instanceof Error ? err.message : '未知錯誤');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  return { user, loading, error };
}

// ❌ 錯誤 - 在條件語句中使用 hooks
function BadComponent({ condition }: { condition: boolean }) {
  if (condition) {
    const [state, setState] = useState(false); // 錯誤！
  }
  return <div>...</div>;
}
```

### 事件處理
```typescript
// ✅ 正確
const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  // 處理邏輯
}, []);

// ❌ 錯誤
const handleSubmit = (event: any) => {
  // 處理邏輯
};
```

## 檔案組織

### 目錄結構
```
src/
├── app/                    # Next.js App Router 頁面
├── components/             # 可重用組件
│   ├── common/            # 通用組件
│   ├── layout/            # 布局組件
│   └── [feature]/         # 功能特定組件
├── hooks/                 # 自定義 Hooks
├── lib/                   # 第三方庫配置
├── types/                 # TypeScript 型別定義
├── utils/                 # 工具函數
└── constants/             # 常數定義
```

### 檔案命名
- 組件檔案：PascalCase（如 `UserCard.tsx`）
- 工具函數：camelCase（如 `dateUtils.ts`）
- 常數檔案：camelCase（如 `navigation.ts`）
- 型別定義：camelCase（如 `user.d.ts`）

## 命名規範

### 變數和函數
```typescript
// ✅ 正確
const userName = 'John';
const isUserLoggedIn = true;
const handleUserLogin = () => {};
const fetchUserData = async () => {};

// ❌ 錯誤
const user_name = 'John';
const is_user_logged_in = true;
const handle_user_login = () => {};
const fetch_user_data = async () => {};
```

### 組件
```typescript
// ✅ 正確
export function UserProfile() {}
export function ProjectCard() {}
export function NavigationMenu() {}

// ❌ 錯誤
export function userProfile() {}
export function project_card() {}
export function navigationMenu() {}
```

### 常數
```typescript
// ✅ 正確
export const API_BASE_URL = 'https://api.example.com';
export const MAX_RETRY_ATTEMPTS = 3;
export const DEFAULT_PAGE_SIZE = 20;

// ❌ 錯誤
export const apiBaseUrl = 'https://api.example.com';
export const maxRetryAttempts = 3;
export const defaultPageSize = 20;
```

## 錯誤處理

### 異步錯誤處理
```typescript
// ✅ 正確
const handleAsyncOperation = async () => {
  try {
    const result = await someAsyncOperation();
    return result;
  } catch (error) {
    console.error('操作失敗:', error);
    throw new Error('操作失敗，請稍後再試');
  }
};

// ❌ 錯誤
const handleAsyncOperation = async () => {
  const result = await someAsyncOperation(); // 沒有錯誤處理
  return result;
};
```

### 錯誤邊界
```typescript
// ✅ 正確
export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return <div>發生錯誤，請重新載入頁面</div>;
  }

  return (
    <ErrorBoundaryComponent onError={() => setHasError(true)}>
      {children}
    </ErrorBoundaryComponent>
  );
}
```

## 效能優化

### 記憶化
```typescript
// ✅ 正確
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

const handleClick = useCallback(() => {
  // 處理點擊事件
}, [dependency]);

// ❌ 錯誤
const expensiveValue = computeExpensiveValue(data); // 每次渲染都重新計算
const handleClick = () => {}; // 每次渲染都重新創建
```

### 懶載入
```typescript
// ✅ 正確
const LazyComponent = lazy(() => import('./LazyComponent'));

function App() {
  return (
    <Suspense fallback={<div>載入中...</div>}>
      <LazyComponent />
    </Suspense>
  );
}
```

## 安全性

### 輸入驗證
```typescript
// ✅ 正確
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const handleSubmit = (email: string) => {
  if (!validateEmail(email)) {
    throw new Error('無效的電子郵件格式');
  }
  // 處理提交
};

// ❌ 錯誤
const handleSubmit = (email: string) => {
  // 直接使用未驗證的輸入
  submitEmail(email);
};
```

### XSS 防護
```typescript
// ✅ 正確
const userInput = '<script>alert("xss")</script>';
return <div>{userInput}</div>; // React 自動轉義

// ❌ 錯誤
const userInput = '<script>alert("xss")</script>';
return <div dangerouslySetInnerHTML={{ __html: userInput }} />;
```

## 測試規範

### 單元測試
```typescript
// ✅ 正確
describe('UserCard', () => {
  it('應該正確顯示用戶資訊', () => {
    const user = { id: '1', name: 'John', email: 'john@example.com' };
    render(<UserCard user={user} />);
    
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('應該在點擊編輯按鈕時調用 onEdit', () => {
    const onEdit = jest.fn();
    const user = { id: '1', name: 'John', email: 'john@example.com' };
    
    render(<UserCard user={user} onEdit={onEdit} />);
    fireEvent.click(screen.getByText('編輯'));
    
    expect(onEdit).toHaveBeenCalledWith(user);
  });
});
```

### 整合測試
```typescript
// ✅ 正確
describe('用戶管理流程', () => {
  it('應該能夠創建新用戶', async () => {
    render(<UserManagement />);
    
    fireEvent.change(screen.getByLabelText('姓名'), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText('電子郵件'), {
      target: { value: 'john@example.com' },
    });
    fireEvent.click(screen.getByText('創建用戶'));
    
    await waitFor(() => {
      expect(screen.getByText('用戶創建成功')).toBeInTheDocument();
    });
  });
});
```

## 開發工具

### 腳本命令
```bash
# 代碼檢查
npm run lint

# 自動修復
npm run lint:fix

# 代碼格式化
npm run format

# 檢查格式化
npm run format:check

# 型別檢查
npm run type-check

# 建置檢查
npm run build
```

### IDE 設定
建議在 VS Code 中安裝以下擴展：
- ESLint
- Prettier
- TypeScript Importer
- Auto Rename Tag
- Bracket Pair Colorizer

### Git Hooks
建議設定 pre-commit hook 自動執行：
- `npm run lint`
- `npm run format`
- `npm run type-check`

## 最佳實踐檢查清單

在提交代碼前，請確認：

- [ ] 代碼通過 ESLint 檢查
- [ ] 代碼通過 Prettier 格式化
- [ ] TypeScript 編譯無錯誤
- [ ] 所有測試通過
- [ ] 沒有 console.log 或 debugger 語句
- [ ] 沒有未使用的變數或 import
- [ ] 組件有適當的型別定義
- [ ] 錯誤處理完整
- [ ] 效能優化適當
- [ ] 安全性考慮周全

## 常見問題

### Q: 如何處理第三方庫的型別定義？
A: 優先使用 `@types/` 套件，如果沒有則在 `src/types/` 目錄下創建自定義型別定義。

### Q: 何時使用 useMemo 和 useCallback？
A: 當計算成本高或依賴項變化不頻繁時使用 useMemo，當函數作為 props 傳遞給子組件時使用 useCallback。

### Q: 如何處理全局狀態？
A: 使用 React Context 或狀態管理庫（如 Zustand），避免過度使用全局狀態。

### Q: 如何確保代碼品質？
A: 使用 TypeScript 嚴格模式，定期進行代碼審查，建立自動化測試流程。 