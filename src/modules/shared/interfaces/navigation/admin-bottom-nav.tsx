'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const navItems = [
    {
        icon: '📆',
        label: '日程',
        popover: [
            { label: '排程客戶', href: '/management/work-schedule' },
            { label: '排程後端', href: '/management/work-schedule-admin' },
        ],
    },
    {
        icon: '🗂️',
        label: '工作',
        popover: [
            { label: '工作任務', href: '/management/work-task' },
            { label: '工作標的', href: '/management/work-epic' },
            { label: '工作範本', href: '/management/work-template' },
        ],
    },
    {
        icon: '👤',
        label: '團隊',
        popover: [
            { label: '團隊管理', href: '/management/work-human-resource' },
        ],
    },
];

/**
 * 管理後台底部導覽列（Tailwind 自適應深淺模式）
 */
export function ManagementBottomNav() {
    const [open, setOpen] = useState<number | null>(null);
    const popoverRefs = useRef<Array<HTMLDivElement | null>>([]);

    useEffect(() => {
        const handle = (e: MouseEvent) => {
            if (
                open !== null &&
                popoverRefs.current[open] &&
                !popoverRefs.current[open]?.contains(e.target as Node)
            ) {
                setOpen(null);
            }
        };
        if (open !== null) {
            document.addEventListener('mousedown', handle);
        }
        return () => {
            document.removeEventListener('mousedown', handle);
        };
    }, [open]);

    return (
        <nav
            className="fixed bottom-0 left-0 w-full h-16 flex justify-center items-center border-t
                       bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-700 z-50"
        >
            {navItems.map((item, idx) => (
                <div
                    key={item.label}
                    className="relative flex-1 flex justify-center"
                >
                    <button
                        onClick={() => setOpen(open === idx ? null : idx)}
                        className="bg-none border-none font-semibold flex flex-col items-center justify-center
                                   px-6 py-2 rounded-lg text-lg min-w-[76px] cursor-pointer
                                   text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-gray-800
                                   transition-colors duration-200"
                        type="button"
                        aria-haspopup="true"
                        aria-expanded={open === idx}
                        aria-controls={`popover-${idx}`}
                    >
                        <span className="text-2xl">{item.icon}</span>
                        <span className="text-sm">{item.label}</span>
                    </button>
                    {open === idx && (
                        <div
                            id={`popover-${idx}`}
                            ref={(el) => {
                                popoverRefs.current[idx] = el;
                            }}
                            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
                                       rounded-xl p-2 min-w-[120px] flex flex-col items-center
                                       shadow-lg z-100
                                       bg-white border border-gray-300 text-gray-900
                                       dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                            role="menu"
                            aria-label={`${item.label} 選單`}
                        >
                            {item.popover.map(link => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setOpen(null)}
                                    className="block w-full text-center rounded-lg px-6 py-2 text-base no-underline
                                               transition-colors duration-200
                                               hover:bg-gray-100 dark:hover:bg-gray-700"
                                    role="menuitem"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </nav>
    );
}

export default ManagementBottomNav;