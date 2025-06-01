import React from "react";
import { useParams } from "next/navigation";
import { Node, Edge } from "@xyflow/react";
import { useFirebase } from "@/modules/shared/infrastructure/persistence/firebase/FirebaseContext";

// 修正：邊的 id 也需唯一且不能與節點重複
function ensureUniqueStringId(arr: any[] | undefined, prefix: string): any[] {
    if (!arr) return [];
    const seen = new Set<string>();
    return arr.map((item, idx) => {
        let id = typeof item.id === "string" ? item.id : String(item.id ?? idx);
        // 強制加上前綴避免節點和邊 id 衝突
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
    children: (nodes: Node[] | undefined, edges: Edge[] | undefined, loading: boolean, error: any) => React.ReactNode;
}) {
    const params = useParams();
    const projectId = params?.project as string;
    const { db, doc, useDocument } = useFirebase();
    const [projectDoc, loading, error] = useDocument(
        projectId ? doc(db, "projects", projectId) : undefined
    );

    let nodes: Node[] | undefined = undefined;
    let edges: Edge[] | undefined = undefined;
    if (projectDoc?.exists()) {
        const decomposition = projectDoc.data().decomposition;
        nodes = ensureUniqueStringId(decomposition?.nodes, "node");
        edges = ensureUniqueStringId(decomposition?.edges, "edge");
    }

    return <>{children(nodes, edges, loading, error)}</>;
}
