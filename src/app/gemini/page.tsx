"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { initializeApp } from "firebase/app";
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";
import { firebaseConfig } from "@/lib/firebase-config";

// 初始化 Firebase
const firebaseApp = initializeApp(firebaseConfig);

// 初始化 Gemini API
const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });

type ModelType = "gemini-2.0-flash";

interface ChatMessage {
  id: string;
  role: "user" | "gemini";
  content: string;
  createdAt: Date;
}

export default function GeminiChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 獲取模型實例
  const model = getGenerativeModel(ai, { model: "gemini-2.0-flash" });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    const userMsg: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: trimmed,
      createdAt: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const prompt = `請使用繁體中文回答以下問題：${trimmed}`;
      const result = await model.generateContent(prompt);
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
    }
  };

  const handleClear = () => {
    setMessages([]);
    setInput("");
    setLoading(false);
    setError(null);
  };

  return (
    <main className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent mb-6">Gemini 智慧助手</h1>

        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              清除對話記錄
            </button>
          </div>

          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  message.role === "user"
                    ? "bg-blue-50 dark:bg-blue-900/50 ml-12"
                    : "bg-gray-50 dark:bg-gray-900/50 mr-12"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300">
                    {message.role === "user" ? "👤" : "🤖"}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {message.role === "user" ? "您" : "Gemini 助手"}
                    </div>
                    <div className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                      {message.content}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSend} className="space-y-4">
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
          {error && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/50 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}
        </form>
      </div>
    </main>
  );
}
