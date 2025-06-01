import React from "react";

export function LogOverlay({ logs }: { logs: string[] }) {
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
                color: "white",
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
