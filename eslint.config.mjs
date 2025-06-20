import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "src/lib/firebase-client.ts",
      "src/lib/firebase-config.ts",
      "src/lib/firebase-context.tsx",
    ],
  },
  {
    rules: {
      // React 相關規則
      'react/react-in-jsx-scope': 'off', // Next.js 不需要手動導入 React
      'react/prop-types': 'off', // 使用 TypeScript 替代
      'react/jsx-uses-react': 'off', // Next.js 自動處理
      'react/jsx-uses-vars': 'error',
      
      // Import 相關規則
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      'import/no-unresolved': 'off', // TypeScript 處理
      'import/no-duplicates': 'error',
      
      // 代碼風格規則
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-unused-vars': 'error',
      'no-undef': 'error',
      
      // TypeScript 特定規則
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/prefer-const': 'error',
      '@typescript-eslint/no-var-requires': 'error',
      
      // 引號和分號規則
      'quotes': ['error', 'single', { avoidEscape: true }],
      'semi': ['error', 'always'],
      
      // 其他規則
      'prefer-template': 'error',
      'object-shorthand': 'error',
      'prefer-arrow-callback': 'error',
    },
  },
];

export default eslintConfig;
