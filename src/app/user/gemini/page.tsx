"use client";

import { useState, useRef, useEffect } from "react";
import { getAI, getGenerativeModel, GoogleAIBackend, GenerativeModel, ChatSession } from "firebase/ai";
import { app as firebaseAppInstance, RECAPTCHA_SITE_KEY } from '@/modules/shared/infrastructure/persistence/firebase/firebase-client';

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export default function GeminiPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const modelRef = useRef<GenerativeModel | null>(null);
  const chatRef = useRef<ChatSession | null>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 動態載入 reCAPTCHA v3 script
    if (typeof window === 'undefined') return;
    if (document.getElementById('recaptcha-v3-script')) return;
    const script = document.createElement('script');
    script.id = 'recaptcha-v3-script';
    script.src = `https://www.google.com/recaptcha/enterprise.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.onload = () => {
      console.log('reCAPTCHA v3 script loaded.');
    };
    script.onerror = () => {
      setError('reCAPTCHA v3 script 載入失敗，請檢查你的網站金鑰或網路連線。');
    };
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    const initializeAI = async () => {
      if (isInitialized || !firebaseAppInstance || typeof window === 'undefined') return;

      // 等待 grecaptcha 載入
      if (typeof grecaptcha === 'undefined') {
        // 檢查 script 是否還在載入
        const script = document.getElementById('recaptcha-v3-script');
        if (script) {
          script.addEventListener('load', initializeAI, { once: true });
          return;
        }
        setError('reCAPTCHA v3 script 載入失敗，請檢查你的網站金鑰或網路連線。');
        return;
      }

      try {
        // 不再呼叫 initializeAppCheck，因為已在 firebase-client.ts 初始化
        const ai = getAI(firebaseAppInstance, { backend: new GoogleAIBackend() });
        modelRef.current = getGenerativeModel(ai, { model: "gemini-2.0-flash" });
        console.log("Gemini model initialized.");

        if (!chatRef.current) {
          chatRef.current = modelRef.current.startChat({
            history: [],
            generationConfig: { maxOutputTokens: 500 },
          });
          console.log("New chat session started.");
        }

        setIsInitialized(true);
        setError(""); // Clear any initialization errors

      } catch (err: unknown) {
        console.error("Error initializing AI Model:", err);
        if (err instanceof Error) {
          setError(`AI 模型初始化失敗: ${err.message}`);
        } else {
          setError("AI 模型初始化失敗: 未知錯誤");
        }
      }
    };

    initializeAI();
  }, [isInitialized]);


  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [history]);


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const currentPrompt = prompt.trim();
    if (!currentPrompt || loading || !isInitialized) return;

    setLoading(true);
    setError("");

    const userMsg: ChatMessage = { role: "user", text: currentPrompt };
    setHistory(prev => [...prev, userMsg]);
    setPrompt("");

    if (!chatRef.current) {
      setError("聊天 Session 未準備好。請稍後再試。");
      setLoading(false);
      return;
    }

    try {
      const result = await chatRef.current.sendMessage(currentPrompt);
      const response = await result.response;
      const text = response.text();

      setHistory(h => [...h, { role: "model", text }]);

    } catch (err: unknown) { // Changed from any to unknown
      console.error("Error sending message:", err);
      // Perform type check before accessing error properties
      if (err instanceof Error) {
        setError(`訊息傳送失敗: ${err.message}`);
      } else {
        setError("訊息傳送失敗: 未知錯誤");
      }

    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: 24, backgroundColor: "#fff", borderRadius: 8, boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)" }}>
      <h2 style={{ textAlign: "center", color: "#333", marginBottom: 20 }}>與 Gemini 聊天</h2>

      <div ref={chatWindowRef} style={{ minHeight: 200, maxHeight: 400, overflowY: "auto", background: "#e9e9eb", padding: 16, borderRadius: 8, marginBottom: 16, display: "flex", flexDirection: "column" }}>
        {history.length === 0 && !loading && !error && !isInitialized && (
          <div style={{ color: '#888', textAlign: 'center' }}>正在初始化，請稍候...</div>
        )}
        {history.length === 0 && isInitialized && !loading && !error && (
          <div style={{ color: '#888', textAlign: 'center' }}>尚無對話，請開始聊天！</div>
        )}
        {history.map((msg, idx) => (
          <div key={idx} style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 6, maxWidth: "80%", wordWrap: "break-word", overflowWrap: "break-word", alignSelf: msg.role === "user" ? "flex-end" : "flex-start", backgroundColor: msg.role === "user" ? "#1976d2" : "#e0e0e0", color: msg.role === "user" ? "white" : "#333", textAlign: msg.role === "user" ? "right" : "left" }}>
            <span style={{ fontWeight: "bold", color: msg.role === "user" ? "inherit" : "#388e3c" }}>
              {msg.role === "user" ? "你" : "Gemini"}
            </span>
            ：{msg.text}
          </div>
        ))}
        {loading && (
          <div style={{ color: '#555', textAlign: 'center', marginTop: 10 }}>Gemini 正在思考中...</div>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8 }}>
        <textarea
          id="prompt-input"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={2}
          style={{ flex: 1, resize: "vertical", padding: 8, border: "1px solid #ccc", borderRadius: 4, fontSize: "1rem" }}
          placeholder={isInitialized ? "請輸入你的訊息..." : "初始化中..."}
          disabled={loading || !isInitialized}
        />
        <button type="submit" id="send-button" disabled={loading || !prompt.trim() || !isInitialized} style={{ padding: "8px 16px", backgroundColor: "#1976d2", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontSize: "1rem", transition: "background-color 0.3s ease" }}>
          {loading ? "傳送中..." : "傳送"}
        </button>
      </form>

      {error && <div style={{ color: "red", marginTop: 8, fontSize: "0.9rem" }}>{error}</div>}
    </div>
  );
}
