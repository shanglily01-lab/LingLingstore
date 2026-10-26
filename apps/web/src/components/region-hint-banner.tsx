'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'

export function RegionHintBanner() {
  const { user } = useAuth()
  const [hint, setHint] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    api.getRegionHint().then((r) => setHint(r.ipCountry)).catch(() => {})
  }, [])

  if (!user || !hint || dismissed) return null

  const mismatch =
    (user.region === 'CN' && hint !== 'CN') || (user.region === 'OVERSEAS' && hint === 'CN')

  if (!mismatch) return null

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
      检测到您当前网络位于 {hint}，与账号区域（{user.region === 'CN' ? '国内' : '海外'}）不一致。跨境购物请确认使用正确站点。
      <button
        type="button"
        className="ml-3 underline"
        onClick={() => setDismissed(true)}
      >
        知道了
      </button>
    </div>
  )
}
