import React from "react";
import { useParams } from "next/navigation";
import { Node, Edge } from "@xyflow/react";
import { useFirebase } from "@/modules/shared/infrastructure/persistence/firebase/FirebaseContext";
import { useLog } from "./LogOverlay";

// 修正：邊的 id 也需唯一且不能與節點重複
function ensureUniqueStringId(arr: any[] | undefined, prefix: string): any[] {
    if (!arr) return [];
    const seen = new Set<string>();
    return arr.map((item, idx) => {
        let id = typeof item.id === "string" ? item.id : String(item.id ?? idx);
        id = `${prefix}_${id}`;
        while (seen.has(id)) {
            id = `${id}_${Math.random().toString(36).slice(2, 8)}`;
        }
        seen.add(id);
        return { ...item, id };
    });
}

export function FirestoreSync({
    children,
}: {
    children: (
        nodes: Node[] | undefined,
        edges: Edge[] | undefined,
        loading: boolean,
        error: any,
        setNodes: React.Dispatch<React.SetStateAction<Node[] | undefined>>,
        setEdges: React.Dispatch<React.SetStateAction<Edge[] | undefined>>,
        addLog: (message: string) => void
    ) => React.ReactNode;
}) {
    const params = useParams();
    const projectId = params?.project as string;
    const { db, doc, useDocument, updateDoc } = useFirebase();
    const [projectDoc, loading, error] = useDocument(
        projectId ? doc(db, "projects", projectId) : undefined
    );

    // 本地狀態
    const [nodes, setNodes] = React.useState<Node[] | undefined>(undefined);
    const [edges, setEdges] = React.useState<Edge[] | undefined>(undefined);
    const { addLog } = useLog();

    // 用一個 ref 來避免重複 log
    const loadedRef = React.useRef(false);

    React.useEffect(() => {
        if (projectDoc?.exists()) {
            const decomposition = projectDoc.data().decomposition;
            setNodes(ensureUniqueStringId(decomposition?.nodes, "node"));
            setEdges(ensureUniqueStringId(decomposition?.edges, "edge"));
            if (!loadedRef.current) {
                addLog("從 Firestore 載入節點與邊");
                loadedRef.current = true;
            }
        }
        // 這裡 addLog 不用放進依賴，因為只要 log 一次
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectDoc]);

    // 本地變更時，自動同步到 Firestore
    const prevNodes = React.useRef<Node[] | undefined>(undefined);
    const prevEdges = React.useRef<Edge[] | undefined>(undefined);
    React.useEffect(() => {
        if (!projectId) return;
        if (!nodes || !edges) return;
        // 避免初始載入時觸發
        if (
            prevNodes.current === undefined &&
            prevEdges.current === undefined
        ) {
            prevNodes.current = nodes;
            prevEdges.current = edges;
            return;
        }
        // 僅當內容有變更時才寫入
        if (
            JSON.stringify(nodes) !== JSON.stringify(prevNodes.current) ||
            JSON.stringify(edges) !== JSON.stringify(prevEdges.current)
        ) {
            updateDoc(doc(db, "projects", projectId), {
                decomposition: {
                    nodes,
                    edges,
                },
                updatedAt: new Date(),
            });
            prevNodes.current = nodes;
            prevEdges.current = edges;
            addLog("同步到 Firestore");
        }
    }, [nodes, edges, db, doc, projectId, updateDoc, addLog]);

    return <>{children(nodes, edges, loading, error, setNodes, setEdges, addLog)}</>;
}
