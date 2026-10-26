'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { clsx } from 'clsx'
import { api } from '@/lib/api'
import type { AdminDashboardData } from '@web3-mall/shared'
import { AdminPageHeader } from '@/components/admin-page-header'
import { LoadingSpinner } from '@/components/loading-spinner'
import { card, cardFlat } from '@/components/ui/stitch'

const STAT_CARDS = [
  { label: '商品总数', key: 'totalProducts' as const, icon: '📦', tint: 'bg-surface-container-high text-secondary', href: '/admin/products' },
  { label: '总订单数', key: 'totalOrders' as const, icon: '📋', tint: 'bg-green-50 text-green-800', href: '/admin/orders' },
  { label: '注册用户', key: 'totalUsers' as const, icon: '👤', tint: 'bg-indigo-50 text-indigo-800', href: '#' },
  { label: '待发货', key: 'pendingOrders' as const, icon: '🚚', tint: 'bg-amber-50 text-amber-800', href: '/admin/orders' },
  { label: '低库存商品', key: 'lowStockItems' as const, icon: '⚠️', tint: 'bg-red-50 text-error', href: '/admin/products' },
]

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.admin.dashboard().then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner className="py-12" />

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="管理概览"
        subtitle={`欢迎回来，今天是 ${new Date().toLocaleDateString('zh-CN')}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {STAT_CARDS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={clsx(card, 'p-5 transition-opacity hover:opacity-95')}
          >
            <div
              className={clsx(
                'inline-flex h-10 w-10 items-center justify-center text-lg',
                item.tint,
              )}
            >
              {item.icon}
            </div>
            <p className="mt-3 text-2xl font-bold text-on-surface">
              {data?.[item.key] ?? 0}
            </p>
            <p className="text-sm text-on-surface-variant">{item.label}</p>
          </Link>
        ))}
      </div>

      <div className={card + ' p-6'}>
        <h2 className="text-lg font-semibold text-on-surface">收益概览</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className={cardFlat + ' p-4'}>
            <p className="text-sm text-on-surface-variant">今日收益</p>
            <p className="mt-1 text-2xl font-bold text-on-surface">
              ¥{((data?.revenueToday ?? 0) / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className={cardFlat + ' p-4'}>
            <p className="text-sm text-on-surface-variant">本月收益</p>
            <p className="mt-1 text-2xl font-bold text-on-surface">
              ¥{((data?.revenueMonth ?? 0) / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
