'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { useAppCheck } from '@/hooks/useFirebase';
import { useRecaptcha } from '@/hooks/useRecaptcha';

interface AppStatus {
    name: string;
    status: 'healthy' | 'warning' | 'error';
    message: string;
    lastChecked: string;
}

export default function AppCheckPage() {
    const [appStatus, setAppStatus] = useState<AppStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const { initialized: appCheckInitialized, error: appCheckError } = useAppCheck();
    const { token, status: recaptchaStatus, refreshToken, error: recaptchaError } = useRecaptcha('app_check');

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
            
            {/* App Check 狀態 */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>App Check 狀態</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <p className="text-gray-600">
                            狀態：{appCheckInitialized ? '已初始化' : '未初始化'}
                        </p>
                        {appCheckError && (
                            <p className="text-red-500">
                                錯誤：{appCheckError.message}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* reCAPTCHA 測試區塊 */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>reCAPTCHA v3 測試</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <button
                            onClick={refreshToken}
                            disabled={recaptchaStatus === 'loading'}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                        >
                            {recaptchaStatus === 'loading' ? '測試中...' : '測試 reCAPTCHA'}
                        </button>
                        
                        {recaptchaStatus === 'success' && token && (
                            <div className="mt-4">
                                <p className="text-green-500 mb-2">reCAPTCHA 測試成功！</p>
                                <div className="bg-gray-100 p-4 rounded">
                                    <p className="text-sm font-mono break-all">{token}</p>
                                </div>
                            </div>
                        )}
                        
                        {recaptchaStatus === 'error' && (
                            <p className="text-red-500">
                                reCAPTCHA 測試失敗：{recaptchaError?.message || '未知錯誤'}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

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
