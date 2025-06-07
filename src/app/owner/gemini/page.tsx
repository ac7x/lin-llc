"use client";

import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from "react";
import { getAI, getGenerativeModel, GoogleAIBackend, GenerativeModel } from "firebase/ai";
import { firebaseApp } from "@/lib/firebase/firebase-client";
import { useFirebase } from "@/lib/firebase/firebase-context";
import { initializeFirebaseAppCheck, isAppCheckInitialized, getAppCheckToken, testRecaptchaExecution, diagnoseAppCheck, forceReinitializeAppCheck, getAppCheckStatus } from "@/lib/firebase/firebase-appcheck";

// 型別定義
type ChatSession = ReturnType<GenerativeModel["startChat"]>;

export default function GeminiPage() {
  const [prompt, setPrompt] = useState("");
  const [history, setHistory] = useState<{ role: "user" | "model"; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [init, setInit] = useState(false);
  const [appCheckLog, setAppCheckLog] = useState<string[]>([]);
  const [detailedDebug, setDetailedDebug] = useState<string[]>([]);

  const modelRef = useRef<GenerativeModel | null>(null);
  const chatRef = useRef<ChatSession | null>(null);
  const { appCheckReady, appCheckTimeout, appCheckLog: contextLog } = useFirebase();

  // 詳細除錯日誌函數
  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    setDetailedDebug(prev => [...prev, logEntry]);
    console.log(logEntry);
  };

  useEffect(() => {
    if (init || !firebaseApp || typeof window === "undefined") return;
    
    addDebugLog("🚀 開始初始化 Gemini AI 與 App Check");
    
    (async () => {
      try {
        // 檢查 App Check 狀態
        addDebugLog(`🔍 檢查 App Check 狀態: ${isAppCheckInitialized() ? '已初始化' : '未初始化'}`);
        
        if (!isAppCheckInitialized()) {
          addDebugLog("⏳ App Check 尚未初始化，開始初始化流程...");
          
          await initializeFirebaseAppCheck((message: string) => {
            setAppCheckLog(prev => [...prev, message]);
            addDebugLog(`[App Check] ${message}`);
          });
          
          addDebugLog("✅ App Check 初始化完成");
        }

        // 嘗試取得 App Check token
        addDebugLog("🔐 嘗試取得 App Check token...");
        const token = await getAppCheckToken();
        if (token) {
          addDebugLog(`✅ App Check token 取得成功 (長度: ${token.length})`);
        } else {
          addDebugLog("⚠️ App Check token 取得失敗，但繼續進行");
        }

        // 初始化 Firebase AI
        addDebugLog("🤖 初始化 Firebase AI...");
        const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });
        addDebugLog("📋 取得 Gemini 模型...");
        const model = getGenerativeModel(ai, { model: "gemini-2.0-flash" });
        
        modelRef.current = model;
        chatRef.current = model.startChat({ 
          history: [], 
          generationConfig: { maxOutputTokens: 500 } 
        });
        
        setInit(true);
        setErr("");
        addDebugLog("🎉 Gemini AI 初始化完成！");
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        addDebugLog(`❌ 初始化失敗: ${errorMsg}`);
        setErr(`初始化失敗: ${errorMsg}`);
      }
    })();
  }, [init]);

  async function onSend(e: FormEvent) {
    e.preventDefault();
    const text = prompt.trim();
    if (!text || loading || !init) return;
    
    addDebugLog(`📤 發送訊息: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
    
    setLoading(true);
    setErr("");
    setHistory(h => [...h, { role: "user", text }]);
    setPrompt("");
    
    if (!chatRef.current) {
      const errorMsg = "尚未初始化";
      addDebugLog(`❌ ${errorMsg}`);
      setErr(errorMsg);
      setLoading(false);
      return;
    }
    
    try {
      addDebugLog("🤔 等待 Gemini 回應...");
      const res = await chatRef.current.sendMessage(text);
      const rep = await res.response;
      const responseText = rep.text();
      
      addDebugLog(`📥 收到回應 (長度: ${responseText.length})`);
      setHistory(h => [...h, { role: "model", text: responseText }]);
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "訊息傳送失敗";
      addDebugLog(`❌ 訊息傳送失敗: ${errorMsg}`);
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
        
        {/* App Check 狀態區域 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">🔒 App Check 狀態</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 rounded-lg bg-gray-100">
              <div className="font-medium text-gray-600">App Check Ready</div>
              <div className={`text-lg font-bold ${appCheckReady ? 'text-green-600' : 'text-red-600'}`}>
                {appCheckReady ? '✅ 已就緒' : '❌ 未就緒'}
              </div>
            </div>
            <div className="text-center p-3 rounded-lg bg-gray-100">
              <div className="font-medium text-gray-600">超時狀態</div>
              <div className={`text-lg font-bold ${appCheckTimeout ? 'text-orange-600' : 'text-green-600'}`}>
                {appCheckTimeout ? '⏰ 超時' : '✅ 正常'}
              </div>
            </div>
            <div className="text-center p-3 rounded-lg bg-gray-100">
              <div className="font-medium text-gray-600">Gemini AI</div>
              <div className={`text-lg font-bold ${init ? 'text-green-600' : 'text-orange-600'}`}>
                {init ? '✅ 已初始化' : '⏳ 初始化中'}
              </div>
            </div>
          </div>
          
          {/* App Check 詳細日誌 */}
          {(appCheckLog.length > 0 || contextLog) && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-600 mb-2">App Check 初始化日誌:</h3>
              <div className="bg-gray-900 text-green-400 p-3 rounded-lg text-sm font-mono max-h-40 overflow-y-auto">
                {contextLog && contextLog.split('\n').map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
                {appCheckLog.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
              </div>
            </div>
          )}
          
          {/* 詳細除錯日誌 */}
          {detailedDebug.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-600 mb-2">詳細除錯日誌:</h3>
              <div className="bg-blue-900 text-blue-100 p-3 rounded-lg text-sm font-mono max-h-40 overflow-y-auto">
                {detailedDebug.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
              </div>
            </div>
          )}
          
          {/* Firebase 配置檢查提示 */}
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">🔧 Firebase 專案配置檢查</h3>
            <div className="text-sm text-yellow-700 space-y-1">
              <p><strong>如果 token 一直取得失敗，請檢查：</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Firebase 控制台 → App Check → 是否已啟用 reCAPTCHA v3</li>
                <li>Google reCAPTCHA 控制台 → 網域設定是否包含 localhost 和您的網域</li>
                <li>reCAPTCHA Site Key: <code className="bg-yellow-100 px-1 rounded text-xs">6LepxlYrAAAAAMxGh5307zIOJHz1PKrVDgZHgKwg</code></li>
                <li><strong>注意：</strong> 不需要 SECRET_KEY，那是伺服器端用的</li>
                <li>檢查瀏覽器開發者工具的 Network 標籤是否有 reCAPTCHA 相關錯誤</li>
                <li>確保網頁可以訪問 <code className="bg-yellow-100 px-1 rounded text-xs">google.com/recaptcha</code></li>
              </ul>
            </div>
          </div>
          
          {/* 測試按鈕區域 */}
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={async () => {
                addDebugLog("🧪 開始測試 reCAPTCHA...");
                const success = await testRecaptchaExecution((message: string) => {
                  addDebugLog(`[reCAPTCHA Test] ${message}`);
                });
                if (success) {
                  addDebugLog("✅ reCAPTCHA 測試成功");
                } else {
                  addDebugLog("❌ reCAPTCHA 測試失敗");
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              🧪 測試 reCAPTCHA
            </button>
            <button
              onClick={async () => {
                addDebugLog("🔄 重新取得 App Check token...");
                const token = await getAppCheckToken((message: string) => {
                  setAppCheckLog(prev => [...prev, message]);
                  addDebugLog(`[Token Retry] ${message}`);
                });
                if (token) {
                  addDebugLog(`✅ 重新取得成功 (長度: ${token.length})`);
                } else {
                  addDebugLog("❌ 重新取得失敗");
                }
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              🔄 重新取得 Token
            </button>
            <button
              onClick={() => {
                addDebugLog("📋 產生完整診斷報告...");
                const diagnosis = diagnoseAppCheck();
                addDebugLog("=== 完整診斷報告 ===");
                addDebugLog(diagnosis);
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
            >
              📋 診斷報告
            </button>
            <button
              onClick={async () => {
                addDebugLog("🔄 強制重新初始化 App Check...");
                const success = await forceReinitializeAppCheck((message: string) => {
                  setAppCheckLog(prev => [...prev, message]);
                  addDebugLog(`[Reinit] ${message}`);
                });
                if (success) {
                  addDebugLog("✅ 重新初始化成功");
                } else {
                  addDebugLog("❌ 重新初始化失敗");
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              🔄 強制重新初始化
            </button>
            <button
              onClick={() => {
                addDebugLog("📊 取得 App Check 狀態...");
                const status = getAppCheckStatus();
                addDebugLog(`App Check 狀態: ${JSON.stringify(status, null, 2)}`);
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
            >
              📊 狀態檢查
            </button>
            <button
              onClick={() => {
                setDetailedDebug([]);
                setAppCheckLog([]);
                addDebugLog("🧹 日誌已清除");
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
            >
              🧹 清除日誌
            </button>
          </div>
        </div>

        {/* 聊天介面 */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* 聊天歷史 */}
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {history.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                👋 歡迎使用 Gemini AI！請開始對話...
              </div>
            )}
            {history.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  m.role === "user" 
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
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    <span className="ml-2 text-sm">思考中...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* 輸入區域 */}
          <div className="border-t bg-gray-50 p-4">
            <form onSubmit={onSend} className="flex space-x-4">
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={onKey}
                disabled={loading || !init}
                placeholder={
                  !init 
                    ? "正在初始化..." 
                    : "輸入您的訊息... (按 Enter 傳送，Shift+Enter 換行)"
                }
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