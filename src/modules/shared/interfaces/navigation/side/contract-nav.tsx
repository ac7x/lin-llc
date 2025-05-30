// src/modules/contract/interfaces/navigation/side/contract-nav.tsx

import Link from "next/link";

export default function ContractNav() {
    return (
        <nav className="w-64 min-h-screen bg-gray-100 p-4">
            <h2 className="text-lg font-bold mb-4">合約管理</h2>
            <ul className="space-y-2">
                <li>
                    <Link href="/owner/contracts" className="text-blue-600 hover:underline">
                        合約總表
                    </Link>
                </li>
                <li>
                    <Link href="/owner/contracts/add" className="text-blue-600 hover:underline">
                        建立合約
                    </Link>
                </li>
            </ul>
        </nav>
    );
}
