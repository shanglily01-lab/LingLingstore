'use client'

import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { TradeWarehouseSkuData, TradePlatform } from '@web3-mall/shared'
import { TRADE_PLATFORM_LABELS } from '@web3-mall/shared'
import { AdminPageHeader } from '@/components/admin-page-header'
import { LoadingSpinner } from '@/components/loading-spinner'
import toast from 'react-hot-toast'
import {
  btnPrimary,
  btnSecondary,
  card,
  input,
  tableHead,
  tableRow,
} from '@/components/ui/stitch'

export default function InventoryPage() {
  const [items, setItems] = useState<TradeWarehouseSkuData[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [sku, setSku] = useState('')
  const [productName, setProductName] = useState('')
  const [ean, setEan] = useState('')
  const [qty, setQty] = useState('0')

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      setItems(await api.admin.foreignTrade.inventory.list())
    } catch {
      toast.error('加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const handleSave = async () => {
    if (!sku.trim() || !productName.trim()) {
      toast.error('请填写 SKU 和品名')
      return
    }
    try {
      await api.admin.foreignTrade.inventory.upsert({
        sku: sku.trim(),
        productName: productName.trim(),
        ean: ean || undefined,
        quantityOnHand: Number(qty) || 0,
        warehouseName: 'São Paulo 3PL',
      })
      toast.success('已保存')
      setShowForm(false)
      reload()
    } catch {
      toast.error('保存失败')
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="海外仓库存"
        subtitle="圣保罗 3PL 可售库存 · 亚马逊/美客多共用"
        action={
          <button type="button" className={btnPrimary} onClick={() => setShowForm(true)}>
            + 添加 SKU
          </button>
        }
      />

      {loading ? (
        <LoadingSpinner className="py-12" />
      ) : items.length === 0 ? (
        <div className={card + ' p-8 text-center text-on-surface-variant'}>
          <p>暂无库存。批次入库后可点击「同步库存到海外仓」，或手动添加 SKU。</p>
        </div>
      ) : (
        <div className={card + ' overflow-x-auto'}>
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className={tableHead}>
              <tr>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">品名</th>
                <th className="px-4 py-3">EAN</th>
                <th className="px-4 py-3">在库</th>
                <th className="px-4 py-3">预留</th>
                <th className="px-4 py-3">可售</th>
                <th className="px-4 py-3">平台 listing</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id} className={tableRow}>
                  <td className="px-4 py-3 font-medium">{s.sku}</td>
                  <td className="px-4 py-3">{s.productName}</td>
                  <td className="px-4 py-3">{s.ean ?? '—'}</td>
                  <td className="px-4 py-3">{s.quantityOnHand}</td>
                  <td className="px-4 py-3">{s.quantityReserved}</td>
                  <td className="px-4 py-3 font-medium text-secondary">{s.quantityAvailable}</td>
                  <td className="px-4 py-3">
                    {s.platformListings.length === 0
                      ? '—'
                      : s.platformListings.map((l) => (
                          <span key={l.id} className="mr-2 inline-block text-xs">
                            {TRADE_PLATFORM_LABELS[l.platform as TradePlatform]}
                            {l.isActive ? '' : ' (停)'}
                          </span>
                        ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className={card + ' w-full max-w-md p-6'}>
            <h3 className="text-lg font-semibold">添加/更新 SKU</h3>
            <div className="mt-4 space-y-3">
              <input className={input + ' w-full'} placeholder="SKU *" value={sku} onChange={(e) => setSku(e.target.value)} />
              <input className={input + ' w-full'} placeholder="品名 *" value={productName} onChange={(e) => setProductName(e.target.value)} />
              <input className={input + ' w-full'} placeholder="EAN 条码" value={ean} onChange={(e) => setEan(e.target.value)} />
              <input className={input + ' w-full'} type="number" placeholder="在库数量" value={qty} onChange={(e) => setQty(e.target.value)} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className={btnSecondary} onClick={() => setShowForm(false)}>取消</button>
              <button type="button" className={btnPrimary} onClick={handleSave}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
