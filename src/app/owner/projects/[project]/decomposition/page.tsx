"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from "next/navigation";
import { ReactFlow, ReactFlowProvider, addEdge, applyNodeChanges, applyEdgeChanges, Background, Controls, MiniMap, NodeChange, EdgeChange, Connection } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useFirebase } from "@/modules/shared/infrastructure/persistence/firebase/FirebaseContext";

export default function DecompositionPage() {
    const { db, doc, useDocument, updateDoc } = useFirebase();
    const params = useParams();
    const projectId = params?.project as string;
    const [projectDoc, loading, error] = useDocument(doc(db, "projects", projectId));

    // 先初始化為空陣列，避免 hooks 順序錯亂
    const [rfNodes, setNodes] = useState<any[]>([]);
    const [rfEdges, setEdges] = useState<any[]>([]);

    // 當 projectDoc 變動時，同步 nodes/edges 狀態
    useEffect(() => {
        if (projectDoc?.exists()) {
            const decomposition = projectDoc.data()?.decomposition;
            if (decomposition && typeof decomposition === "object") {
                setNodes(Array.isArray(decomposition.nodes) ? decomposition.nodes : []);
                setEdges(Array.isArray(decomposition.edges) ? decomposition.edges : []);
            } else {
                setNodes([]);
                setEdges([]);
            }
        }
    }, [projectDoc]);

    // 新增節點功能
    const handleAddNode = () => {
        setNodes((prev) => {
            const newId = `node_${Date.now()}`;
            const newNode = {
                id: newId,
                type: "default",
                position: { x: 100 + prev.length * 40, y: 100 + prev.length * 40 },
                data: { label: `新節點${prev.length + 1}` },
            };
            return [...prev, newNode];
        });
    };

    // 同步到 Firestore
    const syncDecomposition = async (nodes: any[], edges: any[]) => {
        if (!projectId) return;
        try {
            await updateDoc(doc(db, "projects", projectId), {
                decomposition: { nodes, edges }
            });
        } catch (e) {
            // 可根據需求顯示錯誤提示
            // console.error("同步分解資料失敗", e);
        }
    };

    const onNodesChange = (changes: NodeChange[]) =>
        setNodes((nds) => {
            const newNodes = applyNodeChanges(changes, nds);
            syncDecomposition(newNodes, rfEdges);
            return newNodes;
        });
    const onEdgesChange = (changes: EdgeChange[]) =>
        setEdges((eds) => {
            const newEdges = applyEdgeChanges(changes, eds);
            syncDecomposition(rfNodes, newEdges);
            return newEdges;
        });
    const onConnect = (connection: Connection) =>
        setEdges((eds) => {
            const newEdges = addEdge(connection, eds);
            syncDecomposition(rfNodes, newEdges);
            return newEdges;
        });

    if (loading) {
        return <div className="flex items-center justify-center h-full text-gray-400 text-lg">載入中...</div>;
    }
    if (error) {
        return <div className="flex items-center justify-center h-full text-red-500 text-lg">讀取失敗: {error.message}</div>;
    }
    if (!projectDoc?.exists()) {
        return <div className="flex items-center justify-center h-full text-gray-400 text-lg">尚無資料</div>;
    }

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
