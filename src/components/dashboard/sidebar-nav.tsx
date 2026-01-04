'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import Image from 'next/image'

const navItems = [
  {
    title: 'Dashboard',
    href: '/user',
    icon: '/icons/admin_content.svg',
  },
  {
    title: 'Investment Plans',
    href: '/user/plans',
    icon: '/icons/wallet.svg',
  },
  {
    title: 'Withdraw',
    href: '/user/withdraw',
    icon: '/icons/withdraw.svg',
  },
  {
    title: 'My Team',
    href: '/user/team',
    icon: '/icons/users.svg',
  },
  {
    title: 'Settings',
    href: '/user/settings',
    icon: '/icons/settings.svg',
  },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href
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

