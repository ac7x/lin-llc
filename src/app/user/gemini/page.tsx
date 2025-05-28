"use client";

import { useState, useRef } from "react";
import { app as firebaseApp } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// 初始化 Firebase App Check（只執行一次）
if (typeof window !== "undefined") {
  initializeAppCheck(firebaseApp, {
    provider: new ReCaptchaV3Provider("6LeBT00rAAAAACACABHOrZffdfHLxBlbnSruCbt95Z"),
    isTokenAutoRefreshEnabled: true,
  });
}

const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });
const model = getGenerativeModel(ai, { model: "gemini-2.0-flash" });

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export default function GeminiPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const chatRef = useRef<ReturnType<typeof model.startChat> | null>(null);

  async function getChat() {
    if (!chatRef.current) {
      chatRef.current = model.startChat({
        history: history.map(msg => ({
          role: msg.role,
          parts: [{ text: msg.text }],
        })),
        generationConfig: { maxOutputTokens: 200 },
      });
    }
    return chatRef.current;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const userMsg: ChatMessage = { role: "user", text: prompt };
    setPrompt("");
    try {
      setHistory(prev => [...prev, userMsg]);
      const chat = await getChat();
      if (!chat) throw new Error("Chat session 初始化失敗");
      const result = await chat.sendMessage(prompt);
      const response = await result.response;
      const text = response.text();
      setHistory(h => [...h, { role: "model", text }]);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("發生錯誤");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: 24 }}>
      <h2>Gemini 即時聊天</h2>
      <div style={{ minHeight: 200, background: "#f5f5f5", padding: 16, borderRadius: 8, marginBottom: 16 }}>
        {history.length === 0 && <div style={{ color: '#888' }}>尚無對話，請開始聊天！</div>}
        {history.map((msg, idx) => (
          <div key={idx} style={{ marginBottom: 8, textAlign: msg.role === "user" ? "right" : "left" }}>
            <span style={{ fontWeight: "bold", color: msg.role === "user" ? "#1976d2" : "#388e3c" }}>
              {msg.role === "user" ? "你" : "Gemini"}
            </span>
            ：{msg.text}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8 }}>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={2}
          style={{ flex: 1, resize: "vertical" }}
          placeholder="請輸入你的訊息..."
          disabled={loading}
        />
        <button type="submit" disabled={loading || !prompt} style={{ minWidth: 80 }}>
          {loading ? "傳送中..." : "傳送"}
        </button>
      </form>
      {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
    </div>
  );
}
