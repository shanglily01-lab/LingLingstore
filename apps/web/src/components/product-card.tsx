'use client'

import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import type { ProductData, ProductListingData } from '@web3-mall/shared'
import { getProductImageUrl } from '@/lib/product-image'

type ProductCardProps = {
  product: ProductData
  region: string
  href: string
}

export function ProductCard({ product, region, href }: ProductCardProps) {
  const listing: ProductListingData | undefined = product.listings?.[0]
  const imgUrl = getProductImageUrl(product.images)
  const name = region === 'CN' ? product.nameCn : product.nameEn
  const symbol = listing?.currency === 'CNY' ? '¥' : '$'
  const price = listing ? `${symbol} ${(listing.price / 100).toLocaleString()}` : null

  return (
    <Link
      href={href}
      className="group overflow-hidden border border-outline-variant/20 bg-white transition-all duration-300 hover:editorial-shadow"
    >
      <div className="aspect-[4/5] overflow-hidden bg-surface-container-low">
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={name || ''}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface-container text-4xl">
            📦
          </div>
        )}
      </div>
      <div className="p-3 md:p-6">
        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
          {product.spuNo}
        </span>
        <h3 className="mt-2 line-clamp-2 text-base font-semibold text-on-surface">{name}</h3>
        <div className="mt-4 flex items-center justify-between">
          {price ? (
            <span className="text-base font-bold text-error md:text-xl">{price}</span>
          ) : (
            <span className="text-sm text-on-surface-variant">—</span>
          )}
          <span className="inline-flex p-2 bg-surface-container text-on-surface-variant transition-colors group-hover:bg-secondary-container group-hover:text-white">
            <ShoppingCart className="h-5 w-5" />
          </span>
        </div>
      </div>
    </Link>
  )
}
