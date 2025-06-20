/**
 * 頁籤組件 (Tabs)
 *
 * 一個可重用的頁籤介面組件。
 * 功能包括：
 * - 顯示多個可切換的頁籤
 * - 根據當前選擇的頁籤，顯示對應的內容
 * - 可設定初始選中的頁籤
 * - 點擊頁籤時切換內容
 */
import { useState, ReactNode } from 'react';

import { cn, longClassName } from '@/utils/classNameUtils';

type Tab = {
  key: string;
  label: string;
  content: ReactNode;
};

type TabsProps = {
  tabs: Tab[];
  initialTab?: string;
};

export default function Tabs({ tabs, initialTab }: TabsProps) {
  const [activeTab, setActiveTab] = useState(initialTab || tabs[0]?.key);

  const activeTabContent = tabs.find(tab => tab.key === activeTab)?.content;

  // 使用 longClassName 來避免 Firebase Performance 錯誤
  const baseButtonClass = longClassName([
    'px-4 py-2 text-sm font-medium border-b-2',
    'transition-colors duration-200'
  ]);

  const activeButtonClass = longClassName([
    'border-blue-600 text-blue-600',
    'dark:border-blue-400 dark:text-blue-400'
  ]);

  const inactiveButtonClass = longClassName([
    'border-transparent text-gray-500',
    'hover:text-gray-700 hover:border-gray-300',
    'dark:text-gray-400 dark:hover:text-gray-300'
  ]);

  return (
    <div>
      <div className={cn('mb-6 border-b border-gray-200 dark:border-gray-700')}>
        <nav className={cn('flex flex-wrap gap-1 -mb-px')}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={cn(
                baseButtonClass,
                activeTab === tab.key ? activeButtonClass : inactiveButtonClass
              )}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div>{activeTabContent}</div>
    </div>
  );
}
