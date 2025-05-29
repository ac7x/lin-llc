import { ReactNode, useEffect, useState } from "react";
import { delay } from "@/utils/delay";

export default function ProjectPage({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    delay(1000).then(() => setReady(true));
  }, []);

  if (!ready) return <div className="p-8 text-gray-500">載入中...</div>;
  return <>{children}</>;
}