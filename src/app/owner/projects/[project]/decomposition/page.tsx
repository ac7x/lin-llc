"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from "next/navigation";
import { ReactFlow, ReactFlowProvider, addEdge, applyNodeChanges, applyEdgeChanges, Background, Controls, MiniMap } from '@xyflow/react';
import { useFirebase } from "@/modules/shared/infrastructure/persistence/firebase/FirebaseContext";
import '@xyflow/react/dist/style.css';

const CustomNode = ({ data, selected, colorMode }: any) => (
    <div
        style={{
            background: colorMode === "dark" ? "#223047" : "#2a6c97",
            border: selected
                ? "2.5px solid #fbbf24"
                : colorMode === "dark"
                    ? "2px solid #3b82f6"
                    : "2px solid #0d618f",
            color: "#fff",
            fontWeight: 600,
            fontSize: "1rem",
            borderRadius: 8,
            boxShadow: selected
                ? "0 8px 24px 0 rgba(0,0,0,0.18)"
                : "0 4px 16px 0 rgba(0,0,0,0.10)",
            padding: "16px 20px",
            minWidth: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "box-shadow 0.2s, border 0.2s, background 0.2s",
        }}
    >
        {data.label}
    </div>
);

export default function DecompositionPage() {
    const { db, doc, useDocument, updateDoc } = useFirebase();
    const params = useParams();
    const projectId = params?.project as string;
    const [projectDoc, loading, error] = useDocument(doc(db, "projects", projectId));
    const [rfNodes, setNodes] = useState<any[]>([]);
    const [rfEdges, setEdges] = useState<any[]>([]);
    const [colorMode, setColorMode] = useState<"light" | "dark">("light");

    useEffect(() => {
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const update = () => setColorMode(mq.matches ? "dark" : "light");
        update();
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);

    useEffect(() => {
        if (projectDoc?.exists()) {
            const d = projectDoc.data()?.decomposition;
            setNodes(Array.isArray(d?.nodes) ? d.nodes : []);
            setEdges(Array.isArray(d?.edges) ? d.edges : []);
        }
    }, [projectDoc]);

    const nodeTypes = { custom: CustomNode };

    const handleAddNode = () => setNodes(prev => [
        ...prev,
        {
            id: `node_${Date.now()}`,
            type: "custom",
            position: { x: 100 + prev.length * 40, y: 100 + prev.length * 40 },
            data: { label: `新節點${prev.length + 1}` },
        }
    ]);

    const syncDecomposition = async (nodes: any[], edges: any[]) => {
        if (!projectId) return;
        try {
            await updateDoc(doc(db, "projects", projectId), { decomposition: { nodes, edges } });
        } catch { }
    };

    const onNodesChange = (changes: any) =>
        setNodes(nds => {
            const newNodes = applyNodeChanges(changes, nds);
            syncDecomposition(newNodes, rfEdges);
            return newNodes;
        });
    const onEdgesChange = (changes: any) =>
        setEdges(eds => {
            const newEdges = applyEdgeChanges(changes, eds);
            syncDecomposition(rfNodes, newEdges);
            return newEdges;
        });
    const onConnect = (connection: any) =>
        setEdges(eds => {
            const newEdges = addEdge(connection, eds);
            syncDecomposition(rfNodes, newEdges);
            return newEdges;
        });

    if (loading) return <div className="flex items-center justify-center h-full text-gray-400 text-lg">載入中...</div>;
    if (error) return <div className="flex items-center justify-center h-full text-red-500 text-lg">讀取失敗: {error.message}</div>;
    if (!projectDoc?.exists()) return <div className="flex items-center justify-center h-full text-gray-400 text-lg">尚無資料</div>;

    return (
        <ReactFlowProvider>
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
                <div className="flex items-center justify-between px-4 pt-4 mb-2">
                    <div className="text-xl font-bold">{projectDoc.data()?.projectName || projectId}</div>
                    <button
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                        onClick={handleAddNode}
                        type="button"
                    >
                        新增節點
                    </button>
                </div>
                {rfNodes.length === 0 && rfEdges.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-gray-400 text-lg">尚無分解資料</div>
                ) : (
                    <div style={{ flex: 1 }}>
                        <ReactFlow
                            nodes={rfNodes}
                            edges={rfEdges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            fitView
                            nodeTypes={nodeTypes}
                            colorMode={colorMode}
                            proOptions={{ hideAttribution: true }}
                        >
                            <MiniMap />
                            <Controls />
                            <Background />
                        </ReactFlow>
                    </div>
                )}
            </div>
        </ReactFlowProvider>
    );
}
