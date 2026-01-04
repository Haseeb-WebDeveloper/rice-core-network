'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import Image from 'next/image'

const adminNavItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: '/icons/admin_content.svg',
  },
  {
    title: 'Investments',
    href: '/admin/investments',
    icon: '/icons/wallet.svg',
  },
  {
    title: 'Withdrawals',
    href: '/admin/withdrawals',
    icon: '/icons/withdraw.svg',
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: '/icons/users.svg',
  },
  {
    title: 'Investment Plans',
    href: '/admin/plans',
    icon: '/icons/wallet.svg',
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: '/icons/settings.svg',
  },
]

export function AdminSidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="space-y-1">
      {adminNavItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Image
              src={item.icon}
              alt={item.title}
              width={16}
              height={16}
              className="shrink-0"
            />
            <span>{item.title}</span>
          </Link>
        )
      })}
    </nav>
  )
}

