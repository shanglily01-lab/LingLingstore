'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useSalesMarket } from '@/lib/sales-market'
import { ProductCard } from '@/components/product-card'
import { PageShell } from '@/components/page-shell'
import { PageHeader } from '@/components/page-header'
import { LoadingSpinner } from '@/components/loading-spinner'
import { btnGhost } from '@/components/ui/stitch'
import type { ProductData, ProductCategoryData } from '@web3-mall/shared'

const CATEGORY_ICONS: Record<string, string> = {
  '手机通讯': '📱', '电脑办公': '💻', '平板电脑': '📟', '耳机音响': '🎧',
  '智能穿戴': '⌚', '摄影摄像': '📷', '服饰鞋包': '👔', '家居生活': '🏠',
  '厨卫家电': '🍳', '美妆护肤': '💄', '食品饮料': '🍜', '运动户外': '🏃',
}

export default function ProductsPage() {
  const { market } = useSalesMarket()
  const [products, setProducts] = useState<ProductData[]>([])
  const [categories, setCategories] = useState<ProductCategoryData[]>([])
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const region = market

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    setPage(1)
  }, [region, activeCategory])

  useEffect(() => {
    setLoading(true)
    api
      .getProducts(region, page, activeCategory ?? undefined)
      .then((res) => {
        setProducts((prev) => (page === 1 ? res.items : [...prev, ...res.items]))
        setTotal(res.total)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [region, activeCategory, page])

  return (
    <PageShell>
      <PageHeader
        title={region === 'CN' ? '大陆销售' : '海外销售'}
        subtitle={
          region === 'CN'
            ? '人民币标价，下单后使用微信或支付宝付款。'
            : '美元标价，下单后通过海外账户收款。'
        }
        crumbs={[
          { label: '首页', href: '/' },
          { label: region === 'CN' ? '大陆销售' : '海外销售' },
        ]}
      />

      <div className="-mx-2 mb-10 overflow-x-auto px-2 pb-2">
        <div className="flex gap-2 md:flex-wrap">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className={`shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-colors ${
              activeCategory === null
                ? 'bg-on-surface text-white shadow-sm'
                : 'bg-white text-on-surface-variant ring-1 ring-outline-variant/30 hover:bg-surface-container-low'
            }`}
          >
            {region === 'CN' ? '全部' : 'All'}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                activeCategory === cat.id
                  ? 'bg-on-surface text-white shadow-sm'
                  : 'bg-white text-on-surface-variant ring-1 ring-outline-variant/30 hover:bg-surface-container-low'
              }`}
            >
              <span>{CATEGORY_ICONS[cat.nameCn || ''] || '📦'}</span>
              {region === 'CN' ? cat.nameCn : cat.nameEn}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : products.length === 0 ? (
        <div className="border border-outline-variant/20 bg-white py-24 text-center">
          <p className="text-on-surface-variant">暂无商品</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 rounded-sm bg-white p-3 md:grid-cols-2 md:p-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                region={region}
                href={`/products/${product.id}`}
              />
            ))}
          </div>
          {products.length < total && (
            <div className="mt-10 text-center">
              <button
                type="button"
                className={btnGhost}
                disabled={loading}
                onClick={() => setPage((p) => p + 1)}
              >
                加载更多
              </button>
            </div>
          )}
        </>
      )}
    </PageShell>
  )
}
