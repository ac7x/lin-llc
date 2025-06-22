import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
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
      'src/app/modules/**',
    ],
  },
  {
    rules: {
      // React 相關規則
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',

      // Import 相關規則
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          alphabetize: {
            order: 'asc',
            caseInsensitive: true, // 確保導入排序不區分大小寫
          },
        },
      ],
      'import/no-unresolved': 'off', // 關閉未解析導入檢查（避免 Windows 大小寫問題）
      'import/no-duplicates': 'warn',
      'import/no-case-sensitive': 'off', // 關閉大小寫敏感檢查

      // 代碼風格規則
      'prefer-const': 'warn',
      'no-var': 'warn',
      'no-console': 'off',
      'no-debugger': 'warn',
      'no-unused-vars': 'off',

      // TypeScript 特定規則
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-var-requires': 'warn',

      // 引號和分號規則
      quotes: ['warn', 'single', { avoidEscape: true }],
      semi: ['warn', 'always'],

      // 其他規則
      'prefer-template': 'warn',
      'object-shorthand': 'warn',
      'prefer-arrow-callback': 'warn',
    },
  },
];

export default eslintConfig;