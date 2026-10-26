'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { clsx } from 'clsx'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import toast from 'react-hot-toast'
import { PageShell } from '@/components/page-shell'
import { LoadingSpinner } from '@/components/loading-spinner'
import { btnPrimary, btnGhost, card, cardFlat, price } from '@/components/ui/stitch'
import type { CartResponse, ShippingAddressData } from '@web3-mall/shared'

const CN_CHANNELS = [
  { id: 'alipay', name: '支付宝', icon: '🔵' },
  { id: 'wechat', name: '微信支付', icon: '🟢' },
]
const OVERSEAS_CHANNELS = [
  { id: 'stripe', name: 'Stripe', icon: '💳' },
  { id: 'paypal', name: 'PayPal', icon: '🔷' },
]

export default function CheckoutPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [cart, setCart] = useState<CartResponse | null>(null)
  const [addresses, setAddresses] = useState<ShippingAddressData[]>([])
  const [shippingAddressId, setShippingAddressId] = useState('')
  const [paymentChannel, setPaymentChannel] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    Promise.all([api.getCart(), api.listAddresses()])
      .then(([cartData, addrList]) => {
        setCart(cartData)
        setAddresses(addrList)
        const def = addrList.find((a) => a.isDefault) ?? addrList[0]
        if (def) setShippingAddressId(def.id)
        const channels = user.region === 'CN' ? CN_CHANNELS : OVERSEAS_CHANNELS
        setPaymentChannel(channels[0]?.id || '')
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user, router])

  const handleSubmit = async () => {
    if (!cart || cart.items.length === 0) {
      toast.error('购物车为空')
      return
    }
    if (!shippingAddressId) {
      toast.error('请选择收货地址')
      return
    }
    if (!paymentChannel) {
      toast.error('请选择支付方式')
      return
    }

    setSubmitting(true)
    try {
      const order = await api.createOrder({
        shippingAddressId,
        paymentChannel,
        items: cart.items.map((item) => ({
          listingId: item.listingId,
          quantity: item.quantity,
        })),
      })
      toast.success('订单创建成功')
      router.push(`/orders/${order.id}/pay`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '下单失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingSpinner />

  const channels = user?.region === 'CN' ? CN_CHANNELS : OVERSEAS_CHANNELS
  const region = user?.region || 'CN'

  return (
    <PageShell className="max-w-3xl">
      <h1 className="text-2xl font-bold text-on-surface">
        {region === 'CN' ? '确认订单' : 'Confirm Order'}
      </h1>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-on-surface">
            {region === 'CN' ? '收货地址' : 'Shipping Address'}
          </h2>
          <Link href="/account/addresses" className={btnGhost + ' text-xs'}>
            管理地址
          </Link>
        </div>
        {addresses.length === 0 ? (
          <p className="mt-3 text-sm text-on-surface-variant">
            暂无收货地址，请先{' '}
            <Link href="/account/addresses" className="text-secondary underline">
              添加地址
            </Link>
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {addresses.map((addr) => (
              <button
                key={addr.id}
                type="button"
                onClick={() => setShippingAddressId(addr.id)}
                className={clsx(
                  'w-full border p-4 text-left text-sm transition-all',
                  shippingAddressId === addr.id
                    ? 'border-secondary bg-surface-container-low ring-2 ring-secondary/30'
                    : 'border-outline-variant/20 hover:border-outline-variant/40',
                )}
              >
                <p className="font-medium text-on-surface">
                  {addr.recipientName} {addr.phone}
                </p>
                <p className="mt-1 text-on-surface-variant">
                  {[addr.stateProvince, addr.city, addr.district, addr.streetAddress]
                    .filter(Boolean)
                    .join(' ')}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {cart && cart.items.length > 0 && (
        <div className="mt-8 space-y-3">
          <h2 className="font-medium text-on-surface">
            {region === 'CN' ? '商品清单' : 'Order Items'}
          </h2>
          {cart.items.map((item) => (
            <div key={item.listingId} className={`${cardFlat} flex items-center gap-4 p-4`}>
              <div className="flex h-12 w-12 items-center justify-center bg-surface-container-low text-xl">
                📦
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-on-surface">
                  {region === 'CN' ? item.nameCn : item.nameEn}
                </p>
                <p className="text-xs text-on-surface-variant">
                  {item.sku} × {item.quantity}
                </p>
              </div>
              <p className="font-medium text-on-surface">
                {item.currency === 'CNY' ? '¥' : '$'}
                {((item.price * item.quantity) / 100).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8">
        <h2 className="font-medium text-on-surface">
          {region === 'CN' ? '支付方式' : 'Payment Method'}
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {channels.map((ch) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => setPaymentChannel(ch.id)}
              className={clsx(
                'flex items-center gap-3 border p-4 text-left transition-all',
                paymentChannel === ch.id
                  ? 'border-secondary bg-surface-container-low ring-2 ring-secondary/30'
                  : 'border-outline-variant/20 bg-white hover:border-outline-variant/40',
              )}
            >
              <span className="text-2xl">{ch.icon}</span>
              <span className="font-medium text-on-surface">{ch.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={`${card} mt-8 p-6`}>
        {cart && (
          <div className="flex justify-between text-lg font-bold">
            <span>{region === 'CN' ? '合计' : 'Total'}</span>
            <span className={price}>
              {cart.currency === 'CNY' ? '¥' : '$'}
              {((cart.totalAmount + (region === 'CN' ? 800 : 2500)) / 100).toFixed(2)}
            </span>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting || !cart || cart.items.length === 0 || !shippingAddressId}
        className={btnPrimary + ' mt-8 w-full py-3'}
      >
        {submitting ? '提交中...' : '提交订单'}
      </button>
    </PageShell>
  )
}
