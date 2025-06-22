import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 使用 FlatCompat 來兼容舊版 ESLint 配置
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // 繼承多個預設配置
  ...compat.extends(
    'next/core-web-vitals', // Next.js 核心 Web Vitals 相關規則
    'next/typescript',      // Next.js TypeScript 相關規則
    'plugin:import/recommended', // 導入相關推薦規則
    'plugin:import/typescript',  // TypeScript 導入相關規則
    'prettier'             // 與 Prettier 兼容的規則
  ),
  {
    // 忽略特定檔案或目錄
    ignores: [
      'src/lib/firebase-client.ts',    // 忽略 Firebase 客戶端檔案
      'src/lib/firebase-config.ts',    // 忽略 Firebase 配置檔案
      'src/lib/firebase-context.tsx',  // 忽略 Firebase 上下文檔案
      'src/app/modules/**',            // 忽略模組目錄
    ],
  },
  {
    rules: {
      // React 相關規則
      'react/react-in-jsx-scope': 'off', // 關閉 React 必須在 JSX 中引入的檢查（Next.js 自動處理）
      'react/prop-types': 'off',         // 關閉 PropTypes 檢查（TypeScript 已處理型別）
      'react/jsx-uses-react': 'off',     // 關閉 React 變量使用的檢查（React 17+ 不需要）
      'react/jsx-uses-vars': 'error',    // 檢查未使用的 JSX 變量

      // Import 相關規則
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'], // 導入分組
          alphabetize: {
            order: 'asc',                // 導入按字母順序排序
            caseInsensitive: true,       // 不區分大小寫
          },
        },
      ],
      'import/no-unresolved': 'off',     // 關閉未解析導入檢查（避免 Windows 大小寫問題）
      'import/no-duplicates': 'warn',    // 警告重複導入
      'import/no-case-sensitive': 'off', // 關閉導入大小寫敏感檢查

      // 代碼風格規則
      'prefer-const': 'warn',            // 建議使用 const 而非 let 或 var
      'no-var': 'warn',                  // 建議避免使用 var
      'no-console': 'off',               // 關閉 console 檢查（開發時允許使用）
      'no-debugger': 'warn',             // 警告使用 debugger
      'no-unused-vars': 'off',           // 關閉未使用變量檢查（由 TypeScript 處理）

      // TypeScript 特定規則
      '@typescript-eslint/no-unused-vars': 'warn', // 警告未使用的 TypeScript 變量
      '@typescript-eslint/no-explicit-any': 'off', // 關閉禁止使用 any 的檢查
      '@typescript-eslint/no-var-requires': 'warn', // 警告使用 require（建議使用 import）

      // 引號和分號規則
      quotes: ['warn', 'single', { avoidEscape: true }], // 使用單引號，允許轉義
      semi: ['warn', 'always'],                          // 強制使用分號

      // 其他規則
      'prefer-template': 'warn',         // 建議使用模板字符串
      'object-shorthand': 'warn',        // 建議使用對象簡寫語法
      'prefer-arrow-callback': 'warn',   // 建議使用箭頭函數作為回調
    },
  },
];

export default eslintConfig;