"use client";

import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from "react";
import { getAI, getGenerativeModel, GoogleAIBackend, GenerativeModel } from "firebase/ai";
import { firebaseApp, initializeFirebaseAppCheck, isAppCheckInitialized, getAppCheckToken } from "@/lib/firebase-client";
import { useFirebase } from "@/lib/firebase-context";

// 型別定義
type ChatSession = ReturnType<GenerativeModel["startChat"]>;

export default function GeminiPage() {
  const [prompt, setPrompt] = useState("");
  const [history, setHistory] = useState<{ role: "user" | "model"; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [init, setInit] = useState(false);

  const modelRef = useRef<GenerativeModel | null>(null);
  const chatRef = useRef<ChatSession | null>(null);
  const { appCheckReady } = useFirebase();

  useEffect(() => {
    if (init || !firebaseApp || typeof window === "undefined") return;
    (async () => {
      try {
        if (!isAppCheckInitialized()) {
          await initializeFirebaseAppCheck();
        }
        await getAppCheckToken();
        const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });
        const model = getGenerativeModel(ai, { model: "gemini-2.0-flash" });
        modelRef.current = model;
        chatRef.current = model.startChat({ history: [], generationConfig: { maxOutputTokens: 500 } });
        setInit(true);
        setErr("");
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        setErr(`初始化失敗: ${errorMsg}`);
      }
    })();
  }, [init]);

  async function onSend(e: FormEvent) {
    e.preventDefault();
    const text = prompt.trim();
    if (!text || loading || !init) return;
    setLoading(true);
    setErr("");
    setHistory(h => [...h, { role: "user", text }]);
    setPrompt("");
    if (!chatRef.current) {
      setErr("尚未初始化");
      setLoading(false);
      return;
    }
    try {
      const res = await chatRef.current.sendMessage(text);
      const rep = await res.response;
      const responseText = rep.text();
      setHistory(h => [...h, { role: "model", text: responseText }]);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "訊息傳送失敗";
      setErr(errorMsg);
    }
    setLoading(false);
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading && prompt.trim() && init) {
        (e.target as HTMLTextAreaElement).form?.requestSubmit?.();
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          🤖 Gemini AI 聊天
        </h1>
        {/* App Check 狀態簡易顯示 */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex justify-between items-center">
          <div>
            <span className="font-semibold mr-2">App Check:</span>
            <span className={appCheckReady ? "text-green-600" : "text-red-600"}>
              {appCheckReady ? "✅ 已就緒" : "❌ 未就緒"}
            </span>
          </div>
          <div>
            <span className="font-semibold mr-2">Gemini AI:</span>
            <span className={init ? "text-green-600" : "text-orange-600"}>
              {init ? "✅ 已初始化" : "⏳ 初始化中"}
            </span>
          </div>
        </div>
        {/* 聊天介面 */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {history.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                👋 歡迎使用 Gemini AI！請開始對話...
              </div>
            )}
            {history.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${m.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-800"
                  }`}>
                  <div className="font-semibold text-sm mb-1">
                    {m.role === "user" ? "🧑 你" : "🤖 Gemini"}
                  </div>
                  <div className="whitespace-pre-wrap">{m.text}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">
                  <div className="font-semibold text-sm mb-1">🤖 Gemini</div>
                  <span className="text-sm">思考中...</span>
                </div>
              </div>
            )}
          </div>
          <div className="border-t bg-gray-50 p-4">
            <form onSubmit={onSend} className="flex space-x-4">
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={onKey}
                disabled={loading || !init}
                placeholder={!init ? "正在初始化..." : "輸入您的訊息... (按 Enter 傳送，Shift+Enter 換行)"}
                className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                rows={3}
              />
              <button
                type="submit"
                disabled={loading || !prompt.trim() || !init}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? "⏳" : "📤"} 傳送
              </button>
            </form>
            {/* 錯誤訊息 */}
            {err && (
              <div className="mt-3 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
                ❌ {err}
              </div>
            )}
            {/* 狀態訊息 */}
            {!init && !err && (
              <div className="mt-3 p-3 bg-blue-100 border border-blue-300 text-blue-700 rounded-lg">
                ⏳ 正在初始化 Gemini AI...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}