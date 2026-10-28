'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { BadgeCheck, ClipboardList, Globe, Headphones, RotateCcw, ShieldCheck, ShoppingBag, Truck } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { useSalesMarket } from '@/lib/sales-market'
import { ProductCard } from '@/components/product-card'
import type { ProductData } from '@web3-mall/shared'
import { BRAND_NAME } from '@/lib/brand'

const FEATURES = [
  {
    title: '全球直采',
    desc: '对接货源地品牌与一级代理，少一层转手，把选品直接放到货架上。',
    Icon: Globe,
  },
  {
    title: '正品入仓',
    desc: '到仓核对后再上架。商品详情可查看多张图片，方便确认外观与规格。',
    Icon: BadgeCheck,
  },
  {
    title: '分区配送',
    desc: '国内与海外订单分开履约。下单后可在订单页查看待发货和已发货状态。',
    Icon: Truck,
  },
  {
    title: '按站点结算',
    desc: '大陆销售以人民币计价，使用微信或支付宝。海外销售以美元计价，通过海外账户收款。',
    Icon: ShieldCheck,
  },
  {
    title: '订单可查',
    desc: '登录后查看待支付、待发货、待收货和已完成订单，不用单独追问进度。',
    Icon: Headphones,
  },
  {
    title: '签收后售后',
    desc: '收到货后按对应订单联系售后，处理退换与使用问题。',
    Icon: RotateCcw,
  },
]

const STEPS = [
  { title: '挑选商品', desc: '按分类浏览，或在顶部搜索具体名称。', Icon: ShoppingBag },
  { title: '加入购物车', desc: '确认规格和数量，国内、海外价格分开计算。', Icon: ClipboardList },
  { title: '填写地址下单', desc: '选择收货地址和当前站点可用的支付方式。', Icon: Truck },
  { title: '在订单里付款', desc: '订单生成后进入支付页，完成后可回来查看发货。', Icon: ShieldCheck },
]

export default function HomePage() {
  const { user } = useAuth()
  const { market } = useSalesMarket()
  const [featuredProducts, setFeaturedProducts] = useState<ProductData[]>([])
  const [loading, setLoading] = useState(true)

  const region = market
  const isCn = region === 'CN'

  useEffect(() => {
    setLoading(true)
    api
      .getProducts(region, 1)
      .then((res) => setFeaturedProducts(res.items.slice(0, 8)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [region])

  return (
    <div className="pb-4">
      <section className="mx-auto max-w-container-max px-3 pt-3 md:px-4 md:pt-4">
        <div className="overflow-hidden rounded-sm bg-gradient-to-br from-[#232f3e] via-[#37475a] to-[#c45500] px-5 py-8 text-white md:px-10 md:py-12">
          <p className="text-sm text-[#febd69]">
            {isCn ? '大陆销售 · 人民币 · 微信 / 支付宝' : '海外销售 · 美元 · 海外账户'}
          </p>
          <h1 className="mt-1 text-2xl font-bold md:text-4xl">{BRAND_NAME}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/90 md:text-base">
            {isCn
              ? '跨境精选商城。大陆销售的商品以人民币标价，结账使用微信或支付宝。'
              : '跨境精选商城。海外销售的商品以美元标价，结账通过海外账户收款。'}
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ title, desc, Icon }) => (
            <div key={title} className="rounded-sm bg-white p-4">
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 shrink-0 text-accent" strokeWidth={1.75} />
                <h2 className="text-sm font-bold text-on-surface">{title}</h2>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-container-max px-3 md:px-4">
        <div className="rounded-sm bg-white p-3 md:p-4">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-on-surface">热门推荐</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                {isCn ? '大陆销售中的商品，价格为人民币。' : '海外销售中的商品，价格为美元。'}
              </p>
            </div>
            <Link href="/products" className="shrink-0 text-sm text-secondary hover:text-secondary-container hover:underline">
              查看全部
            </Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-container-high border-t-accent" />
            </div>
          ) : featuredProducts.length === 0 ? (
            <p className="py-10 text-center text-sm text-on-surface-variant">这个站点暂时没有在售商品</p>
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

      <section className="mx-auto max-w-container-max px-3 py-3 md:px-4">
        <div className="rounded-sm bg-white p-4">
          <h2 className="text-lg font-bold text-on-surface">如何购买</h2>
          <p className="mt-1 text-sm text-on-surface-variant">从选品到付款，四步完成一笔跨境订单。</p>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ title, desc, Icon }, index) => (
              <li key={title} className="rounded-sm bg-surface p-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#232f3e] text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <Icon className="h-4 w-4 text-accent" strokeWidth={1.75} />
                  <h3 className="text-sm font-bold text-on-surface">{title}</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  )
}
