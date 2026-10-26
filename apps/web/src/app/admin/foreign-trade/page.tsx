'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { clsx } from 'clsx'
import { api } from '@/lib/api'
import type { TradeDashboardData, TradeShipmentStatus } from '@web3-mall/shared'
import { TRADE_SHIPMENT_STATUS_LABELS } from '@web3-mall/shared'
import { AdminPageHeader } from '@/components/admin-page-header'
import { LoadingSpinner } from '@/components/loading-spinner'
import { card, cardFlat, link } from '@/components/ui/stitch'

const STAT_CARDS = [
  { label: '进行中批次', key: 'activeShipments' as const, href: '/admin/foreign-trade/shipments', icon: '🚢' },
  { label: '海运在途', key: 'inTransit' as const, href: '/admin/foreign-trade/shipments?status=in_transit', icon: '🌊' },
  { label: '清关待办', key: 'customsPending' as const, href: '/admin/foreign-trade/shipments?status=customs_clearing', icon: '🛃' },
  { label: '海外仓库存', key: 'warehouseStock' as const, href: '/admin/foreign-trade/inventory', icon: '📦' },
  { label: '待履约订单', key: 'pendingFulfillment' as const, href: '/admin/foreign-trade/fulfillment', icon: '📋' },
  { label: '服务商', key: 'partnersCount' as const, href: '/admin/foreign-trade/partners', icon: '🤝' },
]

const PIPELINE_ORDER: TradeShipmentStatus[] = [
  'planning', 'procuring', 'ready_export', 'in_transit', 'at_port',
  'customs_clearing', 'customs_cleared', 'to_warehouse', 'warehouse_received',
  'shelved', 'selling', 'completed',
]

export default function ForeignTradeDashboardPage() {
  const [data, setData] = useState<TradeDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.admin.foreignTrade.dashboard().then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner className="py-12" />

  const pipelineMap = new Map(data?.pipeline.map((p) => [p.status, p.count]) ?? [])

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="外贸运营"
        subtitle="中国 → 巴西海运 → 圣保罗海外仓 → 亚马逊/美客多"
        action={
          <Link href="/admin/foreign-trade/shipments" className={link}>
            + 新建批次
          </Link>
        }
      />

      {/* 新手流程 + 成本估算 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/foreign-trade/guide"
          className={clsx(card, 'border-secondary/30 bg-secondary/5 p-5 transition-opacity hover:opacity-95')}
        >
          <p className="text-sm font-semibold text-secondary">🧭 新手流程向导</p>
          <p className="mt-1 text-sm text-on-surface-variant">清关 → 入仓 → 上架，逐步跟着做</p>
        </Link>
        <Link
          href="/admin/foreign-trade/cost"
          className={clsx(card, 'border-secondary/30 bg-secondary/5 p-5 transition-opacity hover:opacity-95')}
        >
          <p className="text-sm font-semibold text-secondary">💰 成本估算</p>
          <p className="mt-1 text-sm text-on-surface-variant">进口税、海运、入仓成本与毛利测算</p>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {STAT_CARDS.map((item) => (
          <Link key={item.key} href={item.href} className={clsx(card, 'p-4 transition-opacity hover:opacity-95')}>
            <span className="text-xl">{item.icon}</span>
            <p className="mt-2 text-2xl font-bold text-on-surface">{data?.[item.key] ?? 0}</p>
            <p className="text-sm text-on-surface-variant">{item.label}</p>
          </Link>
        ))}
      </div>

      <div className={card + ' p-6'}>
        <h2 className="text-lg font-semibold text-on-surface">全流程管道</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {PIPELINE_ORDER.map((status) => {
            const count = pipelineMap.get(status) ?? 0
            return (
              <Link
                key={status}
                href={`/admin/foreign-trade/shipments?status=${status}`}
                className={clsx(
                  'rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                  count > 0 ? 'bg-secondary/15 text-secondary' : 'bg-surface-container-high text-on-surface-variant',
                )}
              >
                {TRADE_SHIPMENT_STATUS_LABELS[status]} ({count})
              </Link>
            )
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={card + ' p-6'}>
          <h2 className="text-lg font-semibold text-on-surface">最近批次</h2>
          <div className="mt-4 space-y-3">
            {(data?.recentShipments ?? []).length === 0 ? (
              <p className="text-sm text-on-surface-variant">暂无批次，点击「新建批次」开始</p>
            ) : (
              data?.recentShipments.map((s) => (
                <Link
                  key={s.id}
                  href={`/admin/foreign-trade/shipments/${s.id}`}
                  className={clsx(cardFlat, 'block p-3 hover:bg-surface-container-high')}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-on-surface">{s.title}</span>
                    <span className="text-xs text-on-surface-variant">{s.shipmentNo}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-on-surface-variant">
                    <span>{TRADE_SHIPMENT_STATUS_LABELS[s.status as TradeShipmentStatus]}</span>
                    <span>任务 {s.taskProgress.done}/{s.taskProgress.total}</span>
                    <span>{s.totalQuantity} 副</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className={card + ' p-6'}>
          <h2 className="text-lg font-semibold text-on-surface">逾期任务</h2>
          <div className="mt-4 space-y-3">
            {(data?.overdueTasks ?? []).length === 0 ? (
              <p className="text-sm text-on-surface-variant">暂无逾期任务</p>
            ) : (
              data?.overdueTasks.map((t) => (
                <div key={t.id} className={cardFlat + ' p-3'}>
                  <p className="text-sm font-medium text-on-surface">{t.title}</p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {t.shipmentTitle} · {t.shipmentNo}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
