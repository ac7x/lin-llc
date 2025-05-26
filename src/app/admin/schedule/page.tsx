'use client';

import React, { useState, useRef } from 'react';
import Timeline from '../../../components/Timeline';
import { Plus, Calendar, Users, Settings, Trash2, Edit } from 'lucide-react';

const SchedulePage: React.FC = () => {
  const timelineRef = useRef<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    content: '',
    start: '',
    end: '',
    group: '',
    type: 'box' as 'box' | 'point' | 'range' | 'background',
    className: '',
    title: ''
  });

  // 時間軸配置選項
  const timelineOptions = {
    height: '500px',
    orientation: 'top',
    stack: true,
    showCurrentTime: true,
    zoomMin: 1000 * 60 * 60 * 24, // 一天
    zoomMax: 1000 * 60 * 60 * 24 * 365, // 一年
    format: {
      minorLabels: {
        minute: 'h:mm',
        hour: 'ha',
        weekday: 'ddd D',
        day: 'D',
        week: 'w',
        month: 'MMM',
        year: 'YYYY'
      },
      majorLabels: {
        minute: 'ddd D MMMM',
        hour: 'ddd D MMMM',
        weekday: 'MMMM YYYY',
        day: 'MMMM YYYY',
        week: 'MMMM YYYY',
        month: 'YYYY',
        year: ''
      }
    },
    locale: 'zh-TW'
  };

  const handleAddEvent = async () => {
    if (!newEvent.content || !newEvent.start) {
      alert('請填寫必要欄位：內容和開始時間');
      return;
    }

    try {
      const startDate = new Date(newEvent.start);
      const endDate = newEvent.end ? new Date(newEvent.end) : undefined;

      if (endDate && endDate <= startDate) {
        alert('結束時間必須晚於開始時間');
        return;
      }

      // 這裡需要呼叫 Timeline 組件的 addItem 方法
      // 由於我們使用 ref，實際實作中可能需要調整
      console.log('添加新事件:', {
        content: newEvent.content,
        start: startDate,
        end: endDate,
        group: newEvent.group || undefined,
        type: newEvent.type,
        className: newEvent.className,
        title: newEvent.title
      });

      // 重置表單
      setNewEvent({
        content: '',
        start: '',
        end: '',
        group: '',
        type: 'box',
        className: '',
        title: ''
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('添加事件時出錯:', error);
      alert('添加事件失敗，請檢查輸入格式');
    }
  };

  const handleFitTimeline = () => {
    // 調整時間軸視窗以顯示所有項目
    console.log('調整時間軸視窗');
  };

  const handleSetToday = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    // 設置時間軸視窗為今天
    console.log('設置為今天視圖');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頁面標題與操作按鈕 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Calendar className="w-8 h-8 text-blue-600" />
                排程管理
              </h1>
              <p className="mt-2 text-gray-600">
                管理和查看所有排程事件，支援拖拽編輯和即時同步
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                新增事件
              </button>
              <button
                onClick={handleFitTimeline}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Settings className="w-4 h-4" />
                調整視窗
              </button>
              <button
                onClick={handleSetToday}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                今天
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 新增事件表單 */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              新增排程事件
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  事件內容 *
                </label>
                <input
                  type="text"
                  value={newEvent.content}
                  onChange={(e) => setNewEvent({ ...newEvent, content: e.target.value })}
                  placeholder="輸入事件內容"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  開始時間 *
                </label>
                <input
                  type="datetime-local"
                  value={newEvent.start}
                  onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  結束時間
                </label>
                <input
                  type="datetime-local"
                  value={newEvent.end}
                  onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  群組
                </label>
                <input
                  type="text"
                  value={newEvent.group}
                  onChange={(e) => setNewEvent({ ...newEvent, group: e.target.value })}
                  placeholder="群組名稱（可選）"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  事件類型
                </label>
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="box">盒子</option>
                  <option value="point">點</option>
                  <option value="range">範圍</option>
                  <option value="background">背景</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CSS 類別
                </label>
                <input
                  type="text"
                  value={newEvent.className}
                  onChange={(e) => setNewEvent({ ...newEvent, className: e.target.value })}
                  placeholder="自定義樣式類別"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                工具提示
              </label>
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="滑鼠懸停時顯示的提示文字"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddEvent}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                新增事件
              </button>
            </div>
          </div>
        )}

        {/* 操作提示 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                時間軸操作說明
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>拖拽事件可以移動時間和更改群組</li>
                  <li>拖拽事件邊緣可以調整持續時間</li>
                  <li>雙擊空白區域可以新增事件</li>
                  <li>雙擊事件可以編輯內容</li>
                  <li>選中事件後按 Delete 鍵可以刪除</li>
                  <li>所有變更會自動同步到資料庫</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 時間軸容器 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              排程時間軸
            </h2>
            <div className="text-sm text-gray-500">
              即時同步至 Firebase/Firestore
            </div>
          </div>
          
          <Timeline
            ref={timelineRef}
            collectionName="schedule-items"
            groupsCollectionName="schedule-groups"
            options={timelineOptions}
            className="w-full"
          />
        </div>

        {/* 統計資訊 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">
                  本週事件
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  --
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">
                  活躍群組
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  --
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Settings className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">
                  同步狀態
                </div>
                <div className="text-2xl font-bold text-green-600">
                  正常
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchedulePage;