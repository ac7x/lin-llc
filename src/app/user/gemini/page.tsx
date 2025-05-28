"use client";
import { useState } from "react";
import { app as firebaseApp } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";

const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });
const model = getGenerativeModel(ai, { model: "gemini-2.0-flash" });

export default function GeminiPage() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult("");
    try {
      const res = await model.generateContent(prompt);
      setResult(res.response.text());
    } catch (err: unknown) {
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
      <h2>Gemini 文字生成</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={4}
          style={{ width: "100%", marginBottom: 8 }}
          placeholder="請輸入你的提示詞..."
        />
        <button type="submit" disabled={loading || !prompt}>
          {loading ? "生成中..." : "送出"}
        </button>
      </form>
      {error && <div style={{ color: "red" }}>{error}</div>}
      {result && (
        <div style={{ background: "#f5f5f5", padding: 16, borderRadius: 8 }}>
          <strong>生成結果：</strong>
          <div>{result}</div>
        </div>
      )}
    </div>
  );
}
