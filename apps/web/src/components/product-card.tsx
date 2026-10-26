'use client'

import Link from 'next/link'
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
  const [whole, frac] = listing ? (listing.price / 100).toFixed(2).split('.') : ['', '']

  return (
    <Link href={href} className="group flex h-full flex-col bg-white p-3">
      <div className="flex aspect-square items-center justify-center overflow-hidden bg-white">
        {imgUrl ? (
          <img src={imgUrl} alt={name || ''} className="h-full w-full object-contain" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface-container text-4xl">📦</div>
        )}
      </div>
      <h3 className="mt-2 line-clamp-2 text-sm leading-snug text-on-surface group-hover:text-secondary-container">
        {name}
      </h3>
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
  )
}
