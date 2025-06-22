import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import unicorn from 'eslint-plugin-unicorn';

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
    plugins: {
      unicorn, // 直接導入 unicorn 插件
    },
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

      // Unicorn 相關規則
      'unicorn/prefer-module': 'off',                    // 關閉強制使用 ES 模組（Next.js 環境）
      'unicorn/prevent-abbreviations': 'off',            // 關閉防止縮寫（允許常見縮寫）
      'unicorn/filename-case': 'off',                    // 關閉檔案名大小寫檢查
      'unicorn/no-null': 'off',                          // 關閉禁止 null 檢查（React 中常用）
      'unicorn/prefer-ternary': 'off',                   // 關閉強制使用三元運算符
      'unicorn/no-array-for-each': 'off',                // 關閉禁止 forEach（有時更清晰）
      'unicorn/prefer-array-some': 'warn',               // 建議使用 some 而非 find
      'unicorn/prefer-array-find': 'warn',               // 建議使用 find 而非 filter[0]
      'unicorn/prefer-array-index-of': 'warn',           // 建議使用 indexOf 而非 includes
      'unicorn/prefer-includes': 'warn',                 // 建議使用 includes 而非 indexOf !== -1
      'unicorn/prefer-string-starts-ends-with': 'warn',  // 建議使用 startsWith/endsWith
      'unicorn/prefer-string-slice': 'warn',             // 建議使用 slice 而非 substr/substring
      'unicorn/prefer-optional-catch-binding': 'warn',   // 建議使用可選的 catch 綁定
      'unicorn/prefer-number-properties': 'warn',        // 建議使用 Number 屬性而非 isNaN
      'unicorn/prefer-math-trunc': 'warn',               // 建議使用 Math.trunc 而非位運算
      'unicorn/prefer-date-now': 'warn',                 // 建議使用 Date.now 而非 new Date().getTime()
      'unicorn/prefer-array-flat-map': 'warn',           // 建議使用 flatMap 而非 map+flat
      'unicorn/prefer-object-from-entries': 'warn',      // 建議使用 Object.fromEntries
      'unicorn/prefer-spread': 'warn',                   // 建議使用展開運算符
      'unicorn/prefer-array-reduce': 'warn',             // 建議使用 reduce 而非循環
      'unicorn/prefer-query-selector': 'warn',           // 建議使用 querySelector
      'unicorn/throw-new-error': 'warn',                 // 建議使用 new Error
      'unicorn/error-message': 'warn',                   // 建議提供有意義的錯誤訊息
      'unicorn/no-console-spaces': 'warn',               // 警告 console 中的多餘空格
      'unicorn/no-hex-escape': 'warn',                   // 建議使用 Unicode 轉義
      'unicorn/no-process-exit': 'warn',                 // 警告使用 process.exit
      'unicorn/no-unreadable-array-destructuring': 'warn', // 警告難以理解的解構
      'unicorn/no-unsafe-regex': 'warn',                 // 警告不安全的正則表達式
      'unicorn/no-useless-undefined': 'warn',            // 警告無用的 undefined
      'unicorn/number-literal-case': 'warn',             // 建議使用小寫數字字面量
      'unicorn/prefer-add-event-listener': 'warn',       // 建議使用 addEventListener
      'unicorn/prefer-array-flat': 'warn',               // 建議使用 flat 而非 concat
      'unicorn/prefer-array-index-of': 'warn',           // 建議使用 indexOf
      'unicorn/prefer-array-some': 'warn',               // 建議使用 some
      'unicorn/prefer-includes': 'warn',                 // 建議使用 includes
      'unicorn/prefer-math-trunc': 'warn',               // 建議使用 Math.trunc
      'unicorn/prefer-negative-index': 'warn',           // 建議使用負索引
      'unicorn/prefer-node-protocol': 'off',             // 關閉強制使用 node: 協議（Next.js 環境）
      'unicorn/prefer-optional-catch-binding': 'warn',   // 建議使用可選 catch 綁定
      'unicorn/prefer-prototype-methods': 'warn',        // 建議使用原型方法
      'unicorn/prefer-reflect-apply': 'warn',            // 建議使用 Reflect.apply
      'unicorn/prefer-regexp-test': 'warn',              // 建議使用 test 而非 exec
      'unicorn/prefer-set-has': 'warn',                  // 建議使用 Set.has
      'unicorn/prefer-string-replace-all': 'warn',       // 建議使用 replaceAll
      'unicorn/prefer-string-slice': 'warn',             // 建議使用 slice
      'unicorn/prefer-string-starts-ends-with': 'warn',  // 建議使用 startsWith/endsWith
      'unicorn/prefer-string-trim-start-end': 'warn',    // 建議使用 trimStart/trimEnd
      'unicorn/prefer-ternary': 'off',                   // 關閉強制使用三元運算符
      'unicorn/relative-url-style': 'warn',              // 建議使用相對 URL 樣式
      'unicorn/require-array-join-separator': 'warn',    // 建議為 join 提供分隔符
      'unicorn/require-number-to-fixed-digits-argument': 'warn', // 建議為 toFixed 提供參數
      'unicorn/require-post-message-target-origin': 'warn', // 建議為 postMessage 提供 origin
      'unicorn/string-content': 'warn',                  // 建議使用有意義的字符串內容
      'unicorn/template-indent': 'warn',                 // 建議模板字符串縮排
      'unicorn/text-encoding-identifier-case': 'warn',   // 建議使用正確的編碼標識符大小寫
      'unicorn/better-regex': 'warn',                    // 建議使用更好的正則表達式
      'unicorn/catch-error-name': 'warn',                // 建議使用有意義的錯誤變量名
      'unicorn/consistent-destructuring': 'warn',        // 建議一致的解構風格
      'unicorn/consistent-function-scoping': 'warn',     // 建議一致的函數作用域
      'unicorn/custom-error-definition': 'warn',         // 建議自定義錯誤類別
      'unicorn/empty-brace-spaces': 'warn',              // 建議空括號內無空格
      'unicorn/expiring-todo-comments': 'warn',          // 警告過期的 TODO 註解
      'unicorn/explicit-length-check': 'warn',           // 建議明確的長度檢查
      'unicorn/import-index': 'warn',                    // 建議使用 index 檔案
      'unicorn/import-style': 'warn',                    // 建議一致的導入風格
      'unicorn/new-for-builtins': 'warn',                // 建議對內建類型使用 new
      'unicorn/no-array-callback-reference': 'warn',     // 建議避免陣列回調引用
      'unicorn/no-array-instanceof': 'warn',             // 建議使用 Array.isArray
      'unicorn/no-array-method-this-argument': 'warn',   // 建議避免陣列方法的 this 參數
      'unicorn/no-array-push-push': 'warn',              // 建議避免連續 push
      'unicorn/no-await-expression-member': 'warn',      // 建議避免 await 表達式成員
      'unicorn/no-console-spaces': 'warn',               // 警告 console 中的多餘空格
      'unicorn/no-document-cookie': 'warn',              // 建議避免直接操作 document.cookie
      'unicorn/no-empty-file': 'warn',                   // 警告空檔案
      'unicorn/no-for-loop': 'warn',                     // 建議使用陣列方法而非 for 循環
      'unicorn/no-instanceof-array': 'warn',             // 建議使用 Array.isArray
      'unicorn/no-invalid-remove-event-listener': 'warn', // 建議正確移除事件監聽器
      'unicorn/no-lonely-if': 'warn',                    // 建議合併孤立的 if 語句
      'unicorn/no-new-buffer': 'warn',                   // 建議使用 Buffer.from
      'unicorn/no-object-as-default-parameter': 'warn',  // 建議避免對象作為預設參數
      'unicorn/no-process-env': 'off',                   // 關閉禁止 process.env（Next.js 需要）
      'unicorn/no-static-only-class': 'warn',            // 建議避免只有靜態方法的類別
      'unicorn/no-thenable': 'warn',                     // 建議避免 thenable 對象
      'unicorn/no-this-assignment': 'warn',              // 建議避免 this 賦值
      'unicorn/no-typeof-undefined': 'warn',             // 建議避免 typeof undefined
      'unicorn/no-unnecessary-await': 'warn',            // 建議避免不必要的 await
      'unicorn/no-unreadable-iife': 'warn',              // 警告難以理解的立即執行函數
      'unicorn/no-useless-array-destructuring': 'warn',  // 建議避免無用的陣列解構
      'unicorn/no-useless-fallback-in-spread': 'warn',   // 建議避免展開中的無用回退
      'unicorn/no-useless-length-check': 'warn',         // 建議避免無用的長度檢查
      'unicorn/no-useless-promise-resolve-reject': 'warn', // 建議避免無用的 Promise.resolve/reject
      'unicorn/no-useless-spread': 'warn',               // 建議避免無用的展開
      'unicorn/no-useless-switch-case': 'warn',          // 建議避免無用的 switch case
      'unicorn/no-useless-undefined': 'warn',            // 建議避免無用的 undefined
      'unicorn/no-zero-fractions': 'warn',               // 建議避免零分數
      'unicorn/number-literal-case': 'warn',             // 建議使用小寫數字字面量
      'unicorn/numeric-separators-style': 'warn',        // 建議使用數字分隔符
      'unicorn/prefer-array-find': 'warn',               // 建議使用 find 而非 filter[0]
      'unicorn/prefer-array-flat': 'warn',               // 建議使用 flat 而非 concat
      'unicorn/prefer-array-flat-map': 'warn',           // 建議使用 flatMap 而非 map+flat
      'unicorn/prefer-array-index-of': 'warn',           // 建議使用 indexOf
      'unicorn/prefer-array-some': 'warn',               // 建議使用 some
      'unicorn/prefer-at': 'warn',                       // 建議使用 at() 方法
      'unicorn/prefer-blob-reading-methods': 'warn',     // 建議使用 Blob 讀取方法
      'unicorn/prefer-code-point': 'warn',               // 建議使用 codePointAt
      'unicorn/prefer-const': 'warn',                    // 建議使用 const
      'unicorn/prefer-date-now': 'warn',                 // 建議使用 Date.now
      'unicorn/prefer-default-parameters': 'warn',       // 建議使用預設參數
      'unicorn/prefer-includes': 'warn',                 // 建議使用 includes
      'unicorn/prefer-json-parse-buffer': 'warn',        // 建議使用 Buffer 解析 JSON
      'unicorn/prefer-logical-operator-over-ternary': 'warn', // 建議使用邏輯運算符
      'unicorn/prefer-math-trunc': 'warn',               // 建議使用 Math.trunc
      'unicorn/prefer-modern-dom-apis': 'warn',          // 建議使用現代 DOM API
      'unicorn/prefer-modern-math-apis': 'warn',         // 建議使用現代數學 API
      'unicorn/prefer-negative-index': 'warn',           // 建議使用負索引
      'unicorn/prefer-node-protocol': 'off',             // 關閉強制使用 node: 協議
      'unicorn/prefer-number-properties': 'warn',        // 建議使用 Number 屬性
      'unicorn/prefer-optional-catch-binding': 'warn',   // 建議使用可選 catch 綁定
      'unicorn/prefer-prototype-methods': 'warn',        // 建議使用原型方法
      'unicorn/prefer-query-selector': 'warn',           // 建議使用 querySelector
      'unicorn/prefer-reflect-apply': 'warn',            // 建議使用 Reflect.apply
      'unicorn/prefer-regexp-test': 'warn',              // 建議使用 test 而非 exec
      'unicorn/prefer-set-has': 'warn',                  // 建議使用 Set.has
      'unicorn/prefer-spread': 'warn',                   // 建議使用展開運算符
      'unicorn/prefer-string-replace-all': 'warn',       // 建議使用 replaceAll
      'unicorn/prefer-string-slice': 'warn',             // 建議使用 slice
      'unicorn/prefer-string-starts-ends-with': 'warn',  // 建議使用 startsWith/endsWith
      'unicorn/prefer-string-trim-start-end': 'warn',    // 建議使用 trimStart/trimEnd
      'unicorn/prefer-ternary': 'off',                   // 關閉強制使用三元運算符
      'unicorn/prefer-type-error': 'warn',               // 建議使用 TypeError
      'unicorn/relative-url-style': 'warn',              // 建議使用相對 URL 樣式
      'unicorn/require-array-join-separator': 'warn',    // 建議為 join 提供分隔符
      'unicorn/require-number-to-fixed-digits-argument': 'warn', // 建議為 toFixed 提供參數
      'unicorn/require-post-message-target-origin': 'warn', // 建議為 postMessage 提供 origin
      'unicorn/string-content': 'warn',                  // 建議使用有意義的字符串內容
      'unicorn/template-indent': 'warn',                 // 建議模板字符串縮排
      'unicorn/text-encoding-identifier-case': 'warn',   // 建議使用正確的編碼標識符大小寫
      'unicorn/throw-new-error': 'warn',                 // 建議使用 new Error
    },
  },
];

export default eslintConfig;