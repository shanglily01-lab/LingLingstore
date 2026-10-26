'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { LayoutDashboard, Package, FolderTree, ClipboardList, Globe2 } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/admin', label: '概览', Icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: '商品', Icon: Package },
  { href: '/admin/categories', label: '分类', Icon: FolderTree },
  { href: '/admin/orders', label: '订单', Icon: ClipboardList },
  { href: '/admin/foreign-trade', label: '外贸', Icon: Globe2 },
]

export function AdminMobileNav() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-outline-variant/20 bg-primary-container px-2 py-2 lg:hidden">
      {NAV_ITEMS.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href)
        const Icon = item.Icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium',
              isActive ? 'bg-secondary text-white' : 'text-on-primary-container',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
