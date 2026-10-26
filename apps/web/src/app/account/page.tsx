'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { PageShell } from '@/components/page-shell'
import { EmptyState } from '@/components/empty-state'
import { card, btnGhost } from '@/components/ui/stitch'

const LINKS = [
  { href: '/orders', label: '我的订单', desc: '查看全部订单与物流' },
  { href: '/account/addresses', label: '收货地址', desc: '管理默认收货地址' },
  { href: '/cart', label: '购物车', desc: '待结算商品' },
]

export default function AccountPage() {
  const { user, loading } = useAuth()

  if (loading) return null

  if (!user) {
    return (
      <PageShell narrow>
        <EmptyState message="请先登录" action={{ href: '/login', label: '去登录' }} />
      </PageShell>
    )
  }

  return (
    <PageShell className="max-w-2xl">
      <h1 className="text-2xl font-bold text-on-surface">个人中心</h1>
      <div className={`${card} mt-6 p-6`}>
        <p className="font-medium text-on-surface">{user.displayName || user.phone || user.email}</p>
        <p className="mt-1 text-sm text-on-surface-variant">
          区域：{user.region === 'CN' ? '国内站' : '海外站'}
          {user.role === 'admin' && ' · 管理员'}
        </p>
      </div>
      <ul className="mt-6 space-y-3">
        {LINKS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`${card} block p-4 transition-colors hover:bg-surface-container-low`}
            >
              <p className="font-medium text-on-surface">{item.label}</p>
              <p className="text-sm text-on-surface-variant">{item.desc}</p>
            </Link>
          </li>
        ))}
        {user.role === 'admin' && (
          <li>
            <Link href="/admin" className={btnGhost + ' block w-full py-3 text-center'}>
              进入管理后台
            </Link>
          </li>
        )}
      </ul>
    </PageShell>
  )
}
