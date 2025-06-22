import { fileURLToPath } from 'url';
import nextPlugin from '@next/eslint-plugin-next';

/**
 * 完全扁平化的 ESLint 配置
 * - 移除所有未使用的變數和導入
 * - 保留核心功能不變
 */
export default [
  // Next.js 官方規則
  {
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      '@next/next/no-html-link-for-pages': 'error',  // 強制使用 Next.js Link 組件
      '@next/next/no-sync-scripts': 'error',         // 禁止同步 script 標籤
    }
  },
  // 忽略文件設定
  {
    ignores: [
      '**/node_modules/**',     // 忽略 node_modules
      '.next/**',               // 忽略 Next.js 構建目錄
      'src/lib/firebase-*.ts'   // 忽略 Firebase 相關文件
    ]
  },
  // 自訂規則區
  {
    rules: {
      // 可在此添加專案專用規則
    }
  }
];