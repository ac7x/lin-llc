'use client'

import { HomeIcon, CalendarIcon, BellIcon, UserIcon } from '@heroicons/react/24/outline'
import { SparklesIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'

const UserNav = () => {
  const pathname = usePathname()

  const navItems = useMemo(() => [
    {
      name: '首頁',
      href: '/user',
      icon: HomeIcon,
      current: pathname === '/user'
    },
    {
      name: '行事曆',
      href: '/user/calendar',
      icon: CalendarIcon,
      current: pathname === '/user/calendar'
    },
    {
      name: 'Gemini',
      href: '/user/gemini',
      icon: SparklesIcon,
      current: pathname === '/user/gemini'
    },
    {
      name: '通知',
      href: '/user/notifications',
      icon: BellIcon,
      current: pathname === '/user/notifications'
    },
    {
      name: '個人資料',
      href: '/shared/signin',
      icon: UserIcon,
      current: pathname === '/shared/signin'
    }
  ], [pathname])

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center p-3 text-sm ${
                item.current
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-blue-600'
              }`}
            >
              <item.icon className="h-6 w-6" aria-hidden="true" />
              <span className="mt-1">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}

export default UserNav