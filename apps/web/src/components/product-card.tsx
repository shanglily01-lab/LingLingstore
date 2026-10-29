'use client'

import Link from 'next/link'
import type { ProductData, ProductListingData } from '@web3-mall/shared'
import { getProductImageUrls } from '@/lib/product-image'
import { getProductVideoUrls } from '@/lib/product-video'

type ProductCardProps = {
  product: ProductData
  region: string
  href: string
}

export function ProductCard({ product, region, href }: ProductCardProps) {
  const listing: ProductListingData | undefined = product.listings?.[0]
  const images = getProductImageUrls(product.images)
  const videos = getProductVideoUrls(product.videos)
  const name = region === 'CN' ? product.nameCn : product.nameEn
  const symbol = listing?.currency === 'CNY' ? '¥' : '$'
  const [whole, frac] = listing ? (listing.price / 100).toFixed(2).split('.') : ['', '']
  const imageCols = images.length <= 1 ? 'grid-cols-1' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-3'

  return (
    <article className="flex h-full flex-col bg-white p-3">
      {images.length > 0 ? (
        <div className={`grid gap-1 ${imageCols}`}>
          {images.map((url, index) => (
            <Link key={`${url}-${index}`} href={href} className="aspect-square overflow-hidden bg-white">
              <img src={url} alt={index === 0 ? name || '' : ''} className="h-full w-full object-contain" loading="lazy" />
            </Link>
          ))}
        </div>
      ) : (
        <Link href={href} className="flex aspect-square items-center justify-center bg-surface-container text-4xl">
          📦
        </Link>
      )}
      {videos.length > 0 ? (
        <div className="mt-2 space-y-2">
          {videos.map((url) => (
            <video key={url} src={url} controls playsInline preload="metadata" className="max-h-56 w-full bg-black" />
          ))}
        </div>
      ) : null}
      <Link href={href} className="group mt-2">
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
    </article>
  )
}
