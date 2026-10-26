'use client'

import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { TradePartnerData, TradePartnerType } from '@web3-mall/shared'
import { TRADE_PARTNER_TYPE_LABELS } from '@web3-mall/shared'
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

const EMPTY_FORM = {
  name: '',
  type: 'freight_forwarder' as TradePartnerType,
  contactName: '',
  phone: '',
  email: '',
  wechat: '',
  address: '',
  notes: '',
}

export default function PartnersPage() {
  const [items, setItems] = useState<TradePartnerData[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      setItems(await api.admin.foreignTrade.partners.list())
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
    if (!form.name.trim()) {
      toast.error('请输入名称')
      return
    }
    setSaving(true)
    try {
      await api.admin.foreignTrade.partners.create(form)
      toast.success('已添加')
      setShowForm(false)
      setForm(EMPTY_FORM)
      reload()
    } catch {
      toast.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="服务商"
        subtitle="货代、清关行、海外仓等合作伙伴"
        action={
          <button type="button" className={btnPrimary} onClick={() => setShowForm(true)}>
            + 添加服务商
          </button>
        }
      />

      {loading ? (
        <LoadingSpinner className="py-12" />
      ) : (
        <div className={card + ' overflow-x-auto'}>
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className={tableHead}>
              <tr>
                <th className="px-4 py-3">名称</th>
                <th className="px-4 py-3">类型</th>
                <th className="px-4 py-3">联系人</th>
                <th className="px-4 py-3">电话</th>
                <th className="px-4 py-3">微信</th>
                <th className="px-4 py-3">状态</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className={tableRow}>
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3">{TRADE_PARTNER_TYPE_LABELS[p.type]}</td>
                  <td className="px-4 py-3">{p.contactName ?? '—'}</td>
                  <td className="px-4 py-3">{p.phone ?? '—'}</td>
                  <td className="px-4 py-3">{p.wechat ?? '—'}</td>
                  <td className="px-4 py-3">{p.isActive ? '启用' : '停用'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className={card + ' w-full max-w-lg p-6'}>
            <h3 className="text-lg font-semibold">添加服务商</h3>
            <div className="mt-4 space-y-3">
              <input className={input + ' w-full'} placeholder="公司名称 *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <select className={select + ' w-full'} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as TradePartnerType })}>
                {Object.entries(TRADE_PARTNER_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <input className={input + ' w-full'} placeholder="联系人" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
              <input className={input + ' w-full'} placeholder="电话" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <input className={input + ' w-full'} placeholder="微信" value={form.wechat} onChange={(e) => setForm({ ...form, wechat: e.target.value })} />
              <input className={input + ' w-full'} placeholder="邮箱" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className={btnSecondary} onClick={() => setShowForm(false)}>取消</button>
              <button type="button" className={btnPrimary} disabled={saving} onClick={handleSave}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
