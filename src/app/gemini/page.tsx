/**
 * Gemini AI 聊天頁面
 * 
 * 提供與 Google Gemini AI 的互動介面，功能包含：
 * - 文字對話
 * - 檔案上傳與分析
 * - 對話歷史記錄
 * - 自動捲動
 * - 對話清除
 */

"use client";

import { useState, useRef, useEffect, FormEvent, ChangeEvent } from "react";
import { initializeApp } from "firebase/app";
import { getAI, getGenerativeModel, GoogleAIBackend, GenerativeModel } from "firebase/ai";
import { firebaseConfig } from "@/lib/firebase-config";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { initializeFirebaseAppCheck } from "@/lib/firebase-client";
import Image from "next/image";

// 初始化 Firebase
const firebaseApp = initializeApp(firebaseConfig);

// 初始化 App Check
initializeFirebaseAppCheck().catch(console.error);

// 初始化 Gemini API
const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });

interface ChatMessage {
  id: string;
  role: "user" | "gemini";
  content: string;
  createdAt: Date;
  file?: {
    name: string;
    type: string;
    data: string;
  };
}

// 將檔案轉換為 GenerativePart
async function fileToGenerativePart(file: File) {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.readAsDataURL(file);
  });

  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
}

export default function GeminiChatPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated, appCheck } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const chatRef = useRef<ReturnType<GenerativeModel['startChat']> | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);

  // 檢查認證狀態
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, router]);

  // 檢查 App Check 狀態
  useEffect(() => {
    if (appCheck.isInitializing) {
      setError('系統正在初始化安全驗證，請稍後再試。');
    } else if (!appCheck.initialized) {
      setError('安全驗證尚未初始化，請重新整理頁面。');
    } else if (appCheck.error) {
      setError('安全驗證失敗，請重新整理頁面。');
    } else {
      setError(null);
    }
  }, [appCheck]);

  // 獲取模型實例
  const model = getGenerativeModel(ai, { model: "gemini-2.0-flash" });

  useEffect(() => {
    if (!isAuthenticated || !appCheck.initialized || appCheck.isInitializing) return;

    // 初始化聊天
    chatRef.current = model.startChat({
      generationConfig: {
        maxOutputTokens: 1000,
      },
    });
  }, [model, isAuthenticated, appCheck.initialized, appCheck.isInitializing]);

  // 檢查是否接近底部
  const checkIfNearBottom = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const threshold = 100; // 距離底部 100px 以內視為接近底部
    setIsNearBottom(scrollHeight - scrollTop - clientHeight < threshold);
  };

  // 滾動到底部
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // 監聽滾動事件
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      checkIfNearBottom();
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // 當有新訊息時，如果用戶在底部附近，則自動滾動
  useEffect(() => {
    if (isNearBottom) {
      scrollToBottom();
    }
  }, [messages, isNearBottom]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed && !selectedFile) return;

    const userMsg: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: trimmed,
      createdAt: new Date(),
    };

    if (selectedFile) {
      userMsg.file = {
        name: selectedFile.name,
        type: selectedFile.type,
        data: await fileToGenerativePart(selectedFile).then(part => part.inlineData.data),
      };
    }

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      let result;
      if (selectedFile) {
        const filePart = await fileToGenerativePart(selectedFile);
        const prompt = `請分析這個檔案並回答以下問題：${trimmed || '請總結這個檔案的重要內容。'}`;
        result = await model.generateContent([prompt, filePart]);
      } else {
        if (!chatRef.current) {
          throw new Error("聊天實例未初始化");
        }
        const prompt = `你是一位在台灣具備十年以上工地管理經驗的專案經理，熟悉工地作業流程、施工進度與品質控制，擅長成本預算管控與安全規劃，並精通《建築法》、《建築技術規則》、《職業安全衛生法》、《施工安全衛生設施標準》、《政府採購法》、《公共工程施工契約範本》、《噪音管制法》。請使用繁體中文回答以下問題，並依照法規與現場實務提供明確、可落實的建議：${trimmed}`;
        result = await chatRef.current.sendMessage(prompt);
      }

      const response = result.response;
      const text = response.text();
      
      const geminiMsg: ChatMessage = {
        id: `${Date.now()}-gemini`,
        role: "gemini",
        content: text,
        createdAt: new Date(),
      };
      setMessages(prev => [...prev, geminiMsg]);
    } catch (error) {
      console.error("Gemini API 錯誤:", error);
      const errorMsg: ChatMessage = {
        id: `${Date.now()}-gemini`,
        role: "gemini",
        content: "抱歉，發生錯誤，請稍後再試。",
        createdAt: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClear = () => {
    setMessages([]);
    setInput("");
    setLoading(false);
    setError(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    chatRef.current = model.startChat({
      generationConfig: {
        maxOutputTokens: 1000,
      },
    });
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="max-w-4xl mx-auto h-screen flex flex-col pb-16 overflow-hidden">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex-1 flex flex-col overflow-hidden">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent mb-6">
          Gemini 智慧助手
          {user?.email && (
            <span className="text-sm text-gray-500 ml-2">
              ({user.email})
            </span>
          )}
        </h1>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              清除對話記錄
            </button>
          </div>

          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`p-4 rounded-lg animate-fade-in ${
                  message.role === "user"
                    ? "bg-blue-50 dark:bg-blue-900/50 ml-12"
                    : "bg-gray-50 dark:bg-gray-900/50 mr-12"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center">
                    {message.role === "user" ? (
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
                        {message.role === "user" ? "您" : "Gemini 助手"}
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
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <form onSubmit={handleSend} className="mt-4 space-y-4 sticky bottom-0 bg-white dark:bg-gray-800 pt-4">
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="請輸入您的問題..."
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>處理中...</span>
                  </div>
                ) : (
                  "發送訊息"
                )}
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/50 dark:file:text-blue-300"
              />
              {selectedFile && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  已選擇: {selectedFile.name}
                </span>
              )}
            </div>
          </div>
          {error && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/50 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}
        </form>
      </div>

      <style jsx global>{`
        .custom-scrollbar {
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          height: calc(100vh - 280px);
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
    </main>
  );
}
