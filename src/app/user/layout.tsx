import UserNav from '@/components/bottom/user-nav'

interface UserLayoutProps {
  children: React.ReactNode
}

const UserLayout = ({ children }: UserLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="pb-16 dark:bg-gray-900">
        {children}
      </main>
      <UserNav />
    </div>
  )
}

export default UserLayout