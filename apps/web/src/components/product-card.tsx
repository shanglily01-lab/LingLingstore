'use client'

import { useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import type { ProductData, ProductListingData } from '@web3-mall/shared'
import { ProductGallery } from '@/components/product-gallery'
import { btnPrimary } from '@/components/ui/stitch'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

type ProductCardProps = {
  product: ProductData
  region: string
  href: string
}

export function ProductCard({ product, region, href }: ProductCardProps) {
  const { user } = useAuth()
  const [adding, setAdding] = useState(false)
  const listing: ProductListingData | undefined = product.listings?.[0]
  const name = region === 'CN' ? product.nameCn : product.nameEn
  const symbol = listing?.currency === 'CNY' ? '¥' : '$'
  const [whole, frac] = listing ? (listing.price / 100).toFixed(2).split('.') : ['', '']

  const addToCart = async () => {
    if (!user) {
      toast.error('请先登录')
      return
    }
    if (!listing) {
      toast.error('商品暂不可购买')
      return
    }
    setAdding(true)
    try {
      await api.addToCart(listing.id, 1)
      toast.success('已加入购物车')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '添加失败')
    } finally {
      setAdding(false)
    }
  }

  return (
    <article className="flex h-full flex-col bg-white p-3">
      <ProductGallery images={product.images} videos={product.videos} alt={name || ''} href={href} thumbs="below" />
      <div className="mt-3 flex items-end justify-between gap-3">
        <Link href={href} className="group min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm leading-snug text-on-surface group-hover:text-secondary-container">{name}</h3>
          {listing ? (
            <p className="mt-1 text-error">
              <span className="align-top text-xs">{symbol}</span>
              <span className="text-xl leading-none">{Number(whole).toLocaleString()}</span>
              <span className="align-top text-xs">.{frac}</span>
            </p>
          ) : (
            <p className="mt-1 text-sm text-on-surface-variant">暂无报价</p>
          )}
        </Link>
        <button
          type="button"
          onClick={addToCart}
          disabled={adding || !listing}
          className={btnPrimary + ' shrink-0 px-4 py-2'}
        >
          {adding ? '添加中...' : '加入购物车'}
        </button>
      </div>
    </article>
  )
}
