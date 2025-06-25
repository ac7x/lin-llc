import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import importPlugin from 'eslint-plugin-import'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: {
    import: importPlugin.configs.recommended, 
  },
});

const eslintConfig = [
  ...compat.extends(
    'next/core-web-vitals',
    'next/typescript',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier'
  ),
  {
    ignores: [
      'src/lib/firebase-client.ts',
      'src/lib/firebase-config.ts',
      'src/lib/firebase-context.tsx',
      'src/app/project/**', 
    ],
  },
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      // ===== React 規則 =====
      'react/react-in-jsx-scope': 'off', // 在 React 17+ 中不再需要，關閉此規則
      'react/prop-types': 'off', // 使用 TypeScript，不需要 prop-types，關閉此規則
      'react/jsx-uses-react': 'off', // 在 React 17+ 中不再需要，關閉此規則
      'react/jsx-uses-vars': 'error', // 防止 JSX 中已定義的變數被標記為未使用

      // ===== Import 規則 =====
      'import/no-unresolved': 'off', // 關閉 import/no-unresolved，因為它可能與路徑別名衝突
      'import/no-duplicates': 'warn', // 警告：不允許多次從同一個模組導入

      // ===== JavaScript/TypeScript 基礎規則 =====
      'prefer-const': 'warn', // 警告：建議使用 const 而不是 let，如果變數未被重新賦值
      'no-var': 'warn', // 警告：建議使用 let 或 const，而不是 var
      'no-console': 'off', // 允許在開發中使用 console.log
      'no-debugger': 'warn', // 警告：禁止在生產環境中使用 debugger

      // ===== TypeScript 相關規則 =====
      'no-unused-vars': 'off', // 關閉原生 no-unused-vars，使用 @typescript-eslint 版本
      '@typescript-eslint/no-unused-vars': 'warn', // 警告：檢查未使用的 TypeScript 變數
      '@typescript-eslint/no-explicit-any': 'off', // 暫時允許使用 any 型別，但建議未來修復
      '@typescript-eslint/no-var-requires': 'warn', // 警告：禁止使用 require() 語法，建議使用 ES6 import
      '@typescript-eslint/no-floating-promises': 'error',

      // ===== 程式碼風格建議 =====
      'prefer-template': 'warn', // 警告：建議使用模板字串而不是字串串接
      'object-shorthand': 'warn', // 警告：建議使用物件簡寫語法
      'prefer-arrow-callback': 'warn', // 警告：建議使用箭頭函式作為回呼函式

      '@next/next/no-html-link-for-pages': 'error',
      '@next/next/no-img-element': 'error',
    },
  },
];

export default eslintConfig;