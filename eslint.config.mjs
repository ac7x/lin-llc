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
    'plugin:import/typescript'
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
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      'import/no-unresolved': 'off',
      'import/no-duplicates': 'warn',
      'import/no-case-sensitive': 'off',
      'prefer-const': 'warn',
      'no-var': 'warn',
      'no-console': 'off',
      'no-debugger': 'warn',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-var-requires': 'warn',
      quotes: ['warn', 'single', { avoidEscape: true }],
      semi: ['warn', 'always'],
      'prefer-template': 'warn',
      'object-shorthand': 'warn',
      'prefer-arrow-callback': 'warn',
    },
  },
];

export default eslintConfig;