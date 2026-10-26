'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import toast from 'react-hot-toast'
import { PageShell } from '@/components/page-shell'
import { LoadingSpinner } from '@/components/loading-spinner'
import { btnPrimary, btnGhost, card, input, label } from '@/components/ui/stitch'
import type { ShippingAddressData, ShippingAddressInput } from '@web3-mall/shared'

const emptyForm = (region: string): ShippingAddressInput => ({
  recipientName: '',
  phone: '',
  countryCode: region === 'CN' ? 'CN' : 'US',
  city: '',
  streetAddress: '',
  isDefault: false,
})

export default function AddressesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [list, setList] = useState<ShippingAddressData[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<ShippingAddressInput>(emptyForm('CN'))
  const [saving, setSaving] = useState(false)

  const reload = () => api.listAddresses().then(setList)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    setForm(emptyForm(user.region))
    reload().finally(() => setLoading(false))
  }, [user, router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.createAddress(form)
      toast.success('地址已保存')
      setShowForm(false)
      setForm(emptyForm(user?.region || 'CN'))
      await reload()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除该地址？')) return
    await api.deleteAddress(id)
    toast.success('已删除')
    await reload()
  }

  if (loading) return <LoadingSpinner />

  const isCn = user?.region === 'CN'

  return (
    <PageShell className="max-w-2xl">
      <Link href="/account" className="text-sm text-on-surface-variant hover:text-secondary">
        ← 个人中心
      </Link>
      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-on-surface">收货地址</h1>
        <button type="button" onClick={() => setShowForm(!showForm)} className={btnGhost}>
          {showForm ? '取消' : '新增地址'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className={`${card} mt-6 space-y-4 p-6`}>
          <div>
            <label className={label}>收件人</label>
            <input
              className={input}
              required
              value={form.recipientName}
              onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
            />
          </div>
          <div>
            <label className={label}>电话</label>
            <input
              className={input}
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          {!isCn && (
            <div>
              <label className={label}>国家代码</label>
              <input
                className={input}
                value={form.countryCode}
                onChange={(e) => setForm({ ...form, countryCode: e.target.value.toUpperCase() })}
              />
            </div>
          )}
          <div>
            <label className={label}>{isCn ? '省/市' : 'State'}</label>
            <input
              className={input}
              value={form.stateProvince ?? ''}
              onChange={(e) => setForm({ ...form, stateProvince: e.target.value })}
            />
          </div>
          <div>
            <label className={label}>城市</label>
            <input
              className={input}
              required
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </div>
          {isCn && (
            <div>
              <label className={label}>区/县</label>
              <input
                className={input}
                value={form.district ?? ''}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
              />
            </div>
          )}
          <div>
            <label className={label}>详细地址</label>
            <input
              className={input}
              required
              value={form.streetAddress}
              onChange={(e) => setForm({ ...form, streetAddress: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
            />
            设为默认地址
          </label>
          <button type="submit" disabled={saving} className={btnPrimary + ' w-full py-2'}>
            {saving ? '保存中...' : '保存'}
          </button>
        </form>
      )}

      <ul className="mt-6 space-y-3">
        {list.map((addr) => (
          <li key={addr.id} className={`${card} p-4`}>
            <div className="flex justify-between gap-2">
              <div>
                <p className="font-medium text-on-surface">
                  {addr.recipientName} {addr.isDefault && (
                    <span className="ml-2 rounded bg-secondary/10 px-2 py-0.5 text-xs text-secondary">
                      默认
                    </span>
                  )}
                </p>
                <p className="mt-1 text-sm text-on-surface-variant">{addr.phone}</p>
                <p className="text-sm text-on-surface-variant">
                  {[addr.stateProvince, addr.city, addr.district, addr.streetAddress]
                    .filter(Boolean)
                    .join(' ')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(addr.id)}
                className="text-xs text-red-600 hover:underline"
              >
                删除
              </button>
            </div>
          </li>
        ))}
        {list.length === 0 && !showForm && (
          <p className="text-center text-sm text-on-surface-variant">暂无地址</p>
        )}
      </ul>
    </PageShell>
  )
}
