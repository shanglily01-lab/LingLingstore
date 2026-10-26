'use client'

import { useEffect, useState, useCallback } from 'react'
import { clsx } from 'clsx'
import { api } from '@/lib/api'
import type { AdminOrderListItem } from '@web3-mall/shared'
import toast from 'react-hot-toast'
import { AdminPageHeader } from '@/components/admin-page-header'
import { LoadingSpinner } from '@/components/loading-spinner'
import {
  btnGhost,
  btnPrimary,
  btnSecondary,
  card,
  cardFlat,
  input,
  link,
  ORDER_STATUS_BADGE,
  select,
  tableHead,
  tableRow,
} from '@/components/ui/stitch'

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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [regionFilter, setRegionFilter] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Record<string, unknown> | null>(null)
  const [showShip, setShowShip] = useState(false)
  const [trackingNo, setTrackingNo] = useState('')
  const [carrier, setCarrier] = useState('')

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.admin.orders.list(page, {
        status: statusFilter || undefined,
        region: regionFilter || undefined,
      })
      setOrders(res.items)
      setTotal(res.total)
    } catch {
      toast.error('加载订单列表失败')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, regionFilter])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const totalPages = Math.ceil(total / 20)

  const viewDetail = async (id: string) => {
    try {
      const detail = await api.admin.orders.get(id)
      setSelectedOrder(detail as Record<string, unknown>)
    } catch {
      toast.error('加载订单详情失败')
    }
  }

  const handleShip = async (orderId: string) => {
    if (!trackingNo || !carrier) {
      toast.error('请填写运单号和物流商')
      return
    }
    try {
      await api.admin.orders.ship(orderId, { trackingNo, carrier })
      toast.success('发货成功')
      setShowShip(false)
      setTrackingNo('')
      setCarrier('')
      setSelectedOrder(null)
      fetchOrders()
    } catch {
      toast.error('发货失败')
    }
  }

  const handleRefund = async (orderId: string) => {
    if (!confirm('确定要对这笔订单发起退款吗？')) return
    try {
      await api.admin.orders.refund(orderId)
      toast.success('退款申请已提交')
      setSelectedOrder(null)
      fetchOrders()
    } catch {
      toast.error('退款失败')
    }
  }

  const orderStatus = selectedOrder?.status as string | undefined
  const orderItems = selectedOrder?.items as Array<{
    id: string
    productName: string
    sku: string
    quantity: number
    subtotal: number
  }> | undefined

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="订单管理"
        badge={
          <span className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-medium text-on-surface-variant">
            共 {total} 单
          </span>
        }
      />

      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPage(1)
          }}
          className={select}
        >
          <option value="">全部状态</option>
          {Object.entries(STATUS_MAP).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select
          value={regionFilter}
          onChange={(e) => {
            setRegionFilter(e.target.value)
            setPage(1)
          }}
          className={select}
        >
          <option value="">全部站点</option>
          <option value="CN">国内站</option>
          <option value="OVERSEAS">海外站</option>
        </select>
      </div>

      <div className={`${cardFlat} overflow-hidden`}>
        {loading ? (
          <LoadingSpinner className="py-12" />
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant">暂无订单</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className={tableHead}>
                <th className="px-4 py-3">订单号</th>
                <th className="px-4 py-3">用户</th>
                <th className="px-4 py-3">站点</th>
                <th className="px-4 py-3">金额</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3">时间</th>
                <th className="px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {orders.map((o) => (
                <tr key={o.id} className={tableRow}>
                  <td className="px-4 py-3 font-mono text-sm text-on-surface">{o.orderNo}</td>
                  <td className="px-4 py-3 text-sm text-on-surface-variant">{o.userName || '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    {o.region === 'CN' ? '🇨🇳 国内' : '🌍 海外'}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-on-surface">
                    {o.currency === 'CNY' ? '¥' : '$'}
                    {(o.totalAmount / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={clsx(
                        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                        ORDER_STATUS_BADGE[o.status] || 'bg-surface-container text-on-surface-variant',
                      )}
                    >
                      {STATUS_MAP[o.status] || o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-on-surface-variant">
                    {new Date(o.createdAt).toLocaleString('zh-CN')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => viewDetail(o.id)}
                      className={link + ' text-xs font-medium'}
                    >
                      详情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className={btnGhost}
          >
            上一页
          </button>
          <span className="text-sm text-on-surface-variant">
            第 {page} / {totalPages} 页 (共 {total} 单)
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className={btnGhost}
          >
            下一页
          </button>
        </div>
      )}

      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 p-4"
          onClick={() => setSelectedOrder(null)}
          role="presentation"
        >
          <div
            className={card + ' max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6'}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-on-surface">订单详情</h2>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-on-surface-variant">订单号：</span>
                  <span className="font-mono">{String(selectedOrder.orderNo)}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant">状态：</span>
                  <span
                    className={clsx(
                      'ml-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                      ORDER_STATUS_BADGE[orderStatus || ''] ||
                        'bg-surface-container text-on-surface-variant',
                    )}
                  >
                    {STATUS_MAP[orderStatus || ''] || orderStatus}
                  </span>
                </div>
                <div>
                  <span className="text-on-surface-variant">用户：</span>
                  {String(
                    (selectedOrder.user as { displayName?: string; phone?: string; email?: string })
                      ?.displayName ||
                      (selectedOrder.user as { phone?: string })?.phone ||
                      (selectedOrder.user as { email?: string })?.email ||
                      '-',
                  )}
                </div>
                <div>
                  <span className="text-on-surface-variant">站点：</span>
                  {selectedOrder.region === 'CN' ? '国内站' : '海外站'}
                </div>
                <div>
                  <span className="text-on-surface-variant">金额：</span>¥
                  {((selectedOrder.totalAmount as number) / 100).toFixed(2)}
                </div>
                <div>
                  <span className="text-on-surface-variant">创建时间：</span>
                  {new Date(selectedOrder.createdAt as string).toLocaleString('zh-CN')}
                </div>
                {selectedOrder.trackingNo ? (
                  <div>
                    <span className="text-on-surface-variant">运单号：</span>
                    {String(selectedOrder.trackingNo)}
                  </div>
                ) : null}
                {selectedOrder.paymentChannel ? (
                  <div>
                    <span className="text-on-surface-variant">支付方式：</span>
                    {String(selectedOrder.paymentChannel)}
                  </div>
                ) : null}
              </div>

              {orderItems && orderItems.length > 0 && (
                <div className="mt-3 border-t border-outline-variant/20 pt-3">
                  <h3 className="mb-2 text-sm font-semibold text-on-surface">商品列表</h3>
                  {orderItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between border-b border-outline-variant/10 py-2 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-on-surface">{item.productName}</p>
                        <p className="text-xs text-on-surface-variant">
                          {item.sku} x{item.quantity}
                        </p>
                      </div>
                      <span className="text-sm font-medium">
                        ¥{(item.subtotal / 100).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-outline-variant/20 pt-4">
                {orderStatus === 'paid' && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowShip(true)
                      setTrackingNo('')
                      setCarrier('')
                    }}
                    className={btnPrimary}
                  >
                    发货
                  </button>
                )}
                {(orderStatus === 'paid' || orderStatus === 'shipped') && (
                  <button
                    type="button"
                    onClick={() => handleRefund(String(selectedOrder.id))}
                    className={btnSecondary + ' border-error text-error hover:bg-red-50'}
                  >
                    退款
                  </button>
                )}
              </div>

              {showShip && (
                <div className="border-t border-outline-variant/20 pt-4">
                  <h3 className="mb-3 text-sm font-semibold text-on-surface">发货信息</h3>
                  <div className="flex flex-wrap gap-3">
                    <input
                      type="text"
                      placeholder="运单号"
                      value={trackingNo}
                      onChange={(e) => setTrackingNo(e.target.value)}
                      className={input + ' mt-0 flex-1 min-w-[120px]'}
                    />
                    <input
                      type="text"
                      placeholder="物流商"
                      value={carrier}
                      onChange={(e) => setCarrier(e.target.value)}
                      className={input + ' mt-0 w-32'}
                    />
                    <button
                      type="button"
                      onClick={() => handleShip(String(selectedOrder.id))}
                      className={btnPrimary}
                    >
                      确认发货
                    </button>
                    <button type="button" onClick={() => setShowShip(false)} className={btnGhost}>
                      取消
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
