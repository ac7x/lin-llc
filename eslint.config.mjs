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
    plugins: {
      import: require('eslint-plugin-import'),
    },
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
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      'import/no-unresolved': 'off', // TypeScript 處理
      'import/no-duplicates': 'error',
      'import/no-case-sensitive': 'error', // ✅ 檢查 import 大小寫錯誤

      // 代碼風格規則
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-unused-vars': 'off',

      // TypeScript 特定規則
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-var-requires': 'error',

      // 引號和分號規則
      quotes: ['error', 'single', { avoidEscape: true }],
      semi: ['error', 'always'],

      // 其他規則
      'prefer-template': 'error',
      'object-shorthand': 'error',
      'prefer-arrow-callback': 'error',
    },
  },
];

export default eslintConfig;
