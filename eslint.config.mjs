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
      'src/app/(admin)',
      'src/app/(client)',
      'src/app/(finance)',
      'src/app/(owner)',
      'src/app/(shared)',
      'src/app/(safety)',
      'src/app/(supervisor)',
      'src/app/(user)',
      'src/app/(subcontractor)',
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
      'react/jsx-uses-vars': 'error',
      'import/no-unresolved': 'off',
      'import/no-duplicates': 'warn',
      'prefer-const': 'warn',
      'no-var': 'warn',
      'no-debugger': 'warn',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-var-requires': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
      'prefer-template': 'warn',
      'object-shorthand': 'warn',
      'prefer-arrow-callback': 'warn',
      '@next/next/no-html-link-for-pages': 'error',
      '@next/next/no-img-element': 'error',
    },
  },
];

export default eslintConfig;