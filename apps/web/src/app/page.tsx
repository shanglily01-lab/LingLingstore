'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, Globe, ShieldCheck, Truck, Headphones, RotateCcw, BadgeCheck } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { ProductCard } from '@/components/product-card'
import type { HealthCheckResponse, ProductData } from '@web3-mall/shared'
import { BRAND_NAME } from '@/lib/brand'

const HERO_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAk_IE-CwPwcT8Fl1wjB9vEsR_Mv9mNUy-JOTmBMw-GtDrrudUpvey9lbwparHPJi3oOBZAkZNRr1OanoFG1dcKSuLGw11aAxFZxOACCqLQp7HwaE7Mi43W7HW0unYoywHgmghsgckWaZJrdy9Y5MbwlmkziTOLWUs1HPqa85Exc6ev58C_pTq-zqyPClvyeBLP8k-1VixSFHhVChhqzqxsaJHboLBoLbBRaQ2wlsPlRrFgwIfhmdSeDcbofg8vAhDiOnCnsT9o6GFy'

const FEATURES = [
  { title: '全球直采', desc: '深入货源地，与全球品牌方及一级代理直接合作，减少中间环节，确保价格优势。', Icon: Globe },
  { title: '官方正品', desc: '每一件商品均经过严格的入仓检验，溯源码全程可追溯，100%正品承诺。', Icon: BadgeCheck },
  { title: '极速物流', desc: '配合多地自营保税仓，下单后极速出库，提供高效跨境物流体验。', Icon: Truck },
  { title: '安全支付', desc: '支持主流法币支付通道，银行级数据加密，保障资金往来安全合规。', Icon: ShieldCheck },
  { title: '24/7客服', desc: '双语专业客服团队，全天候解答商品咨询、物流追踪及售后反馈。', Icon: Headphones },
  { title: '售后无忧', desc: '完善的退换货政策，本地化退货点，解决跨境购物后顾之忧。', Icon: RotateCcw },
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
      .then((res) => setFeaturedProducts(res.items.slice(0, 4)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [region])

  const isOk = health?.status === 'ok'

  return (
    <div className="pb-8">
      {/* Hero — from Stitch home.html */}
      <section className="overflow-hidden bg-white md:relative md:flex md:min-h-[min(82vh,720px)] md:items-center">
        <div className="relative h-56 sm:h-72 md:absolute md:inset-0 md:h-auto">
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-white via-white/20 to-transparent md:bg-gradient-to-r md:from-white md:via-white/50 md:to-transparent" />
          <img src={HERO_IMAGE} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="relative z-20 mx-auto w-full max-w-container-max px-margin-mobile pb-8 md:px-margin-desktop md:pb-0">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight text-on-surface sm:text-4xl md:text-5xl lg:text-[48px] lg:leading-[1.1]">
              {BRAND_NAME}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-on-surface-variant md:mt-6 md:text-lg">
              链接全球精品，重塑跨境消费体验。便捷的法币结算、极速清关与正品保障，让每一笔交易都从容可信。
            </p>
            <div className="mt-6 flex flex-wrap gap-3 md:mt-10 md:gap-4">
              <Link
                href="/products"
                className="inline-flex w-full items-center justify-center gap-2 bg-on-surface px-8 py-3.5 text-sm font-medium text-white transition-opacity hover:opacity-90 editorial-shadow sm:w-auto sm:py-4"
              >
                浏览商品
                <ArrowRight className="h-4 w-4" />
              </Link>
              {!user && (
                <Link
                  href="/register"
                  className="inline-flex w-full items-center justify-center border border-on-surface px-8 py-3.5 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-low sm:w-auto sm:py-4"
                >
                  注册账号
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-container-max px-margin-mobile py-10 md:px-margin-desktop md:py-section-gap">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-12">
          <div>
            <h2 className="text-2xl font-semibold text-on-surface">热门推荐</h2>
            <p className="mt-2 text-on-surface-variant">本月全球最受关注的精品好物</p>
          </div>
          <Link href="/products" className="inline-flex items-center gap-2 text-sm font-medium text-secondary">
            查看全部 <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-surface-container-high border-t-secondary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-gutter lg:grid-cols-4">
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
      </section>

      {/* Features */}
      <section className="bg-surface-container-low py-10 md:py-section-gap">
        <div className="mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop">
          <div className="mb-8 text-center md:mb-16">
            <h2 className="text-2xl font-semibold text-on-surface">为什么选择我们</h2>
            <p className="mt-4 text-on-surface-variant">为您提供全方位的跨境购物保障体系</p>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ title, desc, Icon }) => (
              <div
                key={title}
                className="border border-outline-variant/10 bg-white p-5 transition-colors hover:border-secondary/30 md:p-10"
              >
                <Icon className="mb-6 h-10 w-10 text-secondary" strokeWidth={1.5} />
                <h4 className="mb-4 text-lg font-bold">{title}</h4>
                <p className="leading-relaxed text-on-surface-variant">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-container-max px-margin-mobile py-10 md:px-margin-desktop md:py-section-gap">
        <div className="relative overflow-hidden rounded-lg bg-primary-container p-6 md:p-24">
          <div className="relative z-10 max-w-xl">
            <h2 className="text-3xl font-bold text-white md:text-4xl">开启您的全球精品之旅</h2>
            <p className="mt-6 text-lg text-on-primary-container">
              现在注册即享首单免邮及专属新人礼券，尊享私密会员服务。
            </p>
            <Link
              href={user ? '/products' : '/register'}
              className="mt-10 inline-block bg-white px-10 py-4 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container"
            >
              {user ? '去逛逛' : '立即注册会员'}
            </Link>
          </div>
        </div>
      </section>

      {health && (
        <div className="mx-auto max-w-container-max px-margin-mobile pb-8 text-center text-xs text-on-surface-variant md:px-margin-desktop">
          <span
            className={`mr-2 inline-block h-2 w-2 rounded-full ${isOk ? 'bg-green-500' : 'bg-error'}`}
          />
          服务状态:{' '}
          {isOk
            ? `正常 · DB ${health.checks.db.latencyMs}ms · Redis ${health.checks.redis.latencyMs}ms`
            : '异常'}
        </div>
      )}
    </div>
  )
}
