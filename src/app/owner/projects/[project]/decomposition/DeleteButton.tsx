import React, { useEffect } from "react";
import { useLog } from "./LogOverlay";

export function DeleteButton({
    onDelete,
    disabled,
}: {
    onDelete: () => void;
    disabled?: boolean;
}) {
    const { addLog } = useLog();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (disabled) return;
            if (e.key === "Delete") {
                onDelete();
                addLog("刪除動作");
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onDelete, disabled, addLog]);

    return null;
}
