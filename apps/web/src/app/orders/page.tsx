'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { PageShell } from '@/components/page-shell'
import { EmptyState } from '@/components/empty-state'
import { LoadingSpinner } from '@/components/loading-spinner'
import { btnPrimary, btnGhost, card, ORDER_STATUS_BADGE } from '@/components/ui/stitch'
import type { OrderData } from '@web3-mall/shared'

const STATUS_MAP: Record<string, string> = {
  pending: '待支付',
  paid: '已支付',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消',
  expired: '已过期',
  refund_pending: '退款中',
  refunded: '已退款',
}

const TABS = [
  { value: '', label: '全部' },
  { value: 'pending', label: '待支付' },
  { value: 'paid', label: '待发货' },
  { value: 'shipped', label: '待收货' },
  { value: 'completed', label: '已完成' },
]

export default function OrdersPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [orders, setOrders] = useState<OrderData[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    setLoading(true)
    api
      .getOrders(1, statusFilter || undefined)
      .then((res) => setOrders(res.items))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [user, statusFilter])

  if (!user) {
    return (
      <PageShell narrow className="pt-16">
        <EmptyState message="请先登录查看订单" action={{ href: '/login', label: '去登录' }} />
      </PageShell>
    )
  }

  return (
    <PageShell className="max-w-3xl">
      <h1 className="text-2xl font-bold text-on-surface">我的订单</h1>

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatusFilter(tab.value)}
            className={clsx(
              'rounded-full px-4 py-1.5 text-sm transition-colors',
              statusFilter === tab.value
                ? 'bg-on-surface text-white'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : orders.length === 0 ? (
        <EmptyState className="mt-12" message="暂无订单" action={{ href: '/products', label: '去逛逛' }} />
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <div key={order.id} className={`${card} p-5`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-sm text-on-surface-variant">{order.orderNo}</p>
                <span
                  className={clsx(
                    'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                    ORDER_STATUS_BADGE[order.status] || 'bg-surface-container text-on-surface-variant',
                  )}
                >
                  {STATUS_MAP[order.status] || order.status}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-outline-variant/20 pt-4">
                <span className="text-lg font-bold text-on-surface">
                  {order.currency === 'CNY' ? '¥' : '$'}
                  {(order.totalAmount / 100).toFixed(2)}
                </span>
                <div className="flex gap-2">
                  {order.status === 'pending' && (
                    <button
                      type="button"
                      className={btnPrimary + ' px-4 py-2 text-xs'}
                      onClick={() => router.push(`/orders/${order.id}/pay`)}
                    >
                      去支付
                    </button>
                  )}
                  <Link href={`/orders/${order.id}`} className={btnGhost + ' text-xs'}>
                    查看详情
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  )
}
