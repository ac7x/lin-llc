import Link from 'next/link'

export function DevNav() {
    return (
        <div className="fixed top-0 left-0 right-0 bg-gray-800 text-white p-2 z-50 flex gap-4 justify-center text-sm">
            {/* 按照職級排序 */}
            <Link href="/owner" className="hover:text-blue-300 transition-colors">
                擁有者
            </Link>
            <Link href="/admin" className="hover:text-blue-300 transition-colors">
                管理
            </Link>
            <Link href="/finance" className="hover:text-blue-300 transition-colors">
                財務
            </Link>
            <Link href="/safety" className="hover:text-blue-300 transition-colors">
                安全
            </Link>
            <Link href="/vendor" className="hover:text-blue-300 transition-colors">
                廠商
            </Link>
            <Link href="/user" className="hover:text-blue-300 transition-colors">
                使用者
            </Link>
            <Link href="/shared/signin" className="hover:text-blue-300 transition-colors">
                登
            </Link>
        </div>
    )
}
