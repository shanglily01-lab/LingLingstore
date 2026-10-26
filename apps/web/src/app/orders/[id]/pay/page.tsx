'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import toast from 'react-hot-toast'
import { PageShell } from '@/components/page-shell'
import { LoadingSpinner } from '@/components/loading-spinner'
import { btnPrimary, btnGhost, card, price } from '@/components/ui/stitch'
import type { OrderData, PaymentSessionData } from '@web3-mall/shared'

function formatCountdown(expiresAt: string) {
  const ms = new Date(expiresAt).getTime() - Date.now()
  if (ms <= 0) return '已过期'
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function OrderPayPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const orderId = params.id as string
  const [order, setOrder] = useState<OrderData | null>(null)
  const [session, setSession] = useState<PaymentSessionData | null>(null)
  const [countdown, setCountdown] = useState('')
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)

  const loadOrder = useCallback(async () => {
    const o = await api.getOrder(orderId)
    setOrder(o)
    return o
  }, [orderId])

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    loadOrder()
      .then(async (o) => {
        if (!o) return
        if (o.status !== 'pending') {
          router.replace(`/orders/${orderId}`)
          return
        }
        if (o.paymentChannel) {
          const s = await api.createPaymentSession(orderId, o.paymentChannel)
          setSession(s)
        }
      })
      .catch(() => toast.error('加载失败'))
      .finally(() => setLoading(false))
  }, [user, orderId, router, loadOrder])

  useEffect(() => {
    if (!order?.expiresAt) return
    const tick = () => setCountdown(formatCountdown(order.expiresAt))
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [order?.expiresAt])

  const startSession = async () => {
    if (!order?.paymentChannel) return
    setPaying(true)
    try {
      const s = await api.createPaymentSession(orderId, order.paymentChannel)
      setSession(s)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '创建支付失败')
    } finally {
      setPaying(false)
    }
  }

  const mockPay = async () => {
    setPaying(true)
    try {
      await api.mockCompletePayment(orderId)
      toast.success('支付成功')
      router.push(`/orders/${orderId}`)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '支付失败')
    } finally {
      setPaying(false)
    }
  }

  const pollStatus = async () => {
    const { status } = await api.syncOrderPayment(orderId)
    if (status === 'paid') {
      toast.success('支付成功')
      router.push(`/orders/${orderId}`)
    } else {
      toast.error('尚未支付')
    }
  }

  if (loading) return <LoadingSpinner />
  if (!order) {
    return (
      <PageShell narrow className="text-center">
        <p>订单不存在</p>
      </PageShell>
    )
  }

  const sym = order.currency === 'CNY' ? '¥' : '$'

  return (
    <PageShell className="max-w-lg">
      <Link href={`/orders/${orderId}`} className="text-sm text-on-surface-variant hover:text-secondary">
        ← 返回订单
      </Link>

      <div className={`${card} mt-6 p-6`}>
        <p className="text-sm text-on-surface-variant">订单号</p>
        <p className="font-mono text-sm">{order.orderNo}</p>
        <p className={`mt-4 text-3xl ${price}`}>
          {sym}
          {(order.totalAmount / 100).toFixed(2)}
        </p>
        <p className="mt-2 text-sm text-amber-700">请在 {countdown} 内完成支付</p>
        <p className="mt-1 text-xs text-on-surface-variant">
          支付方式：{order.paymentChannel}
        </p>
      </div>

      {!session ? (
        <button type="button" onClick={startSession} disabled={paying} className={btnPrimary + ' mt-6 w-full py-3'}>
          获取支付信息
        </button>
      ) : (
        <div className={`${card} mt-6 p-6 text-sm`}>
          {session.payload.type === 'mock' && (
            <p className="text-on-surface-variant">
              {(session.payload.data as { message?: string })?.message ?? '演示模式'}
            </p>
          )}
          {session.payload.type === 'qr_code' && (
            <p className="text-on-surface-variant">
              请使用 {order.paymentChannel} 扫码支付（演示环境可点击下方按钮）
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={mockPay}
        disabled={paying || !session}
        className={btnPrimary + ' mt-4 w-full py-3'}
      >
        模拟支付成功（开发）
      </button>
      <button type="button" onClick={pollStatus} className={btnGhost + ' mt-3 w-full py-2 text-sm'}>
        我已支付，刷新状态
      </button>
      <button
        type="button"
        onClick={() => api.cancelOrder(orderId).then(() => router.push('/orders'))}
        className="mt-4 w-full text-center text-sm text-on-surface-variant underline"
      >
        取消订单
      </button>
    </PageShell>
  )
}
