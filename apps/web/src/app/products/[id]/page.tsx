'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { useSalesMarket } from '@/lib/sales-market'
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
  const { market } = useSalesMarket()
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    api
      .getProduct(id, market)
      .then(setProduct)
      .catch(() => setProduct(null))
      .finally(() => setLoading(false))
  }, [id, market])

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

  const region = market
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

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-sm bg-white p-3 md:p-4">
          <ProductGallery images={product.images} videos={product.videos} alt={displayName || ''} />
          <h1 className="mt-4 text-xl font-medium text-on-surface md:text-2xl">{displayName}</h1>
          <p className="mt-3 text-sm leading-relaxed text-on-surface">{region === 'CN' ? product.descriptionCn : product.descriptionEn}</p>
        </div>

        <div className="h-fit rounded-sm border border-outline-variant bg-white p-4">
          <p className="text-sm text-on-surface-variant">SPU {product.spuNo}</p>
          {listing && (
            <p className={`mt-2 text-3xl ${price}`}>
              {currency === 'CNY' ? '¥' : '$'}
              {(displayPrice / 100).toFixed(2)}
            </p>
          )}
          <p className="mt-3 text-sm text-on-surface-variant">
            {region === 'CN' ? '大陆销售，人民币结算，支持微信和支付宝。' : '海外销售，美元结算，通过海外账户收款。'}
          </p>
          <p className="mt-2 text-sm text-[#007600]">{listing ? '有货' : '这个销售渠道暂未上架'}</p>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={adding || !listing}
            className={btnPrimary + ' mt-4 w-full py-2'}
          >
            {adding ? '添加中...' : '加入购物车'}
          </button>
          <Link href="/cart" className={btnSecondary + ' mt-2 w-full py-2'}>
            查看购物车
          </Link>
        </div>
      </div>
    </PageShell>
  )
}
