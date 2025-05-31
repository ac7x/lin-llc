"use client";
import React, { useRef, useCallback, useState } from "react";
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
    applyNodeChanges,
    applyEdgeChanges,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

let nodeId = 1;
const getId = () => `node_${nodeId++}`;

function Flow({ useSimpleState = false }: { useSimpleState?: boolean }) {
    const initialNodes: Node[] = [
        { id: "1", position: { x: 250, y: 5 }, data: { label: "節點 1" } },
        { id: "2", position: { x: 100, y: 100 }, data: { label: "節點 2" } },
    ];
    const initialEdges: Edge[] = [];

    // 切換不同 hook
    const [
        nodes, setNodes, onNodesChange,
        edges, setEdges, onEdgesChange
    ] = useSimpleState
            ? [
                useState<Node[]>(initialNodes)[0],
                useState<Node[]>(initialNodes)[1],
                (changes: any) => setNodes((nds: Node[]) => applyNodeChanges(changes, nds)),
                useState<Edge[]>(initialEdges)[0],
                useState<Edge[]>(initialEdges)[1],
                (changes: any) => setEdges((eds: Edge[]) => applyEdgeChanges(changes, eds)),
            ]
            : [
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

    return (
        <div style={{ height: "100vh" }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onConnectStart={onConnectStart}
                onConnectEnd={onConnectEnd}
                onNodeDragStop={onNodeDragStop}
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
            <Flow />
        </ReactFlowProvider>
    );
}
