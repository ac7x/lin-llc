import Link from 'next/link'

export function DevNav() {
    return (
        <div className="fixed top-0 left-0 right-0 bg-gray-800 text-white p-2 z-50 flex gap-4 justify-center text-sm">
            <Link href="/admin" className="hover:text-blue-300 transition-colors">
                管理介面
            </Link>
            <Link href="/finance" className="hover:text-blue-300 transition-colors">
                財務介面
            </Link>
            <Link href="/owner" className="hover:text-blue-300 transition-colors">
                擁有者介面
            </Link>
            <Link href="/user" className="hover:text-blue-300 transition-colors">
                使用者介面
            </Link>
        </div>
    )
}
