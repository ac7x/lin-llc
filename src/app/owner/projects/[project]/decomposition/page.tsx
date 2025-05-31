"use client";

import React, { useState } from 'react';
import { ReactFlow, ReactFlowProvider, addEdge, Background, Controls, MiniMap, NodeChange, EdgeChange, Connection } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes = [
    { id: '1', type: 'input', data: { label: '開始節點' }, position: { x: 250, y: 0 } },
    { id: '2', data: { label: '中間節點' }, position: { x: 250, y: 150 } },
    { id: '3', type: 'output', data: { label: '結束節點' }, position: { x: 250, y: 300 } },
];

const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }, { id: 'e2-3', source: '2', target: '3' }];

export default function DecompositionPage() {
    const [nodes, setNodes] = useState(initialNodes);
    const [edges, setEdges] = useState(initialEdges);

    const onNodesChange = (changes: NodeChange[]) => setNodes((nds) => nds.map((node) => ({ ...node, ...changes })));
    const onEdgesChange = (changes: EdgeChange[]) => setEdges((eds) => eds.map((edge) => ({ ...edge, ...changes })));
    const onConnect = (connection: Connection) => setEdges((eds) => addEdge(connection, eds));

    return (
        <ReactFlowProvider>
            <div style={{ height: '100vh' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
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
        </ReactFlowProvider>
    );
}
