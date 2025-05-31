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

let nodeId = 1;
const getId = () => `node_${nodeId++}`;

function Flow() {
    const initialNodes: Node[] = [
        { id: "1", position: { x: 250, y: 5 }, data: { label: "節點 1" } },
        { id: "2", position: { x: 100, y: 100 }, data: { label: "節點 2" } },
    ];
    const initialEdges: Edge[] = [];
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
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

        // 直接新增節點，不判斷 pane
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
