'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';

interface AppStatus {
    name: string;
    status: 'healthy' | 'warning' | 'error';
    message: string;
    lastChecked: string;
}

export default function AppCheckPage() {
    const [appStatus, setAppStatus] = useState<AppStatus[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // TODO: 實現實際的應用程式狀態檢查邏輯
        const mockData: AppStatus[] = [
            {
                name: '資料庫連接',
                status: 'healthy',
                message: '連接正常',
                lastChecked: new Date().toLocaleString(),
            },
            {
                name: 'API 服務',
                status: 'healthy',
                message: '服務運行中',
                lastChecked: new Date().toLocaleString(),
            },
            {
                name: '檔案系統',
                status: 'warning',
                message: '儲存空間使用率 85%',
                lastChecked: new Date().toLocaleString(),
            },
        ];

        setAppStatus(mockData);
        setLoading(false);
    }, []);

    const getStatusColor = (status: AppStatus['status']) => {
        switch (status) {
            case 'healthy':
                return 'text-green-500';
            case 'warning':
                return 'text-yellow-500';
            case 'error':
                return 'text-red-500';
            default:
                return 'text-gray-500';
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto p-4">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-24 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">應用程式狀態檢查</h1>
            <div className="grid gap-4">
                {appStatus.map((status, index) => (
                    <Card key={index}>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>{status.name}</span>
                                <span className={getStatusColor(status.status)}>
                                    {status.status === 'healthy' ? '正常' : 
                                     status.status === 'warning' ? '警告' : '錯誤'}
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600">{status.message}</p>
                            <p className="text-sm text-gray-400 mt-2">
                                最後檢查時間：{status.lastChecked}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
