'use client'

import { useCallback, useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { clsx } from 'clsx'
import { api } from '@/lib/api'
import type { TradeShipmentListItem, TradeShipmentStatus } from '@web3-mall/shared'
import { TRADE_SHIPMENT_STATUS_LABELS } from '@web3-mall/shared'
import { AdminPageHeader } from '@/components/admin-page-header'
import { LoadingSpinner } from '@/components/loading-spinner'
import toast from 'react-hot-toast'
import {
  btnPrimary,
  btnSecondary,
  card,
  input,
  link,
  select,
  tableHead,
  tableRow,
} from '@/components/ui/stitch'

function ShipmentsContent() {
  const searchParams = useSearchParams()
  const statusFilter = searchParams.get('status') ?? ''
  const [items, setItems] = useState<TradeShipmentListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [creating, setCreating] = useState(false)

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.admin.foreignTrade.shipments.list(page, {
        status: statusFilter || undefined,
      })
      setItems(res.items)
      setTotal(res.total)
    } catch {
      toast.error('加载批次失败')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error('请输入批次名称')
      return
    }
    setCreating(true)
    try {
      const s = await api.admin.foreignTrade.shipments.create({
        title: title.trim(),
        seedDefaultTasks: true,
      })
      toast.success('批次已创建')
      setShowCreate(false)
      setTitle('')
      window.location.href = `/admin/foreign-trade/shipments/${s.id}`
    } catch {
      toast.error('创建失败')
    } finally {
      setCreating(false)
    }
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="货运批次"
        subtitle="管理从中国到巴西的头程海运批次"
        action={
          <button type="button" className={btnPrimary} onClick={() => setShowCreate(true)}>
            + 新建批次
          </button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <select
          className={select}
          value={statusFilter}
          onChange={(e) => {
            const v = e.target.value
            window.location.href = v
              ? `/admin/foreign-trade/shipments?status=${v}`
              : '/admin/foreign-trade/shipments'
          }}
        >
          <option value="">全部状态</option>
          {Object.entries(TRADE_SHIPMENT_STATUS_LABELS).map(([k, label]) => (
            <option key={k} value={k}>{label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner className="py-12" />
      ) : (
        <div className={card + ' overflow-x-auto'}>
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className={tableHead}>
              <tr>
                <th className="px-4 py-3">批次号</th>
                <th className="px-4 py-3">名称</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3">目的地</th>
                <th className="px-4 py-3">数量</th>
                <th className="px-4 py-3">任务进度</th>
                <th className="px-4 py-3">创建时间</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id} className={tableRow}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/foreign-trade/shipments/${s.id}`} className={link}>
                      {s.shipmentNo}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{s.title}</td>
                  <td className="px-4 py-3">
                    {TRADE_SHIPMENT_STATUS_LABELS[s.status as TradeShipmentStatus]}
                  </td>
                  <td className="px-4 py-3">{s.destinationCity ?? '—'}</td>
                  <td className="px-4 py-3">{s.totalQuantity}</td>
                  <td className="px-4 py-3">
                    {s.taskProgress.done}/{s.taskProgress.total}
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {new Date(s.createdAt).toLocaleDateString('zh-CN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <button type="button" className={btnSecondary} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            上一页
          </button>
          <span className="text-sm text-on-surface-variant">{page} / {totalPages}</span>
          <button type="button" className={btnSecondary} disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            下一页
          </button>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className={card + ' w-full max-w-md p-6'}>
            <h3 className="text-lg font-semibold">新建货运批次</h3>
            <p className="mt-1 text-sm text-on-surface-variant">
              将自动创建 24 项标准任务清单（筹备→采购→出口→海运→清关→海外仓→销售→履约）
            </p>
            <input
              className={input + ' mt-4 w-full'}
              placeholder="例如：2026-Q2 扑克牌首单"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className={btnSecondary} onClick={() => setShowCreate(false)}>取消</button>
              <button type="button" className={btnPrimary} disabled={creating} onClick={handleCreate}>
                {creating ? '创建中…' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ShipmentsPage() {
  return (
    <Suspense fallback={<LoadingSpinner className="py-12" />}>
      <ShipmentsContent />
    </Suspense>
  )
}
