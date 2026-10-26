'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { LayoutDashboard, Package, FolderTree, ClipboardList, Globe2 } from 'lucide-react'
import { BRAND_NAME } from '@/lib/brand'

const NAV_ITEMS = [
  { href: '/admin', label: '概览', Icon: LayoutDashboard },
  { href: '/admin/products', label: '商品管理', Icon: Package },
  { href: '/admin/categories', label: '分类管理', Icon: FolderTree },
  { href: '/admin/orders', label: '订单管理', Icon: ClipboardList },
  { href: '/admin/foreign-trade', label: '外贸运营', Icon: Globe2 },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-60 shrink-0 border-r border-outline-variant/20 bg-primary-container lg:block">
      <div className="px-4 py-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-on-primary-container">
          管理后台
        </p>
        <p className="mt-1 text-lg font-bold text-white">{BRAND_NAME}</p>
        <nav className="mt-8 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
            const Icon = item.Icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-secondary text-white'
                    : 'text-on-primary-container hover:bg-white/10 hover:text-white',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
