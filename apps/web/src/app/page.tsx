'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { BadgeCheck, Globe, Headphones, RotateCcw, ShieldCheck, Truck } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { ProductCard } from '@/components/product-card'
import type { HealthCheckResponse, ProductData } from '@web3-mall/shared'
import { BRAND_NAME } from '@/lib/brand'

const FEATURES = [
  { title: '全球直采', Icon: Globe },
  { title: '官方正品', Icon: BadgeCheck },
  { title: '极速物流', Icon: Truck },
  { title: '安全支付', Icon: ShieldCheck },
  { title: '全天客服', Icon: Headphones },
  { title: '售后无忧', Icon: RotateCcw },
]

export default function HomePage() {
  const { user } = useAuth()
  const [health, setHealth] = useState<HealthCheckResponse | null>(null)
  const [featuredProducts, setFeaturedProducts] = useState<ProductData[]>([])
  const [loading, setLoading] = useState(true)

  const region = user?.region || 'CN'

  useEffect(() => {
    api.health().then(setHealth).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    api
      .getProducts(region, 1)
      .then((res) => setFeaturedProducts(res.items.slice(0, 8)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [region])

  const isOk = health?.status === 'ok'

  return (
    <div className="pb-4">
      <section className="mx-auto max-w-container-max px-3 pt-3 md:px-4 md:pt-4">
        <div className="overflow-hidden rounded-sm bg-gradient-to-br from-[#232f3e] via-[#37475a] to-[#c45500] px-5 py-8 text-white md:px-10 md:py-12">
          <p className="text-sm text-[#febd69]">跨境精选</p>
          <h1 className="mt-1 text-2xl font-bold md:text-4xl">{BRAND_NAME}</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/90 md:text-base">
            链接全球精品。法币结算、极速清关、正品保障，把跨境购物变成一次普通下单。
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-full border border-[#fcd200] bg-cart px-6 py-2 text-sm font-medium text-on-surface hover:bg-[#f7ca00]"
            >
              浏览全部商品
            </Link>
            {!user && (
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-full border border-white/40 px-6 py-2 text-sm font-medium text-white hover:bg-white/10"
              >
                注册账号
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-container-max px-3 py-3 md:px-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {FEATURES.map(({ title, Icon }) => (
            <div key={title} className="flex items-center gap-2 rounded-sm bg-white px-3 py-3">
              <Icon className="h-5 w-5 shrink-0 text-accent" strokeWidth={1.75} />
              <span className="text-sm font-medium text-on-surface">{title}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-container-max px-3 md:px-4">
        <div className="rounded-sm bg-white p-3 md:p-4">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-bold text-on-surface">热门推荐</h2>
            <Link href="/products" className="text-sm text-secondary hover:text-secondary-container hover:underline">
              查看全部
            </Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-container-high border-t-accent" />
            </div>
          ) : featuredProducts.length === 0 ? (
            <p className="py-10 text-center text-sm text-on-surface-variant">暂时没有商品</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  region={region}
                  href={`/products/${product.id}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {health && (
        <p className="mx-auto mt-4 max-w-container-max px-4 text-center text-xs text-on-surface-variant">
          <span className={`mr-2 inline-block h-2 w-2 rounded-full ${isOk ? 'bg-green-600' : 'bg-error'}`} />
          服务状态: {isOk ? '正常' : '异常'}
        </p>
      )}
    </div>
  )
}
