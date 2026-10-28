'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import { useSalesMarket } from '@/lib/sales-market'
import { PageShell } from '@/components/page-shell'
import { PageHeader } from '@/components/page-header'
import { ProductCard } from '@/components/product-card'
import { LoadingSpinner } from '@/components/loading-spinner'
import { btnGhost } from '@/components/ui/stitch'
import type { ProductData } from '@web3-mall/shared'

function SearchResults() {
  const searchParams = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const { market } = useSalesMarket()
  const region = market
  const [products, setProducts] = useState<ProductData[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setPage(1)
  }, [q])

  useEffect(() => {
    if (!q.trim()) {
      setProducts([])
      setLoading(false)
      return
    }
    setLoading(true)
    api
      .getProducts(region, page, undefined, q.trim())
      .then((res) => {
        setProducts((prev) => (page === 1 ? res.items : [...prev, ...res.items]))
        setTotal(res.total)
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [q, region, page])

  if (loading && page === 1) return <LoadingSpinner />

  return (
    <>
      <PageHeader title={region === 'CN' ? `搜索：${q || '—'}` : `Search: ${q || '—'}`} />
      {products.length === 0 ? (
        <p className="py-16 text-center text-on-surface-variant">未找到相关商品</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 rounded-sm bg-white p-3 md:grid-cols-4 md:p-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} region={region} href={`/products/${p.id}`} />
            ))}
          </div>
          {products.length < total && (
            <div className="mt-10 text-center">
              <button
                type="button"
                className={btnGhost}
                onClick={() => setPage((p) => p + 1)}
                disabled={loading}
              >
                加载更多
              </button>
            </div>
          )}
        </>
      )}
    </>
  )
}

export default function SearchPage() {
  return (
    <PageShell>
      <Suspense fallback={<LoadingSpinner />}>
        <SearchResults />
      </Suspense>
    </PageShell>
  )
}
