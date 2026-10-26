'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'

const SUB_NAV = [
  { href: '/admin/foreign-trade/guide', label: '新手流程', exact: false },
  { href: '/admin/foreign-trade/cost', label: '成本估算', exact: false },
  { href: '/admin/foreign-trade', label: '概览', exact: true },
  { href: '/admin/foreign-trade/shipments', label: '货运批次' },
  { href: '/admin/foreign-trade/partners', label: '服务商' },
  { href: '/admin/foreign-trade/inventory', label: '海外仓库存' },
  { href: '/admin/foreign-trade/fulfillment', label: '订单履约' },
]

export default function ForeignTradeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-1 border-b border-outline-variant/20 pb-3">
        {SUB_NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                active ? 'bg-secondary text-white' : 'text-on-surface-variant hover:bg-surface-container-high',
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
      {children}
    </div>
  )
}
