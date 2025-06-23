/**
 * 專案 Gemini 聊天組件
 * 
 * 提供專案相關的 AI 對話介面
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useProjectGemini, type ProjectChatMessage } from '../../hooks/useProjectGemini';
import type { Project, WorkPackage, SubWorkPackage, IssueRecord } from '../../types';

interface ProjectGeminiChatProps {
  project?: Project;
  workPackages?: WorkPackage[];
  subWorkPackages?: SubWorkPackage[];
  issues?: IssueRecord[];
  className?: string;
}

export function ProjectGeminiChat({
  project,
  workPackages = [],
  subWorkPackages = [],
  issues = [],
  className = '',
}: ProjectGeminiChatProps) {
  const [input, setInput] = useState('');
  const [isNearBottom, setIsNearBottom] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    addContext,
    analyzeProject,
    getProjectSuggestions,
    analyzeWorkPackage,
    getRiskAnalysis,
    getProgressReport,
  } = useProjectGemini({
    projectId: project?.id,
  });

  // 初始化上下文
  useEffect(() => {
    if (project) {
      addContext({ project, workPackages, subWorkPackages, issues });
    }
  }, [project?.id, workPackages.length, subWorkPackages.length, issues.length, addContext]);

  // 檢查是否接近底部
  const checkIfNearBottom = useCallback(() => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const threshold = 100;
    setIsNearBottom(scrollHeight - scrollTop - clientHeight < threshold);
  }, []);

  // 滾動到底部
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // 監聽滾動事件
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      checkIfNearBottom();
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [checkIfNearBottom]);

  // 當有新訊息時，如果用戶在底部附近，則自動滾動
  useEffect(() => {
    if (isNearBottom) {
      scrollToBottom();
    }
  }, [messages, isNearBottom, scrollToBottom]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    await sendMessage(trimmed);
    setInput('');
  };

  const handleQuickAction = async (action: string) => {
    if (!project) return;

    switch (action) {
      case 'analyze':
        await analyzeProject(project);
        break;
      case 'suggestions':
        await getProjectSuggestions(project);
        break;
      case 'risks':
        await getRiskAnalysis(project, issues);
        break;
      case 'progress':
        await getProgressReport(project, workPackages);
        break;
      default:
        break;
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col h-full ${className}`}>
      {/* 標題 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
          專案 AI 助手
        </h2>
        <button
          onClick={clearMessages}
          className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          清除對話
        </button>
      </div>

      {/* 快速操作按鈕 */}
      {project && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => handleQuickAction('analyze')}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            專案分析
          </button>
          <button
            onClick={() => handleQuickAction('suggestions')}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            取得建議
          </button>
          <button
            onClick={() => handleQuickAction('risks')}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            風險分析
          </button>
          <button
            onClick={() => handleQuickAction('progress')}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            進度報告
          </button>
        </div>
      )}

      {/* 錯誤顯示 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* 聊天區域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
        >
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <div className="mb-4">
                <Image
                  src="/sup.svg"
                  alt="Gemini"
                  width={48}
                  height={48}
                  className="mx-auto"
                />
              </div>
              <p>開始與 AI 助手對話，或使用快速操作按鈕</p>
            </div>
          ) : (
            messages.map(message => (
              <div
                key={message.id}
                className={`p-4 rounded-lg animate-fade-in ${
                  message.role === 'user'
                    ? 'bg-blue-50 dark:bg-blue-900/50 ml-12'
                    : 'bg-gray-50 dark:bg-gray-900/50 mr-12'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center">
                    {message.role === 'user' ? (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300">
                        👤
                      </div>
                    ) : (
                      <Image
                        src="/sup.svg"
                        alt="Gemini"
                        width={32}
                        height={32}
                        className="w-8 h-8"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium text-sm text-gray-600 dark:text-gray-400">
                        {message.role === 'user' ? '您' : 'AI 助手'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {message.createdAt.toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                      {message.content}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 輸入區域 */}
      <form onSubmit={handleSend} className="mt-4 space-y-4">
        <div className="flex gap-4">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="請輸入您的問題..."
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>處理中...</span>
              </div>
            ) : (
              '發送'
            )}
          </button>
        </div>
      </form>

      <style jsx>{`
        .custom-scrollbar {
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 4px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(156, 163, 175, 0.7);
        }
        .custom-scrollbar::-webkit-scrollbar-corner {
          background: transparent;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
} 