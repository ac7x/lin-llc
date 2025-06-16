/**
 * 通知測試工具組件
 * 
 * 提供系統通知的測試功能，包含：
 * - 自訂通知內容
 * - 通知類型選擇
 * - 快速測試模板
 * - 通知預覽
 * - 通知發送測試
 */

"use client";

import React, { useState } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { createNotification } from '@/app/notifications/lib/firebase-notifications';
import type { NotificationMessage } from '@/app/notifications/types/notifications';
import { db } from '@/lib/firebase-client';

const NOTIFICATION_TYPES: NotificationMessage['type'][] = ['info', 'success', 'warning', 'error'];
const NOTIFICATION_CATEGORIES: NotificationMessage['category'][] = ['project', 'schedule', 'system', 'work', 'emergency'];

interface NotificationTestFormData {
  title: string;
  message: string;
  type: NotificationMessage['type'];
  category: NotificationMessage['category'];
  actionUrl?: string;
}

export function NotificationTestTool() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<NotificationTestFormData>({
    title: '',
    message: '',
    type: 'info',
    category: 'system',
    actionUrl: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.uid) {
      setResult('錯誤：用戶未登入');
      return;
    }

    if (!formData.title || !formData.message) {
      setResult('錯誤：請填寫標題和訊息');
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      const notificationId = await createNotification(
        db,
        user.uid,
        {
          title: formData.title,
          message: formData.message,
          type: formData.type,
          category: formData.category,
          actionUrl: formData.actionUrl || undefined,
          data: {
            testNotification: true,
            createdBy: 'NotificationTestTool',
          },
        }
      );

      setResult(`✅ 通知建立成功！ID: ${notificationId}`);
      
      // 重置表單
      setFormData({
        title: '',
        message: '',
        type: 'info',
        category: 'system',
        actionUrl: '',
      });
    } catch (error) {
      setResult(`❌ 建立通知失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickTest = async (preset: 'success' | 'warning' | 'error' | 'info') => {
    const presets = {
      success: {
        title: '專案完成',
        message: '專案 A 已成功完成所有階段，請檢視最終報告。',
        type: 'success' as const,
        category: 'project' as const,
      },
      warning: {
        title: '排程變更',
        message: '由於天氣因素，明日工程將延後進行，請注意調整排程。',
        type: 'warning' as const,
        category: 'schedule' as const,
      },
      error: {
        title: '系統錯誤',
        message: '檔案上傳失敗，請檢查網路連線後重試。',
        type: 'error' as const,
        category: 'system' as const,
      },
      info: {
        title: '工作提醒',
        message: '今日有 3 項待辦事項需要處理，請及時完成。',
        type: 'info' as const,
        category: 'work' as const,
      },
    };

    if (!user?.uid) {
      setResult('錯誤：用戶未登入');
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      const notificationId = await createNotification(
        db,
        user.uid,
        {
          ...presets[preset],
          data: {
            testNotification: true,
            preset,
            createdBy: 'NotificationTestTool',
          },
        }
      );

      setResult(`✅ ${preset} 測試通知建立成功！ID: ${notificationId}`);
    } catch (error) {
      setResult(`❌ 建立測試通知失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <p className="text-yellow-800 dark:text-yellow-200">請先登入以使用通知測試工具</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">通知測試工具</h2>
      
      {/* 快速測試按鈕 */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">快速測試</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleQuickTest('success')}
            disabled={isSubmitting}
            className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded hover:bg-green-200 disabled:opacity-50"
          >
            成功通知
          </button>
          <button
            onClick={() => handleQuickTest('warning')}
            disabled={isSubmitting}
            className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 disabled:opacity-50"
          >
            警告通知
          </button>
          <button
            onClick={() => handleQuickTest('error')}
            disabled={isSubmitting}
            className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200 disabled:opacity-50"
          >
            錯誤通知
          </button>
          <button
            onClick={() => handleQuickTest('info')}
            disabled={isSubmitting}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200 disabled:opacity-50"
          >
            資訊通知
          </button>
        </div>
      </div>

      {/* 自訂通知表單 */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            標題
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            placeholder="輸入通知標題"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            訊息內容
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            placeholder="輸入通知訊息內容"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              類型
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as NotificationMessage['type'] }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            >
              {NOTIFICATION_TYPES.map(type => (
                <option key={type} value={type}>
                  {type === 'info' && '資訊'}
                  {type === 'success' && '成功'}
                  {type === 'warning' && '警告'}
                  {type === 'error' && '錯誤'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              分類
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as NotificationMessage['category'] }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            >
              {NOTIFICATION_CATEGORIES.map(category => (
                <option key={category} value={category}>
                  {category === 'project' && '專案'}
                  {category === 'schedule' && '排程'}
                  {category === 'system' && '系統'}
                  {category === 'work' && '工作'}
                  {category === 'emergency' && '緊急'}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            動作 URL（可選）
          </label>
          <input
            type="url"
            value={formData.actionUrl}
            onChange={(e) => setFormData(prev => ({ ...prev, actionUrl: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            placeholder="https://example.com/page"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '建立中...' : '建立通知'}
        </button>
      </form>

      {/* 結果顯示 */}
      {result && (
        <div className={`mt-4 p-3 rounded-md text-sm ${
          result.includes('✅') 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
        }`}>
          {result}
        </div>
      )}
    </div>
  );
}
