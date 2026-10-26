'use client'

import { useState } from 'react'
import { clsx } from 'clsx'
import { getProductImageUrls } from '@/lib/product-image'

type ProductGalleryProps = {
  images: unknown
  alt: string
}

export function ProductGallery({ images, alt }: ProductGalleryProps) {
  const urls = getProductImageUrls(images)
  const [active, setActive] = useState(0)

  if (urls.length === 0) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center bg-surface-container-low editorial-shadow">
        <span className="text-8xl">📦</span>
      </div>
    )
  }

  const main = urls[active] ?? urls[0]

  return (
    <div className="space-y-4">
      <div className="aspect-[4/5] overflow-hidden bg-surface-container-low editorial-shadow">
        <img src={main} alt={alt} className="h-full w-full object-cover" />
      </div>
      <div className="grid grid-cols-4 gap-3">
        {urls.map((url, i) => (
          <button
            key={`${url}-${i}`}
            type="button"
            onClick={() => setActive(i)}
            className={clsx(
              'aspect-square overflow-hidden border-2 bg-surface-container-low transition-colors',
              active === i ? 'border-secondary' : 'border-transparent opacity-80 hover:opacity-100',
            )}
          >
            <img src={url} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}
