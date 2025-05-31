"use client";

import { useParams } from "next/navigation";
import { useDocument } from "react-firebase-hooks/firestore";
import { doc, onSnapshot, updateDoc, setDoc } from "firebase/firestore";
import { useFirebase } from "@/modules/shared/infrastructure/persistence/firebase/FirebaseContext";
import { Project, Zone } from "@/types/project";
import { Network } from "vis-network/standalone";
import { DataSet } from "vis-data";
import { useRef, useState, useEffect } from "react";

// 新增型別定義
type NodeType = { id: string; label: string };
type EdgeType = { id: string; from: string; to: string; label: string };

function NetworkGraph({ projectId, zoneId, zones }: { projectId: string; zoneId: string; zones: Zone[] }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { db } = useFirebase();
    // 新增同步狀態與操作訊息 state
    const [syncStatus, setSyncStatus] = useState<string>("");
    const [operationLogs, setOperationLogs] = useState<string[]>([]);
    // 使用泛型指定 DataSet 型別
    const [nodes, setNodes] = useState(new DataSet<NodeType>([]));
    const [edges, setEdges] = useState(new DataSet<EdgeType>([]));

    // 從 Firestore 同步網路圖資料
    useEffect(() => {
        // 新增訂閱開始日誌
        setOperationLogs(prev => [...prev, "開始訂閱 Firestore 實時更新"]);
        const graphDocRef = doc(db, "projects", projectId, "zones", zoneId, "graph", "data");
        const unsubscribe = onSnapshot(graphDocRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                setNodes(new DataSet<NodeType>(data.nodes || []));
                setEdges(new DataSet<EdgeType>(data.edges || []));
                setOperationLogs(prev => [...prev, "從 Firestore 同步更新節點與邊"]);
            }
        });
        return () => {
            unsubscribe();
            // 可選：記錄取消訂閱
            setOperationLogs(prev => [...prev, "取消訂閱 Firestore"]);
        };
    }, [db, projectId, zoneId]);

    // 若 Firestore 沒有初始化，利用 zones 陣列初始化節點與邊
    useEffect(() => {
        if (nodes.length > 0 || zones.length === 0) return;
        setOperationLogs(prev => [...prev, "初始化同步開始"]);
        const projectNode: NodeType = { id: "project", label: "專案" };
        const zoneNodes = zones.map(zone => ({ id: zone.zoneId, label: zone.zoneName } as NodeType));
        setNodes(new DataSet<NodeType>([projectNode, ...zoneNodes]));
        const newEdges = zones.map(zone => ({
            id: `edge-${zone.zoneId}`,
            from: zone.zoneId,
            to: "project",
            label: "連接"
        } as EdgeType));
        setEdges(new DataSet<EdgeType>(newEdges));
        setDoc(doc(db, "projects", projectId, "zones", zoneId, "graph", "data"), {
            nodes: [projectNode, ...zoneNodes],
            edges: newEdges
        })
            .then(() => {
                setOperationLogs(prev => [
                    ...prev,
                    `初始化同步成功: 節點數量=${[projectNode, ...zoneNodes].length}, 邊數量=${newEdges.length}`
                ]);
            })
            .catch((err) => {
                setOperationLogs(prev => [...prev, `初始化同步失敗: ${err.message}`]);
            });
    }, [zones, nodes, db, projectId, zoneId]);

    useEffect(() => {
        if (containerRef.current) {
            const data = { nodes, edges };
            const options = {
                layout: { hierarchical: false },
                physics: { enabled: true },
                manipulation: {
                    enabled: true,
                    initiallyActive: true,
                    editEdge: function (data: any, callback: any) {
                        // 加入編輯前詳細日誌，包含邊的 id
                        setOperationLogs(prev => [...prev, `開始編輯邊: ${data.id}`]);
                        setOperationLogs(prev => [...prev, "編輯邊操作開始"]);
                        console.log("editEdge 開始，原始邊資料:", data);
                        const newLabel = prompt("請輸入新的邊標籤：", data.label) || data.label;
                        data.label = newLabel;
                        edges.update({ id: data.id, label: newLabel });
                        const allEdges = edges.get();
                        console.log("更新後的所有邊:", allEdges);
                        setDoc(doc(db, "projects", projectId, "zones", zoneId, "graph", "data"), { edges: allEdges }, { merge: true })
                            .then(() => {
                                setSyncStatus("同步成功");
                                setOperationLogs(prev => [...prev, "邊資料同步成功"]);
                                callback(data);
                            })
                            .catch(err => {
                                setSyncStatus("同步失敗");
                                setOperationLogs(prev => [...prev, "邊資料同步失敗"]);
                                console.error("邊資料同步失敗:", err);
                                callback(data);
                            });
                    }
                }
            };
            new Network(containerRef.current, data, options);
            // 網路圖建立完成後加入日誌
            setOperationLogs(prev => [...prev, "網路圖載入完成"]);
        }
    }, [containerRef, nodes, edges, db, projectId, zoneId]);

    return (
        <>
            <div ref={containerRef} style={{ height: "400px" }} />
            {/* 顯示同步狀態 */}
            {syncStatus && <div style={{ marginTop: "8px", color: "green" }}>{syncStatus}</div>}
            <div style={{ marginTop: "8px" }}>
                <h3>操作記錄:</h3>
                <ul>
                    {operationLogs.map((log, index) => <li key={index}>{log}</li>)}
                </ul>
            </div>
        </>
    );
}

export default function ZoneDetailPage() {
    const params = useParams();
    const projectId = params?.project as string; // 確保 projectId 是字串類型
    const zoneId = params?.zone as string;       // 確保 zoneId 是字串類型

    if (!projectId || !zoneId) {
        return <div>無效的專案或分區 ID</div>;
    }

    const { db } = useFirebase();
    const [projectDoc, loading, error] = useDocument(doc(db, "projects", projectId));

    if (loading) return <div>載入中...</div>;
    if (error) return <div>錯誤: {error.message}</div>;
    if (!projectDoc?.exists()) return <div>找不到專案</div>;

    const project = projectDoc.data() as Project;
    const zone = project.zones.find((z: Zone) => z.zoneId === zoneId);
    if (!zone) return <div>找不到分區</div>;

    return (
        <main className="max-w-3xl mx-auto p-4">
            {/* 新增網路圖區域，傳入 zones 陣列 */}
            <div className="mt-6">
                <h2 className="text-xl font-bold mb-2">網路圖</h2>
                <NetworkGraph projectId={projectId} zoneId={zoneId} zones={project.zones} />
            </div>
        </main>
    );
}
