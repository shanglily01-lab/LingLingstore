'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { clsx } from 'clsx'
import { api } from '@/lib/api'
import type { TradeShipmentDetail, TradeTaskStage, TradeTaskStatus } from '@web3-mall/shared'
import {
  TRADE_SHIPMENT_STATUS_LABELS,
  TRADE_TASK_STAGE_LABELS,
} from '@web3-mall/shared'
import { AdminPageHeader } from '@/components/admin-page-header'
import { LoadingSpinner } from '@/components/loading-spinner'
import toast from 'react-hot-toast'
import {
  btnPrimary,
  btnSecondary,
  card,
  cardFlat,
  input,
  link,
  select,
} from '@/components/ui/stitch'

const TASK_STATUS_LABELS: Record<TradeTaskStatus, string> = {
  pending: '待办',
  in_progress: '进行中',
  done: '已完成',
  blocked: '阻塞',
  skipped: '跳过',
}

const STAGE_ORDER: TradeTaskStage[] = [
  'prep', 'procurement', 'export', 'sea_freight', 'customs', 'warehouse', 'sales', 'fulfillment',
]

export default function ShipmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<TradeShipmentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [partners, setPartners] = useState<Awaited<ReturnType<typeof api.admin.foreignTrade.partners.list>>>([])

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const [s, p] = await Promise.all([
        api.admin.foreignTrade.shipments.get(id),
        api.admin.foreignTrade.partners.list(),
      ])
      setData(s)
      setPartners(p)
    } catch {
      toast.error('加载失败')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    reload()
  }, [reload])

  const advance = async () => {
    try {
      await api.admin.foreignTrade.shipments.advance(id)
      toast.success('状态已推进')
      reload()
    } catch {
      toast.error('无法推进状态')
    }
  }

  const toggleTask = async (taskId: string, current: TradeTaskStatus) => {
    const next = current === 'done' ? 'pending' : 'done'
    try {
      await api.admin.foreignTrade.tasks.update(taskId, { status: next })
      reload()
    } catch {
      toast.error('更新任务失败')
    }
  }

  const syncInventory = async () => {
    try {
      await api.admin.foreignTrade.shipments.syncInventory(id)
      toast.success('库存已同步到海外仓')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '同步失败')
    }
  }

  const savePartners = async (field: string, value: string) => {
    try {
      await api.admin.foreignTrade.shipments.update(id, { [field]: value || null })
      toast.success('已保存')
      reload()
    } catch {
      toast.error('保存失败')
    }
  }

  if (loading || !data) return <LoadingSpinner className="py-12" />

  const tasksByStage = STAGE_ORDER.map((stage) => ({
    stage,
    tasks: data.tasks.filter((t) => t.stage === stage),
  }))

  const doneCount = data.tasks.filter((t) => t.status === 'done' || t.status === 'skipped').length

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={data.title}
        subtitle={`${data.shipmentNo} · ${TRADE_SHIPMENT_STATUS_LABELS[data.status]}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/foreign-trade/shipments" className={btnSecondary}>← 返回列表</Link>
            <Link href={`/admin/foreign-trade/cost?shipmentId=${id}`} className={btnSecondary}>成本估算</Link>
            {data.status !== 'completed' && data.status !== 'cancelled' && (
              <button type="button" className={btnPrimary} onClick={advance}>推进到下一阶段</button>
            )}
            {['warehouse_received', 'shelved', 'selling', 'completed'].includes(data.status) && (
              <button type="button" className={btnSecondary} onClick={syncInventory}>同步库存到海外仓</button>
            )}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className={clsx(card, 'p-4 lg:col-span-2')}>
          <h3 className="font-semibold text-on-surface">物流信息</h3>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div><dt className="text-on-surface-variant">起运港</dt><dd>{data.portOfLoading ?? '—'}</dd></div>
            <div><dt className="text-on-surface-variant">目的港</dt><dd>{data.portOfDischarge ?? '—'}</dd></div>
            <div><dt className="text-on-surface-variant">目的地</dt><dd>{data.destinationCity ?? '—'}</dd></div>
            <div><dt className="text-on-surface-variant">NCM</dt><dd>{data.ncmCode ?? '—'}</dd></div>
            <div><dt className="text-on-surface-variant">柜号</dt><dd>{data.containerNo ?? '—'}</dd></div>
            <div><dt className="text-on-surface-variant">提单号</dt><dd>{data.blNo ?? '—'}</dd></div>
            <div><dt className="text-on-surface-variant">CIF (USD)</dt><dd>{data.cifValueUsd ?? '—'}</dd></div>
            <div><dt className="text-on-surface-variant">预计到港</dt><dd>{data.estimatedArrival ? new Date(data.estimatedArrival).toLocaleDateString('zh-CN') : '—'}</dd></div>
          </dl>
        </div>
        <div className={card + ' p-4'}>
          <h3 className="font-semibold text-on-surface">任务进度</h3>
          <p className="mt-2 text-3xl font-bold text-secondary">{doneCount}/{data.tasks.length}</p>
          <div className="mt-2 h-2 rounded-full bg-surface-container-high">
            <div
              className="h-2 rounded-full bg-secondary transition-all"
              style={{ width: `${data.tasks.length ? (doneCount / data.tasks.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      <div className={card + ' p-4'}>
        <h3 className="font-semibold text-on-surface">服务商</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            { label: '中国货代', field: 'freightForwarderId', type: 'freight_forwarder', current: data.freightForwarder },
            { label: '清关行', field: 'customsBrokerId', type: 'customs_broker', current: data.customsBroker },
            { label: '海外仓', field: 'warehouse3plId', type: 'warehouse_3pl', current: data.warehouse3pl },
          ].map((item) => (
            <div key={item.field}>
              <label className="text-xs text-on-surface-variant">{item.label}</label>
              <select
                className={select + ' mt-1 w-full'}
                value={item.current?.id ?? ''}
                onChange={(e) => savePartners(item.field, e.target.value)}
              >
                <option value="">未指定</option>
                {partners.filter((p) => p.type === item.type).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className={card + ' p-4'}>
        <h3 className="font-semibold text-on-surface">SKU 明细</h3>
        {data.lines.length === 0 ? (
          <p className="mt-2 text-sm text-on-surface-variant">暂无 SKU，可在 API 或后续版本中添加</p>
        ) : (
          <table className="mt-3 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-outline-variant/20 text-on-surface-variant">
                <th className="py-2">SKU</th>
                <th className="py-2">品名</th>
                <th className="py-2">EAN</th>
                <th className="py-2">数量</th>
                <th className="py-2">箱数</th>
              </tr>
            </thead>
            <tbody>
              {data.lines.map((l) => (
                <tr key={l.id} className="border-b border-outline-variant/10">
                  <td className="py-2">{l.sku}</td>
                  <td className="py-2">{l.productName}</td>
                  <td className="py-2">{l.ean ?? '—'}</td>
                  <td className="py-2">{l.quantity}</td>
                  <td className="py-2">{l.cartons ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-on-surface">关键步骤清单</h3>
        {tasksByStage.map(({ stage, tasks }) =>
          tasks.length === 0 ? null : (
            <div key={stage} className={card + ' p-4'}>
              <h4 className="font-medium text-secondary">{TRADE_TASK_STAGE_LABELS[stage]}</h4>
              <ul className="mt-3 space-y-2">
                {tasks.map((t) => (
                  <li key={t.id} className={clsx(cardFlat, 'flex items-start gap-3 p-3')}>
                    <input
                      type="checkbox"
                      checked={t.status === 'done' || t.status === 'skipped'}
                      onChange={() => toggleTask(t.id, t.status)}
                      className="mt-1 h-4 w-4"
                    />
                    <div className="flex-1">
                      <p className={clsx('text-sm', t.status === 'done' && 'line-through text-on-surface-variant')}>
                        {t.title}
                      </p>
                      {t.description && (
                        <p className="text-xs text-on-surface-variant">{t.description}</p>
                      )}
                    </div>
                    <span className="text-xs text-on-surface-variant">
                      {TASK_STATUS_LABELS[t.status]}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ),
        )}
      </div>

      <div className={card + ' p-4'}>
        <h3 className="font-semibold text-on-surface">单证记录</h3>
        {data.documents.length === 0 ? (
          <p className="mt-2 text-sm text-on-surface-variant">暂无单证记录</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {data.documents.map((d) => (
              <li key={d.id} className={cardFlat + ' p-3 text-sm'}>
                <span className="font-medium">{d.title}</span>
                <span className="ml-2 text-on-surface-variant">({d.docType})</span>
                {d.fileUrl && (
                  <a href={d.fileUrl} className={link + ' ml-2'} target="_blank" rel="noreferrer">查看</a>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
