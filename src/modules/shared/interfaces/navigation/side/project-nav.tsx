'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { ReactNode } from 'react';

interface NavItem {
    href: string;
    icon: ReactNode;
    label: string;
    active: boolean;
}

interface ProjectSideNavProps {
    items?: NavItem[];
}

// 專案內頁側邊欄選單
const defaultProjectNavItems = (projectId: string): NavItem[] => [
    { href: `/admin/projects/${projectId}`, icon: '📄', label: '專案詳情', active: false },
    { href: `/admin/projects/${projectId}/schedule`, icon: '📅', label: '進度排程', active: false },
    { href: `/admin/projects/${projectId}/flow`, icon: '🔁', label: '工程流程', active: false },
    { href: `/admin/projects/${projectId}/journal`, icon: '📓', label: '工程日誌', active: false },
    { href: `/admin/projects/${projectId}/attendance`, icon: '👷‍♂️', label: '出工人數', active: false },
    { href: `/admin/projects/${projectId}/edit`, icon: '✏️', label: '編輯', active: false },
];

export function ProjectSideNav({ items }: ProjectSideNavProps) {
    const pathname = usePathname();
    const { projectId } = useParams() as { projectId: string };
    const navItems = (items && items.length > 0 ? items : defaultProjectNavItems(projectId)).map(item => ({
        ...item,
        active: pathname === item.href,
    }));

    return (
        <nav className="w-48 min-h-screen border-r bg-gray-50 dark:bg-gray-900 p-4">
            <h2 className="text-lg font-bold mb-4 text-center">專案管理</h2>
            <ul className="space-y-2">
                {navItems.map((item, idx) => (
                    <li key={idx}>
                        <Link
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-medium text-base ${item.active
                                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'}`}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
}