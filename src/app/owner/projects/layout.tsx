import { ReactNode } from "react";
import Link from "next/link";

export default function ProjectsLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex">
            <nav className="w-48 p-4 border-r">
                <ul>
                    <li>
                        <Link href="/owner/projects" className="block py-2">專案列表</Link>
                    </li>
                    <li>
                        <Link href="/owner/projects/import" className="block py-2">從合約建立專案</Link>
                    </li>
                </ul>
            </nav>
            <div className="flex-1 p-4">{children}</div>
        </div>
    );
}