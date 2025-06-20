import { useState, ReactNode } from 'react';

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

  return (
    <div>
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="flex flex-wrap gap-1 -mb-px">
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-200 ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
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