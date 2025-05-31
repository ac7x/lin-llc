"use client";

import { useParams } from "next/navigation";
import { useDocument } from "react-firebase-hooks/firestore";
import { useFirebase } from "@/modules/shared/infrastructure/persistence/firebase/FirebaseContext";
import { Project, Zone } from "@/types/project";
import { Network } from "vis-network/standalone";
import { DataSet } from "vis-data";
import { useRef, useState, useEffect } from "react";

// 型別定義
type NodeType = { id: string; label: string };
type EdgeType = { id: string; from: string; to: string; label: string };

// vis-network manipulation 事件型別
type EditEdgeData = { id: string; label: string };
type DeleteEdgeData = Array<{ id: string }>;
type Callback<T> = (data: T | null) => void;

function NetworkGraph({
    projectId,
    zoneId,
    zones,
    projectName,
}: {
    projectId: string;
    zoneId: string;
    zones: Zone[];
    projectName: string;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const networkRef = useRef<Network | null>(null);
    const { db, doc, onSnapshot, setDoc } = useFirebase();
    const [operationLogs, setOperationLogs] = useState<string[]>([]);
    const nodesRef = useRef<DataSet<NodeType>>(new DataSet<NodeType>([]));
    const edgesRef = useRef<DataSet<EdgeType>>(new DataSet<EdgeType>([]));
    const isRemoteUpdate = useRef<boolean>(false);

    useEffect(() => {
        setOperationLogs(prev => [...prev, "開始訂閱 Firestore 實時更新"]);
        const graphDocRef = doc(db as typeof db, "projects", projectId, "zones_graph", zoneId);
        const unsubscribe = onSnapshot(graphDocRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data() as { nodes?: NodeType[]; edges?: EdgeType[] };
                isRemoteUpdate.current = true;
                nodesRef.current.clear();
                edgesRef.current.clear();
                nodesRef.current.add(data.nodes || []);
                edgesRef.current.add(data.edges || []);
                setOperationLogs(prev => [...prev, "從 Firestore 同步更新節點與邊"]);
                isRemoteUpdate.current = false;
            } else if (zones.length > 0) {
                setOperationLogs(prev => [...prev, "Firestore 無資料，開始初始化同步"]);
                const projectNode: NodeType = { id: "project", label: projectName || "專案" };
                const zoneNodes: NodeType[] = zones.map(zone => ({ id: zone.zoneId, label: zone.zoneName }));
                const newEdges: EdgeType[] = zones.map(zone => ({
                    id: `edge-${zone.zoneId}`,
                    from: zone.zoneId,
                    to: "project",
                    label: "連接"
                }));
                setDoc(graphDocRef, {
                    nodes: [projectNode, ...zoneNodes],
                    edges: newEdges
                })
                    .then(() => {
                        setOperationLogs(prev => [
                            ...prev,
                            `初始化同步成功: 節點數量=${[projectNode, ...zoneNodes].length}, 邊數量=${newEdges.length}`
                        ]);
                    })
                    .catch(() => {
                        setOperationLogs(prev => [...prev, `初始化同步失敗`]);
                    });
            }
        });
        return () => {
            unsubscribe();
            setOperationLogs(prev => [...prev, "取消訂閱 Firestore"]);
        };
    }, [db, doc, onSnapshot, setDoc, projectId, zoneId, zones, projectName]);

    useEffect(() => {
        if (containerRef.current && !networkRef.current) {
            const data = { nodes: nodesRef.current, edges: edgesRef.current };
            const options = {
                layout: { hierarchical: { enabled: true, direction: "LR" } },
                physics: { enabled: true },
                manipulation: {
                    enabled: true,
                    initiallyActive: true,
                    editEdge: async (data: EditEdgeData, callback: Callback<EditEdgeData>) => {
                        setOperationLogs(prev => [...prev, `開始編輯邊: ${data.id}`]);
                        setOperationLogs(prev => [...prev, "編輯邊操作開始"]);
                        const newLabel = prompt("請輸入新的邊標籤：", data.label) ?? data.label;
                        data.label = newLabel;
                        const allEdges: EdgeType[] = edgesRef.current.get().map(edge =>
                            edge.id === data.id ? { ...edge, label: newLabel } : edge
                        );
                        try {
                            await setDoc(
                                doc(db as typeof db, "projects", projectId, "zones_graph", zoneId),
                                { edges: allEdges },
                                { merge: true }
                            );
                            setOperationLogs(prev => [...prev, "邊資料同步成功"]);
                            callback(data);
                        } catch (e) {
                            const message = e instanceof Error ? e.message : String(e);
                            setOperationLogs(prev => [...prev, `邊資料同步失敗: ${message}`]);
                            callback(null);
                        }
                    },
                    deleteEdge: async (data: DeleteEdgeData, callback: Callback<DeleteEdgeData>) => {
                        setOperationLogs(prev => [...prev, `開始刪除邊: ${data.map((edge) => edge.id).join(", ")}`]);
                        const idsToDelete = data.map((edge) => edge.id);
                        const allEdges: EdgeType[] = edgesRef.current.get().filter(edge => !idsToDelete.includes(edge.id));
                        try {
                            await setDoc(
                                doc(db as typeof db, "projects", projectId, "zones_graph", zoneId),
                                { edges: allEdges },
                                { merge: true }
                            );
                            setOperationLogs(prev => [...prev, "邊刪除同步成功"]);
                            callback(data);
                        } catch (e) {
                            const message = e instanceof Error ? e.message : String(e);
                            setOperationLogs(prev => [...prev, `邊刪除同步失敗: ${message}`]);
                            callback(null);
                        }
                    },
                    addNode: async (data: NodeType, callback: Callback<NodeType>) => {
                        setOperationLogs(prev => [...prev, `新增節點: ${data.id}`]);
                        nodesRef.current.add(data);
                        try {
                            const allNodes: NodeType[] = nodesRef.current.get();
                            await setDoc(
                                doc(db as typeof db, "projects", projectId, "zones_graph", zoneId),
                                { nodes: allNodes },
                                { merge: true }
                            );
                            setOperationLogs(prev => [...prev, "節點新增同步成功"]);
                            callback(data);
                        } catch (e) {
                            const message = e instanceof Error ? e.message : String(e);
                            setOperationLogs(prev => [...prev, `節點新增同步失敗: ${message}`]);
                            callback(null);
                        }
                    },
                    addEdge: async (data: EdgeType, callback: Callback<EdgeType>) => {
                        setOperationLogs(prev => [...prev, `新增邊: ${data.id}`]);
                        edgesRef.current.add(data);
                        try {
                            const allEdges: EdgeType[] = edgesRef.current.get();
                            await setDoc(
                                doc(db as typeof db, "projects", projectId, "zones_graph", zoneId),
                                { edges: allEdges },
                                { merge: true }
                            );
                            setOperationLogs(prev => [...prev, "邊新增同步成功"]);
                            callback(data);
                        } catch (e) {
                            const message = e instanceof Error ? e.message : String(e);
                            setOperationLogs(prev => [...prev, `邊新增同步失敗: ${message}`]);
                            callback(null);
                        }
                    }
                }
            };
            networkRef.current = new Network(containerRef.current, data, options);
            setOperationLogs(prev => [...prev, "網路圖載入完成"]);
        }
    }, [containerRef, db, doc, setDoc, projectId, zoneId]);

    useEffect(() => {
        const nodesDS = nodesRef.current;
        const edgesDS = edgesRef.current;

        const handleNodesChange = async () => {
            if (isRemoteUpdate.current) return;
            const allNodes: NodeType[] = nodesDS.get();
            try {
                await setDoc(
                    doc(db as typeof db, "projects", projectId, "zones_graph", zoneId),
                    { nodes: allNodes },
                    { merge: true }
                );
                setOperationLogs(prev => [...prev, "本地節點變更已同步到 Firestore"]);
            } catch (e) {
                const message = e instanceof Error ? e.message : String(e);
                setOperationLogs(prev => [...prev, `節點同步失敗: ${message}`]);
            }
        };
        const handleEdgesChange = async () => {
            if (isRemoteUpdate.current) return;
            const allEdges: EdgeType[] = edgesDS.get();
            try {
                await setDoc(
                    doc(db as typeof db, "projects", projectId, "zones_graph", zoneId),
                    { edges: allEdges },
                    { merge: true }
                );
                setOperationLogs(prev => [...prev, "本地邊變更已同步到 Firestore"]);
            } catch (e) {
                const message = e instanceof Error ? e.message : String(e);
                setOperationLogs(prev => [...prev, `邊同步失敗: ${message}`]);
            }
        };
        nodesDS.on("add", handleNodesChange);
        nodesDS.on("remove", handleNodesChange);
        nodesDS.on("update", handleNodesChange);
        edgesDS.on("add", handleEdgesChange);
        edgesDS.on("remove", handleEdgesChange);
        edgesDS.on("update", handleEdgesChange);
        return () => {
            nodesDS.off("add", handleNodesChange);
            nodesDS.off("remove", handleNodesChange);
            nodesDS.off("update", handleNodesChange);
            edgesDS.off("add", handleEdgesChange);
            edgesDS.off("remove", handleEdgesChange);
            edgesDS.off("update", handleEdgesChange);
        };
    }, [db, doc, setDoc, projectId, zoneId]);

    // --------- Minimum Viable Code 只加一行顯示節點數量 ---------
    return (
        <>
            <div ref={containerRef} style={{ height: "700px" }} />
            {/* 只加這一行，完全不動其它程式碼 */}
            <div style={{ position: "absolute", left: 10, top: 10, background: "#eee", padding: "2px 8px", borderRadius: "4px", zIndex: 99 }}>
                節點數量：{nodesRef.current.get().length}
            </div>
            <div className="fixed top-2 right-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-2 max-w-[300px] max-h-[300px] overflow-y-auto z-50">
                <h3 className="text-black dark:text-white">操作記錄:</h3>
                <ul>
                    {operationLogs.map((log, index) => (
                        <li key={index} className="text-black dark:text-gray-300">{log}</li>
                    ))}
                </ul>
            </div>
        </>
    );
}

export default function ZoneDetailPage() {
    const params = useParams();
    const projectId = params?.project as string;
    const zoneId = params?.zone as string;

    const { db, doc } = useFirebase();
    const [projectDoc, loading, error] = useDocument(doc(db as typeof db, "projects", projectId));

    if (!projectId || !zoneId) {
        return <div>無效的專案或分區 ID</div>;
    }
    if (loading) return <div>載入中...</div>;
    if (error) return <div>錯誤: {error.message}</div>;
    if (!projectDoc?.exists()) return <div>找不到專案</div>;

    const project = projectDoc.data() as Project;
    const zone = project.zones.find((z: Zone) => z.zoneId === zoneId);
    if (!zone) return <div>找不到分區</div>;

    return (
        <main className="max-w-9xl mx-auto p-4">
            <div className="mt-6">
                <h2 className="text-xl font-bold mb-2">網路圖</h2>
                <NetworkGraph
                    projectId={projectId}
                    zoneId={zoneId}
                    zones={project.zones}
                    projectName={project.projectName}
                />
            </div>
        </main>
    );
}