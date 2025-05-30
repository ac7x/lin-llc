"use client";
import React, { useRef, useCallback } from "react";
import {
    ReactFlow,
    ReactFlowProvider,
    addEdge,
    MiniMap,
    Controls,
    Background,
    useReactFlow,
    useNodesState,
    useEdgesState,
    Node,
    Edge,
    Connection,
    OnConnectStart,
    OnConnectEnd,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { FirestoreSync } from "./FirestoreSync";
import { DeleteButton } from "./DeleteButton";

let nodeId = 1;
const getId = () => `node_${nodeId++}`;

function Flow({ nodes: propNodes, edges: propEdges }: { nodes?: Node[]; edges?: Edge[] }) {
    const initialNodes: Node[] = propNodes ?? [];
    const initialEdges: Edge[] = propEdges ?? [];

    const [
        nodes, setNodes, onNodesChange,
        edges, setEdges, onEdgesChange
    ] = [
            ...useNodesState(initialNodes),
            ...useEdgesState(initialEdges),
        ];

    const { screenToFlowPosition } = useReactFlow();
    const connectingNodeId = useRef<string | null>(null);

    // 拖曳新節點時的 id
    const draggingNodeId = useRef<string | null>(null);

    const onConnect = useCallback((params: Connection) => setEdges(eds => addEdge(params, eds)), [setEdges]);

    const onConnectStart: OnConnectStart = useCallback((_, params) => {
        connectingNodeId.current = params.nodeId || null;
    }, []);

    const onConnectEnd: OnConnectEnd = useCallback((event) => {
        const sourceId = connectingNodeId.current;
        if (!sourceId) return;

        // 檢查是否拖曳到 pane（空白處），只有這種情況才新增節點
        const targetIsPane =
            event.target &&
            (event.target as HTMLElement).classList.contains("react-flow__pane");

        if (targetIsPane) {
            const { clientX, clientY } =
                "changedTouches" in event ? event.changedTouches[0] : event;
            const position = screenToFlowPosition({ x: clientX, y: clientY });
            const newNodeId = getId();
            const newNode: Node = {
                id: newNodeId,
                position,
                data: { label: "新節點" },
            };
            setNodes(nds => [...nds, newNode]);
            setEdges(eds => [
                ...eds,
                { id: `e${sourceId}-${newNodeId}`, source: sourceId, target: newNodeId },
            ]);
            draggingNodeId.current = newNodeId;
        }
        connectingNodeId.current = null;
    }, [screenToFlowPosition, setNodes, setEdges]);

    // 拖動新節點
    const onNodeDragStop = useCallback(
        (event: React.MouseEvent | React.TouchEvent, node: Node) => {
            if (draggingNodeId.current && node.id === draggingNodeId.current) {
                // 只處理剛新增的節點
                draggingNodeId.current = null;
            }
        },
        []
    );

    // 新增選取狀態
    const [selectedNodeIds, setSelectedNodeIds] = React.useState<string[]>([]);
    const [selectedEdgeIds, setSelectedEdgeIds] = React.useState<string[]>([]);

    // 處理選取變更
    const onSelectionChange = React.useCallback(({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) => {
        setSelectedNodeIds(nodes.map((n: Node) => n.id));
        setSelectedEdgeIds(edges.map((e: Edge) => e.id));
    }, []);

    // 刪除選取
    const handleDelete = React.useCallback(() => {
        setNodes(nds => nds.filter(n => !selectedNodeIds.includes(n.id)));
        setEdges(eds => eds.filter(e => !selectedEdgeIds.includes(e.id)));
        setSelectedNodeIds([]);
        setSelectedEdgeIds([]);
    }, [selectedNodeIds, selectedEdgeIds, setNodes, setEdges]);

    return (
        <div style={{ height: "100vh" }}>
            <DeleteButton
                onDelete={handleDelete}
                disabled={selectedNodeIds.length === 0 && selectedEdgeIds.length === 0}
            />
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onConnectStart={onConnectStart}
                onConnectEnd={onConnectEnd}
                onNodeDragStop={onNodeDragStop}
                onSelectionChange={onSelectionChange}
                fitView
            >
                <MiniMap />
                <Controls />
                <Background />
            </ReactFlow>
        </div>
    );
}

export default function DecompositionPage() {
    return (
        <ReactFlowProvider>
            <FirestoreSync>
                {(nodes, edges, loading, error) => {
                    if (loading) return <div>載入中...</div>;
                    if (error) return <div>錯誤: {String(error)}</div>;
                    return <Flow nodes={nodes} edges={edges} />;
                }}
            </FirestoreSync>
        </ReactFlowProvider>
    );
}
