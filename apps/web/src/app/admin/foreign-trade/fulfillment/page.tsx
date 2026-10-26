'use client'

import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { TradeFulfillmentOrderData, TradePlatform } from '@web3-mall/shared'
import { TRADE_PLATFORM_LABELS } from '@web3-mall/shared'
import { AdminPageHeader } from '@/components/admin-page-header'
import { LoadingSpinner } from '@/components/loading-spinner'
import toast from 'react-hot-toast'
import {
  btnPrimary,
  btnSecondary,
  card,
  input,
  select,
  tableHead,
  tableRow,
} from '@/components/ui/stitch'

const STATUS_LABELS: Record<string, string> = {
  pending: '待推仓',
  pushed_to_warehouse: '已推仓',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消',
}

export default function FulfillmentPage() {
  const [items, setItems] = useState<TradeFulfillmentOrderData[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [platform, setPlatform] = useState<TradePlatform>('amazon_br')
  const [sku, setSku] = useState('')
  const [qty, setQty] = useState('1')
  const [recipient, setRecipient] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.admin.foreignTrade.fulfillment.list()
      setItems(res.items)
    } catch {
      toast.error('加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const createOrder = async () => {
    if (!sku.trim()) {
      toast.error('请填写 SKU')
      return
    }
    try {
      await api.admin.foreignTrade.fulfillment.create({
        platform,
        recipientName: recipient || undefined,
        lines: [{ sku: sku.trim(), quantity: Number(qty) || 1 }],
      })
      toast.success('履约单已创建')
      setShowCreate(false)
      reload()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '创建失败')
    }
  }

  const updateStatus = async (id: string, status: string, extra?: { trackingNo?: string; carrier?: string }) => {
    try {
      await api.admin.foreignTrade.fulfillment.update(id, { status, ...extra })
      toast.success('已更新')
      reload()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '更新失败')
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="订单履约"
        subtitle="平台订单 → 海外仓出库 → 本地快递"
        action={
          <button type="button" className={btnPrimary} onClick={() => setShowCreate(true)}>
            + 新建履约单
          </button>
        }
      />

      {loading ? (
        <LoadingSpinner className="py-12" />
      ) : (
        <div className={card + ' overflow-x-auto'}>
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className={tableHead}>
              <tr>
                <th className="px-4 py-3">履约单号</th>
                <th className="px-4 py-3">平台</th>
                <th className="px-4 py-3">SKU / 数量</th>
                <th className="px-4 py-3">收件人</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3">运单号</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((o) => (
                <tr key={o.id} className={tableRow}>
                  <td className="px-4 py-3">{o.orderNo}</td>
                  <td className="px-4 py-3">{TRADE_PLATFORM_LABELS[o.platform]}</td>
                  <td className="px-4 py-3">
                    {o.lines.map((l) => `${l.sku}×${l.quantity}`).join(', ')}
                  </td>
                  <td className="px-4 py-3">{o.recipientName ?? '—'}</td>
                  <td className="px-4 py-3">{STATUS_LABELS[o.status] ?? o.status}</td>
                  <td className="px-4 py-3">{o.trackingNo ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {o.status === 'pending' && (
                        <button type="button" className={btnSecondary + ' text-xs px-2 py-1'} onClick={() => updateStatus(o.id, 'pushed_to_warehouse')}>
                          推仓
                        </button>
                      )}
                      {o.status === 'pushed_to_warehouse' && (
                        <button type="button" className={btnSecondary + ' text-xs px-2 py-1'} onClick={() => {
                          const trackingNo = prompt('运单号')
                          const carrier = prompt('承运商', 'Correios')
                          if (trackingNo) updateStatus(o.id, 'shipped', { trackingNo, carrier: carrier ?? undefined })
                        }}>
                          发货
                        </button>
                      )}
                      {o.status === 'shipped' && (
                        <button type="button" className={btnSecondary + ' text-xs px-2 py-1'} onClick={() => updateStatus(o.id, 'completed')}>
                          完成
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className={card + ' w-full max-w-md p-6'}>
            <h3 className="text-lg font-semibold">新建履约单</h3>
            <div className="mt-4 space-y-3">
              <select className={select + ' w-full'} value={platform} onChange={(e) => setPlatform(e.target.value as TradePlatform)}>
                {Object.entries(TRADE_PLATFORM_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <input className={input + ' w-full'} placeholder="SKU *" value={sku} onChange={(e) => setSku(e.target.value)} />
              <input className={input + ' w-full'} type="number" placeholder="数量" value={qty} onChange={(e) => setQty(e.target.value)} />
              <input className={input + ' w-full'} placeholder="收件人（可选）" value={recipient} onChange={(e) => setRecipient(e.target.value)} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className={btnSecondary} onClick={() => setShowCreate(false)}>取消</button>
              <button type="button" className={btnPrimary} onClick={createOrder}>创建</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
