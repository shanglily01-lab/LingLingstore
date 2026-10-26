'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { clsx } from 'clsx'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { PageShell } from '@/components/page-shell'
import { LoadingSpinner } from '@/components/loading-spinner'
import { btnPrimary, btnGhost, card, cardFlat, link, ORDER_STATUS_BADGE, price } from '@/components/ui/stitch'
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

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)

  const reload = () => api.getOrder(id).then(setOrder)

  useEffect(() => {
    if (!id) return
    reload()
      .catch(() => setOrder(null))
      .finally(() => setLoading(false))
  }, [id])

  const sym = order?.currency === 'CNY' ? '¥' : '$'

  const run = async (fn: () => Promise<unknown>, msg: string) => {
    setActing(true)
    try {
      await fn()
      toast.success(msg)
      await reload()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '操作失败')
    } finally {
      setActing(false)
    }
  }

  if (loading) return <LoadingSpinner />

  if (!order) {
    return (
      <PageShell narrow className="pt-16 text-center">
        <p className="text-on-surface-variant">订单不存在</p>
        <Link href="/orders" className={link + ' mt-4 inline-block'}>
          返回订单列表
        </Link>
      </PageShell>
    )
  }

  const snapshot = order.shippingAddressSnapshot as Record<string, string> | undefined

  return (
    <PageShell className="max-w-3xl">
      <Link href="/orders" className="text-sm text-on-surface-variant hover:text-secondary">
        ← 返回订单列表
      </Link>

      <div className={`${card} mt-6 p-6`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-on-surface">订单详情</h1>
            <p className="mt-1 font-mono text-sm text-on-surface-variant">{order.orderNo}</p>
          </div>
          <span
            className={clsx(
              'inline-flex rounded-full px-3 py-1 text-sm font-medium',
              ORDER_STATUS_BADGE[order.status] || 'bg-surface-container text-on-surface-variant',
            )}
          >
            {STATUS_MAP[order.status] || order.status}
          </span>
        </div>

        <div className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <span className="text-on-surface-variant">创建时间</span>
            <p className="mt-1 font-medium text-on-surface">
              {new Date(order.createdAt).toLocaleString('zh-CN')}
            </p>
          </div>
          <div>
            <span className="text-on-surface-variant">支付方式</span>
            <p className="mt-1 font-medium text-on-surface">{order.paymentChannel || '-'}</p>
          </div>
          {order.trackingNo && (
            <div>
              <span className="text-on-surface-variant">运单号</span>
              <p className="mt-1 font-medium text-on-surface">{order.trackingNo}</p>
            </div>
          )}
        </div>

        {snapshot && (
          <div className="mt-4 rounded-lg bg-surface-container-low p-4 text-sm">
            <p className="font-medium text-on-surface">收货信息</p>
            <p className="mt-1 text-on-surface-variant">
              {snapshot.recipientName} {snapshot.phone}
            </p>
            <p className="text-on-surface-variant">
              {[snapshot.stateProvince, snapshot.city, snapshot.district, snapshot.streetAddress]
                .filter(Boolean)
                .join(' ')}
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          {order.status === 'pending' && (
            <button
              type="button"
              disabled={acting}
              className={btnPrimary + ' px-4 py-2 text-sm'}
              onClick={() => router.push(`/orders/${id}/pay`)}
            >
              去支付
            </button>
          )}
          {order.status === 'pending' && (
            <button
              type="button"
              disabled={acting}
              className={btnGhost + ' text-sm'}
              onClick={() => run(() => api.cancelOrder(id), '订单已取消')}
            >
              取消订单
            </button>
          )}
          {order.status === 'shipped' && (
            <button
              type="button"
              disabled={acting}
              className={btnPrimary + ' px-4 py-2 text-sm'}
              onClick={() => run(() => api.confirmOrder(id), '已确认收货')}
            >
              确认收货
            </button>
          )}
          {['paid', 'shipped', 'completed'].includes(order.status) && (
            <button
              type="button"
              disabled={acting}
              className={btnGhost + ' text-sm'}
              onClick={() => run(() => api.requestRefund(id, '用户申请退款'), '已提交退款申请')}
            >
              申请退款
            </button>
          )}
        </div>
      </div>

      {order.shipment?.events && order.shipment.events.length > 0 && (
        <div className={`${cardFlat} mt-6 overflow-hidden`}>
          <h2 className="border-b border-outline-variant/20 bg-surface-container-low px-6 py-3 font-medium text-on-surface">
            物流跟踪
          </h2>
          <ul className="divide-y divide-outline-variant/10 px-6 py-4">
            {order.shipment.events.map((ev, i) => (
              <li key={i} className="py-3 text-sm">
                <p className="text-on-surface">{ev.description}</p>
                <p className="text-xs text-on-surface-variant">
                  {new Date(ev.time).toLocaleString('zh-CN')}
                  {ev.location ? ` · ${ev.location}` : ''}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={`${cardFlat} mt-6 overflow-hidden`}>
        <h2 className="border-b border-outline-variant/20 bg-surface-container-low px-6 py-3 font-medium text-on-surface">
          商品清单
        </h2>
        <div className="divide-y divide-outline-variant/10">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="font-medium text-on-surface">{item.productName}</p>
                <p className="text-xs text-on-surface-variant">
                  {item.sku} × {item.quantity}
                </p>
              </div>
              <p className="font-medium text-on-surface">
                {sym}
                {(item.subtotal / 100).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-outline-variant/20 bg-surface-container-low px-6 py-4">
          <span className="font-medium text-on-surface">合计</span>
          <span className={`text-xl ${price}`}>
            {sym}
            {(order.totalAmount / 100).toFixed(2)}
          </span>
        </div>
      </div>
    </PageShell>
  )
}
