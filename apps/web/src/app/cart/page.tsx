'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import toast from 'react-hot-toast'
import { PageShell } from '@/components/page-shell'
import { EmptyState } from '@/components/empty-state'
import { LoadingSpinner } from '@/components/loading-spinner'
import { btnPrimary, btnDanger, card, cardFlat, price } from '@/components/ui/stitch'
import type { CartResponse } from '@web3-mall/shared'

export default function CartPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [cart, setCart] = useState<CartResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    loadCart()
  }, [user])

  const loadCart = async () => {
    try {
      const data = await api.getCart()
      setCart(data)
    } catch {
      setCart(null)
    } finally {
      setLoading(false)
    }
  }

  const updateQty = async (listingId: string, quantity: number) => {
    if (quantity < 1) return
    const data = await api.updateCartItem(listingId, quantity)
    setCart(data)
  }

  const removeItem = async (listingId: string) => {
    const data = await api.removeCartItem(listingId)
    setCart(data)
    toast.success('已移除')
  }

  const handleCheckout = () => {
    if (!cart || cart.items.length === 0) return
    router.push('/checkout')
  }

  if (!user) {
    return (
      <PageShell narrow className="pt-16">
        <EmptyState message="请先登录以查看购物车" action={{ href: '/login', label: '去登录' }} />
      </PageShell>
    )
  }

  if (loading) return <LoadingSpinner />

  return (
    <PageShell className="max-w-3xl">
      <h1 className="text-2xl font-bold text-on-surface">购物车</h1>

      {!cart || cart.items.length === 0 ? (
        <EmptyState
          className="mt-8"
          message="购物车是空的"
          action={{ href: '/products', label: '去逛逛' }}
        />
      ) : (
        <div className="mt-8 space-y-4">
          {cart.items.map((item) => (
            <div key={item.listingId} className={`${cardFlat} flex flex-wrap items-center gap-4 p-4`}>
              <div className="h-20 w-16 shrink-0 overflow-hidden bg-surface-container-low">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={user.region === 'CN' ? item.nameCn || '' : item.nameEn || ''}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl">📦</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-on-surface">
                  {user.region === 'CN' ? item.nameCn : item.nameEn}
                </p>
                <p className="text-xs text-on-surface-variant">SKU: {item.sku}</p>
                <p className={`mt-1 ${price}`}>
                  {item.currency === 'CNY' ? '¥' : '$'}
                  {(item.price / 100).toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateQty(item.listingId, item.quantity - 1)}
                  className="rounded border border-outline-variant/30 px-3 py-1 text-sm hover:bg-surface-container-low"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => updateQty(item.listingId, item.quantity + 1)}
                  className="rounded border border-outline-variant/30 px-3 py-1 text-sm hover:bg-surface-container-low"
                >
                  +
                </button>
              </div>
              <button type="button" onClick={() => removeItem(item.listingId)} className={btnDanger}>
                删除
              </button>
            </div>
          ))}

          <div className={`${card} p-6`}>
            <div className="flex items-center justify-between">
              <span className="text-on-surface-variant">合计</span>
              <span className={`text-2xl ${price}`}>
                {cart.currency === 'CNY' ? '¥' : '$'}
                {(cart.totalAmount / 100).toFixed(2)}
              </span>
            </div>
            <button type="button" onClick={handleCheckout} className={btnPrimary + ' mt-6 w-full py-3'}>
              去结算
            </button>
          </div>
        </div>
      )}
    </PageShell>
  )
}
