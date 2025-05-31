// src/app/owner/notifications/page.tsx
import React from 'react';

const mockNotifications = [
    { id: '1', title: '新進度更新', message: '專案 A 已完成第二階段', date: '2025-05-30' },
    { id: '2', title: '出工確認', message: '工班 B 今早已進場', date: '2025-05-29' },
    { id: '3', title: '異常回報', message: '現場發現設備損壞，已通報維修', date: '2025-05-28' },
];

export default function NotificationsPage() {
    return (
        <main className="p-6">
            <h1 className="text-2xl font-bold mb-4">通知中心</h1>
            <ul className="space-y-4">
                {mockNotifications.map((notification) => (
                    <li key={notification.id} className="bg-white shadow-md rounded-xl p-4 border">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold">{notification.title}</h2>
                            <span className="text-sm text-gray-500">{notification.date}</span>
                        </div>
                        <p className="text-gray-700 mt-2">{notification.message}</p>
                    </li>
                ))}
            </ul>
        </main>
    );
}
