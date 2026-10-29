'use client'

import { getProductImageUrls } from '@/lib/product-image'
import { getProductVideoUrls } from '@/lib/product-video'

type ProductGalleryProps = {
  images: unknown
  videos?: unknown
  alt: string
}

export function ProductGallery({ images, videos, alt }: ProductGalleryProps) {
  const urls = getProductImageUrls(images)
  const videoUrls = getProductVideoUrls(videos)

  if (urls.length === 0 && videoUrls.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center bg-white">
        <span className="text-8xl">📦</span>
      </div>
    )
  }

  const imageCols = urls.length <= 1 ? 'grid-cols-1' : urls.length === 2 ? 'grid-cols-2' : 'grid-cols-3'

  return (
    <div className="space-y-3">
      {urls.length > 0 ? (
        <div className={`grid gap-2 ${imageCols}`}>
          {urls.map((url, index) => (
            <div key={`${url}-${index}`} className="aspect-square overflow-hidden bg-white">
              <img src={url} alt={index === 0 ? alt : ''} className="h-full w-full object-contain" />
            </div>
          ))}
        </div>
      ) : null}
      {videoUrls.map((url) => (
        <video key={url} src={url} controls playsInline preload="metadata" className="max-h-80 w-full bg-black" />
      ))}
    </div>
  )
}
