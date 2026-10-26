'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import toast from 'react-hot-toast'
import { PageShell } from '@/components/page-shell'
import { ProductGallery } from '@/components/product-gallery'
import { LoadingSpinner } from '@/components/loading-spinner'
import { btnPrimary, btnSecondary, link, price } from '@/components/ui/stitch'

type ProductDetail = Awaited<ReturnType<typeof api.getProduct>>

export default function ProductDetailPage() {
  const params = useParams()
  const id = params.id as string
  const { user } = useAuth()
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (!id) return
    api
      .getProduct(id)
      .then(setProduct)
      .catch(() => setProduct(null))
      .finally(() => setLoading(false))
  }, [id])

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('请先登录')
      return
    }
    if (!product?.listings?.[0]) {
      toast.error('商品暂不可购买')
      return
    }
    setAdding(true)
    try {
      await api.addToCart(product.listings[0].id, 1)
      toast.success('已加入购物车')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '添加失败')
    } finally {
      setAdding(false)
    }
  }

  if (loading) return <LoadingSpinner />

  if (!product) {
    return (
      <PageShell narrow className="pt-16 text-center">
        <p className="text-on-surface-variant">商品不存在</p>
        <Link href="/products" className={link + ' mt-4 inline-block'}>
          返回商品列表
        </Link>
      </PageShell>
    )
  }

  const region = user?.region || 'CN'
  const listing =
    product.listings?.find((l) => l.region === region) || product.listings?.[0]
  const displayPrice = listing?.price ?? 0
  const currency = listing?.currency ?? (region === 'CN' ? 'CNY' : 'USD')
  const displayName = region === 'CN' ? product.nameCn : product.nameEn

  return (
    <PageShell>
      <Link href="/products" className="text-sm text-on-surface-variant hover:text-secondary">
        ← 返回商品列表
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} alt={displayName || ''} />

        <div>
          <h1 className="text-2xl font-bold text-on-surface md:text-3xl">{displayName}</h1>
          <p className="mt-2 text-sm text-on-surface-variant">SPU: {product.spuNo}</p>

          {listing && (
            <p className={`mt-6 text-3xl ${price}`}>
              {currency === 'CNY' ? '¥' : '$'}
              {(displayPrice / 100).toFixed(2)}
            </p>
          )}

          <p className="mt-6 leading-relaxed text-on-surface-variant">
            {region === 'CN' ? product.descriptionCn : product.descriptionEn}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4 md:mt-10">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={adding || !listing}
              className={btnPrimary + ' w-full px-8 py-3 sm:w-auto'}
            >
              {adding ? '添加中...' : '加入购物车'}
            </button>
            <Link href="/cart" className={btnSecondary + ' w-full px-8 py-3 sm:w-auto'}>
              查看购物车
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
