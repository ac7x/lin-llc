"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { firebaseConfig, APP_CHECK_CONFIG } from "@/lib/firebase-config";
import { initializeApp } from "firebase/app";
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 初始化 App Check
if (typeof window !== "undefined") {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(APP_CHECK_CONFIG.SITE_KEY),
    isTokenAutoRefreshEnabled: true,
  });
}

// 初始化 Gemini API
const ai = getAI(app, { backend: new GoogleAIBackend() });
const model = getGenerativeModel(ai, { model: "gemini-2.0-flash" });

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
      const result = await model.generateContent(trimmed);
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

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gemini AI 聊天室</h1>
      <div className="border rounded-lg bg-white dark:bg-gray-900 shadow p-4 h-[60vh] overflow-y-auto flex flex-col gap-2 mb-4">
        {messages.length === 0 && (
          <div className="text-gray-400 text-center mt-8">請輸入訊息開始對話</div>
        )}
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`px-3 py-2 rounded-lg max-w-[80%] text-sm ${
                msg.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              }`}
            >
              {msg.content}
              <span className="block text-xs text-gray-400 mt-1 text-right">
                {msg.role === "user" ? "你" : "Gemini"}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="輸入訊息..."
          className="flex-1 rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-base bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition"
          disabled={loading}
          autoFocus
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md transition disabled:opacity-50"
        >
          發送
        </button>
      </form>
    </div>
  );
}
