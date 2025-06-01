import React, { createContext, useContext, useState, ReactNode } from "react";

type LogContextType = {
    logs: string[];
    addLog: (msg: string) => void;
};

const LogContext = createContext<LogContextType | undefined>(undefined);

export function LogProvider({ children }: { children: ReactNode }) {
    const [logs, setLogs] = useState<string[]>([]);
    const addLog = (msg: string) => setLogs((prev) => [...prev, msg]);
    return (
        <LogContext.Provider value={{ logs, addLog }}>
            {children}
        </LogContext.Provider>
    );
}

export function useLog() {
    const ctx = useContext(LogContext);
    if (!ctx) throw new Error("useLog 必須在 LogProvider 內使用");
    return ctx;
}

// 支援 embedded 參數，讓側邊欄顯示更自然
export function LogOverlay({ logs, embedded = false }: { logs: string[], embedded?: boolean }) {
    if (embedded) {
        return (
            <div
                style={{
                    backgroundColor: "rgba(0,0,0,0.05)",
                    color: "white", // 改為白字
                    padding: "10px",
                    borderRadius: "5px",
                    fontSize: "12px",
                    marginTop: "2rem",
                    maxHeight: "200px",
                    overflowY: "auto",
                }}
            >
                <h4 className="font-bold mb-2">日誌</h4>
                <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                    {logs.map((log, index) => (
                        <li key={index} style={{ marginBottom: "5px" }}>
                            {log}
                        </li>
                    ))}
                </ul>
            </div>
        );
    }
    // 原本的浮動樣式
    return (
        <div
            style={{
                position: "fixed",
                top: 10,
                right: 10,
                width: "300px",
                maxHeight: "400px",
                overflowY: "auto",
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                color: "white", // 改為白字
                padding: "10px",
                borderRadius: "5px",
                fontSize: "12px",
                zIndex: 1000,
            }}
        >
            <h4>日誌</h4>
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {logs.map((log, index) => (
                    <li key={index} style={{ marginBottom: "5px" }}>
                        {log}
                    </li>
                ))}
            </ul>
        </div>
    );
}
